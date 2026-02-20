package manager

import (
	"fmt"
	"net/http"
	"sync"
	"time"
	"week1/chunk"
	"week1/input"
	"week1/merger"
	"week1/paths"
	"week1/probe"
	"week1/progress"
	"week1/worker"
)

func Manager(url string, numChunks int) error {

	start := time.Now()
	defer func() {
		fmt.Println("\nTime taken:", time.Since(start))
	}()

	result, err := probe.Probe(url)
	fmt.Printf("%s ", url)
	if err != nil {
		return fmt.Errorf("Error probing the url : %w", err)
	}
	if !result.RangeSupported {
		numChunks = 1
	}

	chunks := chunk.CreateChunks(result.FileSize, numChunks) // []Chunk
	chunksCopy := make([]chunk.Chunk, len(chunks))
	copy(chunksCopy, chunks)
	fmt.Println("Chunks created:", len(chunks))
	//Added now
	tracker := progress.NewTracker(result.FileSize, len(chunks))

	for i, c := range chunks {
		size := c.End - c.Start + 1
		tracker.SetChunkSize(i, size)
	}

	tracker.Start(start)

	partPaths, err := paths.PathBuild(numChunks, url) // retuns []string,err

	if err != nil {
		return fmt.Errorf("Error getting the paths : %w", err)
	}

	//Calling the workers
	wg := sync.WaitGroup{}
	Ctrl := worker.Controller{
		PauseFlag:    false,
		PauseChannel: nil,
		CancelFlag:   false,
	}

	wg2 := sync.WaitGroup{}
	wg2.Add(1)
	go func() {
		for tracker.TotalDone < tracker.TotalSize {

			//resuming logic
			time.Sleep(time.Second*3)
			fmt.Println("Trying connection")
			req,_:= http.NewRequest("HEAD",url,nil)
			client := &http.Client{
				Timeout: 5*time.Second,
				Transport: &http.Transport{
					DisableKeepAlives: true,
				},
			}
			_,err := client.Do(req)
			if err !=nil{
				fmt.Println("No Internet")
				continue
			}
			fmt.Println("Connection made")
			//

			for i:=0;i<numChunks;i++{
				chunks[i].Start = chunksCopy[i].Start+tracker.ChunkDone[i]
			}
			for i := 0; i < numChunks; i++ {
				if chunks[i].Start>chunks[i].End{
					continue
				}
				wg.Add(1)
				fmt.Println("Starting worker for chunk ",i+1)
				go worker.Worker(url, chunks[i], partPaths[i], tracker, &wg, &Ctrl) //passed st,end,pathToWrite,waitGroup
			}
			wg.Wait() //what if only one worker is interrupted ?
			if Ctrl.CancelFlag{
				break
			}
		}
		wg2.Done()
	}()

	go input.GetTerminalInput(&Ctrl)

	//Waiting for the workers
	wg2.Wait()

	werr := merger.MergeChunks(partPaths, url)
	if werr != nil {
		return err
	}

	Ctrl.CancelFlag = false
	Ctrl.PauseChannel = nil
	Ctrl.PauseFlag = false

	return nil

}
