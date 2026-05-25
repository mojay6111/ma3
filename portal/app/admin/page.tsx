"use client"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { getPendingSaccos, getAllSaccos, approveSacco, rejectSacco } from "@/lib/api"
import { SaccoProfile } from "@/types"
import toast from "react-hot-toast"
import { CheckCircle, XCircle, Clock, Building2, LogOut, MapPin, Shield } from "lucide-react"
import Ma3Logo from "@/components/Ma3Logo"

export default function AdminPage() {
  const router = useRouter()
  const [pending, setPending] = useState<SaccoProfile[]>([])
  const [all, setAll]         = useState<SaccoProfile[]>([])
  const [tab, setTab]         = useState<"pending"|"all">("pending")
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const role = localStorage.getItem("ma3_role")
    if (role !== "superadmin") { router.push("/login"); return }
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      const [p, a] = await Promise.all([getPendingSaccos(), getAllSaccos()])
      setPending(p.data); setAll(a.data)
    } catch { router.push("/login") }
    finally { setLoading(false) }
  }

  const handleApprove = async (id: string, name: string) => {
    try {
      await approveSacco(id)
      toast.success(`✅ ${name} approved! SMS sent.`)
      fetchData()
    } catch { toast.error("Failed to approve") }
  }

  const handleReject = async (id: string, name: string) => {
    if (!confirm(`Reject ${name}? Manager will be notified via SMS.`)) return
    try {
      await rejectSacco(id)
      toast.success(`${name} rejected.`)
      fetchData()
    } catch { toast.error("Failed to reject") }
  }

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-gray-400 text-sm">Loading...</div>
    </div>
  )

  const approved = all.filter(s => s.is_approved && s.is_active)
  const rejected  = all.filter(s => !s.is_active)

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Topbar */}
      <div className="ma3-topbar">
        <div className="flex items-center gap-3">
          <Ma3Logo/>
          <div>
            <p className="font-black text-gray-900 text-sm">Ma3 Super Admin</p>
            <p className="text-xs text-gray-400 flex items-center gap-1">
              <Shield size={10} className="text-orange-400"/> Platform management
            </p>
          </div>
        </div>
        <button onClick={() => { localStorage.clear(); router.push("/login") }}
          className="flex items-center gap-1.5 text-sm text-gray-400
            hover:text-red-500 transition-colors font-medium">
          <LogOut size={15}/> Logout
        </button>
      </div>

      {/* Hero strip */}
      <div className="matatu-stripe-header px-6 py-6 relative z-10">
        <div className="max-w-5xl mx-auto">
          <h1 className="text-white text-2xl font-black">SACCO Management</h1>
          <p className="text-orange-200 text-sm mt-0.5">
            Review and approve SACCO applications
          </p>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-6 py-8">
        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          {[
            { label: "Pending Review", value: pending.length,  color: "text-yellow-500", bg: "bg-yellow-50",  border: "border-yellow-100", icon: Clock,         stripe: "ma3-stat-yellow" },
            { label: "Approved",       value: approved.length, color: "text-teal-600",   bg: "bg-teal-50",    border: "border-teal-100",   icon: CheckCircle,   stripe: "ma3-stat-teal" },
            { label: "Rejected",       value: rejected.length, color: "text-red-500",    bg: "bg-red-50",     border: "border-red-100",    icon: XCircle,       stripe: "ma3-stat-red" },
          ].map(s => (
            <div key={s.label} className={`ma3-stat-card ${s.stripe} border ${s.border}`}>
              <div className={`w-10 h-10 ${s.bg} rounded-xl flex items-center justify-center mb-3`}>
                <s.icon size={20} className={s.color}/>
              </div>
              <p className={`text-3xl font-black ${s.color}`}>{s.value}</p>
              <p className="text-xs text-gray-500 mt-0.5 font-medium">{s.label}</p>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div className="flex gap-1 bg-gray-100 rounded-xl p-1 mb-6 w-fit">
          {(["pending","all"] as const).map(t => (
            <button key={t} onClick={() => setTab(t)}
              className={`px-5 py-2 rounded-lg text-sm font-semibold transition-all
                ${tab === t
                  ? "bg-white text-gray-900 shadow-sm"
                  : "text-gray-500 hover:text-gray-700"}`}>
              {t === "pending" ? `⏳ Pending (${pending.length})` : `🏢 All SACCOs (${all.length})`}
            </button>
          ))}
        </div>

        {/* Pending */}
        {tab === "pending" && (
          <div className="space-y-3">
            {pending.length === 0 ? (
              <div className="ma3-card p-16 text-center">
                <div className="w-16 h-16 bg-green-100 rounded-2xl flex items-center
                  justify-center mx-auto mb-4">
                  <CheckCircle size={32} className="text-green-500"/>
                </div>
                <p className="font-bold text-gray-700">All clear!</p>
                <p className="text-gray-400 text-sm mt-1">No pending SACCO applications.</p>
              </div>
            ) : pending.map(s => (
              <div key={s.id} className="ma3-card p-5">
                {/* Color top strip */}
                <div className="h-1 -mx-5 -mt-5 mb-4 rounded-t-2xl bg-gradient-to-r from-yellow-400 to-orange-500"/>
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-orange-100 to-yellow-100
                      rounded-xl flex items-center justify-center">
                      <Building2 size={22} className="text-orange-500"/>
                    </div>
                    <div>
                      <h3 className="font-black text-gray-900 text-lg">{s.name}</h3>
                      <div className="flex items-center gap-3 mt-1">
                        <span className="flex items-center gap-1 text-xs text-gray-500 font-medium">
                          <MapPin size={11} className="text-teal-500"/> {s.county}
                        </span>
                        <span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">
                          {s.registration_no}
                        </span>
                      </div>
                      <div className="flex gap-3 mt-1.5 text-xs text-gray-400">
                        <span>📞 {s.phone}</span>
                        <span>✉️ {s.email}</span>
                      </div>
                      <p className="text-xs text-gray-400 mt-1">
                        Applied {new Date(s.created_at).toLocaleDateString("en-KE", {
                          day: "numeric", month: "long", year: "numeric"
                        })}
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-2 flex-shrink-0">
                    <button onClick={() => handleReject(s.id, s.name)}
                      className="ma3-btn-danger flex items-center gap-1.5 text-sm px-4 py-2">
                      <XCircle size={14}/> Reject
                    </button>
                    <button onClick={() => handleApprove(s.id, s.name)}
                      className="ma3-btn-teal flex items-center gap-1.5 text-sm px-4 py-2">
                      <CheckCircle size={14}/> Approve
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* All SACCOs */}
        {tab === "all" && (
          <div className="space-y-3">
            {all.map(s => (
              <div key={s.id} className="ma3-card p-5 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center
                    ${s.is_approved && s.is_active ? "bg-teal-100"
                      : !s.is_active ? "bg-red-100" : "bg-yellow-100"}`}>
                    <Building2 size={18} className={
                      s.is_approved && s.is_active ? "text-teal-600"
                      : !s.is_active ? "text-red-500" : "text-yellow-600"
                    }/>
                  </div>
                  <div>
                    <p className="font-bold text-gray-900">{s.name}</p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {s.county} · Registered {s.created_at.slice(0,10)}
                    </p>
                  </div>
                </div>
                <span className={`text-xs px-3 py-1.5 rounded-full font-bold
                  ${s.is_approved && s.is_active ? "ma3-badge-approved"
                    : !s.is_active ? "ma3-badge-rejected"
                    : "ma3-badge-pending"}`}>
                  {s.is_approved && s.is_active ? "✓ Approved"
                    : !s.is_active ? "✗ Rejected"
                    : "⏳ Pending"}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
