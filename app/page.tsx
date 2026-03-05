import { Header } from "@/components/header"
import { Hero } from "@/components/hero"
import { RecentReports } from "@/components/recent-reports"
import { HomeMap } from "@/components/home-map"
import { Footer } from "@/components/footer"

export default function HomePage() {
  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1">
        <Hero />
        <HomeMap />
        <RecentReports />
      </main>
      <Footer />
    </div>
  )
}
