import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { createClient } from "@/lib/supabase/server"

export const metadata = {
  title: "Regolamento - ZampeSicure",
  description: "Regolamento e termini di utilizzo di ZampeSicure",
}

export default async function RegolamentoPage() {
  const supabase = await createClient()
  
  // Fetch custom rules from database if exists
  const { data: settings } = await supabase
    .from("settings")
    .select("value")
    .eq("key", "regolamento")
    .single()
  
  const customRules = settings?.value || null

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Header />
      <main className="flex-1 py-12">
        <div className="container mx-auto px-4">
          <Card className="mx-auto max-w-4xl">
            <CardHeader>
              <CardTitle className="text-3xl">Regolamento</CardTitle>
              <p className="text-muted-foreground">Termini e condizioni di utilizzo di ZampeSicure</p>
            </CardHeader>
            <CardContent className="prose prose-sm max-w-none text-foreground">
              
              {/* Custom rules from admin panel */}
              {customRules && (
                <div className="mb-8 rounded-lg bg-primary/10 p-6">
                  <h2 className="text-xl font-semibold mb-3 text-primary">Avvisi Importanti</h2>
                  <div
                    className="prose prose-sm max-w-none text-foreground"
                    dangerouslySetInnerHTML={{ __html: customRules }}
                  />
                </div>
              )}

              <h2 className="text-xl font-semibold mt-6 mb-3">1. Accettazione dei Termini</h2>
              <p className="mb-4 text-muted-foreground">
                Utilizzando ZampeSicure, l'utente accetta integralmente il presente regolamento.
                La registrazione e l'utilizzo del servizio implicano l'accettazione di tutte le
                condizioni qui riportate.
              </p>

              <h2 className="text-xl font-semibold mt-6 mb-3">2. Scopo del Servizio</h2>
              <p className="mb-4 text-muted-foreground">
                ZampeSicure e una piattaforma gratuita che permette di segnalare animali smarriti
                o ritrovati nella provincia di Trapani, con l'obiettivo di facilitare il ricongiungimento
                degli animali con i loro proprietari.
              </p>

              <h2 className="text-xl font-semibold mt-6 mb-3">3. Registrazione e Account</h2>
              <ul className="list-disc pl-6 mb-4 text-muted-foreground space-y-2">
                <li>L'utente deve fornire dati veritieri e aggiornati durante la registrazione</li>
                <li>L'account e personale e non cedibile a terzi</li>
                <li>L'utente e responsabile della sicurezza delle proprie credenziali</li>
                <li>E vietato creare account multipli o falsi</li>
              </ul>

              <h2 className="text-xl font-semibold mt-6 mb-3">4. Pubblicazione delle Segnalazioni</h2>
              <p className="mb-4 text-muted-foreground">
                Le segnalazioni devono rispettare le seguenti regole:
              </p>
              <ul className="list-disc pl-6 mb-4 text-muted-foreground space-y-2">
                <li>Devono riguardare esclusivamente animali smarriti o ritrovati</li>
                <li>Le informazioni fornite devono essere veritiere e accurate</li>
                <li>Le immagini devono essere pertinenti e non offensive</li>
                <li>E vietato pubblicare segnalazioni false o fraudolente</li>
                <li>E vietato pubblicare contenuti offensivi, diffamatori o illegali</li>
              </ul>

              <h2 className="text-xl font-semibold mt-6 mb-3">5. Comportamento degli Utenti</h2>
              <p className="mb-4 text-muted-foreground">
                Gli utenti si impegnano a:
              </p>
              <ul className="list-disc pl-6 mb-4 text-muted-foreground space-y-2">
                <li>Utilizzare la piattaforma in modo corretto e responsabile</li>
                <li>Non utilizzare il servizio per scopi illegali o fraudolenti</li>
                <li>Non molestare o offendere altri utenti</li>
                <li>Non pubblicare spam o contenuti pubblicitari non autorizzati</li>
                <li>Rispettare la privacy degli altri utenti</li>
              </ul>

              <h2 className="text-xl font-semibold mt-6 mb-3">6. Messaggi Privati</h2>
              <p className="mb-4 text-muted-foreground">
                Il sistema di messaggistica privata deve essere utilizzato esclusivamente per
                comunicazioni relative alle segnalazioni. E vietato:
              </p>
              <ul className="list-disc pl-6 mb-4 text-muted-foreground space-y-2">
                <li>Inviare messaggi offensivi o minacciosi</li>
                <li>Utilizzare la messaggistica per spam o pubblicita</li>
                <li>Richiedere pagamenti o compensi non leciti</li>
              </ul>

              <h2 className="text-xl font-semibold mt-6 mb-3">7. Violazioni e Sanzioni</h2>
              <p className="mb-4 text-muted-foreground">
                In caso di violazione del presente regolamento, ZampeSicure si riserva il diritto di:
              </p>
              <ul className="list-disc pl-6 mb-4 text-muted-foreground space-y-2">
                <li>Rimuovere le segnalazioni che violano le regole</li>
                <li>Sospendere temporaneamente l'account dell'utente</li>
                <li>Bannare permanentemente l'utente dalla piattaforma</li>
                <li>Segnalare alle autorita competenti eventuali illeciti</li>
              </ul>

              <h2 className="text-xl font-semibold mt-6 mb-3">8. Limitazione di Responsabilita</h2>
              <p className="mb-4 text-muted-foreground">
                ZampeSicure non e responsabile per:
              </p>
              <ul className="list-disc pl-6 mb-4 text-muted-foreground space-y-2">
                <li>La veridicita delle informazioni pubblicate dagli utenti</li>
                <li>Eventuali danni derivanti dall'utilizzo della piattaforma</li>
                <li>Interruzioni del servizio dovute a cause tecniche o di forza maggiore</li>
                <li>Comportamenti illeciti degli utenti</li>
              </ul>

              <h2 className="text-xl font-semibold mt-6 mb-3">9. Modifiche al Regolamento</h2>
              <p className="mb-4 text-muted-foreground">
                ZampeSicure si riserva il diritto di modificare il presente regolamento in qualsiasi
                momento. Le modifiche saranno comunicate agli utenti e pubblicate su questa pagina.
                L'uso continuato del servizio dopo le modifiche implica l'accettazione delle nuove condizioni.
              </p>

              <h2 className="text-xl font-semibold mt-6 mb-3">10. Contatti</h2>
              <p className="mb-4 text-muted-foreground">
                Per segnalazioni, reclami o informazioni relative al presente regolamento,
                e possibile contattare l'amministrazione attraverso i canali indicati sulla piattaforma.
              </p>

              <div className="mt-8 rounded-lg bg-destructive/10 p-4 border border-destructive/20">
                <p className="text-sm font-semibold text-destructive">
                  ATTENZIONE: I dati inseriti devono essere veritieri. La pubblicazione di informazioni
                  false comportera la rimozione delle segnalazioni e il ban permanente dalla piattaforma.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
      <Footer />
    </div>
  )
}
