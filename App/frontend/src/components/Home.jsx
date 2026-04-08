import { useNavigate } from "react-router-dom"
import { useEffect, useState } from "react"

function Home() {
    const navigate = useNavigate()
    const [typed, setTyped] = useState("")
    const [showCursor, setShowCursor] = useState(true)

    const headline = "HyperGrab — Multi-Threaded Downloader"

    useEffect(() => {
        let i = 0
        const interval = setInterval(() => {
            if (i <= headline.length) {
                setTyped(headline.slice(0, i))
                i++
            } else {
                clearInterval(interval)
            }
        }, 60)
        return () => clearInterval(interval)
    }, [])

    useEffect(() => {
        const interval = setInterval(() => setShowCursor(p => !p), 530)
        return () => clearInterval(interval)
    }, [])

    const features = [
        {
            icon: <span style={{ display: "inline-block", width: "10px", height: "10px", backgroundColor: "#cccccc", flexShrink: 0 }} />,
            label: "Parallel Chunks",
            desc: "Split files into concurrent streams for maximum throughput"
        },
        {
            icon: <span style={{ display: "inline-block", width: "10px", height: "10px", backgroundColor: "#cccccc", flexShrink: 0 }} />,
            label: "Pause & Resume",
            desc: "Halt and continue any download without losing progress"
        },
        {
            icon: <span style={{ display: "inline-block", width: "10px", height: "10px", backgroundColor: "#cccccc", flexShrink: 0 }} />,
            label: "Custom Save Path",
            desc: "Choose exactly where each file lands on your machine"
        },
        {
            icon: <span style={{ display: "inline-block", width: "10px", height: "10px", backgroundColor: "#cccccc", flexShrink: 0 }} />,
            label: "Live Stats",
            desc: "Real-time speed and ETA updated every second"
        },
    ]

    return (
        <div
            className="min-h-screen w-screen flex items-center justify-center p-6 font-mono overflow-hidden relative"
            style={{ backgroundColor: "#000000" }}
        >
            {/* Neon blast background */}
            <div className="absolute inset-0 pointer-events-none" style={{
                background: "radial-gradient(ellipse 120% 100% at 50% 120%, #ff3a3a 0%, #a31616 18%, #550000 42%, #180000 65%, #000 100%)"
            }} />

            {/* Subtle grid background */}
            <div
                className="absolute inset-0 opacity-[0.05] pointer-events-none"
                style={{
                    backgroundImage: `
                        linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px),
                        linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)
                    `,
                    backgroundSize: "48px 48px",
                }}
            />

            {/* Main card */}
            <div
                className="relative w-full max-w-2xl rounded-2xl overflow-hidden"
                style={{
                    backgroundColor: "#1a1a1a",
                    border: "1px solid #2a2a2a",
                }}
            >
                {/* Header bar */}
                <div className="flex items-center gap-3 px-6 py-4" style={{ backgroundColor: "rgba(17,17,17,0.9)", borderBottom: "1px solid #2a2a2a" }}>
                    <div className="flex gap-1.5">
                        <span className="w-3 h-3 rounded-full" style={{ backgroundColor: "#ff5f57" }} />
                        <span className="w-3 h-3 rounded-full" style={{ backgroundColor: "#febc2e" }} />
                        <span className="w-3 h-3 rounded-full" style={{ backgroundColor: "#28c840" }} />
                    </div>
                    <span className="text-xs tracking-widest uppercase ml-2 select-none" style={{ color: "#555555" }}>
                        V1.0.0 — WELCOME
                    </span>
                </div>

                {/* Body */}
                <div className="px-10 py-12 flex flex-col items-center gap-10">

                    {/* Icon / logo mark */}
                    <div className="flex items-center justify-center">
                        <div
                            className="w-16 h-16 rounded-2xl flex items-center justify-center text-2xl"
                            style={{
                                backgroundColor: "#222222",
                                border: "1px solid #333333",
                                color: "#cccccc"
                            }}
                        >
                            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#cccccc" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                                <polyline points="7 10 12 15 17 10" />
                                <line x1="12" y1="15" x2="12" y2="3" />
                            </svg>
                        </div>
                    </div>

                    {/* Headline */}
                    <div className="text-center flex flex-col gap-3">
                        <h1 className="text-xl font-bold tracking-widest uppercase" style={{ color: "#e0e0e0" }}>
                            {typed}
                            <span
                                className="inline-block w-0.5 h-5 ml-1 align-middle"
                                style={{ backgroundColor: "#22c55e", opacity: showCursor ? 1 : 0, transition: "opacity 0.1s" }}
                            />
                        </h1>
                        <p className="text-xs tracking-widest uppercase" style={{ color: "#555555" }}>
                            Blazing fast · Parallel · Resumable
                        </p>
                    </div>

                    {/* Divider */}
                    <div className="w-full" style={{ borderTop: "1px solid #2a2a2a" }} />

                    {/* Feature grid */}
                    <div className="w-full grid grid-cols-2 gap-3">
                        {features.map(({ icon, label, desc }) => (
                            <div
                                key={label}
                                className="rounded-xl px-5 py-4 flex flex-col gap-2 group transition-all duration-200"
                                style={{
                                    backgroundColor: "#111111",
                                    border: "1px solid #2a2a2a",
                                    cursor: "default"
                                }}
                                onMouseEnter={e => e.currentTarget.style.borderColor = "#3a3a3a"}
                                onMouseLeave={e => e.currentTarget.style.borderColor = "#2a2a2a"}
                            >
                                <div className="flex items-center gap-2">
                                    {icon}
                                    <span className="text-xs font-bold tracking-widest uppercase" style={{ color: "#888888" }}>
                                        {label}
                                    </span>
                                </div>
                                <p className="text-xs leading-relaxed" style={{ color: "#555555" }}>
                                    {desc}
                                </p>
                            </div>
                        ))}
                    </div>

                    {/* Divider */}
                    <div className="w-full" style={{ borderTop: "1px solid #2a2a2a" }} />

                    {/* CTA */}
                    <div className="flex flex-col items-center gap-3 w-full">
                        <button
                            onClick={() => navigate("/browser")}
                            className="w-full max-w-xs text-sm font-bold tracking-widest uppercase px-8 py-3 rounded-lg transition-all duration-200"
                            style={{
                                backgroundColor: "#22c55e",
                                color: "#000000",
                                border: "none",
                                letterSpacing: "0.15em"
                            }}
                            onMouseEnter={e => e.currentTarget.style.backgroundColor = "#16a34a"}
                            onMouseLeave={e => e.currentTarget.style.backgroundColor = "#22c55e"}
                        >
                            ↓ &nbsp; Get Started
                        </button>
                        <span className="text-xs tracking-widest uppercase" style={{ color: "#444444" }}>
                            press to launch downloader
                        </span>
                    </div>

                </div>
            </div>
        </div>
    )
}

export default Home
