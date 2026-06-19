/**
 * Lund Podiatry — Contact form backend (Vercel Serverless Function)
 *
 * POST /api/contact
 *
 * Behavior
 * --------
 *  - Method: POST only. Otherwise 405.
 *  - Body-size cap (32 KB) — fails fast before parsing.
 *  - Per-IP rate limit (10 req/min, in-memory; buckets pruned every 5 min).
 *  - JSON or URL-encoded body parsing. Vercel @vercel/node pre-parses both into
 *    req.body — we use that directly when present.
 *  - Honeypot — silent 200 when `_gotcha` field non-empty (skips remaining checks).
 *  - Cloudflare Turnstile verification — fail-closed 403 in production
 *    (TURNSTILE_SECRET_KEY set + bad token). Dev mode skips when secret absent.
 *  - Standard validation: required fields, email format, ≥10-digit phone.
 *  - Forwards to the highest-priority configured relay:
 *      1. RESEND_API_KEY set                  → Resend (HIPAA BAA on Pro plan)
 *      2. WEB3FORMS_ACCESS_KEY set (fallback)  → Web3Forms (free tier, no BAA)
 *      3. neither set                          → log only; documented in walkthrough
 *    Each relay builds its own payload from a shared subject line.
 *
 * SECURITY — from-address spoofing vector
 *  - Web3Forms payload has NO `email` key (intentional). Uses `replyto` so staff
 *    can hit Reply without us impersonating the patient. See Web3Forms email
 *    spoof abuse notes online.
 *  - Resend `from` is HARD-CODED to MAIL_FROM env if set, else the verified
 *    domain default `Lund Podiatry Website <noreply@lundpodiatry.com>`. The
 *    patient's email is sent ONLY in Resend's `reply_to` (array). This mirrors
 *    the Web3Forms safety stance and avoids the same spoof class of attack.
 *
 * ENV
 *  - TURNSTILE_SECRET_KEY  (server; Cloudflare dashboard)
 *  - RESEND_API_KEY        (server; resend.com — preferred when BAA-eligible)
 *  - WAEB3FORMS_ACCESS_KEY (server; web3forms.com — fallback / non-HIPAA path)
 *  - MAIL_TO               (optional; defaults to hello@lundpodiatry.com)
 *  - MAIL_FROM             (optional; defaults to a verified-domain placeholder)
 *
 * HIPAA / Security
 *  - TLS via Vercel edge.
 *  - Logs are PHI-light. Success: condition + duration + insurance + relay kind.
 *    Rejection: reason + ua. No name / phone / email in logs.
 *  - Siteverify receives only (secret, token, ip). No PII.
 *  - Both relays receive name/phone/condition etc., but the `from` address is
 *    always the verified practice domain, never the patient's email.
 */

