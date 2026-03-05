"use client"

import React, { useState } from "react"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Loader2, Building2, CheckCircle2, Dog, Cat, Bird, Handshake } from "lucide-react"
import type { AnimalType } from "@/lib/types"

export default function DiventaPartnerPage() {
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [form, setForm] = useState({
    company_name: "",
    contact_name: "",
    contact_email: "",
    contact_phone: "",
    website: "",
    description: "",
    services_offered: "",
    target_animals: [] as AnimalType[],
  })

  const handleAnimalToggle = (animal: AnimalType) => {
    setForm((prev) => ({
      ...prev,
      target_animals: prev.target_animals.includes(animal)
        ? prev.target_animals.filter((a) => a !== animal)
        : [...prev.target_animals, animal],
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (form.target_animals.length === 0) return

    setLoading(true)

    const response = await fetch("/api/sponsor-request", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    })

    setLoading(false)
    if (response.ok) {
      setSuccess(true)
    }
  }

  if (success) {
    return (
      <div className="flex min-h-screen flex-col">
        <Header />
        <main className="flex flex-1 items-center justify-center py-12">
          <Card className="mx-4 max-w-md text-center">
            <CardContent className="pt-6">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
                <CheckCircle2 className="h-8 w-8 text-green-600" />
              </div>
              <h2 className="mb-2 text-2xl font-bold">Richiesta Inviata!</h2>
              <p className="text-muted-foreground">
                Grazie per il tuo interesse. Il nostro team ti contattera al piu presto
                per discutere della partnership.
              </p>
              <Button className="mt-6" onClick={() => window.location.href = "/"}>
                Torna alla Home
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
        <div className="container max-w-2xl px-4">
          {/* Hero Section */}
          <div className="mb-8 text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
              <Handshake className="h-8 w-8 text-primary" />
            </div>
            <h1 className="mb-2 text-3xl font-bold">Diventa Partner ZampeSicure</h1>
            <p className="text-lg text-muted-foreground">
              Unisciti alla nostra rete di aziende partner e raggiungi migliaia di proprietari di animali ed incrementa il tuo business
            </p>
          </div>

          {/* Benefits */}
          <div className="mb-8 grid gap-4 sm:grid-cols-3">
            <Card className="text-center">
              <CardContent className="pt-6">
                <Building2 className="mx-auto mb-2 h-8 w-8 text-primary" />
                <h3 className="font-semibold">Visibilità</h3>
                <p className="text-sm text-muted-foreground">
                  Raggiungi un pubblico mirato senza sforzi o parole chiavi
                </p>
              </CardContent>
            </Card>
            <Card className="text-center">
              <CardContent className="pt-6">
                <Dog className="mx-auto mb-2 h-8 w-8 text-primary" />
                <h3 className="font-semibold">Target Specifico</h3>
                <p className="text-sm text-muted-foreground">
                  ZempeSicure si rivolge ai proprietari di cani, gatti e volatili ma anche a "semplici" (ma stimati) volontari o appassionati di animali.
                </p>
              </CardContent>
            </Card>
            <Card className="text-center">
              <CardContent className="pt-6">
                <Handshake className="mx-auto mb-2 h-8 w-8 text-primary" />
                <h3 className="font-semibold">Partnership</h3>
                <p className="text-sm text-muted-foreground">
                  Hai la possibilità di offrire offerte esclusive per i nostri utenti
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Form */}
          <Card>
            <CardHeader>
              <CardTitle>Richiedi di diventare Partner</CardTitle>
              <CardDescription>
                Compila il modulo e ti contatteremo per discutere della collaborazione
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="company_name">Nome Azienda *</Label>
                    <Input
                      id="company_name"
                      required
                      value={form.company_name}
                      onChange={(e) => setForm((prev) => ({ ...prev, company_name: e.target.value }))}
                      placeholder="Es. PetShop Italia"
                    />
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="contact_name">Nome Referente *</Label>
                      <Input
                        id="contact_name"
                        required
                        value={form.contact_name}
                        onChange={(e) => setForm((prev) => ({ ...prev, contact_name: e.target.value }))}
                        placeholder="Es. Mario Rossi"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="contact_phone">Telefono *</Label>
                      <Input
                        id="contact_phone"
                        type="tel"
                        required
                        value={form.contact_phone}
                        onChange={(e) => setForm((prev) => ({ ...prev, contact_phone: e.target.value }))}
                        placeholder="Es. 333 1234567"
                      />
                    </div>
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="contact_email">Email *</Label>
                      <Input
                        id="contact_email"
                        type="email"
                        required
                        value={form.contact_email}
                        onChange={(e) => setForm((prev) => ({ ...prev, contact_email: e.target.value }))}
                        placeholder="Es. info@azienda.it"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="website">Sito Web</Label>
                      <Input
                        id="website"
                        type="url"
                        value={form.website}
                        onChange={(e) => setForm((prev) => ({ ...prev, website: e.target.value }))}
                        placeholder="Es. https://www.azienda.it"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="description">Descrizione Azienda *</Label>
                    <Textarea
                      id="description"
                      required
                      value={form.description}
                      onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))}
                      placeholder="Descrivi brevemente la tua azienda e i servizi offerti..."
                      rows={3}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="services_offered">Prodotti/Servizi che vuoi promuovere *</Label>
                    <Textarea
                      id="services_offered"
                      required
                      value={form.services_offered}
                      onChange={(e) => setForm((prev) => ({ ...prev, services_offered: e.target.value }))}
                      placeholder="Elenca i prodotti o servizi che vorresti offrire ai nostri utenti..."
                      rows={3}
                    />
                  </div>

                  <div className="space-y-3">
                    <Label>A quali animali sono destinati i tuoi prodotti/servizi? *</Label>
                    <div className="flex flex-wrap gap-3">
                      {([
                        { value: "cane", label: "Cani", Icon: Dog },
                        { value: "gatto", label: "Gatti", Icon: Cat },
                        { value: "volatile", label: "Volatili", Icon: Bird },
                      ] as { value: AnimalType; label: string; Icon: React.ElementType }[]).map(({ value, label, Icon }) => {
                        const checked = form.target_animals.includes(value)
                        return (
                          <button
                            key={value}
                            type="button"
                            onClick={() => handleAnimalToggle(value)}
                            className={`flex items-center gap-2 rounded-md border px-3 py-2 text-sm transition-colors ${
                              checked
                                ? "border-primary bg-primary/10 text-primary"
                                : "border-border hover:border-primary/50 hover:bg-muted"
                            }`}
                          >
                            <div className={`flex h-4 w-4 shrink-0 items-center justify-center rounded border ${checked ? "border-primary bg-primary" : "border-input"}`}>
                              {checked && (
                                <svg viewBox="0 0 10 10" className="h-3 w-3 text-white" fill="none" stroke="currentColor" strokeWidth="2">
                                  <polyline points="1.5,5 4,7.5 8.5,2.5" />
                                </svg>
                              )}
                            </div>
                            <Icon className="h-4 w-4" />
                            {label}
                          </button>
                        )
                      })}
                    </div>
                    {form.target_animals.length === 0 && (
                      <p className="text-xs text-destructive">Seleziona almeno un tipo di animale</p>
                    )}
                  </div>
                </div>

                <Button
                  type="submit"
                  className="w-full"
                  disabled={loading || form.target_animals.length === 0}
                >
                  {loading ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : null}
                  Invia Richiesta
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </main>
      <Footer />
    </div>
  )
}
