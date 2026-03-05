"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
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
import { Loader2, User, Dog, Cat, Bird, Plus, Pencil, Trash2, Calendar, PawPrint, CheckCircle2, AlertCircle } from "lucide-react"
import type { UserPet, AnimalType } from "@/lib/types"
import { animalTypeLabels } from "@/lib/types"
import Image from "next/image"

interface Profile {
  id: string
  first_name: string | null
  last_name: string | null
  phone: string | null
  email: string | null
}

function AnimalIcon({ type, className = "h-5 w-5" }: { type: AnimalType; className?: string }) {
  switch (type) {
    case "cane":
      return <Dog className={className} />
    case "gatto":
      return <Cat className={className} />
    case "volatile":
      return <Bird className={className} />
  }
}

export default function ProfiloPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [pets, setPets] = useState<UserPet[]>([])
  const [loadingPets, setLoadingPets] = useState(true)
  
  const [saveSuccess, setSaveSuccess] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)
  const [petDialogOpen, setPetDialogOpen] = useState(false)
  const [editingPet, setEditingPet] = useState<UserPet | null>(null)
  const [petForm, setPetForm] = useState({
    name: "",
    animal_type: "" as AnimalType | "",
    breed: "",
    birth_date: "",
  })
  const [petPhoto, setPetPhoto] = useState<File | null>(null)
  const [petPhotoPreview, setPetPhotoPreview] = useState<string | null>(null)
  const [savingPet, setSavingPet] = useState(false)
  const [deletingPetId, setDeletingPetId] = useState<string | null>(null)

  useEffect(() => {
    async function loadData() {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) {
        router.push("/login")
        return
      }

      // Load profile - ignore PGRST116 (no rows found)
      const { data: profileData, error: profileError } = await supabase
        .from("profiles")
        .select("id, first_name, last_name, phone")
        .eq("id", user.id)
        .maybeSingle()

      if (profileData) {
        setProfile({ ...profileData, email: user.email || null })
      } else {
        // Profile doesn't exist yet, create a stub from auth user
        setProfile({
          id: user.id,
          first_name: null,
          last_name: null,
          phone: null,
          email: user.email || null,
        })
      }
      setLoading(false)

      // Load pets
      const { data: petsData } = await supabase
        .from("user_pets")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })

      if (petsData) {
        setPets(petsData as UserPet[])
      }
      setLoadingPets(false)
    }

    loadData()
  }, [router])

  const handleSaveProfile = async () => {
    if (!profile) return
    setSaving(true)
    setSaveSuccess(false)
    setSaveError(null)

    const supabase = createClient()

    // Update profile table (upsert in case it doesn't exist)
    const { error: profileError } = await supabase
      .from("profiles")
      .upsert({
        id: profile.id,
        first_name: profile.first_name,
        last_name: profile.last_name,
        phone: profile.phone,
      }, { onConflict: "id" })

    if (profileError) {
      setSaveError("Errore nel salvataggio del profilo.")
      setSaving(false)
      return
    }

    // Update email via Supabase Auth if changed
    const { data: { user } } = await supabase.auth.getUser()
    if (user && profile.email && profile.email !== user.email) {
      const { error: emailError } = await supabase.auth.updateUser({ email: profile.email })
      if (emailError) {
        setSaveError("Profilo salvato, ma l'aggiornamento email ha fallito: " + emailError.message)
        setSaving(false)
        return
      }
    }

    setSaveSuccess(true)
    setSaving(false)
    setTimeout(() => setSaveSuccess(false), 3000)
  }

  const handlePetPhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setPetPhoto(file)
      setPetPhotoPreview(URL.createObjectURL(file))
    }
  }

  const resetPetForm = () => {
    setPetForm({ name: "", animal_type: "", breed: "", birth_date: "" })
    setPetPhoto(null)
    setPetPhotoPreview(null)
    setEditingPet(null)
  }

  const openEditPet = (pet: UserPet) => {
    setEditingPet(pet)
    setPetForm({
      name: pet.name,
      animal_type: pet.animal_type,
      breed: pet.breed || "",
      birth_date: pet.birth_date || "",
    })
    setPetPhotoPreview(pet.photo_url || null)
    setPetDialogOpen(true)
  }

  const handleSavePet = async () => {
    if (!petForm.name || !petForm.animal_type) return
    setSavingPet(true)

    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    let photoUrl = editingPet?.photo_url || null

    // Upload photo if new one selected
    if (petPhoto) {
      const fileExt = petPhoto.name.split(".").pop()
      const fileName = `${user.id}/${Date.now()}.${fileExt}`
      
      const { error: uploadError } = await supabase.storage
        .from("pet-photos")
        .upload(fileName, petPhoto)

      if (!uploadError) {
        const { data: { publicUrl } } = supabase.storage
          .from("pet-photos")
          .getPublicUrl(fileName)
        photoUrl = publicUrl
      }
    }

    const petData = {
      name: petForm.name,
      animal_type: petForm.animal_type,
      breed: petForm.breed || null,
      birth_date: petForm.birth_date || null,
      photo_url: photoUrl,
      updated_at: new Date().toISOString(),
    }

    if (editingPet) {
      // Update existing pet
      const { data, error } = await supabase
        .from("user_pets")
        .update(petData)
        .eq("id", editingPet.id)
        .select()
        .single()

      if (!error && data) {
        setPets((prev) => prev.map((p) => (p.id === editingPet.id ? data as UserPet : p)))
      }
    } else {
      // Create new pet
      const { data, error } = await supabase
        .from("user_pets")
        .insert({ ...petData, user_id: user.id })
        .select()
        .single()

      if (!error && data) {
        setPets((prev) => [data as UserPet, ...prev])
      }
    }

    setSavingPet(false)
    setPetDialogOpen(false)
    resetPetForm()
  }

  const handleDeletePet = async (petId: string) => {
    setDeletingPetId(petId)
    const supabase = createClient()

    const { error } = await supabase
      .from("user_pets")
      .delete()
      .eq("id", petId)

    if (!error) {
      setPets((prev) => prev.filter((p) => p.id !== petId))
    }
    setDeletingPetId(null)
  }

  const calculateAge = (birthDate: string) => {
    const birth = new Date(birthDate)
    const now = new Date()
    const years = now.getFullYear() - birth.getFullYear()
    const months = now.getMonth() - birth.getMonth()
    
    if (years > 0) {
      return `${years} ann${years === 1 ? "o" : "i"}`
    } else if (months > 0) {
      return `${months} mes${months === 1 ? "e" : "i"}`
    }
    return "Cucciolo"
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
        <div className="container max-w-4xl px-4">
          <h1 className="mb-6 text-3xl font-bold">Il Mio Profilo</h1>

          <Tabs defaultValue="profilo" className="space-y-6">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="profilo" className="gap-2">
                <User className="h-4 w-4" />
                Profilo
              </TabsTrigger>
              <TabsTrigger value="pets" className="gap-2">
                <PawPrint className="h-4 w-4" />
                I Miei Pet
                {pets.length > 0 && (
                  <Badge variant="secondary" className="ml-1">
                    {pets.length}
                  </Badge>
                )}
              </TabsTrigger>
            </TabsList>

            <TabsContent value="profilo">
              <Card>
                <CardHeader>
                  <CardTitle>Informazioni Personali</CardTitle>
                  <CardDescription>
                    Aggiorna i tuoi dati personali
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="first_name">Nome</Label>
                      <Input
                        id="first_name"
                        placeholder="Il tuo nome"
                        value={profile?.first_name || ""}
                        onChange={(e) =>
                          setProfile((prev) =>
                            prev ? { ...prev, first_name: e.target.value } : null
                          )
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="last_name">Cognome</Label>
                      <Input
                        id="last_name"
                        placeholder="Il tuo cognome"
                        value={profile?.last_name || ""}
                        onChange={(e) =>
                          setProfile((prev) =>
                            prev ? { ...prev, last_name: e.target.value } : null
                          )
                        }
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="La tua email"
                      value={profile?.email || ""}
                      onChange={(e) =>
                        setProfile((prev) =>
                          prev ? { ...prev, email: e.target.value } : null
                        )
                      }
                    />
                    <p className="text-xs text-muted-foreground">
                      Se cambi l&apos;email riceverai un link di conferma al nuovo indirizzo.
                    </p>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone">Telefono</Label>
                    <Input
                      id="phone"
                      type="tel"
                      placeholder="+39 000 000 0000"
                      value={profile?.phone || ""}
                      onChange={(e) =>
                        setProfile((prev) =>
                          prev ? { ...prev, phone: e.target.value } : null
                        )
                      }
                    />
                  </div>

                  {saveSuccess && (
                    <div className="flex items-center gap-2 rounded-lg bg-green-50 p-3 text-sm text-green-700">
                      <CheckCircle2 className="h-4 w-4 shrink-0" />
                      Profilo aggiornato con successo!
                    </div>
                  )}
                  {saveError && (
                    <div className="flex items-center gap-2 rounded-lg bg-destructive/10 p-3 text-sm text-destructive">
                      <AlertCircle className="h-4 w-4 shrink-0" />
                      {saveError}
                    </div>
                  )}

                  <Button onClick={handleSaveProfile} disabled={saving}>
                    {saving ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : null}
                    Salva Modifiche
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="pets">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <div>
                    <CardTitle>I Miei Pet</CardTitle>
                    <CardDescription>
                      Gestisci i tuoi animali domestici
                    </CardDescription>
                  </div>
                  <Dialog open={petDialogOpen} onOpenChange={(open) => {
                    setPetDialogOpen(open)
                    if (!open) resetPetForm()
                  }}>
                    <DialogTrigger asChild>
                      <Button className="gap-2">
                        <Plus className="h-4 w-4" />
                        Aggiungi Pet
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>
                          {editingPet ? "Modifica Pet" : "Aggiungi Nuovo Pet"}
                        </DialogTitle>
                        <DialogDescription>
                          Inserisci i dati del tuo animale domestico
                        </DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4 py-4">
                        <div className="space-y-2">
                          <Label htmlFor="pet_name">Nome *</Label>
                          <Input
                            id="pet_name"
                            value={petForm.name}
                            onChange={(e) =>
                              setPetForm((prev) => ({ ...prev, name: e.target.value }))
                            }
                            placeholder="Es. Fido"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Tipo di animale *</Label>
                          <Select
                            value={petForm.animal_type}
                            onValueChange={(value: AnimalType) =>
                              setPetForm((prev) => ({ ...prev, animal_type: value }))
                            }
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Seleziona..." />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="cane">
                                <span className="flex items-center gap-2">
                                  <Dog className="h-4 w-4" /> Cane
                                </span>
                              </SelectItem>
                              <SelectItem value="gatto">
                                <span className="flex items-center gap-2">
                                  <Cat className="h-4 w-4" /> Gatto
                                </span>
                              </SelectItem>
                              <SelectItem value="volatile">
                                <span className="flex items-center gap-2">
                                  <Bird className="h-4 w-4" /> Volatile
                                </span>
                              </SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="pet_breed">Razza</Label>
                          <Input
                            id="pet_breed"
                            value={petForm.breed}
                            onChange={(e) =>
                              setPetForm((prev) => ({ ...prev, breed: e.target.value }))
                            }
                            placeholder="Es. Labrador"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="pet_birth">Data di nascita</Label>
                          <Input
                            id="pet_birth"
                            type="date"
                            value={petForm.birth_date}
                            onChange={(e) =>
                              setPetForm((prev) => ({ ...prev, birth_date: e.target.value }))
                            }
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="pet_photo">Foto</Label>
                          <Input
                            id="pet_photo"
                            type="file"
                            accept="image/*"
                            onChange={handlePetPhotoChange}
                          />
                          {petPhotoPreview && (
                            <div className="relative mt-2 h-32 w-32 overflow-hidden rounded-lg">
                              <Image
                                src={petPhotoPreview}
                                alt="Preview"
                                fill
                                className="object-cover"
                              />
                            </div>
                          )}
                        </div>
                      </div>
                      <DialogFooter>
                        <Button
                          onClick={handleSavePet}
                          disabled={!petForm.name || !petForm.animal_type || savingPet}
                        >
                          {savingPet ? (
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          ) : null}
                          {editingPet ? "Salva Modifiche" : "Aggiungi"}
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                </CardHeader>
                <CardContent>
                  {loadingPets ? (
                    <div className="flex items-center justify-center py-8">
                      <Loader2 className="h-6 w-6 animate-spin text-primary" />
                    </div>
                  ) : pets.length > 0 ? (
                    <div className="grid gap-4 sm:grid-cols-2">
                      {pets.map((pet) => (
                        <Card key={pet.id} className="overflow-hidden">
                          <div className="flex">
                            {pet.photo_url ? (
                              <div className="relative h-32 w-32 shrink-0">
                                <Image
                                  src={pet.photo_url}
                                  alt={pet.name}
                                  fill
                                  className="object-cover"
                                />
                              </div>
                            ) : (
                              <div className="flex h-32 w-32 shrink-0 items-center justify-center bg-muted">
                                <AnimalIcon type={pet.animal_type} className="h-12 w-12 text-muted-foreground" />
                              </div>
                            )}
                            <div className="flex flex-1 flex-col justify-between p-4">
                              <div>
                                <div className="flex items-center gap-2">
                                  <h3 className="font-semibold">{pet.name}</h3>
                                  <Badge variant="secondary" className="gap-1">
                                    <AnimalIcon type={pet.animal_type} className="h-3 w-3" />
                                    {animalTypeLabels[pet.animal_type]}
                                  </Badge>
                                </div>
                                {pet.breed && (
                                  <p className="text-sm text-muted-foreground">{pet.breed}</p>
                                )}
                                {pet.birth_date && (
                                  <p className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
                                    <Calendar className="h-3 w-3" />
                                    {calculateAge(pet.birth_date)}
                                  </p>
                                )}
                              </div>
                              <div className="flex gap-2">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => openEditPet(pet)}
                                >
                                  <Pencil className="h-3 w-3" />
                                </Button>
                                <AlertDialog>
                                  <AlertDialogTrigger asChild>
                                    <Button variant="outline" size="sm" className="text-destructive">
                                      <Trash2 className="h-3 w-3" />
                                    </Button>
                                  </AlertDialogTrigger>
                                  <AlertDialogContent>
                                    <AlertDialogHeader>
                                      <AlertDialogTitle>Eliminare {pet.name}?</AlertDialogTitle>
                                      <AlertDialogDescription>
                                        Questa azione non puo essere annullata.
                                      </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                      <AlertDialogCancel>Annulla</AlertDialogCancel>
                                      <AlertDialogAction
                                        onClick={() => handleDeletePet(pet.id)}
                                        className="bg-destructive text-destructive-foreground"
                                        disabled={deletingPetId === pet.id}
                                      >
                                        {deletingPetId === pet.id ? (
                                          <Loader2 className="h-4 w-4 animate-spin" />
                                        ) : (
                                          "Elimina"
                                        )}
                                      </AlertDialogAction>
                                    </AlertDialogFooter>
                                  </AlertDialogContent>
                                </AlertDialog>
                              </div>
                            </div>
                          </div>
                        </Card>
                      ))}
                    </div>
                  ) : (
                    <div className="py-12 text-center">
                      <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-muted">
                        <PawPrint className="h-8 w-8 text-muted-foreground" />
                      </div>
                      <h3 className="mb-2 font-semibold">Nessun pet registrato</h3>
                      <p className="mb-4 text-sm text-muted-foreground">
                        Aggiungi i tuoi animali domestici per accedere a offerte dedicate
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </main>
      <Footer />
    </div>
  )
}
