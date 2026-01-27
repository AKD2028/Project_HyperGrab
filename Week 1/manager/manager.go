package manager

import (
	"fmt"
	"sync"
	"week1/chunk"
	"week1/paths"
	"week1/probe"
	"week1/worker"
)

type Result struct {
	FileSize       int64
	RangeSupported bool
}

type Chunk struct {
	ID    int
	Start int64
	End   int64
}

func Manager(url string, numChunks int) error {

	result, err := probe.Probe(url)
	fmt.Printf(" %s ", url)
	if err != nil {
		return fmt.Errorf("Error probing the url : %w", err)
	}
	if !result.RangeSupported {
		numChunks = 1
	}

	chunks := chunk.CreateChunks(result.FileSize, numChunks) // []Chunk
	fmt.Println("✅ Chunks created:", len(chunks))
	paths, err := paths.PathBuild(numChunks, url) // retuns []string,err
	if err != nil {
		return fmt.Errorf("Error getting the paths : %w", err)
	}

	wg := sync.WaitGroup{}
	for i := 0; i < numChunks; i++ {
		wg.Add(1)
		go worker.Worker(url, chunks[i], paths[i], &wg) //passed st,end,pathToWrite,waitGroup
	}

	wg.Wait()

	return nil

}
