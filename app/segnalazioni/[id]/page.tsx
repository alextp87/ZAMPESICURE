"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { SendMessageDialog } from "@/components/send-message-dialog"
import { FlagReportDialog } from "@/components/flag-report-dialog"
import {
  MapPin,
  Clock,
  Phone,
  Dog,
  Cat,
  Bird,
  User,
  Calendar,
  ArrowLeft,
  Share2,
  ChevronLeft,
  ChevronRight,
  X,
  Loader2,
  CheckCircle2,
} from "lucide-react"
import type { Report } from "@/lib/types"
import { animalTypeLabels, reportTypeLabels } from "@/lib/types"
import Image from "next/image"

function AnimalIcon({ type }: { type: Report["animal_type"] }) {
  switch (type) {
    case "cane": return <Dog className="h-5 w-5" />
    case "gatto": return <Cat className="h-5 w-5" />
    case "volatile": return <Bird className="h-5 w-5" />
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

export default function ReportDetailPage() {
  const params = useParams()
  const router = useRouter()
  const [report, setReport] = useState<Report | null>(null)
  const [loading, setLoading] = useState(true)
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [isAdmin, setIsAdmin] = useState(false)
  const [activePhoto, setActivePhoto] = useState(0)
  const [lightboxOpen, setLightboxOpen] = useState(false)
  const [lightboxIndex, setLightboxIndex] = useState(0)

  useEffect(() => {
    const loadReport = async () => {
      const supabase = createClient()

      const { data: { user } } = await supabase.auth.getUser()
      setIsLoggedIn(!!user)
      
      // Check if user is admin or moderator
      if (user) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("role")
          .eq("id", user.id)
          .single()
        setIsAdmin(profile?.role === "admin" || profile?.role === "moderator")
      }

      const { data, error } = await supabase
        .from("reports")
        .select("*, profiles(first_name, last_name)")
        .eq("id", params.id)
        .single()

      if (!error && data) {
        setReport(data as Report)
        // Only increment view count for active reports
        if (data.status === "active") {
          await supabase
            .from("reports")
            .update({ views_count: (data.views_count || 0) + 1 })
            .eq("id", params.id)
        }
      }
      setLoading(false)
    }
    loadReport()
  }, [params.id])

  const handleShare = async () => {
    if (!report) return
    const shareUrl = window.location.href
    const shareText = `${reportTypeLabels[report.report_type]} - ${report.animal_name || animalTypeLabels[report.animal_type]} a ${report.city}`
    if (navigator.share) {
      try { await navigator.share({ title: shareText, text: report.description, url: shareUrl }) } catch {}
    } else {
      await navigator.clipboard.writeText(shareUrl)
      alert("Link copiato negli appunti!")
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-screen flex-col bg-background">
        <Header />
        <main className="flex flex-1 items-center justify-center">
          <Loader2 className="h-10 w-10 animate-spin text-primary" />
        </main>
        <Footer />
      </div>
    )
  }

  if (!report) {
    return (
      <div className="flex min-h-screen flex-col bg-background">
        <Header />
        <main className="flex flex-1 flex-col items-center justify-center gap-4">
          <p className="text-muted-foreground">Segnalazione non trovata.</p>
          <Button onClick={() => router.push("/segnalazioni")} variant="outline">
            <ArrowLeft className="mr-2 h-4 w-4" /> Torna alle segnalazioni
          </Button>
        </main>
        <Footer />
      </div>
    )
  }

  const isSmarrito = report.report_type === "smarrito"
  const photos = report.image_url ? report.image_url.split(",").filter(Boolean) : []
  const isAnonymous = report.is_anonymous === true
  const canSeeUserData = isAdmin || !isAnonymous
  const authorName = canSeeUserData
    ? (report.profiles?.first_name || report.profiles?.last_name
        ? `${report.profiles.first_name || ""} ${report.profiles.last_name || ""}`.trim()
        : report.contact_name || "Utente anonimo")
    : "Utente anonimo"

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Header />
      <main className="flex-1 py-8">
        <div className="mx-auto max-w-4xl px-4">
          {/* Back button */}
          <Button
            variant="ghost"
            className="mb-6 gap-2 text-muted-foreground"
            onClick={() => router.back()}
          >
            <ArrowLeft className="h-4 w-4" />
            Torna alle segnalazioni
          </Button>

          {/* Resolved banner */}
          {report.status === "resolved" && (
            <div className="mb-6 flex items-center gap-3 rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-green-800">
              <CheckCircle2 className="h-5 w-5 shrink-0 text-green-600" />
              <div>
                <p className="font-semibold">
                  {report.report_type === "smarrito" ? "Animale ritrovato!" : "Animale riconsegnato al proprietario!"}
                </p>
                <p className="text-sm text-green-700">Questa segnalazione e stata contrassegnata come risolta.</p>
              </div>
            </div>
          )}

          <div className="grid gap-8 lg:grid-cols-[1fr_360px]">
            {/* Left: Photos */}
            <div className="space-y-4">
              {/* Main photo */}
              <div className="relative overflow-hidden rounded-2xl bg-muted">
                {photos.length > 0 ? (
                  <div
                    className="relative aspect-[4/3] cursor-zoom-in"
                    onClick={() => { setLightboxIndex(activePhoto); setLightboxOpen(true) }}
                  >
                    <Image
                      src={photos[activePhoto]}
                      alt={report.animal_name || animalTypeLabels[report.animal_type]}
                      fill
                      className="object-cover"
                      sizes="(max-width: 768px) 100vw, 600px"
                      loading="eager"
                      priority
                    />
                    <div className="absolute inset-0 flex items-center justify-between px-3">
                      {photos.length > 1 && activePhoto > 0 && (
                        <button
                          className="flex h-9 w-9 items-center justify-center rounded-full bg-background/80 shadow transition hover:bg-background"
                          onClick={(e) => { e.stopPropagation(); setActivePhoto(activePhoto - 1) }}
                        >
                          <ChevronLeft className="h-5 w-5" />
                        </button>
                      )}
                      <div className="flex-1" />
                      {photos.length > 1 && activePhoto < photos.length - 1 && (
                        <button
                          className="flex h-9 w-9 items-center justify-center rounded-full bg-background/80 shadow transition hover:bg-background"
                          onClick={(e) => { e.stopPropagation(); setActivePhoto(activePhoto + 1) }}
                        >
                          <ChevronRight className="h-5 w-5" />
                        </button>
                      )}
                    </div>
                    <div className="absolute left-3 top-3 flex gap-2">
                      <Badge
                        className={isSmarrito ? "bg-destructive text-destructive-foreground" : "bg-accent text-accent-foreground"}
                      >
                        {reportTypeLabels[report.report_type]}
                      </Badge>
                    </div>
                    {photos.length > 1 && (
                      <div className="absolute bottom-3 right-3">
                        <Badge variant="secondary" className="bg-background/80">
                          {activePhoto + 1} / {photos.length}
                        </Badge>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="flex aspect-[4/3] items-center justify-center">
                    <div className={`flex h-24 w-24 items-center justify-center rounded-full ${isSmarrito ? "bg-destructive/20" : "bg-accent/20"}`}>
                      <AnimalIcon type={report.animal_type} />
                    </div>
                  </div>
                )}
              </div>

              {/* Thumbnail strip */}
              {photos.length > 1 && (
                <div className="flex gap-3 overflow-x-auto pb-1">
                  {photos.map((photo, idx) => (
                    <button
                      key={idx}
                      onClick={() => setActivePhoto(idx)}
                      className={`relative h-20 w-20 shrink-0 overflow-hidden rounded-lg border-2 transition ${
                        idx === activePhoto ? "border-primary" : "border-transparent opacity-60 hover:opacity-100"
                      }`}
                    >
                      <Image src={photo} alt={`Foto ${idx + 1}`} fill className="object-cover" />
                    </button>
                  ))}
                </div>
              )}

              {/* Description */}
              <div className="rounded-xl border bg-card p-5">
                <h2 className="mb-2 font-semibold text-foreground">Descrizione</h2>
                <p className="leading-relaxed text-muted-foreground">{report.description}</p>
              </div>
            </div>

            {/* Right: Info panel */}
            <div className="space-y-4">
              <div className="rounded-xl border bg-card p-5">
                <div className="mb-4 flex items-center gap-3">
                  <div className={`flex h-10 w-10 items-center justify-center rounded-full ${isSmarrito ? "bg-destructive/10 text-destructive" : "bg-accent/10 text-accent"}`}>
                    <AnimalIcon type={report.animal_type} />
                  </div>
                  <div>
                    <h1 className="text-xl font-bold text-foreground">
                      {report.animal_name || animalTypeLabels[report.animal_type]}
                    </h1>
                    <Badge variant="outline" className="text-xs">
                      {animalTypeLabels[report.animal_type]}
                    </Badge>
                  </div>
                </div>

                <div className="space-y-3 text-sm">
                  <div className="flex items-center gap-3 text-muted-foreground">
                    <User className="h-4 w-4 shrink-0 text-primary" />
                    <span className="font-medium text-foreground">
                      {isAnonymous && !isAdmin ? (
                        <span className="italic text-muted-foreground">Utente anonimo</span>
                      ) : (
                        <>
                          {authorName}
                          {isAnonymous && isAdmin && (
                            <Badge variant="outline" className="ml-2 text-xs">Anonimo</Badge>
                          )}
                        </>
                      )}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 text-muted-foreground">
                    <Calendar className="h-4 w-4 shrink-0 text-primary" />
                    <span>
                      {new Date(report.created_at).toLocaleDateString("it-IT", {
                        day: "2-digit", month: "long", year: "numeric",
                      })}
                    </span>
                  </div>
                  <div className="flex items-start gap-3 text-muted-foreground">
                    <MapPin className="h-4 w-4 shrink-0 text-primary mt-0.5" />
                    <span>{report.address}, {report.city}</span>
                  </div>
                  <div className="flex items-center gap-3 text-muted-foreground">
                    <Clock className="h-4 w-4 shrink-0 text-primary" />
                    <span>{formatTimeAgo(report.created_at)}</span>
                  </div>
                  {report.contact_phone && report.show_phone && isLoggedIn && canSeeUserData && (
                    <div className="flex items-center gap-3 text-muted-foreground">
                      <Phone className="h-4 w-4 shrink-0 text-primary" />
                      <a href={`tel:${report.contact_phone}`} className="text-primary hover:underline">
                        {report.contact_phone}
                      </a>
                    </div>
                  )}
                </div>
              </div>

              {/* Actions */}
              <div className="space-y-2">
                {canSeeUserData ? (
                  <SendMessageDialog
                    reportId={report.id}
                    reportOwnerId={report.user_id}
                    animalName={report.animal_name}
                    reportType={report.report_type}
                    fullWidth
                  />
                ) : (
                  <div className="rounded-lg border border-border bg-muted/50 p-3 text-center text-sm text-muted-foreground">
                    Questa segnalazione e anonima. Non e possibile contattare l&apos;autore direttamente.
                  </div>
                )}
                <Button variant="outline" className="w-full gap-2" onClick={handleShare}>
                  <Share2 className="h-4 w-4" />
                  Condividi segnalazione
                </Button>
                {isLoggedIn && <FlagReportDialog reportId={report.id} fullWidth />}
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Lightbox */}
      {lightboxOpen && photos.length > 0 && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/90"
          onClick={() => setLightboxOpen(false)}
        >
          <button
            className="absolute right-4 top-4 flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20"
            onClick={() => setLightboxOpen(false)}
          >
            <X className="h-5 w-5" />
          </button>
          {lightboxIndex > 0 && (
            <button
              className="absolute left-4 flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20"
              onClick={(e) => { e.stopPropagation(); setLightboxIndex(lightboxIndex - 1) }}
            >
              <ChevronLeft className="h-6 w-6" />
            </button>
          )}
          <div
            className="relative max-h-[90vh] max-w-[90vw]"
            onClick={(e) => e.stopPropagation()}
          >
            <img
              src={photos[lightboxIndex]}
              alt={`Foto ${lightboxIndex + 1}`}
              className="max-h-[90vh] max-w-[90vw] rounded-lg object-contain"
            />
          </div>
          {lightboxIndex < photos.length - 1 && (
            <button
              className="absolute right-4 flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20"
              onClick={(e) => { e.stopPropagation(); setLightboxIndex(lightboxIndex + 1) }}
            >
              <ChevronRight className="h-6 w-6" />
            </button>
          )}
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-sm text-white/70">
            {lightboxIndex + 1} / {photos.length}
          </div>
        </div>
      )}

      <Footer />
    </div>
  )
}
