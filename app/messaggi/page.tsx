"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { createClient } from "@/lib/supabase/client"
import type { Conversation } from "@/lib/types"
import { Loader2, MessageCircle, User, Clock, Dog, Cat, Bird, Inbox } from "lucide-react"

function AnimalIcon({ type }: { type: string }) {
  switch (type) {
    case "cane":
      return <Dog className="h-4 w-4" />
    case "gatto":
      return <Cat className="h-4 w-4" />
    case "volatile":
      return <Bird className="h-4 w-4" />
    default:
      return null
  }
}

export default function MessaggiPage() {
  const router = useRouter()
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [loading, setLoading] = useState(true)
  const [userId, setUserId] = useState<string | null>(null)

  useEffect(() => {
    const fetchConversations = async () => {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) {
        router.push("/login")
        return
      }

      setUserId(user.id)

      // Fetch conversations where user is participant
      const { data: convs, error } = await supabase
        .from("conversations")
        .select(`
          id,
          participant_1,
          participant_2,
          report_id,
          last_message_at,
          created_at
        `)
        .or(`participant_1.eq.${user.id},participant_2.eq.${user.id}`)
        .order("last_message_at", { ascending: false })

      if (error || !convs) {
        setLoading(false)
        return
      }

      // For each conversation, fetch additional data
      const conversationsWithDetails: Conversation[] = await Promise.all(
        convs.map(async (conv) => {
          const otherUserId = conv.participant_1 === user.id ? conv.participant_2 : conv.participant_1

          // Fetch other user's profile
          const { data: otherUser } = await supabase
            .from("profiles")
            .select("id, first_name, last_name")
            .eq("id", otherUserId)
            .single()

          // Fetch report if exists
          let report = null
          if (conv.report_id) {
            const { data: reportData } = await supabase
              .from("reports")
              .select("animal_name, animal_type, report_type")
              .eq("id", conv.report_id)
              .single()
            report = reportData
          }

          // Fetch last message
          const { data: lastMsg } = await supabase
            .from("chat_messages")
            .select("id, content, created_at, sender_id, is_read")
            .eq("conversation_id", conv.id)
            .order("created_at", { ascending: false })
            .limit(1)
            .single()

          // Count unread messages
          const { count: unreadCount } = await supabase
            .from("chat_messages")
            .select("id", { count: "exact", head: true })
            .eq("conversation_id", conv.id)
            .eq("is_read", false)
            .neq("sender_id", user.id)

          return {
            ...conv,
            other_user: otherUser || undefined,
            report: report || undefined,
            last_message: lastMsg || undefined,
            unread_count: unreadCount || 0,
          }
        })
      )

      setConversations(conversationsWithDetails)
      setLoading(false)
    }

    fetchConversations()
  }, [router])

  const totalUnread = conversations.reduce((acc, c) => acc + (c.unread_count || 0), 0)

  const formatTime = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24))

    if (diffDays === 0) {
      return date.toLocaleTimeString("it-IT", { hour: "2-digit", minute: "2-digit" })
    } else if (diffDays === 1) {
      return "Ieri"
    } else if (diffDays < 7) {
      return date.toLocaleDateString("it-IT", { weekday: "short" })
    } else {
      return date.toLocaleDateString("it-IT", { day: "2-digit", month: "2-digit" })
    }
  }

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Header />
      <main className="flex-1 py-8">
        <div className="container mx-auto max-w-4xl px-4">
          <div className="mb-8">
            <h1 className="text-3xl font-bold tracking-tight">Messaggi</h1>
            <p className="mt-2 text-muted-foreground">
              Le tue conversazioni con altri utenti
            </p>
            {totalUnread > 0 && (
              <Badge variant="destructive" className="mt-2">
                {totalUnread} messaggi non letti
              </Badge>
            )}
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : conversations.length > 0 ? (
            <div className="space-y-3">
              {conversations.map((conversation) => (
                <Card
                  key={conversation.id}
                  className={`cursor-pointer transition-colors hover:bg-muted/50 ${
                    conversation.unread_count && conversation.unread_count > 0 ? "border-primary" : ""
                  }`}
                  onClick={() => router.push(`/chat/${conversation.id}`)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start gap-4">
                      {/* Avatar */}
                      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-primary/10">
                        <User className="h-6 w-6 text-primary" />
                      </div>

                      {/* Content */}
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-2">
                          <h3 className="font-semibold truncate">
                            {conversation.other_user?.first_name || conversation.other_user?.last_name
                              ? `${conversation.other_user.first_name || ""} ${conversation.other_user.last_name || ""}`.trim()
                              : "Utente"}
                          </h3>
                          <span className="shrink-0 text-xs text-muted-foreground">
                            {conversation.last_message && formatTime(conversation.last_message.created_at)}
                          </span>
                        </div>

                        {/* Report reference */}
                        {conversation.report && (
                          <div className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
                            <AnimalIcon type={conversation.report.animal_type} />
                            <span>
                              {conversation.report.animal_name || conversation.report.animal_type}
                              {" - "}
                              {conversation.report.report_type === "smarrito" ? "Smarrito" : "Avvistato"}
                            </span>
                          </div>
                        )}

                        {/* Last message preview */}
                        <p className={`mt-1 truncate text-sm ${
                          conversation.unread_count && conversation.unread_count > 0 
                            ? "font-medium text-foreground" 
                            : "text-muted-foreground"
                        }`}>
                          {conversation.last_message?.sender_id === userId && "Tu: "}
                          {conversation.last_message?.content || "Nessun messaggio"}
                        </p>
                      </div>

                      {/* Unread badge */}
                      {conversation.unread_count && conversation.unread_count > 0 && (
                        <Badge variant="destructive" className="shrink-0">
                          {conversation.unread_count}
                        </Badge>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="py-12 text-center">
                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-muted">
                  <Inbox className="h-8 w-8 text-muted-foreground" />
                </div>
                <h3 className="text-lg font-medium">Nessuna conversazione</h3>
                <p className="mt-2 text-muted-foreground">
                  Quando contatterai qualcuno riguardo una segnalazione, la conversazione apparira qui.
                </p>
                <Button className="mt-4" onClick={() => router.push("/segnalazioni")}>
                  Sfoglia segnalazioni
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </main>
      <Footer />
    </div>
  )
}
