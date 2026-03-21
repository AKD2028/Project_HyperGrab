package probe

import (
	"fmt"
	"io"
	"math"
	"net/http"
	"runtime"
	"strconv"
	"time"
)

type Result struct {
	FileSize       int64
	RangeSupported bool
}

func Probe(url string) (*Result, error) {

	//HEAD-making head request
	req, err := http.NewRequest("HEAD", url, nil)
	if err != nil {

		return nil, err
	}

	//Send the request
	client := &http.Client{}
	resp, err := client.Do(req)
	if err != nil {
		fmt.Println("HTTP request failed:", err)
		return nil, err
	}
	defer resp.Body.Close()

	//server responded
	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("server returned %s", resp.Status)
	}

	//Content-Length
	lengthStr := resp.Header.Get("Content-Length")
	if lengthStr == "" {
		return nil, fmt.Errorf("no Content-Length header")
	}

	fileSize, err := strconv.ParseInt(lengthStr, 10, 64)
	//just for safety
	if err != nil {
		return nil, err
	}

	//Accept-Range
	rangeHeader := resp.Header.Get("Accept-Ranges")
	rangeSupported := (rangeHeader == "bytes")

	return &Result{
		FileSize:       fileSize,
		RangeSupported: rangeSupported,
	}, nil

}

func measureSpeed(url string) (float64, error) {
	client := &http.Client{}

	req, err := http.NewRequest("GET", url, nil)
	if err != nil {
		return 0, err
	}
	req.Header.Set("Range", "bytes=0-4194303") // 4MB

	start := time.Now()

	resp, err := client.Do(req)
	if err != nil {
		return 0, err
	}
	defer resp.Body.Close()

	n, err := io.Copy(io.Discard, resp.Body)
	if err != nil {
		return 0, err
	}

	elapsed := time.Since(start).Seconds()
	return ((float64(n) / (1024 * 1024)) / elapsed), nil
}

func GetoptimalChunks(url string, filesize int64) (int, error) {
	fmt.Println("Probing your internet speed")
	mySpeed, err := measureSpeed("https://speed.cloudflare.com/__down?bytes=26214400") // 25MB probe used  to measure our speed
	if err != nil || mySpeed == 0 {
		fmt.Println("Internet speed probe failed, using fallback")
		mySpeed = 10
	}

	fmt.Println("Probing server send speed...")
	serverSpeed, err := measureSpeed(url) // measuring server upload spedd
	if err != nil || serverSpeed == 0 {
		fmt.Println("Server speed probe failed, using fallback")
		serverSpeed = mySpeed
	}

	fmt.Printf("Your speed   : %.2f MB/s\n", mySpeed)
	fmt.Printf("Server speed : %.2f MB/s\n", serverSpeed)

	chunks := int(math.Ceil(mySpeed / serverSpeed))

	cores := runtime.NumCPU()
	if chunks > cores {
		chunks = cores
	}

	// Don't create chunks smaller than 512KB
	const minChunkSize = 512 * 1024
	maxBySize := int(filesize / minChunkSize)
	if maxBySize < 1 {
		maxBySize = 1
	}
	if chunks > maxBySize {
		chunks = maxBySize
	}
	if chunks < 1 {
		chunks = 1
	}

	fmt.Printf("Optimal chunks: %d\n", chunks)

	return 1, nil
}
