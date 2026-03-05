"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Shield, FileText, Save, Loader2, CheckCircle, Lock, Users, UserX, UserCheck, Flag, AlertTriangle, Check, X, MessageCircle, Eye, Ban, Clock, Search, ShieldCheck, ShieldOff, Building2, Phone, Mail, Globe, Dog, Cat, Bird, Tag, CheckCircle2, MapPin, Pencil, Trash2, Sparkles, ThumbsUp, ThumbsDown, ImageIcon, AlertCircle, ChevronDown, ChevronUp } from "lucide-react"
import { RichTextEditor } from "@/components/rich-text-editor"

interface ContactRequest {
  id: string
  name: string
  email: string
  subject: string
  message: string
  status: "new" | "read" | "replied"
  created_at: string
}
import { animalTypeLabels } from "@/lib/types"
import Image from "next/image"

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
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import Link from "next/link"

interface BannedUser {
  id: string
  first_name: string | null
  last_name: string | null
  ban_reason: string | null
  banned_at: string | null
  email?: string
}

interface ReportFlagWithDetails {
  id: string
  report_id: string
  reason: string
  status: string
  created_at: string
  reports?: {
    animal_name: string | null
    animal_type: string
    city: string
  }
}

interface ConversationWithUsers {
  id: string
  participant_1: string
  participant_2: string
  last_message_at: string
  created_at: string
  user1?: { first_name: string | null; last_name: string | null }
  user2?: { first_name: string | null; last_name: string | null }
  message_count?: number
}

interface MessageReport {
  id: string
  message_id: string
  conversation_id: string
  reporter_id: string
  reported_user_id: string
  reason: string
  message_content: string
  status: string
  created_at: string
  reported_user?: { first_name: string | null; last_name: string | null }
}

interface AllUser {
  id: string
  first_name: string | null
  last_name: string | null
  is_admin: boolean
  is_moderator: boolean
  is_banned: boolean
  created_at: string
}

