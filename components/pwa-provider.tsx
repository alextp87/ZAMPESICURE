"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Bell, BellOff, Download, X } from "lucide-react"

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>
}

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/")
  const rawData = window.atob(base64)
  return Uint8Array.from([...rawData].map((c) => c.charCodeAt(0)))
}

export function PWAProvider() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const [showInstallBanner, setShowInstallBanner] = useState(false)
  const [showPushBanner, setShowPushBanner] = useState(false)

  useEffect(() => {
    // Register service worker
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").catch(() => {})
    }

    // Already installed as PWA — skip install banner
    if (window.matchMedia("(display-mode: standalone)").matches) {
      initPushAfterLogin()
      return
    }

    // Install prompt
    const handleBeforeInstall = (e: Event) => {
      e.preventDefault()
      setDeferredPrompt(e as BeforeInstallPromptEvent)
      const dismissed = localStorage.getItem("zampesicure_pwa_dismissed")
      if (!dismissed) setShowInstallBanner(true)
    }
    window.addEventListener("beforeinstallprompt", handleBeforeInstall)
    window.addEventListener("appinstalled", () => setShowInstallBanner(false))

    // Check push permission for logged-in users
    initPushAfterLogin()

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstall)
    }
  }, [])

  const initPushAfterLogin = async () => {
    if (!("PushManager" in window) || !("Notification" in window)) return

    const permission = Notification.permission

    if (permission === "granted") {
      await subscribeUserToPush()
      return
    }

    if (permission === "default") {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const dismissed = localStorage.getItem("zampesicure_push_dismissed")
      if (!dismissed) setShowPushBanner(true)
    }
  }

  const subscribeUserToPush = async () => {
    try {
      const vapidKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY
      if (!vapidKey) return

      const registration = await navigator.serviceWorker.ready
      const existing = await registration.pushManager.getSubscription()
      const subscription = existing ?? await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapidKey),
      })

      const json = subscription.toJSON() as {
        endpoint: string
        keys: { p256dh: string; auth: string }
      }

      await fetch("/api/push-subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          endpoint: json.endpoint,
          p256dh: json.keys.p256dh,
          auth: json.keys.auth,
        }),
      })
    } catch {
      // Push is optional — fail silently
    }
  }

  const handleRequestPush = async () => {
    setShowPushBanner(false)
    const permission = await Notification.requestPermission()
    if (permission === "granted") {
      await subscribeUserToPush()
    } else {
      localStorage.setItem("zampesicure_push_dismissed", "true")
    }
  }

  const handleDismissPush = () => {
    setShowPushBanner(false)
    localStorage.setItem("zampesicure_push_dismissed", "true")
  }

  const handleInstall = async () => {
    if (!deferredPrompt) return
    await deferredPrompt.prompt()
    const { outcome } = await deferredPrompt.userChoice
    if (outcome === "accepted") setShowInstallBanner(false)
    setDeferredPrompt(null)
  }

  const handleDismissInstall = () => {
    setShowInstallBanner(false)
    localStorage.setItem("zampesicure_pwa_dismissed", Date.now().toString())
  }

  return (
    <>
      {/* Push Notification Banner */}
      {showPushBanner && (
        <div className="fixed bottom-0 left-0 right-0 z-[70] border-t border-border bg-card shadow-xl">
          <div className="container mx-auto flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10">
                <Bell className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-sm font-semibold text-foreground">
                  Attiva le notifiche push
                </p>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  Ricevi un avviso immediato quando l&apos;AI trova un possibile match per il tuo animale smarrito.
                </p>
              </div>
            </div>
            <div className="flex shrink-0 items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleDismissPush}
                className="gap-1.5 text-xs"
              >
                <BellOff className="h-3.5 w-3.5" />
                Non ora
              </Button>
              <Button size="sm" onClick={handleRequestPush} className="gap-1.5 text-xs">
                <Bell className="h-3.5 w-3.5" />
                Attiva notifiche
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Install Banner */}
      {showInstallBanner && !showPushBanner && (
        <div className="fixed bottom-0 left-0 right-0 z-[70] border-t border-border bg-card shadow-xl">
          <div className="container mx-auto flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10">
                <Download className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-sm font-semibold text-foreground">Installa ZampeSicure</p>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  Aggiungi l&apos;app alla home del tuo telefono per un accesso rapido e notifiche push.
                </p>
              </div>
            </div>
            <div className="flex shrink-0 items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleDismissInstall}
                className="gap-1.5 text-xs"
              >
                <X className="h-3.5 w-3.5" />
                Non ora
              </Button>
              <Button size="sm" onClick={handleInstall} className="gap-1.5 text-xs">
                <Download className="h-3.5 w-3.5" />
                Installa
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
