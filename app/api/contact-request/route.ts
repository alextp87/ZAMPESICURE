import { createClient } from "@supabase/supabase-js"
import { NextResponse } from "next/server"
import { sendMail } from "@/lib/mailer"

export async function POST(request: Request) {
  const { name, email, phone, message } = await request.json()

  if (!name || !email || !message) {
    return NextResponse.json({ error: "Tutti i campi sono obbligatori" }, { status: 400 })
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const { error } = await supabase.from("contact_requests").insert({
    name,
    email,
    subject: phone ? `Tel: ${phone}` : "Contatto dal sito",
    message,
  })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  // Notifica all'admin
  try {
    await sendMail({
      to: process.env.SMTP_USER!,
      subject: `[Contatto] Nuovo messaggio da ${name}`,
      replyTo: email,
      html: `
        <div style="font-family:sans-serif;max-width:600px;margin:0 auto;">
          <h2 style="color:#ea580c;">Nuova richiesta di contatto</h2>
          <table style="width:100%;border-collapse:collapse;">
            <tr><td style="padding:8px;font-weight:bold;">Nome:</td><td style="padding:8px;">${name}</td></tr>
            <tr><td style="padding:8px;font-weight:bold;">Email:</td><td style="padding:8px;"><a href="mailto:${email}">${email}</a></td></tr>
            ${phone ? `<tr><td style="padding:8px;font-weight:bold;">Telefono:</td><td style="padding:8px;"><a href="tel:${phone}">${phone}</a></td></tr>` : ""}
          </table>
          <div style="margin-top:16px;padding:16px;background:#f5f5f5;border-radius:8px;">
            <p style="margin:0;white-space:pre-wrap;">${message}</p>
          </div>
          <p style="margin-top:16px;color:#666;font-size:12px;">
            Rispondi direttamente a questa email per contattare ${name}.
          </p>
        </div>
      `,
    })

    // Conferma all'utente
    await sendMail({
      to: email,
      subject: "Abbiamo ricevuto il tuo messaggio - ZampeSicure",
      html: `
        <div style="font-family:sans-serif;max-width:600px;margin:0 auto;">
          <h2 style="color:#ea580c;">Grazie, ${name}!</h2>
          <p>Abbiamo ricevuto il tuo messaggio e ti risponderemo il prima possibile.</p>
          <div style="margin-top:16px;padding:16px;background:#f5f5f5;border-radius:8px;">
            <p style="margin:0;font-weight:bold;">Il tuo messaggio:</p>
            <p style="margin-top:8px;white-space:pre-wrap;">${message}</p>
          </div>
          <p style="margin-top:24px;color:#666;font-size:12px;">
            ZampeSicure &mdash; <a href="https://zampe-sicure.it">zampe-sicure.it</a>
          </p>
        </div>
      `,
    })
  } catch (mailErr) {
    // L'email non blocca la risposta
    console.error("Mail error:", mailErr)
  }

  return NextResponse.json({ success: true })
}
