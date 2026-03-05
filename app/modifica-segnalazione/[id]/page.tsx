"use client"

import { useState, useEffect, useRef, use } from "react"
import { useRouter } from "next/navigation"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Checkbox } from "@/components/ui/checkbox"
import { createClient } from "@/lib/supabase/client"
import { useToast } from "@/hooks/use-toast"
import { Loader2, Save, ArrowLeft, AlertCircle, CheckCircle2, X, Upload, Camera } from "lucide-react"
import type { AnimalType, ReportType, Report } from "@/lib/types"
import Image from "next/image"

interface PageProps {
  params: Promise<{
    id: string
  }>
}

const animalTypeLabels: Record<AnimalType, string> = {
  cane: "Cane",
  gatto: "Gatto",
  volatile: "Volatile",
}

export default function ModificaSegnalazionePage({ params }: PageProps) {
  const { id } = use(params)
  const router = useRouter()
  const { toast } = useToast()
  const supabase = createClient()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const cameraInputRef = useRef<HTMLInputElement>(null)

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [uploadingPhotos, setUploadingPhotos] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  // Form state
  const [reportType, setReportType] = useState<ReportType>("smarrito")
  const [animalType, setAnimalType] = useState<AnimalType>("cane")
  const [animalName, setAnimalName] = useState("")
  const [description, setDescription] = useState("")
  const [address, setAddress] = useState("")
  const [city, setCity] = useState("")
  const [contactName, setContactName] = useState("")
  const [contactPhone, setContactPhone] = useState("")
  const [contactEmail, setContactEmail] = useState("")
  const [showPhone, setShowPhone] = useState(false)
  const [existingPhotos, setExistingPhotos] = useState<string[]>([])
  const [newPhotos, setNewPhotos] = useState<File[]>([])
  const [newPhotoPreviews, setNewPhotoPreviews] = useState<string[]>([])
  const [userId, setUserId] = useState<string | null>(null)

  useEffect(() => {
    async function loadReport() {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser()

        if (!user) {
          router.push("/login")
          return
        }

        setUserId(user.id)

        const { data: report, error: reportError } = await supabase.from("reports").select("*").eq("id", id).single()

        if (reportError) {
          setError("Segnalazione non trovata")
          setLoading(false)
          return
        }

        if (report.user_id !== user.id) {
          setError("Non hai i permessi per modificare questa segnalazione")
          setLoading(false)
          return
        }

        const reportData = report as Report

        setReportType(reportData.report_type)
        setAnimalType(reportData.animal_type)
        setAnimalName(reportData.animal_name || "")
        setDescription(reportData.description)
        setAddress(reportData.address)
        setCity(reportData.city)
        setContactName(reportData.contact_name)
        setContactPhone(reportData.contact_phone || "")
        setContactEmail(reportData.contact_email)
        setShowPhone(reportData.show_phone || false)

        if (reportData.image_url) {
          const photos = reportData.image_url.split(",").filter(Boolean)
          setExistingPhotos(photos)
        }

        setLoading(false)
      } catch {
        setError("Errore nel caricamento della segnalazione")
        setLoading(false)
      }
    }

    loadReport()
  }, [id, router, supabase])

  const handleNewPhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files) return

    const remainingSlots = 5 - (existingPhotos.length + newPhotos.length)
    const selected = Array.from(files).slice(0, remainingSlots)

    selected.forEach((file) => {
      if (!file.type.startsWith("image/")) return

      setNewPhotos((prev) => [...prev, file])
      const reader = new FileReader()
      reader.onloadend = () => setNewPhotoPreviews((prev) => [...prev, reader.result as string])
      reader.readAsDataURL(file)
    })

    e.target.value = ""
  }

  const removeExistingPhoto = (index: number) => {
    setExistingPhotos((prev) => prev.filter((_, i) => i !== index))
  }

  const removeNewPhoto = (index: number) => {
    setNewPhotos((prev) => prev.filter((_, i) => i !== index))
    setNewPhotoPreviews((prev) => prev.filter((_, i) => i !== index))
  }

  const uploadNewPhotos = async (): Promise<string[]> => {
    if (!userId || newPhotos.length === 0) return []

    setUploadingPhotos(true)
    const uploadedUrls: string[] = []

    for (const photo of newPhotos) {
      const fileExt = photo.name.split(".").pop()
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`
      const filePath = `${userId}/${fileName}`

      const { error: uploadError } = await supabase.storage.from("report-images").upload(filePath, photo)

      if (!uploadError) {
        const {
          data: { publicUrl },
        } = supabase.storage.from("report-images").getPublicUrl(filePath)
        uploadedUrls.push(publicUrl)
      }
    }

    setUploadingPhotos(false)
    return uploadedUrls
  }

  const handleSave = async () => {
    setSaving(true)
    setError(null)
    setSuccess(false)

    try {
      const uploaded = await uploadNewPhotos()
      const photoUrls = [...existingPhotos, ...uploaded].slice(0, 5)

      const { error: updateError } = await supabase
        .from("reports")
        .update({
          report_type: reportType,
          animal_type: animalType,
          animal_name: animalName || null,
          description,
          address,
          city,
          contact_name: contactName,
          contact_phone: contactPhone || null,
          contact_email: contactEmail,
          show_phone: showPhone,
          image_url: photoUrls.length > 0 ? photoUrls.join(",") : null,
          updated_at: new Date().toISOString(),
        })
        .eq("id", id)

      if (updateError) {
        setError(updateError.message)
        setSaving(false)
        return
      }

      setSuccess(true)
      toast({ title: "Salvato", description: "Segnalazione aggiornata con successo ✅" })
    } catch {
      setError("Errore durante il salvataggio")
    } finally {
      setSaving(false)
    }
  }

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
        <div className="container mx-auto max-w-3xl px-4">
          <Button variant="ghost" className="mb-6 gap-2" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4" />
            Indietro
          </Button>

          <Card>
            <CardHeader>
              <CardTitle className="text-2xl">Modifica Segnalazione</CardTitle>
              <CardDescription>Aggiorna i dettagli della segnalazione</CardDescription>
            </CardHeader>

            <CardContent className="space-y-8">
              {error && (
                <div className="flex items-center gap-2 rounded-lg border border-destructive/20 bg-destructive/5 p-3 text-sm text-destructive">
                  <AlertCircle className="h-4 w-4" />
                  {error}
                </div>
              )}

              {success && (
                <div className="flex items-center gap-2 rounded-lg border border-primary/20 bg-primary/5 p-3 text-sm text-primary">
                  <CheckCircle2 className="h-4 w-4" />
                  Modifiche salvate!
                </div>
              )}

              <div className="space-y-4">
                <Label className="text-base font-semibold">Tipo di Segnalazione</Label>
                <RadioGroup value={reportType} onValueChange={(v) => setReportType(v as ReportType)} className="grid grid-cols-2 gap-4">
                  <Label htmlFor="smarrito" className="flex cursor-pointer items-center gap-3 rounded-lg border p-4 hover:bg-muted/50">
                    <RadioGroupItem value="smarrito" id="smarrito" />
                    <span className="font-medium">Smarrito</span>
                  </Label>
                  <Label htmlFor="avvistato" className="flex cursor-pointer items-center gap-3 rounded-lg border p-4 hover:bg-muted/50">
                    <RadioGroupItem value="avvistato" id="avvistato" />
                    <span className="font-medium">Avvistato</span>
                  </Label>
                </RadioGroup>
              </div>

              <div className="space-y-2">
                <Label htmlFor="animalType">Tipo di animale *</Label>
                <select
                  id="animalType"
                  className="w-full rounded-md border bg-background px-3 py-2 text-sm"
                  value={animalType}
                  onChange={(e) => setAnimalType(e.target.value as AnimalType)}
                >
                  <option value="cane">{animalTypeLabels.cane}</option>
                  <option value="gatto">{animalTypeLabels.gatto}</option>
                  <option value="volatile">{animalTypeLabels.volatile}</option>
                </select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="animalName">Nome (opzionale)</Label>
                <Input id="animalName" value={animalName} onChange={(e) => setAnimalName(e.target.value)} placeholder="Es: Fido" />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Descrizione *</Label>
                <Textarea id="description" value={description} onChange={(e) => setDescription(e.target.value)} rows={4} required />
              </div>

              <div className="space-y-4">
                <Label className="text-base font-semibold">Foto (max 5)</Label>

                {(existingPhotos.length > 0 || newPhotoPreviews.length > 0) && (
                  <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
                    {existingPhotos.map((url, index) => (
                      <div key={`existing-${index}`} className="group relative aspect-square overflow-hidden rounded-lg border">
                        <Image src={url} alt={`Foto ${index + 1}`} fill className="object-cover" />
                        <button
                          type="button"
                          onClick={() => removeExistingPhoto(index)}
                          className="absolute right-2 top-2 flex h-8 w-8 items-center justify-center rounded-full bg-destructive text-destructive-foreground opacity-0 transition-opacity group-hover:opacity-100"
                          aria-label="Rimuovi foto"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    ))}
                    {newPhotoPreviews.map((preview, index) => (
                      <div key={`new-${index}`} className="group relative aspect-square overflow-hidden rounded-lg border">
                        <Image src={preview} alt={`Nuova foto ${index + 1}`} fill className="object-cover" />
                        <button
                          type="button"
                          onClick={() => removeNewPhoto(index)}
                          className="absolute right-2 top-2 flex h-8 w-8 items-center justify-center rounded-full bg-destructive text-destructive-foreground opacity-0 transition-opacity group-hover:opacity-100"
                          aria-label="Rimuovi foto"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {(existingPhotos.length + newPhotos.length) < 5 && (
                  <div className="flex flex-wrap gap-3">
                    <input ref={fileInputRef} type="file" accept="image/*" multiple onChange={handleNewPhotoSelect} className="hidden" />
                    <input ref={cameraInputRef} type="file" accept="image/*" capture="environment" multiple onChange={handleNewPhotoSelect} className="hidden" />

                    <Button type="button" variant="outline" className="gap-2" onClick={() => fileInputRef.current?.click()}>
                      <Upload className="h-4 w-4" />
                      Carica foto
                    </Button>

                    <Button type="button" variant="outline" className="gap-2" onClick={() => cameraInputRef.current?.click()}>
                      <Camera className="h-4 w-4" />
                      Scatta foto
                    </Button>
                  </div>
                )}
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="address">Indirizzo *</Label>
                  <Input id="address" value={address} onChange={(e) => setAddress(e.target.value)} placeholder="Es: Via Roma 123" required />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="city">Citta *</Label>
                  <Input
                    id="city"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    placeholder="Es: Milano"
                    required
                  />
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="contactName">Nome *</Label>
                  <Input id="contactName" value={contactName} onChange={(e) => setContactName(e.target.value)} required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="contactEmail">Email *</Label>
                  <Input id="contactEmail" type="email" value={contactEmail} onChange={(e) => setContactEmail(e.target.value)} required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="contactPhone">Telefono (opzionale)</Label>
                  <Input id="contactPhone" value={contactPhone} onChange={(e) => setContactPhone(e.target.value)} />
                </div>
                <div className="flex items-end gap-2">
                  <Checkbox id="showPhone" checked={showPhone} onCheckedChange={(v) => setShowPhone(Boolean(v))} />
                  <Label htmlFor="showPhone" className="text-sm">
                    Mostra telefono pubblicamente
                  </Label>
                </div>
              </div>

              <Button className="w-full gap-2" onClick={handleSave} disabled={saving || uploadingPhotos}>
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                Salva Modifiche
              </Button>
            </CardContent>
          </Card>
        </div>
      </main>
      <Footer />
    </div>
  )
}