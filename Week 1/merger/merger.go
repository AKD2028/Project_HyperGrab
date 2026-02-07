package merger

import (
	"fmt"
	"io"
	"net/url"
	"os"
	"path"
)

func MergeChunks(chunkPaths []string, url_link string) error {
	u, err := url.Parse(url_link)
	if err != nil {
		return fmt.Errorf("Error :%v", err)
	}
	fileName := path.Base(u.Path)
	baseDirectory := "C:\\Users\\HP\\Downloads"
	filePath := path.Join(baseDirectory, fileName)

	file, err := os.OpenFile(filePath, os.O_CREATE|os.O_WRONLY, 0644)
	if err != nil {
		return fmt.Errorf("Error opening the file %v : %w\n", filePath, err)
	}
	defer file.Close()

	buf := make([]byte, 32*1024) // 32KB buffer

	for _, chunkPath := range chunkPaths {
		in, err := os.Open(chunkPath)
		//  Or can use in,err := os.OpenFile(chunkPath, os.O_RDONLY, 0)
		if err != nil {
			return fmt.Errorf("Error:%v", err)
		}

		for {
			n, err := in.Read(buf)

			if n > 0 {
				if _, werr := file.Write(buf[:n]); werr != nil {
					in.Close()
					return fmt.Errorf("Error:%v", werr)
				}
			}
			if err != nil {
				if err == io.EOF {
					break
				}
				in.Close()
				return fmt.Errorf("Error:%v", err)
			}
		}
		in.Close()

	}
	//Deleting Chunks
	for _, chunkPath := range chunkPaths {
		if err := os.Remove(chunkPath); err != nil {
			return err
		}
	}
	return nil

}
