"use client"
import { useState, useEffect } from "react"
import { Manager } from "@/types"
import { getMe } from "@/lib/api"

export function useAuth() {
  const [manager, setManager] = useState<Manager | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const token = localStorage.getItem("ma3_token")
    if (!token) { setLoading(false); return }
    getMe()
      .then(r => setManager(r.data))
      .catch(() => localStorage.removeItem("ma3_token"))
      .finally(() => setLoading(false))
  }, [])

  const logout = () => {
    localStorage.removeItem("ma3_token")
    localStorage.removeItem("ma3_role")
    window.location.href = "/login"
  }

  return { manager, loading, logout }
}
