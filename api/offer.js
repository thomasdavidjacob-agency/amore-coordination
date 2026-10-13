const { Resend } = require('resend')
const offers = require('../src/_data/offers.js')

const BLOCKED_DOMAINS = [
  't.com', 'test.com', 'example.com', 'mailinator.com', 'guerrillamail.com',
  'tempmail.com', 'throwaway.email', 'trashmail.com', 'yopmail.com',
  'sharklasers.com', 'guerrillamailblock.com', 'grr.la', 'spam4.me',
  'dispostable.com', 'fakeinbox.com', 'maildrop.cc', 'discard.email',
]

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/
const FROM = 'Amore Coordination <amy@amorecoordination.com>'
const AMY = 'Amy@AmoreCoordination.com'

// Simple in-memory rate limit: max 3 claims per IP per 10 minutes
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

function esc(str) {
  return String(str ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
}

function pacificDate(iso) {
  return new Date(iso).toLocaleDateString('en-US', {
    weekday: 'long', month: 'long', day: 'numeric', year: 'numeric',
    timeZone: 'America/Los_Angeles',
  })
}

const row = (label, value) => value
  ? `<tr><td style="padding:8px 0;color:#5c554d;font-size:13px;width:140px;vertical-align:top;"><strong>${label}</strong></td><td style="padding:8px 0;color:#2b2723;">${value}</td></tr>`
  : ''

function guestEmail(offer, safeName, reminder) {
  const deadline = pacificDate(offer.expires)
  const lead = reminder
    ? `A quick reminder that your ${esc(offer.event)} offer ends <strong>${deadline}</strong>.`
    : `Thank you for joining us at ${esc(offer.event)}. Here is your exclusive code, good through <strong>${deadline}</strong>.`
  return `
    <div style="font-family:Georgia,serif;max-width:600px;margin:0 auto;padding:32px;background:#fbf9f4;border-radius:8px;color:#2b2723;">
      <p style="font-size:17px;line-height:1.7;">Hi ${safeName},</p>
      <p style="font-size:17px;line-height:1.7;">${lead}</p>
      <div style="text-align:center;margin:28px 0;padding:24px;border:1px solid #e4dcd2;border-radius:6px;background:#fff;">
        <p style="margin:0 0 6px;font-size:12px;letter-spacing:3px;text-transform:uppercase;color:#5c554d;">${esc(offer.discount)} off ${esc(offer.appliesTo)}</p>
        <p style="margin:0;font-size:30px;letter-spacing:4px;color:#6e3d63;">${esc(offer.code)}</p>
      </div>
      <p style="font-size:17px;line-height:1.7;">Mention your code when you inquire and I'll apply it to your booking. Just reply to this email, or start here: <a href="https://amorecoordination.com/contact/" style="color:#6e3d63;">amorecoordination.com/contact</a></p>
      <p style="font-size:17px;line-height:1.7;">Warmly,<br />Amy Elizabeth Ha<br />Amore Coordination</p>
      <p style="font-size:12px;color:#5c554d;line-height:1.6;margin-top:28px;">Valid for new bookings made by ${deadline}.${offer.combinable ? '' : ' Cannot be combined with other offers or discounts.'}</p>
    </div>
  `
}

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const ip = req.headers['x-forwarded-for']?.split(',')[0]?.trim() || req.socket?.remoteAddress || 'unknown'
  if (!checkRate(ip)) {
    return res.status(429).json({ error: 'Too many attempts. Please wait a few minutes and try again.' })
  }

  const { offer: slug, name, email, phone, weddingDate, utm_source, utm_medium, utm_campaign, _honey, _t } = req.body || {}

  if (_honey) return res.status(200).json({ success: true })
  const elapsed = Date.now() - parseInt(_t, 10)
  if (isNaN(elapsed) || elapsed < 4000 || elapsed > 24 * 3600 * 1000) {
    return res.status(200).json({ success: true })
  }

  const offer = offers.find(o => o.slug === slug)
  if (!offer) return res.status(404).json({ error: 'This offer could not be found.' })

  const expiresAt = new Date(offer.expires).getTime()
  if (Date.now() > expiresAt) {
    return res.status(410).json({ error: 'This offer has ended.' })
  }

  if (!name || name.trim().length < 2 || !email) {
    return res.status(400).json({ error: 'Please enter your name and email.' })
  }
  const domain = email.split('@')[1]?.toLowerCase()
  if (!EMAIL_RE.test(email) || BLOCKED_DOMAINS.includes(domain)) {
    return res.status(400).json({ error: 'Please enter a valid email address.' })
  }

  const resend = new Resend(process.env.RESEND_API_KEY)
  const safeName = esc(name.trim())
  const source = [utm_source, utm_medium, utm_campaign].filter(Boolean).map(esc).join(' / ')

  try {
    // 1. Lead notification to Amy
    const { error: leadErr } = await resend.emails.send({
      from: FROM,
      replyTo: email,
      to: AMY,
      subject: `${offer.event} offer claimed: ${name.replace(/[\r\n]+/g, ' ').trim()}`,
      html: `
        <div style="font-family:Georgia,serif;max-width:600px;margin:0 auto;padding:32px;background:#fbf9f4;border-radius:8px;">
          <h2 style="color:#6e3d63;margin-bottom:24px;font-size:24px;">${esc(offer.event)} Offer Claimed</h2>
          <table style="width:100%;border-collapse:collapse;">
            ${row('Name', safeName)}
            ${row('Email', `<a href="mailto:${esc(email)}" style="color:#6e3d63;">${esc(email)}</a>`)}
            ${row('Phone', esc(phone))}
            ${row('Wedding Date', esc(weddingDate))}
            ${row('Event', esc(offer.event))}
            ${row('Code Given', `${esc(offer.code)} (${esc(offer.discount)} off)`)}
            ${row('Source', source || 'Direct visit')}
          </table>
        </div>
      `,
    })
    if (leadErr) {
      console.error('Resend lead error:', JSON.stringify(leadErr))
      return res.status(500).json({ error: 'Something went wrong. Please try again.' })
    }

    // 2. Confirmation with the code to the guest
    const { error: guestErr } = await resend.emails.send({
      from: FROM,
      replyTo: AMY,
      to: email,
      subject: `Your ${offer.event} code from Amore Coordination`,
      html: guestEmail(offer, safeName, false),
    })
    if (guestErr) console.error('Resend guest error:', JSON.stringify(guestErr))

    // 3. Reminder 72 hours before the deadline. Resend schedules up to 30 days out.
    const remindAt = expiresAt - 72 * 3600 * 1000
    const now = Date.now()
    if (remindAt > now + 3600 * 1000 && remindAt < now + 29 * 86400 * 1000) {
      const { error: remindErr } = await resend.emails.send({
        from: FROM,
        replyTo: AMY,
        to: email,
        subject: `Your ${offer.event} offer ends soon`,
        html: guestEmail(offer, safeName, true),
        scheduledAt: new Date(remindAt).toISOString(),
      })
      if (remindErr) console.error('Resend reminder error:', JSON.stringify(remindErr))
    }

    return res.status(200).json({ success: true, code: offer.code })
  } catch (err) {
    console.error('Offer claim error:', err)
    return res.status(500).json({ error: 'Something went wrong. Please try again.' })
  }
}
