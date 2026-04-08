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
    const [status, setStatus] = useState("wait")
    const [ECO, setECO] = useState(false)
    const statusRef = useRef(status)
    const baseDirId = useId()
    const navigate = useNavigate()

    const initDownloading = async () => {
        if (!url) { setError("Set url please"); return }
        if (!baseDirectory) { setError("Set base directory please"); return }
        setError("--")
        await StartDownload(url, Number(chunks), baseDirectory, ECO)
    }

    const pauseDownloading = () => {
        if (status == "completed" || status == "paused" || status == "cancelled" || status == "wait") return
        EventsEmit("pause")
    }

    const resumeDownloading = () => {
        if (status !== "paused") return
        EventsEmit("resume")
    }

    const cancelDownloading = () => {
        if (status == "completed" || status == "cancelled" || status == "wait") return
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
        EventsOn("Done", () => { setUrl(""); setChunks(1); setSpeed("--"); setTime("--") })
        EventsOn("SetChunks", (numChunks) => { setChunks(numChunks) })
        EventsOn("Error", (err) => { setError(err) })
        EventsOn("UpdateProgress", (index, progress) => {
            setProgress(prev => prev.map((prog, ind) => (ind == index) ? progress : prog))
        })
        EventsOn("UpdateParams", (sp, remT) => {
            if (statusRef.current !== "downloading") { setSpeed("--"); setTime("--") }
            else { setSpeed(Math.round(sp * 100) / 100); setTime((remT != 0) ? Math.round(remT * 100) / 100 : "--") }
        })
        EventsOn("UpdateStatus", (newStatus) => { setStatus(newStatus) })
        return () => { EventsOff("Done", "Error", "UpdateProgress", "UpdateParams") }
    }, [])

    useEffect(() => { setProgress(Array.from({ length: chunks }, () => 0)) }, [chunks])
    useEffect(() => { statusRef.current = status }, [status])

    const inputStyle = {
        backgroundColor: "#1a1a1a",
        border: "1px solid #2a2a2a",
        color: "#eeeeee",
        borderRadius: "8px",
        padding: "10px 16px",
        fontSize: "13px",
        fontFamily: "monospace",
        outline: "none",
        width: "100%",
        boxSizing: "border-box"
    }

    return (
        <div
            className="min-h-screen w-screen flex flex-col items-center justify-center p-6 font-mono"
            style={{ backgroundColor: "#000000" }}
        >
            {/* Neon blast background */}
            <div className="fixed inset-0 pointer-events-none" style={{
                background: "radial-gradient(ellipse 120% 100% at 50% 120%, #ff3a3a 0%, #a31616 18%, #550000 42%, #180000 65%, #000 100%)",
                zIndex: 0,
            }} />

            {/* Subtle grid */}
            <div
                className="fixed inset-0 opacity-[0.05] pointer-events-none"
                style={{
                    backgroundImage: `linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)`,
                    backgroundSize: "48px 48px",
                    zIndex: 0,
                }}
            />

            {/* Outer card */}
            <div
                className="relative w-full max-w-3xl rounded-2xl overflow-hidden"
                style={{
                    backgroundColor: "#1a1a1a",
                    border: "1px solid #2a2a2a",
                    zIndex: 1,
                }}
            >
                {/* Header bar */}
                <div className="flex items-center justify-between px-6 py-4" style={{ backgroundColor: "rgba(17,17,17,0.95)", borderBottom: "1px solid #2a2a2a" }}>
                    <div className="flex gap-1.5">
                        <span className="w-3 h-3 rounded-full" style={{ backgroundColor: "#ff5f57" }} />
                        <span className="w-3 h-3 rounded-full" style={{ backgroundColor: "#febc2e" }} />
                        <span className="w-3 h-3 rounded-full" style={{ backgroundColor: "#28c840" }} />
                    </div>
                    <span className="text-xs tracking-widest uppercase" style={{ color: "#fff8f8" }}>
                        HyperGrab — Multi-Threaded Downloader
                    </span>
                </div>

                {/* Body */}
                <div className="p-8 flex flex-col gap-8">

                    {/* Download Target */}
                    <div className="flex flex-col gap-3">
                        <label className="text-xs font-bold tracking-widest uppercase" style={{ color: "#666666" }}>
                            Download Target
                        </label>
                        <div className="flex gap-3">
                            <input
                                disabled={!(status == "cancelled" || status == "completed" || status == "wait")}
                                type="url"
                                placeholder="https://example.com/file.zip"
                                value={url}
                                onChange={e => setUrl(e.target.value)}
                                style={{ ...inputStyle, flex: 1, opacity: !(status == "cancelled" || status == "completed" || status == "wait") ? 0.4 : 1 }}
                            />
                            <input
                                disabled={!(status == "cancelled" || status == "completed" || status == "wait")}
                                type="number"
                                min={1}
                                max={100}
                                placeholder="4"
                                value={chunks}
                                onChange={e => setChunks(e.target.value)}
                                style={{ ...inputStyle, width: "72px", textAlign: "center", opacity: !(status == "cancelled" || status == "completed" || status == "wait") ? 0.4 : 1 }}
                            />
                        </div>

                        {/* Download button + toggle */}
                        <div className="flex items-center justify-between">
                            <button
                                onClick={initDownloading}
                                className="flex items-center gap-2 text-sm font-bold tracking-wider uppercase px-6 py-2.5 rounded-lg transition-all duration-200"
                                style={{ backgroundColor: "#22c55e", color: "#000", border: "none" }}
                                onMouseEnter={e => e.currentTarget.style.backgroundColor = "#16a34a"}
                                onMouseLeave={e => e.currentTarget.style.backgroundColor = "#22c55e"}
                            >
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                                    <polyline points="7 10 12 15 17 10" />
                                    <line x1="12" y1="15" x2="12" y2="3" />
                                </svg>
                                Download
                            </button>

                            {/* Toggle */}
                            <div className="flex items-center gap-3">
                                <span className="text-xs tracking-widest uppercase" style={{ color: "#888888" }}>Chunk Optimization</span>
                                <button
                                    onClick={() => setECO(prev => !prev)}
                                    className="relative inline-flex items-center rounded-full transition-colors duration-200"
                                    style={{
                                        width: "44px",
                                        height: "24px",
                                        backgroundColor: ECO ? "#22c55e" : "#333333",
                                        border: "none",
                                        cursor: "pointer",
                                        padding: 0,
                                        flexShrink: 0
                                    }}
                                >
                                    <span
                                        className="inline-block rounded-full transition-transform duration-200"
                                        style={{
                                            width: "18px",
                                            height: "18px",
                                            backgroundColor: "#fff",
                                            transform: ECO ? "translateX(23px)" : "translateX(3px)",
                                        }}
                                    />
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Divider */}
                    <div style={{ borderTop: "1px solid #2a2a2a" }} />

                    {/* Progress */}
                    <div className="flex flex-col gap-4">
                        <label className="text-xs font-bold tracking-widest uppercase" style={{ color: "#666666" }}>Progress</label>

                        {/* Segmented bar */}
                        <div className="flex w-full rounded-lg overflow-hidden gap-px" style={{ backgroundColor: "#2a2a2a", border: "1px solid #333333", height: "10px" }}>
                            {Array.from({ length: chunks }).map((_, ind) => (
                                <div className="flex-1" style={{ backgroundColor: "#1a1a1a" }} key={ind}>
                                    <div
                                        style={{ width: `${progress[ind] || 0}%`, height: "100%", backgroundColor: "#22c55e", transition: "width 0.3s" }}
                                    />
                                </div>
                            ))}
                        </div>

                        {/* Speed / ETA cards */}
                        <div className="grid grid-cols-2 gap-3">
                            {[
                                {
                                    icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#888" strokeWidth="2"><path d="M12 2a10 10 0 1 0 10 10"/><path d="M12 6v6l4 2"/></svg>,
                                    label: "SPEED",
                                    value: speed === "--" ? "—" : `${speed} MB/s`
                                },
                                {
                                    icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#888" strokeWidth="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>,
                                    label: "ETA",
                                    value: time === "--" ? "—" : `${time}s`
                                }
                            ].map(({ icon, label, value }) => (
                                <div key={label} className="flex flex-col gap-2 rounded-xl px-5 py-4" style={{ backgroundColor: "#111111", border: "1px solid #2a2a2a" }}>
                                    <div className="flex items-center gap-2">
                                        {icon}
                                        <span className="text-xs font-bold tracking-widest uppercase" style={{ color: "#666666" }}>{label}</span>
                                    </div>
                                    <span className="text-sm font-semibold" style={{ color: "#cccccc" }}>{value}</span>
                                </div>
                            ))}
                        </div>

                        {/* Control buttons */}
                        <div className="flex gap-3">
                            {[
                                {
                                    onClick: pauseDownloading, label: "Pause",
                                    icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></svg>
                                },
                                {
                                    onClick: resumeDownloading, label: "Resume",
                                    icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="5 3 19 12 5 21 5 3"/></svg>
                                },
                                {
                                    onClick: cancelDownloading, label: "Cancel",
                                    icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                                }
                            ].map(({ onClick, label, icon }) => (
                                <button
                                    key={label}
                                    onClick={onClick}
                                    className="flex-1 flex items-center justify-center gap-2 text-xs font-bold py-3 rounded-xl uppercase tracking-wider transition-all duration-200"
                                    style={{
                                        backgroundColor: "#111111",
                                        border: "1px solid #333333",
                                        color: "#888888",
                                        cursor: "pointer"
                                    }}
                                    onMouseEnter={e => { e.currentTarget.style.borderColor = "#555"; e.currentTarget.style.color = "#ccc" }}
                                    onMouseLeave={e => { e.currentTarget.style.borderColor = "#333"; e.currentTarget.style.color = "#888" }}
                                >
                                    {icon} {label}
                                </button>
                            ))}
                        </div>

                        {/* Status badge */}
                        <div className="flex gap-3 flex-wrap">
                            <span
                                className="text-xs px-4 py-1.5 rounded-full font-bold tracking-widest uppercase"
                                style={{ backgroundColor: "#1a1a1a", border: "1px solid #333333", color: "#888888" }}
                            >
                                {status.toUpperCase()}
                            </span>
                            {error !== "--" && (
                                <span
                                    className="text-xs px-4 py-1.5 rounded-full font-bold tracking-widest uppercase"
                                    style={{ backgroundColor: "#2a1010", border: "1px solid #ff5f57", color: "#ff5f57" }}
                                >
                                    {error}
                                </span>
                            )}
                        </div>
                    </div>

                    {/* Divider */}
                    <div style={{ borderTop: "1px solid #2a2a2a" }} />

                    {/* Save Location */}
                    <div className="flex flex-col gap-3">
                        <label className="text-xs font-bold tracking-widest uppercase" style={{ color: "#666666" }}>Save Location</label>
                        <div className="flex gap-3 items-center">
                            <label htmlFor={baseDirId} className="text-sm shrink-0 w-16" style={{ color: "#888888" }}>Base Dir</label>
                            <input
                                id={baseDirId}
                                type="text"
                                value={baseDirectory}
                                onChange={e => setBaseDirectory(e.target.value)}
                                style={{ ...inputStyle, flex: 1 }}
                            />
                            <button
                                onClick={selectDir}
                                className="shrink-0 text-xs font-bold px-5 py-2.5 rounded-lg uppercase tracking-wider transition-all duration-200"
                                style={{ backgroundColor: "#111111", border: "1px solid #333333", color: "#888888", cursor: "pointer" }}
                                onMouseEnter={e => { e.currentTarget.style.borderColor = "#555"; e.currentTarget.style.color = "#ccc" }}
                                onMouseLeave={e => { e.currentTarget.style.borderColor = "#333"; e.currentTarget.style.color = "#888" }}
                            >
                                Browse
                            </button>
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="px-6 py-3 flex justify-between items-center" style={{ backgroundColor: "#111111", borderTop: "1px solid #2a2a2a" }}>
                    <span className="text-xs tracking-widest uppercase" style={{ color: "#444444" }}>sys: ready</span>
                    <span className="text-xs tracking-widest uppercase flex items-center gap-1.5" style={{ color: "#22c55e" }}>
                        <span className="inline-block w-1.5 h-1.5 rounded-full" style={{ backgroundColor: "#22c55e" }} />
                        online
                    </span>
                </div>
            </div>

            {/* Home button */}
            <button
                onClick={() => navigate("/")}
                className="mt-6 text-xs font-bold px-8 py-2 rounded-xl uppercase tracking-widest transition-all duration-200"
                style={{ backgroundColor: "#111111", border: "1px solid #333333", color: "#888888", cursor: "pointer", position: "relative", zIndex: 1 }}
                onMouseEnter={e => {
                e.currentTarget.style.borderColor = "#22c55e"
                e.currentTarget.style.color = "#22c55e"
                }}
                onMouseLeave={e => {
                e.currentTarget.style.borderColor = "#333333"
                e.currentTarget.style.color = "#888888"
                }}
            >
             ← &nbsp;Home
            </button>
        </div>
    )
}

export default Browser