export default async function handler(req, res) {
  // Method
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ ok: false, error: 'Method not allowed' });
  }
  res.setHeader('Cache-Control', 'no-store');

  // Body-size cap — fail before parsing
  const contentLength = parseInt(String(req.headers['content-length'] || '0'), 10);
  if (contentLength > 32_000) {
    return reject(req, res, 413, 'body_too_large', { size: contentLength });
  }

  // Per-IP rate limit
  if (!rateLimitOk(req)) {
    res.setHeader('Retry-After', '60');
    return reject(req, res, 429, 'rate_limit_exceeded');
  }

  // Body parsing — JSON or URL-encoded
  let data = {};
  let unsupported = false;
  try {
    const ct = String(req.headers['content-type'] || '').toLowerCase();
    if (looksLikeObject(req.body)) {
      data = req.body;
    } else if (ct.includes('application/json')) {
      data = safeJsonParse(req.body);
    } else if (ct.includes('application/x-www-form-urlencoded')) {
      const raw = typeof req.body === 'string' ? req.body : await readBody(req);
      data = Object.fromEntries(new URLSearchParams(raw));
    } else {
      unsupported = true;
    }
  } catch (_) {
    return reject(req, res, 400, 'bad_request_body');
  }
  if (unsupported) {
    return reject(req, res, 415, 'unsupported_content_type');
  }

  // Honeypot — silent 200. Bot skipped past Turnstile + relays entirely.
  if (data._gotcha && String(data._gotcha).trim() !== '') {
    return res.status(200).json({ ok: true });
  }

  // Cloudflare Turnstile verification
  const verdict = await verifyTurnstile(data['cf-turnstile-response'], req);
  if (verdict === 'missing') {
    return reject(req, res, 400, 'turnstile_missing');
  }
  if (verdict === 'failed') {
    return reject(req, res, 403, 'turnstile_failed');
  }
  // 'ok' or 'skipped' (dev mode / outage) — continue

  // Required fields
  const required = ['firstName', 'lastName', 'phone', 'email', 'condition'];
  const missing = required.filter((k) => !data[k] || !String(data[k]).trim());
  if (missing.length) {
    return reject(req, res, 400, 'missing_fields', { fields: missing });
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(String(data.email))) {
    return reject(req, res, 400, 'invalid_email');
  }
  const phoneDigits = String(data.phone || '').replace(/\D/g, '');
  if (phoneDigits.length < 10) {
    return reject(req, res, 400, 'invalid_phone');
  }

  // Pick relay: Resend > Web3Forms > none.
  const plan = pickRelay();
  const subject = `New lead — ${data.condition} — ${data.firstName} ${data.lastName}`;

  let delivered = false;
  let deliveredVia = 'console_only';
  if (plan.kind === 'resend') {
    const result = await deliverViaResend({ subject, data, env: plan.env });
    delivered = result.ok;
    deliveredVia = result.ok ? 'resend' : 'resend_failed';
  } else if (plan.kind === 'web3forms') {
    const result = await deliverViaWeb3Forms({ subject, data, env: plan.env });
    delivered = result.ok;
    deliveredVia = result.ok ? 'web3forms' : 'web3forms_failed';
  }

  // Success log — never include name, phone, email
  try {
    console.log(JSON.stringify({
      at: new Date().toISOString(),
      event: 'lead_capture',
      condition: data.condition || null,
      duration: data.duration || null,
      insurance: data.insurance || null,
      delivered_via: deliveredVia,
      ua: String(req.headers['user-agent'] || '').slice(0, 200),
    }));
  } catch (_) {}

  return res.status(200).json({ ok: true, delivered });
}

// ============================================================================
// Relay dispatch
// ============================================================================

/**
 * pickRelay — returns the highest-priority configured relay's kind + env. The
 * returned `env` object isolates the per-relay config so templates don't reach
 * into process.env directly and so tests can inject cleanly.
 *
 * Precedence: RESEND_API_KEY > WEB3FORMS_ACCESS_KEY > none.
 */
function pickRelay() {
  const resendKey = (process.env.RESEND_API_KEY || '').trim();
  if (resendKey) {
    return {
      kind: 'resend',
      env: {
        apiKey: resendKey,
        to: (process.env.MAIL_TO || '').trim() || 'hello@lundpodiatry.com',
        from: (process.env.MAIL_FROM || '').trim() ||
          'Lund Podiatry Website <noreply@lundpodiatry.com>',
      },
    };
  }
  const w3Key = (process.env.WEB3FORMS_ACCESS_KEY || '').trim();
  if (w3Key) {
    return { kind: 'web3forms', env: { accessKey: w3Key } };
  }
  return { kind: 'none', env: null };
}

/**
 * deliverViaResend — POST to https://api.resend.com/emails with the
 * Bearer-authenticated JSON payload. Subject + html + text are built locally;
 * patient's email goes in `reply_to` (never `from`).
 */
