// Node-native unit tests for sites/lund-podiatry/api/contact.js.
//
// Run: node --test tests/contact-api.test.mjs  (from repo root)
//
// Assumes dev mode (TURNSTILE_SECRET_KEY + WEB3FORMS_ACCESS_KEY both unset,
// so Turnstile verification is 'skipped' and Web3Forms relay is a no-op).

import test from 'node:test';
import assert from 'node:assert/strict';
import handler from '../sites/lund-podiatry/api/contact.js';

// Ensure dev-mode for the whole suite. Anything already set in the shell would
// be honored, but for test runs we explicitly disable both.
delete process.env.TURNSTILE_SECRET_KEY;
delete process.env.WEB3FORMS_ACCESS_KEY;

// Mock req/res helpers. Each test gets a unique fake IP via x-forwarded-for so
// the in-memory rate-limit Map doesn't trip when the suite runs in <60s.
let ipN = 0;
function makeReq({ method = 'POST', headers = {}, body = null } = {}) {
  ipN += 1;
  return {
    method,
    headers: { 'x-forwarded-for': `198.51.100.${ipN}`, ...headers },
    body,
  };
}
function makeRes() {
  const res = {
    headers: {},
    statusCode: 200,
    payload: null,
    setHeader(k, v) { this.headers[k] = v; return this; },
    status(code) { this.statusCode = code; return this; },
    json(p) { this.payload = p; this.sent = true; return this; },
  };
  return res;
}

test('405 on GET, with Allow:POST header', async () => {
  const req = makeReq({ method: 'GET' });
  const res = makeRes();
  await handler(req, res);
  assert.equal(res.statusCode, 405);
  assert.equal(res.headers.Allow, 'POST');
  assert.equal(res.payload.error, 'Method not allowed');
});

test('413 body_too_large when Content-Length > 32 KB', async () => {
  const req = makeReq({ headers: { 'content-length': '50000' } });
  const res = makeRes();
  await handler(req, res);
  assert.equal(res.statusCode, 413);
  assert.equal(res.payload.error, 'body_too_large');
  assert.equal(res.payload.size, 50000);
});

test('415 unsupported_content_type', async () => {
  const req = makeReq({ headers: { 'content-type': 'text/plain' }, body: 'oops' });
  const res = makeRes();
  await handler(req, res);
  assert.equal(res.statusCode, 415);
  assert.equal(res.payload.error, 'unsupported_content_type');
});

test('400 bad_request_body on malformed JSON', async () => {
  const req = makeReq({ headers: { 'content-type': 'application/json' }, body: 'notjson{' });
  const res = makeRes();
  await handler(req, res);
  assert.equal(res.statusCode, 400);
  assert.equal(res.payload.error, 'bad_request_body');
});

test('200 silent success on honeypot _gotcha filled', async () => {
  const req = makeReq({ body: { _gotcha: 'i am a bot' } });
  const res = makeRes();
  await handler(req, res);
  assert.equal(res.statusCode, 200);
  assert.equal(res.payload.ok, true);
});

test('400 missing_fields on empty body', async () => {
  const req = makeReq({ body: {} });
  const res = makeRes();
  await handler(req, res);
  assert.equal(res.statusCode, 400);
  assert.equal(res.payload.error, 'missing_fields');
  assert.ok(Array.isArray(res.payload.fields));
  assert.ok(res.payload.fields.includes('firstName'));
  assert.ok(res.payload.fields.includes('email'));
});

test('400 invalid_email format', async () => {
  const req = makeReq({
    body: {
      firstName: 'T', lastName: 'U', phone: '5555551234',
      email: 'not-an-email', condition: 'heel-pain',
    },
  });
  const res = makeRes();
  await handler(req, res);
  assert.equal(res.statusCode, 400);
  assert.equal(res.payload.error, 'invalid_email');
});

test('400 invalid_phone when fewer than 10 digits', async () => {
  const req = makeReq({
    body: {
      firstName: 'T', lastName: 'U', phone: '123',
      email: 'good@example.com', condition: 'heel-pain',
    },
  });
  const res = makeRes();
  await handler(req, res);
  assert.equal(res.statusCode, 400);
  assert.equal(res.payload.error, 'invalid_phone');
});

test('200 happy path with valid complete data', async () => {
  const req = makeReq({
    body: {
      firstName: 'Jane', lastName: 'Doe', phone: '5555551234',
      email: 'jane@example.com', condition: 'heel-pain',
      duration: 'under-1-month', insurance: 'yes', contactTime: 'Morning',
    },
  });
  const res = makeRes();
  await handler(req, res);
  assert.equal(res.statusCode, 200);
  assert.equal(res.payload.ok, true);
  assert.equal(res.payload.delivered, false); // no WEB3FORMS_ACCESS_KEY in tests
});

