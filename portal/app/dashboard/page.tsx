"use client"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import dynamic from "next/dynamic"
import { getMe, getMyVehicles, getMyDrivers, getLeaderboard, getLiveVehicles } from "@/lib/api"
import { api } from "@/lib/api"
import {
  Bus, Users, TrendingUp, MapPin, LogOut,
  AlertTriangle, CheckCircle, Clock, Phone,
  Star, Activity, Shield, Plus, Link2
} from "lucide-react"
import Ma3Logo from "@/components/Ma3Logo"
import AddVehicleModal from "@/components/AddVehicleModal"
import AddDriverModal from "@/components/AddDriverModal"
import AssignVehicleModal from "@/components/AssignVehicleModal"
import AddRouteModal from "@/components/AddRouteModal"
import toast from "react-hot-toast"

const PortalMap = dynamic(() => import("@/components/PortalMap"), { ssr: false })

export default function DashboardPage() {
  const router = useRouter()
  const [manager, setManager]             = useState<any>(null)
  const [vehicles, setVehicles]           = useState<any[]>([])
  const [drivers, setDrivers]             = useState<any[]>([])
  const [routes, setRoutes]               = useState<any[]>([])
  const [leaderboard, setLeaderboard]     = useState<any[]>([])
  const [liveVehicles, setLiveVehicles]   = useState<any[]>([])
  const [loading, setLoading]             = useState(true)
  const [tab, setTab]                     = useState<"overview"|"vehicles"|"drivers"|"routes">("overview")
  const [showAddVehicle, setShowAddVehicle] = useState(false)
  const [showAddDriver, setShowAddDriver]   = useState(false)
  const [showAddRoute, setShowAddRoute]     = useState(false)
  const [selectedVehicle, setSelectedVehicle] = useState<any>(null)

  useEffect(() => {
    const token = localStorage.getItem("ma3_token")
    if (!token) { router.push("/login"); return }
    fetchAll()
    const interval = setInterval(fetchLive, 10000)
    return () => clearInterval(interval)
  }, [])

  const fetchAll = async () => {
    try {
      const [me, v, d, lb, lv, r] = await Promise.all([
        getMe(), getMyVehicles(), getMyDrivers(),
        getLeaderboard(), getLiveVehicles(),
        api.get("/routes/")
      ])
      setManager(me.data)
      setVehicles(v.data)
      setDrivers(d.data)
      setLeaderboard(lb.data)
      setLiveVehicles(lv.data)
      setRoutes(r.data)
    } catch { router.push("/login") }
    finally { setLoading(false) }
  }

  const fetchLive = async () => {
    try { const lv = await getLiveVehicles(); setLiveVehicles(lv.data) } catch {}
  }

  const scoreColor = (s: number) => s >= 80 ? "text-teal-600"   : s >= 50 ? "text-yellow-600"   : "text-red-500"
  const scoreBg    = (s: number) => s >= 80 ? "bg-teal-50"      : s >= 50 ? "bg-yellow-50"      : "bg-red-50"
  const scoreLabel = (s: number) => s >= 80 ? "Safe"            : s >= 50 ? "Monitor"           : "Flagged"
  const scoreBadge = (s: number) => s >= 80 ? "ma3-badge-safe"  : s >= 50 ? "ma3-badge-monitor" : "ma3-badge-flagged"
  const ScoreIcon  = (s: number) => s >= 80 ? CheckCircle       : s >= 50 ? Clock               : AlertTriangle

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-gray-400 text-sm">Loading your dashboard...</div>
    </div>
  )

  const flagged   = drivers.filter((d: any) => d.score < 50).length
  const avgScore  = drivers.length
    ? Math.round(drivers.reduce((a: number, d: any) => a + d.score, 0) / drivers.length) : 0
  const activeNow = liveVehicles.filter((v: any) => v.lat && v.lng).length
  const mapVehicles = liveVehicles.filter((v: any) => v.lat && v.lng).map((v: any) => ({
    id: v.id, plate: v.plate, lat: v.lat, lng: v.lng, stop: v.stop || "", score: v.score || 0
  }))

  const TABS = [
    { key: "overview",  label: "📊 Overview" },
    { key: "vehicles",  label: "🚌 Vehicles" },
    { key: "drivers",   label: "👤 Drivers" },
    { key: "routes",    label: "🗺️ Routes" },
  ]

  return (
    <div className="min-h-screen bg-gray-50">

      {/* Topbar */}
      <div className="ma3-topbar">
        <div className="flex items-center gap-3">
          <Ma3Logo/>
          <div>
            <p className="font-black text-gray-900 text-sm">{manager?.name}</p>
            <p className="text-xs text-gray-400 flex items-center gap-1">
              <Shield size={10} className="text-orange-400"/> SACCO Manager
            </p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-1.5 text-xs font-semibold
            text-teal-600 bg-teal-50 px-3 py-1.5 rounded-full">
            <div className="pulse-dot w-2 h-2"/> {activeNow} active
          </span>
          <button onClick={() => { localStorage.clear(); router.push("/login") }}
            className="text-gray-400 hover:text-red-500 transition-colors">
            <LogOut size={16}/>
          </button>
        </div>
      </div>

      {/* Hero */}
      <div className="matatu-stripe-header px-6 py-6 relative z-10">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-white text-2xl font-black">
              Habari, {manager?.name?.split(" ")[0]}! 👋
            </h1>
            <p className="text-orange-200 text-sm mt-0.5">
              {new Date().toLocaleDateString("en-KE", {
                weekday: "long", day: "numeric", month: "long"
              })} · Nairobi
            </p>
          </div>
          {flagged > 0 && (
            <div className="bg-red-500 text-white px-4 py-2 rounded-xl
              flex items-center gap-2 text-sm font-bold animate-pulse">
              <AlertTriangle size={16}/> {flagged} driver{flagged > 1 ? "s" : ""} flagged
            </div>
          )}
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-8">

        {/* KPI Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {[
            { label: "Total Vehicles",   value: vehicles.length,   icon: Bus,           color: "text-blue-600",   bg: "bg-blue-50",   stripe: "ma3-stat-purple", border: "border-blue-100" },
            { label: "Total Drivers",    value: drivers.length,    icon: Users,         color: "text-purple-600", bg: "bg-purple-50", stripe: "ma3-stat-purple", border: "border-purple-100" },
            { label: "Avg Driver Score", value: `${avgScore}/100`, icon: Star,          color: "text-orange-500", bg: "bg-orange-50", stripe: "ma3-stat-orange", border: "border-orange-100" },
            { label: "Flagged Drivers",  value: flagged,           icon: AlertTriangle,
              color:  flagged > 0 ? "text-red-500"   : "text-teal-600",
              bg:     flagged > 0 ? "bg-red-50"      : "bg-teal-50",
              stripe: flagged > 0 ? "ma3-stat-red"   : "ma3-stat-teal",
              border: flagged > 0 ? "border-red-100" : "border-teal-100" },
          ].map(k => (
            <div key={k.label} className={`ma3-stat-card ${k.stripe} border ${k.border}`}>
              <div className={`w-10 h-10 ${k.bg} rounded-xl flex items-center justify-center mb-3`}>
                <k.icon size={20} className={k.color}/>
              </div>
              <p className={`text-2xl font-black ${k.color}`}>{k.value}</p>
              <p className="text-xs text-gray-500 font-medium mt-0.5">{k.label}</p>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div className="flex gap-1 bg-gray-100 rounded-xl p-1 mb-6 w-fit">
          {TABS.map(t => (
            <button key={t.key} onClick={() => setTab(t.key as any)}
              className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all
                ${tab === t.key ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"}`}>
              {t.label}
            </button>
          ))}
        </div>

        {/* ── OVERVIEW ── */}
        {tab === "overview" && (
          <div className="space-y-4">
            <div className="ma3-card p-5">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="font-black text-gray-900 text-sm flex items-center gap-2">
                    <MapPin size={15} className="text-orange-500"/> Live Fleet Map
                  </h3>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {activeNow} vehicles active · updates every 10s
                  </p>
                </div>
                <div className="flex items-center gap-2 text-xs text-gray-400">
                  <span className="w-2.5 h-2.5 rounded-full bg-teal-500 inline-block"/> Safe
                  <span className="w-2.5 h-2.5 rounded-full bg-yellow-400 inline-block ml-2"/> Monitor
                  <span className="w-2.5 h-2.5 rounded-full bg-red-500 inline-block ml-2"/> Flagged
                </div>
              </div>
              <PortalMap vehicles={mapVehicles}/>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="ma3-card p-5">
                <h3 className="font-black text-gray-900 text-sm mb-4 flex items-center gap-2">
                  <Activity size={15} className="text-orange-500"/> Vehicle Status
                </h3>
                <div className="space-y-2">
                  {liveVehicles.length === 0 ? (
                    <div className="text-center py-6">
                      <Bus size={28} className="text-gray-200 mx-auto mb-2"/>
                      <p className="text-gray-400 text-sm">No live vehicles. Run GPS simulator.</p>
                    </div>
                  ) : liveVehicles.map((v: any) => (
                    <div key={v.id} className="flex items-center justify-between
                      bg-gray-50 rounded-xl px-3 py-2.5 border border-gray-100">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                          <Bus size={13} className="text-blue-600"/>
                        </div>
                        <div>
                          <p className="text-sm font-bold text-gray-900">{v.plate}</p>
                          <p className="text-xs text-gray-400 flex items-center gap-1">
                            <MapPin size={9}/> {v.stop || "en route"}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {v.score && (
                          <span className={`text-xs font-bold px-2 py-1 rounded-lg
                            ${scoreBg(v.score)} ${scoreColor(v.score)}`}>
                            {Math.round(v.score)}/100
                          </span>
                        )}
                        <div className="pulse-dot"/>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="ma3-card p-5">
                <h3 className="font-black text-gray-900 text-sm mb-4 flex items-center gap-2">
                  <TrendingUp size={15} className="text-teal-500"/> Driver Leaderboard
                </h3>
                <div className="space-y-2">
                  {leaderboard.slice(0,5).map((d: any, i: number) => {
                    const Icon = ScoreIcon(d.score)
                    return (
                      <div key={d.name} className="flex items-center gap-3
                        bg-gray-50 rounded-xl px-3 py-2.5 border border-gray-100">
                        <span className="text-sm w-6 text-center">
                          {i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : `#${i+1}`}
                        </span>
                        <div className={`w-8 h-8 ${scoreBg(d.score)} rounded-lg
                          flex items-center justify-center flex-shrink-0`}>
                          <Icon size={14} className={scoreColor(d.score)}/>
                        </div>
                        <p className="text-sm font-semibold text-gray-800 flex-1 truncate">{d.name}</p>
                        <span className={`text-xs font-bold px-2 py-1 rounded-lg ${scoreBadge(d.score)}`}>
                          {Math.round(d.score)}/100
                        </span>
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── VEHICLES ── */}
        {tab === "vehicles" && (
          <div className="space-y-3">
            <div className="flex justify-between items-center mb-2">
              <p className="text-sm text-gray-500">{vehicles.length} vehicles registered</p>
              <button onClick={() => setShowAddVehicle(true)}
                className="ma3-btn-primary text-sm flex items-center gap-1.5 px-4 py-2">
                <Plus size={14}/> Add Vehicle
              </button>
            </div>
            {vehicles.length === 0 ? (
              <div className="ma3-card p-16 text-center">
                <Bus size={40} className="text-gray-200 mx-auto mb-3"/>
                <p className="font-bold text-gray-500">No vehicles registered yet.</p>
                <button onClick={() => setShowAddVehicle(true)}
                  className="ma3-btn-primary text-sm mt-4 flex items-center gap-1.5 mx-auto px-4 py-2">
                  <Plus size={14}/> Add your first vehicle
                </button>
              </div>
            ) : vehicles.map((v: any) => (
              <div key={v.id} className="ma3-card p-5 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-100 to-blue-50
                    rounded-xl flex items-center justify-center">
                    <Bus size={20} className="text-blue-600"/>
                  </div>
                  <div>
                    <p className="font-black text-gray-900 text-lg">{v.plate}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <p className="text-xs text-gray-400">
                        {v.capacity ? `${v.capacity} seats` : "—"}
                      </p>
                      {v.driver_name && (
                        <span className="text-xs bg-purple-100 text-purple-600
                          px-2 py-0.5 rounded-full font-medium">
                          👤 {v.driver_name}
                        </span>
                      )}
                      {v.route_name && (
                        <span className="route-board text-xs">{v.route_name}</span>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={() => setSelectedVehicle(v)}
                    className={`text-xs px-3 py-1.5 rounded-xl font-bold
                      flex items-center gap-1 transition-colors
                      ${v.driver_name
                        ? "bg-yellow-100 text-yellow-700 hover:bg-yellow-200"
                        : "bg-teal-100 text-teal-700 hover:bg-teal-200"}`}>
                    <Link2 size={12}/>
                    {v.driver_name ? "Reassign" : "Assign"}
                  </button>
                  <span className={`text-xs px-3 py-1.5 rounded-full font-bold
                    ${v.is_active ? "ma3-badge-approved" : "ma3-badge-rejected"}`}>
                    {v.is_active ? "● Active" : "○ Inactive"}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ── DRIVERS ── */}
        {tab === "drivers" && (
          <div className="space-y-3">
            <div className="flex justify-between items-center mb-2">
              <p className="text-sm text-gray-500">{drivers.length} drivers registered</p>
              <button onClick={() => setShowAddDriver(true)}
                className="ma3-btn-primary text-sm flex items-center gap-1.5 px-4 py-2">
                <Plus size={14}/> Add Driver
              </button>
            </div>
            {drivers.length === 0 ? (
              <div className="ma3-card p-16 text-center">
                <Users size={40} className="text-gray-200 mx-auto mb-3"/>
                <p className="font-bold text-gray-500">No drivers registered yet.</p>
              </div>
            ) : drivers.map((d: any) => {
              const Icon = ScoreIcon(d.score)
              return (
                <div key={d.id} className="ma3-card p-5 flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className={`w-12 h-12 ${scoreBg(d.score)} rounded-xl
                      flex items-center justify-center`}>
                      <Icon size={20} className={scoreColor(d.score)}/>
                    </div>
                    <div>
                      <p className="font-black text-gray-900">{d.name}</p>
                      <div className="flex items-center gap-3 mt-0.5">
                        <span className="flex items-center gap-1 text-xs text-gray-400">
                          <Phone size={10}/> {d.phone}
                        </span>
                        <span className="text-xs text-gray-400">
                          💰 KSh {d.wallet_kes?.toLocaleString() || 0}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <p className={`font-black text-lg ${scoreColor(d.score)}`}>
                      {Math.round(d.score)}/100
                    </p>
                    <span className={`text-xs px-3 py-1.5 rounded-full font-bold ${scoreBadge(d.score)}`}>
                      {scoreLabel(d.score)}
                    </span>
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* ── ROUTES ── */}
        {tab === "routes" && (
          <div className="space-y-3">
            <div className="flex justify-between items-center mb-2">
              <p className="text-sm text-gray-500">{routes.length} routes defined</p>
              <button onClick={() => setShowAddRoute(true)}
                className="ma3-btn-teal text-sm flex items-center gap-1.5 px-4 py-2">
                <Plus size={14}/> Create Route
              </button>
            </div>
            {routes.length === 0 ? (
              <div className="ma3-card p-16 text-center">
                <MapPin size={40} className="text-gray-200 mx-auto mb-3"/>
                <p className="font-bold text-gray-500">No routes created yet.</p>
                <p className="text-gray-400 text-sm mt-1">
                  Routes appear in driver USSD menu automatically.
                </p>
                <button onClick={() => setShowAddRoute(true)}
                  className="ma3-btn-teal text-sm mt-4 flex items-center gap-1.5 mx-auto px-4 py-2">
                  <Plus size={14}/> Create your first route
                </button>
              </div>
            ) : routes.map((r: any) => (
              <div key={r.id} className="ma3-card p-5 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-teal-100 to-teal-50
                    rounded-xl flex items-center justify-center">
                    <MapPin size={20} className="text-teal-600"/>
                  </div>
                  <div>
                    <p className="font-black text-gray-900 text-lg">{r.name}</p>
                    <p className="text-xs text-gray-400">{r.sacco}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="route-board">KSh {r.fare_kes}</span>
                  <span className="text-xs ma3-badge-approved px-3 py-1.5 rounded-full font-bold">
                    ● Active
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}

      </div>

      {/* Modals */}
      {showAddVehicle && (
        <AddVehicleModal onClose={() => setShowAddVehicle(false)} onSuccess={fetchAll}/>
      )}
      {showAddDriver && (
        <AddDriverModal onClose={() => setShowAddDriver(false)} onSuccess={fetchAll}/>
      )}
      {showAddRoute && (
        <AddRouteModal onClose={() => setShowAddRoute(false)} onSuccess={fetchAll}/>
      )}
      {selectedVehicle && (
        <AssignVehicleModal
          vehicle={selectedVehicle}
          onClose={() => setSelectedVehicle(null)}
          onSuccess={fetchAll}
        />
      )}
    </div>
  )
}
