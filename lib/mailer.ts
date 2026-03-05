import nodemailer from "nodemailer"

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT),
  secure: true, // porta 465 = SSL
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
})

export interface MailOptions {
  to: string
  subject: string
  html: string
  replyTo?: string
}

export async function sendMail({ to, subject, html, replyTo }: MailOptions) {
  return transporter.sendMail({
    from: `"ZampeSicure" <${process.env.SMTP_USER}>`,
    to,
    subject,
    html,
    replyTo: replyTo ?? process.env.SMTP_USER,
  })
}