test('URL-encoded body parses via stream path', async () => {
  const req = makeReq({
    headers: {
      'content-type': 'application/x-www-form-urlencoded',
      'content-length': '80',
    },
    body: 'firstName=Jane&lastName=Doe&phone=5555551234&email=jane%40example.com&condition=heel-pain',
  });
  const res = makeRes();
  await handler(req, res);
  assert.equal(res.statusCode, 200);
  assert.equal(res.payload.ok, true);
});

// ===========================================================================
// Relay dispatch tests — covers the new Resend + Web3Forms + console-only
// routing. Each test self-contains env + fetch mocking + restoration so the
// suite can run alongside the legacy tests in any order.
// ===========================================================================

/** Save env vars we're about to mutate; restore them on cleanup. */
function savedEnv(...keys) {
  const snapshot = Object.create(null);
  for (const k of keys) snapshot[k] = process.env[k];
  return {
    set: (next) => {
      for (const [k, v] of Object.entries(next)) {
        if (v === undefined) delete process.env[k];
        else process.env[k] = v;
      }
    },
    restore: () => {
      for (const [k, v] of Object.entries(snapshot)) {
        if (v === undefined) delete process.env[k];
        else process.env[k] = v;
      }
    },
  };
}

/** Build a fake fetch that captures the most-recent call + returns a canned
 *  response shape. Returns the fetcher plus an `assertCalls(n)` helper. */
function fakeFetch(responder) {
  const orig = global.fetch;
  const calls = [];
  global.fetch = async (url, init) => {
    calls.push({ url: String(url), init });
    return responder(calls.length, { url, init });
  };
  return {
    calls,
    restore: () => { global.fetch = orig; },
    assertCalls: (n) => assert.equal(calls.length, n, `expected ${n} fetch calls, got ${calls.length}`),
  };
}

const validBody = () => ({
  firstName: 'Jane',
  lastName: 'Doe',
  phone: '5555551234',
  email: 'jane@example.com',
  condition: 'heel-pain',
  duration: 'under-1-month',
  insurance: 'yes',
  contactTime: 'Morning',
});

test('dispatch: console_only when neither RESEND_API_KEY nor WEB3FORMS_ACCESS_KEY is set', async () => {
  const env = savedEnv('RESEND_API_KEY', 'WEB3FORMS_ACCESS_KEY');
  env.set({ RESEND_API_KEY: undefined, WEB3FORMS_ACCESS_KEY: undefined });
  const fetch = fakeFetch(() => ({ ok: true, status: 200, json: async () => ({}) }));
  try {
    const req = makeReq({ body: validBody() });
    const res = makeRes();
    await handler(req, res);
    assert.equal(res.statusCode, 200);
    assert.equal(res.payload.delivered, false);
    // Only Turnstile siteverify may be hit, never a relay.
    for (const c of fetch.calls) {
      assert.ok(!c.url.includes('resend.com'), 'must not call Resend');
      assert.ok(!c.url.includes('web3forms.com'), 'must not call Web3Forms');
    }
  } finally {
    fetch.restore();
    env.restore();
  }
});

test('dispatch: uses Resend when RESEND_API_KEY is set (no Web3Forms call)', async () => {
  const env = savedEnv('RESEND_API_KEY', 'WEB3FORMS_ACCESS_KEY', 'MAIL_FROM', 'MAIL_TO');
  env.set({
    RESEND_API_KEY: 're_test_fake_key_0001',
    WEB3FORMS_ACCESS_KEY: undefined,
    MAIL_FROM: undefined,
    MAIL_TO: undefined,
  });
  const fetch = fakeFetch(() => ({ ok: true, status: 200, json: async () => ({ id: 'r_test_1' }) }));
  try {
    const req = makeReq({ body: validBody() });
    const res = makeRes();
    await handler(req, res);
    assert.equal(res.statusCode, 200);
    assert.equal(res.payload.delivered, true);
    fetch.assertCalls(1);
    assert.equal(fetch.calls[0].url, 'https://api.resend.com/emails');

    // Bearer auth header is set
    const headers = new Headers(fetch.calls[0].init.headers);
    assert.equal(headers.get('authorization'), 'Bearer re_test_fake_key_0001');
    assert.equal(headers.get('content-type'), 'application/json');

    // Body shape — from is hardcoded default (anti-spoof), reply_to carries
    // patient email only, never an `email` key in flat fields.
    const body = JSON.parse(fetch.calls[0].init.body);
    assert.equal(body.from, 'Lund Podiatry Website <noreply@lundpodiatry.com>');
    assert.deepEqual(body.to, ['hello@lundpodiatry.com']);
    assert.deepEqual(body.reply_to, ['jane@example.com']);
    assert.ok(!('email' in body), `Resend payload must NOT contain an "email" key (spoof vector), got keys: ${Object.keys(body).join(',')}`);
    assert.ok(typeof body.subject === 'string' && body.subject.includes('Jane Doe'));
    assert.ok(typeof body.html === 'string' && body.html.includes('New lead'));
    assert.ok(typeof body.text === 'string' && body.text.includes('Jane Doe'));
  } finally {
    fetch.restore();
    env.restore();
  }
});

