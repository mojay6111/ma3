"use client"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { registerSacco } from "@/lib/api"
import toast from "react-hot-toast"
import Link from "next/link"
import Ma3Logo from "@/components/Ma3Logo"
import { CheckCircle } from "lucide-react"

const schema = z.object({
  manager_name:    z.string().min(3, "Full name required"),
  email:           z.string().email("Valid email required"),
  phone:           z.string().min(10, "Valid phone required"),
  password:        z.string().min(8, "Min 8 characters"),
  sacco_name:      z.string().min(3, "SACCO name required"),
  registration_no: z.string().min(3, "Registration number required"),
  county:          z.string().min(2, "County required"),
  sacco_phone:     z.string().min(10, "Valid phone required"),
  sacco_email:     z.string().email("Valid email required"),
  description:     z.string().optional(),
})
type Form = z.infer<typeof schema>

const COUNTIES = [
  "Nairobi","Mombasa","Kisumu","Nakuru","Eldoret","Thika",
  "Machakos","Nyeri","Meru","Kakamega","Kisii","Garissa",
  "Kitale","Malindi","Bungoma","Kericho","Bomet","Narok","Kajiado"
]

const STEPS = ["Your Account", "SACCO Details", "Review"]

export default function RegisterPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [step, setStep] = useState(1)
  const { register, handleSubmit, trigger, getValues, formState: { errors } } = useForm<Form>({
    resolver: zodResolver(schema)
  })

  const nextStep = async () => {
    const fields = step === 1
      ? ["manager_name","email","phone","password"] as const
      : ["sacco_name","registration_no","county","sacco_phone","sacco_email"] as const
    const valid = await trigger(fields)
    if (valid) setStep(s => s + 1)
  }

  const onSubmit = async (data: Form) => {
    setLoading(true)
    try {
      await registerSacco(data)
      toast.success("Registered! Utapata SMS baada ya review. 📱")
      router.push("/login")
    } catch (err: any) {
      toast.error(err.response?.data?.detail || "Registration failed")
    } finally {
      setLoading(false)
    }
  }

  const vals = getValues()

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="w-full max-w-xl">
        {/* Header */}
        <div className="text-center mb-6">
          <div className="flex items-center justify-center gap-3 mb-3">
            <Ma3Logo size="lg"/>
            <div className="text-left">
              <p className="text-xl font-black text-gray-900">Register your SACCO</p>
              <p className="text-sm text-orange-500">Join Ma3 — Kenya's matatu platform</p>
            </div>
          </div>
        </div>

        {/* Step indicator */}
        <div className="flex items-center justify-center mb-6">
          {STEPS.map((label, idx) => {
            const s = idx + 1
            const done = step > s
            const active = step === s
            return (
              <div key={s} className="flex items-center">
                <div className="flex flex-col items-center">
                  <div className={`w-9 h-9 rounded-full flex items-center justify-center
                    text-sm font-bold transition-all duration-200
                    ${done ? "bg-teal-500 text-white"
                      : active ? "bg-orange-500 text-white shadow-lg shadow-orange-200"
                      : "bg-gray-100 text-gray-400"}`}>
                    {done ? <CheckCircle size={16}/> : s}
                  </div>
                  <span className={`text-xs mt-1 font-medium whitespace-nowrap
                    ${active ? "text-orange-500" : done ? "text-teal-500" : "text-gray-400"}`}>
                    {label}
                  </span>
                </div>
                {idx < STEPS.length - 1 && (
                  <div className={`w-16 h-0.5 mb-4 mx-1 transition-colors
                    ${step > s ? "bg-teal-400" : "bg-gray-200"}`}/>
                )}
              </div>
            )
          })}
        </div>

        <div className="ma3-card p-8">
          {/* Colorful top bar */}
          <div className="h-1.5 -mx-8 -mt-8 mb-6 rounded-t-2xl
            bg-gradient-to-r from-orange-400 via-yellow-400 to-teal-500"/>

          <form onSubmit={handleSubmit(onSubmit)}>
            {step === 1 && (
              <div className="space-y-4">
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-8 h-8 bg-orange-100 rounded-lg flex items-center
                    justify-center text-orange-500 font-bold text-sm">1</div>
                  <h2 className="font-black text-gray-900">Your account details</h2>
                </div>
                {[
                  { name: "manager_name", label: "Full Name",  placeholder: "James Kamau",          type: "text" },
                  { name: "email",        label: "Email",      placeholder: "james@sacco.co.ke",     type: "email" },
                  { name: "phone",        label: "Phone",      placeholder: "+254700000000",         type: "tel" },
                  { name: "password",     label: "Password",   placeholder: "Min 8 characters",     type: "password" },
                ].map(f => (
                  <div key={f.name}>
                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">{f.label}</label>
                    <input {...register(f.name as any)} type={f.type}
                      placeholder={f.placeholder} className="ma3-input"/>
                    {errors[f.name as keyof Form] && (
                      <p className="text-red-500 text-xs mt-1">{errors[f.name as keyof Form]?.message}</p>
                    )}
                  </div>
                ))}
              </div>
            )}

            {step === 2 && (
              <div className="space-y-4">
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-8 h-8 bg-teal-100 rounded-lg flex items-center
                    justify-center text-teal-600 font-bold text-sm">2</div>
                  <h2 className="font-black text-gray-900">SACCO information</h2>
                </div>
                {[
                  { name: "sacco_name",      label: "SACCO Name",      placeholder: "City Shuttle Sacco" },
                  { name: "registration_no", label: "Registration No.", placeholder: "NTSA/SACCO/2019/001" },
                  { name: "sacco_phone",     label: "SACCO Phone",      placeholder: "+254700000000" },
                  { name: "sacco_email",     label: "SACCO Email",      placeholder: "info@sacco.co.ke" },
                ].map(f => (
                  <div key={f.name}>
                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">{f.label}</label>
                    <input {...register(f.name as any)} placeholder={f.placeholder} className="ma3-input"/>
                    {errors[f.name as keyof Form] && (
                      <p className="text-red-500 text-xs mt-1">{errors[f.name as keyof Form]?.message}</p>
                    )}
                  </div>
                ))}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">County</label>
                  <select {...register("county")} className="ma3-input bg-white">
                    <option value="">Select county...</option>
                    {COUNTIES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                  {errors.county && <p className="text-red-500 text-xs mt-1">{errors.county.message}</p>}
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                    About your SACCO <span className="text-gray-400 font-normal">(optional)</span>
                  </label>
                  <textarea {...register("description")} rows={3}
                    placeholder="Brief description of your SACCO operations..."
                    className="ma3-input resize-none"/>
                </div>
              </div>
            )}

            {step === 3 && (
              <div className="space-y-4">
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-8 h-8 bg-yellow-100 rounded-lg flex items-center
                    justify-center text-yellow-600 font-bold text-sm">3</div>
                  <h2 className="font-black text-gray-900">Review & submit</h2>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-orange-50 rounded-xl p-4 border border-orange-100">
                    <p className="text-xs font-bold text-orange-600 uppercase tracking-wide mb-2">
                      Manager
                    </p>
                    <p className="text-sm font-semibold text-gray-900">{vals.manager_name}</p>
                    <p className="text-xs text-gray-500 mt-0.5">{vals.email}</p>
                    <p className="text-xs text-gray-500">{vals.phone}</p>
                  </div>
                  <div className="bg-teal-50 rounded-xl p-4 border border-teal-100">
                    <p className="text-xs font-bold text-teal-600 uppercase tracking-wide mb-2">
                      SACCO
                    </p>
                    <p className="text-sm font-semibold text-gray-900">{vals.sacco_name}</p>
                    <p className="text-xs text-gray-500 mt-0.5">{vals.registration_no}</p>
                    <p className="text-xs text-gray-500">{vals.county}</p>
                  </div>
                </div>

                <div className="bg-gradient-to-r from-orange-500 to-teal-500
                  rounded-xl p-4 text-white">
                  <p className="font-bold text-sm mb-2">What happens next 📋</p>
                  <ul className="text-orange-100 text-xs space-y-1.5">
                    <li>✓ Ma3 team reviews your SACCO registration</li>
                    <li>✓ Background check on reg number with NTSA</li>
                    <li>✓ SMS confirmation to {vals.phone} within 24hrs</li>
                    <li>✓ Once approved — login and start managing</li>
                  </ul>
                </div>

                <button type="submit" disabled={loading}
                  className="ma3-btn-primary w-full py-3">
                  {loading ? "Submitting..." : "Submit Registration 🚌"}
                </button>
              </div>
            )}

            {step < 3 && (
              <div className="flex gap-3 mt-6">
                {step > 1 && (
                  <button type="button" onClick={() => setStep(s => s - 1)}
                    className="ma3-btn-ghost flex-1 py-2.5 text-sm">
                    ← Back
                  </button>
                )}
                <button type="button" onClick={nextStep}
                  className="ma3-btn-primary flex-1 py-2.5 text-sm">
                  Continue →
                </button>
              </div>
            )}
          </form>

          <div className="mt-6 pt-5 border-t border-gray-100 text-center">
            <p className="text-sm text-gray-500">
              Already registered?{" "}
              <Link href="/login" className="text-orange-500 font-semibold hover:underline">
                Sign in
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
