"use client"
import { useEffect, useState } from "react"
import { predictDemand } from "@/lib/api"
import { DemandResponse } from "@/types"

const ROUTES = ["46 CBD-Westlands", "34 CBD-Kangemi", "58 CBD-Kikuyu"]

interface RouteLoad {
  route: string
  data: DemandResponse
}

const loadColor = (level: string) => ({
  high:   "bg-red-500",
  medium: "bg-yellow-500",
  low:    "bg-green-500",
}[level] || "bg-gray-500")

const loadWidth = (pax: number) =>
  `${Math.min(100, (pax / 100) * 100).toFixed(0)}%`

export default function DemandPanel() {
  const [loads, setLoads] = useState<RouteLoad[]>([])
  const now = new Date()

  useEffect(() => {
    async function fetch() {
      const results = await Promise.all(
        ROUTES.map(async (route) => ({
          route,
          data: await predictDemand({
            route,
            hour: now.getHours(),
            day_of_week: now.getDay(),
            is_holiday: 0
          })
        }))
      )
      setLoads(results)
    }
    fetch()
    const i = setInterval(fetch, 30000)
    return () => clearInterval(i)
  }, [])

  return (
    <div className="bg-gray-900 rounded-xl p-4">
      <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">
        Route Demand Forecast
      </h2>
      <div className="space-y-4">
        {loads.map(({ route, data }) => (
          <div key={route}>
            <div className="flex justify-between text-xs mb-1">
              <span className="text-gray-300">{route}</span>
              <span className="text-gray-400">
                {data.expected_pax} pax ·{" "}
                <span className={
                  data.load_level === "high" ? "text-red-400" :
                  data.load_level === "medium" ? "text-yellow-400" : "text-green-400"
                }>
                  {data.load_level.toUpperCase()}
                </span>
                {data.redeploy_alert && " 🚨"}
              </span>
            </div>
            <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-700 ${loadColor(data.load_level)}`}
                style={{ width: loadWidth(data.expected_pax) }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
