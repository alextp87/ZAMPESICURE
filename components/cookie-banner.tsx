"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Cookie, X } from "lucide-react"
import { Button } from "@/components/ui/button"

const COOKIE_KEY = "zampesicure_cookie_consent"

export function CookieBanner() {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const consent = localStorage.getItem(COOKIE_KEY)
    if (!consent) {
      setVisible(true)
    }
  }, [])

  const accept = () => {
    localStorage.setItem(COOKIE_KEY, "accepted")
    setVisible(false)
  }

  const reject = () => {
    localStorage.setItem(COOKIE_KEY, "rejected")
    setVisible(false)
  }

  if (!visible) return null

  return (
    <div
      role="dialog"
      aria-label="Consenso cookie"
      className="fixed bottom-0 left-0 right-0 z-50 border-t border-border bg-card shadow-lg"
    >
      <div className="container mx-auto flex flex-col gap-4 px-4 py-5 md:flex-row md:items-center md:justify-between">
        <div className="flex items-start gap-3">
          <Cookie className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
          <div className="space-y-1">
            <p className="text-sm font-semibold text-foreground">
              Questo sito utilizza i cookie
            </p>
            <p className="text-sm text-muted-foreground leading-relaxed max-w-2xl">
              Utilizziamo cookie tecnici essenziali per il funzionamento del sito e, previo tuo consenso, cookie analitici e di profilazione.
              Ai sensi del Regolamento UE 2016/679 (GDPR) e della Direttiva ePrivacy (2002/58/CE), hai il diritto di accettare o rifiutare i cookie non essenziali.
              Puoi modificare le tue preferenze in qualsiasi momento.{" "}
              <Link href="/privacy" className="underline underline-offset-2 hover:text-primary transition-colors">
                Privacy Policy
              </Link>
            </p>
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-3 pl-8 md:pl-0">
          <Button
            variant="outline"
            size="sm"
            onClick={reject}
            className="min-w-[100px] border-border text-foreground hover:bg-muted"
          >
            Rifiuto
          </Button>
          <Button
            size="sm"
            onClick={accept}
            className="min-w-[100px]"
          >
            Accetto
          </Button>
        </div>
      </div>
    </div>
  )
}
