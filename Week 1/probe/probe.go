package probe

import (
	"fmt"
	"net/http"
	"strconv"
)

// Result holds metadata about the file
type Result struct {
	FileSize       int64
	RangeSupported bool
}

func Probe(url string) (*Result, error) {

	//HEAD
	req, err := http.NewRequest("HEAD", url, nil)
	if err != nil {

		return nil, err
	}

	//Send the request
	client := &http.Client{}
	resp, err := client.Do(req)
	if err != nil {
		fmt.Println("❌ HTTP request failed:", err)
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
