"use client"

import { useState, useEffect, useRef } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Checkbox } from "@/components/ui/checkbox"
import { useGeolocation } from "@/hooks/use-geolocation"
import { createClient } from "@/lib/supabase/client"
import {
  MapPin,
  Loader2,
  Dog,
  Cat,
  Bird,
  Search,
  Eye,
  CheckCircle2,
  Camera,
  Upload,
  X,
  Image as ImageIcon,
  Sparkles,
  PawPrint,
} from "lucide-react"
import type { AnimalType, ReportType, UserPet } from "@/lib/types"
import Image from "next/image"

const animalTypeLabels: Record<AnimalType, string> = {
  cane: "Cane",
  gatto: "Gatto",
  volatile: "Volatile",
}

export function ReportForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const typeParam = searchParams.get("type") as ReportType | null
  const initialType: ReportType = typeParam === "avvistato" ? "avvistato" : "smarrito"

  const { latitude, longitude, getCurrentPosition } = useGeolocation()

  const [reportType, setReportType] = useState<ReportType>(initialType)
  const [animalType, setAnimalType] = useState<AnimalType>("cane")
  const [animalName, setAnimalName] = useState("")
  const [description, setDescription] = useState("")
  const [address, setAddress] = useState("")
  const [city, setCity] = useState("")
  const [contactName, setContactName] = useState("")
  const [contactPhone, setContactPhone] = useState("")
  const [contactEmail, setContactEmail] = useState("")
  const [showPhone, setShowPhone] = useState(false)
  const [isAnonymous, setIsAnonymous] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [userId, setUserId] = useState<string | null>(null)

  // User pets (prefill for "smarrito")
  const [userPets, setUserPets] = useState<UserPet[]>([])
  const [petsLoaded, setPetsLoaded] = useState(false)
  const [petChoiceMade, setPetChoiceMade] = useState(true)

  // Existing photos from selected pet (public URLs)
  const [existingPhotoUrls, setExistingPhotoUrls] = useState<string[]>([])

  const [isGeocodingLoading, setIsGeocodingLoading] = useState(false)
  const [detectedAddress, setDetectedAddress] = useState<string | null>(null)

  // Photo states (new uploads for the report)
  const [photos, setPhotos] = useState<File[]>([])
  const [photoPreviews, setPhotoPreviews] = useState<string[]>([])
  const [isUploadingPhotos, setIsUploadingPhotos] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const cameraInputRef = useRef<HTMLInputElement>(null)

  const [userIp, setUserIp] = useState<string | null>(null)

  // AI Matching
  const [aiMatching, setAiMatching] = useState(false)
  const [aiMatchResults, setAiMatchResults] = useState<
    Array<{
      lostReportId: string
      confidenceScore: number
      analysis: string
      animalName?: string
      city?: string
    }>
  >([])

  // Fetch user IP
  useEffect(() => {
    const fetchIp = async () => {
      try {
        const res = await fetch("/api/get-ip")
        const data = await res.json()
        setUserIp(data.ip || null)
      } catch {
        setUserIp(null)
      }
    }
    fetchIp()
  }, [])

  // Fetch user + profile + pets
  useEffect(() => {
    const getUserAndProfile = async () => {
      const supabase = createClient()
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (user) {
        setUserId(user.id)
        setContactEmail(user.email || "")

        const { data: profile } = await supabase
          .from("profiles")
          .select("first_name, last_name, phone")
          .eq("id", user.id)
          .maybeSingle()

        if (profile) {
          const fullName = [profile.first_name, profile.last_name]
            .filter(Boolean)
            .join(" ")

          if (fullName) setContactName(fullName)

          // 🔵 Precompila telefono se presente nel profilo
          if (profile.phone) {
            setContactPhone(profile.phone)
          }
        }

        const { data: petsData } = await supabase
          .from("user_pets")
          .select("*, user_pet_photos(id, url, created_at)")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false })

        setUserPets((petsData || []) as unknown as UserPet[])
        setPetsLoaded(true)
      } else {
        setUserPets([])
        setPetsLoaded(true)
      }
    }
    getUserAndProfile()
  }, [])

  // Get current position on mount
  useEffect(() => {
    getCurrentPosition()
  }, [getCurrentPosition])

  // Reverse geocode via server route (better address precision + proper formatting)
  const reverseGeocode = async (lat: number, lng: number) => {
    setIsGeocodingLoading(true)
    try {
      const res = await fetch("/api/reverse-geocode", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ lat, lon: lng }),
      })

      const data = await res.json()

      const street = (data?.street || "").trim() // es: "Via Roma, 10"
      const cityName = (data?.city || "").trim() // es: "Milano"
      const region = (data?.region || "").trim() // es: "Lombardia"

      const cityWithRegion = [cityName, region].filter(Boolean).join(", ")

      if (street) setAddress(street)
      if (cityWithRegion) setCity(cityWithRegion)

      const full = (data?.full || data?.display_name || "").trim()
      if (full) setDetectedAddress(full)
    } catch (err) {
      console.error("Errore reverse geocoding:", err)
    } finally {
      setIsGeocodingLoading(false)
    }
  }

  useEffect(() => {
    if (latitude && longitude) reverseGeocode(latitude, longitude)
  }, [latitude, longitude])

  // Pet prefill flow for "smarrito"
  useEffect(() => {
    if (reportType !== "smarrito") {
      setPetChoiceMade(true)
      setExistingPhotoUrls([])
      return
    }

    if (!userId) {
      setPetChoiceMade(true)
      setExistingPhotoUrls([])
      return
    }

    if (!petsLoaded) return

    setPetChoiceMade(!(userPets.length > 0))
  }, [reportType, userId, petsLoaded, userPets.length])

  const pickPet = (pet: UserPet) => {
    setAnimalType(pet.animal_type)
    setAnimalName(pet.name || "")

    const joinedUrls = (pet.user_pet_photos || [])
      .map((p: any) => p.url)
      .filter(Boolean)

    // Fallback compat: photo_url singola se non ci sono join
    const urls = (joinedUrls.length > 0 ? joinedUrls : pet.photo_url ? [pet.photo_url] : []).slice(0, 5)

    setExistingPhotoUrls(urls)
    setPetChoiceMade(true)
  }

  // Handle report photo selection
  const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files) return

    const remainingSlots = 5 - (photos.length + existingPhotoUrls.length)
    const newPhotos = Array.from(files).slice(0, remainingSlots)

    newPhotos.forEach((file) => {
      if (file.type.startsWith("image/")) {
        setPhotos((prev) => [...prev, file])

        const reader = new FileReader()
        reader.onloadend = () => setPhotoPreviews((prev) => [...prev, reader.result as string])
        reader.readAsDataURL(file)
      }
    })

    e.target.value = ""
  }

  const removePhoto = (index: number) => {
    setPhotos((prev) => prev.filter((_, i) => i !== index))
    setPhotoPreviews((prev) => prev.filter((_, i) => i !== index))
  }

  const removeExistingPhoto = (index: number) => {
    setExistingPhotoUrls((prev) => prev.filter((_, i) => i !== index))
  }

  // Upload report photos to Supabase Storage
  const uploadPhotos = async (): Promise<string[]> => {
    if (photos.length === 0) return []

    const supabase = createClient()
    const uploadedUrls: string[] = []

    for (const photo of photos) {
      const fileExt = photo.name.split(".").pop()
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`
      const filePath = `${userId || "anonymous"}/${fileName}`

      const { error } = await supabase.storage.from("report-images").upload(filePath, photo)
      if (!error) {
        const {
          data: { publicUrl },
        } = supabase.storage.from("report-images").getPublicUrl(filePath)
        uploadedUrls.push(publicUrl)
      }
    }

    return uploadedUrls
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setError(null)

    const supabase = createClient()

    setIsUploadingPhotos(true)
    const uploadedPhotoUrls = await uploadPhotos()
    const photoUrls = [...existingPhotoUrls, ...uploadedPhotoUrls].slice(0, 5)
    setIsUploadingPhotos(false)

    const reportData = {
      user_id: userId,
      report_type: reportType,
      animal_type: animalType,
      animal_name: animalName || null,
      description,
      latitude: latitude || 41.9028, // fallback Italia (Roma)
      longitude: longitude || 12.4964,
      address,
      city,
      contact_name: contactName,
      contact_phone: contactPhone || null,
      contact_email: contactEmail,
      image_url: photoUrls.length > 0 ? photoUrls.join(",") : null,
      ip_address: userIp || null,
      show_phone: showPhone,
      is_anonymous: isAnonymous,
      status: "active",
    }

    const { data: insertedReport, error: insertError } = await supabase
      .from("reports")
      .insert([reportData])
      .select()
      .single()

    if (insertError) {
      setError(insertError.message)
      setIsSubmitting(false)
      return
    }

    // If it's a sighting report with photos, trigger AI matching
    if (reportType === "avvistato" && photoUrls.length > 0 && insertedReport) {
      setAiMatching(true)
      try {
        const response = await fetch("/api/ai-match", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ sightingReportId: insertedReport.id }),
        })

        const data = await response.json()
        if (data?.matches) setAiMatchResults(data.matches)
      } catch {
        // ignore
      } finally {
        setAiMatching(false)
      }
    }

    setSubmitted(true)
    setIsSubmitting(false)
  }

  if (submitted) {
    return (
      <Card className="mx-auto max-w-2xl">
        <CardContent className="flex flex-col items-center py-16 text-center">
          <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-accent/20">
            <CheckCircle2 className="h-10 w-10 text-accent" />
          </div>
          <h2 className="mb-2 text-2xl font-bold text-foreground">Segnalazione Inviata!</h2>
          <p className="mb-6 text-muted-foreground">
            La tua segnalazione è stata pubblicata con successo. Grazie per il tuo aiuto nel riunire gli animali con le loro famiglie.
          </p>

          {/* AI Match Results */}
          {aiMatching && (
            <div className="mb-6 w-full rounded-lg border border-primary/20 bg-primary/5 p-4">
              <div className="flex items-center justify-center gap-2 text-primary">
                <Loader2 className="h-5 w-5 animate-spin" />
                <span className="font-medium">Analisi AI in corso...</span>
              </div>
              <p className="mt-2 text-sm text-muted-foreground">Stiamo confrontando le foto con gli animali smarriti</p>
            </div>
          )}

          {aiMatchResults.length > 0 && (
            <div className="mb-6 w-full rounded-lg border border-primary/20 bg-primary/5 p-4 text-left">
              <div className="mb-3 flex items-center gap-2 text-primary">
                <Sparkles className="h-5 w-5" />
                <span className="font-medium">Possibili corrispondenze trovate</span>
              </div>
              <div className="space-y-3">
                {aiMatchResults.map((match) => (
                  <div key={match.lostReportId} className="rounded-md bg-background p-3">
                    <div className="flex items-center justify-between">
                      <div className="font-medium">
                        {match.animalName ? match.animalName : "Animale"} {match.city ? `(${match.city})` : ""}
                      </div>
                      <div className="text-sm text-muted-foreground">{Math.round(match.confidenceScore * 100)}%</div>
                    </div>
                    <div className="mt-1 text-sm text-muted-foreground">{match.analysis}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="flex gap-3">
            <Button onClick={() => router.push("/segnalazioni")} className="gap-2">
              <Eye className="h-4 w-4" />
              Vai alle segnalazioni
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                setSubmitted(false)
                setIsSubmitting(false)
                setError(null)
                setPhotos([])
                setPhotoPreviews([])
                setExistingPhotoUrls([])
                setReportType(initialType)
                setDescription("")
                setAddress("")
                setAnimalName("")
                setAiMatchResults([])
              }}
            >
              Nuova segnalazione
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="mx-auto max-w-2xl">
      <CardHeader>
        <CardTitle className="text-2xl">Nuova Segnalazione</CardTitle>
        <CardDescription>Compila il form per segnalare un animale smarrito o avvistato (Italia)</CardDescription>
      </CardHeader>

      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Report Type */}
          <div className="space-y-4">
            <Label className="text-base font-semibold">Tipo di Segnalazione</Label>
            <RadioGroup
              value={reportType}
              onValueChange={(value) => setReportType(value as ReportType)}
              className="grid grid-cols-2 gap-4"
            >
              <Label
                htmlFor="smarrito"
                className={`flex cursor-pointer items-center justify-between rounded-lg border p-4 transition-colors ${reportType === "smarrito" ? "border-primary bg-primary/5" : "hover:bg-muted/50"
                  }`}
              >
                <div className="flex items-center gap-3">
                  <RadioGroupItem value="smarrito" id="smarrito" />
                  <div>
                    <div className="font-semibold">Smarrito</div>
                    <div className="text-sm text-muted-foreground">Il mio animale è scappato</div>
                  </div>
                </div>
                <Search className="h-5 w-5 text-primary" />
              </Label>

              <Label
                htmlFor="avvistato"
                className={`flex cursor-pointer items-center justify-between rounded-lg border p-4 transition-colors ${reportType === "avvistato" ? "border-accent bg-accent/5" : "hover:bg-muted/50"
                  }`}
              >
                <div className="flex items-center gap-3">
                  <RadioGroupItem value="avvistato" id="avvistato" />
                  <div>
                    <div className="font-semibold">Avvistato</div>
                    <div className="text-sm text-muted-foreground">Ho visto un animale</div>
                  </div>
                </div>
                <Eye className="h-5 w-5 text-accent" />
              </Label>
            </RadioGroup>
          </div>

          {/* Pet quick select (only for "smarrito") */}
          {reportType === "smarrito" && userId && petsLoaded && userPets.length > 0 && !petChoiceMade && (
            <div className="rounded-lg border bg-muted/30 p-4">
              <div className="mb-2 font-semibold">Hai smarrito uno di questi animali?</div>
              <div className="flex flex-wrap gap-2">
                {userPets.map((pet) => (
                  <Button key={pet.id} type="button" variant="outline" className="gap-2" onClick={() => pickPet(pet)}>
                    <PawPrint className="h-4 w-4" />
                    {pet.name}
                  </Button>
                ))}
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => {
                    setAnimalName("")
                    setExistingPhotoUrls([])
                    setPetChoiceMade(true)
                  }}
                >
                  Ho smarrito un altro animale
                </Button>
              </div>
              <p className="mt-2 text-sm text-muted-foreground">
                Se scegli un animale, precompiliamo nome, tipologia e le foto già registrate nel profilo.
              </p>
            </div>
          )}

          {/* Animal Type */}
          <div className="space-y-4">
            <Label className="text-base font-semibold">Tipo di Animale</Label>
            <RadioGroup
              value={animalType}
              onValueChange={(value) => setAnimalType(value as AnimalType)}
              className="grid grid-cols-3 gap-4"
            >
              {(["cane", "gatto", "volatile"] as AnimalType[]).map((type) => (
                <Label
                  key={type}
                  htmlFor={type}
                  className={`flex cursor-pointer flex-col items-center gap-2 rounded-lg border p-4 transition-colors ${animalType === type ? "border-primary bg-primary/5" : "hover:bg-muted/50"
                    }`}
                >
                  <RadioGroupItem value={type} id={type} className="sr-only" />
                  {type === "cane" && <Dog className="h-8 w-8 text-primary" />}
                  {type === "gatto" && <Cat className="h-8 w-8 text-primary" />}
                  {type === "volatile" && <Bird className="h-8 w-8 text-primary" />}
                  <span className="font-medium">{animalTypeLabels[type]}</span>
                </Label>
              ))}
            </RadioGroup>
          </div>

          {/* Animal Name */}
          <div className="space-y-2">
            <Label htmlFor="animalName">
              Nome dell&apos;animale <span className="text-muted-foreground">(opzionale)</span>
            </Label>
            <Input
              id="animalName"
              value={animalName}
              onChange={(e) => setAnimalName(e.target.value)}
              placeholder="Es: Fido, Minù, ecc."
            />
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Descrizione</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Descrivi l'animale: colore, taglia, segni particolari, collare, comportamento..."
              rows={4}
              required
            />
          </div>

          {/* Photo Upload */}
          <div className="space-y-4">
            <Label className="text-base font-semibold">
              Foto dell&apos;animale {reportType === "smarrito" ? "(consigliato)" : "(se possibile)"}
            </Label>

            {(existingPhotoUrls.length > 0 || photoPreviews.length > 0) && (
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
                {existingPhotoUrls.map((url, index) => (
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

                {photoPreviews.map((preview, index) => (
                  <div key={`new-${index}`} className="group relative aspect-square overflow-hidden rounded-lg border">
                    <Image src={preview} alt={`Foto ${existingPhotoUrls.length + index + 1}`} fill className="object-cover" />
                    <button
                      type="button"
                      onClick={() => removePhoto(index)}
                      className="absolute right-2 top-2 flex h-8 w-8 items-center justify-center rounded-full bg-destructive text-destructive-foreground opacity-0 transition-opacity group-hover:opacity-100"
                      aria-label="Rimuovi foto"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {(photos.length + existingPhotoUrls.length) < 5 && (
              <div className="flex flex-wrap gap-3">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handlePhotoSelect}
                  className="hidden"
                />
                <input
                  ref={cameraInputRef}
                  type="file"
                  accept="image/*"
                  capture="environment"
                  onChange={handlePhotoSelect}
                  className="hidden"
                />

                <Button type="button" variant="outline" onClick={() => fileInputRef.current?.click()} className="gap-2">
                  <Upload className="h-4 w-4" />
                  Carica foto
                </Button>

                <Button type="button" variant="outline" onClick={() => cameraInputRef.current?.click()} className="gap-2">
                  <Camera className="h-4 w-4" />
                  Scatta foto
                </Button>
              </div>
            )}

            {(photos.length + existingPhotoUrls.length) >= 5 && (
              <div className="flex items-center gap-2 rounded-lg border border-muted bg-muted/30 p-3 text-sm text-muted-foreground">
                <ImageIcon className="h-4 w-4" />
                Hai raggiunto il limite massimo di 5 foto
              </div>
            )}

            {isUploadingPhotos && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                Caricamento foto in corso...
              </div>
            )}
          </div>

          {/* Location */}
          <div className="space-y-4">
            <Label className="text-base font-semibold">Posizione</Label>

            <div className="rounded-lg border bg-muted/30 p-4">
              <div className="mb-2 flex items-center gap-2 text-sm font-medium">
                <MapPin className="h-4 w-4" />
                Posizione rilevata
              </div>

              {isGeocodingLoading ? (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Rilevamento indirizzo...
                </div>
              ) : (
                <div className="text-sm text-muted-foreground">
                  {detectedAddress || "Indirizzo non disponibile"}
                </div>
              )}
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="address">Indirizzo</Label>
                <Input
                  id="address"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="Es: Via Roma, 10"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="city">Città, Regione</Label>
                <Input
                  id="city"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  placeholder="Es: Milano, Lombardia"
                  required
                />
              </div>
            </div>
          </div>

          {/* Contact */}
          <div className="space-y-4">
            <Label className="text-base font-semibold">Contatti</Label>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="contactName">Nome</Label>
                <Input
                  id="contactName"
                  value={contactName}
                  onChange={(e) => setContactName(e.target.value)}
                  placeholder="Il tuo nome"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="contactEmail">Email</Label>
                <Input
                  id="contactEmail"
                  type="email"
                  value={contactEmail}
                  onChange={(e) => setContactEmail(e.target.value)}
                  placeholder="nome@email.it"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="contactPhone">
                  Telefono <span className="text-muted-foreground">(opzionale)</span>
                </Label>
                <Input
                  id="contactPhone"
                  value={contactPhone}
                  onChange={(e) => setContactPhone(e.target.value)}
                  placeholder="Es: 333 123 4567"
                />
              </div>

              <div className="flex items-end space-x-2">
                <Checkbox id="showPhone" checked={showPhone} onCheckedChange={(v) => setShowPhone(Boolean(v))} />
                <Label htmlFor="showPhone" className="text-sm leading-none">
                  Mostra telefono pubblicamente
                </Label>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox id="anonymous" checked={isAnonymous} onCheckedChange={(v) => setIsAnonymous(Boolean(v))} />
              <Label htmlFor="anonymous" className="text-sm leading-none">
                Pubblica in anonimo
              </Label>
            </div>
          </div>

          {error && (
            <div className="rounded-lg border border-destructive/20 bg-destructive/5 p-4 text-sm text-destructive">
              {error}
            </div>
          )}

          <Button type="submit" className="w-full" disabled={isSubmitting}>
            {isSubmitting ? (
              <span className="flex items-center justify-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                Invio in corso...
              </span>
            ) : (
              "Pubblica segnalazione"
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}