// Shared spam defences for /api/contact and /api/offer. The leading underscore keeps
// Vercel from deploying this file as its own route.
//
// Layers the routes apply (alongside their own rate limit, honeypot and content filters):
//   - signed form token = time trap (issued by /api/form-token at page load)
//   - Cloudflare Turnstile, verified server-side (TURNSTILE_SECRET_KEY in Vercel env)
//   - link / length validation helpers

const crypto = require('node:crypto')

const MIN_FILL_MS = 3000                 // humans don't fill a form in under 3s
const MAX_TOKEN_AGE_MS = 24 * 3600e3     // a tab left open overnight still works

// HMAC key for form tokens. FORM_SIGNING_SECRET is preferred; the fallbacks are
// existing server-only secrets, used only as a key and never sent anywhere.
function signingKey() {
  return process.env.FORM_SIGNING_SECRET || process.env.RESEND_API_KEY || process.env.TURNSTILE_SECRET_KEY || ''
}

function hmac(value) {
  return crypto.createHmac('sha256', signingKey()).update(value).digest('base64url')
}

function clientIp(req) {
  const fwd = String(req.headers['x-forwarded-for'] || '')
  return (fwd.split(',')[0] || req.headers['x-real-ip'] || req.socket?.remoteAddress || 'unknown').trim()
}

function issueFormToken() {
  const ts = String(Date.now())
  return `${ts}.${hmac(ts)}`
}

// 'ok' | 'too-fast' | 'invalid'
function checkFormToken(token) {
  if (!signingKey()) return 'ok'         // nothing to verify against; other layers still apply
  const [ts, sig] = String(token || '').split('.')
  if (!ts || !sig || !/^\d+$/.test(ts)) return 'invalid'
  const expected = hmac(ts)
  if (sig.length !== expected.length || !crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expected))) return 'invalid'
  const age = Date.now() - Number(ts)
  if (age < MIN_FILL_MS) return 'too-fast'
  if (age > MAX_TOKEN_AGE_MS) return 'invalid'
  return 'ok'
}

async function turnstileOk(token, ip) {
  const secret = process.env.TURNSTILE_SECRET_KEY
  if (!secret) {
    console.warn('TURNSTILE_SECRET_KEY not set; Turnstile check skipped')
    return true
  }
  if (!token) return false
  try {
    const body = new URLSearchParams({ secret, response: String(token) })
    if (ip && ip !== 'unknown') body.set('remoteip', ip)
    const r = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', { method: 'POST', body })
    const data = await r.json()
    if (!data.success) console.warn('Turnstile rejected:', data['error-codes'])
    return data.success === true
  } catch (err) {
    console.error('Turnstile verify failed:', err.message)
    return false
  }
}

const LINK_RE = /(https?:\/\/|www\.|\b[a-z0-9-]+\.(com|net|org|ru|cn|xyz|top|info|biz|io)\b)/gi

function hasLink(s) {
  return new RegExp(LINK_RE.source, 'i').test(String(s || ''))
}

// More than two links, or links with almost no words around them.
function mostlyLinks(s) {
  const text = String(s || '')
  const links = text.match(LINK_RE) || []
  if (links.length === 0) return false
  if (links.length > 2) return true
  const words = text.replace(/\S*(https?:\/\/|www\.)\S*/gi, ' ').replace(/\s+/g, ' ').trim()
  return words.length < 20
}

// True when any field is longer than its cap. caps = { field: maxLength }
function tooLong(fields, caps) {
  return Object.keys(caps).some(k => String(fields[k] ?? '').length > caps[k])
}

module.exports = { clientIp, issueFormToken, checkFormToken, turnstileOk, hasLink, mostlyLinks, tooLong }
