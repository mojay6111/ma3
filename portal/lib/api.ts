import axios from "axios"

const BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"

export const api = axios.create({ baseURL: BASE })

// Attach token automatically
api.interceptors.request.use((config) => {
  if (typeof window !== "undefined") {
    const token = localStorage.getItem("ma3_token")
    if (token) config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// Auth
export const login = (email: string, password: string) =>
  api.post("/auth/login",
    new URLSearchParams({ username: email, password }),
    { headers: { "Content-Type": "application/x-www-form-urlencoded" } }
  )

export const getMe = () => api.get("/auth/me")

// SACCO registration
export const registerSacco = (data: any) => api.post("/auth/register", data)

// Admin
export const getPendingSaccos = () => api.get("/admin/pending-saccos")
export const getAllSaccos     = () => api.get("/admin/all-saccos")
export const approveSacco     = (id: string) => api.post(`/admin/approve-sacco/${id}`)
export const rejectSacco      = (id: string) => api.post(`/admin/reject-sacco/${id}`)

// SACCO-scoped
export const getMyVehicles = () => api.get("/vehicles/")
export const getMyDrivers  = () => api.get("/drivers/")
export const getLeaderboard = () => api.get("/drivers/leaderboard")
export const getLiveVehicles = () => api.get("/telemetry/live")
