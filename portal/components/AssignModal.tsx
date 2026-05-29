"use client"
import { useState, useEffect } from "react"
import { api } from "@/lib/api"
import toast from "react-hot-toast"
import { X, Link2 } from "lucide-react"

export default function AssignModal({
  onClose, onSuccess
}: { onClose: () => void; onSuccess: () => void }) {
  const [vehicles, setVehicles] = useState<any[]>([])
  const [drivers,  setDrivers]  = useState<any[]>([])
  const [routes,   setRoutes]   = useState<any[]>([])
  const [vehicleId, setVehicleId] = useState("")
  const [driverId,  setDriverId]  = useState("")
  const [routeId,   setRouteId]   = useState("")
  const [loading,   setLoading]   = useState(false)
  const [ready,     setReady]     = useState(false)
  const [error,     setError]     = useState("")

  useEffect(() => {
    Promise.all([
      api.get("/vehicles/"),
      api.get("/drivers/"),
      api.get("/routes/"),
    ]).then(([v, d, r]) => {
      setVehicles(v.data || [])
      setDrivers(d.data  || [])
      setRoutes(r.data   || [])
      setReady(true)
    })
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    if (!vehicleId) { setError("Please select a vehicle"); return }
    if (!driverId)  { setError("Please select a driver");  return }
    setLoading(true)
    try {
      await api.patch(`/vehicles/${vehicleId}/assign`, {
        driver_id: driverId,
        route_id:  routeId || null
      })
      const v = vehicles.find(x => x.id === vehicleId)
      const d = drivers.find(x => x.id === driverId)
      toast.success(`${v?.plate} → ${d?.name} assigned! 🚌`)
      onSuccess()
      onClose()
    } catch (err: any) {
      const msg = err.response?.data?.detail || "Assignment failed"
      setError(msg)
      toast.error(msg)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl">
        <div className="h-1.5 rounded-t-2xl bg-gradient-to-r from-blue-400 via-teal-400 to-green-400"/>
        <div className="p-6 pb-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-teal-100 rounded-xl flex items-center justify-center">
              <Link2 size={20} className="text-teal-600"/>
            </div>
            <div>
              <h2 className="font-black text-gray-900">Assign Vehicle</h2>
              <p className="text-xs text-gray-400">Link a driver and route to a vehicle</p>
            </div>
          </div>
          <button type="button" onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X size={20}/>
          </button>
        </div>

        {!ready ? (
          <div className="px-6 pb-8 text-center text-gray-400 text-sm py-8">
            Loading fleet data...
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="px-6 pb-6 space-y-4">

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                🚌 Vehicle
              </label>
              <select value={vehicleId} onChange={e => setVehicleId(e.target.value)}
                className="ma3-input bg-white">
                <option value="">Select vehicle...</option>
                {vehicles.map((v: any) => (
                  <option key={v.id} value={v.id}>
                    {v.plate} — {v.capacity || 14} seats
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                👤 Driver
              </label>
              <select value={driverId} onChange={e => setDriverId(e.target.value)}
                className="ma3-input bg-white">
                <option value="">Select driver...</option>
                {drivers.map((d: any) => (
                  <option key={d.id} value={d.id}>
                    {d.name} — {d.phone}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                🗺️ Route <span className="text-gray-400 font-normal">(optional)</span>
              </label>
              <select value={routeId} onChange={e => setRouteId(e.target.value)}
                className="ma3-input bg-white">
                <option value="">No route assigned</option>
                {routes.map((r: any) => (
                  <option key={r.id} value={r.id}>
                    {r.name} — KSh {r.fare_kes}
                  </option>
                ))}
              </select>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-100 rounded-xl p-3">
                <p className="text-red-600 text-xs font-medium">{error}</p>
              </div>
            )}

            <div className="bg-blue-50 rounded-xl p-3 border border-blue-100">
              <p className="text-xs text-blue-700 font-medium">
                🔔 Driver receives an SMS confirming vehicle assignment.
              </p>
            </div>

            <div className="flex gap-3 pt-2">
              <button type="button" onClick={onClose}
                className="ma3-btn-ghost flex-1 py-2.5 text-sm">
                Cancel
              </button>
              <button type="submit" disabled={loading}
                className="ma3-btn-teal flex-1 py-2.5 text-sm">
                {loading ? "Assigning..." : "Assign 🔗"}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}
