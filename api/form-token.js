// Issues the signed timestamp the forms send back, so the server can tell how long
// the visitor actually took (see _guard.js). Never cached.
const { issueFormToken } = require('./_guard.js')

module.exports = function handler(req, res) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET')
    return res.status(405).json({ error: 'Method not allowed' })
  }
  res.setHeader('Cache-Control', 'no-store')
  return res.status(200).json({ t: issueFormToken() })
}