async function deliverViaResend({ subject, data, env }) {
  const html = renderLeadHtml(data);
  const text = renderLeadText(data);
  try {
    const r = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        Authorization: `Bearer ${env.apiKey}`,
      },
      body: JSON.stringify({
        from: env.from,
        to: [env.to],
        subject,
        html,
        text,
        reply_to: [String(data.email)],
      }),
    });
    // Resend returns 200 with { id } on success, or 4xx with { name, message }.
    // Tolerate non-JSON responses (defensive) by accepting 2xx as ok.
    if (!r.ok && r.status >= 500) return { ok: false, status: r.status };
    const j = await r.json().catch(() => ({}));
    return { ok: !!j.id || r.ok, status: r.status, id: j.id || null };
  } catch (_) {
    return { ok: false };
  }
}

/**
 * deliverViaWeb3Forms — preserves the original behavior exactly so existing
 * deployments don't change. SECURITY: keeps `email` OUT OF payload (uses
 * `replyto`) — see the SECURITY note in the file header.
 */
async function deliverViaWeb3Forms({ subject, data, env }) {
  const payload = {
    access_key: env.accessKey,
    from_name: 'Lund Podiatry Website',
    subject,
    name: `${data.firstName} ${data.lastName}`,
    replyto: data.email,
    phone: data.phone,
    condition: data.condition,
    duration: data.duration || '',
    insurance: data.insurance || '',
    contact_time: data.contactTime || '',
    botcheck: '',
  };
  try {
    const r = await fetch('https://api.web3forms.com/submit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify(payload),
    });
    const j = await r.json().catch(() => ({}));
    return { ok: !!j.success, status: r.status };
  } catch (_) {
    return { ok: false };
  }
}

// ----------------------------------------------------------------------------
// Per-relay templates — kept separate because Web3Forms renders the email on
// their end (flat JSON properties), while Resend receives a fully-built html +
// text body. A unified wrapper would just become a messy switch statement.
// ----------------------------------------------------------------------------

function renderLeadHtml(data) {
  const rows = [
    ['Name', `${escapeHtml(data.firstName)} ${escapeHtml(data.lastName)}`],
    ['Phone', escapeHtml(data.phone || '')],
    ['Email', escapeHtml(data.email || '')],
    ['Condition', escapeHtml(data.condition || '')],
    ['Duration', escapeHtml(data.duration || '')],
    ['Insurance', escapeHtml(data.insurance || '')],
    ['Best time to reach', escapeHtml(data.contactTime || '')],
  ];
  return [
    '<h2 style="font-family:system-ui,sans-serif;margin:0 0 16px;">New lead</h2>',
    '<table style="font-family:system-ui,sans-serif;border-collapse:collapse;width:100%;">',
    rows
      .map(
        ([k, v]) =>
          `<tr><th style="text-align:left;padding:6px 12px;border-bottom:1px solid #eee;background:#fafafa;width:160px;">${k}</th><td style="padding:6px 12px;border-bottom:1px solid #eee;">${v || '<span style="color:#999;">—</span>'}</td></tr>`,
      )
      .join(''),
    '</table>',
    '<p style="font-family:system-ui,sans-serif;color:#666;font-size:12px;margin-top:24px;">Reply directly to this email to respond to the patient.</p>',
  ].join('');
}

function renderLeadText(data) {
  return [
    'New lead — Lund Podiatry website',
    '',
    `Name: ${data.firstName} ${data.lastName}`,
    `Phone: ${data.phone || ''}`,
    `Email: ${data.email || ''}`,
    `Condition: ${data.condition || ''}`,
    `Duration: ${data.duration || ''}`,
    `Insurance: ${data.insurance || ''}`,
    `Best time to reach: ${data.contactTime || ''}`,
    '',
    'Reply directly to this email to respond to the patient.',
  ].join('\n');
}

