import { createClient } from "@/lib/supabase/server"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"

export default async function PrivacyPage() {
  const supabase = await createClient()
  const { data } = await supabase
    .from("settings")
    .select("value")
    .eq("key", "privacy_policy")
    .single()

  const content = data?.value || "Privacy Policy non ancora disponibile."

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Header />
      <main className="container mx-auto max-w-3xl flex-1 px-4 py-12">
        <h1 className="mb-8 text-3xl font-bold text-foreground">Privacy Policy</h1>
        <div className="prose prose-neutral max-w-none rounded-lg border border-border bg-card p-8 text-foreground">
          <div dangerouslySetInnerHTML={{ __html: content }} />
        </div>
      </main>
      <Footer />
    </div>
  )
}
