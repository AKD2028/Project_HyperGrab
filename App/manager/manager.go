package manager

import (
	"App/chunk"
	"App/merger"
	"App/paths"
	"App/probe"
	"App/progress"
	"App/worker"
	"context"
	"fmt"
	"net/http"
	"os"
	"sync"
	"time"
	
	"github.com/wailsapp/wails/v2/pkg/runtime"
)

func Manager(url string, numChunks int, appCtx context.Context, baseDirectory string, ECO bool) error {

	result, err := probe.Probe(url)
	fmt.Printf("%s ", url)
	if err != nil {
		return fmt.Errorf("Error probing the url : %w", err)
	}
	if result.RangeSupported && ECO {
		numChunks, err = probe.GetoptimalChunks(url, result.FileSize)
		if err != nil {
			runtime.EventsEmit(appCtx, "Error", "Could not determine optimal chunks, defaulting to 1")
			runtime.EventsEmit(appCtx, "SetChunks", 1)
		}
		runtime.EventsEmit(appCtx, "UpdateStatus", fmt.Sprintf("Chunks set to %v", numChunks))
		time.Sleep(time.Second)
		runtime.EventsEmit(appCtx, "SetChunks", numChunks)

	} else if !result.RangeSupported{
		runtime.EventsEmit(appCtx, "Error", "RR Unsupported, downloading in one chunk")
		runtime.EventsEmit(appCtx, "SetChunks", 1)
		numChunks = 1
	}

	chunks := chunk.CreateChunks(result.FileSize, numChunks) // []Chunk
	chunksCopy := make([]chunk.Chunk, len(chunks))
	copy(chunksCopy, chunks)
	fmt.Println("Chunks created:", len(chunks))

	partPaths, err := paths.PathBuild(numChunks, url, baseDirectory) // retuns []string,err
	if err != nil {
		return fmt.Errorf("Error getting the paths : %w", err)
	}

	//Calling the workers
	wg := sync.WaitGroup{}
	wg2 := sync.WaitGroup{}
	wgTracker := sync.WaitGroup{}
	Ctrl := worker.Controller{
		PauseFlag:    false,
		PauseChannel: nil,
		CancelFlag:   false,
		Mu:           sync.Mutex{},
	}
	wg2.Add(1)
	wgTracker.Add(1)
	tracker := progress.NewTracker(result.FileSize, len(chunks))
	for i, c := range chunks {
		size := c.End - c.Start + 1
		tracker.SetChunkSize(i, size)
	}
	start := time.Now()
	doneFlag := false
	tracker.Start(&start, appCtx, &doneFlag, &wgTracker)
	var pauseTime time.Time
	var disruptionTime time.Time

	runtime.EventsOn(appCtx, "pause", func(optionalData ...interface{}) {
		if Ctrl.PauseFlag {
			return
		}
		pauseTime = time.Now()
		Ctrl.PauseChannel = make(chan struct{})
		Ctrl.PauseFlag = true
	})

	runtime.EventsOn(appCtx, "resume", func(optionalData ...interface{}) {
		if !Ctrl.PauseFlag {
			return
		}
		Ctrl.PauseFlag = false
		close(Ctrl.PauseChannel)
		Ctrl.PauseChannel = nil
	})

	runtime.EventsOn(appCtx, "cancel", func(optionalData ...interface{}) {
		Ctrl.CancelFlag = true
		if Ctrl.PauseFlag {
			Ctrl.PauseFlag = false
			close(Ctrl.PauseChannel)
			Ctrl.PauseChannel = nil
		}
	})

	go func() {
		for tracker.TotalDone < tracker.TotalSize {

			if Ctrl.PauseFlag {
				runtime.EventsEmit(appCtx, "UpdateStatus", "paused")
				<-Ctrl.PauseChannel
			}
			if Ctrl.CancelFlag {
				runtime.EventsEmit(appCtx, "UpdateStatus", "cancelled")
				break
			}

			//resuming logic
			time.Sleep(time.Second)
			runtime.EventsEmit(appCtx, "UpdateStatus", "Trying Connection")
			time.Sleep(time.Second)
			req, _ := http.NewRequest("HEAD", url, nil)
			client := &http.Client{
				Timeout: 5 * time.Second,
				Transport: &http.Transport{
					DisableKeepAlives: true,
				},
			}
			_, err := client.Do(req)
			if err != nil {
				runtime.EventsEmit(appCtx, "UpdateStatus", "Connection Problem Encountered")
				continue
			}
			runtime.EventsEmit(appCtx, "UpdateStatus", "Connection Made")
			time.Sleep(time.Second)
			runtime.EventsEmit(appCtx, "UpdateStatus", "downloading")

			//time management for speed and remaining time
			if !pauseTime.IsZero() && !disruptionTime.IsZero() {
				pauseDur := time.Since(pauseTime)
				disruptDur := time.Since(disruptionTime)
				if pauseDur >= disruptDur {
					start = start.Add(pauseDur)
				} else {
					start = start.Add(disruptDur)
				}
			} else if !pauseTime.IsZero() {
				start = start.Add(time.Since(pauseTime))
			} else if !disruptionTime.IsZero() {
				start = start.Add(time.Since(disruptionTime))
			} else {
				start=start.Add(time.Second*3)
			}
			pauseTime = time.Time{}
			disruptionTime = time.Time{}

			for i := 0; i < numChunks; i++ {
				chunks[i].Start = chunksCopy[i].Start + tracker.ChunkDone[i]
			}
			for i := 0; i < numChunks; i++ {
				if chunks[i].Start > chunks[i].End {
					continue
				}
				wg.Add(1)
				go worker.Worker(url, chunks[i], partPaths[i], tracker, &wg, &Ctrl, appCtx) //passed st,end,pathToWrite,waitGroup
			}
			wg.Wait()
			if Ctrl.CancelFlag {
				runtime.EventsEmit(appCtx, "UpdateStatus", "cancelled")
				break
			}
			if Ctrl.PauseFlag {
				continue
			}
			if tracker.TotalDone < tracker.TotalSize {
				start = start.Add(time.Second * 2)
				disruptionTime = time.Now()
				runtime.EventsEmit(appCtx, "UpdateStatus", "Internet Connection Disrupted")
			}
		}
		wg2.Done()
	}()

	//Waiting for the workers
	wg2.Wait()
	doneFlag = true
	wgTracker.Wait()

	if tracker.TotalDone == tracker.TotalSize {
		werr := merger.MergeChunks(partPaths, url, baseDirectory)
		if werr != nil {
			return err
		}
		runtime.EventsEmit(appCtx, "UpdateStatus", "completed")
	} else {
		for _, path := range partPaths {
			os.Remove(path)
		}
	}

	Ctrl.CancelFlag = false
	Ctrl.PauseChannel = nil
	Ctrl.PauseFlag = false

	return nil

}
