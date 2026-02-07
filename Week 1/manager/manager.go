package manager

import (
	"fmt"
	"sync"
	"week1/chunk"
	"week1/paths"
	"week1/probe"
	"week1/worker"
	"week1/input"
)

func Manager(url string, numChunks int) error {
	//Probing the server
	result, err := probe.Probe(url) //{FileSize,RangeSupported},err
	if err != nil {
		return fmt.Errorf("Error probing the url : %w", err)
	}
	if !result.RangeSupported {
		numChunks = 1
	}

	//Getting the chunks
	chunks := chunk.CreateChunks(result.FileSize, numChunks) // []Chunk(ID,Start,End)
	fmt.Println("Chunks created:", len(chunks))

	//Getting paths
	paths, err := paths.PathBuild(numChunks, url) // retuns []string,err
	if err != nil {
		return fmt.Errorf("Error getting the paths : %w", err)
	}

	//Calling the workers
	wg := sync.WaitGroup{}
	Ctrl := worker.Controller{
		PauseFlag: false,
		PauseChannel: nil,
		CancelFlag: false,
	}
	for i := 0; i < numChunks; i++ {
		wg.Add(1)
		go worker.Worker(url, chunks[i], paths[i], &wg,&Ctrl) //passed st,end,pathToWrite,waitGroup
	}

	go input.GetTerminalInput(&Ctrl)

	//Waiting for the workers
	wg.Wait()

	Ctrl.CancelFlag=false
	Ctrl.PauseChannel=nil
	Ctrl.PauseFlag=false

	return nil

}
