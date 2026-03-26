import { useNavigate } from "react-router-dom"
import { useEffect, useState } from "react"

function Home() {
    const navigate = useNavigate()
    const [typed, setTyped] = useState("")
    const [showCursor, setShowCursor] = useState(true)
    const [glowPulse, setGlowPulse] = useState(false)

    const headline = "Multi-Threaded Downloader"

    // Typewriter effect
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

    // Blinking cursor
    useEffect(() => {
        const interval = setInterval(() => setShowCursor(p => !p), 530)
        return () => clearInterval(interval)
    }, [])

    // Glow pulse on mount
    useEffect(() => {
        setTimeout(() => setGlowPulse(true), 800)
    }, [])

    const features = [
        { icon: "⚡", label: "Parallel Chunks", desc: "Split files into concurrent streams for maximum throughput" },
        { icon: "⏸", label: "Pause & Resume", desc: "Halt and continue any download without losing progress" },
        { icon: "📁", label: "Custom Save Path", desc: "Choose exactly where each file lands on your machine" },
        { icon: "📊", label: "Live Stats", desc: "Real-time speed and ETA updated every second" },
    ]

    return (
        <div className="min-h-screen w-screen bg-[#0f1a3d] flex items-center justify-center p-6 font-mono overflow-hidden relative">

            {/* Animated grid background */}
            <div
                className="absolute inset-0 opacity-10 pointer-events-none"
                style={{
                    backgroundImage: `
                        linear-gradient(rgba(77,127,212,0.4) 1px, transparent 1px),
                        linear-gradient(90deg, rgba(77,127,212,0.4) 1px, transparent 1px)
                    `,
                    backgroundSize: "48px 48px",
                }}
            />

            {/* Radial glow center */}
            <div
                className="absolute inset-0 pointer-events-none transition-opacity duration-1000"
                style={{
                    background: "radial-gradient(ellipse 70% 50% at 50% 50%, rgba(29,67,207,0.18) 0%, transparent 70%)",
                    opacity: glowPulse ? 1 : 0,
                }}
            />

            {/* Main card */}
            <div
                className="relative w-full max-w-2xl bg-[#152047] border border-[#2a3f7a] rounded-2xl overflow-hidden"
                style={{
                    boxShadow: "0 0 12px 4px rgba(30,80,220,0.45), 0 0 60px 10px rgba(20,50,150,0.2)",
                }}
            >
                {/* Header bar */}
                <div className="flex items-center gap-3 px-6 py-4 bg-[#0f1a3d] border-b border-[#2a3f7a]">
                    <div className="flex gap-1.5">
                        <span className="w-3 h-3 rounded-full bg-[#ff5f57]" />
                        <span className="w-3 h-3 rounded-full bg-[#febc2e]" />
                        <span className="w-3 h-3 rounded-full bg-[#28c840]" />
                    </div>
                    <span className="text-[#3d5a99] text-xs tracking-widest uppercase ml-2 select-none">
                        v1.0.0 — welcome
                    </span>
                </div>

                {/* Body */}
                <div className="px-10 py-12 flex flex-col items-center gap-10">

                    {/* Icon / logo mark */}
                    <div className="relative flex items-center justify-center">
                        <div
                            className="w-20 h-20 rounded-2xl bg-[#0f1a3d] border border-[#2a3f7a] flex items-center justify-center text-4xl"
                            style={{ boxShadow: "0 0 24px 4px rgba(77,127,212,0.3)" }}
                        >
                            ↓
                        </div>
                        {/* orbit ring */}
                        <div
                            className="absolute w-32 h-32 rounded-full border border-[#2a3f7a] opacity-40"
                            style={{ animation: "spin 8s linear infinite" }}
                        />
                        <div
                            className="absolute w-24 h-24 rounded-full border border-[#1843cf] opacity-20"
                            style={{ animation: "spin 5s linear infinite reverse" }}
                        />
                    </div>

                    {/* Headline with typewriter */}
                    <div className="text-center flex flex-col gap-3">
                        <h1 className="text-[#dce8ff] text-2xl font-bold tracking-widest uppercase">
                            {typed}
                            <span
                                className="inline-block w-0.5 h-6 bg-[#4d7fd4] ml-1 align-middle"
                                style={{ opacity: showCursor ? 1 : 0, transition: "opacity 0.1s" }}
                            />
                        </h1>
                        <p className="text-[#3d5a99] text-xs tracking-widest uppercase">
                            Blazing fast · Parallel · Resumable
                        </p>
                    </div>

                    {/* Divider */}
                    <div className="w-full border-t border-[#2a3f7a]" />

                    {/* Feature grid */}
                    <div className="w-full grid grid-cols-2 gap-4">
                        {features.map(({ icon, label, desc }) => (
                            <div
                                key={label}
                                className="bg-[#0f1a3d] border border-[#2a3f7a] rounded-xl px-5 py-4 flex flex-col gap-2 group hover:border-[#4d7fd4] transition-colors duration-200"
                            >
                                <div className="flex items-center gap-2">
                                    <span className="text-base">{icon}</span>
                                    <span className="text-[#7a9fd4] text-xs font-bold tracking-widest uppercase group-hover:text-[#dce8ff] transition-colors">
                                        {label}
                                    </span>
                                </div>
                                <p className="text-[#3d5a99] text-xs leading-relaxed group-hover:text-[#7a9fd4] transition-colors">
                                    {desc}
                                </p>
                            </div>
                        ))}
                    </div>

                    {/* Divider */}
                    <div className="w-full border-t border-[#2a3f7a]" />

                    {/* CTA */}
                    <div className="flex flex-col items-center gap-3 w-full">
                        <button
                            onClick={() => navigate("/browser")}
                            className="w-full max-w-xs bg-[#1843cf] hover:bg-[#2554e0] active:bg-[#0f32a8] text-white text-sm font-bold tracking-widest uppercase px-8 py-3 rounded-lg border-2 border-blue-600 transition-all duration-200 hover:scale-105"
                            style={{
                                boxShadow: "0 0 0 0 rgba(29,67,207,0.5)",
                                animation: "ctaPulse 2.5s ease-in-out infinite",
                            }}
                        >
                            ↓ &nbsp; Get Started
                        </button>
                        <span className="text-[#2a3f7a] text-xs tracking-widest uppercase">
                            press to launch downloader
                        </span>
                    </div>

                </div>

                {/* Footer strip */}
                <div className="px-6 py-3 bg-[#0f1a3d] border-t border-[#2a3f7a] flex justify-between items-center">
                    <span className="text-[#2a3f7a] text-xs tracking-widest uppercase">sys: ready</span>
                    <span className="text-[#2a3f7a] text-xs tracking-widest uppercase">● online</span>
                </div>
            </div>

            {/* Keyframe styles injected inline */}
            <style>{`
                @keyframes spin {
                    from { transform: rotate(0deg); }
                    to { transform: rotate(360deg); }
                }
                @keyframes ctaPulse {
                    0%, 100% { box-shadow: 0 0 8px 2px rgba(29,67,207,0.4); }
                    50% { box-shadow: 0 0 18px 6px rgba(29,67,207,0.7); }
                }
            `}</style>
        </div>
    )
}

export default Home