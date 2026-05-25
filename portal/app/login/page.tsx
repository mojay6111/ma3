"use client"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { login } from "@/lib/api"
import toast from "react-hot-toast"
import Link from "next/link"
import Ma3Logo from "@/components/Ma3Logo"

const schema = z.object({
  email: z.string().email("Valid email required"),
  password: z.string().min(6, "Password too short")
})
type Form = z.infer<typeof schema>

export default function LoginPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const { register, handleSubmit, formState: { errors } } = useForm<Form>({
    resolver: zodResolver(schema)
  })

  const onSubmit = async (data: Form) => {
    setLoading(true)
    try {
      const res = await login(data.email, data.password)
      localStorage.setItem("ma3_token", res.data.access_token)
      localStorage.setItem("ma3_role", res.data.role)
      toast.success(`Karibu, ${res.data.name.split(" ")[0]}! 🚌`)
      if (res.data.role === "superadmin") router.push("/admin")
      else router.push("/dashboard")
    } catch (err: any) {
      const msg = err.response?.data?.detail || "Login failed"
      if (msg.includes("pending")) {
        toast.error("SACCO pending approval. SMS inakuja! 📱")
      } else {
        toast.error(msg)
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex">
      {/* Left — hero panel */}
      <div className="hidden lg:flex lg:w-1/2 matatu-stripe-header flex-col justify-between p-12 relative">
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-16">
            <Ma3Logo size="lg"/>
            <div>
              <p className="text-white text-xl font-black tracking-tight">Ma3 Portal</p>
              <p className="text-orange-200 text-sm">Jua Ma3 Yako</p>
            </div>
          </div>
          <h1 className="text-white text-4xl font-black leading-tight mb-4">
            Manage your<br/>
            <span className="text-yellow-300">SACCO smarter.</span>
          </h1>
          <p className="text-orange-100 text-lg leading-relaxed max-w-sm">
            Real-time fleet tracking, ML-powered demand forecasts,
            and driver safety scores — all in one platform.
          </p>
        </div>

        {/* Route board decoration */}
        <div className="relative z-10 space-y-3">
          {[
            { route: "46", label: "CBD → Westlands", status: "3 active" },
            { route: "34", label: "CBD → Kangemi",   status: "2 active" },
            { route: "58", label: "CBD → Kikuyu",    status: "1 active" },
          ].map(r => (
            <div key={r.route} className="flex items-center gap-3
              bg-white/10 backdrop-blur-sm rounded-xl px-4 py-3">
              <span className="route-board">{r.route}</span>
              <span className="text-white text-sm font-medium flex-1">{r.label}</span>
              <span className="text-green-300 text-xs font-medium">{r.status}</span>
              <div className="pulse-dot"/>
            </div>
          ))}
        </div>
      </div>

      {/* Right — login form */}
      <div className="flex-1 flex items-center justify-center p-8 bg-gray-50">
        <div className="w-full max-w-md">
          {/* Mobile logo */}
          <div className="lg:hidden text-center mb-8">
            <div className="flex items-center justify-center gap-3 mb-2">
              <Ma3Logo size="lg"/>
              <div className="text-left">
                <p className="text-xl font-black text-gray-900">Ma3 Portal</p>
                <p className="text-sm text-orange-500">Jua Ma3 Yako</p>
              </div>
            </div>
          </div>

          <div className="ma3-card p-8">
            <div className="mb-6">
              <h2 className="text-2xl font-black text-gray-900">Sign in</h2>
              <p className="text-gray-500 text-sm mt-1">Welcome back to Ma3 Portal</p>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                  Email address
                </label>
                <input {...register("email")} type="email"
                  placeholder="manager@sacco.co.ke"
                  className="ma3-input"/>
                {errors.email && (
                  <p className="text-red-500 text-xs mt-1">{errors.email.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                  Password
                </label>
                <input {...register("password")} type="password"
                  placeholder="••••••••"
                  className="ma3-input"/>
                {errors.password && (
                  <p className="text-red-500 text-xs mt-1">{errors.password.message}</p>
                )}
              </div>

              <button type="submit" disabled={loading}
                className="ma3-btn-primary w-full py-3 text-sm mt-2">
                {loading ? "Signing in..." : "Sign in →"}
              </button>
            </form>

            <div className="mt-6 pt-6 border-t border-gray-100 text-center">
              <p className="text-sm text-gray-500">
                Don't have an account?{" "}
                <Link href="/register"
                  className="text-orange-500 font-semibold hover:underline">
                  Register your SACCO
                </Link>
              </p>
            </div>
          </div>

          <p className="text-center text-xs text-gray-400 mt-6">
            Ma3 Platform · Built for Kenya 🇰🇪
          </p>
        </div>
      </div>
    </div>
  )
}
