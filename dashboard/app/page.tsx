"use client"
import dynamic from "next/dynamic"
import { useEffect, useState } from "react"
import { useWebSocket } from "@/hooks/useWebSocket"
import { fetchLiveVehicles } from "@/lib/api"
import { Vehicle } from "@/types"
import StatCard from "@/components/StatCard"
import Leaderboard from "@/components/Leaderboard"
import DemandPanel from "@/components/DemandPanel"
import LiveFeed from "@/components/LiveFeed"

const FleetMap = dynamic(() => import("@/components/FleetMap"), { ssr: false })

export default function Dashboard() {
  const { events, connected } = useWebSocket()
  const [vehicles, setVehicles] = useState<Vehicle[]>([])
  const now = new Date()

  useEffect(() => {
    fetchLiveVehicles().then(setVehicles)
    const i = setInterval(() => fetchLiveVehicles().then(setVehicles), 10000)
    return () => clearInterval(i)
  }, [])

  const activeVehicles = vehicles.filter(v => v.lat && v.lng).length
  const avgScore = vehicles.length
    ? (vehicles.reduce((a, v) => a + (v.score || 0), 0) / vehicles.length).toFixed(0)
    : "—"
  const flagged = vehicles.filter(v => v.score < 50).length

  return (
    <div className="min-h-screen bg-gray-950 p-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">
            Ma3 <span className="text-blue-400">Dashboard</span>
          </h1>
          <p className="text-xs text-gray-500 mt-0.5">
            {now.toLocaleDateString("en-KE", {
              weekday: "long", day: "numeric", month: "long"
            })} · Nairobi SACCO Operations
          </p>
        </div>
        <div className="flex items-center gap-2 text-xs">
          <span className={`px-3 py-1 rounded-full font-medium ${
            connected
              ? "bg-green-900 text-green-300"
              : "bg-red-900 text-red-300"
          }`}>
            {connected ? "● Live" : "○ Offline"}
          </span>
        </div>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <StatCard
          label="Active Vehicles"
          value={activeVehicles}
          sub="on route now"
          color="blue"
        />
        <StatCard
          label="Fleet Avg Score"
          value={avgScore === "—" ? "—" : `${avgScore}/100`}
          sub="driver safety"
          color="green"
        />
        <StatCard
          label="Flagged Drivers"
          value={flagged}
          sub="need review"
          color={flagged > 0 ? "red" : "green"}
        />
        <StatCard
          label="Live Events"
          value={events.length}
          sub="last 50 pings"
          color="yellow"
        />
      </div>

      {/* Main grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Map — takes 2 cols */}
        <div className="lg:col-span-2 bg-gray-900 rounded-xl p-2"
          style={{ minHeight: 340 }}>
          <FleetMap vehicles={vehicles} events={events} />
        </div>

        {/* Right column */}
        <div className="flex flex-col gap-4">
          <DemandPanel />
          <LiveFeed events={events} connected={connected} />
        </div>
      </div>

      {/* Leaderboard */}
      <div className="mt-4">
        <Leaderboard />
      </div>
    </div>
  )
}
