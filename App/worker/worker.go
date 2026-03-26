package worker

import (
	"App/chunk"
	"App/progress"
	"App/writer"
	"context"
	"fmt"
	"io"
	"net/http"
	"sync"
	"time"
	"github.com/wailsapp/wails/v2/pkg/runtime"
)

type Controller struct{
	PauseFlag bool
	PauseChannel chan struct{}
	CancelFlag bool
	Mu sync.Mutex
}


type ReadResult struct{
	N int
	E error
}


func Worker(url string, ch chunk.Chunk, filepath string, tracker *progress.Tracker,wg *sync.WaitGroup,Ctrl *Controller,appCtx context.Context){
	defer (*wg).Done()
	client := &http.Client{
		Transport: &http.Transport{
			DisableKeepAlives: true,
		},
	}

	req, err := http.NewRequest("GET", url, nil)
	if err != nil {
		fmt.Println("Request error:", err)
		return
	}

	rangeHeader := fmt.Sprintf("bytes=%d-%d", ch.Start, ch.End)
	req.Header.Set("Range", rangeHeader)

	resp, err := client.Do(req)
	if err != nil {
		fmt.Println("Error:", err)
		return
	}
	defer resp.Body.Close()

	buf := make([]byte, 32*1024) // 32KB buffer

	for {
		if (Ctrl.PauseFlag){
			return
		}
		if (Ctrl.CancelFlag){
			return
		}

		//
		readChan := make(chan ReadResult)
		var currReadResult ReadResult 
		go func(){
			n, err := resp.Body.Read(buf)
			result := ReadResult{
				N : n,
				E : err,
			}
			readChan<-result
		}()

		select {
		case currReadResult=<-readChan :
			//got the bytes
		case <-time.After(2*time.Second):
			fmt.Println("Connection disrupted")
			return
		}
		
		n:= currReadResult.N
		err =currReadResult.E
		if n > 0 {
			writer.Write(buf[:n], filepath)

			//update progress
			Ctrl.Mu.Lock()
			tracker.AddProgress(ch.ID-1, int64(n))
			chunkPercent := float64(tracker.ChunkDone[ch.ID-1]) / float64(tracker.ChunkSizes[ch.ID-1]) * 100
			runtime.EventsEmit(appCtx,"UpdateProgress",ch.ID-1,chunkPercent)
			Ctrl.Mu.Unlock()
		}

		if err == io.EOF {
			break
		}

		if err != nil {
			fmt.Println("read error:", err)
			return
		}
	}
}
