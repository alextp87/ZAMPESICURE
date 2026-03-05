"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Shield, FileText, Loader2, Clock, Eye, Ban, Dog, Cat, Bird, CheckCircle2, MapPin, Pencil, Trash2, Sparkles, ThumbsUp, ThumbsDown, ImageIcon, AlertCircle, ChevronDown, ChevronUp, Check, X, UserX, Search, AlertTriangle } from "lucide-react"
import type { AnimalType, Report } from "@/lib/types"
import { animalTypeLabels } from "@/lib/types"
import Image from "next/image"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"

type AiMatch = {
  id: string
  sighting_report_id: string
  lost_report_id: string
  confidence_score: number
  ai_analysis: string
  status: "pending" | "confirmed" | "rejected"
  notified_at: string | null
  created_at: string
  sighting_report: {
    animal_name: string | null
    animal_type: string
    city: string
    image_url: string | null
    contact_name: string
    contact_email: string
    user_id: string | null
  }
  lost_report: {
    animal_name: string | null
    animal_type: string
    city: string
    image_url: string | null
    contact_name: string
    contact_email: string
    user_id: string | null
  }
}

type BannedUser = {
  id: string
  user_id: string
  reason: string
  banned_at: string
  banned_until: string | null
  banned_by: string
  profile?: { full_name: string | null; email: string | null }
}

