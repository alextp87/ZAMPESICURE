"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { ReportsMap } from "./reports-map"
import { Button } from "@/components/ui/button"
import { Loader2, MapPin } from "lucide-react"
import Link from "next/link"
import type { Report } from "@/lib/types"

export function HomeMap() {
  const [reports, setReports] = useState<Report[]>([])
  const [loading, setLoading] = useState(true)
  const [isLoggedIn, setIsLoggedIn] = useState(false)

  useEffect(() => {
    const fetchData = async () => {
      const supabase = createClient()

      // Check auth
      const { data: { user } } = await supabase.auth.getUser()
      setIsLoggedIn(!!user)

      // Fetch reports with profiles
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
    <section className="bg-muted/30 py-12 md:py-16">
      <div className="container">
        <div className="mb-8 flex flex-col items-center justify-between gap-4 sm:flex-row">
          <div>
            <h2 className="text-2xl font-bold tracking-tight md:text-3xl">
              Mappa delle Segnalazioni
            </h2>
            <p className="mt-1 text-muted-foreground">
              Visualizza tutti gli animali smarriti e avvistati nella tua zona
            </p>
          </div>
          <Button asChild variant="outline" className="gap-2">
            <Link href="/mappa">
              <MapPin className="h-4 w-4" />
              Apri Mappa Completa
            </Link>
          </Button>
        </div>

        {loading ? (
          <div className="flex h-[400px] items-center justify-center rounded-xl border bg-background">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          <div className="overflow-hidden rounded-xl border shadow-sm">
            <ReportsMap 
              reports={reports} 
              isLoggedIn={isLoggedIn}
            />
          </div>
        )}
      </div>
    </section>
  )
}
