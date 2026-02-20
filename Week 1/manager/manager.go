package manager

import (
	"fmt"
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
	fmt.Println("Chunks created:", len(chunks))
	//Added now
	tracker := progress.NewTracker(result.FileSize, len(chunks))

	for i, c := range chunks {
		size := c.End - c.Start + 1
		tracker.SetChunkSize(i, size)
	}

	tracker.Start(start)

	//

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
	for i := 0; i < numChunks; i++ {
		wg.Add(1)
		go worker.Worker(url, chunks[i], partPaths[i], tracker, &wg, &Ctrl) //passed st,end,pathToWrite,waitGroup
	}

	go input.GetTerminalInput(&Ctrl)

	//Waiting for the workers
	wg.Wait()

	werr := merger.MergeChunks(partPaths, url)
	if werr != nil {
		return err
	}

	Ctrl.CancelFlag = false
	Ctrl.PauseChannel = nil
	Ctrl.PauseFlag = false

	return nil

}
