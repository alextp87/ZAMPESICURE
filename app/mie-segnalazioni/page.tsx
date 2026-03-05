"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import { createClient } from "@/lib/supabase/client"
import type { Report, Message } from "@/lib/types"
import { animalTypeLabels, reportTypeLabels } from "@/lib/types"
import { 
  Loader2, 
  MessageCircle, 
  MapPin, 
  Clock, 
  Mail, 
  User, 
  CheckCircle2,
  Dog,
  Cat,
  Bird,
  Inbox,
  Pencil,
  Trash2,
  Eye
} from "lucide-react"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"

interface ReportWithMessages extends Report {
  messages: Message[]
}

function AnimalIcon({ type }: { type: Report["animal_type"] }) {
  switch (type) {
    case "cane":
      return <Dog className="h-5 w-5" />
    case "gatto":
      return <Cat className="h-5 w-5" />
    case "volatile":
      return <Bird className="h-5 w-5" />
  }
}

function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString("it-IT", {
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  })
}

export default function MieSegnalazioniPage() {
  const router = useRouter()
  const [reports, setReports] = useState<ReportWithMessages[]>([])
  const [loading, setLoading] = useState(true)
  const [userId, setUserId] = useState<string | null>(null)
  const [deletingReportId, setDeletingReportId] = useState<string | null>(null)
  const [resolvingReportId, setResolvingReportId] = useState<string | null>(null)

  useEffect(() => {
    const checkAuthAndFetchData = async () => {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) {
        router.push("/auth/login")
        return
      }

      setUserId(user.id)

      // Fetch user's reports
      const { data: reportsData } = await supabase
        .from("reports")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })

      if (reportsData) {
        // Fetch messages for each report
        const reportsWithMessages: ReportWithMessages[] = []
        
        for (const report of reportsData) {
          const { data: messagesData } = await supabase
            .from("messages")
            .select("*")
            .eq("report_id", report.id)
            .order("created_at", { ascending: false })

          reportsWithMessages.push({
            ...report,
            messages: messagesData || [],
          })
        }

        setReports(reportsWithMessages)
      }

      setLoading(false)
    }

    checkAuthAndFetchData()
  }, [router])

  const markMessageAsRead = async (messageId: string) => {
    const supabase = createClient()
    await supabase
      .from("messages")
      .update({ is_read: true })
      .eq("id", messageId)

    // Update local state
    setReports((prev) =>
      prev.map((report) => ({
        ...report,
        messages: report.messages.map((msg) =>
          msg.id === messageId ? { ...msg, is_read: true } : msg
        ),
      }))
    )
  }

  const handleDeleteReport = async (reportId: string) => {
    setDeletingReportId(reportId)
    const supabase = createClient()
    
    const { error } = await supabase
      .from("reports")
      .delete()
      .eq("id", reportId)
      .eq("user_id", userId)

    if (!error) {
      setReports((prev) => prev.filter((r) => r.id !== reportId))
    }
    setDeletingReportId(null)
  }

  const handleResolveReport = async (reportId: string) => {
    setResolvingReportId(reportId)
    const supabase = createClient()

    const { error } = await supabase
      .from("reports")
      .update({ status: "resolved" })
      .eq("id", reportId)
      .eq("user_id", userId)

    if (!error) {
      setReports((prev) => prev.map((r) =>
        r.id === reportId ? { ...r, status: "resolved" as const } : r
      ))
    }
    setResolvingReportId(null)
  }

  const totalUnreadMessages = reports.reduce(
    (acc, report) => acc + report.messages.filter((m) => !m.is_read).length,
    0
  )

  if (loading) {
    return (
      <div className="flex min-h-screen flex-col">
        <Header />
        <main className="flex flex-1 items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </main>
        <Footer />
      </div>
    )
  }

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1 py-8">
        <div className="container mx-auto px-4">
          <div className="mb-8 flex items-center justify-between">
            <div>
              <h1 className="mb-2 text-3xl font-bold text-foreground">
                Le Mie Segnalazioni
              </h1>
              <p className="text-muted-foreground">
                Gestisci le tue segnalazioni e leggi i messaggi ricevuti
              </p>
            </div>
            {totalUnreadMessages > 0 && (
              <Badge variant="destructive" className="text-base">
                {totalUnreadMessages} messagg{totalUnreadMessages === 1 ? "io" : "i"} non lett{totalUnreadMessages === 1 ? "o" : "i"}
              </Badge>
            )}
          </div>

          {reports.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center py-16 text-center">
                <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-muted">
                  <Inbox className="h-8 w-8 text-muted-foreground" />
                </div>
                <h3 className="mb-2 text-lg font-semibold">
                  Non hai ancora segnalazioni
                </h3>
                <p className="mb-4 text-muted-foreground">
                  Crea la tua prima segnalazione per aiutare a ritrovare un animale
                </p>
                <Button onClick={() => router.push("/nuova-segnalazione")}>
                  Crea segnalazione
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-6">
              {reports.map((report) => {
                const unreadCount = report.messages.filter((m) => !m.is_read).length
                const isSmarrito = report.report_type === "smarrito"

                return (
                  <Card key={report.id}>
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                          <div className={`flex h-12 w-12 items-center justify-center rounded-full ${isSmarrito ? "bg-destructive/20" : "bg-accent/20"}`}>
                            <AnimalIcon type={report.animal_type} />
                          </div>
                        <div>
                          <CardTitle className="flex items-center gap-2">
                            {report.animal_name || animalTypeLabels[report.animal_type]}
                            <Badge
                              variant={isSmarrito ? "destructive" : "default"}
                              className={isSmarrito ? "bg-destructive text-destructive-foreground" : "bg-accent text-accent-foreground"}
                            >
                              {reportTypeLabels[report.report_type]}
                            </Badge>
                            {report.status === "resolved" && (
                              <Badge variant="outline" className="gap-1 border-green-500 text-green-600">
                                <CheckCircle2 className="h-3 w-3" />
                                {isSmarrito ? "Ritrovato" : "Riconsegnato"}
                              </Badge>
                            )}
                          </CardTitle>
                            <CardDescription className="flex items-center gap-4 mt-1">
                              <span className="flex items-center gap-1">
                                <MapPin className="h-3 w-3" />
                                {report.address}, {report.city}
                              </span>
                              <span className="flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                {formatDate(report.created_at)}
                              </span>
                            </CardDescription>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="gap-1">
                            <Eye className="h-3 w-3" />
                            {report.views_count || 0}
                          </Badge>
                          <Badge variant="outline" className="gap-1">
                            <MessageCircle className="h-3 w-3" />
                            {report.messages.length}
                          </Badge>
                          {unreadCount > 0 && (
                            <Badge variant="destructive">
                              {unreadCount} nuov{unreadCount === 1 ? "o" : "i"}
                            </Badge>
                          )}
                        </div>
                      </div>
                      {/* Action buttons */}
                      <div className="mt-4 flex flex-wrap gap-2 sm:mt-0">
                        {report.status !== "resolved" && (
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button
                                variant="outline"
                                size="sm"
                                className="gap-1 border-green-500 text-green-600 hover:bg-green-50"
                              >
                                <CheckCircle2 className="h-4 w-4" />
                                {isSmarrito ? "Ritrovato" : "Riconsegnato"}
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>
                                  {isSmarrito ? "Contrassegnare come Ritrovato?" : "Contrassegnare come Riconsegnato?"}
                                </AlertDialogTitle>
                                <AlertDialogDescription>
                                  {isSmarrito
                                    ? "La segnalazione verra rimossa dalla piattaforma e contrassegnata come risolta. Ottima notizia!"
                                    : "La segnalazione verra rimossa dalla piattaforma e contrassegnata come risolta. Ottima notizia!"}
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Annulla</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => handleResolveReport(report.id)}
                                  className="bg-green-600 text-white hover:bg-green-700"
                                  disabled={resolvingReportId === report.id}
                                >
                                  {resolvingReportId === report.id ? (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                  ) : (
                                    "Conferma"
                                  )}
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        )}
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => router.push(`/modifica-segnalazione/${report.id}`)}
                          className="gap-1"
                        >
                          <Pencil className="h-4 w-4" />
                          Modifica
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button
                              variant="outline"
                              size="sm"
                              className="gap-1 text-destructive hover:bg-destructive hover:text-destructive-foreground"
                            >
                              <Trash2 className="h-4 w-4" />
                              Elimina
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Eliminare la segnalazione?</AlertDialogTitle>
                              <AlertDialogDescription>
                                Questa azione non puo essere annullata. La segnalazione e tutti i messaggi associati verranno eliminati permanentemente.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Annulla</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => handleDeleteReport(report.id)}
                                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                disabled={deletingReportId === report.id}
                              >
                                {deletingReportId === report.id ? (
                                  <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                  "Elimina"
                                )}
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <p className="mb-4 text-sm text-muted-foreground">
                        {report.description}
                      </p>

                      {report.messages.length > 0 ? (
                        <Accordion type="single" collapsible className="w-full">
                          <AccordionItem value="messages" className="border-none">
                            <AccordionTrigger className="hover:no-underline">
                              <span className="flex items-center gap-2">
                                <MessageCircle className="h-4 w-4" />
                                Mostra messaggi ({report.messages.length})
                              </span>
                            </AccordionTrigger>
                            <AccordionContent>
                              <div className="space-y-4 pt-4">
                                {report.messages.map((message) => (
                                  <div
                                    key={message.id}
                                    className={`rounded-lg border p-4 ${!message.is_read ? "border-primary bg-primary/5" : "bg-muted/50"}`}
                                  >
                                    <div className="mb-2 flex items-start justify-between">
                                      <div className="flex items-center gap-2">
                                        <User className="h-4 w-4 text-muted-foreground" />
                                        <span className="font-medium">{message.sender_name}</span>
                                        {!message.is_read && (
                                          <Badge variant="secondary" className="text-xs">
                                            Nuovo
                                          </Badge>
                                        )}
                                      </div>
                                      <span className="text-xs text-muted-foreground">
                                        {formatDate(message.created_at)}
                                      </span>
                                    </div>
                                    <p className="mb-3 text-sm">{message.message}</p>
                                    <div className="flex items-center justify-between">
                                      <a
                                        href={`mailto:${message.sender_email}`}
                                        className="flex items-center gap-1 text-sm text-primary hover:underline"
                                      >
                                        <Mail className="h-3 w-3" />
                                        {message.sender_email}
                                      </a>
                                      {!message.is_read && (
                                        <Button
                                          size="sm"
                                          variant="outline"
                                          onClick={() => markMessageAsRead(message.id)}
                                          className="gap-1"
                                        >
                                          <CheckCircle2 className="h-3 w-3" />
                                          Segna come letto
                                        </Button>
                                      )}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </AccordionContent>
                          </AccordionItem>
                        </Accordion>
                      ) : (
                        <p className="text-sm text-muted-foreground italic">
                          Nessun messaggio ricevuto per questa segnalazione
                        </p>
                      )}
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  )
}
