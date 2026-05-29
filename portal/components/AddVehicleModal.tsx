"use client"
import { useState } from "react"
import { useForm } from "react-hook-form"
import { api } from "@/lib/api"
import toast from "react-hot-toast"
import { X, Bus } from "lucide-react"

export default function AddVehicleModal({
  onClose, onSuccess
}: { onClose: () => void; onSuccess: () => void }) {
  const [loading, setLoading] = useState(false)
  const [plate, setPlate]     = useState("")
  const [capacity, setCapacity] = useState(14)
  const [error, setError]     = useState("")

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    if (plate.trim().length < 5) { setError("Valid plate required e.g. KDA 123A"); return }

    setLoading(true)
    try {
      await api.post("/vehicles/", { plate: plate.toUpperCase(), capacity })
      toast.success(`${plate.toUpperCase()} registered! 🚌`)
      onSuccess()
      onClose()
    } catch (err: any) {
      const msg = err.response?.data?.detail || "Failed to add vehicle"
      toast.error(msg)
      setError(msg)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl">
        <div className="h-1.5 rounded-t-2xl bg-gradient-to-r from-orange-400 via-yellow-400 to-teal-500"/>
        <div className="p-6 pb-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
              <Bus size={20} className="text-blue-600"/>
            </div>
            <div>
              <h2 className="font-black text-gray-900">Add Vehicle</h2>
              <p className="text-xs text-gray-400">Register a new matatu to your fleet</p>
            </div>
          </div>
          <button type="button" onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors">
            <X size={20}/>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="px-6 pb-6 space-y-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">
              Number Plate
            </label>
            <input
              value={plate}
              onChange={e => setPlate(e.target.value)}
              placeholder="KDA 123A"
              className="ma3-input"
              style={{ textTransform: "uppercase" }}
            />
            {error && <p className="text-red-500 text-xs mt-1">{error}</p>}
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">
              Vehicle Type & Capacity
            </label>
            <select
              value={capacity}
              onChange={e => setCapacity(Number(e.target.value))}
              className="ma3-input bg-white">
              <option value={14}>14-seater (Standard Matatu)</option>
              <option value={33}>33-seater (Mini Bus)</option>
              <option value={60}>60-seater (Full Bus)</option>
            </select>
          </div>

          <div className="bg-orange-50 rounded-xl p-3 border border-orange-100">
            <p className="text-xs text-orange-700 font-medium">
              📋 After adding, assign a driver and route from the vehicles list.
            </p>
          </div>

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose}
              className="ma3-btn-ghost flex-1 py-2.5 text-sm">
              Cancel
            </button>
            <button type="submit" disabled={loading}
              className="ma3-btn-primary flex-1 py-2.5 text-sm">
              {loading ? "Adding..." : "Add Vehicle 🚌"}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
