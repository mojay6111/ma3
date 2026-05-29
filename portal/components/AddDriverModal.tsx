"use client"
import { useState } from "react"
import { api } from "@/lib/api"
import toast from "react-hot-toast"
import { X, Users } from "lucide-react"

export default function AddDriverModal({
  onClose, onSuccess
}: { onClose: () => void; onSuccess: () => void }) {
  const [loading, setLoading]     = useState(false)
  const [name, setName]           = useState("")
  const [phone, setPhone]         = useState("")
  const [licenseNo, setLicenseNo] = useState("")
  const [error, setError]         = useState("")

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    if (name.trim().length < 3)   { setError("Full name required"); return }
    if (phone.trim().length < 10) { setError("Valid phone required"); return }
    if (licenseNo.trim().length < 5) { setError("License number required"); return }

    setLoading(true)
    try {
      await api.post("/drivers/", { name, phone, license_no: licenseNo })
      toast.success(`${name.split(" ")[0]} added! Welcome SMS sent. 📱`)
      onSuccess()
      onClose()
    } catch (err: any) {
      const msg = err.response?.data?.detail || "Failed to add driver"
      toast.error(msg)
      setError(msg)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl">
        <div className="h-1.5 rounded-t-2xl bg-gradient-to-r from-purple-400 via-orange-400 to-teal-500"/>
        <div className="p-6 pb-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-purple-100 rounded-xl flex items-center justify-center">
              <Users size={20} className="text-purple-600"/>
            </div>
            <div>
              <h2 className="font-black text-gray-900">Add Driver</h2>
              <p className="text-xs text-gray-400">Register a new driver to your SACCO</p>
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
              Full Name
            </label>
            <input
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="James Mwangi"
              className="ma3-input"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">
              Safaricom Phone Number
            </label>
            <input
              value={phone}
              onChange={e => setPhone(e.target.value)}
              placeholder="+254700000000"
              type="tel"
              className="ma3-input"
            />
            <p className="text-xs text-gray-400 mt-1">
              Driver receives USSD access on this number
            </p>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">
              License Number
            </label>
            <input
              value={licenseNo}
              onChange={e => setLicenseNo(e.target.value)}
              placeholder="DL/KE/2019/12345"
              className="ma3-input"
            />
          </div>

          {error && (
            <div className="bg-red-50 border border-red-100 rounded-xl p-3">
              <p className="text-red-600 text-xs font-medium">{error}</p>
            </div>
          )}

          <div className="bg-teal-50 rounded-xl p-3 border border-teal-100">
            <p className="text-xs text-teal-700 font-medium">
              📱 Driver will receive a welcome SMS with USSD instructions
            </p>
          </div>

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose}
              className="ma3-btn-ghost flex-1 py-2.5 text-sm">
              Cancel
            </button>
            <button type="submit" disabled={loading}
              className="ma3-btn-primary flex-1 py-2.5 text-sm">
              {loading ? "Adding..." : "Add Driver 👤"}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
