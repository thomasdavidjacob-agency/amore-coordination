const { Resend } = require('resend')

const BLOCKED_DOMAINS = [
  't.com', 'test.com', 'example.com', 'mailinator.com', 'guerrillamail.com',
  'tempmail.com', 'throwaway.email', 'trashmail.com', 'yopmail.com',
  'sharklasers.com', 'guerrillamailblock.com', 'grr.la', 'spam4.me',
  'dispostable.com', 'fakeinbox.com', 'maildrop.cc', 'discard.email',
]

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/

// Simple in-memory rate limit: max 3 submissions per IP per 10 minutes
const ipLog = new Map()
const RATE_WINDOW = 10 * 60 * 1000
const RATE_MAX = 3

function checkRate(ip) {
  const now = Date.now()
  const entry = ipLog.get(ip) || { count: 0, start: now }
  if (now - entry.start > RATE_WINDOW) {
    ipLog.set(ip, { count: 1, start: now })
    return true
  }
  if (entry.count >= RATE_MAX) return false
  entry.count++
  ipLog.set(ip, entry)
  return true
}

// Escape HTML entities to prevent XSS in the email body
function esc(str) {
  return String(str ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
}

// Detect spam-heavy content: excessive URLs or common spam phrases
const SPAM_URL_RE = /https?:\/\//gi
const SPAM_PHRASES = [
  'casino', 'viagra', 'crypto', 'bitcoin', 'nft', 'forex', 'loan offer',
  'make money', 'click here', 'free gift', 'earn $', 'seo service', 'backlink',
  'adult', 'xxx', 'buy now', 'limited time', 'guaranteed',
]

function isSpamContent(text) {
  const lower = text.toLowerCase()
  const urlCount = (text.match(SPAM_URL_RE) || []).length
  if (urlCount > 2) return true
  return SPAM_PHRASES.some(p => lower.includes(p))
}

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  // Rate limiting by IP
  const ip = req.headers['x-forwarded-for']?.split(',')[0]?.trim() || req.socket?.remoteAddress || 'unknown'
  if (!checkRate(ip)) {
    return res.status(429).json({ error: 'Too many submissions. Please wait a few minutes and try again.' })
  }

  const { name, email, phone, weddingDate, venue, message, _honey, _t } = req.body

  // Honeypot — bots fill this, humans don't
  if (_honey) {
    return res.status(200).json({ success: true })
  }

  // Timing check — real humans take at least 4 seconds to fill out a form
  const loadTime = parseInt(_t, 10)
  if (!isNaN(loadTime) && Date.now() - loadTime < 4000) {
    return res.status(200).json({ success: true })
  }

  if (!name || !email || !message) {
    return res.status(400).json({ error: 'Name, email, and message are required.' })
  }

  // Block disposable/fake email domains
  const domain = email.split('@')[1]?.toLowerCase()
  if (!EMAIL_RE.test(email) || BLOCKED_DOMAINS.includes(domain)) {
    return res.status(400).json({ error: 'Please enter a valid email address.' })
  }

  // Minimum length checks
  if (name.trim().length < 2 || message.trim().length < 15) {
    return res.status(400).json({ error: 'Please provide a complete name and message.' })
  }

  // Spam content detection — silently succeed so bots think it worked
  if (isSpamContent(message) || isSpamContent(name)) {
    return res.status(200).json({ success: true })
  }

  const resend = new Resend(process.env.RESEND_API_KEY)

  const safeName    = esc(name)
  const safeEmail   = esc(email)
  const safePhone   = esc(phone)
  const safeDate    = esc(weddingDate)
  const safeVenue   = esc(venue)
  const safeMessage = esc(message).replace(/\n/g, '<br />')

  try {
    const { error } = await resend.emails.send({
      from: 'Amore Coordination <amy@amorecoordination.com>',
      replyTo: email,
      to: 'Amy@AmoreCoordination.com',
      subject: `New Inquiry — ${safeName}`,
      html: `
        <div style="font-family:Georgia,serif;max-width:600px;margin:0 auto;padding:32px;background:#fbf9f4;border-radius:8px;">
          <h2 style="color:#6e3d63;margin-bottom:24px;font-size:24px;">New Wedding Inquiry</h2>
          <table style="width:100%;border-collapse:collapse;">
            <tr><td style="padding:8px 0;color:#5c554d;font-size:13px;width:120px;vertical-align:top;"><strong>Name</strong></td><td style="padding:8px 0;color:#2b2723;">${safeName}</td></tr>
            <tr><td style="padding:8px 0;color:#5c554d;font-size:13px;vertical-align:top;"><strong>Email</strong></td><td style="padding:8px 0;color:#2b2723;"><a href="mailto:${safeEmail}" style="color:#6e3d63;">${safeEmail}</a></td></tr>
            ${safePhone ? `<tr><td style="padding:8px 0;color:#5c554d;font-size:13px;vertical-align:top;"><strong>Phone</strong></td><td style="padding:8px 0;color:#2b2723;">${safePhone}</td></tr>` : ''}
            ${safeDate ? `<tr><td style="padding:8px 0;color:#5c554d;font-size:13px;vertical-align:top;"><strong>Wedding Date</strong></td><td style="padding:8px 0;color:#2b2723;">${safeDate}</td></tr>` : ''}
            ${safeVenue ? `<tr><td style="padding:8px 0;color:#5c554d;font-size:13px;vertical-align:top;"><strong>Venue</strong></td><td style="padding:8px 0;color:#2b2723;">${safeVenue}</td></tr>` : ''}
          </table>
          <hr style="border:none;border-top:1px solid #e4dcd2;margin:24px 0;" />
          <p style="color:#5c554d;font-size:13px;margin-bottom:8px;"><strong>Message</strong></p>
          <p style="color:#2b2723;line-height:1.7;">${safeMessage}</p>
        </div>
      `,
    })

    if (error) {
      console.error('Resend error:', JSON.stringify(error))
      return res.status(500).json({ error: 'Failed to send. Please try again.' })
    }

    return res.status(200).json({ success: true })
  } catch (err) {
    console.error('Contact form error:', err)
    return res.status(500).json({ error: 'Failed to send. Please try again.' })
  }
}
