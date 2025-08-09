import { NextResponse } from 'next/server';

// Email relay using Resend. Supports dry-run if not configured.
export async function POST(request) {
  try {
    const {
      to,
      cc,
      bcc,
      from,
      subject,
      body,
      useHtml = false,
      provider = 'Resend',
      dryRun = true,
    } = await request.json();

    if (!to || !subject || !body) {
      return NextResponse.json({ success: false, error: 'Missing required fields: to, subject, body' }, { status: 400 });
    }

    // Normalize recipients
    const toList = String(to).split(',').map(s => s.trim()).filter(Boolean);
    const ccList = String(cc || '').split(',').map(s => s.trim()).filter(Boolean);
    const bccList = String(bcc || '').split(',').map(s => s.trim()).filter(Boolean);

    if (provider !== 'Resend') {
      return NextResponse.json({ success: false, error: `Unsupported provider: ${provider}` }, { status: 400 });
    }

    const apiKey = process.env.RESEND_API_KEY;
    const defaultFrom = process.env.RESEND_FROM_EMAIL;

    if (!apiKey) {
      if (dryRun !== false) {
        return NextResponse.json({ success: true, id: 'dry_run', dryRun: true });
      }
      return NextResponse.json({ success: false, error: 'Email provider not configured (RESEND_API_KEY missing)' }, { status: 500 });
    }

    const payload = {
      from: from || defaultFrom,
      to: toList,
      subject,
      ...(useHtml ? { html: body } : { text: body }),
    };
    if (ccList.length) payload.cc = ccList;
    if (bccList.length) payload.bcc = bccList;

    if (!payload.from) {
      return NextResponse.json({ success: false, error: 'Sender email not set. Provide "from" or RESEND_FROM_EMAIL' }, { status: 400 });
    }

    const resp = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    const data = await resp.json();
    if (!resp.ok) {
      return NextResponse.json({ success: false, error: data?.message || 'Failed to send email' }, { status: 500 });
    }

    return NextResponse.json({ success: true, id: data?.id || null, dryRun: false });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}


