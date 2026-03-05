"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
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
import {
  Loader2,
  Building2,
  Plus,
  Pencil,
  Trash2,
  ArrowLeft,
  Dog,
  Cat,
  Bird,
  Tag,
  Percent,
  Phone,
  Globe,
  Upload,
  ImageIcon,
  X,
} from "lucide-react"
import type { Partner, PartnerOffer, AnimalType } from "@/lib/types"
import { animalTypeLabels } from "@/lib/types"
import Link from "next/link"
import Image from "next/image"

function AnimalIcon({ type, className = "h-4 w-4" }: { type: AnimalType; className?: string }) {
  switch (type) {
    case "cane": return <Dog className={className} />
    case "gatto": return <Cat className={className} />
    case "volatile": return <Bird className={className} />
  }
}

export default function PartnersAdminPage() {
  const router = useRouter()
  const [isAdmin, setIsAdmin] = useState(false)
  const [loading, setLoading] = useState(true)
  const [partners, setPartners] = useState<Partner[]>([])
  const [offers, setOffers] = useState<PartnerOffer[]>([])
  const [loadingOffers, setLoadingOffers] = useState(false)
  const [selectedPartner, setSelectedPartner] = useState<Partner | null>(null)

  // Partner form
  const [partnerDialogOpen, setPartnerDialogOpen] = useState(false)
  const [editingPartner, setEditingPartner] = useState<Partner | null>(null)
  const [partnerForm, setPartnerForm] = useState({
    company_name: "",
    description: "",
    website: "",
    contact_email: "",
    contact_phone: "",
    address: "",
    city: "",
    logo_url: "",
  })
  const [savingPartner, setSavingPartner] = useState(false)
  const [deletingPartnerId, setDeletingPartnerId] = useState<string | null>(null)
  const [uploadingLogo, setUploadingLogo] = useState(false)

  // Offer form
  const [offerDialogOpen, setOfferDialogOpen] = useState(false)
  const [editingOffer, setEditingOffer] = useState<PartnerOffer | null>(null)
  const [offerForm, setOfferForm] = useState({
    title: "",
    description: "",
    original_price: "",
    discounted_price: "",
    discount_percentage: "",
    target_animals: [] as AnimalType[],
    offer_type: "" as "prodotto" | "servizio" | "",
    valid_until: "",
    banner_url: "",
  })
  const [savingOffer, setSavingOffer] = useState(false)
  const [deletingOfferId, setDeletingOfferId] = useState<string | null>(null)
  const [uploadingBanner, setUploadingBanner] = useState(false)

  useEffect(() => {
    async function checkAdmin() {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) {
        router.push("/login")
        return
      }

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
      fetchPartners()
      setLoading(false)
    }

    checkAdmin()
  }, [router])

  const fetchPartners = async () => {
    const supabase = createClient()
    const { data } = await supabase
      .from("partners")
      .select("*")
      .order("company_name")

    if (data) setPartners(data as Partner[])
  }

  const fetchOffers = async (partnerId: string) => {
    setLoadingOffers(true)
    const supabase = createClient()
    const { data } = await supabase
      .from("partner_offers")
      .select("*")
      .eq("partner_id", partnerId)
      .order("created_at", { ascending: false })

    if (data) setOffers(data as PartnerOffer[])
    setLoadingOffers(false)
  }

  const handleSelectPartner = (partner: Partner) => {
    setSelectedPartner(partner)
    fetchOffers(partner.id)
  }

  const resetPartnerForm = () => {
    setPartnerForm({
      company_name: "",
      description: "",
      website: "",
      contact_email: "",
      contact_phone: "",
      address: "",
      city: "",
      logo_url: "",
    })
    setEditingPartner(null)
  }

  const openEditPartner = (partner: Partner) => {
    setEditingPartner(partner)
    setPartnerForm({
      company_name: partner.company_name,
      description: partner.description || "",
      website: partner.website || "",
      contact_email: partner.contact_email,
      contact_phone: partner.contact_phone,
      address: partner.address || "",
      city: partner.city || "",
      logo_url: partner.logo_url || "",
    })
    setPartnerDialogOpen(true)
  }

  const handleUploadLogo = async (file: File) => {
    if (!file) return
    setUploadingLogo(true)
    const supabase = createClient()
    const ext = file.name.split(".").pop()
    const filePath = `logos/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`

    const { error } = await supabase.storage
      .from("partner-banners")
      .upload(filePath, file, { contentType: file.type })

    if (!error) {
      const { data: urlData } = supabase.storage
        .from("partner-banners")
        .getPublicUrl(filePath)
      setPartnerForm((p) => ({ ...p, logo_url: urlData.publicUrl }))
    }
    setUploadingLogo(false)
  }

  const handleSavePartner = async () => {
    if (!partnerForm.company_name || !partnerForm.contact_email || !partnerForm.contact_phone) return
    setSavingPartner(true)

    const supabase = createClient()
    const partnerData = {
      company_name: partnerForm.company_name,
      description: partnerForm.description || null,
      website: partnerForm.website || null,
      contact_email: partnerForm.contact_email,
      contact_phone: partnerForm.contact_phone,
      address: partnerForm.address || null,
      city: partnerForm.city || null,
      logo_url: partnerForm.logo_url || null,
      updated_at: new Date().toISOString(),
    }

    if (editingPartner) {
      const { data } = await supabase
        .from("partners")
        .update(partnerData)
        .eq("id", editingPartner.id)
        .select()
        .single()

      if (data) {
        setPartners((prev) => prev.map((p) => (p.id === editingPartner.id ? data as Partner : p)))
        if (selectedPartner?.id === editingPartner.id) {
          setSelectedPartner(data as Partner)
        }
      }
    } else {
      const { data } = await supabase
        .from("partners")
        .insert({ ...partnerData, is_active: true })
        .select()
        .single()

      if (data) setPartners((prev) => [...prev, data as Partner])
    }

    setSavingPartner(false)
    setPartnerDialogOpen(false)
    resetPartnerForm()
  }

  const handleDeletePartner = async (partnerId: string) => {
    setDeletingPartnerId(partnerId)
    const supabase = createClient()

    await supabase.from("partners").delete().eq("id", partnerId)
    setPartners((prev) => prev.filter((p) => p.id !== partnerId))
    if (selectedPartner?.id === partnerId) {
      setSelectedPartner(null)
      setOffers([])
    }
    setDeletingPartnerId(null)
  }

  const resetOfferForm = () => {
    setOfferForm({
      title: "",
      description: "",
      original_price: "",
      discounted_price: "",
      discount_percentage: "",
      target_animals: [],
      offer_type: "",
      valid_until: "",
      banner_url: "",
    })
    setEditingOffer(null)
  }

  const openEditOffer = (offer: PartnerOffer) => {
    setEditingOffer(offer)
    setOfferForm({
      title: offer.title,
      description: offer.description,
      original_price: offer.original_price?.toString() || "",
      discounted_price: offer.discounted_price.toString(),
      discount_percentage: offer.discount_percentage?.toString() || "",
      target_animals: offer.target_animals,
      offer_type: offer.offer_type,
      valid_until: offer.valid_until || "",
      banner_url: (offer as PartnerOffer & { banner_url?: string }).banner_url || "",
    })
    setOfferDialogOpen(true)
  }

  const handleBannerUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setUploadingBanner(true)
    const supabase = createClient()

    const fileExt = file.name.split(".").pop()
    const fileName = `banner-${Date.now()}.${fileExt}`
    const filePath = `banners/${fileName}`

    const { error } = await supabase.storage
      .from("partner-banners")
      .upload(filePath, file)

    if (!error) {
      const { data: urlData } = supabase.storage
        .from("partner-banners")
        .getPublicUrl(filePath)

      setOfferForm((prev) => ({ ...prev, banner_url: urlData.publicUrl }))
    }
    setUploadingBanner(false)
  }

  const removeBanner = () => {
    setOfferForm((prev) => ({ ...prev, banner_url: "" }))
  }

  const handleAnimalToggle = (animal: AnimalType) => {
    setOfferForm((prev) => ({
      ...prev,
      target_animals: prev.target_animals.includes(animal)
        ? prev.target_animals.filter((a) => a !== animal)
        : [...prev.target_animals, animal],
    }))
  }

  const handleSaveOffer = async () => {
    if (!selectedPartner || !offerForm.title || !offerForm.discounted_price || !offerForm.offer_type || offerForm.target_animals.length === 0) return
    setSavingOffer(true)

    const supabase = createClient()
    const offerData = {
      partner_id: selectedPartner.id,
      title: offerForm.title,
      description: offerForm.description,
      original_price: offerForm.original_price ? parseFloat(offerForm.original_price) : null,
      discounted_price: parseFloat(offerForm.discounted_price),
      discount_percentage: offerForm.discount_percentage ? parseInt(offerForm.discount_percentage) : null,
      target_animals: offerForm.target_animals,
      offer_type: offerForm.offer_type,
      valid_until: offerForm.valid_until || null,
      banner_url: offerForm.banner_url || null,
      is_active: true,
    }

    if (editingOffer) {
      const { data } = await supabase
        .from("partner_offers")
        .update(offerData)
        .eq("id", editingOffer.id)
        .select()
        .single()

      if (data) setOffers((prev) => prev.map((o) => (o.id === editingOffer.id ? data as PartnerOffer : o)))
    } else {
      const { data } = await supabase
        .from("partner_offers")
        .insert(offerData)
        .select()
        .single()

      if (data) setOffers((prev) => [data as PartnerOffer, ...prev])
    }

    setSavingOffer(false)
    setOfferDialogOpen(false)
    resetOfferForm()
  }

  const handleDeleteOffer = async (offerId: string) => {
    setDeletingOfferId(offerId)
    const supabase = createClient()

    await supabase.from("partner_offers").delete().eq("id", offerId)
    setOffers((prev) => prev.filter((o) => o.id !== offerId))
    setDeletingOfferId(null)
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

  if (!isAdmin) return null

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1 py-8">
        <div className="container px-4">
          <div className="mb-6 flex items-center gap-4">
            <Button variant="ghost" size="icon" asChild>
              <Link href="/admin">
                <ArrowLeft className="h-5 w-5" />
              </Link>
            </Button>
            <div>
              <h1 className="text-3xl font-bold">Gestione Partner</h1>
              <p className="text-muted-foreground">Aggiungi e gestisci i partner e le loro offerte</p>
            </div>
          </div>

          <div className="grid gap-6 lg:grid-cols-3">
            {/* Partners List */}
            <Card className="lg:col-span-1">
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Partner</CardTitle>
                  <CardDescription>{partners.length} aziende</CardDescription>
                </div>
                <Dialog open={partnerDialogOpen} onOpenChange={(open) => {
                  setPartnerDialogOpen(open)
                  if (!open) resetPartnerForm()
                }}>
                  <DialogTrigger asChild>
                    <Button size="sm" className="gap-1">
                      <Plus className="h-4 w-4" />
                      Nuovo
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>{editingPartner ? "Modifica Partner" : "Nuovo Partner"}</DialogTitle>
                      <DialogDescription>Inserisci i dati dell&apos;azienda partner</DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                      {/* Logo upload */}
                      <div className="space-y-2">
                        <Label>Logo Azienda</Label>
                        <div className="flex items-center gap-4">
                          {partnerForm.logo_url ? (
                            <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-lg border bg-muted">
                              <Image
                                src={partnerForm.logo_url}
                                alt="Logo partner"
                                fill
                                className="object-contain p-1"
                              />
                              <button
                                type="button"
                                onClick={() => setPartnerForm((p) => ({ ...p, logo_url: "" }))}
                                className="absolute right-0.5 top-0.5 rounded-full bg-destructive p-0.5 text-white"
                              >
                                <X className="h-3 w-3" />
                              </button>
                            </div>
                          ) : (
                            <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-lg border bg-muted text-muted-foreground">
                              <ImageIcon className="h-7 w-7" />
                            </div>
                          )}
                          <div className="flex-1">
                            <Label
                              htmlFor="logo-upload"
                              className="flex cursor-pointer items-center gap-2 rounded-md border border-dashed px-4 py-2 text-sm text-muted-foreground hover:bg-muted"
                            >
                              {uploadingLogo ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <Upload className="h-4 w-4" />
                              )}
                              {uploadingLogo ? "Caricamento..." : "Carica Logo"}
                              <input
                                id="logo-upload"
                                type="file"
                                accept="image/jpeg,image/png,image/webp,image/gif,image/svg+xml"
                                className="sr-only"
                                disabled={uploadingLogo}
                                onChange={(e) => {
                                  const file = e.target.files?.[0]
                                  if (file) handleUploadLogo(file)
                                  e.target.value = ""
                                }}
                              />
                            </Label>
                            <p className="mt-1 text-xs text-muted-foreground">PNG, JPG, SVG — max 2MB</p>
                          </div>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label>Nome Azienda *</Label>
                        <Input
                          value={partnerForm.company_name}
                          onChange={(e) => setPartnerForm((p) => ({ ...p, company_name: e.target.value }))}
                        />
                      </div>
                      <div className="grid gap-4 sm:grid-cols-2">
                        <div className="space-y-2">
                          <Label>Email *</Label>
                          <Input
                            type="email"
                            value={partnerForm.contact_email}
                            onChange={(e) => setPartnerForm((p) => ({ ...p, contact_email: e.target.value }))}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Telefono *</Label>
                          <Input
                            type="tel"
                            value={partnerForm.contact_phone}
                            onChange={(e) => setPartnerForm((p) => ({ ...p, contact_phone: e.target.value }))}
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label>Sito Web</Label>
                        <Input
                          type="url"
                          value={partnerForm.website}
                          onChange={(e) => setPartnerForm((p) => ({ ...p, website: e.target.value }))}
                        />
                      </div>
                      <div className="grid gap-4 sm:grid-cols-2">
                        <div className="space-y-2">
                          <Label>Indirizzo</Label>
                          <Input
                            value={partnerForm.address}
                            onChange={(e) => setPartnerForm((p) => ({ ...p, address: e.target.value }))}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Citta</Label>
                          <Input
                            value={partnerForm.city}
                            onChange={(e) => setPartnerForm((p) => ({ ...p, city: e.target.value }))}
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label>Descrizione</Label>
                        <Textarea
                          value={partnerForm.description}
                          onChange={(e) => setPartnerForm((p) => ({ ...p, description: e.target.value }))}
                          rows={3}
                        />
                      </div>
                    </div>
                    <DialogFooter>
                      <Button onClick={handleSavePartner} disabled={savingPartner}>
                        {savingPartner && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Salva
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {partners.map((partner) => (
                    <div
                      key={partner.id}
                      className={`flex cursor-pointer items-center justify-between rounded-lg border p-3 transition-colors hover:bg-muted ${
                        selectedPartner?.id === partner.id ? "border-primary bg-primary/5" : ""
                      }`}
                      onClick={() => handleSelectPartner(partner)}
                    >
                      <div className="flex items-center gap-3">
                        {partner.logo_url ? (
                          <div className="relative h-9 w-9 shrink-0 overflow-hidden rounded-md border bg-muted">
                            <Image src={partner.logo_url} alt={partner.company_name} fill className="object-contain p-0.5" />
                          </div>
                        ) : (
                          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md border bg-muted text-muted-foreground">
                            <Building2 className="h-4 w-4" />
                          </div>
                        )}
                        <div>
                          <p className="font-medium">{partner.company_name}</p>
                          <p className="text-sm text-muted-foreground">{partner.city}</p>
                        </div>
                      </div>
                      <div className="flex gap-1">
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={(e) => { e.stopPropagation(); openEditPartner(partner) }}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={(e) => e.stopPropagation()}>
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Eliminare {partner.company_name}?</AlertDialogTitle>
                              <AlertDialogDescription>
                                Questa azione eliminera anche tutte le offerte associate.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Annulla</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => handleDeletePartner(partner.id)}
                                className="bg-destructive text-destructive-foreground"
                                disabled={deletingPartnerId === partner.id}
                              >
                                {deletingPartnerId === partner.id ? <Loader2 className="h-4 w-4 animate-spin" /> : "Elimina"}
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </div>
                  ))}
                  {partners.length === 0 && (
                    <p className="py-8 text-center text-muted-foreground">Nessun partner</p>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Partner Details & Offers */}
            <Card className="lg:col-span-2">
              {selectedPartner ? (
                <>
                  <CardHeader className="flex flex-row items-start justify-between">
                    <div>
                      <CardTitle>{selectedPartner.company_name}</CardTitle>
                      <CardDescription className="flex flex-wrap gap-3 mt-2">
                        {selectedPartner.contact_phone && (
                          <a href={`tel:${selectedPartner.contact_phone}`} className="flex items-center gap-1 hover:text-primary">
                            <Phone className="h-4 w-4" />
                            {selectedPartner.contact_phone}
                          </a>
                        )}
                        {selectedPartner.website && (
                          <a href={selectedPartner.website} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 hover:text-primary">
                            <Globe className="h-4 w-4" />
                            Sito web
                          </a>
                        )}
                      </CardDescription>
                    </div>
                    <Dialog open={offerDialogOpen} onOpenChange={(open) => {
                      setOfferDialogOpen(open)
                      if (!open) resetOfferForm()
                    }}>
                      <DialogTrigger asChild>
                        <Button className="gap-1">
                          <Plus className="h-4 w-4" />
                          Nuova Offerta
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-lg">
                        <DialogHeader>
                          <DialogTitle>{editingOffer ? "Modifica Offerta" : "Nuova Offerta"}</DialogTitle>
                          <DialogDescription>Inserisci i dettagli del prodotto o servizio</DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4 py-4 max-h-[60vh] overflow-y-auto">
                          <div className="space-y-2">
                            <Label>Titolo *</Label>
                            <Input
                              value={offerForm.title}
                              onChange={(e) => setOfferForm((o) => ({ ...o, title: e.target.value }))}
                              placeholder="Es. Toelettatura completa"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label>Descrizione *</Label>
                            <Textarea
                              value={offerForm.description}
                              onChange={(e) => setOfferForm((o) => ({ ...o, description: e.target.value }))}
                              rows={2}
                            />
                          </div>
                          <div className="space-y-2">
                            <Label>Tipo *</Label>
                            <Select
                              value={offerForm.offer_type}
                              onValueChange={(v: "prodotto" | "servizio") => setOfferForm((o) => ({ ...o, offer_type: v }))}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Seleziona..." />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="prodotto">Prodotto</SelectItem>
                                <SelectItem value="servizio">Servizio</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="grid gap-4 sm:grid-cols-3">
                            <div className="space-y-2">
                              <Label>Prezzo Originale</Label>
                              <Input
                                type="number"
                                step="0.01"
                                value={offerForm.original_price}
                                onChange={(e) => setOfferForm((o) => ({ ...o, original_price: e.target.value }))}
                                placeholder="29.99"
                              />
                            </div>
                            <div className="space-y-2">
                              <Label>Prezzo Scontato *</Label>
                              <Input
                                type="number"
                                step="0.01"
                                value={offerForm.discounted_price}
                                onChange={(e) => setOfferForm((o) => ({ ...o, discounted_price: e.target.value }))}
                                placeholder="19.99"
                              />
                            </div>
                            <div className="space-y-2">
                              <Label>Sconto %</Label>
                              <Input
                                type="number"
                                value={offerForm.discount_percentage}
                                onChange={(e) => setOfferForm((o) => ({ ...o, discount_percentage: e.target.value }))}
                                placeholder="30"
                              />
                            </div>
                          </div>
                          <div className="space-y-2">
                            <Label>Valida fino a</Label>
                            <Input
                              type="date"
                              value={offerForm.valid_until}
                              onChange={(e) => setOfferForm((o) => ({ ...o, valid_until: e.target.value }))}
                            />
                          </div>
                          <div className="space-y-2">
                            <Label>Per quali animali? *</Label>
                            <div className="flex flex-wrap gap-4">
                              {(["cane", "gatto", "volatile"] as AnimalType[]).map((animal) => (
                                <div key={animal} className="flex items-center space-x-2">
                                  <Checkbox
                                    id={`offer_${animal}`}
                                    checked={offerForm.target_animals.includes(animal)}
                                    onCheckedChange={() => handleAnimalToggle(animal)}
                                  />
                                  <label htmlFor={`offer_${animal}`} className="flex cursor-pointer items-center gap-1 text-sm">
                                    <AnimalIcon type={animal} />
                                    {animalTypeLabels[animal]}
                                  </label>
                                </div>
                              ))}
                            </div>
                          </div>
                          {/* Banner Upload */}
                          <div className="space-y-2">
                            <Label>Banner Promozionale (ottimizzato per mobile)</Label>
                            {offerForm.banner_url ? (
                              <div className="relative">
                                <img
                                  src={offerForm.banner_url}
                                  alt="Banner preview"
                                  className="h-32 w-full rounded-lg border object-cover"
                                />
                                <Button
                                  type="button"
                                  variant="destructive"
                                  size="icon"
                                  className="absolute right-2 top-2 h-8 w-8"
                                  onClick={removeBanner}
                                >
                                  <X className="h-4 w-4" />
                                </Button>
                              </div>
                            ) : (
                              <div className="flex items-center gap-2">
                                <Button
                                  type="button"
                                  variant="outline"
                                  className="w-full"
                                  disabled={uploadingBanner}
                                  onClick={() => document.getElementById("banner-upload")?.click()}
                                >
                                  {uploadingBanner ? (
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                  ) : (
                                    <Upload className="mr-2 h-4 w-4" />
                                  )}
                                  Carica Banner
                                </Button>
                                <input
                                  id="banner-upload"
                                  type="file"
                                  accept="image/*"
                                  className="hidden"
                                  onChange={handleBannerUpload}
                                />
                              </div>
                            )}
                            <p className="text-xs text-muted-foreground">
                              Dimensioni consigliate: 1200x400px (formato orizzontale)
                            </p>
                          </div>
                        </div>
                        <DialogFooter>
                          <Button onClick={handleSaveOffer} disabled={savingOffer}>
                            {savingOffer && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Salva
                          </Button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>
                  </CardHeader>
                  <CardContent>
                    {loadingOffers ? (
                      <div className="flex items-center justify-center py-8">
                        <Loader2 className="h-6 w-6 animate-spin text-primary" />
                      </div>
                    ) : offers.length > 0 ? (
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Banner</TableHead>
                            <TableHead>Offerta</TableHead>
                            <TableHead>Tipo</TableHead>
                            <TableHead>Prezzo</TableHead>
                            <TableHead>Animali</TableHead>
                            <TableHead className="text-right">Azioni</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {offers.map((offer) => (
                            <TableRow key={offer.id}>
                              <TableCell>
                                {(offer as PartnerOffer & { banner_url?: string }).banner_url ? (
                                  <img
                                    src={(offer as PartnerOffer & { banner_url?: string }).banner_url}
                                    alt={offer.title}
                                    className="h-12 w-24 rounded object-cover"
                                  />
                                ) : (
                                  <div className="flex h-12 w-24 items-center justify-center rounded bg-muted">
                                    <ImageIcon className="h-5 w-5 text-muted-foreground" />
                                  </div>
                                )}
                              </TableCell>
                              <TableCell>
                                <p className="font-medium">{offer.title}</p>
                                <p className="text-xs text-muted-foreground line-clamp-1">{offer.description}</p>
                              </TableCell>
                              <TableCell>
                                <Badge variant="outline">
                                  {offer.offer_type === "prodotto" ? "Prodotto" : "Servizio"}
                                </Badge>
                              </TableCell>
                              <TableCell>
                                <div className="flex items-center gap-2">
                                  {offer.original_price && (
                                    <span className="text-sm text-muted-foreground line-through">
                                      {offer.original_price.toFixed(2)}
                                    </span>
                                  )}
                                  <span className="font-semibold text-primary">
                                    {offer.discounted_price.toFixed(2)}
                                  </span>
                                  {offer.discount_percentage && (
                                    <Badge variant="secondary" className="gap-1">
                                      <Percent className="h-3 w-3" />
                                      {offer.discount_percentage}%
                                    </Badge>
                                  )}
                                </div>
                              </TableCell>
                              <TableCell>
                                <div className="flex gap-1">
                                  {offer.target_animals.map((a) => (
                                    <AnimalIcon key={a} type={a} className="h-4 w-4 text-muted-foreground" />
                                  ))}
                                </div>
                              </TableCell>
                              <TableCell className="text-right">
                                <div className="flex justify-end gap-1">
                                  <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEditOffer(offer)}>
                                    <Pencil className="h-4 w-4" />
                                  </Button>
                                  <AlertDialog>
                                    <AlertDialogTrigger asChild>
                                      <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive">
                                        <Trash2 className="h-4 w-4" />
                                      </Button>
                                    </AlertDialogTrigger>
                                    <AlertDialogContent>
                                      <AlertDialogHeader>
                                        <AlertDialogTitle>Eliminare questa offerta?</AlertDialogTitle>
                                      </AlertDialogHeader>
                                      <AlertDialogFooter>
                                        <AlertDialogCancel>Annulla</AlertDialogCancel>
                                        <AlertDialogAction
                                          onClick={() => handleDeleteOffer(offer.id)}
                                          className="bg-destructive text-destructive-foreground"
                                          disabled={deletingOfferId === offer.id}
                                        >
                                          {deletingOfferId === offer.id ? <Loader2 className="h-4 w-4 animate-spin" /> : "Elimina"}
                                        </AlertDialogAction>
                                      </AlertDialogFooter>
                                    </AlertDialogContent>
                                  </AlertDialog>
                                </div>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    ) : (
                      <div className="py-12 text-center">
                        <Tag className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
                        <p className="text-muted-foreground">Nessuna offerta per questo partner</p>
                      </div>
                    )}
                  </CardContent>
                </>
              ) : (
                <CardContent className="flex flex-col items-center justify-center py-16">
                  <Building2 className="mb-4 h-16 w-16 text-muted-foreground" />
                  <p className="text-muted-foreground">Seleziona un partner per gestire le offerte</p>
                </CardContent>
              )}
            </Card>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  )
}
