"use client"

import { useEffect, useRef } from "react"
import L from "leaflet"
import type { Report } from "@/lib/types"
import "leaflet/dist/leaflet.css"

interface MapInnerProps {
  reports: Report[]
  selectedReport: Report | null
  onSelectReport: (report: Report | null) => void
}

const createIcon = (color: string) =>
  L.divIcon({
    className: "custom-marker",
    html: `<div style="
      width:36px;height:36px;background:${color};
      border-radius:50%;border:3px solid white;
      box-shadow:0 2px 8px rgba(0,0,0,0.3);
      display:flex;align-items:center;justify-content:center;">
      <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24"
        fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <circle cx="12" cy="12" r="10"></circle>
      </svg>
    </div>`,
    iconSize: [36, 36],
    iconAnchor: [18, 18],
  })

const smarritoIcon = createIcon("#ef4444")
const avvistatoIcon = createIcon("#22c55e")

export default function MapInner({ reports, selectedReport, onSelectReport }: MapInnerProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<L.Map | null>(null)
  const markersRef = useRef<L.Marker[]>([])

  // Initialize map once
  useEffect(() => {
    const el = containerRef.current
    if (!el) return

    // Guard: if Leaflet already initialized this node, destroy first
    if ((el as any)._leaflet_id) {
      mapRef.current?.remove()
      mapRef.current = null
    }

    const map = L.map(el, {
      center: [37.95, 12.65],
      zoom: 10,
      scrollWheelZoom: true,
    })
    mapRef.current = map

    L.tileLayer("https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png", {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    }).addTo(map)

    return () => {
      map.remove()
      mapRef.current = null
    }
  }, [])

  // Sync markers whenever reports change
  useEffect(() => {
    const map = mapRef.current
    if (!map) return

    // Remove old markers
    markersRef.current.forEach((m) => m.remove())
    markersRef.current = []

    // Add new markers
    reports.forEach((report) => {
      const icon = report.report_type === "smarrito" ? smarritoIcon : avvistatoIcon
      const marker = L.marker([report.latitude, report.longitude], { icon })
        .addTo(map)
        .on("click", () => onSelectReport(report))
      markersRef.current.push(marker)
    })
  }, [reports, onSelectReport])

  // Pan to selected report
  useEffect(() => {
    const map = mapRef.current
    if (!map || !selectedReport) return
    map.flyTo([selectedReport.latitude, selectedReport.longitude], 14, { duration: 0.5 })
  }, [selectedReport])

  return (
    <div
      ref={containerRef}
      style={{ height: "500px", width: "100%" }}
    />
  )
}
