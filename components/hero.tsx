"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Search, Eye, MapPin, PawPrint } from "lucide-react"

export function Hero() {
  return (
    <section className="relative overflow-hidden bg-gradient-to-b from-secondary to-background pb-16 pt-12 md:pb-24 md:pt-20">
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -right-20 -top-20 h-72 w-72 rounded-full bg-primary/10 blur-3xl" />
        <div className="absolute -bottom-20 -left-20 h-72 w-72 rounded-full bg-accent/10 blur-3xl" />
      </div>

      <div className="container relative mx-auto px-4">
        <div className="mx-auto max-w-3xl text-center">
          {/* RIMOSSO: badge con MapPin + "Provincia di Trapani" */}

          <h1 className="mb-6 text-balance text-4xl font-bold tracking-tight text-foreground md:text-5xl lg:text-6xl">
            Aiutiamo gli animali a{" "}
            <span className="text-primary">tornare a casa</span>
          </h1>

          <p className="mx-auto mb-10 max-w-2xl text-pretty text-lg text-muted-foreground md:text-xl">
            ZampeSicure ti permette di segnalare animali smarriti o avvistati in tutta Italia.
            Insieme possiamo fare tanto!
          </p>

          <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Link href="/nuova-segnalazione?type=smarrito">
              <Button size="lg" className="w-full gap-2 sm:w-auto" variant="destructive">
                <Search className="h-5 w-5" />
                Ho Smarrito un Animale
              </Button>
            </Link>
            <Link href="/nuova-segnalazione?type=avvistato">
              <Button
                size="lg"
                variant="outline"
                className="w-full gap-2 border-accent text-accent-foreground bg-accent hover:bg-accent/90 sm:w-auto"
              >
                <Eye className="h-5 w-5" />
                Ho Avvistato un Animale
              </Button>
            </Link>
          </div>
        </div>

        <div className="mt-16 grid grid-cols-1 gap-6 sm:grid-cols-3">
          <div className="flex flex-col items-center rounded-2xl bg-card p-6 text-center shadow-sm">
            <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-primary/10">
              <PawPrint className="h-7 w-7 text-primary" />
            </div>
            <h3 className="mb-2 font-semibold text-foreground">Tutto per i nostri animali</h3>
            <p className="text-sm text-muted-foreground">
              Direttamente dal gruppo Facebook RETE RICERCA CANI SMARRITI nasce ZAMPESICURE, dove segnalare uno smarrimento o un avvistamento diventa sempre più facile.
            </p>
          </div>

          <div className="flex flex-col items-center rounded-2xl bg-card p-6 text-center shadow-sm">
            <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-accent/20">
              <MapPin className="h-7 w-7 text-accent" />
            </div>
            <h3 className="mb-2 font-semibold text-foreground">Localizzazione GPS</h3>
            <p className="text-sm text-muted-foreground">
              La segnalazione è velocissima e tramite il GPS viene indicato il punto preciso dell&apos;avvistamento.
            </p>
          </div>

          <div className="flex flex-col items-center rounded-2xl bg-card p-6 text-center shadow-sm">
            <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-primary/10">
              <Eye className="h-7 w-7 text-primary" />
            </div>
            <h3 className="mb-2 font-semibold text-foreground">Comunità Attiva</h3>
            <p className="text-sm text-muted-foreground">
              Una rete di persone pronte ad aiutare in tutta Italia.
            </p>
          </div>
        </div>
      </div>
    </section>
  )
}