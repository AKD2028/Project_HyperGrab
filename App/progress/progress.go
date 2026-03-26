package progress

import (
	"context"
	"sync"
	"time"

	"github.com/wailsapp/wails/v2/pkg/runtime"
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
func (t *Tracker) Start(start *time.Time,appCtx context.Context,doneFlag *bool,wg * sync.WaitGroup) {
	go func() {
		for {

			time.Sleep(500 * time.Millisecond)

			t.mu.Lock()

			speed := float64(t.TotalDone) /( time.Since(*start).Seconds()*1024*1024) // [MB/s]
			var remainingTime float64
			if speed!=0{
				remainingTime = (float64(t.TotalSize) - float64(t.TotalDone)) / (speed*1024*1024)
			}else{
				remainingTime= 0
			}
			runtime.EventsEmit(appCtx,"UpdateParams",speed,remainingTime)

			t.mu.Unlock()

			if (*doneFlag){
				wg.Done()
				return
			}

		}

	}()

}
