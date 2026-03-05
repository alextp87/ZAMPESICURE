"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Loader2,
  Dog,
  Cat,
  Bird,
  PawPrint,
  Phone,
  Globe,
  MapPin,
  Tag,
  Percent,
  Package,
  Wrench,
  ExternalLink,
  Heart,
} from "lucide-react"
import type { UserPet, PartnerOffer, Partner, AnimalType } from "@/lib/types"
import { animalTypeLabels } from "@/lib/types"
import Image from "next/image"
import Link from "next/link"

function AnimalIcon({ type, className = "h-5 w-5" }: { type: AnimalType; className?: string }) {
  switch (type) {
    case "cane": return <Dog className={className} />
    case "gatto": return <Cat className={className} />
    case "volatile": return <Bird className={className} />
  }
}

interface OfferWithPartner extends PartnerOffer {
  partners: Partner
}

export default function PerIlMioPetPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [pets, setPets] = useState<UserPet[]>([])
  const [offers, setOffers] = useState<OfferWithPartner[]>([])
  const [loadingOffers, setLoadingOffers] = useState(false)
  const [selectedPet, setSelectedPet] = useState<UserPet | null>(null)
  const [activeTab, setActiveTab] = useState<string>("all")

  useEffect(() => {
    async function loadData() {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) {
        router.push("/login")
        return
      }

      // Load user's pets
      const { data: petsData } = await supabase
        .from("user_pets")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })

      if (petsData && petsData.length > 0) {
        setPets(petsData as UserPet[])
        setSelectedPet(petsData[0] as UserPet)
      }
      setLoading(false)
    }

    loadData()
  }, [router])

  useEffect(() => {
    if (selectedPet) {
      fetchOffers(selectedPet.animal_type)
    }
  }, [selectedPet])

  const fetchOffers = async (animalType: AnimalType) => {
    setLoadingOffers(true)
    const supabase = createClient()

    const { data } = await supabase
      .from("partner_offers")
      .select("*, partners(*)")
      .contains("target_animals", [animalType])
      .eq("is_active", true)
      .order("discount_percentage", { ascending: false })

    if (data) {
      setOffers(data as OfferWithPartner[])
    }
    setLoadingOffers(false)
  }

  const filteredOffers = offers.filter((offer) => {
    if (activeTab === "all") return true
    return offer.offer_type === activeTab
  })

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

  if (pets.length === 0) {
    return (
      <div className="flex min-h-screen flex-col">
        <Header />
        <main className="flex flex-1 items-center justify-center py-12">
          <Card className="mx-4 max-w-md text-center">
            <CardContent className="pt-6">
              <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-primary/10">
                <PawPrint className="h-10 w-10 text-primary" />
              </div>
              <h2 className="mb-2 text-2xl font-bold">Nessun Pet Registrato</h2>
              <p className="mb-6 text-muted-foreground">
                Per visualizzare le offerte dedicate ai tuoi animali, devi prima aggiungerli al tuo profilo.
              </p>
              <Button asChild>
                <Link href="/profilo">
                  Aggiungi un Pet
                </Link>
              </Button>
            </CardContent>
          </Card>
        </main>
        <Footer />
      </div>
    )
  }

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1 py-8">
        <div className="container px-4">
          {/* Header */}
          <div className="mb-8 text-center">
            <h1 className="mb-2 text-3xl font-bold">Per il Mio Pet</h1>
            <p className="text-lg text-muted-foreground">
              Offerte esclusive dai nostri partner per i tuoi animali
            </p>
          </div>

          {/* Pet Selector */}
          {pets.length > 1 && (
            <div className="mb-6 flex flex-wrap justify-center gap-3">
              {pets.map((pet) => (
                <Button
                  key={pet.id}
                  variant={selectedPet?.id === pet.id ? "default" : "outline"}
                  className="gap-2"
                  onClick={() => setSelectedPet(pet)}
                >
                  {pet.photo_url ? (
                    <div className="relative h-6 w-6 overflow-hidden rounded-full">
                      <Image src={pet.photo_url} alt={pet.name} fill className="object-cover" />
                    </div>
                  ) : (
                    <AnimalIcon type={pet.animal_type} className="h-5 w-5" />
                  )}
                  {pet.name}
                </Button>
              ))}
            </div>
          )}

          {/* Selected Pet Card */}
          {selectedPet && (
            <Card className="mx-auto mb-8 max-w-md overflow-hidden">
              <div className="flex items-center gap-4 p-4">
                {selectedPet.photo_url ? (
                  <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-full">
                    <Image src={selectedPet.photo_url} alt={selectedPet.name} fill className="object-cover" />
                  </div>
                ) : (
                  <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-primary/10">
                    <AnimalIcon type={selectedPet.animal_type} className="h-8 w-8 text-primary" />
                  </div>
                )}
                <div>
                  <h2 className="text-xl font-semibold">{selectedPet.name}</h2>
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Badge variant="secondary" className="gap-1">
                      <AnimalIcon type={selectedPet.animal_type} className="h-3 w-3" />
                      {animalTypeLabels[selectedPet.animal_type]}
                    </Badge>
                    {selectedPet.breed && <span className="text-sm">{selectedPet.breed}</span>}
                  </div>
                </div>
              </div>
            </Card>
          )}

          {/* Offers */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
            <TabsList className="mx-auto flex w-fit">
              <TabsTrigger value="all" className="gap-2">
                <Tag className="h-4 w-4" />
                Tutte
              </TabsTrigger>
              <TabsTrigger value="prodotto" className="gap-2">
                <Package className="h-4 w-4" />
                Prodotti
              </TabsTrigger>
              <TabsTrigger value="servizio" className="gap-2">
                <Wrench className="h-4 w-4" />
                Servizi
              </TabsTrigger>
            </TabsList>

            <TabsContent value={activeTab}>
              {loadingOffers ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : filteredOffers.length > 0 ? (
                <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                  {filteredOffers.map((offer) => (
                    <Card key={offer.id} className="overflow-hidden">
                      {/* Banner */}
                      {(offer as typeof offer & { banner_url?: string }).banner_url && (
                        <div className="relative aspect-[3/1] w-full">
                          <img
                            src={(offer as typeof offer & { banner_url?: string }).banner_url}
                            alt={offer.title}
                            className="h-full w-full object-cover"
                          />
                          {offer.discount_percentage && (
                            <div className="absolute right-2 top-2 flex h-12 w-12 items-center justify-center rounded-full bg-destructive text-destructive-foreground shadow-lg">
                              <span className="text-sm font-bold">-{offer.discount_percentage}%</span>
                            </div>
                          )}
                        </div>
                      )}
                      <CardHeader className={`pb-4 ${!(offer as typeof offer & { banner_url?: string }).banner_url ? "bg-gradient-to-r from-primary/5 to-primary/10" : ""}`}>
                        <div className="flex items-start justify-between">
                          <div>
                            <Badge variant={offer.offer_type === "prodotto" ? "default" : "secondary"} className="mb-2">
                              {offer.offer_type === "prodotto" ? "Prodotto" : "Servizio"}
                            </Badge>
                            <CardTitle className="text-lg">{offer.title}</CardTitle>
                            <CardDescription className="mt-1">
                              {offer.partners.company_name}
                            </CardDescription>
                          </div>
                          {offer.discount_percentage && !(offer as typeof offer & { banner_url?: string }).banner_url && (
                            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-destructive text-destructive-foreground">
                              <span className="text-sm font-bold">-{offer.discount_percentage}%</span>
                            </div>
                          )}
                        </div>
                      </CardHeader>
                      <CardContent className="pt-4">
                        <p className="mb-4 text-sm text-muted-foreground line-clamp-2">
                          {offer.description}
                        </p>

                        {/* Price */}
                        <div className="mb-4 flex items-baseline gap-2">
                          {offer.original_price && (
                            <span className="text-lg text-muted-foreground line-through">
                              {offer.original_price.toFixed(2)}
                            </span>
                          )}
                          <span className="text-2xl font-bold text-primary">
                            {offer.discounted_price.toFixed(2)}
                          </span>
                        </div>

                        {/* Partner Info */}
                        <div className="mb-4 space-y-1 text-sm text-muted-foreground">
                          {offer.partners.city && (
                            <div className="flex items-center gap-2">
                              <MapPin className="h-4 w-4" />
                              {offer.partners.address && `${offer.partners.address}, `}{offer.partners.city}
                            </div>
                          )}
                        </div>

                        {/* Valid Until */}
                        {offer.valid_until && (
                          <p className="mb-4 text-xs text-muted-foreground">
                            Valida fino al {new Date(offer.valid_until).toLocaleDateString("it-IT")}
                          </p>
                        )}

                        {/* Actions */}
                        <div className="flex gap-2">
                          <Button asChild className="flex-1 gap-2">
                            <a href={`tel:${offer.partners.contact_phone}`}>
                              <Phone className="h-4 w-4" />
                              Chiama
                            </a>
                          </Button>
                          {offer.partners.website && (
                            <Button variant="outline" size="icon" asChild>
                              <a href={offer.partners.website} target="_blank" rel="noopener noreferrer">
                                <Globe className="h-4 w-4" />
                              </a>
                            </Button>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="py-12 text-center">
                  <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-muted">
                    <Tag className="h-8 w-8 text-muted-foreground" />
                  </div>
                  <h3 className="mb-2 font-semibold">Nessuna offerta disponibile</h3>
                  <p className="text-muted-foreground">
                    Al momento non ci sono offerte per {animalTypeLabels[selectedPet?.animal_type || "cane"].toLowerCase()}.
                    <br />
                    Torna a trovarci presto!
                  </p>
                </div>
              )}
            </TabsContent>
          </Tabs>

          {/* Become Partner CTA */}
          <Card className="mx-auto mt-12 max-w-2xl bg-gradient-to-r from-primary/5 to-primary/10">
            <CardContent className="flex flex-col items-center py-8 text-center sm:flex-row sm:text-left">
              <div className="mb-4 flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-primary/20 sm:mb-0 sm:mr-6">
                <Heart className="h-8 w-8 text-primary" />
              </div>
              <div className="flex-1">
                <h3 className="mb-2 text-xl font-semibold">Sei un&apos;azienda?</h3>
                <p className="mb-4 text-muted-foreground">
                  Diventa partner e raggiungi migliaia di proprietari di animali con le tue offerte esclusive.
                </p>
                <Button asChild>
                  <Link href="/diventa-partner">
                    Diventa Partner
                    <ExternalLink className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
      <Footer />
    </div>
  )
}
