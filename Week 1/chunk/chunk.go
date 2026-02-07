package chunk

type Chunk struct {
	ID    int
	Start int64
	End   int64
}

func CreateChunks(fileSize int64, numChunks int) []Chunk {

	chunks := make([]Chunk, numChunks)

	chunkSize := fileSize / int64(numChunks)
	var start int64 = 0

	for i := 0; i < numChunks; i++ {

		end := start + chunkSize - 1

		//last chunk takes remaining bytes
		if i == numChunks-1 {
			end = fileSize - 1
		}

		chunks[i] = Chunk{
			ID:    i + 1,
			Start: start,
			End:   end,
		}

		start = end + 1
	}

	return chunks
}
