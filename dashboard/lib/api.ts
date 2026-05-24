const BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"

async function safeFetch(url: string, options?: RequestInit) {
  try {
    const res = await fetch(url, options)
    if (!res.ok) return null
    return res.json()
  } catch {
    return null
  }
}

export async function fetchLiveVehicles() {
  return await safeFetch(`${BASE}/telemetry/live`, { cache: "no-store" }) ?? []
}

export async function fetchDrivers() {
  return await safeFetch(`${BASE}/drivers`, { cache: "no-store" }) ?? []
}

export async function fetchLeaderboard() {
  return await safeFetch(`${BASE}/drivers/leaderboard`, { cache: "no-store" }) ?? []
}

export async function predictETA(payload: {
  stop_name: string; hour: number; day_of_week: number
  pax_count: number; speed_kmh: number; is_peak: number; stop_sequence: number
}) {
  return await safeFetch(`${BASE}/predict/eta`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  })
}

export async function predictDemand(payload: {
  route: string; hour: number; day_of_week: number; is_holiday: number
}) {
  return await safeFetch(`${BASE}/predict/demand`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  })
}