export default function AdminPage() {
  const [isAdmin, setIsAdmin] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [regolamento, setRegolamento] = useState("")
  const [privacyPolicy, setPrivacyPolicy] = useState("")
  const [isSavingRegolamento, setIsSavingRegolamento] = useState(false)
  const [isSavingPrivacy, setIsSavingPrivacy] = useState(false)
  const [saveSuccessRegolamento, setSaveSuccessRegolamento] = useState(false)
  const [saveSuccessPrivacy, setSaveSuccessPrivacy] = useState(false)
  const [bannedUsers, setBannedUsers] = useState<BannedUser[]>([])
  const [isLoadingUsers, setIsLoadingUsers] = useState(false)
  const [unbanningUserId, setUnbanningUserId] = useState<string | null>(null)
  const [reportFlags, setReportFlags] = useState<ReportFlagWithDetails[]>([])
  const [isLoadingFlags, setIsLoadingFlags] = useState(false)
  const [processingFlagId, setProcessingFlagId] = useState<string | null>(null)
  const [conversations, setConversations] = useState<ConversationWithUsers[]>([])
  const [isLoadingChats, setIsLoadingChats] = useState(false)
  const [messageReports, setMessageReports] = useState<MessageReport[]>([])
  const [isLoadingMessageReports, setIsLoadingMessageReports] = useState(false)
  const [processingReportId, setProcessingReportId] = useState<string | null>(null)
  const [selectedAction, setSelectedAction] = useState<Record<string, string>>({})
  const [suspensionDays, setSuspensionDays] = useState<Record<string, string>>({})
  const [allUsers, setAllUsers] = useState<AllUser[]>([])
  const [isLoadingAllUsers, setIsLoadingAllUsers] = useState(false)
  const [userSearchQuery, setUserSearchQuery] = useState("")
  const [togglingAdminId, setTogglingAdminId] = useState<string | null>(null)
  const [sponsorRequests, setSponsorRequests] = useState<SponsorRequest[]>([])
  const [isLoadingSponsors, setIsLoadingSponsors] = useState(false)
  const [processingSponsorId, setProcessingSponsorId] = useState<string | null>(null)
  const [contactRequests, setContactRequests] = useState<ContactRequest[]>([])
  const [isLoadingContacts, setIsLoadingContacts] = useState(false)

  // All reports state
  const [allReports, setAllReports] = useState<Report[]>([])
  const [isLoadingReports, setIsLoadingReports] = useState(false)
  const [reportsSearch, setReportsSearch] = useState("")
  const [reportsStatusFilter, setReportsStatusFilter] = useState<"all" | "active" | "resolved">("all")
  const [processingReportActionId, setProcessingReportActionId] = useState<string | null>(null)

  // Posts tab dialogs
  const [deleteReportDialog, setDeleteReportDialog] = useState<{ open: boolean; reportId: string | null }>({ open: false, reportId: null })
  const [banUserDialog, setBanUserDialog] = useState<{ open: boolean; userId: string | null; userName: string }>({ open: false, userId: null, userName: "" })
  const [suspendUserDialog, setSuspendUserDialog] = useState<{ open: boolean; userId: string | null; userName: string }>({ open: false, userId: null, userName: "" })
  const [banReason, setBanReason] = useState("")
  const [suspendReason, setSuspendReason] = useState("")
  const [suspendDuration, setSuspendDuration] = useState("24h")
  const [processingUserAction, setProcessingUserAction] = useState(false)
  const [togglingModeratorId, setTogglingModeratorId] = useState<string | null>(null)

  // AI Matches state
  const [aiMatches, setAiMatches] = useState<AiMatch[]>([])
  const [isLoadingAiMatches, setIsLoadingAiMatches] = useState(false)
  const [expandedMatchId, setExpandedMatchId] = useState<string | null>(null)
  const [processingMatchId, setProcessingMatchId] = useState<string | null>(null)

  const router = useRouter()

  useEffect(() => {
    const checkAdmin = async () => {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        router.push("/auth/login")
        return
      }

      // Check if user is admin
      const { data: profile } = await supabase
        .from("profiles")
        .select("is_admin")
        .eq("id", user.id)
        .single()

      if (!profile?.is_admin) {
        router.push("/")
        return
      }

      setIsAdmin(true)

      // Fetch current settings
      const { data: settings } = await supabase
        .from("settings")
        .select("key, value")
        .in("key", ["regolamento", "privacy_policy"])

      if (settings) {
        settings.forEach((setting) => {
          if (setting.key === "regolamento" && setting.value) {
            setRegolamento(setting.value)
          } else if (setting.key === "privacy_policy" && setting.value) {
            setPrivacyPolicy(setting.value)
          }
        })
      }

      setIsLoading(false)
      
      // Fetch banned users, flags, chats, message reports, all users, sponsors and reports
      fetchBannedUsers()
      fetchReportFlags()
      fetchConversations()
      fetchMessageReports()
      fetchAllUsers()
      fetchSponsorRequests()
      fetchAllReports()
      fetchAiMatches()
      fetchContactRequests()
    }

    checkAdmin()
  }, [router])

  const fetchBannedUsers = async () => {
    setIsLoadingUsers(true)
    const supabase = createClient()
    
    const { data, error } = await supabase
      .from("profiles")
      .select("id, first_name, last_name, ban_reason, banned_at")
      .eq("is_banned", true)
      .order("banned_at", { ascending: false })

    if (!error && data) {
      setBannedUsers(data as BannedUser[])
    }
    setIsLoadingUsers(false)
  }

  const handleUnbanUser = async (userId: string) => {
    setUnbanningUserId(userId)
    const supabase = createClient()

    const { error } = await supabase
      .from("profiles")
      .update({
        is_banned: false,
        ban_reason: null,
        banned_at: null,
      })
      .eq("id", userId)

    if (!error) {
      setBannedUsers((prev) => prev.filter((u) => u.id !== userId))
    }
    setUnbanningUserId(null)
  }

  const fetchReportFlags = async () => {
    setIsLoadingFlags(true)
    const supabase = createClient()

    const { data, error } = await supabase
      .from("report_flags")
      .select(`
        id,
        report_id,
        reason,
        status,
        created_at,
        reports (
          animal_name,
          animal_type,
          city
        )
      `)
      .eq("status", "pending")
      .order("created_at", { ascending: false })

    if (!error && data) {
      setReportFlags(data as ReportFlagWithDetails[])
    }
    setIsLoadingFlags(false)
  }

  const handleFlagAction = async (flagId: string, action: "reviewed" | "dismissed", deleteReport?: boolean) => {
    setProcessingFlagId(flagId)
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()

    const flag = reportFlags.find((f) => f.id === flagId)

    // Update flag status
    await supabase
      .from("report_flags")
      .update({
        status: action,
        reviewed_at: new Date().toISOString(),
        reviewed_by: user?.id,
      })
      .eq("id", flagId)

    // If action is reviewed and deleteReport is true, delete the report
    if (action === "reviewed" && deleteReport && flag) {
      await supabase
        .from("reports")
        .update({
          status: "resolved",
          deletion_reason: `Segnalazione utente: ${flag.reason}`,
          deleted_at: new Date().toISOString(),
          deleted_by: user?.id,
        })
        .eq("id", flag.report_id)
    }

    setReportFlags((prev) => prev.filter((f) => f.id !== flagId))
    setProcessingFlagId(null)
  }

  const fetchConversations = async () => {
    setIsLoadingChats(true)
    const supabase = createClient()

    // Fetch all conversations (admin can see all)
    const { data: convs, error } = await supabase
      .from("conversations")
      .select("*")
      .order("last_message_at", { ascending: false })
      .limit(50)

    if (error || !convs) {
      setIsLoadingChats(false)
      return
    }

    // Get user details for each conversation
    const convsWithUsers: ConversationWithUsers[] = await Promise.all(
      convs.map(async (conv) => {
        const { data: user1 } = await supabase
          .from("profiles")
          .select("first_name, last_name")
          .eq("id", conv.participant_1)
          .single()

        const { data: user2 } = await supabase
          .from("profiles")
          .select("first_name, last_name")
          .eq("id", conv.participant_2)
          .single()

        const { count } = await supabase
          .from("chat_messages")
          .select("id", { count: "exact", head: true })
          .eq("conversation_id", conv.id)

        return {
          ...conv,
          user1: user1 || undefined,
          user2: user2 || undefined,
          message_count: count || 0,
        }
      })
    )

    setConversations(convsWithUsers)
    setIsLoadingChats(false)
  }

  const fetchMessageReports = async () => {
    setIsLoadingMessageReports(true)
    const supabase = createClient()

    const { data, error } = await supabase
      .from("message_reports")
      .select("*")
      .eq("status", "pending")
      .order("created_at", { ascending: false })

    if (error || !data) {
      setIsLoadingMessageReports(false)
      return
    }

    // Get reported user details
    const reportsWithUsers: MessageReport[] = await Promise.all(
      data.map(async (report) => {
        const { data: userData } = await supabase
          .from("profiles")
          .select("first_name, last_name")
          .eq("id", report.reported_user_id)
          .single()

        return {
          ...report,
          reported_user: userData || undefined,
        }
      })
    )

    setMessageReports(reportsWithUsers)
    setIsLoadingMessageReports(false)
  }

  const handleMessageReportAction = async (reportId: string) => {
    const action = selectedAction[reportId]
    if (!action) return

    setProcessingReportId(reportId)
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()

    const report = messageReports.find((r) => r.id === reportId)
    if (!report) {
      setProcessingReportId(null)
      return
    }

    // Update the report
    await supabase
      .from("message_reports")
      .update({
        status: "reviewed",
        action_taken: action,
        suspension_days: action === "suspension" ? parseInt(suspensionDays[reportId] || "7") : null,
        reviewed_at: new Date().toISOString(),
        reviewed_by: user?.id,
      })
      .eq("id", reportId)

    // Take action on the user
    if (action === "ban") {
      await supabase
        .from("profiles")
        .update({
          is_banned: true,
          ban_reason: `Violazione regole messaggistica: ${report.reason}`,
          banned_at: new Date().toISOString(),
        })
        .eq("id", report.reported_user_id)
    } else if (action === "suspension") {
      const days = parseInt(suspensionDays[reportId] || "7")
      const suspendedUntil = new Date()
      suspendedUntil.setDate(suspendedUntil.getDate() + days)

      await supabase
        .from("profiles")
        .update({
          suspended_until: suspendedUntil.toISOString(),
          suspension_reason: `Violazione regole messaggistica: ${report.reason}`,
        })
        .eq("id", report.reported_user_id)
    }

    setMessageReports((prev) => prev.filter((r) => r.id !== reportId))
    setSelectedAction((prev) => {
      const newState = { ...prev }
      delete newState[reportId]
      return newState
    })
    setSuspensionDays((prev) => {
      const newState = { ...prev }
      delete newState[reportId]
      return newState
    })
    setProcessingReportId(null)
  }

  const fetchAllUsers = async () => {
    setIsLoadingAllUsers(true)
    const supabase = createClient()

    const { data, error } = await supabase
      .from("profiles")
      .select("id, first_name, last_name, is_admin, is_moderator, is_banned, created_at")
      .order("created_at", { ascending: false })
      .limit(100)

    if (!error && data) {
      setAllUsers(data as AllUser[])
    }
    setIsLoadingAllUsers(false)
  }

  const handleToggleAdmin = async (userId: string, currentIsAdmin: boolean) => {
    setTogglingAdminId(userId)

    const response = await fetch("/api/admin/set-admin", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId, isAdmin: !currentIsAdmin }),
    })

    if (response.ok) {
      setAllUsers((prev) =>
        prev.map((u) =>
          u.id === userId ? { ...u, is_admin: !currentIsAdmin } : u
        )
      )
    }
    setTogglingAdminId(null)
  }

  const handleToggleModerator = async (userId: string, currentIsModerator: boolean) => {
    setTogglingModeratorId(userId)

    const response = await fetch("/api/admin/set-moderator", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId, isModerator: !currentIsModerator }),
    })

    if (response.ok) {
      setAllUsers((prev) =>
        prev.map((u) =>
          u.id === userId ? { ...u, is_moderator: !currentIsModerator } : u
        )
      )
    }
    setTogglingModeratorId(null)
  }

  const filteredUsers = allUsers.filter((user) => {
    if (!userSearchQuery.trim()) return true
    const fullName = `${user.first_name || ""} ${user.last_name || ""}`.toLowerCase()
    return fullName.includes(userSearchQuery.toLowerCase())
  })

  const fetchSponsorRequests = async () => {
    setIsLoadingSponsors(true)
    const supabase = createClient()

    const { data, error } = await supabase
      .from("sponsor_requests")
      .select("*")
      .in("status", ["pending", "contacted"])
      .order("created_at", { ascending: false })

    if (!error && data) {
      setSponsorRequests(data as SponsorRequest[])
    }
    setIsLoadingSponsors(false)
  }

  const fetchContactRequests = async () => {
    setIsLoadingContacts(true)
    const supabase = createClient()
    const { data, error } = await supabase
      .from("contact_requests")
      .select("*")
      .order("created_at", { ascending: false })
    if (!error && data) {
      setContactRequests(data as ContactRequest[])
    }
    setIsLoadingContacts(false)
  }

  const markContactRead = async (id: string, status: ContactRequest["status"]) => {
    const supabase = createClient()
    await supabase.from("contact_requests").update({ status }).eq("id", id)
    setContactRequests((prev) => prev.map((c) => (c.id === id ? { ...c, status } : c)))
  }

  const handleSponsorAction = async (sponsorId: string, newStatus: string) => {
    setProcessingSponsorId(sponsorId)
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()

    await supabase
      .from("sponsor_requests")
      .update({
        status: newStatus,
        reviewed_at: new Date().toISOString(),
        reviewed_by: user?.id,
      })
      .eq("id", sponsorId)

    if (newStatus === "approved" || newStatus === "rejected") {
      setSponsorRequests((prev) => prev.filter((s) => s.id !== sponsorId))
    } else {
      setSponsorRequests((prev) =>
        prev.map((s) => (s.id === sponsorId ? { ...s, status: newStatus as SponsorRequest["status"] } : s))
      )
    }
    setProcessingSponsorId(null)
  }

  const fetchAllReports = async () => {
    setIsLoadingReports(true)
    const supabase = createClient()
    const { data, error } = await supabase
      .from("reports")
      .select(`
        *,
        profiles (
          first_name,
          last_name
        )
      `)
      .order("created_at", { ascending: false })

    if (!error && data) {
      setAllReports(data as Report[])
    }
    setIsLoadingReports(false)
  }

  const handleAdminResolveReport = async (reportId: string) => {
    setProcessingReportActionId(reportId + "_resolve")
    const supabase = createClient()
    const { error } = await supabase
      .from("reports")
      .update({ status: "resolved" })
      .eq("id", reportId)
    if (!error) {
      setAllReports((prev) => prev.map((r) =>
        r.id === reportId ? { ...r, status: "resolved" as const } : r
      ))
    }
    setProcessingReportActionId(null)
  }

  const handleAdminDeleteReport = async (reportId: string) => {
    setProcessingReportActionId(reportId + "_delete")
    const supabase = createClient()
    const { error } = await supabase
      .from("reports")
      .delete()
      .eq("id", reportId)
    if (!error) {
      setAllReports((prev) => prev.filter((r) => r.id !== reportId))
    }
    setProcessingReportActionId(null)
  }

  const handleAdminActivateReport = async (reportId: string) => {
    setProcessingReportActionId(reportId + "_activate")
    const supabase = createClient()
    const { error } = await supabase
      .from("reports")
      .update({ status: "active" })
      .eq("id", reportId)
    if (!error) {
      setAllReports((prev) => prev.map((r) =>
        r.id === reportId ? { ...r, status: "active" as const } : r
      ))
    }
    setProcessingReportActionId(null)
  }

  const handleConfirmDeleteReport = async () => {
    if (!deleteReportDialog.reportId) return
    const reportId = deleteReportDialog.reportId
    setProcessingReportActionId(reportId + "_delete")
    setDeleteReportDialog({ open: false, reportId: null })
    const supabase = createClient()
    const { error } = await supabase.from("reports").delete().eq("id", reportId)
    if (!error) setAllReports((prev) => prev.filter((r) => r.id !== reportId))
    setProcessingReportActionId(null)
  }

  const handleConfirmBanUser = async () => {
    if (!banUserDialog.userId || !banReason.trim()) return
    setProcessingUserAction(true)
    const supabase = createClient()
    await supabase.from("banned_users").upsert({
      user_id: banUserDialog.userId,
      reason: banReason.trim(),
      banned_at: new Date().toISOString(),
      is_permanent: true,
    }, { onConflict: "user_id" })
    await supabase.from("profiles").update({ is_banned: true }).eq("id", banUserDialog.userId)
    setProcessingUserAction(false)
    setBanUserDialog({ open: false, userId: null, userName: "" })
    setBanReason("")
  }

  const handleConfirmSuspendUser = async () => {
    if (!suspendUserDialog.userId || !suspendReason.trim()) return
    setProcessingUserAction(true)
    const supabase = createClient()
    const durationMap: Record<string, number> = {
      "24h": 1,
      "48h": 2,
      "3d": 3,
      "1w": 7,
      "2w": 14,
      "1m": 30,
    }
    const days = durationMap[suspendDuration] ?? 1
    const suspendedUntil = new Date()
    suspendedUntil.setDate(suspendedUntil.getDate() + days)
    await supabase.from("banned_users").upsert({
      user_id: suspendUserDialog.userId,
      reason: suspendReason.trim(),
      banned_at: new Date().toISOString(),
      is_permanent: false,
      suspended_until: suspendedUntil.toISOString(),
    }, { onConflict: "user_id" })
    await supabase.from("profiles").update({ is_suspended: true, suspended_until: suspendedUntil.toISOString() }).eq("id", suspendUserDialog.userId)
    setProcessingUserAction(false)
    setSuspendUserDialog({ open: false, userId: null, userName: "" })
    setSuspendReason("")
    setSuspendDuration("24h")
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

  const AnimalIcon = ({ type }: { type: AnimalType }) => {
    switch (type) {
      case "cane": return <Dog className="h-4 w-4" />
      case "gatto": return <Cat className="h-4 w-4" />
      case "volatile": return <Bird className="h-4 w-4" />
    }
  }

  const handleSaveRegolamento = async () => {
    setIsSavingRegolamento(true)
    const supabase = createClient()
    await supabase
      .from("settings")
      .upsert({ key: "regolamento", value: regolamento }, { onConflict: "key" })
    setIsSavingRegolamento(false)
    setSaveSuccessRegolamento(true)
    setTimeout(() => setSaveSuccessRegolamento(false), 3000)
  }

  const handleSavePrivacy = async () => {
    setIsSavingPrivacy(true)
    const supabase = createClient()
    await supabase
      .from("settings")
      .upsert({ key: "privacy_policy", value: privacyPolicy }, { onConflict: "key" })
    setIsSavingPrivacy(false)
    setSaveSuccessPrivacy(true)
    setTimeout(() => setSaveSuccessPrivacy(false), 3000)
  }

  if (isLoading) {
    return (
      <div className="flex min-h-screen flex-col bg-background">
        <Header />
        <main className="flex flex-1 items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </main>
        <Footer />
      </div>
    )
  }

  if (!isAdmin) {
    return null
  }

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Header />
      <main className="flex-1">
        <div className="container mx-auto px-4 py-8">
          <div className="mb-8 flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
              <Shield className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-foreground">Pannello di Controllo</h1>
              <p className="text-muted-foreground">Gestisci le impostazioni della piattaforma</p>
            </div>
          </div>

          <Tabs defaultValue="regolamento" className="space-y-6">
            <TabsList>
              <TabsTrigger value="regolamento" className="gap-2">
                <FileText className="h-4 w-4" />
                Regolamento
              </TabsTrigger>
              <TabsTrigger value="privacy" className="gap-2">
                <Lock className="h-4 w-4" />
                Privacy Policy
              </TabsTrigger>
              <TabsTrigger value="users" className="gap-2">
                <Users className="h-4 w-4" />
                Utenti
                {bannedUsers.length > 0 && (
                  <Badge variant="destructive" className="ml-1 h-5 px-1.5 text-xs">
                    {bannedUsers.length}
                  </Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="flags" className="gap-2">
                <Flag className="h-4 w-4" />
                Segnalazioni
                {reportFlags.length > 0 && (
                  <Badge variant="destructive" className="ml-1 h-5 px-1.5 text-xs">
                    {reportFlags.length}
                  </Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="chats" className="gap-2">
                <MessageCircle className="h-4 w-4" />
                Chat
                <Badge variant="secondary" className="ml-1 h-5 px-1.5 text-xs">
                  {conversations.length}
                </Badge>
              </TabsTrigger>
              <TabsTrigger value="message-reports" className="gap-2">
                <Ban className="h-4 w-4" />
                Messaggi
                {messageReports.length > 0 && (
                  <Badge variant="destructive" className="ml-1 h-5 px-1.5 text-xs">
                    {messageReports.length}
                  </Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="sponsors" className="gap-2">
                <Building2 className="h-4 w-4" />
                Sponsor
                {sponsorRequests.length > 0 && (
                  <Badge variant="destructive" className="ml-1 h-5 px-1.5 text-xs">
                    {sponsorRequests.length}
                  </Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="partners" asChild>
                <Link href="/admin/partners" className="gap-2">
                  <Tag className="h-4 w-4" />
                  Partner
                </Link>
              </TabsTrigger>
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
              <TabsTrigger value="contacts" className="gap-2">
                <Mail className="h-4 w-4" />
                Richieste di Contatto
                {contactRequests.filter((c) => c.status === "new").length > 0 && (
                  <Badge variant="destructive" className="ml-1 h-5 px-1.5 text-xs">
                    {contactRequests.filter((c) => c.status === "new").length}
                  </Badge>
                )}
              </TabsTrigger>
            </TabsList>

            <TabsContent value="regolamento">
              <Card>
                <CardHeader>
                  <CardTitle>Modifica Regolamento</CardTitle>
                  <CardDescription>
                    Il testo inserito qui verra mostrato nella pagina del regolamento. 
                    Se lasciato vuoto, verra mostrato il regolamento predefinito.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label>Contenuto del Regolamento</Label>
                    <RichTextEditor
                      value={regolamento}
                      onChange={setRegolamento}
                      placeholder="Inserisci qui il regolamento personalizzato..."
                    />
                  </div>
                  <div className="flex items-center gap-4">
                    <Button onClick={handleSaveRegolamento} disabled={isSavingRegolamento}>
                      {isSavingRegolamento ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Salvataggio...
                        </>
                      ) : (
                        <>
                          <Save className="mr-2 h-4 w-4" />
                          Salva Regolamento
                        </>
                      )}
                    </Button>
                    {saveSuccessRegolamento && (
                      <span className="flex items-center gap-2 text-sm text-accent">
                        <CheckCircle className="h-4 w-4" />
                        Salvato con successo!
                      </span>
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="privacy">
              <Card>
                <CardHeader>
                  <CardTitle>Modifica Privacy Policy</CardTitle>
                  <CardDescription>
                    Il testo inserito qui verra mostrato nella pagina della privacy policy. 
                    Se lasciato vuoto, verra mostrata la privacy policy predefinita.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label>Contenuto della Privacy Policy</Label>
                    <RichTextEditor
                      value={privacyPolicy}
                      onChange={setPrivacyPolicy}
                      placeholder="Inserisci qui la privacy policy personalizzata..."
                    />
                  </div>
                  <div className="flex items-center gap-4">
                    <Button onClick={handleSavePrivacy} disabled={isSavingPrivacy}>
                      {isSavingPrivacy ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Salvataggio...
                        </>
                      ) : (
                        <>
                          <Save className="mr-2 h-4 w-4" />
                          Salva Privacy Policy
                        </>
                      )}
                    </Button>
                    {saveSuccessPrivacy && (
                      <span className="flex items-center gap-2 text-sm text-accent">
                        <CheckCircle className="h-4 w-4" />
                        Salvato con successo!
                      </span>
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="users">
              <div className="space-y-6">
                {/* Gestione Amministratori */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Shield className="h-5 w-5 text-primary" />
                      Gestione Utenti e Amministratori
                    </CardTitle>
                    <CardDescription>
                      Cerca utenti e gestisci i permessi di amministrazione.
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="mb-4">
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                        <Input
                          placeholder="Cerca utente per nome..."
                          value={userSearchQuery}
                          onChange={(e) => setUserSearchQuery(e.target.value)}
                          className="pl-10"
                        />
                      </div>
                    </div>
                    {isLoadingAllUsers ? (
                      <div className="flex items-center justify-center py-8">
                        <Loader2 className="h-6 w-6 animate-spin text-primary" />
                      </div>
                    ) : filteredUsers.length > 0 ? (
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Utente</TableHead>
                            <TableHead>Stato</TableHead>
                            <TableHead>Data Registrazione</TableHead>
                            <TableHead className="text-right">Azioni</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {filteredUsers.map((user) => (
                            <TableRow key={user.id}>
                              <TableCell className="font-medium">
                                {user.first_name || user.last_name 
                                  ? `${user.first_name || ""} ${user.last_name || ""}`.trim()
                                  : "Utente sconosciuto"}
                              </TableCell>
                              <TableCell>
                                <div className="flex items-center gap-2">
                                  {user.is_admin && (
                                    <Badge className="bg-primary">Admin</Badge>
                                  )}
                                  {user.is_moderator && !user.is_admin && (
                                    <Badge className="bg-blue-600">Moderatore</Badge>
                                  )}
                                  {user.is_banned && (
                                    <Badge variant="destructive">Bannato</Badge>
                                  )}
                                  {!user.is_admin && !user.is_moderator && !user.is_banned && (
                                    <Badge variant="secondary">Utente</Badge>
                                  )}
                                </div>
                              </TableCell>
                              <TableCell className="text-muted-foreground">
                                {new Date(user.created_at).toLocaleDateString("it-IT", {
                                  day: "2-digit",
                                  month: "2-digit",
                                  year: "numeric",
                                })}
                              </TableCell>
                              <TableCell className="text-right">
                                <div className="flex items-center justify-end gap-2">
                                  <Button
                                    variant={user.is_moderator ? "outline" : "secondary"}
                                    size="sm"
                                    onClick={() => handleToggleModerator(user.id, user.is_moderator)}
                                    disabled={togglingModeratorId === user.id || user.is_admin}
                                    className="gap-1"
                                    title={user.is_admin ? "Gli admin hanno già tutti i permessi" : ""}
                                  >
                                    {togglingModeratorId === user.id ? (
                                      <Loader2 className="h-4 w-4 animate-spin" />
                                    ) : user.is_moderator ? (
                                      <>
                                        <Shield className="h-4 w-4" />
                                        Rimuovi Mod
                                      </>
                                    ) : (
                                      <>
                                        <Shield className="h-4 w-4" />
                                        Rendi Mod
                                      </>
                                    )}
                                  </Button>
                                  <Button
                                    variant={user.is_admin ? "destructive" : "default"}
                                    size="sm"
                                    onClick={() => handleToggleAdmin(user.id, user.is_admin)}
                                    disabled={togglingAdminId === user.id}
                                    className="gap-1"
                                  >
                                    {togglingAdminId === user.id ? (
                                      <Loader2 className="h-4 w-4 animate-spin" />
                                    ) : user.is_admin ? (
                                      <>
                                        <ShieldOff className="h-4 w-4" />
                                        Rimuovi Admin
                                      </>
                                    ) : (
                                      <>
                                        <ShieldCheck className="h-4 w-4" />
                                        Rendi Admin
                                      </>
                                    )}
                                  </Button>
                                </div>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    ) : (
                      <div className="py-8 text-center">
                        <p className="text-muted-foreground">
                          {userSearchQuery ? "Nessun utente trovato" : "Nessun utente registrato"}
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Utenti Bannati */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <UserX className="h-5 w-5 text-destructive" />
                      Utenti Bannati
                    </CardTitle>
                    <CardDescription>
                      Gestisci gli utenti che sono stati bannati dalla piattaforma.
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {isLoadingUsers ? (
                      <div className="flex items-center justify-center py-8">
                        <Loader2 className="h-6 w-6 animate-spin text-primary" />
                      </div>
                    ) : bannedUsers.length > 0 ? (
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Utente</TableHead>
                            <TableHead>Motivazione</TableHead>
                            <TableHead>Data Ban</TableHead>
                            <TableHead className="text-right">Azioni</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {bannedUsers.map((user) => (
                            <TableRow key={user.id}>
                              <TableCell className="font-medium">
                                {user.first_name || user.last_name 
                                  ? `${user.first_name || ""} ${user.last_name || ""}`.trim()
                                  : "Utente sconosciuto"}
                              </TableCell>
                              <TableCell className="max-w-xs truncate text-muted-foreground">
                                {user.ban_reason || "Nessuna motivazione"}
                              </TableCell>
                              <TableCell className="text-muted-foreground">
                                {user.banned_at 
                                  ? new Date(user.banned_at).toLocaleDateString("it-IT", {
                                      day: "2-digit",
                                      month: "2-digit",
                                      year: "numeric",
                                      hour: "2-digit",
                                      minute: "2-digit",
                                    })
                                  : "-"}
                              </TableCell>
                              <TableCell className="text-right">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleUnbanUser(user.id)}
                                  disabled={unbanningUserId === user.id}
                                  className="gap-1"
                                >
                                  {unbanningUserId === user.id ? (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                  ) : (
                                    <UserCheck className="h-4 w-4" />
                                  )}
                                  Sbanna
                                </Button>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    ) : (
                      <div className="py-8 text-center">
                        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-muted">
                          <UserCheck className="h-6 w-6 text-muted-foreground" />
                        </div>
                        <p className="text-muted-foreground">
                          Nessun utente bannato al momento
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="flags">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <AlertTriangle className="h-5 w-5 text-orange-500" />
                    Segnalazioni degli Utenti
                  </CardTitle>
                  <CardDescription>
                    Revisiona le segnalazioni inviate dagli utenti per annunci inappropriati.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {isLoadingFlags ? (
                    <div className="flex items-center justify-center py-8">
                      <Loader2 className="h-6 w-6 animate-spin text-primary" />
                    </div>
                  ) : reportFlags.length > 0 ? (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Annuncio</TableHead>
                          <TableHead>Motivo</TableHead>
                          <TableHead>Data</TableHead>
                          <TableHead className="text-right">Azioni</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {reportFlags.map((flag) => (
                          <TableRow key={flag.id}>
                            <TableCell className="font-medium">
                              {flag.reports?.animal_name || flag.reports?.animal_type || "Annuncio"}
                              <span className="block text-xs text-muted-foreground">
                                {flag.reports?.city}
                              </span>
                            </TableCell>
                            <TableCell className="max-w-xs">
                              <span className="text-sm text-muted-foreground">{flag.reason}</span>
                            </TableCell>
                            <TableCell className="text-sm text-muted-foreground">
                              {new Date(flag.created_at).toLocaleDateString("it-IT")}
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="flex justify-end gap-2">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleFlagAction(flag.id, "dismissed")}
                                  disabled={processingFlagId === flag.id}
                                  className="gap-1"
                                >
                                  {processingFlagId === flag.id ? (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                  ) : (
                                    <X className="h-4 w-4" />
                                  )}
                                  Ignora
                                </Button>
                                <Button
                                  variant="destructive"
                                  size="sm"
                                  onClick={() => handleFlagAction(flag.id, "reviewed", true)}
                                  disabled={processingFlagId === flag.id}
                                  className="gap-1"
                                >
                                  {processingFlagId === flag.id ? (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                  ) : (
                                    <Check className="h-4 w-4" />
                                  )}
                                  Elimina Annuncio
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  ) : (
                    <div className="py-8 text-center">
                      <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-muted">
                        <Check className="h-6 w-6 text-muted-foreground" />
                      </div>
                      <p className="text-muted-foreground">
                        Nessuna segnalazione in attesa di revisione
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="chats">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <MessageCircle className="h-5 w-5 text-primary" />
                    Tutte le Chat
                  </CardTitle>
                  <CardDescription>
                    Visualizza tutte le conversazioni tra utenti della piattaforma.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {isLoadingChats ? (
                    <div className="flex items-center justify-center py-8">
                      <Loader2 className="h-6 w-6 animate-spin text-primary" />
                    </div>
                  ) : conversations.length > 0 ? (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Partecipanti</TableHead>
                          <TableHead>Messaggi</TableHead>
                          <TableHead>Ultimo messaggio</TableHead>
                          <TableHead className="text-right">Azioni</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {conversations.map((conv) => (
                          <TableRow key={conv.id}>
                            <TableCell>
                              <div className="flex flex-col gap-1">
                                <span className="font-medium">
                                  {conv.user1?.first_name || conv.user1?.last_name
                                    ? `${conv.user1.first_name || ""} ${conv.user1.last_name || ""}`.trim()
                                    : "Utente 1"}
                                </span>
                                <span className="text-xs text-muted-foreground">con</span>
                                <span className="font-medium">
                                  {conv.user2?.first_name || conv.user2?.last_name
                                    ? `${conv.user2.first_name || ""} ${conv.user2.last_name || ""}`.trim()
                                    : "Utente 2"}
                                </span>
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge variant="secondary">{conv.message_count}</Badge>
                            </TableCell>
                            <TableCell className="text-sm text-muted-foreground">
                              {new Date(conv.last_message_at).toLocaleDateString("it-IT", {
                                day: "2-digit",
                                month: "2-digit",
                                year: "numeric",
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </TableCell>
                            <TableCell className="text-right">
                              <Button asChild variant="outline" size="sm" className="gap-1">
                                <Link href={`/chat/${conv.id}`}>
                                  <Eye className="h-4 w-4" />
                                  Visualizza
                                </Link>
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  ) : (
                    <div className="py-8 text-center">
                      <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-muted">
                        <MessageCircle className="h-6 w-6 text-muted-foreground" />
                      </div>
                      <p className="text-muted-foreground">
                        Nessuna conversazione presente
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="message-reports">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Ban className="h-5 w-5 text-destructive" />
                    Segnalazioni Messaggi Privati
                  </CardTitle>
                  <CardDescription>
                    Revisiona le segnalazioni di messaggi privati e prendi provvedimenti.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {isLoadingMessageReports ? (
                    <div className="flex items-center justify-center py-8">
                      <Loader2 className="h-6 w-6 animate-spin text-primary" />
                    </div>
                  ) : messageReports.length > 0 ? (
                    <div className="space-y-6">
                      {messageReports.map((report) => (
                        <Card key={report.id} className="border-destructive/20">
                          <CardContent className="pt-6">
                            <div className="space-y-4">
                              {/* Header */}
                              <div className="flex items-start justify-between">
                                <div>
                                  <p className="font-medium">
                                    Utente segnalato:{" "}
                                    <span className="text-destructive">
                                      {report.reported_user?.first_name || report.reported_user?.last_name
                                        ? `${report.reported_user.first_name || ""} ${report.reported_user.last_name || ""}`.trim()
                                        : "Utente sconosciuto"}
                                    </span>
                                  </p>
                                  <p className="text-sm text-muted-foreground">
                                    {new Date(report.created_at).toLocaleDateString("it-IT", {
                                      day: "2-digit",
                                      month: "long",
                                      year: "numeric",
                                      hour: "2-digit",
                                      minute: "2-digit",
                                    })}
                                  </p>
                                </div>
                                <Button asChild variant="outline" size="sm">
                                  <Link href={`/chat/${report.conversation_id}`}>
                                    <Eye className="mr-1 h-4 w-4" />
                                    Vedi Chat
                                  </Link>
                                </Button>
                              </div>

                              {/* Message content */}
                              <div className="rounded-lg bg-muted p-4">
                                <p className="mb-2 text-xs font-medium text-muted-foreground">Messaggio segnalato:</p>
                                <p className="text-sm">&quot;{report.message_content}&quot;</p>
                              </div>

                              {/* Reason */}
                              <div>
                                <p className="text-sm">
                                  <span className="font-medium">Motivo:</span>{" "}
                                  <span className="text-muted-foreground">{report.reason}</span>
                                </p>
                              </div>

                              {/* Actions */}
                              <div className="flex flex-wrap items-end gap-3 border-t pt-4">
                                <div className="flex-1 min-w-[200px]">
                                  <Label className="mb-2 block text-sm">Provvedimento</Label>
                                  <Select
                                    value={selectedAction[report.id] || ""}
                                    onValueChange={(value) =>
                                      setSelectedAction((prev) => ({ ...prev, [report.id]: value }))
                                    }
                                  >
                                    <SelectTrigger>
                                      <SelectValue placeholder="Seleziona azione..." />
                                    </SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="none">
                                        <span className="flex items-center gap-2">
                                          <Check className="h-4 w-4 text-green-500" />
                                          Nessuna violazione
                                        </span>
                                      </SelectItem>
                                      <SelectItem value="suspension">
                                        <span className="flex items-center gap-2">
                                          <Clock className="h-4 w-4 text-orange-500" />
                                          Sospensione temporanea
                                        </span>
                                      </SelectItem>
                                      <SelectItem value="ban">
                                        <span className="flex items-center gap-2">
                                          <Ban className="h-4 w-4 text-destructive" />
                                          Ban permanente
                                        </span>
                                      </SelectItem>
                                    </SelectContent>
                                  </Select>
                                </div>

                                {selectedAction[report.id] === "suspension" && (
                                  <div className="w-32">
                                    <Label className="mb-2 block text-sm">Giorni</Label>
                                    <Input
                                      type="number"
                                      min="1"
                                      max="365"
                                      value={suspensionDays[report.id] || "7"}
                                      onChange={(e) =>
                                        setSuspensionDays((prev) => ({ ...prev, [report.id]: e.target.value }))
                                      }
                                      placeholder="7"
                                    />
                                  </div>
                                )}

                                <Button
                                  onClick={() => handleMessageReportAction(report.id)}
                                  disabled={!selectedAction[report.id] || processingReportId === report.id}
                                  className="min-w-[120px]"
                                >
                                  {processingReportId === report.id ? (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                  ) : (
                                    "Conferma"
                                  )}
                                </Button>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  ) : (
                    <div className="py-8 text-center">
                      <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-muted">
                        <Check className="h-6 w-6 text-muted-foreground" />
                      </div>
                      <p className="text-muted-foreground">
                        Nessuna segnalazione di messaggi in attesa
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="sponsors">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Building2 className="h-5 w-5 text-primary" />
                    Richieste Sponsor
                  </CardTitle>
                  <CardDescription>
                    Gestisci le richieste di partnership da parte delle aziende.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {isLoadingSponsors ? (
                    <div className="flex items-center justify-center py-8">
                      <Loader2 className="h-6 w-6 animate-spin text-primary" />
                    </div>
                  ) : sponsorRequests.length > 0 ? (
                    <div className="space-y-6">
                      {sponsorRequests.map((sponsor) => (
                        <Card key={sponsor.id} className="overflow-hidden">
                          <CardHeader className="bg-muted/50">
                            <div className="flex items-start justify-between">
                              <div>
                                <CardTitle className="text-lg">{sponsor.company_name}</CardTitle>
                                <CardDescription>{sponsor.contact_name}</CardDescription>
                              </div>
                              <Badge variant={sponsor.status === "contacted" ? "secondary" : "default"}>
                                {sponsor.status === "pending" ? "In attesa" : "Contattato"}
                              </Badge>
                            </div>
                          </CardHeader>
                          <CardContent className="pt-4">
                            <div className="space-y-4">
                              {/* Contact Info */}
                              <div className="flex flex-wrap gap-4 text-sm">
                                <a href={`tel:${sponsor.contact_phone}`} className="flex items-center gap-1 text-primary hover:underline">
                                  <Phone className="h-4 w-4" />
                                  {sponsor.contact_phone}
                                </a>
                                <a href={`mailto:${sponsor.contact_email}`} className="flex items-center gap-1 text-primary hover:underline">
                                  <Mail className="h-4 w-4" />
                                  {sponsor.contact_email}
                                </a>
                                {sponsor.website && (
                                  <a href={sponsor.website} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-primary hover:underline">
                                    <Globe className="h-4 w-4" />
                                    Sito web
                                  </a>
                                )}
                              </div>

                              {/* Target Animals */}
                              <div className="flex flex-wrap gap-2">
                                {sponsor.target_animals.map((animal) => (
                                  <Badge key={animal} variant="outline" className="gap-1">
                                    <AnimalIcon type={animal} />
                                    {animalTypeLabels[animal]}
                                  </Badge>
                                ))}
                              </div>

                              {/* Description */}
                              <div>
                                <p className="mb-1 text-sm font-medium">Descrizione azienda:</p>
                                <p className="text-sm text-muted-foreground">{sponsor.description}</p>
                              </div>

                              {/* Services */}
                              <div>
                                <p className="mb-1 text-sm font-medium">Prodotti/Servizi offerti:</p>
                                <p className="text-sm text-muted-foreground">{sponsor.services_offered}</p>
                              </div>

                              {/* Actions */}
                              <div className="flex flex-wrap gap-2 border-t pt-4">
                                {sponsor.status === "pending" && (
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handleSponsorAction(sponsor.id, "contacted")}
                                    disabled={processingSponsorId === sponsor.id}
                                  >
                                    {processingSponsorId === sponsor.id ? (
                                      <Loader2 className="h-4 w-4 animate-spin" />
                                    ) : (
                                      <>
                                        <Phone className="mr-1 h-4 w-4" />
                                        Segna come Contattato
                                      </>
                                    )}
                                  </Button>
                                )}
                                <Button
                                  variant="default"
                                  size="sm"
                                  onClick={() => handleSponsorAction(sponsor.id, "approved")}
                                  disabled={processingSponsorId === sponsor.id}
                                >
                                  {processingSponsorId === sponsor.id ? (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                  ) : (
                                    <>
                                      <Check className="mr-1 h-4 w-4" />
                                      Approva
                                    </>
                                  )}
                                </Button>
                                <Button
                                  variant="destructive"
                                  size="sm"
                                  onClick={() => handleSponsorAction(sponsor.id, "rejected")}
                                  disabled={processingSponsorId === sponsor.id}
                                >
                                  {processingSponsorId === sponsor.id ? (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                  ) : (
                                    <>
                                      <X className="mr-1 h-4 w-4" />
                                      Rifiuta
                                    </>
                                  )}
                                </Button>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  ) : (
                    <div className="py-8 text-center">
                      <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-muted">
                        <Building2 className="h-6 w-6 text-muted-foreground" />
                      </div>
                      <p className="text-muted-foreground">
                        Nessuna richiesta di sponsorizzazione in attesa
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* ===== POST (SEGNALAZIONI) TAB ===== */}
            <TabsContent value="posts">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    Tutte le Segnalazioni
                  </CardTitle>
                  <CardDescription>
                    Gestisci tutte le segnalazioni della piattaforma
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Filters */}
                  <div className="flex flex-col gap-3 sm:flex-row">
                    <div className="relative flex-1">
                      <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                      <Input
                        placeholder="Cerca per nome, cognome, animale, razza, citta..."
                        value={reportsSearch}
                        onChange={(e) => setReportsSearch(e.target.value)}
                        className="pl-9"
                      />
                    </div>
                    <Select value={reportsStatusFilter} onValueChange={(v) => setReportsStatusFilter(v as typeof reportsStatusFilter)}>
                      <SelectTrigger className="w-full sm:w-44">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Tutti gli stati</SelectItem>
                        <SelectItem value="active">Solo attive</SelectItem>
                        <SelectItem value="resolved">Solo risolte</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {isLoadingReports ? (
                    <div className="flex justify-center py-8">
                      <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                    </div>
                  ) : (() => {
                    const query = reportsSearch.toLowerCase()
                    const filtered = allReports.filter((r) => {
                      const matchesStatus = reportsStatusFilter === "all" || r.status === reportsStatusFilter
                      const matchesSearch = !query ||
                        r.animal_name?.toLowerCase().includes(query) ||
                        r.description?.toLowerCase().includes(query) ||
                        r.city?.toLowerCase().includes(query) ||
                        r.contact_name?.toLowerCase().includes(query) ||
                        r.profiles?.first_name?.toLowerCase().includes(query) ||
                        r.profiles?.last_name?.toLowerCase().includes(query) ||
                        new Date(r.created_at).toLocaleDateString("it-IT").includes(query)
                      return matchesStatus && matchesSearch
                    })

                    if (filtered.length === 0) {
                      return (
                        <div className="py-8 text-center text-muted-foreground">
                          Nessuna segnalazione trovata
                        </div>
                      )
                    }

                    return (
                      <div className="rounded-md border">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Animale</TableHead>
                              <TableHead>Tipo</TableHead>
                              <TableHead>Utente</TableHead>
                              <TableHead>Citta</TableHead>
                              <TableHead>Data</TableHead>
                              <TableHead>Stato</TableHead>
                              <TableHead className="text-right">Azioni</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {filtered.map((report) => {
                              const isSmarrito = report.report_type === "smarrito"
                              const isResolved = report.status === "resolved"
                              const ownerName = report.profiles
                                ? [report.profiles.first_name, report.profiles.last_name].filter(Boolean).join(" ") || report.contact_name
                                : report.contact_name
                              return (
                                <TableRow key={report.id} className={isResolved ? "opacity-60" : ""}>
                                  <TableCell>
                                    <div className="flex items-center gap-2">
                                      {report.animal_type === "cane" && <Dog className="h-4 w-4 text-muted-foreground" />}
                                      {report.animal_type === "gatto" && <Cat className="h-4 w-4 text-muted-foreground" />}
                                      {report.animal_type === "volatile" && <Bird className="h-4 w-4 text-muted-foreground" />}
                                      <div>
                                        <p className="font-medium">{report.animal_name || "Senza nome"}</p>
                                        <p className="text-xs text-muted-foreground">{report.description?.slice(0, 50)}{(report.description?.length ?? 0) > 50 ? "..." : ""}</p>
                                      </div>
                                    </div>
                                  </TableCell>
                                  <TableCell>
                                    <Badge variant={isSmarrito ? "destructive" : "default"} className="text-xs">
                                      {isSmarrito ? "Smarrito" : "Avvistato"}
                                    </Badge>
                                  </TableCell>
                                  <TableCell>
                                    <div className="text-sm">
                                      <p className="font-medium">{ownerName}</p>
                                      <p className="text-xs text-muted-foreground">{report.contact_email}</p>
                                    </div>
                                  </TableCell>
                                  <TableCell>
                                    <span className="flex items-center gap-1 text-sm">
                                      <MapPin className="h-3 w-3 text-muted-foreground" />
                                      {report.city}
                                    </span>
                                  </TableCell>
                                  <TableCell className="text-sm text-muted-foreground">
                                    {new Date(report.created_at).toLocaleDateString("it-IT")}
                                  </TableCell>
                                  <TableCell>
                                    {isResolved ? (
                                      <Badge variant="outline" className="gap-1 border-green-500 text-green-600 text-xs">
                                        <CheckCircle2 className="h-3 w-3" />
                                        Risolto
                                      </Badge>
                                    ) : (
                                      <Badge variant="outline" className="gap-1 text-xs">
                                        <Clock className="h-3 w-3" />
                                        Attiva
                                      </Badge>
                                    )}
                                  </TableCell>
                                  <TableCell className="text-right">
                                    <div className="flex items-center justify-end gap-1">
                                      <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-8 w-8"
                                        onClick={() => window.open(`/segnalazioni/${report.id}`, "_blank")}
                                        title="Visualizza"
                                      >
                                        <Eye className="h-4 w-4" />
                                      </Button>
                                      <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-8 w-8"
                                        onClick={() => window.location.href = `/modifica-segnalazione/${report.id}`}
                                        title="Modifica"
                                      >
                                        <Pencil className="h-4 w-4" />
                                      </Button>
                                      {/* Ban user */}
                                      <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-8 w-8 text-orange-600 hover:text-orange-700"
                                        title="Banna utente"
                                        onClick={() => setBanUserDialog({ open: true, userId: report.user_id ?? null, userName: ownerName ?? "" })}
                                      >
                                        <Ban className="h-4 w-4" />
                                      </Button>
                                      {/* Suspend user */}
                                      <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-8 w-8 text-yellow-600 hover:text-yellow-700"
                                        title="Sospendi utente"
                                        onClick={() => setSuspendUserDialog({ open: true, userId: report.user_id ?? null, userName: ownerName ?? "" })}
                                      >
                                        <Clock className="h-4 w-4" />
                                      </Button>
                                      {isResolved ? (
                                        <Button
                                          variant="ghost"
                                          size="icon"
                                          className="h-8 w-8 text-blue-600 hover:text-blue-700"
                                          disabled={processingReportActionId === report.id + "_activate"}
                                          onClick={() => handleAdminActivateReport(report.id)}
                                          title="Riattiva"
                                        >
                                          {processingReportActionId === report.id + "_activate"
                                            ? <Loader2 className="h-4 w-4 animate-spin" />
                                            : <ShieldCheck className="h-4 w-4" />
                                          }
                                        </Button>
                                      ) : (
                                        <Button
                                          variant="ghost"
                                          size="icon"
                                          className="h-8 w-8 text-green-600 hover:text-green-700"
                                          disabled={processingReportActionId === report.id + "_resolve"}
                                          onClick={() => handleAdminResolveReport(report.id)}
                                          title="Segna come risolto"
                                        >
                                          {processingReportActionId === report.id + "_resolve"
                                            ? <Loader2 className="h-4 w-4 animate-spin" />
                                            : <CheckCircle2 className="h-4 w-4" />
                                          }
                                        </Button>
                                      )}
                                      {/* Delete with confirm dialog */}
                                      <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-8 w-8 text-destructive hover:text-destructive"
                                        disabled={processingReportActionId === report.id + "_delete"}
                                        onClick={() => setDeleteReportDialog({ open: true, reportId: report.id })}
                                        title="Elimina"
                                      >
                                        {processingReportActionId === report.id + "_delete"
                                          ? <Loader2 className="h-4 w-4 animate-spin" />
                                          : <Trash2 className="h-4 w-4" />
                                        }
                                      </Button>
                                    </div>
                                  </TableCell>
                                </TableRow>
                              )
                            })}
                          </TableBody>
                        </Table>
                      </div>
                    )
                  })()}
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
                    Match trovati dall&apos;intelligenza artificiale tra avvistamenti e segnalazioni di smarrimento
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
                      <p className="mt-1 text-sm">I match AI appariranno qui quando vengono pubblicati nuovi avvistamenti con foto</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {/* Filter summary */}
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
                            {/* Header row */}
                            <div className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center">
                              {/* Images side by side */}
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

                                {/* Confidence score in the middle */}
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

                              {/* Info */}
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
                                    <p className="font-medium">{match.sighting_report?.animal_name || "Animale senza nome"}</p>
                                    <p className="text-xs text-muted-foreground">{match.sighting_report?.contact_name} — {match.sighting_report?.city}</p>
                                  </div>
                                  <div>
                                    <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Smarrito</span>
                                    <p className="font-medium">{match.lost_report?.animal_name || "Animale senza nome"}</p>
                                    <p className="text-xs text-muted-foreground">{match.lost_report?.contact_name} — {match.lost_report?.city}</p>
                                  </div>
                                </div>
                              </div>

                              {/* Actions */}
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

                            {/* Expanded AI analysis */}
                            {isExpanded && analysis && (
                              <div className="border-t px-4 pb-4 pt-3">
                                <h4 className="mb-2 flex items-center gap-1.5 text-sm font-semibold">
                                  <Sparkles className="h-4 w-4 text-primary" />
                                  Analisi dettagliata dell&apos;AI
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

            <TabsContent value="contacts">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Mail className="h-5 w-5" />
                    Richieste di Contatto
                  </CardTitle>
                  <CardDescription>
                    Messaggi inviati dagli utenti tramite il form di contatto.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {isLoadingContacts ? (
                    <div className="flex justify-center py-8">
                      <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                    </div>
                  ) : contactRequests.length === 0 ? (
                    <p className="py-8 text-center text-muted-foreground">Nessuna richiesta di contatto.</p>
                  ) : (
                    <div className="space-y-4">
                      {contactRequests.map((req) => (
                        <div key={req.id} className="rounded-lg border border-border bg-card p-4 space-y-3">
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex-1 space-y-1">
                              <div className="flex flex-wrap items-center gap-2">
                                <span className="font-semibold text-foreground">{req.name}</span>
                                <Badge
                                  variant={req.status === "new" ? "destructive" : req.status === "read" ? "secondary" : "outline"}
                                  className="text-xs"
                                >
                                  {req.status === "new" ? "Nuovo" : req.status === "read" ? "Letto" : "Risposto"}
                                </Badge>
                              </div>
                              <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                                <span className="flex items-center gap-1"><Mail className="h-3.5 w-3.5" />{req.email}</span>
                                <span className="flex items-center gap-1"><Clock className="h-3.5 w-3.5" />{new Date(req.created_at).toLocaleString("it-IT")}</span>
                              </div>
                              <p className="text-sm font-medium text-foreground">Oggetto: {req.subject}</p>
                            </div>
                            <div className="flex shrink-0 gap-2">
                              {req.status === "new" && (
                                <Button size="sm" variant="outline" className="gap-1.5 text-xs" onClick={() => markContactRead(req.id, "read")}>
                                  <Eye className="h-3.5 w-3.5" />
                                  Segna letto
                                </Button>
                              )}
                              {req.status !== "replied" && (
                                <Button size="sm" variant="outline" className="gap-1.5 text-xs" onClick={() => markContactRead(req.id, "replied")}>
                                  <Check className="h-3.5 w-3.5" />
                                  Risposto
                                </Button>
                              )}
                              <a href={`mailto:${req.email}?subject=Re: ${encodeURIComponent(req.subject)}`}>
                                <Button size="sm" className="gap-1.5 text-xs">
                                  <Mail className="h-3.5 w-3.5" />
                                  Rispondi
                                </Button>
                              </a>
                            </div>
                          </div>
                          <div className="rounded-md bg-muted p-3 text-sm text-foreground whitespace-pre-wrap">
                            {req.message}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
          <AlertDialog open={deleteReportDialog.open} onOpenChange={(open) => setDeleteReportDialog({ open, reportId: deleteReportDialog.reportId })}>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Eliminare questa segnalazione?</AlertDialogTitle>
                <AlertDialogDescription>
                  Questa azione non puo essere annullata. La segnalazione verra eliminata permanentemente dalla piattaforma.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel onClick={() => setDeleteReportDialog({ open: false, reportId: null })}>
                  Annulla
                </AlertDialogCancel>
                <AlertDialogAction
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  onClick={handleConfirmDeleteReport}
                >
                  Elimina
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>

          {/* ===== DIALOG: BANNA UTENTE ===== */}
          <Dialog open={banUserDialog.open} onOpenChange={(open) => { setBanUserDialog((p) => ({ ...p, open })); if (!open) setBanReason("") }}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <Ban className="h-5 w-5 text-orange-600" />
                  Banna Utente
                </DialogTitle>
                <DialogDescription>
                  Stai per bannare permanentemente <strong>{banUserDialog.userName || "questo utente"}</strong> dalla piattaforma. Inserisci la motivazione.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-3 py-2">
                <Label htmlFor="ban-reason">Motivazione <span className="text-destructive">*</span></Label>
                <Textarea
                  id="ban-reason"
                  placeholder="Descrivi il motivo del ban..."
                  value={banReason}
                  onChange={(e) => setBanReason(e.target.value)}
                  rows={4}
                />
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => { setBanUserDialog({ open: false, userId: null, userName: "" }); setBanReason("") }}>
                  Annulla
                </Button>
                <Button
                  className="bg-orange-600 text-white hover:bg-orange-700"
                  disabled={!banReason.trim() || processingUserAction}
                  onClick={handleConfirmBanUser}
                >
                  {processingUserAction ? <Loader2 className="h-4 w-4 animate-spin" /> : "Banna Utente"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* ===== DIALOG: SOSPENDI UTENTE ===== */}
          <Dialog open={suspendUserDialog.open} onOpenChange={(open) => { setSuspendUserDialog((p) => ({ ...p, open })); if (!open) { setSuspendReason(""); setSuspendDuration("24h") } }}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5 text-yellow-600" />
                  Sospendi Utente
                </DialogTitle>
                <DialogDescription>
                  Sospendi temporaneamente <strong>{suspendUserDialog.userName || "questo utente"}</strong>. Seleziona la durata e inserisci la motivazione.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-2">
                <div className="space-y-2">
                  <Label>Durata sospensione</Label>
                  <Select value={suspendDuration} onValueChange={setSuspendDuration}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="24h">24 ore</SelectItem>
                      <SelectItem value="48h">48 ore</SelectItem>
                      <SelectItem value="3d">3 giorni</SelectItem>
                      <SelectItem value="1w">1 settimana</SelectItem>
                      <SelectItem value="2w">2 settimane</SelectItem>
                      <SelectItem value="1m">1 mese</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="suspend-reason">Motivazione <span className="text-destructive">*</span></Label>
                  <Textarea
                    id="suspend-reason"
                    placeholder="Descrivi il motivo della sospensione..."
                    value={suspendReason}
                    onChange={(e) => setSuspendReason(e.target.value)}
                    rows={4}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => { setSuspendUserDialog({ open: false, userId: null, userName: "" }); setSuspendReason(""); setSuspendDuration("24h") }}>
                  Annulla
                </Button>
                <Button
                  className="bg-yellow-600 text-white hover:bg-yellow-700"
                  disabled={!suspendReason.trim() || processingUserAction}
                  onClick={handleConfirmSuspendUser}
                >
                  {processingUserAction ? <Loader2 className="h-4 w-4 animate-spin" /> : "Sospendi Utente"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </main>
      <Footer />
    </div>
  )
}
