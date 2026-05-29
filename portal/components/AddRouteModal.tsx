"use client"
import { useState } from "react"
import { api } from "@/lib/api"
import toast from "react-hot-toast"
import { X, MapPin, Plus, Trash2 } from "lucide-react"

interface Stop {
  name: string
  sequence: number
  lat: string
  lng: string
}

interface Props {
  onClose: () => void
  onSuccess: () => void
}

// Common Nairobi stops for quick selection
const NAIROBI_STOPS = [
  { name: "CBD",            lat: "-1.2841", lng: "36.8155" },
  { name: "Kencom",         lat: "-1.2833", lng: "36.8148" },
  { name: "GPO",            lat: "-1.2833", lng: "36.8172" },
  { name: "Muthurwa",       lat: "-1.2851", lng: "36.8389" },
  { name: "Westlands",      lat: "-1.2673", lng: "36.8062" },
  { name: "Kangemi",        lat: "-1.2690", lng: "36.7450" },
  { name: "Kawangware",     lat: "-1.2800", lng: "36.7700" },
  { name: "Kikuyu",         lat: "-1.2490", lng: "36.6830" },
  { name: "Dagoretti",      lat: "-1.2940", lng: "36.7360" },
  { name: "Karen",          lat: "-1.3190", lng: "36.7120" },
  { name: "Rongai",         lat: "-1.3940", lng: "36.7450" },
  { name: "Ngong",          lat: "-1.3580", lng: "36.6600" },
  { name: "Eastleigh",      lat: "-1.2741", lng: "36.8530" },
  { name: "Umoja",          lat: "-1.2760", lng: "36.8890" },
  { name: "Kayole",         lat: "-1.2620", lng: "36.9120" },
  { name: "Githurai",       lat: "-1.2090", lng: "36.8980" },
  { name: "Ruiru",          lat: "-1.1460", lng: "36.9580" },
  { name: "Thika",          lat: "-1.0396", lng: "37.0900" },
  { name: "Juja",           lat: "-1.1010", lng: "37.0140" },
  { name: "Kasarani",       lat: "-1.2230", lng: "36.8960" },
  { name: "Roysambu",       lat: "-1.2180", lng: "36.8820" },
  { name: "Mirema",         lat: "-1.2210", lng: "36.8750" },
  { name: "Zimmerman",      lat: "-1.2100", lng: "36.8850" },
  { name: "Kahawa West",    lat: "-1.1890", lng: "36.9210" },
  { name: "Kiambu",         lat: "-1.1710", lng: "36.8360" },
  { name: "Upper Hill",     lat: "-1.2970", lng: "36.8170" },
  { name: "Hurlingham",     lat: "-1.2950", lng: "36.7980" },
  { name: "South B",        lat: "-1.3100", lng: "36.8330" },
  { name: "South C",        lat: "-1.3210", lng: "36.8260" },
  { name: "Langata",        lat: "-1.3490", lng: "36.7530" },
]

