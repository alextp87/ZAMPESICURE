"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Download, Share2, PlusSquare, X } from "lucide-react"

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>
}

function isStandaloneMode(): boolean {
  // @ts-expect-error iOS standalone
  const iosStandalone = typeof navigator !== "undefined" && navigator.standalone
  const mqlStandalone =
    typeof window !== "undefined" &&
    window.matchMedia &&
    window.matchMedia("(display-mode: standalone)").matches
  return Boolean(iosStandalone || mqlStandalone)
}

function detectIOS(): boolean {
  if (typeof navigator === "undefined") return false
  const ua = navigator.userAgent.toLowerCase()
  return /iphone|ipad|ipod/.test(ua)
}

function detectMobile(): boolean {
  if (typeof navigator === "undefined") return false
  const ua = navigator.userAgent.toLowerCase()
  return /mobile|android|iphone|ipad|ipod/.test(ua)
}

export default function PWAInstallInline() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const [show, setShow] = useState(false)
  const [isIOS, setIsIOS] = useState(false)

  useEffect(() => {
    if (!detectMobile()) return
    if (isStandaloneMode()) return

    setIsIOS(detectIOS())

    const dismissed = localStorage.getItem("zampesicure_install_inline_dismissed")
    if (dismissed) return

    // Mostra subito, anche se prompt non è ancora disponibile
    setShow(true)

    const handleBeforeInstall = (e: Event) => {
      e.preventDefault()
      setDeferredPrompt(e as BeforeInstallPromptEvent)
      setShow(true)
    }

    window.addEventListener("beforeinstallprompt", handleBeforeInstall)
    window.addEventListener("appinstalled", () => setShow(false))

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstall)
    }
  }, [])

  const dismiss = () => {
    localStorage.setItem("zampesicure_install_inline_dismissed", "true")
    setShow(false)
  }

  const handleInstall = async () => {
    if (!deferredPrompt) return
    await deferredPrompt.prompt()
    const res = await deferredPrompt.userChoice
    if (res.outcome === "accepted") {
      setShow(false)
      localStorage.setItem("zampesicure_install_inline_dismissed", "true")
    }
    setDeferredPrompt(null)
  }

  if (!show) return null

  return (
    <div className="mx-auto w-full max-w-7xl px-4">
      <div className="mt-3 rounded-2xl border bg-white p-4 shadow-sm">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3">
            <div className="mt-0.5 rounded-xl bg-orange-50 p-2">
              <Download className="h-5 w-5 text-orange-600" />
            </div>

            <div>
              <div className="font-semibold">Installa ZampeSicure</div>

              {!isIOS ? (
                <>
                  <div className="mt-1 text-sm text-muted-foreground">
                    Aggiungi l’app alla home per accesso rapido e notifiche push.
                  </div>

                  <div className="mt-3 flex flex-wrap items-center gap-2">
                    <Button variant="outline" onClick={dismiss}>
                      Non ora
                    </Button>

                    {deferredPrompt ? (
                      <Button className="bg-orange-600 hover:bg-orange-700" onClick={handleInstall}>
                        Installa
                      </Button>
                    ) : (
                      <div className="text-sm text-muted-foreground">
                        Apri il menu <b>⋮</b> e scegli <b>Installa app</b>.
                      </div>
                    )}
                  </div>
                </>
              ) : (
                <>
                  <div className="mt-1 text-sm text-muted-foreground">
                    Su iPhone/iPad l’installazione è manuale da Safari:
                  </div>

                  <ol className="mt-3 space-y-2 text-sm">
                    <li className="flex items-center gap-2">
                      <Share2 className="h-4 w-4 text-orange-600" />
                      Tocca <b>Condividi</b>
                    </li>
                    <li className="flex items-center gap-2">
                      <PlusSquare className="h-4 w-4 text-orange-600" />
                      Poi <b>Aggiungi a Home</b>
                    </li>
                  </ol>

                  <div className="mt-3">
                    <Button variant="outline" onClick={dismiss}>
                      Ok, capito
                    </Button>
                  </div>
                </>
              )}
            </div>
          </div>

          <button onClick={dismiss} className="rounded-lg p-1 hover:bg-muted" aria-label="Chiudi">
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  )
}