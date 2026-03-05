import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import Link from 'next/link'
import { PawPrint, AlertTriangle } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ error: string }>
}) {
  const params = await searchParams

  return (
    <div className="flex min-h-svh w-full items-center justify-center bg-background p-6 md:p-10">
      <div className="w-full max-w-sm">
        <div className="flex flex-col gap-6">
          <Link href="/" className="mx-auto flex items-center gap-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary">
              <PawPrint className="h-5 w-5 text-primary-foreground" />
            </div>
            <span className="text-xl font-bold text-foreground">ZampeSicure</span>
          </Link>
          <Card>
            <CardHeader className="text-center">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-destructive/20">
                <AlertTriangle className="h-8 w-8 text-destructive" />
              </div>
              <CardTitle className="text-2xl">
                Ops, qualcosa e andato storto
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {params?.error ? (
                <p className="text-center text-sm text-muted-foreground">
                  Errore: {params.error}
                </p>
              ) : (
                <p className="text-center text-sm text-muted-foreground">
                  Si e verificato un errore durante l'autenticazione.
                </p>
              )}
              <div className="flex justify-center gap-2">
                <Button asChild variant="outline">
                  <Link href="/auth/login">Riprova</Link>
                </Button>
                <Button asChild>
                  <Link href="/">Torna alla home</Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
