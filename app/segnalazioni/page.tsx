"use client"

import { useState, useEffect } from "react"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { ReportCard } from "@/components/report-card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { createClient } from "@/lib/supabase/client"
import type { AnimalType, ReportType, Report } from "@/lib/types"
import { Search, Dog, Cat, Bird, Filter, X, Loader2 } from "lucide-react"

export default function SegnalazioniPage() {
  const [reports, setReports] = useState<Report[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedReportType, setSelectedReportType] = useState<ReportType | null>(null)
  const [selectedAnimalType, setSelectedAnimalType] = useState<AnimalType | null>(null)
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

  const filteredReports = reports.filter((report) => {
    const matchesSearch =
      searchTerm === "" ||
      report.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      report.city.toLowerCase().includes(searchTerm.toLowerCase()) ||
      report.address.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (report.animal_name &&
        report.animal_name.toLowerCase().includes(searchTerm.toLowerCase()))

    const matchesReportType =
      selectedReportType === null || report.report_type === selectedReportType

    const matchesAnimalType =
      selectedAnimalType === null || report.animal_type === selectedAnimalType

    return matchesSearch && matchesReportType && matchesAnimalType
  })

  const clearFilters = () => {
    setSearchTerm("")
    setSelectedReportType(null)
    setSelectedAnimalType(null)
  }

  const hasActiveFilters =
    searchTerm !== "" || selectedReportType !== null || selectedAnimalType !== null

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1 py-8">
        <div className="container mx-auto px-4">
          <div className="mb-8">
            <h1 className="mb-2 text-3xl font-bold text-foreground">
              Tutte le Segnalazioni
            </h1>
            <p className="text-muted-foreground">
              Cerca tra gli animali smarriti e avvistati in tutta Italia
            </p>
          </div>

          {/* Filters */}
          <div className="mb-8 space-y-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Cerca per nome, descrizione, città..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Filter Buttons */}
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Filter className="h-4 w-4" />
                <span>Filtri:</span>
              </div>

              {/* Report Type Filters */}
              <div className="flex gap-2">
                <Button
                  variant={selectedReportType === "smarrito" ? "default" : "outline"}
                  size="sm"
                  onClick={() =>
                    setSelectedReportType(
                      selectedReportType === "smarrito" ? null : "smarrito"
                    )
                  }
                  className={
                    selectedReportType === "smarrito"
                      ? "bg-destructive hover:bg-destructive/90 text-destructive-foreground"
                      : ""
                  }
                >
                  Ho Smarrito
                </Button>
                <Button
                  variant={selectedReportType === "avvistato" ? "default" : "outline"}
                  size="sm"
                  onClick={() =>
                    setSelectedReportType(
                      selectedReportType === "avvistato" ? null : "avvistato"
                    )
                  }
                  className={
                    selectedReportType === "avvistato"
                      ? "bg-accent hover:bg-accent/90 text-accent-foreground"
                      : ""
                  }
                >
                  Ho Avvistato
                </Button>
              </div>

              <div className="h-6 w-px bg-border" />

              {/* Animal Type Filters */}
              <div className="flex gap-2">
                <Button
                  variant={selectedAnimalType === "cane" ? "default" : "outline"}
                  size="sm"
                  onClick={() =>
                    setSelectedAnimalType(
                      selectedAnimalType === "cane" ? null : "cane"
                    )
                  }
                  className="gap-1"
                >
                  <Dog className="h-4 w-4" />
                  Cane
                </Button>
                <Button
                  variant={selectedAnimalType === "gatto" ? "default" : "outline"}
                  size="sm"
                  onClick={() =>
                    setSelectedAnimalType(
                      selectedAnimalType === "gatto" ? null : "gatto"
                    )
                  }
                  className="gap-1"
                >
                  <Cat className="h-4 w-4" />
                  Gatto
                </Button>
                <Button
                  variant={selectedAnimalType === "volatile" ? "default" : "outline"}
                  size="sm"
                  onClick={() =>
                    setSelectedAnimalType(
                      selectedAnimalType === "volatile" ? null : "volatile"
                    )
                  }
                  className="gap-1"
                >
                  <Bird className="h-4 w-4" />
                  Volatile
                </Button>
              </div>

              {hasActiveFilters && (
                <>
                  <div className="h-6 w-px bg-border" />
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={clearFilters}
                    className="gap-1 text-muted-foreground"
                  >
                    <X className="h-4 w-4" />
                    Cancella filtri
                  </Button>
                </>
              )}
            </div>

            {/* Results count */}
            <div className="flex items-center gap-2">
              <Badge variant="secondary">
                {filteredReports.length} risultat
                {filteredReports.length === 1 ? "o" : "i"}
              </Badge>
            </div>
          </div>

          {/* Results Grid */}
          {loading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : filteredReports.length > 0 ? (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {filteredReports.map((report) => (
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
                <Search className="h-8 w-8 text-muted-foreground" />
              </div>
              <h3 className="mb-2 text-lg font-semibold text-foreground">
                Nessun risultato trovato
              </h3>
              <p className="text-muted-foreground">
                {reports.length === 0
                  ? "Non ci sono ancora segnalazioni. Sii il primo a segnalare!"
                  : "Prova a modificare i filtri o il termine di ricerca"}
              </p>
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  )
}