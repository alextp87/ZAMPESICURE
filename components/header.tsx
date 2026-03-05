"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { createClient } from "@/lib/supabase/client"
import { Plus, MapPin, User, LogOut, Inbox, Menu, Shield, MessageCircle, Heart, Handshake } from "lucide-react"
import Image from "next/image"
import type { User as SupabaseUser } from "@supabase/supabase-js"

export function Header() {
  const router = useRouter()
  const [user, setUser] = useState<SupabaseUser | null>(null)
  const [isAdmin, setIsAdmin] = useState(false)
  const [isModerator, setIsModerator] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  useEffect(() => {
    const supabase = createClient()
    
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      setUser(user)
      
      if (user) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("is_admin, is_moderator, is_banned, suspended_until, suspension_reason")
          .eq("id", user.id)
          .single()
        
        // If user is banned, sign them out
        if (profile?.is_banned) {
          await supabase.auth.signOut()
          setUser(null)
          setIsAdmin(false)
          alert("Il tuo account e stato bannato dalla piattaforma.")
          router.push("/")
          return
        }

        // If user is suspended, check if suspension has expired
        if (profile?.suspended_until) {
          const suspendedUntil = new Date(profile.suspended_until)
          if (suspendedUntil > new Date()) {
            await supabase.auth.signOut()
            setUser(null)
            setIsAdmin(false)
            const formattedDate = suspendedUntil.toLocaleDateString("it-IT", {
              day: "2-digit",
              month: "long",
              year: "numeric",
            })
            alert(`Il tuo account e sospeso fino al ${formattedDate}.\nMotivo: ${profile.suspension_reason || "Violazione delle regole"}`)
            router.push("/")
            return
          } else {
            // Suspension has expired, clear it
            await supabase
              .from("profiles")
              .update({ suspended_until: null, suspension_reason: null })
              .eq("id", user.id)
          }
        }
        
        setIsAdmin(profile?.is_admin ?? false)
        setIsModerator(profile?.is_moderator ?? false)
      }
    }
    
    getUser()

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
      if (!session?.user) {
        setIsAdmin(false)
        setIsModerator(false)
      }
    })

    return () => subscription.unsubscribe()
  }, [router])

  const handleLogout = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push("/")
    router.refresh()
  }

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border bg-white">
      <div className="container mx-auto flex min-h-[100px] items-center justify-between px-4">
        <Link href="/" className="flex items-center">
          <Image
            src="/logo.png"
            alt="ZampeSicure"
            width={240}
            height={240}
            className="w-[140px] sm:w-[200px] md:w-[240px]"
            priority
            unoptimized
          />
        </Link>

        <nav className="hidden items-center gap-6 md:flex">
          <Link
            href="/"
            className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
          >
            Home
          </Link>
          <Link
            href="/segnalazioni"
            className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
          >
            Segnalazioni
          </Link>
          <Link
            href="/mappa"
            className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
          >
            <span className="flex items-center gap-1">
              <MapPin className="h-4 w-4" />
              Mappa
            </span>
          </Link>
          {user && (
            <Link
              href="/per-il-mio-pet"
              className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              <span className="flex items-center gap-1">
                <Heart className="h-4 w-4" />
                Per il mio Pet
              </span>
            </Link>
          )}
          <Link
            href="/diventa-partner"
            className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
          >
            <span className="flex items-center gap-1">
              <Handshake className="h-4 w-4" />
              Partner
            </span>
          </Link>
          {isModerator && !isAdmin && (
            <Link
              href="/mod"
              className="flex items-center gap-1 text-sm font-bold text-blue-600 transition-colors hover:text-blue-500"
            >
              <Shield className="h-4 w-4" />
              MOD
            </Link>
          )}
          {isAdmin && (
            <Link
              href="/admin"
              className="flex items-center gap-1 text-sm font-bold text-primary transition-colors hover:text-primary/80"
            >
              <Shield className="h-4 w-4" />
              ADM
            </Link>
          )}
        </nav>

        <div className="flex items-center gap-3">
          {user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="gap-2">
                  <User className="h-4 w-4" />
                  <span className="hidden sm:inline">Account</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <div className="px-2 py-1.5 text-sm text-muted-foreground">
                  {user.email}
                </div>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link href="/profilo" className="cursor-pointer">
                    <User className="mr-2 h-4 w-4" />
                    Il mio profilo
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/mie-segnalazioni" className="cursor-pointer">
                    <Inbox className="mr-2 h-4 w-4" />
                    Le mie segnalazioni
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/messaggi" className="cursor-pointer">
                    <MessageCircle className="mr-2 h-4 w-4" />
                    Messaggi
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/per-il-mio-pet" className="cursor-pointer">
                    <Heart className="mr-2 h-4 w-4" />
                    Per il mio Pet
                  </Link>
                </DropdownMenuItem>
                {isModerator && !isAdmin && (
                  <DropdownMenuItem asChild>
                    <Link href="/mod" className="cursor-pointer">
                      <Shield className="mr-2 h-4 w-4" />
                      Pannello Moderatore
                    </Link>
                  </DropdownMenuItem>
                )}
                {isAdmin && (
                  <DropdownMenuItem asChild>
                    <Link href="/admin" className="cursor-pointer">
                      <Shield className="mr-2 h-4 w-4" />
                      Pannello Admin
                    </Link>
                  </DropdownMenuItem>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout} className="cursor-pointer text-destructive">
                  <LogOut className="mr-2 h-4 w-4" />
                  Esci
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Link href="/auth/login">
              <Button variant="outline" size="sm" className="gap-2">
                <User className="h-4 w-4" />
                <span className="hidden sm:inline">Accedi</span>
              </Button>
            </Link>
          )}

          <Link href="/nuova-segnalazione">
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              <span className="hidden sm:inline">Nuova Segnalazione</span>
              <span className="sm:hidden">Segnala</span>
            </Button>
          </Link>

          {/* Mobile menu */}
          <Button
            variant="ghost"
            size="sm"
            className="md:hidden"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            <Menu className="h-5 w-5" />
          </Button>
        </div>
      </div>

      {/* Mobile navigation */}
      {mobileMenuOpen && (
        <div className="border-t border-border bg-background px-4 py-4 md:hidden">
          <nav className="flex flex-col gap-3">
            <Link
              href="/"
              className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
              onClick={() => setMobileMenuOpen(false)}
            >
              Home
            </Link>
            <Link
              href="/segnalazioni"
              className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
              onClick={() => setMobileMenuOpen(false)}
            >
              Segnalazioni
            </Link>
            <Link
              href="/mappa"
              className="flex items-center gap-1 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
              onClick={() => setMobileMenuOpen(false)}
            >
              <MapPin className="h-4 w-4" />
              Mappa
            </Link>
            <Link
              href="/diventa-partner"
              className="flex items-center gap-1 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
              onClick={() => setMobileMenuOpen(false)}
            >
              <Handshake className="h-4 w-4" />
              Partner
            </Link>
            {user && (
              <>
                <Link
                  href="/profilo"
                  className="flex items-center gap-1 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <User className="h-4 w-4" />
                  Il mio profilo
                </Link>
                <Link
                  href="/mie-segnalazioni"
                  className="flex items-center gap-1 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <Inbox className="h-4 w-4" />
                  Le mie segnalazioni
                </Link>
                <Link
                  href="/per-il-mio-pet"
                  className="flex items-center gap-1 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <Heart className="h-4 w-4" />
                  Per il mio Pet
                </Link>
                <Link
                  href="/messaggi"
                  className="flex items-center gap-1 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <MessageCircle className="h-4 w-4" />
                  Messaggi
                </Link>
                {isModerator && !isAdmin && (
                  <Link
                    href="/mod"
                    className="flex items-center gap-1 text-sm font-medium text-blue-600 transition-colors hover:text-blue-500"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <Shield className="h-4 w-4" />
                    Pannello Moderatore
                  </Link>
                )}
                {isAdmin && (
                  <Link
                    href="/admin"
                    className="flex items-center gap-1 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <Shield className="h-4 w-4" />
                    Pannello Admin
                  </Link>
                )}
              </>
            )}
          </nav>
        </div>
      )}
    </header>
  )
}
