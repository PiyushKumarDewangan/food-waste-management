import nodemailer from 'nodemailer'
import { env } from '../config/env.js'
import { logger } from './logger.js'

/**
 * Single reusable transporter. Works with any standard SMTP provider —
 * Gmail (with an App Password), SendGrid, Mailgun, Amazon SES, Resend's
 * SMTP endpoint, or a local dev catcher like Mailtrap/Ethereal.
 *
 * In development, if SMTP credentials are not configured, emails are
 * logged to the console instead of failing the request — so registration
 * and password-reset flows keep working end-to-end while you're setting
 * up a real provider.
 */
let transporter = null

function getTransporter() {
  if (transporter) return transporter

  if (!env.SMTP_HOST || !env.SMTP_USER || !env.SMTP_PASS) {
    return null
  }

  transporter = nodemailer.createTransport({
    host: env.SMTP_HOST,
    port: env.SMTP_PORT,
    secure: env.SMTP_PORT === 465, // true for port 465, false for 587/25 (STARTTLS)
    auth: {
      user: env.SMTP_USER,
      pass: env.SMTP_PASS,
    },
  })

  return transporter
}

/**
 * @param {Object} options
 * @param {string} options.to
 * @param {string} options.subject
 * @param {string} options.html
 * @param {string} [options.text]
 */
export async function sendEmail({ to, subject, html, text }) {
  const transport = getTransporter()

  if (!transport) {
    // No SMTP configured — fall back to logging so local dev never blocks on this.
    logger.warn('SMTP not configured — logging email instead of sending it.')
    logger.info(`[DEV EMAIL] To: ${to} | Subject: ${subject}\n${text || html}`)
    return { simulated: true }
  }

  const info = await transport.sendMail({
    from: env.SMTP_FROM || `"FoodBridge" <no-reply@foodbridge.org>`,
    to,
    subject,
    html,
    text,
  })

  logger.info(`Email sent to ${to} — messageId: ${info.messageId}`)
  return info
}

export default sendEmail
