# HyperGrab

A multi-threaded download manager for Windows, built with **Go** (backend) and **React** (frontend) using the **Wails** framework. HyperGrab splits a file into chunks using HTTP range requests and downloads them concurrently via goroutines, then merges them back into a single file.

## Features

- ⚡ **Concurrent chunked downloads** — splits files into multiple parts and downloads them in parallel using goroutines
- 🧠 **Chunk optimization (ECO mode)** — automatically determines the optimal number of chunks based on file size and server support
- ⏸️ **Pause / Resume / Cancel** — full control over an in-progress download
- 🔄 **Auto-reconnect** — detects connection drops and resumes downloading once the connection is restored
- 📊 **Live progress tracking** — per-chunk progress bars, current speed, and estimated time remaining
- 📁 **Custom save location** — pick a base directory for downloaded files
- 🖥️ **Native desktop app** — packaged as a Windows application via Wails

## Tech Stack

| Layer      | Technology                    |
|------------|--------------------------------|
| Backend    | Go (goroutines, `net/http`)   |
| Frontend   | React                          |
| Framework  | [Wails v2](https://wails.io)   |
| Routing    | React Router                   |
| Styling    | Utility CSS / inline styles    |

## Project Structure

```
Project_HyperGrab/
├── App/              # Main application (Go backend + React frontend)
│   ├── chunk/        # Chunk creation logic
│   ├── manager/      # Orchestrates probing, chunking, workers, and merging
│   ├── merger/       # Merges downloaded chunks into the final file
│   ├── paths/        # Builds file paths for chunk parts
│   ├── probe/        # Probes URLs for range support & file size
│   ├── progress/     # Tracks download progress, speed, and ETA
│   ├── worker/       # Worker goroutines that perform the actual downloading
│   └── frontend/     # React UI (Browser component, etc.)
└── Week 1/           # Not used by the app — internal/no significance
```

> `Week 1` has no bearing on the application and is not part of the runtime.

## How It Works

1. **Probe** — The target URL is probed to check if the server supports HTTP range requests and to get the total file size.
2. **Chunking** — If range requests are supported (and ECO is enabled), the optimal number of chunks is calculated; otherwise it falls back to a single chunk.
3. **Download** — Each chunk is downloaded concurrently by a worker goroutine, writing to its own partial file.
4. **Progress Tracking** — A tracker emits real-time events (status, speed, ETA, per-chunk progress) to the React frontend via Wails' event system.
5. **Resilience** — If the connection drops mid-download, the manager detects it, waits, and retries automatically — resuming from where each chunk left off.
6. **Merge** — Once all chunks finish, they're merged into the final output file and the temporary parts are cleaned up.

## Prerequisites

- [Go](https://go.dev/dl/) (1.20+ recommended)
- [Node.js](https://nodejs.org/) & npm
- [Wails CLI v2](https://wails.io/docs/gettingstarted/installation)

```bash
go install github.com/wailsapp/wails/v2/cmd/wails@latest
```

## Getting Started

Clone the repository:

```bash
git clone https://github.com/AKD2028/Project_HyperGrab.git
cd Project_HyperGrab/App
```

Run in development mode (hot-reload for both Go and React):

```bash
wails dev
```

Build a production Windows binary:

```bash
wails build
```

The compiled executable will be output to `build/bin/`.

## Usage

1. Launch the app.
2. Enter the **download URL** and (optionally) the number of chunks.
3. Toggle **Chunk Optimization** to let the app auto-select the optimal chunk count.
4. Choose a **save location** via Browse or by typing a path.
5. Hit **Download** — watch per-chunk progress, speed, and ETA update live.
6. Use **Pause / Resume / Cancel** as needed.

## Roadmap Ideas

- [ ] Cross-platform builds (macOS/Linux)
- [ ] Download history / queue
- [ ] Retry limits & configurable timeout
- [ ] Speed limiting / throttling
