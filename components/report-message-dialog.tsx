"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Flag, Loader2, AlertTriangle } from "lucide-react"
import { createClient } from "@/lib/supabase/client"

interface ReportMessageDialogProps {
  messageId: string
  conversationId: string
  senderId: string
  messageContent: string
}

const reportReasons = [
  { value: "harassment", label: "Molestie o bullismo" },
  { value: "spam", label: "Spam o pubblicità" },
  { value: "inappropriate", label: "Contenuto inappropriato" },
  { value: "scam", label: "Truffa o frode" },
  { value: "threats", label: "Minacce o violenza" },
  { value: "other", label: "Altro" },
]

export function ReportMessageDialog({
  messageId,
  conversationId,
  senderId,
  messageContent,
}: ReportMessageDialogProps) {
  const [open, setOpen] = useState(false)
  const [reason, setReason] = useState("")
  const [details, setDetails] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)

  const handleSubmit = async () => {
    if (!reason) return

    setIsSubmitting(true)
    const supabase = createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      setIsSubmitting(false)
      return
    }

    const reasonLabel = reportReasons.find((r) => r.value === reason)?.label || reason
    const fullReason = details ? `${reasonLabel}: ${details}` : reasonLabel

    const { error } = await supabase.from("message_reports").insert({
      message_id: messageId,
      conversation_id: conversationId,
      reporter_id: user.id,
      reported_user_id: senderId,
      reason: fullReason,
      message_content: messageContent,
      status: "pending",
    })

    setIsSubmitting(false)

    if (!error) {
      setSubmitted(true)
      setTimeout(() => {
        setOpen(false)
        setSubmitted(false)
        setReason("")
        setDetails("")
      }, 2000)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
        >
          <Flag className="h-3 w-3 text-muted-foreground hover:text-destructive" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        {submitted ? (
          <div className="flex flex-col items-center justify-center py-8">
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
              <AlertTriangle className="h-6 w-6 text-green-600" />
            </div>
            <h3 className="text-lg font-semibold">Segnalazione inviata</h3>
            <p className="mt-2 text-center text-sm text-muted-foreground">
              Il nostro team revisora la segnalazione e prendera i provvedimenti necessari.
            </p>
          </div>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Flag className="h-5 w-5 text-destructive" />
                Segnala messaggio
              </DialogTitle>
              <DialogDescription>
                Segnala questo messaggio al nostro team di moderazione. Le segnalazioni sono anonime.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              <div className="rounded-lg bg-muted p-3">
                <p className="text-sm text-muted-foreground line-clamp-3">
                  &quot;{messageContent}&quot;
                </p>
              </div>

              <div className="space-y-3">
                <Label>Motivo della segnalazione</Label>
                <RadioGroup value={reason} onValueChange={setReason}>
                  {reportReasons.map((r) => (
                    <div key={r.value} className="flex items-center space-x-2">
                      <RadioGroupItem value={r.value} id={r.value} />
                      <Label htmlFor={r.value} className="font-normal cursor-pointer">
                        {r.label}
                      </Label>
                    </div>
                  ))}
                </RadioGroup>
              </div>

              <div className="space-y-2">
                <Label htmlFor="details">Dettagli aggiuntivi (opzionale)</Label>
                <Textarea
                  id="details"
                  value={details}
                  onChange={(e) => setDetails(e.target.value)}
                  placeholder="Fornisci ulteriori dettagli sulla segnalazione..."
                  rows={3}
                />
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setOpen(false)}>
                Annulla
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={!reason || isSubmitting}
                variant="destructive"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Invio...
                  </>
                ) : (
                  "Invia segnalazione"
                )}
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}
