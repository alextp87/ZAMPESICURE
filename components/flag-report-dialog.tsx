"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Flag, Loader2, CheckCircle, AlertTriangle } from "lucide-react"
import { createClient } from "@/lib/supabase/client"

interface FlagReportDialogProps {
  reportId: string
  fullWidth?: boolean
}

const flagReasons = [
  { value: "inappropriate", label: "Contenuto inappropriato" },
  { value: "spam", label: "Spam o pubblicità" },
  { value: "fake", label: "Segnalazione falsa" },
  { value: "duplicate", label: "Duplicato" },
  { value: "other", label: "Altro" },
]

export function FlagReportDialog({ reportId, fullWidth }: FlagReportDialogProps) {
  const [open, setOpen] = useState(false)
  const [selectedReason, setSelectedReason] = useState("")
  const [additionalInfo, setAdditionalInfo] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async () => {
    if (!selectedReason) return

    setIsSubmitting(true)
    setError(null)

    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      setError("Devi essere loggato per segnalare")
      setIsSubmitting(false)
      return
    }

    const reasonLabel = flagReasons.find(r => r.value === selectedReason)?.label || selectedReason
    const fullReason = additionalInfo 
      ? `${reasonLabel}: ${additionalInfo}`
      : reasonLabel

    const { error: insertError } = await supabase
      .from("report_flags")
      .insert({
        report_id: reportId,
        user_id: user.id,
        reason: fullReason,
      })

    if (insertError) {
      setError("Errore durante l'invio della segnalazione")
      setIsSubmitting(false)
      return
    }

    setSubmitted(true)
    setIsSubmitting(false)
    setTimeout(() => {
      setOpen(false)
      setSubmitted(false)
      setSelectedReason("")
      setAdditionalInfo("")
    }, 2000)
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
          <Button variant="ghost" size="sm" className={`h-8 gap-1 px-2 text-muted-foreground hover:text-destructive${fullWidth ? " w-full" : ""}`}>
          <Flag className="h-3.5 w-3.5" />
          <span className="text-xs">Segnala</span>
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-destructive" />
            Segnala annuncio
          </DialogTitle>
          <DialogDescription>
            Segnala questo annuncio allo staff per la revisione
          </DialogDescription>
        </DialogHeader>

        {submitted ? (
          <div className="flex flex-col items-center justify-center py-8">
            <CheckCircle className="mb-4 h-12 w-12 text-accent" />
            <p className="text-center font-medium">Segnalazione inviata!</p>
            <p className="text-center text-sm text-muted-foreground">
              Lo staff revisionera la segnalazione
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="space-y-3">
              <Label>Motivo della segnalazione</Label>
              <RadioGroup value={selectedReason} onValueChange={setSelectedReason}>
                {flagReasons.map((reason) => (
                  <div key={reason.value} className="flex items-center space-x-2">
                    <RadioGroupItem value={reason.value} id={reason.value} />
                    <Label htmlFor={reason.value} className="font-normal cursor-pointer">
                      {reason.label}
                    </Label>
                  </div>
                ))}
              </RadioGroup>
            </div>

            <div className="space-y-2">
              <Label htmlFor="additionalInfo">Dettagli aggiuntivi (opzionale)</Label>
              <Textarea
                id="additionalInfo"
                value={additionalInfo}
                onChange={(e) => setAdditionalInfo(e.target.value)}
                placeholder="Fornisci ulteriori dettagli sulla segnalazione..."
                rows={3}
              />
            </div>

            {error && (
              <p className="text-sm text-destructive">{error}</p>
            )}

            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setOpen(false)} className="flex-1">
                Annulla
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={!selectedReason || isSubmitting}
                className="flex-1"
                variant="destructive"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Invio...
                  </>
                ) : (
                  "Invia Segnalazione"
                )}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
