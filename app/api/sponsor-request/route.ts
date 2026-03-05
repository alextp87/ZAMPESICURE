import { createClient } from "@supabase/supabase-js"
import { type NextRequest, NextResponse } from "next/server"
import { sendMail } from "@/lib/mailer"

export async function POST(request: NextRequest) {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const body = await request.json()
  const { company_name, contact_name, contact_email, contact_phone, website, description, services_offered, target_animals } = body

  if (!company_name || !contact_name || !contact_email || !description || !target_animals?.length) {
    return NextResponse.json({ error: "Campi obbligatori mancanti" }, { status: 400 })
  }

  const { error } = await supabase.from("sponsor_requests").insert({
    company_name,
    contact_name,
    contact_email,
    contact_phone: contact_phone || null,
    website: website || null,
    description,
    services_offered: services_offered || null,
    target_animals,
    status: "pending",
  })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  // Notifica all'admin
  try {
    await sendMail({
      to: process.env.SMTP_USER!,
      subject: `[Sponsor] Nuova richiesta da ${company_name}`,
      replyTo: contact_email,
      html: `
        <div style="font-family:sans-serif;max-width:600px;margin:0 auto;">
          <h2 style="color:#ea580c;">Nuova richiesta di sponsorizzazione</h2>
          <table style="width:100%;border-collapse:collapse;">
            <tr><td style="padding:8px;font-weight:bold;">Azienda:</td><td style="padding:8px;">${company_name}</td></tr>
            <tr><td style="padding:8px;font-weight:bold;">Referente:</td><td style="padding:8px;">${contact_name}</td></tr>
            <tr><td style="padding:8px;font-weight:bold;">Email:</td><td style="padding:8px;"><a href="mailto:${contact_email}">${contact_email}</a></td></tr>
            ${contact_phone ? `<tr><td style="padding:8px;font-weight:bold;">Telefono:</td><td style="padding:8px;">${contact_phone}</td></tr>` : ""}
            ${website ? `<tr><td style="padding:8px;font-weight:bold;">Sito:</td><td style="padding:8px;"><a href="${website}">${website}</a></td></tr>` : ""}
            <tr><td style="padding:8px;font-weight:bold;">Animali:</td><td style="padding:8px;">${target_animals.join(", ")}</td></tr>
          </table>
          <div style="margin-top:16px;padding:16px;background:#f5f5f5;border-radius:8px;">
            <p style="margin:0;font-weight:bold;">Descrizione:</p>
            <p style="margin-top:8px;white-space:pre-wrap;">${description}</p>
          </div>
          <p style="margin-top:16px;">
            <a href="https://zampe-sicure.it/admin" style="background:#ea580c;color:white;padding:10px 20px;border-radius:6px;text-decoration:none;">
              Gestisci nel pannello admin
            </a>
          </p>
        </div>
      `,
    })

    // Conferma al richiedente
    await sendMail({
      to: contact_email,
      subject: "Richiesta di sponsorizzazione ricevuta - ZampeSicure",
      html: `
        <div style="font-family:sans-serif;max-width:600px;margin:0 auto;">
          <h2 style="color:#ea580c;">Grazie, ${contact_name}!</h2>
          <p>Abbiamo ricevuto la richiesta di sponsorizzazione per <strong>${company_name}</strong> e la esamineremo al piu presto.</p>
          <p>Ti contatteremo all'indirizzo <strong>${contact_email}</strong> non appena elaborata.</p>
          <p style="margin-top:24px;color:#666;font-size:12px;">
            ZampeSicure &mdash; <a href="https://zampe-sicure.it">zampe-sicure.it</a>
          </p>
        </div>
      `,
    })
  } catch (mailErr) {
    console.error("Mail error:", mailErr)
  }

  return NextResponse.json({ success: true })
}
