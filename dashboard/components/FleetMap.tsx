"use client"
import { useEffect, useRef } from "react"
import { Vehicle } from "@/types"

interface Props {
  vehicles: Vehicle[]
  events: { vehicle_id: string; lat: number; lng: number; stop_name: string }[]
}

export default function FleetMap({ vehicles, events }: Props) {
  const mapRef = useRef<any>(null)
  const markersRef = useRef<Record<string, any>>({})
  const containerRef = useRef<HTMLDivElement>(null)
  const initializedRef = useRef(false)

  useEffect(() => {
    if (typeof window === "undefined") return
    if (initializedRef.current) return
    if (!containerRef.current) return

    initializedRef.current = true

    import("leaflet").then((L) => {
      delete (L.Icon.Default.prototype as any)._getIconUrl
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
        iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
        shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
      })
      mapRef.current = L.map(containerRef.current!).setView([-1.2841, 36.8155], 13)
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: "© OpenStreetMap"
      }).addTo(mapRef.current)
    })

    return () => {
      if (mapRef.current) {
        mapRef.current.remove()
        mapRef.current = null
        initializedRef.current = false
      }
    }
  }, [])

  useEffect(() => {
    if (!mapRef.current || events.length === 0) return
    import("leaflet").then((L) => {
      const e = events[0]
      if (!e.lat || !e.lng) return
      const icon = L.divIcon({
        className: "",
        html: `<div style="background:#3b82f6;width:12px;height:12px;border-radius:50%;border:2px solid white;box-shadow:0 0 6px #3b82f6"/>`,
        iconSize: [12, 12],
      })
      if (markersRef.current[e.vehicle_id]) {
        markersRef.current[e.vehicle_id].setLatLng([e.lat, e.lng])
      } else {
        markersRef.current[e.vehicle_id] = L.marker([e.lat, e.lng], { icon })
          .addTo(mapRef.current)
          .bindPopup(e.stop_name || e.vehicle_id)
      }
    })
  }, [events])

  return (
    <>
      <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
      <div ref={containerRef} className="w-full h-full rounded-xl overflow-hidden" style={{ minHeight: 320 }} />
    </>
  )
}
