"use client"

import { useState, useEffect } from "react"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { MapPin, Phone, Dog, Cat, Bird, X, ImageIcon, User, Calendar } from "lucide-react"
import type { Report } from "@/lib/types"
import { animalTypeLabels, reportTypeLabels } from "@/lib/types"
import { SendMessageDialog } from "./send-message-dialog"
import dynamic from "next/dynamic"
import Image from "next/image"

interface ReportsMapProps {
  reports: Report[]
  isAdmin?: boolean
  isLoggedIn?: boolean
}

function AnimalIcon({ type }: { type: Report["animal_type"] }) {
  switch (type) {
    case "cane":
      return <Dog className="h-4 w-4" />
    case "gatto":
      return <Cat className="h-4 w-4" />
    case "volatile":
      return <Bird className="h-4 w-4" />
  }
}

// Dynamically import the map to avoid SSR issues
const MapComponent = dynamic(() => import("./map-inner"), {
  ssr: false,
  loading: () => (
    <div className="flex h-[500px] items-center justify-center bg-muted">
      <div className="text-muted-foreground">Caricamento mappa...</div>
    </div>
  ),
})

export function ReportsMap({ reports, isAdmin = false, isLoggedIn = false }: ReportsMapProps) {
  const [selectedReport, setSelectedReport] = useState<Report | null>(null)

  return (
    <div className="relative">
      <Card className="overflow-hidden">
        <MapComponent 
          reports={reports} 
          selectedReport={selectedReport}
          onSelectReport={setSelectedReport}
        />
      </Card>

      {/* Selected Report Panel */}
      {selectedReport && (
        <Card className="absolute right-4 top-4 z-[1000] w-72 shadow-xl">
          {/* Animal Photo Thumbnail */}
          {selectedReport.image_url && (
            <div className="relative aspect-video w-full overflow-hidden">
              <Image
                src={selectedReport.image_url.split(',')[0]}
                alt={selectedReport.animal_name || animalTypeLabels[selectedReport.animal_type]}
                fill
                className="object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
              <Badge
                variant={selectedReport.report_type === "smarrito" ? "destructive" : "default"}
                className={`absolute left-3 top-3 ${selectedReport.report_type === "smarrito" ? "bg-destructive text-destructive-foreground" : "bg-accent text-accent-foreground"}`}
              >
                {reportTypeLabels[selectedReport.report_type]}
              </Badge>
              <Button
                variant="ghost"
                size="icon"
                className="absolute right-2 top-2 h-7 w-7 bg-black/30 text-white hover:bg-black/50"
                onClick={() => setSelectedReport(null)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          )}
          <div className="p-4">
            {!selectedReport.image_url && (
              <div className="mb-3 flex items-start justify-between">
                <Badge
                  variant={selectedReport.report_type === "smarrito" ? "destructive" : "default"}
                  className={selectedReport.report_type === "smarrito" ? "bg-destructive text-destructive-foreground" : "bg-accent text-accent-foreground"}
                >
                  {reportTypeLabels[selectedReport.report_type]}
                </Badge>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6"
                  onClick={() => setSelectedReport(null)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            )}

            <div className="mb-2 flex items-center gap-2">
              <AnimalIcon type={selectedReport.animal_type} />
              <span className="font-semibold">
                {selectedReport.animal_name || animalTypeLabels[selectedReport.animal_type]}
              </span>
            </div>

            <p className="mb-3 text-sm text-muted-foreground line-clamp-2">
              {selectedReport.description}
            </p>

            <div className="space-y-2 text-sm">
              {/* Author */}
              <div className="flex items-center gap-2 text-muted-foreground">
                <User className="h-4 w-4 shrink-0" />
                <span className="font-medium text-foreground">
                  {selectedReport.profiles?.first_name || selectedReport.profiles?.last_name
                    ? `${selectedReport.profiles.first_name || ""} ${selectedReport.profiles.last_name || ""}`.trim()
                    : selectedReport.contact_name || "Utente"}
                </span>
              </div>
              {/* Date */}
              <div className="flex items-center gap-2 text-muted-foreground">
                <Calendar className="h-4 w-4 shrink-0" />
                <span>
                  {new Date(selectedReport.created_at).toLocaleDateString("it-IT", {
                    day: "2-digit",
                    month: "long",
                    year: "numeric",
                  })}
                </span>
              </div>
              <div className="flex items-center gap-2 text-muted-foreground">
                <MapPin className="h-4 w-4 shrink-0" />
                <span className="truncate">
                  {selectedReport.address}, {selectedReport.city}
                </span>
              </div>
              {selectedReport.contact_phone && selectedReport.show_phone && (isLoggedIn || isAdmin) && (
                <div className="flex items-center gap-2">
                  <Phone className="h-4 w-4 shrink-0 text-muted-foreground" />
                  <a
                    href={`tel:${selectedReport.contact_phone}`}
                    className="text-primary hover:underline"
                  >
                    {selectedReport.contact_phone}
                  </a>
                </div>
              )}
            </div>

            <div className="mt-4">
              <SendMessageDialog
                reportId={selectedReport.id}
                animalName={selectedReport.animal_name}
                reportType={selectedReport.report_type}
              />
            </div>
          </div>
        </Card>
      )}

      {/* Legend */}
      <div className="absolute bottom-4 left-4 z-[1000] rounded-lg bg-card/95 p-3 shadow-lg backdrop-blur">
        <div className="flex flex-col gap-2 text-sm">
          <div className="flex items-center gap-2">
            <div className="h-4 w-4 rounded-full bg-destructive" />
            <span>Smarrito</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="h-4 w-4 rounded-full bg-accent" />
            <span>Avvistato</span>
          </div>
        </div>
      </div>
    </div>
  )
}
