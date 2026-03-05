"use client"

import { Card, CardContent, CardFooter } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { MapPin, Clock, Phone, Dog, Cat, Bird, Shield, Share2, Eye, User, Calendar } from "lucide-react"
import type { Report } from "@/lib/types"
import { animalTypeLabels, reportTypeLabels } from "@/lib/types"
import { SendMessageDialog } from "./send-message-dialog"
import { DeleteReportDialog } from "./delete-report-dialog"
import { FlagReportDialog } from "./flag-report-dialog"
import Image from "next/image"
import { useRouter } from "next/navigation"

interface ReportCardProps {
  report: Report
  isAdmin?: boolean
  isLoggedIn?: boolean
  onDeleted?: () => void
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

function formatTimeAgo(dateString: string): string {
  const date = new Date(dateString)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
  const diffDays = Math.floor(diffHours / 24)

  if (diffHours < 1) return "Meno di un'ora fa"
  if (diffHours === 1) return "1 ora fa"
  if (diffHours < 24) return `${diffHours} ore fa`
  if (diffDays === 1) return "1 giorno fa"
  return `${diffDays} giorni fa`
}

export function ReportCard({ report, isAdmin = false, isLoggedIn = false, onDeleted }: ReportCardProps) {
  const router = useRouter()
  const isSmarrito = report.report_type === "smarrito"
  const isAnonymous = report.is_anonymous === true
  const canSeeUserData = isAdmin || !isAnonymous
  const canSeePhone = report.show_phone && (isLoggedIn || isAdmin) && canSeeUserData
  const photos = report.image_url ? report.image_url.split(',').filter(Boolean) : []
  const hasPhoto = photos.length > 0

  const handleShare = async () => {
    const shareUrl = `${window.location.origin}/segnalazione/${report.id}`
    const shareText = `${reportTypeLabels[report.report_type]} - ${report.animal_name || animalTypeLabels[report.animal_type]} a ${report.city}`
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: shareText,
          text: report.description,
          url: shareUrl,
        })
      } catch (err) {
        // User cancelled or share failed
      }
    } else {
      // Fallback to clipboard
      await navigator.clipboard.writeText(shareUrl)
      alert("Link copiato negli appunti!")
    }
  }

  return (
    <Card className="group flex flex-col overflow-hidden transition-all hover:shadow-lg">
      {/* Clickable top section */}
      <div
        className="cursor-pointer"
        onClick={() => router.push(`/segnalazioni/${report.id}`)}
      >
        <div className="relative aspect-[4/3] overflow-hidden">
        {hasPhoto ? (
          <Image
            src={photos[0]}
            alt={report.animal_name || animalTypeLabels[report.animal_type]}
            fill
            className="object-cover transition-transform group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-muted">
            <div className={`flex h-16 w-16 items-center justify-center rounded-full ${isSmarrito ? "bg-destructive/20" : "bg-accent/20"}`}>
              <AnimalIcon type={report.animal_type} />
            </div>
          </div>
        )}
        <div className="absolute left-3 top-3 flex gap-2">
          <Badge
            variant={isSmarrito ? "destructive" : "default"}
            className={isSmarrito ? "bg-destructive text-destructive-foreground" : "bg-accent text-accent-foreground"}
          >
            {reportTypeLabels[report.report_type]}
          </Badge>
          {photos.length > 1 && (
            <Badge variant="secondary" className="bg-background/80">
              +{photos.length - 1} foto
            </Badge>
          )}
        </div>
        {/* Views count badge */}
        <div className="absolute bottom-3 right-3">
          <Badge variant="secondary" className="gap-1 bg-background/80">
            <Eye className="h-3 w-3" />
            {report.views_count || 0}
          </Badge>
        </div>
      </div>
      <CardContent className="flex-1 p-4">
        <div className="mb-2 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AnimalIcon type={report.animal_type} />
            <span className="font-semibold text-foreground">
              {report.animal_name || animalTypeLabels[report.animal_type]}
            </span>
          </div>
          <Badge variant="outline" className="text-xs">
            {animalTypeLabels[report.animal_type]}
          </Badge>
        </div>

        <p className="mb-3 line-clamp-2 text-sm text-muted-foreground">
          {report.description}
        </p>

        <div className="space-y-2 text-sm">
          {/* Author info */}
          <div className="flex items-center gap-2 text-muted-foreground">
            <User className="h-4 w-4 shrink-0" />
            <span className="font-medium text-foreground">
              {isAnonymous && !isAdmin ? (
                <span className="italic text-muted-foreground">Utente anonimo</span>
              ) : (
                <>
                  {report.profiles?.first_name || report.profiles?.last_name
                    ? `${report.profiles.first_name || ""} ${report.profiles.last_name || ""}`.trim()
                    : report.contact_name || "Utente anonimo"}
                  {isAnonymous && isAdmin && (
                    <Badge variant="outline" className="ml-2 text-xs">Anonimo</Badge>
                  )}
                </>
              )}
            </span>
          </div>
          {/* Date */}
          <div className="flex items-center gap-2 text-muted-foreground">
            <Calendar className="h-4 w-4 shrink-0" />
            <span>
              {new Date(report.created_at).toLocaleDateString("it-IT", {
                day: "2-digit",
                month: "long",
                year: "numeric",
              })}
            </span>
          </div>
          <div className="flex items-center gap-2 text-muted-foreground">
            <MapPin className="h-4 w-4 shrink-0" />
            <span className="truncate">
              {report.address}, {report.city}
            </span>
          </div>
          <div className="flex items-center gap-2 text-muted-foreground">
            <Clock className="h-4 w-4 shrink-0" />
            <span>{formatTimeAgo(report.created_at)}</span>
          </div>
          {report.contact_phone && canSeePhone && (
            <div className="flex items-center gap-2 text-muted-foreground">
              <Phone className="h-4 w-4 shrink-0" />
              <a
                href={`tel:${report.contact_phone}`}
                className="text-primary hover:underline"
              >
                {report.contact_phone}
              </a>
            </div>
          )}
          {isAdmin && report.ip_address && (
            <div className="mt-2 flex items-center gap-2 rounded bg-muted/50 px-2 py-1 text-xs text-muted-foreground">
              <Shield className="h-3 w-3 shrink-0" />
              <span className="font-mono">IP: {report.ip_address}</span>
            </div>
          )}
        </div>
        </CardContent>
      </div>
      <CardFooter className="flex flex-col gap-3 border-t p-4">
        <div className="flex w-full items-center justify-between">
          {canSeeUserData ? (
            <SendMessageDialog 
              reportId={report.id}
              reportOwnerId={report.user_id}
              animalName={report.animal_name}
              reportType={report.report_type}
            />
          ) : (
            <span className="text-xs text-muted-foreground italic">Segnalazione anonima</span>
          )}
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="sm" className="h-8 gap-1 px-2" onClick={handleShare}>
              <Share2 className="h-3.5 w-3.5" />
              <span className="text-xs">Condividi</span>
            </Button>
            {isLoggedIn && <FlagReportDialog reportId={report.id} />}
          </div>
        </div>
        {isAdmin && (
          <div className="flex w-full justify-end">
            <DeleteReportDialog
              reportId={report.id}
              reportUserId={report.user_id}
              onDeleted={onDeleted}
            />
          </div>
        )}
      </CardFooter>
    </Card>
  )
}
