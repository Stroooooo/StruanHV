"use client"

import { useEffect, useRef, useState, Suspense } from "react"
import { useSearchParams } from "next/navigation"
import { venv } from "@/config/env"
import { Button } from "@/components/ui/button"
import { Spinner } from "@/components/ui/shadcn-io/spinner"
import { ArrowLeft, Maximize, Play, Square } from "lucide-react"

function ConsoleView() {
    const searchParams = useSearchParams()
    const server = searchParams.get("server")
    const vmName = searchParams.get("vm")

    const containerRef = useRef<HTMLDivElement>(null)
    const displayRef = useRef<HTMLDivElement | null>(null)
    const clientRef = useRef<any>(null)
    const resizeObserverRef = useRef<ResizeObserver | null>(null)
    const [status, setStatus] = useState<"loading" | "connected" | "disconnected" | "error">("loading")
    const [errorMsg, setErrorMsg] = useState("")
    const [vmAction, setVmAction] = useState<"idle" | "starting" | "stopping">("idle")

    const handleStartVM = async () => {
        if (!server || !vmName) return
        setVmAction("starting")
        try {
            const res = await fetch(venv.SERVER + `/vm/${server}/${encodeURIComponent(vmName)}/start`, {
                method: "POST",
                credentials: "include",
            })
            if (!res.ok) throw new Error("Failed to start VM")
        } catch (err) {
            console.error("VM start failed:", err)
        } finally {
            setVmAction("idle")
        }
    }

    const handleStopVM = async () => {
        if (!server || !vmName) return
        setVmAction("stopping")
        try {
            const res = await fetch(venv.SERVER + `/vm/${server}/${encodeURIComponent(vmName)}/stop`, {
                method: "POST",
                credentials: "include",
            })
            if (!res.ok) throw new Error("Failed to stop VM")
        } catch (err) {
            console.error("VM stop failed:", err)
        } finally {
            setVmAction("idle")
        }
    }

    useEffect(() => {
        if (!server || !vmName) return

        let cancelled = false

        const connect = async () => {
            try {
                const res = await fetch(venv.SERVER + `/vm/${server}/${encodeURIComponent(vmName)}/console-token`, {
                    method: "GET",
                    credentials: "include",
                    headers: { "Content-Type": "application/json" }
                })

                if (!res.ok) throw new Error("Failed to get console token")

                const data = await res.json()
                if (cancelled) return

                const Guacamole = (await import("guacamole-common-js")).default

                const wsProtocol = window.location.protocol === "https:" ? "wss:" : "ws:"
                const wsUrl = `${wsProtocol}//${window.location.host}/ws/?token=${encodeURIComponent(data.token)}`

                const tunnel = new Guacamole.WebSocketTunnel(wsUrl)
                const client = new Guacamole.Client(tunnel)
                clientRef.current = client

                client.onstatechange = (state: number) => {
                    // 3 = connected, 5 = disconnected
                    if (state === 3) setStatus("connected")
                    if (state === 5) setStatus("disconnected")
                }

                client.onerror = (error: any) => {
                    setStatus("error")
                    setErrorMsg(error?.message || "Connection error")
                }

                if (containerRef.current) {
                    const guacDisplay = document.createElement("div")
                    guacDisplay.style.width = "100%"
                    guacDisplay.style.height = "100%"
                    containerRef.current.appendChild(guacDisplay)
                    displayRef.current = guacDisplay

                    const display = client.getDisplay()
                    const displayElement = display.getElement()
                    guacDisplay.appendChild(displayElement)

                    // Scale display to fit container
                    const scaleDisplay = () => {
                        const containerWidth = guacDisplay.offsetWidth
                        const containerHeight = guacDisplay.offsetHeight
                        const displayWidth = display.getWidth()
                        const displayHeight = display.getHeight()

                        if (displayWidth && displayHeight) {
                            const scale = Math.min(
                                containerWidth / displayWidth,
                                containerHeight / displayHeight
                            )
                            display.scale(scale)
                        }
                    }

                    // Re-scale on container resize
                    resizeObserverRef.current = new ResizeObserver(() => {
                        scaleDisplay()
                        const containerWidth = guacDisplay.offsetWidth
                        const containerHeight = guacDisplay.offsetHeight
                        if (containerWidth && containerHeight) {
                            client.sendSize(containerWidth, containerHeight)
                        }
                    })
                    resizeObserverRef.current.observe(guacDisplay)

                    // Re-scale when display size changes (e.g. after connect)
                    display.onresize = () => scaleDisplay()

                    // Keyboard input
                    const keyboard = new Guacamole.Keyboard(document)
                    keyboard.onkeydown = (keysym: number) => {
                        client.sendKeyEvent(1, keysym)
                    }
                    keyboard.onkeyup = (keysym: number) => {
                        client.sendKeyEvent(0, keysym)
                    }

                    // Mouse input
                    const mouse = new Guacamole.Mouse(displayElement)
                    mouse.onmousedown = mouse.onmouseup = mouse.onmousemove = (mouseState: any) => {
                        client.sendMouseState(mouseState)
                    }

                    // Touch input
                    const touch = new Guacamole.Mouse.Touchscreen(displayElement)
                    touch.onmousedown = touch.onmouseup = touch.onmousemove = (mouseState: any) => {
                        client.sendMouseState(mouseState)
                    }
                }

                client.connect("")

            } catch (err: any) {
                if (!cancelled) {
                    setStatus("error")
                    setErrorMsg(err.message || "Failed to connect")
                }
            }
        }

        connect()

        return () => {
            cancelled = true
            if (resizeObserverRef.current) {
                resizeObserverRef.current.disconnect()
                resizeObserverRef.current = null
            }
            if (clientRef.current) {
                clientRef.current.disconnect()
            }
            if (displayRef.current && containerRef.current) {
                containerRef.current.removeChild(displayRef.current)
                displayRef.current = null
            }
        }
    }, [server, vmName])

    const handleFullscreen = () => {
        containerRef.current?.requestFullscreen()
    }

    const handleCtrlAltDel = () => {
        const client = clientRef.current
        if (!client) return
        client.sendKeyEvent(1, 0xFFE3) // Ctrl down
        client.sendKeyEvent(1, 0xFFE9) // Alt down
        client.sendKeyEvent(1, 0xFFFF) // Delete down
        client.sendKeyEvent(0, 0xFFFF) // Delete up
        client.sendKeyEvent(0, 0xFFE9) // Alt up
        client.sendKeyEvent(0, 0xFFE3) // Ctrl up
    }

    if (!server || !vmName) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <p>Missing server or VM name parameters.</p>
            </div>
        )
    }

    return (
        <div className="flex flex-col h-screen bg-black">
            <div className="flex items-center gap-2 p-2 bg-zinc-900 text-white">
                <Button variant="ghost" size="sm" onClick={() => window.close()}>
                    <ArrowLeft className="size-4 mr-1" /> Close
                </Button>
                <span className="text-sm text-zinc-400 mx-2">|</span>
                <span className="text-sm font-medium truncate">{vmName}</span>
                <span className="text-sm text-zinc-400 mx-2">|</span>
                <span className={`text-xs px-2 py-0.5 rounded ${
                    status === "connected" ? "bg-green-700" :
                    status === "loading" ? "bg-yellow-700" :
                    "bg-red-700"
                }`}>
                    {status}
                </span>
                <div className="ml-auto flex items-center gap-1">
                    <Button variant="ghost" size="sm" onClick={handleStartVM} disabled={vmAction !== "idle"} title="Start VM">
                        <Play className="size-4 mr-1" />
                        {vmAction === "starting" ? "Starting..." : "Start"}
                    </Button>
                    <Button variant="ghost" size="sm" onClick={handleStopVM} disabled={vmAction !== "idle"} title="Stop VM">
                        <Square className="size-4 mr-1" />
                        {vmAction === "stopping" ? "Stopping..." : "Stop"}
                    </Button>
                    <span className="text-sm text-zinc-400 mx-1">|</span>
                    <Button variant="ghost" size="sm" onClick={handleCtrlAltDel} title="Send Ctrl+Alt+Del">
                        Ctrl+Alt+Del
                    </Button>
                    <Button variant="ghost" size="sm" onClick={handleFullscreen} title="Fullscreen">
                        <Maximize className="size-4" />
                    </Button>
                    <span className="text-sm text-zinc-400 mx-1">| Made by Struan McLean</span>
                </div>
            </div>
            <div className="flex-1 overflow-hidden relative">
                <div ref={containerRef} className="absolute inset-0" />
                {status !== "connected" && (
                    <div className="absolute inset-0 flex items-center justify-center">
                        {status === "loading" && (
                            <div className="flex flex-col items-center gap-3 text-white">
                                <Spinner />
                                <p>Connecting to VM console...</p>
                            </div>
                        )}
                        {status === "error" && (
                            <div className="flex flex-col items-center gap-3 text-white">
                                <p className="text-red-400">Connection failed: {errorMsg}</p>
                                <Button variant="outline" onClick={() => window.location.reload()}>
                                    Retry
                                </Button>
                            </div>
                        )}
                        {status === "disconnected" && (
                            <div className="flex flex-col items-center gap-3 text-white">
                                <p>Disconnected from VM.</p>
                                <Button variant="outline" onClick={() => window.location.reload()}>
                                    Reconnect
                                </Button>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    )
}

export default function ConsolePage() {
    return (
        <Suspense fallback={
            <div className="flex items-center justify-center min-h-screen bg-black text-white">
                <Spinner />
            </div>
        }>
            <ConsoleView />
        </Suspense>
    )
}
