package worker

import (
	"fmt"
	"io"
	"net/http"
	"sync"
	"week1/chunk"
	"week1/progress"
	"week1/writer"
)

type Controller struct{
	PauseFlag bool
	PauseChannel chan struct{}
	CancelFlag bool
}

func Worker(url string, ch chunk.Chunk, filepath string, tracker *progress.Tracker,wg *sync.WaitGroup,Ctrl *Controller){
	defer (*wg).Done()
	client := &http.Client{}

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

		n, err := resp.Body.Read(buf)

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
