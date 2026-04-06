import { useEffect, useRef, useState, useId } from "react"
import { StartDownload, FetchBaseDirectory } from "../../wailsjs/go/main/App"
import { EventsOn, EventsOff, EventsEmit } from '../../wailsjs/runtime/runtime'
import { useNavigate } from "react-router-dom"
function Browser() {

    const [chunks, setChunks] = useState(1)
    const [progress, setProgress] = useState([])
    const [baseDirectory, setBaseDirectory] = useState("")
    const [url, setUrl] = useState("")
    const [error, setError] = useState("--")
    const [speed, setSpeed] = useState("--")
    const [time, setTime] = useState("--")
    const [status, setStatus] = useState("wait") //downloading,completed,paused,cancelled....
    const [ECO,setECO]=useState(false)
    const statusRef = useRef(status)
    const baseDirId = useId()
    const navigate = useNavigate()

    const initDownloading = async () => {
        if (!url) {
            setError("Set url please")
            return
        }
        if (!baseDirectory) {
            setError("Set base directory please")
            return
        }
        setError("--")
        await StartDownload(url, Number(chunks), baseDirectory,ECO)
    }

    const pauseDownloading = () => {
        if (status == "completed" || status == "paused" || status == "cancelled" || status == "wait")
            return
        EventsEmit("pause")
    }

    const resumeDownloading = () => {
        if (status !== "paused")
            return
        EventsEmit("resume")
    }

    const cancelDownloading = () => {
        if (status == "completed" || status == "cancelled" || status == "wait")
            return
        EventsEmit("cancel")
    }

    const selectDir = async () => {
        try {
            const path = await FetchBaseDirectory()
            setBaseDirectory(path)
        } catch (error) {
            setError(error.message)
        }
    }



    useEffect(() => {

        EventsOn("Done", () => {
            setUrl("")
            setChunks(1)
            setSpeed("--")
            setTime("--")
        })

        EventsOn("SetChunks", (numChunks) => {
            setChunks(numChunks)
        })

        EventsOn("Error", (err) => {
            setError(err)
        })

        EventsOn("UpdateProgress", (index, progress) => {
            setProgress(prev => prev.map((prog, ind) => (
                (ind == index) ? progress : prog
            )))
        })

        EventsOn("UpdateParams", (sp, remT) => {
            if (statusRef.current !== "downloading") {
                setSpeed("--")
                setTime("--")
            }
            else {
                setSpeed(Math.round(sp * 100) / 100)
                setTime((remT != 0) ? Math.round(remT * 100) / 100 : "--")
            }
        })

        EventsOn("UpdateStatus", (newStatus) => {
            setStatus(newStatus)
        })

        return () => {
            EventsOff("Done", "Error", "UpdateProgress", "UpdateParams")
        }
    }, [])

    useEffect(() => {
        setProgress(Array.from({ length: chunks }, () => 0))
    }, [chunks])

    useEffect(() => {
        statusRef.current = status
    }, [status])



    return (
        <div className="min-h-screen gap-10 w-screen bg-[#0f1a3d] flex flex-col items-center justify-center p-6 font-mono">

            {/* Outer card */}
            <div className="shadow-[0_0_10px_5px_blue] w-full max-w-3xl bg-[#152047] border border-[#2a3f7a] rounded-2xl  overflow-hidden">

                {/* Header bar */}
                <div className="flex items-center gap-3 px-6 py-4 bg-[#0f1a3d] border-b border-[#2a3f7a]">
                    <div className="flex gap-1.5">
                        <span className="w-3 h-3 rounded-full bg-[#ff5f57]" />
                        <span className="w-3 h-3 rounded-full bg-[#febc2e]" />
                        <span className="w-3 h-3 rounded-full bg-[#28c840]" />
                    </div>
                    <span className="text-[#7a9fd4] text-xs font-bold  tracking-widest uppercase ml-2">HyperGrab - Multi-threaded Downloader</span>
                </div>

                {/* Body */}
                <div className="p-8 flex flex-col gap-8">

                    {/* URL + Chunks inputs */}
                    <div className="flex flex-col gap-3">
                        <label className="text-[#7a9fd4] font-bold text-xs tracking-widest uppercase">Download Target</label>
                        <div className="flex gap-3">
                            <input
                                disabled={!(status == "cancelled" || status == "completed" || status == "wait")}
                                type="url"
                                placeholder="https://example.com/file.zip"
                                value={url}
                                onChange={e => setUrl(e.target.value)}
                                className="flex-1 bg-[#0f1a3d] border border-[#2a3f7a] text-[#dce8ff] placeholder-[#3d5a99] rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-[#4d7fd4] transition-colors disabled:opacity-40"
                            />
                            <input
                                disabled={!(status == "cancelled" || status == "completed" || status == "wait")}
                                type="number"
                                min={1}
                                max={100}
                                placeholder="Chunks"
                                value={chunks}
                                onChange={e => setChunks(e.target.value)}
                                className="w-24 bg-[#0f1a3d] border border-[#2a3f7a] text-[#dce8ff] placeholder-[#3d5a99] rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-[#4d7fd4] transition-colors disabled:opacity-40 text-center"
                            />
                        </div>
                        <div className='flex justify-between'>
                            <button onClick={initDownloading} className="hover:shadow-[0_0_10px_5px_blue] border-2 border-blue-600 self-start bg-[#1843cf] hover:bg-[#2554e0] active:bg-[#0f32a8] text-white text-sm font-semibold tracking-wider px-6 py-2.5 rounded-lg transition-colors uppercase">
                                ↓ Download
                            </button>
                            <div className='flex items-center gap-2'>
                                <label className='text-white' htmlFor="ChunkOpt">Enable Chunk Optimaization</label>
                                <input className='checking' id="ChunkOpt" type="checkbox" checked={ECO} onChange={() => { setECO(prev => !prev) }} />
                            </div>
                        </div>
                    </div>

                    {/* Divider */}
                    <div className="border-t border-[#2a3f7a]" />

                    {/* Progress section */}
                    <div className="flex flex-col gap-4">
                        <label className="text-[#7a9fd4] text-xs tracking-widest font-bold uppercase">Progress</label>

                        {/* Segmented progress bar */}
                        <div className="flex w-full rounded-lg overflow-hidden gap-px bg-[#2a3f7a]">
                            {Array.from({ length: chunks }).map((_, ind) => (
                                <div className="flex-1 bg-[#0f1a3d] h-4" key={ind}>
                                    <div
                                        style={{ width: `${progress[ind]}%` }}
                                        className="bg-[#4d7fd4] h-full transition-all duration-300"
                                    />
                                </div>
                            ))}
                        </div>

                        {/* Stats row */}
                        <div className="flex gap-6 text-sm">
                            <div className="flex items-center gap-2">
                                <span className="text-[#7a9fd4] uppercase text-xs font-bold tracking-widest">Speed</span>
                                <span className="text-[#dce8ff] font-semibold">
                                    {speed === "--" ? "—" : `${speed} MB/s`}
                                </span>
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="text-[#7a9fd4] font-bold uppercase text-xs tracking-widest">ETA</span>
                                <span className="text-[#dce8ff] font-semibold">
                                    {time === "--" ? "—" : `${time}s`}
                                </span>
                            </div>
                        </div>

                        {/* Control buttons */}
                        <div className="flex gap-5">
                            <button
                                onClick={pauseDownloading}
                                className="border-2 text-xs font-bold px-4 py-1.5 rounded-md uppercase tracking-wider hover:text-[#0f1a3d] hover:scale-105 transition-all duration-200 hover:shadow-[0_0_10px_1px_#febc2e] border-[#febc2e] text-[#febc2e] hover:bg-[#febc2e]"
                            >
                                ⏸ Pause
                            </button>
                            <button
                                onClick={resumeDownloading}
                                className="border-2 text-xs font-bold px-4 py-1.5 rounded-md uppercase tracking-wider hover:text-[#0f1a3d] hover:scale-105 transition-all duration-200 hover:shadow-[0_0_10px_1px_#28c840] border-[#28c840] text-[#28c840] hover:bg-[#28c840]"
                            >
                                ▶ Resume
                            </button>
                            <button
                                onClick={cancelDownloading}
                                className="border-2 text-xs font-bold px-4 py-1.5 rounded-md uppercase tracking-wider hover:text-[#0f1a3d] hover:scale-105 transition-all duration-200 hover:shadow-[0_0_10px_1px_#ff5f57] border-[#ff5f57] text-[#ff5f57] hover:bg-[#ff5f57]"
                            >
                                ✕ Cancel
                            </button>
                        </div>

                        {/* Status + Error badges */}
                        <div className="flex gap-5  flex-wrap">
                            <span className="bg-[#0f1a3d] min-w-52 text-center  border border-[#2a3f7a] text-[#7a9fd4] text-xs px-3 py-1 rounded-full tracking-widest uppercase">
                                Status: <span className="text-[#dce8ff] ">{status.toUpperCase()}</span>
                            </span>
                            <span className="bg-[#2a1020] border border-[#ff5f57] text-[#ff5f57] text-xs px-3 py-1 rounded-full tracking-widest uppercase">
                                Error: {error.toUpperCase()}
                            </span>

                        </div>
                    </div>

                    {/* Divider */}
                    <div className="border-t border-[#2a3f7a]" />

                    {/* Base directory section */}
                    <div className="flex flex-col gap-3">
                        <label className="text-[#7a9fd4] text-xs tracking-widest font-bold uppercase">Save Location</label>
                        <div className="flex gap-3 items-center">
                            <label htmlFor={baseDirId} className="text-[#a8c4e8] text-sm w-20 shrink-0">Base Dir</label>
                            <input
                                id={baseDirId}
                                type="text"
                                value={baseDirectory}
                                onChange={e => setBaseDirectory(e.target.value)}
                                className="flex-1 bg-[#0f1a3d] border border-[#2a3f7a] text-[#dce8ff] rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-[#4d7fd4] transition-colors"
                            />
                            <button onClick={selectDir} className="shrink-0 border border-[#2a3f7a] hover:border-[#4d7fd4] text-[#a8c4e8] hover:text-[#dce8ff] text-xs px-4 py-2.5 rounded-lg uppercase tracking-wider transition-colors">
                                Browse
                            </button>
                        </div>
                    </div>

                </div>
            </div>

            <div className="border-blue-900 border-2 transition-all duration-100 hover:shadow-[0_0_10px_2px_blue] ease-linear hover:scale-110 py-1 px-10 rounded-xl text-white bg-blue-600 ">
                <button onClick={() => { navigate("/") }}>
                    Home
                </button>
            </div>

        </div>
    )
}

export default Browser
