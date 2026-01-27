package writer

import (
	"fmt"
	"io"
	"os"
)

type Chunk struct {
	ID    int
	Start int64
	End   int64
}

func Write(downloadedChunk []byte, filePath string) error {

	file, err := os.OpenFile(filePath, os.O_CREATE|os.O_APPEND|os.O_WRONLY, 0644)
	if err != nil {
		return fmt.Errorf("Error opening the file %v : %w\n", filePath, err)
	}
	defer file.Close()

	written, err := file.Write(downloadedChunk)
	if err != nil {
		return fmt.Errorf("Error writing to the file %v : %w\n", filePath, err)
	}
	if written < len(downloadedChunk) {
		return fmt.Errorf("Chunk could not be written to the file %v completely : %w\n", filePath, io.ErrShortWrite)
	}

	return nil
}
