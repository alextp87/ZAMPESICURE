"use client"

import { useState, useEffect } from "react"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { ReportsMap } from "@/components/reports-map"
import { createClient } from "@/lib/supabase/client"
import type { Report } from "@/lib/types"
import { Loader2, MapPin } from "lucide-react"

export default function MappaPage() {
  const [reports, setReports] = useState<Report[]>([])
  const [loading, setLoading] = useState(true)
  const [isAdmin, setIsAdmin] = useState(false)
  const [isLoggedIn, setIsLoggedIn] = useState(false)

  useEffect(() => {
    const fetchData = async () => {
      const supabase = createClient()
      
      // Check if user is logged in and admin
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        setIsLoggedIn(true)
        const { data: profile } = await supabase
          .from("profiles")
          .select("is_admin")
          .eq("id", user.id)
          .single()
        
        setIsAdmin(profile?.is_admin ?? false)
      }
      
      // Fetch reports with user profile
      const { data, error } = await supabase
        .from("reports")
        .select("*, profiles(first_name, last_name)")
        .eq("status", "active")
        .order("created_at", { ascending: false })

      if (!error && data) {
        setReports(data as Report[])
      }
      setLoading(false)
    }

    fetchData()
  }, [])

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1 py-8">
        <div className="container mx-auto px-4">
          <div className="mb-8">
            <h1 className="mb-2 text-3xl font-bold text-foreground">
              Mappa delle Segnalazioni
            </h1>
            <p className="text-muted-foreground">
              Visualizza gli animali smarriti e avvistati nella provincia di Trapani
            </p>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-32">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : reports.length > 0 ? (
            <ReportsMap reports={reports} isAdmin={isAdmin} isLoggedIn={isLoggedIn} />
          ) : (
            <div className="flex flex-col items-center justify-center rounded-lg border border-dashed py-32 text-center">
              <MapPin className="mb-4 h-12 w-12 text-muted-foreground" />
              <h3 className="mb-2 text-lg font-semibold">Nessuna segnalazione sulla mappa</h3>
              <p className="text-muted-foreground">
                Le segnalazioni appariranno qui una volta create
              </p>
            </div>
          )}

          <div className="mt-8 rounded-lg bg-muted/50 p-6">
            <h2 className="mb-4 text-lg font-semibold text-foreground">
              Come usare la mappa
            </h2>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li className="flex items-start gap-2">
                <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-destructive" />
                <span>
                  I marker <strong className="text-foreground">rossi</strong> indicano animali smarriti
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-accent" />
                <span>
                  I marker <strong className="text-foreground">verdi</strong> indicano animali avvistati
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-primary" />
                <span>
                  Clicca su un marker per vedere i dettagli e inviare un messaggio
                </span>
              </li>
            </ul>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  )
}
