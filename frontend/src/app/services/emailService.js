class EmailService {
  constructor() {}

  interpolateTemplate(template, context, getFieldFromContext) {
    if (!template || typeof template !== 'string') return template;
    return template.replace(/\{\{\s*([^}]+?)\s*\}\}/g, (_, path) => {
      try {
        let key = path.trim();
        if (key === 'WORKFLOW.name') return context?.WORKFLOW?.name || '';
        if (key === 'WORKFLOW.id') return context?.WORKFLOW?.id || '';
        // Back-compat: strip ai_explanation segment after previous.
        if (key.startsWith('previous.ai_explanation.')) {
          key = 'previous.' + key.slice('previous.ai_explanation.'.length);
        }
        // Special alias: AI.<path> → last result with type === 'ai_explanation'
        if (key.startsWith('AI.')) {
          const after = key.slice(3); // remove 'AI.'
          const results = context?.results || {};
          const values = Object.values(results);
          for (let i = values.length - 1; i >= 0; i--) {
            const r = values[i];
            if (r && r.type === 'ai_explanation') {
              // Drill into r using after path
              const parts = after.split('.');
              let val = r;
              for (const p of parts) val = val?.[p];
              return this._stringifyValue(val);
            }
          }
          return '';
        }
        const value = getFieldFromContext(key, context) ?? '';
        return this._stringifyValue(value);
      } catch {
        return '';
      }
    });
  }

  _stringifyValue(value) {
    if (value == null) return '';
    if (Array.isArray(value)) {
      if (value.every(v => typeof v === 'string' || typeof v === 'number')) {
        return value.length ? ('\n- ' + value.join('\n- ')) : '';
      }
      try { return JSON.stringify(value); } catch { return String(value); }
    }
    if (typeof value === 'object') {
      try { return JSON.stringify(value); } catch { return String(value); }
    }
    return String(value);
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