function escapeHtml(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

// ============================================================================
// Helpers (unchanged from prior fix)
// ============================================================================

// reject() — emit a structured lead_rejected log AND send a JSON response.
// Caller does `return reject(...)`.
function reject(req, res, status, reason, extra) {
  try {
    console.log(JSON.stringify({
      at: new Date().toISOString(),
      event: 'lead_rejected',
      reason,
      ...(extra || {}),
      ua: String(req.headers['user-agent'] || '').slice(0, 200),
    }));
  } catch (_) { /* logging must never break the response */ }
  return res.status(status).json(Object.assign({ ok: false, error: reason }, extra || {}));
}

/**
 * verifyTurnstile — Cloudflare Turnstile anti-bot token verification.
 *
 * Returns:
 *   'skipped'  TURNSTILE_SECRET_KEY not set (dev mode), OR siteverify endpoint
 *              itself unreachable (CF outage / network error) — fail-open with log.
 *   'missing'  token field absent or empty (only checked when secret IS set).
 *   'failed'   siteverify returned success:false (genuine bot / invalid token).
 *   'ok'       siteverify returned success:true.
 *
 * Fail-open during outage is the standard pattern for non-critical anti-spam —
 * better to let a real patient through than to lock them out during a CF incident.
 */
async function verifyTurnstile(token, req) {
  const secret = (process.env.TURNSTILE_SECRET_KEY || '').trim();
  if (!secret) return 'skipped';
  if (!token || !String(token).trim()) return 'missing';

  const ip = (String(req.headers['x-forwarded-for'] || '').split(',')[0] || '').trim() || undefined;

  try {
    const body = new URLSearchParams({ secret, response: String(token) });
    if (ip) body.set('remoteip', ip);
    const r = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded', Accept: 'application/json' },
      body,
    });
    const j = await r.json().catch(() => ({}));
    return j.success === true ? 'ok' : 'failed';
  } catch (_) {
    // Siteverify unreachable — fail-open with warning
    try {
      console.log(JSON.stringify({
        at: new Date().toISOString(),
        event: 'turnstile_verify_skipped',
        reason: 'siteverify_unreachable',
        ua: String(req.headers['user-agent'] || '').slice(0, 200),
      }));
    } catch (_) {}
    return 'skipped';
  }
}

// Rate limit + periodic prune (bounds memory across warm Function instances).
const _rlBuckets = new Map();
const RL_WINDOW_MS = 60_000;
const RL_MAX = 10;
let _lastPrune = Date.now();
const RL_PRUNE_INTERVAL_MS = 5 * 60_000;
const RL_BUCKET_TTL = RL_WINDOW_MS * 5; // drop buckets older than 5× window

function rateLimitOk(req) {
  const now = Date.now();
  if (now - _lastPrune > RL_PRUNE_INTERVAL_MS) {
    _lastPrune = now;
    for (const [ip, entry] of _rlBuckets.entries()) {
      if (now - entry.windowStart > RL_BUCKET_TTL) _rlBuckets.delete(ip);
    }
  }

  const fwd = String(req.headers['x-forwarded-for'] || '');
  const ip = (fwd.split(',')[0] || '').trim() || 'unknown';
  const entry = _rlBuckets.get(ip);
  if (!entry || now - entry.windowStart > RL_WINDOW_MS) {
    _rlBuckets.set(ip, { windowStart: now, count: 1 });
    return true;
  }
  entry.count += 1;
  return entry.count <= RL_MAX;
}

// Body-parsing helpers (unchanged from prior fix).
function looksLikeObject(v) {
  return typeof v === 'object' && v !== null && !Array.isArray(v) && !Buffer.isBuffer(v);
}
function safeJsonParse(s) {
  // Throw on malformed input — the handler's outer try/catch converts this
  // to a `bad_request_body` rejection. Returning {} here would mask the
  // parse failure as `missing_fields` downstream.
  return JSON.parse(String(s == null ? '{}' : s));
}
async function readBody(req) {
  return new Promise((resolve, rejectIn) => {
    const chunks = [];
    req.on('data', (c) => chunks.push(Buffer.from(c)));
    req.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')));
    req.on('error', rejectIn);
  });
}
