import { Heart } from "lucide-react"
import Link from "next/link"
import Image from "next/image"

export function Footer() {
  return (
    <footer className="border-t border-border bg-card py-12">
      <div className="container mx-auto px-4">
        <div className="flex flex-col items-center justify-between gap-6 md:flex-row">
          <Link href="/">
            <Image
              src="/logo.png"
              alt="ZampeSicure"
              width={120}
              height={120}
              className="w-[120px]"
              unoptimized
            />
          </Link>

          <nav className="flex flex-wrap items-center justify-center gap-6">
            <Link href="/" className="text-sm text-muted-foreground hover:text-foreground">
              Home
            </Link>
            <Link href="/segnalazioni" className="text-sm text-muted-foreground hover:text-foreground">
              Segnalazioni
            </Link>
            <Link href="/mappa" className="text-sm text-muted-foreground hover:text-foreground">
              Mappa
            </Link>
            <Link href="/nuova-segnalazione" className="text-sm text-muted-foreground hover:text-foreground">
              Nuova Segnalazione
            </Link>
            <Link href="/regolamento" className="text-sm font-medium text-muted-foreground hover:text-foreground uppercase tracking-wide">
              Regolamento
            </Link>
            <Link href="/privacy" className="text-sm font-medium text-muted-foreground hover:text-foreground uppercase tracking-wide">
              Privacy Policy
            </Link>
            <Link href="/contatti" className="text-sm font-medium text-muted-foreground hover:text-foreground uppercase tracking-wide">
              Contatti
            </Link>
          </nav>

        </div>

        <div className="mt-8 border-t border-border pt-8 text-center">
          <p className="text-sm text-muted-foreground">
            2026 ZampeSicure® by{" "}
            <a
              href="https://www.facebook.com/alexinotp87"
              target="_blank"
              rel="noopener noreferrer"
              className="font-medium hover:text-foreground transition-colors"
            >
              Alessandro Di Giorgio
            </a>
            . Tutti i diritti riservati.
          </p>
        </div>
      </div>
    </footer>
  )
}
