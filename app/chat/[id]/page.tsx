"use client"

import { useState, useEffect, useRef, use } from "react"
import { useRouter } from "next/navigation"
import { Header } from "@/components/header"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { createClient } from "@/lib/supabase/client"
import type { ChatMessage, Conversation } from "@/lib/types"
import { Loader2, Send, ArrowLeft, User, Dog, Cat, Bird } from "lucide-react"
import Link from "next/link"
import { ReportMessageDialog } from "@/components/report-message-dialog"

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

export default function ChatPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: conversationId } = use(params)
  const router = useRouter()
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [newMessage, setNewMessage] = useState("")
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [userId, setUserId] = useState<string | null>(null)
  const [conversation, setConversation] = useState<Conversation | null>(null)
  const [otherUser, setOtherUser] = useState<{ first_name: string | null; last_name: string | null } | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(() => {
    const fetchData = async () => {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) {
        router.push("/login")
        return
      }

      setUserId(user.id)

      // Fetch conversation
      const { data: conv, error: convError } = await supabase
        .from("conversations")
        .select("*")
        .eq("id", conversationId)
        .single()

      if (convError || !conv) {
        router.push("/messaggi")
        return
      }

      // Check if user is participant
      if (conv.participant_1 !== user.id && conv.participant_2 !== user.id) {
        // Check if admin
        const { data: profile } = await supabase
          .from("profiles")
          .select("is_admin")
          .eq("id", user.id)
          .single()

        if (!profile?.is_admin) {
          router.push("/messaggi")
          return
        }
      }

      setConversation(conv)

      // Fetch other user's profile
      const otherUserId = conv.participant_1 === user.id ? conv.participant_2 : conv.participant_1
      const { data: otherUserData } = await supabase
        .from("profiles")
        .select("first_name, last_name")
        .eq("id", otherUserId)
        .single()

      setOtherUser(otherUserData)

      // Fetch messages
      const { data: msgs } = await supabase
        .from("chat_messages")
        .select("*")
        .eq("conversation_id", conversationId)
        .order("created_at", { ascending: true })

      if (msgs) {
        setMessages(msgs)

        // Mark unread messages as read
        const unreadIds = msgs
          .filter((m) => !m.is_read && m.sender_id !== user.id)
          .map((m) => m.id)

        if (unreadIds.length > 0) {
          await supabase
            .from("chat_messages")
            .update({ is_read: true })
            .in("id", unreadIds)
        }
      }

      setLoading(false)
    }

    fetchData()

    // Set up realtime subscription
    const supabase = createClient()
    const channel = supabase
      .channel(`chat-${conversationId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "chat_messages",
          filter: `conversation_id=eq.${conversationId}`,
        },
        async (payload) => {
          const newMsg = payload.new as ChatMessage
          setMessages((prev) => [...prev, newMsg])

          // Mark as read if not from current user
          if (newMsg.sender_id !== userId) {
            await supabase
              .from("chat_messages")
              .update({ is_read: true })
              .eq("id", newMsg.id)
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [conversationId, router, userId])

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const handleSend = async () => {
    if (!newMessage.trim() || !userId) return

    setSending(true)
    const supabase = createClient()

    const { error } = await supabase.from("chat_messages").insert({
      conversation_id: conversationId,
      sender_id: userId,
      content: newMessage.trim(),
    })

    if (!error) {
      // Update conversation last_message_at
      await supabase
        .from("conversations")
        .update({ last_message_at: new Date().toISOString() })
        .eq("id", conversationId)

      setNewMessage("")
      inputRef.current?.focus()
    }

    setSending(false)
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const formatMessageTime = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleTimeString("it-IT", { hour: "2-digit", minute: "2-digit" })
  }

  const formatMessageDate = (dateString: string) => {
    const date = new Date(dateString)
    const today = new Date()
    const yesterday = new Date(today)
    yesterday.setDate(yesterday.getDate() - 1)

    if (date.toDateString() === today.toDateString()) {
      return "Oggi"
    } else if (date.toDateString() === yesterday.toDateString()) {
      return "Ieri"
    } else {
      return date.toLocaleDateString("it-IT", { day: "numeric", month: "long", year: "numeric" })
    }
  }

  // Group messages by date
  const groupedMessages: { date: string; messages: ChatMessage[] }[] = []
  let currentDate = ""

  messages.forEach((msg) => {
    const msgDate = new Date(msg.created_at).toDateString()
    if (msgDate !== currentDate) {
      currentDate = msgDate
      groupedMessages.push({ date: msg.created_at, messages: [msg] })
    } else {
      groupedMessages[groupedMessages.length - 1].messages.push(msg)
    }
  })

  if (loading) {
    return (
      <div className="flex min-h-screen flex-col bg-background">
        <Header />
        <div className="flex flex-1 items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen flex-col bg-background">
      {/* Chat Header */}
      <div className="sticky top-0 z-50 border-b bg-background">
        <div className="container mx-auto flex items-center gap-4 px-4 py-3">
          <Button variant="ghost" size="icon" onClick={() => router.push("/messaggi")}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
            <User className="h-5 w-5 text-primary" />
          </div>
          <div className="flex-1">
            <h1 className="font-semibold">
              {otherUser?.first_name || otherUser?.last_name
                ? `${otherUser.first_name || ""} ${otherUser.last_name || ""}`.trim()
                : "Utente"}
            </h1>
            {conversation?.report_id && (
              <Link 
                href={`/segnalazione/${conversation.report_id}`}
                className="text-xs text-muted-foreground hover:underline"
              >
                Vedi segnalazione
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto px-4 py-4">
        <div className="container mx-auto max-w-2xl space-y-4">
          {groupedMessages.map((group, groupIndex) => (
            <div key={groupIndex}>
              {/* Date separator */}
              <div className="my-4 flex items-center justify-center">
                <Badge variant="secondary" className="text-xs">
                  {formatMessageDate(group.date)}
                </Badge>
              </div>

              {/* Messages */}
              {group.messages.map((message) => {
                const isOwn = message.sender_id === userId
                return (
                  <div
                    key={message.id}
                    className={`group mb-2 flex items-center gap-1 ${isOwn ? "justify-end" : "justify-start"}`}
                  >
                    {/* Report button for received messages */}
                    {!isOwn && (
                      <ReportMessageDialog
                        messageId={message.id}
                        conversationId={conversationId}
                        senderId={message.sender_id}
                        messageContent={message.content}
                      />
                    )}
                    <div
                      className={`max-w-[80%] rounded-2xl px-4 py-2 ${
                        isOwn
                          ? "bg-primary text-primary-foreground rounded-br-md"
                          : "bg-muted rounded-bl-md"
                      }`}
                    >
                      <p className="text-sm whitespace-pre-wrap break-words">{message.content}</p>
                      <p
                        className={`mt-1 text-xs ${
                          isOwn ? "text-primary-foreground/70" : "text-muted-foreground"
                        }`}
                      >
                        {formatMessageTime(message.created_at)}
                        {isOwn && message.is_read && " · Letto"}
                      </p>
                    </div>
                  </div>
                )
              })}
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Message Input */}
      <div className="sticky bottom-0 border-t bg-background">
        <div className="container mx-auto max-w-2xl px-4 py-3">
          <div className="flex items-center gap-2">
            <Input
              ref={inputRef}
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyDown={handleKeyPress}
              placeholder="Scrivi un messaggio..."
              className="flex-1"
              disabled={sending}
            />
            <Button
              onClick={handleSend}
              disabled={!newMessage.trim() || sending}
              size="icon"
            >
              {sending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
