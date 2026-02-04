package progress

import (
	"fmt"
	"sync"
	"time"
)

type Tracker struct {
	totalSize  int64
	chunkSizes []int64
	chunkDone  []int64
	totalDone  int64
	mu         sync.Mutex
}

// Create new tracker
func NewTracker(totalSize int64, numChunks int) *Tracker {
	return &Tracker{
		totalSize:  totalSize,
		chunkSizes: make([]int64, numChunks),
		chunkDone:  make([]int64, numChunks),
	}
}

// Set each chunk's size
func (t *Tracker) SetChunkSize(id int, size int64) {
	t.chunkSizes[id] = size
}

// Called by workers when bytes are downloaded
func (t *Tracker) AddProgress(id int, n int64) {
	t.mu.Lock()
	t.chunkDone[id] += n
	t.totalDone += n
	t.mu.Unlock()
}

// Print progress continuously
func (t *Tracker) Start() {
	go func() {
		for {
			time.Sleep(500 * time.Millisecond)

			t.mu.Lock()

			totalPercent := float64(t.totalDone) / float64(t.totalSize) * 100

			fmt.Printf("\rTotal: %.1f%% | ", totalPercent)

			for i := range t.chunkDone {
				chunkPercent := float64(t.chunkDone[i]) / float64(t.chunkSizes[i]) * 100
				fmt.Printf("C%d: %.1f%% ", i+1, chunkPercent)
			}

			t.mu.Unlock()
		}
	}()
}
