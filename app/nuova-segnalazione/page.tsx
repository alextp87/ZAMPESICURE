import { Suspense } from "react"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { ReportForm } from "@/components/report-form"

export const metadata = {
  title: "Nuova Segnalazione - ZampeSicure",
  description: "Segnala un animale smarrito o avvistato in tutta Italia",
}

export default function NuovaSegnalazionePage() {
  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1 py-8">
        <div className="container mx-auto px-4">
          <Suspense fallback={<div className="text-center">Caricamento...</div>}>
            <ReportForm />
          </Suspense>
        </div>
      </main>
      <Footer />
    </div>
  )
}