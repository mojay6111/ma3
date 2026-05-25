export interface Manager {
  id: string
  name: string
  email: string
  phone: string
  role: "superadmin" | "sacco_admin" | "sacco_ops"
  sacco_id: string | null
  is_primary: boolean
}

export interface SaccoProfile {
  id: string
  name: string
  registration_no: string
  county: string
  phone: string
  email: string
  logo_url: string | null
  cover_url: string | null
  description: string
  is_approved: boolean
  is_active: boolean
  created_at: string
}

export interface Vehicle {
  id: string
  plate: string
  capacity: number
  is_active: boolean
  driver_id: string | null
  route_id: string | null
}

export interface Driver {
  id: string
  name: string
  phone: string
  license_no: string
  score: number
  wallet_kes: number
}

export interface AuthResponse {
  access_token: string
  token_type: string
  role: string
  name: string
  sacco_id: string | null
}
