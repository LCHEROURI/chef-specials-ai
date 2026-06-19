# Lund Podiatry — Static Prototype

A complete, conversion-optimized, SEO-friendly static site prototype for [lundpodiatry.com](https://lundpodiatry.com/).

> **🎬 Ready to deploy?** See **[`tutorial/vercel-deploy-walkthrough.md`](../../tutorial/vercel-deploy-walkthrough.md)** for the field-by-field drag-and-drop walkthrough (import-screen settings, env-var setup, DNS connection, post-launch checks).

See [`STRATEGY.md`](./STRATEGY.md) for the full strategic rationale, conversion plan, and SEO architecture.

---

## Quick Start (Local Preview)

The site is fully static. You can open `index.html` directly in a browser, or run a tiny local server:

```bash
cd sites/lund-podiatry
python3 -m http.server 5173
# then open http://localhost:5173/index.html
```

No build step. No `npm install`. Edit HTML → refresh.

---

## File Structure

```
sites/lund-podiatry/
├── index.html                Homepage (conversion-focused)
├── about.html                Dr. Lund bio + Physician JSON-LD
├── contact.html              Multi-step lead form (4 steps)
├── insurance.html            Accepted insurances
├── thank-you.html            Form completion + next steps
├── services/
│   ├── plantar-fasciitis.html
│   ├── bunions.html
│   ├── ingrown-toenails.html
│   ├── diabetic-foot-care.html
│   ├── heel-pain.html
│   ├── hammertoes.html
│   ├── neuropathy.html
│   ├── sports-injuries.html
│   └── orthotics.html        Custom orthotics (high-converting service)
├── assets/
│   ├── css/styles.css        Modern medical design system
│   ├── js/main.js            Form, scroll reveal, FAQ accordion
│   └── img/                  (placeholder references; no files included)
├── robots.txt
├── sitemap.xml
├── vercel.json               Clean URLs + cache headers + noindex thank-you
├── STRATEGY.md               This file's strategic counterpart
└── README.md                 You are here
```

---

## Key Features

- **Modern medical visual system** — deep navy + sage accent + warm cream background
- **Sticky header** with primary CTA and click-to-call
- **Multi-step lead form** with intent questions (location → duration → insurance → contact)
- **8 SEO silo pages** for high-intent podiatry conditions
- **Schema markup** on every page (LocalBusiness, Physician, MedicalCondition, FAQPage)
- **Open Graph + Twitter cards** for every page
- **Accessible** — keyboard nav, ARIA labels, WCAG AA contrast
- **Core Web Vitals friendly** — `font-display: swap`, lazy images, single CSS, deferred JS
- **Mobile-first responsive** with sticky mobile CTA bar

---

## Deployment (GitHub auto-deploy — primary path)

This `lund-podiatry` site lives as a subdirectory inside the `prompt-vault-pro` GitHub repo. Deploy it as its own Vercel project via the Git integration, with `Root Directory = sites/lund-podiatry`. Every push to your production branch auto-deploys; every other branch gets a preview URL.

**Pre-flight checklist** (run these locally first):

```bash
cd sites/lund-podiatry
test -f .vercelignore && echo ".vercelignore OK"          # defensive ignore
test -f vercel.json && echo "vercel.json OK"              # cleanUrls + cache headers
test -f api/contact.js && echo "api/contact.js OK"        # serverless function
test -f index.html && echo "index.html OK"                # entry point
```

**One-time Vercel setup** (~5 min):

1. Vercel → https://vercel.com/new.
2. **Import Git Repository** → search `prompt-vault-pro` → **Import**.
3. Configure:
   - **Project Name**: `lund-podiatry`
   - **Framework Preset**: Other
   - **Root Directory**: `sites/lund-podiatry` ← critical
   - **Build / Output / Install Commands**: leave all empty (no build)
4. Click **Deploy**. ~30 seconds. Done.

**After the first deploy**:

- Add env vars (`WEB3FORMS_ACCESS_KEY`, `TURNSTILE_SECRET_KEY`) in **Settings → Environment Variables**.
- Replace `TODO_TURNSTILE_SITE_KEY` in `contact.html` with the real Cloudflare widget sitekey → commit → push.
- (When ready) Add `lundpodiatry.com` in **Settings → Domains** to swap DNS over from GoDaddy.

**Daily workflow after launch**:

```bash
# Edit anything inside sites/lund-podiatry/
vim sites/lund-podiatry/contact.html

# Commit + push to the production branch — Vercel auto-builds in ~30s
git add sites/lund-podiatry/
git commit -m "fix: improve form copy"
git push origin main
```

For the **full step-by-step including env vars, DNS, post-deploy checks, and a HIPAA / BAA note**, see **[`tutorial/vercel-deploy-walkthrough.md`](../../tutorial/vercel-deploy-walkthrough.md)**.

### Alternative deploy methods

If you ever need to ship without GitHub (vendor handoff, paper prototype, etc.):

- **Drag-and-drop**: drag the `sites/lund-podiatry/` folder to https://vercel.com/new (creates a separate project — won't share env vars with the GitHub-wired one).
- **Vercel CLI**: `cd sites/lund-podiatry && npx vercel --prod` (browser auth on first run, then 30-sec deploys).
- **Any static host** (Netlify Drop, Cloudflare Pages, S3+CloudFront, Firebase, GitHub Pages): all the files are plain HTML/CSS/JS — work everywhere.

---

## Pre-Deploy Customization Checklist

Before going live:

- [ ] **Replace placeholder NAP** (phone, address, hours) in:
  - `index.html` (footer + sticky header)
  - `contact.html`
  - `about.html`
  - All services/*.html (footer)
  - All JSON-LD `address` and `telephone` blocks
- [ ] **Replace `YOUR-GOOGLE-PLACE-ID`** in `index.html` LocalBusiness schema and Google Maps embed
- [ ] **Replace placeholder photos**:
  - Doctor portrait in `about.html` and `index.html`
  - Clinic interior shots in homepage hero/about
  - Add before/after photos in services/* (with patient consent)
- [ ] **Replace placeholder Google rating** ("5.0 ★ 187 reviews") with verified count from Google Business Profile
- [ ] **Replace testimonial placeholders** with real patient quotes (collected with consent)
- [ ] **Confirm insurance list** in `insurance.html`
- [ ] **Confirm doctor credentials** in `about.html` (school, residency, board certs)
- [ ] **Update sitemap.xml `<lastmod>`** dates to launch day

---

## Form Wiring (Vercel Serverless Function + Web3Forms relay)

The contact form (`contact.html`) now posts to `/api/contact`, a Vercel Serverless Function shipped at `api/contact.js`. It is ready to capture leads out of the box — every submission is logged in the Vercel dashboard; emailing is optional.

### Default behavior (works on first deploy, no config needed)
- Client (`assets/js/main.js`) fetches `/api/contact` with JSON body + a hidden `_gotcha` honeypot field, then redirects to `/thank-you.html`.
- Server validates required fields + email + phone format (`≥10 digits` after stripping non-digits). Honeypot bots get a silent `200 ok`. Logs only `condition + duration + insurance` (PHI-light) to Vercel Function logs.
- No PII (name / phone / email) is written to logs.

> ⚠️ **Without `WEB3FORMS_ACCESS_KEY`, leads ONLY appear in Vercel Function logs** (Vercel dashboard → Functions → Logs). They are NOT emailed to anyone. Set the env var in the section below before going live — otherwise, leads are effectively invisible to non-developers.

### Enable email forwarding to your inbox (recommended)
1. Visit https://web3forms.com and paste `hello@lundpodiatry.com` to receive an access key (free tier, no signup form, ~250 submits/mo).
2. In your Vercel project → **Settings → Environment Variables**, add:
   - `WEB3FORMS_ACCESS_KEY` = the key you received.
3. Re-deploy the project. Every form submit now emails your inbox AND appears in Vercel logs.

> 🛡️ **Do NOT add an `email` key to the Web3Forms payload** in `api/contact.js`. The implementation deliberately uses `replyto` only — adding `email` re-opens a from-address spoofing risk. See the SECURITY note at the top of `api/contact.js`.

### Tighter HIPAA alternatives (swap the relay target inside `/api/contact.js`)
- **Resend + verified-inbox** — cleanest API, React Email templates.
- **Postmark** — strong deliverability, BAA on Pro.
- **AWS SES** through WorkMail — requires IAM.
- **Paubox** — direct ingestion into your EHR/PMS, purpose-built for healthcare.

The relay swap is a ~10-line change inside the Web3Forms `fetch()` block.

### Spam protection (already built-in)
- Hidden `_gotcha` field — naive bots auto-fill it; server returns `200 ok` and logs nothing.
- Required-field + format validation — bad emails / phones return `400`.

### HIPAA notes before going live
- TLS in transit is enforced (Vercel → Web3Forms both HTTPS).
- Server logs `condition + duration + insurance` only — never name, phone, or email.
- Sign a BAA with Web3Forms OR swap the relay target to a HIPAA-aware intake endpoint.
- For audit-grade PHI handling, route through Paubox into your EHR/PMS and remove all body logging.

## Image Performance (<picture> + WebP)

All hero and doctor-portrait images are wrapped in `<picture>` blocks with:
- WebP `<source>` (URL with `&fm=webp` + responsive `srcset` + `sizes`)
- JPEG `<img>` fallback (the authoring URL — just swap when you have real photography)
- Explicit `width` + `height` (CLS = 0)
- `loading="lazy"` + `decoding="async"` for below-fold images
- `loading="eager"` + `fetchpriority="high"` for hero / about-page LCPs

### Swap to real photography (when you have it)
1. Drop your real JPEGs into `sites/lund-podiatry/assets/img/`. Suggested filenames:
   - `dr-lund.jpg` (headshot, ≥800×1000)
   - `clinic-hero.jpg` (≥1600×2000 lifestyle / clinic interior)
   - `condition-plantar.jpg`, `condition-bunion.jpg`, etc. for service-page visuals
2. In each page, replace the Unsplash `<img src="…">` URL with `/assets/img/<your-file>.jpg`. The `<picture>` wrapper stays untouched — only the inner `<img src>` changes.
3. Re-run `python3 -m http.server` locally and visually verify the swap.

## Maps Embed (Google Maps, no API key)

`contact.html` includes a public Google Maps iframe using `https://maps.google.com/maps?q=…&output=embed` — no Google Maps JavaScript API key, no quota, no billing.

The query is built from the same placeholders as your NAP (`TODO_UPDATE_STREET_ADDRESS`, `TODO_UPDATE_CITY`, …). Once you do the global find-and-replace, the iframe works automatically.

To verify after deploy: open `https://<your-domain>/contact.html` and confirm the map shows the correct pin. No further setup needed.

---

## Analytics

### Recommended (privacy-friendly): Plausible
Add to `<head>` of every page:
```html
<script defer data-domain="lundpodiatry.com" src="https://plausible.io/js/script.js"></script>
```
No cookie banner needed in most US states + EU.

### Alternative (with cookie banner required): Google Analytics 4
Standard `gtag.js` setup. Required to display cookie consent.

### Always: Google Search Console + Bing Webmaster
Verify the domain to track indexing, sitemaps, and clicks.

---

## Performance Checklist (after launch)

Run [PageSpeed Insights](https://pagespeed.web.dev/) and [Lighthouse](https://developer.chrome.com/docs/lighthouse/overview/) on `/`:

- LCP < 2.0s
- INP < 200ms
- CLS < 0.05
- Performance score ≥ 90
- SEO score ≥ 95
- Accessibility score ≥ 95

If images are heavy, optimize with [Squoosh](https://squoosh.app/). If fonts are slow, self-host the WOFF2 files instead of Google Fonts.

---

## SEO Post-Launch

1. Submit `sitemap.xml` to Google Search Console + Bing Webmaster
2. Claim / verify Google Business Profile; ensure NAP matches site exactly
3. Get listed on: Healthgrades, Zocdoc, Vitals, Yelp, WebMD Care
4. Start a Q&A blog (`/blog/`) publishing 2 articles/month targeting long-tail conditions
5. After 30 days, check Search Console for indexing & initial rankings
6. After 60 days, run a backlink audit + consider local citations / guest posts

---

## Production Setup Walkthrough (after first deploy)

Two environment-variable integrations unlock email forwarding + production-grade anti-spam.

### Configure Web3Forms email forwarding (5 min)

1. Visit https://web3forms.com — paste `hello@lundpodiatry.com` to receive an access key (free tier: ~250 submits/mo, no signup form).
2. In your Vercel project → **Settings → Environment Variables**, add:
   - `WEB3FORMS_ACCESS_KEY` = the key you received.
3. Re-deploy. Every form submit now emails your inbox AND appears in Vercel logs.

> ⚠️ Without this env var, leads ONLY appear in Vercel Function logs (invisible to non-developers).
> 🛡️ Do NOT add an `email` key to the Web3Forms payload — it re-opens a from-address spoofing vector. The code uses `replyto` only.

### Configure Cloudflare Turnstile anti-spam (10 min)

Cloudflare Turnstile is HIPAA-friendly (no PII collected) and free for ~1M challenges/mo.

1. Sign up at https://dash.cloudflare.com (free tier is fine).
2. **Turnstile → Add a widget**. Choose **Managed** challenge mode (invisible by default).
3. Cloudflare gives you a **Sitekey** (paste into HTML) and a **Secret Key** (set as env var).
4. In `contact.html`, replace `TODO_TURNSTILE_SITE_KEY` with your Sitekey inside `<div class="cf-turnstile" data-sitekey="...">`.
5. In your Vercel project → Environment Variables, add `TURNSTILE_SECRET_KEY` = the Secret Key.
6. Re-deploy. The submit button disables until Turnstile issues a token; 403 responses reset the widget and show an inline error to the user.

### View Vercel Function Logs

1. Vercel dashboard → your project → **Logs** tab.
2. Filter by Function path `/api/contact`.
3. Successful submission emits:
   ```json
   {"at":"...","event":"lead_capture","condition":"...","duration":"...","insurance":"...","delivered_via":"web3forms|web3forms_failed|console_only","ua":"..."}
   ```
4. Rejection emits:
   ```json
   {"at":"...","event":"lead_rejected","reason":"turnstile_failed|invalid_email|missing_fields|rate_limit_exceeded|...","ua":"...","fields":["..."]}
   ```

## End-to-End Testing

### Local API tests via curl

Start the local dev server: `python3 -m http.server 5173` from `sites/lund-podiatry/`. Then run:

```bash
# Happy path (Turnstile skipped since TURNSTILE_SECRET_KEY unset locally)
curl -X POST http://localhost:5173/api/contact \
  -H "Content-Type: application/json" \
  -d '{"firstName":"Jane","lastName":"Doe","phone":"5555551234","email":"jane@example.com","condition":"heel-pain","duration":"under-1-month","insurance":"yes","contactTime":"Morning","_gotcha":""}'
# Expect: HTTP 200, {"ok":true,"delivered":false}

# Missing fields
curl -X POST http://localhost:5173/api/contact \
  -H "Content-Type: application/json" -d '{}'
# Expect: HTTP 400, {"error":"missing_fields","fields":[...]}

# Invalid email
curl -X POST http://localhost:5173/api/contact \
  -H "Content-Type: application/json" \
  -d '{"firstName":"T","lastName":"U","phone":"5555551234","email":"bad","condition":"heel-pain"}'
# Expect: HTTP 400, {"error":"invalid_email"}

# Invalid phone (too few digits)
curl -X POST http://localhost:5173/api/contact \
  -H "Content-Type: application/json" \
  -d '{"firstName":"T","lastName":"U","phone":"123","email":"good@x.com","condition":"heel-pain"}'
# Expect: HTTP 400, {"error":"invalid_phone"}

# Honeypot bot (silent 200)
curl -X POST http://localhost:5173/api/contact \
  -H "Content-Type: application/json" -d '{"_gotcha":"bot"}'
# Expect: HTTP 200, {"ok":true}

# Wrong method
curl http://localhost:5173/api/contact
# Expect: HTTP 405, with `Allow: POST` header

# Body too large (>32 KB)
curl -X POST http://localhost:5173/api/contact \
  -H "Content-Type: application/json" \
  -d "$(python3 -c 'print("{\"x\":\"" + "y"*40000 + "\"}")')"
# Expect: HTTP 413, {"error":"body_too_large"}
```

### Browser tests after deploy

Open an incognito window, visit `/contact.html`. Run each row:

| # | Test | Expected outcome |
|---|---|---|
| 1 | Happy path: complete all 4 wizard steps with valid data + complete Turnstile | Redirect to `/thank-you.html`; Vercel log shows `lead_capture`; Web3Forms email arrives (if env var set) |
| 2 | Invalid email on step 4 | Inline field error; no network submission |
| 3 | Submit without completing Turnstile | Submit button stays disabled; cannot click |
| 4 | Wrong method (curl GET /api/contact) | HTTP 405 with `Allow: POST` |
| 5 | Honeypot filled via direct POST | Server silent 200; no Web3Forms email; no log line |

### Unit tests

```bash
node --test tests/contact-api.test.mjs    # 10 test cases
```

The 10-test suite covers: 405 (wrong method), 413 (body too large), 415 (unsupported content-type), 400 (malformed JSON), honeypot bot → silent 200, missing fields, invalid email/phone, happy path valid data, URL-encoded body parse via stream. Tests assume `TURNSTILE_SECRET_KEY` and `WEB3FORMS_ACCESS_KEY` are unset (dev-mode = verification skipped).

## License

This prototype was hand-built for Lund Podiatry. Treat as work-for-hire deliverable.
