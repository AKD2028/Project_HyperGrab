package worker

import (
	"fmt"
	"io"
	"net/http"
	"sync"
	"time"
	"week1/chunk"
	"week1/progress"
	"week1/writer"
)

type Controller struct{
	PauseFlag bool
	PauseChannel chan struct{}
	CancelFlag bool
}


type ReadResult struct{
	N int
	E error
}


func Worker(url string, ch chunk.Chunk, filepath string, tracker *progress.Tracker,wg *sync.WaitGroup,Ctrl *Controller){
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
			fmt.Printf("Downloading paused for chunk %d\n",ch.ID)
			<-Ctrl.PauseChannel
		}
		if (Ctrl.CancelFlag){
			fmt.Printf("Downloading cancelled for chunk %d\n", ch.ID)
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
		case <-time.After(10*time.Second):
			fmt.Println("Connection disrupted")
			return
		}
		

		

		n:= currReadResult.N
		err =currReadResult.E
		if n > 0 {
			writer.Write(buf[:n], filepath)

			//update progress
			tracker.AddProgress(ch.ID-1, int64(n))

		}

		if err == io.EOF {
			break
		}

		if err != nil {
			fmt.Println("read error:", err)
			return
		}
	}
	fmt.Printf("Chunk %d finished downloading\n\n", ch.ID)

}
