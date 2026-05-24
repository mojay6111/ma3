"use client"
import { useEffect, useRef, useState } from "react"
import { TelemetryEvent } from "@/types"

export function useWebSocket() {
  const [events, setEvents] = useState<TelemetryEvent[]>([])
  const [connected, setConnected] = useState(false)
  const ws = useRef<WebSocket | null>(null)

  useEffect(() => {
    const url = process.env.NEXT_PUBLIC_WS_URL || "ws://localhost:8000/ws"

    function connect() {
      ws.current = new WebSocket(url)

      ws.current.onopen = () => setConnected(true)
      ws.current.onclose = () => {
        setConnected(false)
        setTimeout(connect, 3000) // reconnect
      }
      ws.current.onmessage = (e) => {
        try {
          const data = JSON.parse(e.data)
          if (data.event === "telemetry") {
            setEvents(prev => [data, ...prev].slice(0, 50))
          }
        } catch {}
      }
    }

    connect()
    return () => ws.current?.close()
  }, [])

  return { events, connected }
}
