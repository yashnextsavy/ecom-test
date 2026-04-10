import nodemailer from "nodemailer"

const SMTP_HOST = process.env.SMTP_HOST || ""
const SMTP_PORT = Number(process.env.SMTP_PORT || "587")
const SMTP_USER = process.env.SMTP_USER || ""
const SMTP_PASS = process.env.SMTP_PASS || ""
const SMTP_FROM = process.env.SMTP_FROM || SMTP_USER
const SMTP_SECURE =
  typeof process.env.SMTP_SECURE === "string"
    ? ["true", "1", "yes", "on"].includes(process.env.SMTP_SECURE.trim().toLowerCase())
    : SMTP_PORT === 465

let transporter: nodemailer.Transporter | null = null

const getTransporter = () => {
  if (transporter) return transporter

  if (!SMTP_HOST || !SMTP_USER || !SMTP_PASS) {
    throw new Error("SMTP is not configured. Set SMTP_HOST, SMTP_USER, SMTP_PASS.")
  }

  transporter = nodemailer.createTransport({
    host: SMTP_HOST,
    port: SMTP_PORT,
    secure: SMTP_SECURE,
    auth: {
      user: SMTP_USER,
      pass: SMTP_PASS,
    },
  })

  return transporter
}

export const sendEmail = async (input: {
  to: string
  subject: string
  text: string
  html?: string
  attachments?: nodemailer.SendMailOptions["attachments"]
}) => {
  const transport = getTransporter()

  await transport.sendMail({
    from: SMTP_FROM,
    to: input.to,
    subject: input.subject,
    text: input.text,
    html: input.html,
    attachments: input.attachments,
  })
}
