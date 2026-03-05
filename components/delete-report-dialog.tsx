"use client"

import { useState } from "react"
import { createClient } from "@/lib/supabase/client"
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
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Trash2, Loader2, AlertTriangle } from "lucide-react"

interface DeleteReportDialogProps {
  reportId: string
  reportUserId?: string
  onDeleted?: () => void
}

export function DeleteReportDialog({ reportId, reportUserId, onDeleted }: DeleteReportDialogProps) {
  const [open, setOpen] = useState(false)
  const [reason, setReason] = useState("")
  const [banUser, setBanUser] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleDelete = async () => {
    if (!reason.trim()) {
      setError("Devi inserire una motivazione per l'eliminazione")
      return
    }

    setIsDeleting(true)
    setError(null)

    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      setError("Devi essere autenticato")
      setIsDeleting(false)
      return
    }

    // Delete the report (soft delete - update status)
    const { error: deleteError } = await supabase
      .from("reports")
      .update({
        status: "resolved",
        deletion_reason: reason,
        deleted_at: new Date().toISOString(),
        deleted_by: user.id,
      })
      .eq("id", reportId)

    if (deleteError) {
      setError(deleteError.message)
      setIsDeleting(false)
      return
    }

    // Ban user if checkbox is selected and report has a user
    if (banUser && reportUserId) {
      const { error: banError } = await supabase
        .from("profiles")
        .update({
          is_banned: true,
          ban_reason: reason,
          banned_at: new Date().toISOString(),
        })
        .eq("id", reportUserId)

      if (banError) {
        console.error("Error banning user:", banError)
      }
    }

    setIsDeleting(false)
    setOpen(false)
    setReason("")
    setBanUser(false)
    
    if (onDeleted) {
      onDeleted()
    }
  }

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-destructive hover:bg-destructive/10 hover:text-destructive"
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent className="max-w-md">
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-destructive" />
            Elimina Segnalazione
          </AlertDialogTitle>
          <AlertDialogDescription>
            Questa azione eliminera la segnalazione. Inserisci una motivazione per procedere.
          </AlertDialogDescription>
        </AlertDialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="reason">Motivazione *</Label>
            <Textarea
              id="reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Inserisci la motivazione dell'eliminazione..."
              rows={3}
            />
          </div>

          {reportUserId && (
            <div className="flex items-start space-x-3 rounded-lg border border-destructive/30 bg-destructive/5 p-3">
              <Checkbox
                id="banUser"
                checked={banUser}
                onCheckedChange={(checked) => setBanUser(checked === true)}
              />
              <div className="space-y-1">
                <label
                  htmlFor="banUser"
                  className="text-sm font-medium leading-none text-destructive"
                >
                  Banna Utente
                </label>
                <p className="text-xs text-muted-foreground">
                  L'utente non potra piu accedere alla piattaforma
                </p>
              </div>
            </div>
          )}

          {error && (
            <p className="text-sm text-destructive">{error}</p>
          )}
        </div>

        <AlertDialogFooter>
          <AlertDialogCancel disabled={isDeleting}>Annulla</AlertDialogCancel>
          <Button
            variant="destructive"
            onClick={handleDelete}
            disabled={isDeleting || !reason.trim()}
          >
            {isDeleting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Eliminazione...
              </>
            ) : (
              <>
                <Trash2 className="mr-2 h-4 w-4" />
                {banUser ? "Elimina e Banna" : "Elimina"}
              </>
            )}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
