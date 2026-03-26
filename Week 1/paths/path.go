package paths

import (
	"fmt"
	"net/url"
	"path"
)

func PathBuild(numchunks int, url_link string) ([]string, error) {
	//baseDirectory is the folder in which you want you download files to be stored

	u, err := url.Parse(url_link)
	baseDirectory := "/home/akdang/Downloads/Test"

	if err != nil {
		return nil, err
	}

	filename := path.Base(u.Path)

	result := make([]string, numchunks)

	for i := 0; i < numchunks; i++ {
		chunkpart := fmt.Sprintf("%s.part%d", filename, i+1)
		result[i] = path.Join(baseDirectory, chunkpart)

	}
	return result, nil
}