test('dispatch: respects MAIL_FROM + MAIL_TO overrides', async () => {
  const env = savedEnv('RESEND_API_KEY', 'MAIL_FROM', 'MAIL_TO');
  env.set({
    RESEND_API_KEY: 're_test_fake_key_0002',
    MAIL_FROM: 'Custom Sender <custom@example.com>',
    MAIL_TO: 'inbox@example.com',
  });
  const fetch = fakeFetch(() => ({ ok: true, status: 200, json: async () => ({ id: 'r_test_2' }) }));
  try {
    const req = makeReq({ body: validBody() });
    const res = makeRes();
    await handler(req, res);
    fetch.assertCalls(1);
    const body = JSON.parse(fetch.calls[0].init.body);
    assert.equal(body.from, 'Custom Sender <custom@example.com>');
    assert.deepEqual(body.to, ['inbox@example.com']);
  } finally {
    fetch.restore();
    env.restore();
  }
});

test('dispatch: Resend takes precedence over Web3Forms when BOTH keys are set', async () => {
  const env = savedEnv('RESEND_API_KEY', 'WEB3FORMS_ACCESS_KEY');
  env.set({
    RESEND_API_KEY: 're_test_fake_key_0003',
    WEB3FORMS_ACCESS_KEY: 'w3f_legacy_999',
  });
  const fetch = fakeFetch((n) => {
    // Each call to a different URL.
    return n === 1
      ? { ok: true, status: 200, json: async () => ({ id: 'r_test_3' }) }
      : { ok: true, status: 200, json: async () => ({ success: true }) };
  });
  try {
    const req = makeReq({ body: validBody() });
    const res = makeRes();
    await handler(req, res);
    assert.equal(res.statusCode, 200);
    assert.equal(res.payload.delivered, true);
    // Only ONE fetch call, to Resend — Web3Forms is not called.
    fetch.assertCalls(1);
    assert.ok(fetch.calls[0].url.includes('resend.com'), 'Resend must win precedence');
    assert.ok(!fetch.calls[0].url.includes('web3forms.com'));
  } finally {
    fetch.restore();
    env.restore();
  }
});

test('dispatch: falls back to Web3Forms when only WEB3FORMS_ACCESS_KEY is set (legacy compat)', async () => {
  const env = savedEnv('RESEND_API_KEY', 'WEB3FORMS_ACCESS_KEY');
  env.set({ RESEND_API_KEY: undefined, WEB3FORMS_ACCESS_KEY: 'w3f_paid_real_key_777' });
  const fetch = fakeFetch(() => ({ ok: true, status: 200, json: async () => ({ success: true }) }));
  try {
    const req = makeReq({ body: validBody() });
    const res = makeRes();
    await handler(req, res);
    assert.equal(res.statusCode, 200);
    assert.equal(res.payload.delivered, true);
    fetch.assertCalls(1);
    assert.equal(fetch.calls[0].url, 'https://api.web3forms.com/submit');
    // Anti-regression: Web3Forms payload STILL has no `email` key, only replyto.
    const body = JSON.parse(fetch.calls[0].init.body);
    assert.ok(!('email' in body), `Web3Forms payload must NOT contain an "email" key (spoof vector), got keys: ${Object.keys(body).join(',')}`);
    assert.equal(body.replyto, 'jane@example.com');
    // Sanity check the test wiring itself: the access key we set must propagate into the payload.
    assert.equal(body.access_key, 'w3f_paid_real_key_777');
  } finally {
    fetch.restore();
    env.restore();
  }
});

test('Resend: API error returns 200 to caller with delivered:false (does not 5xx)', async () => {
  const env = savedEnv('RESEND_API_KEY');
  env.set({ RESEND_API_KEY: 're_test_fake_key_0004' });
  const fetch = fakeFetch((n) => ({
    ok: false,
    status: n === 1 ? 422 : 500,
    json: async () => ({ name: 'validation_error', message: 'fake' }),
  }));
  try {
    // 422 — Resend returns 4xx for validation. Still 200 to caller; delivered:false.
    let req = makeReq({ body: validBody() });
    let res = makeRes();
    await handler(req, res);
    assert.equal(res.statusCode, 200);
    assert.equal(res.payload.delivered, false);
  } finally {
    fetch.restore();
    env.restore();
  }
});

test('Resend: network throw returns 200 to caller with delivered:false', async () => {
  const env = savedEnv('RESEND_API_KEY');
  env.set({ RESEND_API_KEY: 're_test_fake_key_0005' });
  const orig = global.fetch;
  global.fetch = async () => { throw new Error('ECONNRESET'); };
  try {
    const req = makeReq({ body: validBody() });
    const res = makeRes();
    await handler(req, res);
    assert.equal(res.statusCode, 200);
    assert.equal(res.payload.delivered, false);
  } finally {
    global.fetch = orig;
    env.restore();
  }
});
