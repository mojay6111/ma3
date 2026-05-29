"use client"
import { useState, useEffect } from "react"
import { api } from "@/lib/api"
import toast from "react-hot-toast"
import { X, Link2 } from "lucide-react"

interface Props {
  vehicle: any
  onClose: () => void
  onSuccess: () => void
}

export default function AssignVehicleModal({ vehicle, onClose, onSuccess }: Props) {
  const [drivers,  setDrivers]  = useState<any[]>([])
  const [routes,   setRoutes]   = useState<any[]>([])
  const [driverId, setDriverId] = useState(vehicle.driver_id || "")
  const [routeId,  setRouteId]  = useState(vehicle.route_id  || "")
  const [loading,  setLoading]  = useState(false)
  const [ready,    setReady]    = useState(false)
  const [error,    setError]    = useState("")

  useEffect(() => {
    Promise.all([api.get("/drivers/"), api.get("/routes/")])
      .then(([d, r]) => { setDrivers(d.data || []); setRoutes(r.data || []) })
      .finally(() => setReady(true))
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    if (!driverId) { setError("Please select a driver"); return }
    setLoading(true)
    try {
      await api.patch(`/vehicles/${vehicle.id}/assign`, {
        driver_id: driverId,
        route_id:  routeId || null
      })
      const d = drivers.find(x => x.id === driverId)
      toast.success(`${vehicle.plate} → ${d?.name}! SMS sent. 🚌`)
      onSuccess()
      onClose()
    } catch (err: any) {
      setError(err.response?.data?.detail || "Assignment failed")
    } finally {
      setLoading(false)
    }
  }

  const isReassign = !!vehicle.driver_name

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl">
        <div className={`h-1.5 rounded-t-2xl ${isReassign
          ? "bg-gradient-to-r from-yellow-400 via-orange-400 to-red-400"
          : "bg-gradient-to-r from-blue-400 via-teal-400 to-green-400"}`}/>

        <div className="p-6 pb-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center
              ${isReassign ? "bg-yellow-100" : "bg-teal-100"}`}>
              <Link2 size={20} className={isReassign ? "text-yellow-600" : "text-teal-600"}/>
            </div>
            <div>
              <h2 className="font-black text-gray-900">
                {isReassign ? "Reassign" : "Assign"} — {vehicle.plate}
              </h2>
              <p className="text-xs text-gray-400">
                {isReassign
                  ? `Currently: ${vehicle.driver_name} · ${vehicle.route_name || "No route"}`
                  : "Link a driver and route to this vehicle"}
              </p>
            </div>
          </div>
          <button type="button" onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X size={20}/>
          </button>
        </div>

        {!ready ? (
          <div className="px-6 pb-8 text-center text-gray-400 text-sm py-6">Loading...</div>
        ) : (
          <form onSubmit={handleSubmit} className="px-6 pb-6 space-y-4">
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

            {isReassign && (
              <div className="bg-yellow-50 rounded-xl p-3 border border-yellow-100">
                <p className="text-xs text-yellow-700 font-medium">
                  ⚠️ Previous driver {vehicle.driver_name} will be notified via SMS.
                </p>
              </div>
            )}

            <div className="flex gap-3 pt-2">
              <button type="button" onClick={onClose}
                className="ma3-btn-ghost flex-1 py-2.5 text-sm">Cancel</button>
              <button type="submit" disabled={loading}
                className={`flex-1 py-2.5 text-sm font-semibold rounded-xl text-white transition-colors
                  ${isReassign
                    ? "bg-yellow-500 hover:bg-yellow-600"
                    : "bg-teal-500 hover:bg-teal-600"}`}>
                {loading ? "Saving..." : isReassign ? "Reassign 🔄" : "Assign 🔗"}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}