export default function AddRouteModal({ onClose, onSuccess }: Props) {
  const [name,     setName]     = useState("")
  const [sacco,    setSacco]    = useState("")
  const [fare,     setFare]     = useState("")
  const [stops,    setStops]    = useState<Stop[]>([
    { name: "", sequence: 1, lat: "", lng: "" },
    { name: "", sequence: 2, lat: "", lng: "" },
  ])
  const [loading,  setLoading]  = useState(false)
  const [error,    setError]    = useState("")

  const addStop = () => {
    setStops(s => [...s, { name: "", sequence: s.length + 1, lat: "", lng: "" }])
  }

  const removeStop = (idx: number) => {
    if (stops.length <= 2) { toast.error("Minimum 2 stops required"); return }
    setStops(s => s.filter((_, i) => i !== idx).map((s, i) => ({ ...s, sequence: i + 1 })))
  }

  const updateStop = (idx: number, field: keyof Stop, value: string) => {
    setStops(s => s.map((stop, i) => i === idx ? { ...stop, [field]: value } : stop))
  }

  const selectPreset = (idx: number, presetName: string) => {
    const preset = NAIROBI_STOPS.find(s => s.name === presetName)
    if (!preset) return
    setStops(s => s.map((stop, i) => i === idx
      ? { ...stop, name: preset.name, lat: preset.lat, lng: preset.lng }
      : stop
    ))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    if (!name.trim())   { setError("Route name required"); return }
    if (!fare || isNaN(Number(fare))) { setError("Valid fare required"); return }
    if (stops.some(s => !s.name || !s.lat || !s.lng)) {
      setError("All stops need name and coordinates"); return
    }

    setLoading(true)
    try {
      await api.post("/routes/", {
        name,
        sacco: sacco || "My SACCO",
        fare_kes: Number(fare),
        stops: stops.map(s => ({
          name: s.name,
          sequence: s.sequence,
          lat: Number(s.lat),
          lng: Number(s.lng)
        }))
      })
      toast.success(`Route ${name} created! 🗺️`)
      onSuccess()
      onClose()
    } catch (err: any) {
      setError(err.response?.data?.detail || "Failed to create route")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl max-h-[90vh] overflow-y-auto">
        <div className="h-1.5 rounded-t-2xl bg-gradient-to-r from-teal-400 via-blue-400 to-purple-400 sticky top-0"/>
        <div className="p-6 pb-4 flex items-center justify-between sticky top-1.5 bg-white z-10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-teal-100 rounded-xl flex items-center justify-center">
              <MapPin size={20} className="text-teal-600"/>
            </div>
            <div>
              <h2 className="font-black text-gray-900">Create Route</h2>
              <p className="text-xs text-gray-400">Define a new matatu route for your SACCO</p>
            </div>
          </div>
          <button type="button" onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X size={20}/>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="px-6 pb-6 space-y-4">
          {/* Route name */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">
              Route Name
            </label>
            <input value={name} onChange={e => setName(e.target.value)}
              placeholder="e.g. 46 CBD-Westlands"
              className="ma3-input"/>
          </div>

          {/* Fare */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">
              Fare (KSh)
            </label>
            <input value={fare} onChange={e => setFare(e.target.value)}
              placeholder="e.g. 50" type="number" min="1"
              className="ma3-input"/>
            <p className="text-xs text-gray-400 mt-1">
              This fare shows to commuters via SMS and on USSD
            </p>
          </div>

          {/* Stops */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-semibold text-gray-700">
                Stops ({stops.length})
              </label>
              <button type="button" onClick={addStop}
                className="text-xs text-teal-600 font-semibold flex items-center gap-1
                  hover:text-teal-700">
                <Plus size={12}/> Add stop
              </button>
            </div>

            <div className="space-y-2">
              {stops.map((stop, idx) => (
                <div key={idx} className="bg-gray-50 rounded-xl p-3 border border-gray-100">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="route-board text-xs w-6 text-center">{idx + 1}</span>
                    <select
                      value={stop.name}
                      onChange={e => selectPreset(idx, e.target.value)}
                      className="flex-1 text-xs border border-gray-200 rounded-lg px-2 py-1.5 bg-white focus:outline-none focus:ring-1 focus:ring-teal-400">
                      <option value="">— Pick a Nairobi stop —</option>
                      {NAIROBI_STOPS.map(s => (
                        <option key={s.name} value={s.name}>{s.name}</option>
                      ))}
                    </select>
                    {stops.length > 2 && (
                      <button type="button" onClick={() => removeStop(idx)}
                        className="text-red-400 hover:text-red-600">
                        <Trash2 size={14}/>
                      </button>
                    )}
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    <input value={stop.name}
                      onChange={e => updateStop(idx, "name", e.target.value)}
                      placeholder="Stop name"
                      className="text-xs border border-gray-200 rounded-lg px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-teal-400"/>
                    <input value={stop.lat}
                      onChange={e => updateStop(idx, "lat", e.target.value)}
                      placeholder="Latitude"
                      className="text-xs border border-gray-200 rounded-lg px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-teal-400"/>
                    <input value={stop.lng}
                      onChange={e => updateStop(idx, "lng", e.target.value)}
                      placeholder="Longitude"
                      className="text-xs border border-gray-200 rounded-lg px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-teal-400"/>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-teal-50 rounded-xl p-3 border border-teal-100">
            <p className="text-xs text-teal-700 font-medium">
              🗺️ Routes appear in driver USSD menu and commuter SMS replies automatically.
            </p>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-100 rounded-xl p-3">
              <p className="text-red-600 text-xs font-medium">{error}</p>
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose}
              className="ma3-btn-ghost flex-1 py-2.5 text-sm">Cancel</button>
            <button type="submit" disabled={loading}
              className="ma3-btn-teal flex-1 py-2.5 text-sm">
              {loading ? "Creating..." : "Create Route 🗺️"}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
