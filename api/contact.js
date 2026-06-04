const { Resend } = require('resend')

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { name, email, phone, weddingDate, venue, message } = req.body

  if (!name || !email || !message) {
    return res.status(400).json({ error: 'Name, email, and message are required.' })
  }

  const resend = new Resend(process.env.RESEND_API_KEY)

  try {
    const { error } = await resend.emails.send({
      from: 'Amore Coordination <amy@amorecoordination.com>',
      replyTo: email,
      to: 'Amy@AmoreCoordination.com',
      subject: `New Inquiry — ${name}`,
      html: `
        <div style="font-family:Georgia,serif;max-width:600px;margin:0 auto;padding:32px;background:#fbf9f4;border-radius:8px;">
          <h2 style="color:#6e3d63;margin-bottom:24px;font-size:24px;">New Wedding Inquiry</h2>
          <table style="width:100%;border-collapse:collapse;">
            <tr><td style="padding:8px 0;color:#5c554d;font-size:13px;width:120px;vertical-align:top;"><strong>Name</strong></td><td style="padding:8px 0;color:#2b2723;">${name}</td></tr>
            <tr><td style="padding:8px 0;color:#5c554d;font-size:13px;vertical-align:top;"><strong>Email</strong></td><td style="padding:8px 0;color:#2b2723;"><a href="mailto:${email}" style="color:#6e3d63;">${email}</a></td></tr>
            ${phone ? `<tr><td style="padding:8px 0;color:#5c554d;font-size:13px;vertical-align:top;"><strong>Phone</strong></td><td style="padding:8px 0;color:#2b2723;">${phone}</td></tr>` : ''}
            ${weddingDate ? `<tr><td style="padding:8px 0;color:#5c554d;font-size:13px;vertical-align:top;"><strong>Wedding Date</strong></td><td style="padding:8px 0;color:#2b2723;">${weddingDate}</td></tr>` : ''}
            ${venue ? `<tr><td style="padding:8px 0;color:#5c554d;font-size:13px;vertical-align:top;"><strong>Venue</strong></td><td style="padding:8px 0;color:#2b2723;">${venue}</td></tr>` : ''}
          </table>
          <hr style="border:none;border-top:1px solid #e4dcd2;margin:24px 0;" />
          <p style="color:#5c554d;font-size:13px;margin-bottom:8px;"><strong>Message</strong></p>
          <p style="color:#2b2723;white-space:pre-wrap;line-height:1.7;">${message}</p>
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
