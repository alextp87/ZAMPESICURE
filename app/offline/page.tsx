"use client"

import { WifiOff, RefreshCw } from "lucide-react"
import { Button } from "@/components/ui/button"
import Link from "next/link"

export default function OfflinePage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-4">
      <div className="text-center space-y-6 max-w-md">
        <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-muted">
          <WifiOff className="h-10 w-10 text-muted-foreground" />
        </div>
        
        <div className="space-y-2">
          <h1 className="text-2xl font-bold text-foreground">
            Sei offline
          </h1>
          <p className="text-muted-foreground">
            Sembra che tu non sia connesso a Internet. Controlla la tua connessione e riprova.
          </p>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
          <Button
            onClick={() => window.location.reload()}
            className="gap-2"
          >
            <RefreshCw className="h-4 w-4" />
            Riprova
          </Button>
          <Link href="/">
            <Button variant="outline" className="w-full sm:w-auto">
              Torna alla Home
            </Button>
          </Link>
        </div>

        <p className="text-xs text-muted-foreground">
          Alcune funzionalita potrebbero essere disponibili offline se hai visitato le pagine in precedenza.
        </p>
      </div>
    </div>
  )
}
