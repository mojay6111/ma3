"use client"
import { TelemetryEvent } from "@/types"

interface Props {
  events: TelemetryEvent[]
  connected: boolean
}

export default function LiveFeed({ events, connected }: Props) {
  return (
    <div className="bg-gray-900 rounded-xl p-4">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider">
          Live Telemetry
        </h2>
        <span className={`flex items-center gap-1.5 text-xs ${
          connected ? "text-green-400" : "text-red-400"
        }`}>
          <span className={`w-2 h-2 rounded-full ${
            connected ? "bg-green-400 animate-pulse" : "bg-red-400"
          }`}/>
          {connected ? "Live" : "Reconnecting..."}
        </span>
      </div>
      <div className="space-y-1 max-h-48 overflow-y-auto">
        {events.length === 0 ? (
          <p className="text-gray-600 text-xs">
            Waiting for telemetry... Run simulate_gps.py
          </p>
        ) : (
          events.map((e, i) => (
            <div key={i} className="flex items-center gap-2 text-xs
              bg-gray-800 rounded px-2 py-1.5">
              <span className="text-gray-500 font-mono">
                {new Date(e.ts).toLocaleTimeString()}
              </span>
              <span className="text-blue-400 font-mono">
                {e.vehicle_id.slice(0, 8)}
              </span>
              <span className="text-gray-300">@ {e.stop_name || "en route"}</span>
              <span className="text-gray-500 ml-auto">
                {e.speed_kmh.toFixed(0)} km/h · {e.pax_count} pax
              </span>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
