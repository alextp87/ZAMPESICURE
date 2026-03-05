"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ReportCard } from "@/components/report-card"
import { createClient } from "@/lib/supabase/client"
import type { Report } from "@/lib/types"
import { ArrowRight, Loader2, PawPrint } from "lucide-react"

export function RecentReports() {
  const [reports, setReports] = useState<Report[]>([])
  const [loading, setLoading] = useState(true)
  const [isAdmin, setIsAdmin] = useState(false)
  const [isLoggedIn, setIsLoggedIn] = useState(false)

  const fetchData = async () => {
    const supabase = createClient()

    // Check if user is logged in and admin
    const {
      data: { user },
    } = await supabase.auth.getUser()

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
      .limit(4)

    if (!error && data) {
      setReports(data as Report[])
    }
    setLoading(false)
  }

  useEffect(() => {
    fetchData()
  }, [])

  const handleReportDeleted = () => {
    fetchData()
  }

  return (
    <section className="py-16">
      <div className="container mx-auto px-4">
        <div className="mb-10 flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <h2 className="text-2xl font-bold text-foreground md:text-3xl">
              Ultime Segnalazioni
            </h2>
            <p className="mt-2 text-muted-foreground">
              Gli animali segnalati di recente in tutta Italia
            </p>
          </div>
          <Link href="/segnalazioni">
            <Button variant="outline" className="gap-2">
              Vedi tutte
              <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : reports.length > 0 ? (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {reports.map((report) => (
              <ReportCard
                key={report.id}
                report={report}
                isAdmin={isAdmin}
                isLoggedIn={isLoggedIn}
                onDeleted={handleReportDeleted}
              />
            ))}
          </div>
        ) : (
          <div className="py-16 text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-muted">
              <PawPrint className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="mb-2 text-lg font-semibold text-foreground">
              Nessuna segnalazione ancora
            </h3>
            <p className="mb-4 text-muted-foreground">
              Sii il primo a segnalare un animale smarrito o avvistato!
            </p>
            <Link href="/nuova-segnalazione">
              <Button>Crea la prima segnalazione</Button>
            </Link>
          </div>
        )}
      </div>
    </section>
  )
}