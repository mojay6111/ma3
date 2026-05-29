"use client"
import { useEffect, useRef } from "react"

interface Props {
  vehicles: { id: string; plate: string; lat: number; lng: number; stop: string; score: number }[]
}

export default function PortalMap({ vehicles }: Props) {
  const mapRef       = useRef<any>(null)
  const markersRef   = useRef<Record<string, any>>({})
  const containerRef = useRef<HTMLDivElement>(null)
  const initRef      = useRef(false)

  useEffect(() => {
    if (initRef.current || !containerRef.current) return
    initRef.current = true

    import("leaflet").then((L) => {
      delete (L.Icon.Default.prototype as any)._getIconUrl
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
        iconUrl:       "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
        shadowUrl:     "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
      })
      mapRef.current = L.map(containerRef.current!).setView([-1.2841, 36.8155], 13)
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: "© OpenStreetMap"
      }).addTo(mapRef.current)
    })

    return () => {
      if (mapRef.current) { mapRef.current.remove(); mapRef.current = null; initRef.current = false }
    }
  }, [])

  useEffect(() => {
    if (!mapRef.current || vehicles.length === 0) return
    import("leaflet").then((L) => {
      vehicles.forEach(v => {
        if (!v.lat || !v.lng) return
        const color = v.score >= 80 ? "#0D9488" : v.score >= 50 ? "#EAB308" : "#EF4444"
        const icon = L.divIcon({
          className: "",
          html: `<div style="
            background:${color};width:14px;height:14px;border-radius:50%;
            border:2.5px solid white;box-shadow:0 0 8px ${color}80;
            position:relative;">
            <div style="position:absolute;top:-22px;left:50%;transform:translateX(-50%);
              background:${color};color:white;font-size:9px;font-weight:700;
              padding:1px 5px;border-radius:4px;white-space:nowrap;">
              ${v.plate}
            </div>
          </div>`,
          iconSize: [14, 14],
          iconAnchor: [7, 7]
        })
        if (markersRef.current[v.id]) {
          markersRef.current[v.id].setLatLng([v.lat, v.lng])
        } else {
          markersRef.current[v.id] = L.marker([v.lat, v.lng], { icon })
            .addTo(mapRef.current)
            .bindPopup(`<b>${v.plate}</b><br/>@ ${v.stop || "en route"}<br/>Score: ${Math.round(v.score || 0)}/100`)
        }
      })
    })
  }, [vehicles])

  return (
    <>
      <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"/>
      <div ref={containerRef} style={{ height: 320, width: "100%", borderRadius: "1rem", overflow: "hidden" }}/>
    </>
  )
}
