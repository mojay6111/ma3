"use client"
import { useEffect, useState } from "react"
import { fetchLeaderboard } from "@/lib/api"

interface Entry {
  rank: number
  name: string
  score: number
  wallet: number
}

export default function Leaderboard() {
  const [data, setData] = useState<Entry[]>([])

  useEffect(() => {
    fetchLeaderboard().then(setData)
    const i = setInterval(() => fetchLeaderboard().then(setData), 15000)
    return () => clearInterval(i)
  }, [])

  const badge = (score: number) => {
    if (score >= 80) return "bg-green-900 text-green-300"
    if (score >= 50) return "bg-yellow-900 text-yellow-300"
    return "bg-red-900 text-red-300"
  }

  const status = (score: number) =>
    score >= 80 ? "Safe" : score >= 50 ? "Monitor" : "Flagged"

  return (
    <div className="bg-gray-900 rounded-xl p-4">
      <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">
        Driver Leaderboard
      </h2>
      {data.length === 0 ? (
        <p className="text-gray-600 text-sm">No drivers seeded yet.</p>
      ) : (
        <div className="space-y-2">
          {data.map((d) => (
            <div key={d.rank} className="flex items-center justify-between
              bg-gray-800 rounded-lg px-3 py-2">
              <div className="flex items-center gap-3">
                <span className="text-gray-500 text-xs w-4">#{d.rank}</span>
                <span className="text-sm font-medium">{d.name}</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-xs text-gray-400">
                  KSh {d.wallet.toLocaleString()}
                </span>
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${badge(d.score)}`}>
                  {d.score.toFixed(0)}/100 · {status(d.score)}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