export default function ModeratorPanel() {
  const [loading, setLoading] = useState(true)
  const [isModerator, setIsModerator] = useState(false)
  const router = useRouter()

  // Reports state
  const [allReports, setAllReports] = useState<Report[]>([])
  const [reportsFilter, setReportsFilter] = useState<"all" | "smarrito" | "avvistato" | "in_adozione">("all")
  const [reportsSearch, setReportsSearch] = useState("")
  const [deletingReportId, setDeletingReportId] = useState<string | null>(null)
  const [reportToDelete, setReportToDelete] = useState<Report | null>(null)

  // Edit report state
  const [editingReport, setEditingReport] = useState<Report | null>(null)
  const [editForm, setEditForm] = useState({ animal_name: "", description: "", city: "" })
  const [savingEdit, setSavingEdit] = useState(false)

  // AI Matches state
  const [aiMatches, setAiMatches] = useState<AiMatch[]>([])
  const [isLoadingAiMatches, setIsLoadingAiMatches] = useState(false)
  const [expandedMatchId, setExpandedMatchId] = useState<string | null>(null)
  const [processingMatchId, setProcessingMatchId] = useState<string | null>(null)

  // Ban user state
  const [bannedUsers, setBannedUsers] = useState<BannedUser[]>([])
  const [banDialogOpen, setBanDialogOpen] = useState(false)
  const [userToBan, setUserToBan] = useState<{ id: string; name: string } | null>(null)
  const [banReason, setBanReason] = useState("")
  const [banDuration, setBanDuration] = useState<"permanent" | "7days" | "30days">("7days")
  const [processingBan, setProcessingBan] = useState(false)

  useEffect(() => {
    const checkModerator = async () => {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) {
        router.push("/login")
        return
      }

      const { data: profile } = await supabase
        .from("profiles")
        .select("is_moderator, is_admin")
        .eq("id", user.id)
        .single()

      if (!profile?.is_moderator && !profile?.is_admin) {
        router.push("/")
        return
      }

      setIsModerator(true)
      setLoading(false)

      // Fetch data
      fetchAllReports()
      fetchAiMatches()
      fetchBannedUsers()
    }

    checkModerator()
  }, [router])

  const fetchAllReports = async () => {
    const supabase = createClient()
    const { data, error } = await supabase
      .from("reports")
      .select("*")
      .order("created_at", { ascending: false })

    if (!error && data) {
      setAllReports(data as Report[])
    }
  }

  const fetchAiMatches = async () => {
    setIsLoadingAiMatches(true)
    const supabase = createClient()
    const { data, error } = await supabase
      .from("ai_matches")
      .select(`
        *,
        sighting_report:sighting_report_id (
          animal_name, animal_type, city, image_url, contact_name, contact_email, user_id
        ),
        lost_report:lost_report_id (
          animal_name, animal_type, city, image_url, contact_name, contact_email, user_id
        )
      `)
      .order("created_at", { ascending: false })

    if (!error && data) {
      setAiMatches(data as unknown as AiMatch[])
    }
    setIsLoadingAiMatches(false)
  }

  const fetchBannedUsers = async () => {
    const supabase = createClient()
    const { data, error } = await supabase
      .from("banned_users")
      .select("*, profile:user_id(full_name, email)")
      .order("banned_at", { ascending: false })

    if (!error && data) {
      setBannedUsers(data as unknown as BannedUser[])
    }
  }

  const handleDeleteReport = async (report: Report) => {
    setDeletingReportId(report.id)
    const supabase = createClient()
    const { error } = await supabase.from("reports").delete().eq("id", report.id)
    if (!error) {
      setAllReports((prev) => prev.filter((r) => r.id !== report.id))
    }
    setDeletingReportId(null)
    setReportToDelete(null)
  }

  const openEditDialog = (report: Report) => {
    setEditingReport(report)
    setEditForm({
      animal_name: report.animal_name || "",
      description: report.description || "",
      city: report.city || "",
    })
  }

  const handleSaveEdit = async () => {
    if (!editingReport) return
    setSavingEdit(true)
    const supabase = createClient()
    const { error } = await supabase
      .from("reports")
      .update({
        animal_name: editForm.animal_name || null,
        description: editForm.description || null,
        city: editForm.city || null,
      })
      .eq("id", editingReport.id)

    if (!error) {
      setAllReports((prev) =>
        prev.map((r) =>
          r.id === editingReport.id
            ? { ...r, animal_name: editForm.animal_name || null, description: editForm.description || null, city: editForm.city || null }
            : r
        )
      )
      setEditingReport(null)
    }
    setSavingEdit(false)
  }

  const handleConfirmMatch = async (matchId: string) => {
    setProcessingMatchId(matchId + "_confirm")
    const supabase = createClient()
    await supabase.from("ai_matches").update({ status: "confirmed" }).eq("id", matchId)
    setAiMatches((prev) => prev.map((m) => m.id === matchId ? { ...m, status: "confirmed" as const } : m))
    setProcessingMatchId(null)
  }

  const handleRejectMatch = async (matchId: string) => {
    setProcessingMatchId(matchId + "_reject")
    const supabase = createClient()
    await supabase.from("ai_matches").update({ status: "rejected" }).eq("id", matchId)
    setAiMatches((prev) => prev.map((m) => m.id === matchId ? { ...m, status: "rejected" as const } : m))
    setProcessingMatchId(null)
  }

  const openBanDialog = (userId: string, userName: string) => {
    setUserToBan({ id: userId, name: userName })
    setBanReason("")
    setBanDuration("7days")
    setBanDialogOpen(true)
  }

  const handleBanUser = async () => {
    if (!userToBan || !banReason.trim()) return
    setProcessingBan(true)

    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()

    let bannedUntil: string | null = null
    if (banDuration === "7days") {
      bannedUntil = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
    } else if (banDuration === "30days") {
      bannedUntil = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
    }

    const { error } = await supabase.from("banned_users").insert({
      user_id: userToBan.id,
      reason: banReason,
      banned_by: user?.id,
      banned_until: bannedUntil,
    })

    if (!error) {
      fetchBannedUsers()
      setBanDialogOpen(false)
      setUserToBan(null)
    }
    setProcessingBan(false)
  }

  const handleUnbanUser = async (banId: string) => {
    const supabase = createClient()
    const { error } = await supabase.from("banned_users").delete().eq("id", banId)
    if (!error) {
      setBannedUsers((prev) => prev.filter((b) => b.id !== banId))
    }
  }

  const AnimalIcon = ({ type }: { type: AnimalType }) => {
    switch (type) {
      case "cane": return <Dog className="h-4 w-4" />
      case "gatto": return <Cat className="h-4 w-4" />
      case "uccello": return <Bird className="h-4 w-4" />
      default: return <Dog className="h-4 w-4" />
    }
  }

  const filteredReports = allReports.filter((r) => {
    if (reportsFilter !== "all" && r.report_type !== reportsFilter) return false
    if (reportsSearch) {
      const search = reportsSearch.toLowerCase()
      return (
        r.animal_name?.toLowerCase().includes(search) ||
        r.city?.toLowerCase().includes(search) ||
        r.contact_name?.toLowerCase().includes(search)
      )
    }
    return true
  })

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  if (!isModerator) {
    return null
  }

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Header />
      <main className="flex-1 px-4 py-8">
        <div className="mx-auto max-w-7xl">
          <div className="mb-8 flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-100">
              <Shield className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">Pannello Moderatore</h1>
              <p className="text-muted-foreground">Gestisci post, segnalazioni e utenti</p>
            </div>
          </div>

          <Tabs defaultValue="posts" className="space-y-6">
            <TabsList className="grid w-full grid-cols-3 lg:w-auto lg:grid-cols-none lg:flex">
              <TabsTrigger value="posts" className="gap-2">
                <FileText className="h-4 w-4" />
                Post
                <Badge variant="secondary" className="ml-1 h-5 px-1.5 text-xs">
                  {allReports.length}
                </Badge>
              </TabsTrigger>
              <TabsTrigger value="ai-match" className="gap-2">
                <Sparkles className="h-4 w-4" />
                AI Match
                {aiMatches.filter((m) => m.status === "pending").length > 0 && (
                  <Badge variant="destructive" className="ml-1 h-5 px-1.5 text-xs">
                    {aiMatches.filter((m) => m.status === "pending").length}
                  </Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="banned" className="gap-2">
                <UserX className="h-4 w-4" />
                Utenti Bannati
                <Badge variant="secondary" className="ml-1 h-5 px-1.5 text-xs">
                  {bannedUsers.length}
                </Badge>
              </TabsTrigger>
            </TabsList>

            {/* ===== POSTS TAB ===== */}
            <TabsContent value="posts">
              <Card>
                <CardHeader>
                  <CardTitle>Tutte le Segnalazioni</CardTitle>
                  <CardDescription>Visualizza, modifica o elimina le segnalazioni</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="mb-4 flex flex-col gap-3 sm:flex-row">
                    <div className="relative flex-1">
                      <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                      <Input
                        placeholder="Cerca per nome, città o contatto..."
                        value={reportsSearch}
                        onChange={(e) => setReportsSearch(e.target.value)}
                        className="pl-9"
                      />
                    </div>
                    <Select value={reportsFilter} onValueChange={(v) => setReportsFilter(v as typeof reportsFilter)}>
                      <SelectTrigger className="w-full sm:w-48">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Tutti i tipi</SelectItem>
                        <SelectItem value="smarrito">Smarriti</SelectItem>
                        <SelectItem value="avvistato">Avvistati</SelectItem>
                        <SelectItem value="in_adozione">In adozione</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-3">
                    {filteredReports.length === 0 ? (
                      <div className="py-12 text-center text-muted-foreground">
                        Nessuna segnalazione trovata
                      </div>
                    ) : (
                      filteredReports.map((report) => {
                        const imgUrl = report.image_url?.split(",")[0]?.trim()
                        return (
                          <div key={report.id} className="flex items-center gap-4 rounded-lg border p-4">
                            {imgUrl ? (
                              <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-lg border bg-muted">
                                <Image src={imgUrl} alt={report.animal_name || "Animale"} fill className="object-cover" unoptimized />
                              </div>
                            ) : (
                              <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-lg border bg-muted text-muted-foreground">
                                <AnimalIcon type={report.animal_type as AnimalType} />
                              </div>
                            )}
                            <div className="flex-1 space-y-1">
                              <div className="flex items-center gap-2">
                                <span className="font-medium">{report.animal_name || "Senza nome"}</span>
                                <Badge variant={report.report_type === "smarrito" ? "destructive" : report.report_type === "avvistato" ? "default" : "secondary"}>
                                  {report.report_type === "smarrito" ? "Smarrito" : report.report_type === "avvistato" ? "Avvistato" : "In adozione"}
                                </Badge>
                                <Badge variant="outline" className="gap-1">
                                  <AnimalIcon type={report.animal_type as AnimalType} />
                                  {animalTypeLabels[report.animal_type as AnimalType] || report.animal_type}
                                </Badge>
                              </div>
                              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                                <span className="flex items-center gap-1">
                                  <MapPin className="h-3.5 w-3.5" />
                                  {report.city || "N/D"}
                                </span>
                                <span>{report.contact_name}</span>
                                <span>{new Date(report.created_at).toLocaleDateString("it-IT")}</span>
                              </div>
                            </div>
                            <div className="flex gap-2">
                              <Button size="sm" variant="outline" onClick={() => openEditDialog(report)}>
                                <Pencil className="h-4 w-4" />
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                className="text-destructive hover:bg-destructive hover:text-destructive-foreground"
                                onClick={() => setReportToDelete(report)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                              {report.user_id && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="text-orange-600 hover:bg-orange-600 hover:text-white"
                                  onClick={() => openBanDialog(report.user_id!, report.contact_name)}
                                >
                                  <Ban className="h-4 w-4" />
                                </Button>
                              )}
                            </div>
                          </div>
                        )
                      })
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* ===== AI MATCH TAB ===== */}
            <TabsContent value="ai-match">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Sparkles className="h-5 w-5 text-primary" />
                    Corrispondenze AI
                  </CardTitle>
                  <CardDescription>
                    Match trovati dall&apos;intelligenza artificiale tra avvistamenti e smarrimenti
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {isLoadingAiMatches ? (
                    <div className="flex justify-center py-12">
                      <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                    </div>
                  ) : aiMatches.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-16 text-center text-muted-foreground">
                      <Sparkles className="mb-3 h-10 w-10 opacity-30" />
                      <p className="font-medium">Nessun match trovato</p>
                      <p className="mt-1 text-sm">I match AI appariranno qui</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div className="flex gap-3 text-sm">
                        <span className="flex items-center gap-1.5 rounded-full bg-yellow-100 px-3 py-1 font-medium text-yellow-800">
                          <Clock className="h-3.5 w-3.5" />
                          {aiMatches.filter((m) => m.status === "pending").length} in attesa
                        </span>
                        <span className="flex items-center gap-1.5 rounded-full bg-green-100 px-3 py-1 font-medium text-green-800">
                          <CheckCircle2 className="h-3.5 w-3.5" />
                          {aiMatches.filter((m) => m.status === "confirmed").length} confermati
                        </span>
                        <span className="flex items-center gap-1.5 rounded-full bg-red-100 px-3 py-1 font-medium text-red-800">
                          <X className="h-3.5 w-3.5" />
                          {aiMatches.filter((m) => m.status === "rejected").length} rifiutati
                        </span>
                      </div>

                      {aiMatches.map((match) => {
                        const analysis = (() => { try { return JSON.parse(match.ai_analysis) } catch { return null } })()
                        const isExpanded = expandedMatchId === match.id
                        const sightingImg = match.sighting_report?.image_url?.split(",")[0]?.trim()
                        const lostImg = match.lost_report?.image_url?.split(",")[0]?.trim()

                        return (
                          <div
                            key={match.id}
                            className={`rounded-xl border bg-card shadow-sm transition-all ${
                              match.status === "pending"
                                ? "border-yellow-200 bg-yellow-50/40"
                                : match.status === "confirmed"
                                ? "border-green-200 bg-green-50/40"
                                : "border-muted opacity-60"
                            }`}
                          >
                            <div className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center">
                              <div className="flex shrink-0 items-center gap-2">
                                <div className="relative">
                                  {sightingImg ? (
                                    <div className="relative h-20 w-20 overflow-hidden rounded-lg border bg-muted">
                                      <Image src={sightingImg} alt="Avvistato" fill className="object-cover" unoptimized />
                                    </div>
                                  ) : (
                                    <div className="flex h-20 w-20 items-center justify-center rounded-lg border bg-muted text-muted-foreground">
                                      <ImageIcon className="h-7 w-7" />
                                    </div>
                                  )}
                                  <span className="absolute -bottom-2 left-1/2 -translate-x-1/2 rounded-full bg-accent px-2 py-0.5 text-[10px] font-bold text-accent-foreground whitespace-nowrap">
                                    Avvistato
                                  </span>
                                </div>

                                <div className="flex flex-col items-center gap-1 px-1">
                                  <span
                                    className={`rounded-full px-2 py-1 text-sm font-bold ${
                                      match.confidence_score >= 85
                                        ? "bg-green-100 text-green-800"
                                        : match.confidence_score >= 70
                                        ? "bg-yellow-100 text-yellow-800"
                                        : "bg-orange-100 text-orange-800"
                                    }`}
                                  >
                                    {match.confidence_score}%
                                  </span>
                                  <AlertCircle className="h-4 w-4 text-muted-foreground" />
                                </div>

                                <div className="relative">
                                  {lostImg ? (
                                    <div className="relative h-20 w-20 overflow-hidden rounded-lg border bg-muted">
                                      <Image src={lostImg} alt="Smarrito" fill className="object-cover" unoptimized />
                                    </div>
                                  ) : (
                                    <div className="flex h-20 w-20 items-center justify-center rounded-lg border bg-muted text-muted-foreground">
                                      <ImageIcon className="h-7 w-7" />
                                    </div>
                                  )}
                                  <span className="absolute -bottom-2 left-1/2 -translate-x-1/2 rounded-full bg-destructive px-2 py-0.5 text-[10px] font-bold text-destructive-foreground whitespace-nowrap">
                                    Smarrito
                                  </span>
                                </div>
                              </div>

                              <div className="flex-1 space-y-1.5 pt-2 sm:pt-0">
                                <div className="flex flex-wrap items-center gap-2">
                                  <Badge
                                    variant={match.status === "pending" ? "outline" : match.status === "confirmed" ? "default" : "destructive"}
                                    className={match.status === "confirmed" ? "border-green-500 bg-green-100 text-green-800" : ""}
                                  >
                                    {match.status === "pending" ? "In attesa" : match.status === "confirmed" ? "Confermato" : "Rifiutato"}
                                  </Badge>
                                  <span className="text-xs text-muted-foreground">
                                    {new Date(match.created_at).toLocaleDateString("it-IT", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" })}
                                  </span>
                                </div>
                                <div className="grid grid-cols-2 gap-x-4 gap-y-0.5 text-sm">
                                  <div>
                                    <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Avvistamento</span>
                                    <p className="font-medium">{match.sighting_report?.animal_name || "Senza nome"}</p>
                                    <p className="text-xs text-muted-foreground">{match.sighting_report?.contact_name} — {match.sighting_report?.city}</p>
                                  </div>
                                  <div>
                                    <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Smarrito</span>
                                    <p className="font-medium">{match.lost_report?.animal_name || "Senza nome"}</p>
                                    <p className="text-xs text-muted-foreground">{match.lost_report?.contact_name} — {match.lost_report?.city}</p>
                                  </div>
                                </div>
                              </div>

                              <div className="flex shrink-0 flex-col gap-2">
                                {match.status === "pending" && (
                                  <>
                                    <Button
                                      size="sm"
                                      className="gap-1.5 bg-green-600 text-white hover:bg-green-700"
                                      disabled={processingMatchId === match.id + "_confirm"}
                                      onClick={() => handleConfirmMatch(match.id)}
                                    >
                                      {processingMatchId === match.id + "_confirm"
                                        ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                        : <ThumbsUp className="h-3.5 w-3.5" />
                                      }
                                      Conferma
                                    </Button>
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      className="gap-1.5 text-destructive hover:bg-destructive hover:text-destructive-foreground"
                                      disabled={processingMatchId === match.id + "_reject"}
                                      onClick={() => handleRejectMatch(match.id)}
                                    >
                                      {processingMatchId === match.id + "_reject"
                                        ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                        : <ThumbsDown className="h-3.5 w-3.5" />
                                      }
                                      Rifiuta
                                    </Button>
                                  </>
                                )}
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  className="gap-1.5 text-muted-foreground"
                                  onClick={() => setExpandedMatchId(isExpanded ? null : match.id)}
                                >
                                  {isExpanded ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
                                  {isExpanded ? "Meno" : "Analisi AI"}
                                </Button>
                              </div>
                            </div>

                            {isExpanded && analysis && (
                              <div className="border-t px-4 pb-4 pt-3">
                                <h4 className="mb-2 flex items-center gap-1.5 text-sm font-semibold">
                                  <Sparkles className="h-4 w-4 text-primary" />
                                  Analisi dettagliata
                                </h4>
                                <p className="mb-3 text-sm text-muted-foreground leading-relaxed">{analysis.analysis}</p>
                                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                                  {analysis.matchingFeatures?.length > 0 && (
                                    <div className="rounded-lg bg-green-50 p-3">
                                      <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-green-700">Caratteristiche corrispondenti</p>
                                      <ul className="space-y-1">
                                        {analysis.matchingFeatures.map((f: string, i: number) => (
                                          <li key={i} className="flex items-start gap-1.5 text-sm text-green-800">
                                            <Check className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                                            {f}
                                          </li>
                                        ))}
                                      </ul>
                                    </div>
                                  )}
                                  {analysis.differingFeatures?.length > 0 && (
                                    <div className="rounded-lg bg-red-50 p-3">
                                      <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-red-700">Caratteristiche differenti</p>
                                      <ul className="space-y-1">
                                        {analysis.differingFeatures.map((f: string, i: number) => (
                                          <li key={i} className="flex items-start gap-1.5 text-sm text-red-800">
                                            <X className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                                            {f}
                                          </li>
                                        ))}
                                      </ul>
                                    </div>
                                  )}
                                </div>
                                <div className="mt-3 flex gap-2">
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    className="gap-1.5 text-xs"
                                    onClick={() => window.open(`/segnalazioni/${match.sighting_report_id}`, "_blank")}
                                  >
                                    <Eye className="h-3.5 w-3.5" />
                                    Vedi avvistamento
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    className="gap-1.5 text-xs"
                                    onClick={() => window.open(`/segnalazioni/${match.lost_report_id}`, "_blank")}
                                  >
                                    <Eye className="h-3.5 w-3.5" />
                                    Vedi smarrimento
                                  </Button>
                                </div>
                              </div>
                            )}
                          </div>
                        )
                      })}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* ===== BANNED USERS TAB ===== */}
            <TabsContent value="banned">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <UserX className="h-5 w-5 text-destructive" />
                    Utenti Bannati
                  </CardTitle>
                  <CardDescription>Gestisci i ban degli utenti</CardDescription>
                </CardHeader>
                <CardContent>
                  {bannedUsers.length === 0 ? (
                    <div className="py-12 text-center text-muted-foreground">
                      <AlertTriangle className="mx-auto mb-3 h-10 w-10 opacity-30" />
                      <p>Nessun utente bannato</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {bannedUsers.map((ban) => (
                        <div key={ban.id} className="flex items-center justify-between rounded-lg border p-4">
                          <div>
                            <p className="font-medium">{ban.profile?.full_name || ban.profile?.email || ban.user_id}</p>
                            <p className="text-sm text-muted-foreground">Motivo: {ban.reason}</p>
                            <p className="text-xs text-muted-foreground">
                              Bannato il {new Date(ban.banned_at).toLocaleDateString("it-IT")}
                              {ban.banned_until && ` — scade il ${new Date(ban.banned_until).toLocaleDateString("it-IT")}`}
                              {!ban.banned_until && " — permanente"}
                            </p>
                          </div>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleUnbanUser(ban.id)}
                          >
                            Rimuovi ban
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </main>
      <Footer />

      {/* Delete Report Dialog */}
      <AlertDialog open={!!reportToDelete} onOpenChange={() => setReportToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Eliminare questa segnalazione?</AlertDialogTitle>
            <AlertDialogDescription>
              Stai per eliminare la segnalazione di &quot;{reportToDelete?.animal_name || "Senza nome"}&quot;. Questa azione non può essere annullata.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annulla</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => reportToDelete && handleDeleteReport(reportToDelete)}
              disabled={deletingReportId === reportToDelete?.id}
            >
              {deletingReportId === reportToDelete?.id ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Trash2 className="mr-2 h-4 w-4" />
              )}
              Elimina
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Edit Report Dialog */}
      <Dialog open={!!editingReport} onOpenChange={() => setEditingReport(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Modifica Segnalazione</DialogTitle>
            <DialogDescription>Modifica i dettagli della segnalazione</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Nome animale</Label>
              <Input
                value={editForm.animal_name}
                onChange={(e) => setEditForm((p) => ({ ...p, animal_name: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label>Città</Label>
              <Input
                value={editForm.city}
                onChange={(e) => setEditForm((p) => ({ ...p, city: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label>Descrizione</Label>
              <Textarea
                value={editForm.description}
                onChange={(e) => setEditForm((p) => ({ ...p, description: e.target.value }))}
                rows={4}
              />
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setEditingReport(null)}>Annulla</Button>
            <Button onClick={handleSaveEdit} disabled={savingEdit}>
              {savingEdit && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Salva
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Ban User Dialog */}
      <Dialog open={banDialogOpen} onOpenChange={setBanDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Ban className="h-5 w-5 text-destructive" />
              Banna Utente
            </DialogTitle>
            <DialogDescription>
              Stai per bannare &quot;{userToBan?.name}&quot;
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Motivo del ban *</Label>
              <Textarea
                value={banReason}
                onChange={(e) => setBanReason(e.target.value)}
                placeholder="Inserisci il motivo del ban..."
                rows={3}
              />
            </div>
            <div className="space-y-2">
              <Label>Durata</Label>
              <Select value={banDuration} onValueChange={(v) => setBanDuration(v as typeof banDuration)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="7days">7 giorni</SelectItem>
                  <SelectItem value="30days">30 giorni</SelectItem>
                  <SelectItem value="permanent">Permanente</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setBanDialogOpen(false)}>Annulla</Button>
            <Button
              variant="destructive"
              onClick={handleBanUser}
              disabled={processingBan || !banReason.trim()}
            >
              {processingBan && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Conferma Ban
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
