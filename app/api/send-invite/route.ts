import { NextResponse } from 'next/server'
import { createClient as createSupabaseClient } from '@/lib/supabase-server'

type RequestBody = {
  email?: string
  inviteLink?: string
  organizationName?: string
  token?: string
  organizationId?: string
}

export async function POST(req: Request) {
  try {
    const body: RequestBody = await req.json()
    const { email, inviteLink, organizationName } = body

    if (!email || !inviteLink) {
      return NextResponse.json({ error: 'Missing `email` or `inviteLink` in request' }, { status: 400 })
    }

    const BREVO_API_KEY = process.env.BREVO_API_KEY
    const DEFAULT_FROM_EMAIL = process.env.DEFAULT_FROM_EMAIL
    const EMAIL_SENDER_NAME = process.env.EMAIL_SENDER_NAME || 'Granula'

    if (!BREVO_API_KEY || !DEFAULT_FROM_EMAIL) {
      console.error('BREVO_API_KEY or DEFAULT_FROM_EMAIL missing on server')
      return NextResponse.json({ error: 'Brevo not configured on server' }, { status: 500 })
    }

    const subject = `You're invited to join ${organizationName || 'our organization'}`
    const htmlContent = `
      <!doctype html>
      <html>
        <head>
          <meta name="viewport" content="width=device-width, initial-scale=1.0" />
          <meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
        </head>
        <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background:#f7fafc; margin:0; padding:20px;">
          <table role="presentation" width="100%" style="max-width:600px; margin:0 auto; background:#ffffff; border-radius:8px; overflow:hidden;">
            <tr>
              <td style="padding:20px; text-align:left; border-bottom:1px solid #eef2f7;">
                <h2 style="margin:0; color:#111827; font-size:20px">You're invited to join ${organizationName || 'our organization'}</h2>
              </td>
            </tr>
            <tr>
              <td style="padding:24px; color:#374151;">
                <p style="margin:0 0 12px 0;">Hi there,</p>
                <p style="margin:0 0 18px 0;">You've been invited to join <strong style="color:#111827">${organizationName || 'an organization'}</strong> on Granula. To accept the invitation and join the team, click the button below:</p>

                <p style="text-align:center; margin:24px 0;">
                  <a href="${inviteLink}" target="_blank" style="background-color:#2563EB; color:#fff; text-decoration:none; padding:12px 20px; border-radius:8px; display:inline-block; font-weight:600;">
                    Accept Invite
                  </a>
                </p>

                <p style="margin:0 0 12px 0; color:#6b7280; font-size:13px">If the button doesn't work, copy and paste the link below into your browser:</p>
                <p style="word-break:break-all; font-size:13px; color:#2563EB; margin:0 0 8px 0;"><a href="${inviteLink}" target="_blank" style="color:#2563EB;">${inviteLink}</a></p>

                <hr style="border:none; border-top:1px solid #eef2f7; margin:18px 0" />

                <p style="margin:0; font-size:13px; color:#9ca3af">If you did not expect this invitation, you can safely ignore this email.</p>
              </td>
            </tr>
            <tr>
              <td style="padding:14px 20px; background:#f8fafc; color:#9ca3af; font-size:12px; text-align:center;">
                <div>Sent by ${EMAIL_SENDER_NAME}</div>
              </td>
            </tr>
          </table>
        </body>
      </html>
    `

    const textContent = `You have been invited to join ${organizationName || 'an organization'} on Granula. Accept the invite: ${inviteLink}`

    const payload = {
      sender: { name: EMAIL_SENDER_NAME, email: DEFAULT_FROM_EMAIL },
      to: [{ email }],
      subject,
      htmlContent,
      textContent,
    }

    let res
    try {
      res = await fetch('https://api.brevo.com/v3/smtp/email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'api-key': BREVO_API_KEY,
        },
        body: JSON.stringify(payload),
      })
    } catch (fetchErr) {
      console.error('Network error when calling Brevo:', fetchErr)
      return NextResponse.json({ error: 'Network error when calling Brevo', detail: String(fetchErr) }, { status: 502 })
    }

    const statusCode = res.status
    let textBody = ''
    try {
      textBody = await res.text()
    } catch (e) {
      textBody = `Failed to read Brevo response: ${String(e)}`
    }

    if (!res.ok) {
      console.error('Brevo responded with non-OK status', { status: statusCode, body: textBody })
      // Try to parse JSON body if possible
      let parsed: any = textBody
      try { parsed = JSON.parse(textBody) } catch {}

      // Helpful guidance for common 401 cases
      if (statusCode === 401) {
        const hint = parsed?.message || textBody || 'Unauthorized'
        return NextResponse.json({
          error: 'Brevo API unauthorized',
          status: statusCode,
          detail: parsed,
          hint: 'Check that your BREVO_API_KEY is active and that your server IP is authorized in Brevo account security settings: https://app.brevo.com/security/authorised_ips'
        }, { status: 502 })
      }

      return NextResponse.json({ error: 'Brevo API error', status: statusCode, detail: parsed }, { status: 502 })
    }

    // success
    let data: any = null
    try { data = JSON.parse(textBody) } catch { data = textBody }

    try {
      const { token } = body as RequestBody
      if (token) {
        try {
          const supabase = await createSupabaseClient()
          
          const { error: updateError } = await supabase
            .from('organization_invites')
            .update({ status: 'sent', last_sent_at: new Date().toISOString(), brevo_response: data })
            .eq('token', token)
          if (updateError) {
            console.warn('Failed to update invite row with send status (non-fatal):', updateError)
          }
        } catch (e) {
          console.warn('Skipping supabase invite update; error creating client or updating row:', String(e))
        }
      }
    } catch (e) {
      console.warn('Unexpected error while attempting to update invite row:', String(e))
    }

    return NextResponse.json({ ok: true, data })
  } catch (err) {
    console.error('Unexpected error in /api/send-invite:', err)
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
