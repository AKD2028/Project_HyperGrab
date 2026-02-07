package progress

import (
	"fmt"
	"sync"
	"time"
)

type Tracker struct {
	TotalSize  int64
	ChunkSizes []int64
	ChunkDone  []int64
	TotalDone  int64
	mu         sync.Mutex
}

// Create new tracker
func NewTracker(totalSize int64, numChunks int) *Tracker {
	return &Tracker{
		TotalSize:  totalSize,
		ChunkSizes: make([]int64, numChunks),
		ChunkDone:  make([]int64, numChunks),
	}
}

// Set each chunk's size
func (t *Tracker) SetChunkSize(id int, size int64) {
	t.ChunkSizes[id] = size
}

// Called by workers when bytes are downloaded
func (t *Tracker) AddProgress(id int, n int64) {
	t.mu.Lock()
	t.ChunkDone[id] += n
	t.TotalDone += n
	t.mu.Unlock()
}

// Print progress continuously
func (t *Tracker) Start() {
	go func() {
		for {
			time.Sleep(500 * time.Millisecond)

			t.mu.Lock()

			totalPercent := float64(t.TotalDone) / float64(t.TotalSize) * 100

			fmt.Printf("\rTotal: %.1f%% | ", totalPercent)

			for i := range t.ChunkDone {
				chunkPercent := float64(t.ChunkDone[i]) / float64(t.ChunkSizes[i]) * 100
				fmt.Printf("C%d: %.1f%% ", i+1, chunkPercent)
			}

			t.mu.Unlock()
		}
	}()
}
