package manager

import (
	"fmt"
	"sync"
	"week1/chunk"
	"week1/paths"
	"week1/probe"
	"week1/worker"
)

func Manager(url string, numChunks int) error {
	fmt.Println("Manager has started")

	//Probing
	result, err := probe.Probe(url) // {result.RangeSupported,Result.FileSize},err
	if err != nil {
		return fmt.Errorf("Error probing the url : %w", err)
	}
	if !result.RangeSupported {
		numChunks = 1
	}
	fmt.Println("Probing has succeeded")

	//Getting chunks
	chunks := chunk.CreateChunks(result.FileSize, numChunks) // []Chunk(ID,Start,End)
	fmt.Println("Chunks created:", len(chunks))

	//Getting filePaths
	paths, err := paths.PathBuild(numChunks, url) // retuns []string,err
	if err != nil {
		return fmt.Errorf("Error getting the paths : %w", err)
	}

	//Calling Workers
	wg := sync.WaitGroup{}
	for i := 0; i < numChunks; i++ {
		wg.Add(1)
		go worker.Worker(url, chunks[i], paths[i], &wg) //passed st,end,pathToWrite,waitGroup
	}

	wg.Wait()
	return nil
}
