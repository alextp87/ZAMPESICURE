"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { createClient } from "@/lib/supabase/client"
import { MessageCircle, Loader2, CheckCircle2, LogIn } from "lucide-react"

interface SendMessageDialogProps {
  reportId: string
  reportOwnerId?: string
  animalName?: string
  reportType: "smarrito" | "avvistato"
  fullWidth?: boolean
}

export function SendMessageDialog({ reportId, reportOwnerId, animalName, reportType, fullWidth }: SendMessageDialogProps) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [message, setMessage] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [userId, setUserId] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const checkUser = async () => {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      setUserId(user?.id || null)
      setIsLoading(false)
    }
    checkUser()
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!userId || !reportOwnerId) return
    
    setIsSubmitting(true)
    setError(null)

    const supabase = createClient()

    // Check if conversation already exists
    const { data: existingConv } = await supabase
      .from("conversations")
      .select("id")
      .eq("report_id", reportId)
      .or(`and(participant_1.eq.${userId},participant_2.eq.${reportOwnerId}),and(participant_1.eq.${reportOwnerId},participant_2.eq.${userId})`)
      .single()

    let conversationId = existingConv?.id

    // Create conversation if it doesn't exist
    if (!conversationId) {
      const { data: newConv, error: convError } = await supabase
        .from("conversations")
        .insert({
          participant_1: userId,
          participant_2: reportOwnerId,
          report_id: reportId,
        })
        .select("id")
        .single()

      if (convError) {
        setError("Errore nella creazione della conversazione")
        setIsSubmitting(false)
        return
      }

      conversationId = newConv.id
    }

    // Send message
    const { error: msgError } = await supabase
      .from("chat_messages")
      .insert({
        conversation_id: conversationId,
        sender_id: userId,
        content: message.trim(),
      })

    if (msgError) {
      setError("Errore nell'invio del messaggio")
      setIsSubmitting(false)
      return
    }

    // Update conversation last_message_at
    await supabase
      .from("conversations")
      .update({ last_message_at: new Date().toISOString() })
      .eq("id", conversationId)

    setSubmitted(true)
    setIsSubmitting(false)

    // Redirect to chat after short delay
    setTimeout(() => {
      router.push(`/chat/${conversationId}`)
    }, 1500)
  }

  const resetForm = () => {
    setMessage("")
    setSubmitted(false)
    setError(null)
  }

  const handleOpenChange = (newOpen: boolean) => {
    setOpen(newOpen)
    if (!newOpen) {
      resetForm()
    }
  }

  // Don't show button if user is the owner
  if (userId === reportOwnerId) {
    return null
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
          <Button variant="outline" size="sm" className={`gap-2${fullWidth ? " w-full" : ""}`}>
          <MessageCircle className="h-4 w-4" />
          Contatta
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        ) : !userId ? (
          <div className="flex flex-col items-center py-8 text-center">
            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-muted">
              <LogIn className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="mb-2 text-lg font-semibold">Accedi per contattare</h3>
            <p className="mb-4 text-sm text-muted-foreground">
              Devi effettuare l'accesso per inviare messaggi agli altri utenti.
            </p>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => handleOpenChange(false)}>
                Annulla
              </Button>
              <Button onClick={() => router.push("/login")}>
                Accedi
              </Button>
            </div>
          </div>
        ) : !reportOwnerId ? (
          <div className="flex flex-col items-center py-8 text-center">
            <p className="text-sm text-muted-foreground">
              Questa segnalazione e stata creata da un utente anonimo e non puo essere contattato.
            </p>
            <Button className="mt-4" onClick={() => handleOpenChange(false)}>
              Chiudi
            </Button>
          </div>
        ) : submitted ? (
          <div className="flex flex-col items-center py-8 text-center">
            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-accent/20">
              <CheckCircle2 className="h-8 w-8 text-accent" />
            </div>
            <h3 className="mb-2 text-lg font-semibold">Messaggio Inviato!</h3>
            <p className="mb-4 text-sm text-muted-foreground">
              Verrai reindirizzato alla chat...
            </p>
            <Loader2 className="h-5 w-5 animate-spin text-primary" />
          </div>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle>Invia un messaggio</DialogTitle>
              <DialogDescription>
                {reportType === "smarrito" 
                  ? `Hai informazioni su ${animalName || "questo animale"}? Scrivi al proprietario.`
                  : "Pensi che sia il tuo animale? Contatta chi ha fatto la segnalazione."}
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Scrivi il tuo messaggio..."
                  rows={4}
                  required
                  minLength={5}
                />
              </div>
              {error && (
                <div className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive">
                  {error}
                </div>
              )}
              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => handleOpenChange(false)}>
                  Annulla
                </Button>
                <Button type="submit" disabled={isSubmitting || !message.trim()}>
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Invio...
                    </>
                  ) : (
                    "Invia messaggio"
                  )}
                </Button>
              </div>
            </form>
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}
