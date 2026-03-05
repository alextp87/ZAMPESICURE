import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { createClient } from "@/lib/supabase/server"

export const metadata = {
  title: "Privacy Policy - ZampeSicure",
  description: "Informativa sulla privacy di ZampeSicure",
}

async function getPrivacyPolicy() {
  const supabase = await createClient()
  const { data } = await supabase
    .from("settings")
    .select("value")
    .eq("key", "privacy_policy")
    .single()
  
  return data?.value || null
}

export default async function PrivacyPolicyPage() {
  const customPrivacy = await getPrivacyPolicy()

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Header />
      <main className="flex-1 py-12">
        <div className="container mx-auto px-4">
          <Card className="mx-auto max-w-4xl">
            <CardHeader>
              <CardTitle className="text-3xl">Privacy Policy</CardTitle>
              <p className="text-muted-foreground">Ultimo aggiornamento: Febbraio 2026</p>
            </CardHeader>
            <CardContent className="prose prose-sm max-w-none text-foreground">
              {customPrivacy ? (
                <div dangerouslySetInnerHTML={{ __html: customPrivacy }} className="space-y-4 [&_h2]:text-xl [&_h2]:font-semibold [&_h2]:mt-6 [&_h2]:mb-3 [&_p]:mb-4 [&_p]:text-muted-foreground [&_ul]:list-disc [&_ul]:pl-6 [&_ul]:mb-4 [&_ul]:text-muted-foreground [&_li]:mb-2" />
              ) : (
                <>
              <h2 className="text-xl font-semibold mt-6 mb-3">1. Titolare del Trattamento</h2>
              <p className="mb-4 text-muted-foreground">
                Il titolare del trattamento dei dati personali e ZampeSicure, con sede nella provincia di Trapani.
                Per qualsiasi informazione relativa al trattamento dei dati personali, e possibile contattarci
                tramite i canali indicati nella sezione contatti.
              </p>

              <h2 className="text-xl font-semibold mt-6 mb-3">2. Dati Raccolti</h2>
              <p className="mb-4 text-muted-foreground">
                ZampeSicure raccoglie i seguenti dati personali:
              </p>
              <ul className="list-disc pl-6 mb-4 text-muted-foreground space-y-2">
                <li><strong>Dati di registrazione:</strong> nome, cognome, indirizzo email</li>
                <li><strong>Dati delle segnalazioni:</strong> descrizione dell'animale, posizione geografica, indirizzo, numero di telefono (opzionale)</li>
                <li><strong>Dati di navigazione:</strong> indirizzo IP, tipo di browser, pagine visitate</li>
                <li><strong>Dati di geolocalizzazione:</strong> coordinate GPS (solo con consenso esplicito)</li>
              </ul>

              <h2 className="text-xl font-semibold mt-6 mb-3">3. Finalita del Trattamento</h2>
              <p className="mb-4 text-muted-foreground">
                I dati personali sono trattati per le seguenti finalita:
              </p>
              <ul className="list-disc pl-6 mb-4 text-muted-foreground space-y-2">
                <li>Gestione delle segnalazioni di animali smarriti e ritrovati</li>
                <li>Consentire la comunicazione tra utenti tramite messaggi privati</li>
                <li>Miglioramento del servizio e analisi statistiche anonime</li>
                <li>Adempimento di obblighi di legge</li>
              </ul>

              <h2 className="text-xl font-semibold mt-6 mb-3">4. Base Giuridica del Trattamento</h2>
              <p className="mb-4 text-muted-foreground">
                Il trattamento dei dati personali si basa su:
              </p>
              <ul className="list-disc pl-6 mb-4 text-muted-foreground space-y-2">
                <li>Consenso dell'interessato (art. 6, par. 1, lett. a del GDPR)</li>
                <li>Esecuzione di un contratto (art. 6, par. 1, lett. b del GDPR)</li>
                <li>Legittimo interesse del titolare (art. 6, par. 1, lett. f del GDPR)</li>
              </ul>

              <h2 className="text-xl font-semibold mt-6 mb-3">5. Conservazione dei Dati</h2>
              <p className="mb-4 text-muted-foreground">
                I dati personali saranno conservati per il tempo strettamente necessario al raggiungimento
                delle finalita per cui sono stati raccolti. In particolare:
              </p>
              <ul className="list-disc pl-6 mb-4 text-muted-foreground space-y-2">
                <li>Dati di registrazione: fino alla cancellazione dell'account</li>
                <li>Segnalazioni: fino a 12 mesi dalla risoluzione o chiusura</li>
                <li>Messaggi: fino a 6 mesi dalla data di invio</li>
              </ul>

              <h2 className="text-xl font-semibold mt-6 mb-3">6. Diritti dell'Interessato</h2>
              <p className="mb-4 text-muted-foreground">
                In conformita al GDPR, l'interessato ha diritto di:
              </p>
              <ul className="list-disc pl-6 mb-4 text-muted-foreground space-y-2">
                <li>Accedere ai propri dati personali</li>
                <li>Rettificare i dati inesatti</li>
                <li>Ottenere la cancellazione dei dati (diritto all'oblio)</li>
                <li>Limitare il trattamento</li>
                <li>Opporsi al trattamento</li>
                <li>Portabilita dei dati</li>
                <li>Revocare il consenso in qualsiasi momento</li>
              </ul>

              <h2 className="text-xl font-semibold mt-6 mb-3">7. Sicurezza dei Dati</h2>
              <p className="mb-4 text-muted-foreground">
                ZampeSicure adotta misure tecniche e organizzative adeguate per proteggere i dati personali
                da accessi non autorizzati, perdita, distruzione o divulgazione. Utilizziamo protocolli
                di crittografia SSL/TLS per la trasmissione dei dati e sistemi di autenticazione sicuri.
              </p>

              <h2 className="text-xl font-semibold mt-6 mb-3">8. Condivisione dei Dati</h2>
              <p className="mb-4 text-muted-foreground">
                I dati personali non saranno venduti, affittati o ceduti a terzi. Potranno essere
                condivisi esclusivamente con:
              </p>
              <ul className="list-disc pl-6 mb-4 text-muted-foreground space-y-2">
                <li>Altri utenti della piattaforma (limitatamente ai dati delle segnalazioni pubbliche)</li>
                <li>Autorita competenti, se richiesto dalla legge</li>
                <li>Fornitori di servizi tecnici (hosting, database) nel rispetto del GDPR</li>
              </ul>

              <h2 className="text-xl font-semibold mt-6 mb-3">9. Cookie</h2>
              <p className="mb-4 text-muted-foreground">
                Il sito utilizza cookie tecnici necessari al funzionamento della piattaforma.
                Non utilizziamo cookie di profilazione o di tracciamento pubblicitario.
              </p>

              <h2 className="text-xl font-semibold mt-6 mb-3">10. Modifiche alla Privacy Policy</h2>
              <p className="mb-4 text-muted-foreground">
                ZampeSicure si riserva il diritto di modificare questa Privacy Policy in qualsiasi momento.
                Le modifiche saranno pubblicate su questa pagina con indicazione della data di ultimo
                aggiornamento.
              </p>
              </>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
      <Footer />
    </div>
  )
}
