class EmailService {
  constructor() {}

  interpolateTemplate(template, context, getFieldFromContext) {
    if (!template || typeof template !== 'string') return template;
    return template.replace(/\{\{\s*([^}]+?)\s*\}\}/g, (_, path) => {
      try {
        const value = getFieldFromContext(path.trim(), context) ?? '';
        return typeof value === 'object' ? JSON.stringify(value) : String(value);
      } catch {
        return '';
      }
    });
  }

  async sendEmail(config, context) {
    const { to, cc, bcc, from, subject, body, useHtml, provider = 'Resend', dryRun = true } = config;

    // Interpolate placeholders using workflow context if available
    const getField = context?.engine?.getFieldFromContext || context?.getFieldFromContext;
    const interpolate = (s) => (getField ? this.interpolateTemplate(s, context, getField.bind(context.engine || context)) : s);
    const resolved = {
      to: interpolate(to),
      cc: interpolate(cc || ''),
      bcc: interpolate(bcc || ''),
      from: interpolate(from || ''),
      subject: interpolate(subject),
      body: interpolate(body),
    };

    try {
      const res = await fetch('/api/email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: resolved.to,
          cc: resolved.cc,
          bcc: resolved.bcc,
          from: resolved.from,
          subject: resolved.subject,
          body: resolved.body,
          useHtml: !!useHtml,
          provider,
          dryRun,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        return { success: false, error: data.error || `HTTP ${res.status}` };
      }
      return { success: true, id: data.id, dryRun: data.dryRun };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }
}

export default EmailService;


