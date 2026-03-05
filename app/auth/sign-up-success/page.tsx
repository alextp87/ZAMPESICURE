import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import Link from 'next/link'
import { PawPrint, Mail } from 'lucide-react'

export default function Page() {
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
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-accent/20">
                <Mail className="h-8 w-8 text-accent" />
              </div>
              <CardTitle className="text-2xl">
                Registrazione completata!
              </CardTitle>
              <CardDescription>Controlla la tua email</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-center text-sm text-muted-foreground">
                Ti abbiamo inviato un'email di conferma. Clicca sul link nella email per attivare il tuo account e iniziare a usare ZampeSicure.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
