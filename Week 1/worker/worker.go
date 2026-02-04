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

func Worker(url string, ch chunk.Chunk, filepath string, tracker *progress.Tracker, wg *sync.WaitGroup) {
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
