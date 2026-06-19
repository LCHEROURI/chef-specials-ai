# Deploy `lund-podiatry` to Vercel — Step-by-Step (GitHub auto-deploy)

> **Path of least friction**: this walkthrough uses **GitHub auto-deploy**, where every `git push` to your `main` branch triggers a production deploy, and every `git push` to a non-main branch gives you a preview URL to share with stakeholders. Drag-and-drop is still supported as a one-off alternative — see the **Alternative tail: drag-and-drop** section at the bottom.

---

## Pre-flight checklist (before you touch vercel.com/new)

| Check | How |
|---|---|
| Site folder exists | `test -d sites/lund-podiatry && echo OK` |
| Folder is upload-ready (no junk) | `find sites/lund-podiatry -name '.DS_Store' -o -name '__MACOSX'` returns nothing |
| Entry point at folder root | `test -f sites/lund-podiatry/index.html && echo OK` |
| Serverless function present | `test -f sites/lund-podiatry/api/contact.js && echo OK` |
| `vercel.json` at subdirectory | `test -f sites/lund-podiatry/vercel.json && echo OK` |
| `.vercelignore` at subdirectory (NEW) | `test -f sites/lund-podiatry/.vercelignore && echo OK` |
| GitHub remote is configured | `cd sites/lund-podiatry/.. && git remote -v` shows `github.com` URL |
| Current branch pushed to GitHub | `git status -uno` should say "Your branch is up to date" |

If any check fails, fix it locally **before** you touch Vercel.

---

## Step 1 — Connect the repo to Vercel (one-time, ~5 min)

1. Open **https://vercel.com/new** in your browser.
2. Log in (or sign up — GitHub OAuth is fastest if your repo lives on GitHub).
3. Under **"Import Git Repository"**, search for the repo your `prompt-vault-pro` code lives in (e.g. `LCHEROURI/prompt-vault-pro`).
4. Click **Import** next to the repo.

> ℹ️ If Vercel doesn't see the repo, click **"Adjust GitHub App Permissions"** and grant access to the org/owner that owns it.

---

## Step 2 — Configure the import

Vercel shows a configuration form. **Fill every field exactly as shown:**

| Field | Choose | Why |
|---|---|---|
| **Project Name** | `lund-podiatry` | New namespace — won't collide with `prompt-vault-pro` projects |
| **Framework Preset** | **Other** | Pure static HTML — Vercel may auto-detect; if it picks something, click "Edit" and select "Other" |
| **Root Directory** | `sites/lund-podiatry` | **Critical** — Vercel will only build deploy from this subdirectory; the root `package.json` + root `vercel.json` are ignored |
| **Build Command** | **leave empty** | No build step |
| **Output Directory** | **leave empty** (auto-detects `.` of Root) | Files already sit at the deploy root |
| **Install Command** | **leave empty** | No `npm install` |
| **Node.js Version** | leave default | Not used — but if it warns, click "Override" and pin a recent LTS like 20.x |

**Click `Deploy`.** ~30 seconds end-to-end. Vercel will read `sites/lund-podiatry/vercel.json` (which sets `cleanUrls`, asset cache headers, noindex on `/thank-you`) and ship a fresh preview URL.

When the deploy finishes, Vercel gives you a URL like `https://lund-podiatry-abc123.vercel.app`. Click it to see the live site.

---

## Step 3 — Set the production branch (every push triggers a deploy)

By default, Vercel uses **`main`** as the production branch and treats every other push as a **Preview Deploy**. If your main branch is named differently:

1. Vercel → your project → **Settings** → **Git**.
2. **Production Branch**: type the name of the branch you commit launches to (e.g., `main`, or `codex/prompt-vault-pro` if you want the current branch to be production).
3. **Save**.

**Branch strategy**:

| Branch you push to | Vercel action | URL pattern |
|---|---|---|
| Production branch (e.g. `main`) | **Production Deploy** | `https://lund-podiatry.vercel.app` (after domain add) or `https://lund-podiatry-git-main-<org>.vercel.app` |
| Any other branch (e.g. `feature/foo`) | **Preview Deploy** | `https://lund-podiary-git-feature-foo-<org>.vercel.app` |
| Every Pull Request against the production branch | **PR Preview Deploy** + comment on the PR with the preview URL | same pattern as branch preview |

To trigger a production deploy: `git push origin main` (or whatever your production branch is). Vercel builds + deploys in ~30 seconds.

If you'd rather add a brand-new production branch for the lund-podiatry work (e.g., isolate it from prompt-vault-pro commits):

```bash
git fetch origin
git checkout -b lund-podiatry-main origin/main   # or any base branch
git push -u origin lund-podiatry-main            # create the branch
# Then in Vercel → Settings → Git → Production Branch = lund-podiatry-main
```

---

## Step 4 — Add environment variables

> **⚠️ Critical**: without these env vars, leads arrive in Vercel Function logs only — NOT your inbox.

### `WEB3FORMS_ACCESS_KEY` (so the form emails you)

1. Visit https://web3forms.com → paste `hello@lundpodiatry.com` as the destination → click **Get Access Key** (free tier is fine for ~250 submits/mo).
2. Web3Forms emails you the access key. **Copy it.**
3. Vercel → project → **Settings** → **Environment Variables** → **Add**.
   - **Name**: `WEB3FORMS_ACCESS_KEY`
   - **Value**: the key
   - **Environments**: ☐ Production ☐ Preview ☐ Development → check all three (so previews also email)

### `TURNSTILE_SECRET_KEY` (so Cloudflare Turnstile works)

1. https://dash.cloudflare.com → Turnstile → **Add a widget**.
2. Name: `Lund Podiatry` · Hostname: `lundpodiatry.com` (and the vercel.app preview hostname while iterating).
3. **Widget mode**: **Managed** (invisible).
4. Cloudflare shows you two values:
   - **Sitekey** (e.g. `0x4AAAAAAA...`) — this goes into HTML, see Step 5
   - **Secret Key** (e.g. `0x4AAAAAAA...`) — this goes into Vercel env vars
5. Vercel → Settings → Environment Variables → **Add**
   - **Name**: `TURNSTILE_SECRET_KEY`
   - **Value**: Secret Key
   - **Environments**: ☐ Production ☐ Preview ☐ Development → check all three

> 🛡️ **Do NOT add an `email` key to the Web3Forms payload** anywhere in `api/contact.js`. Turns + this env-var-pair-as-loaded means the code deliberately uses `replyto` only — adding `email` reopens a from-address spoofing vector. See the SECURITY note in the file.

After saving both env vars, the next push to your production branch will deploy with them applied. (Vercel does NOT retro-apply env vars to already-built artifacts — if you've already pushed + built once before adding these, push any small change to trigger a fresh build, or redeploy from the Deployments panel.)

### `RESEND_API_KEY` (recommended for HIPAA-compliant lead relay)

The contact handler (`sites/lund-podiatry/api/contact.js`) auto-dispatches: **`RESEND_API_KEY` > `WEB3FORMS_ACCESS_KEY` > console-only**.

1. https://resend.com → sign up → **Pro plan** ($20/mo, ≤50K emails) is required for the BAA.
2. **Domains** → **Add Domain** → `lundpodiatry.com` → add the DNS records Resend shows you (DKIM + SPF TXT) at your registrar. Wait 5–30 min for verification.
3. **API Keys** → **Create API Key** → name `lund-podiatry-prod` → copy.
4. Vercel → Settings → Environment Variables → **Add**:
   - **Name**: `RESEND_API_KEY`
   - **Value**: API key (starts with `re_`)
   - **Environments**: ☐ Production ☐ Preview ☐ Development → all three
5. Optional overrides:
   - `MAIL_TO` (defaults to `hello@lundpodiatry.com`)
   - `MAIL_FROM` (defaults to `Lund Podiatry Website <noreply@lundpodiatry.com>` — must be in the verified domain)
6. **Compliance** → request the BAA PDF, sign + counter-sign, store in your HIPAA binder.

Once `RESEND_API_KEY` is set, the handler sends leads via Resend's HIPAA-grade infrastructure. With both keys set, Resend wins; to force Web3Forms, unset `RESEND_API_KEY`. Until you've signed the BAA, the form copy stays at "Encrypted in transit" — not "HIPAA-secure" — so the site doesn't make an unsupported compliance claim.

---

## Step 5 — Replace the Turnstile placeholder sitekey in HTML (one-time)

The contact form has `<div class="cf-turnstile" data-sitekey="TODO_TURNSTILE_SITE_KEY">`. After you have the real **Sitekey** from Step 4:

```bash
cd sites/lund-podiatry && \
perl -i -pe 's|TODO_TURNSTILE_SITE_KEY|<your-real-sitekey-here>|g' contact.html

# Sanity check
grep -c 'TODO_TURNSTILE_SITE_KEY' contact.html    # must return 0
```

Commit + push:

```bash
cd sites/lund-podiatry/..   # back to repo root
git add sites/lund-podiatry/contact.html
git commit -m "feat: replace Turnstile sitekey placeholder"
git push origin <your-production-branch>
```

Vercel rebuilds → widget renders on `/contact.html` → submits verify against your `TURNSTILE_SECRET_KEY`.

---

## Step 6 — Replace content placeholders before pointing DNS

There are still **~92 `TODO_UPDATE_*` markers** scattered across all 14 HTML pages (NAP: city / state / street address / zip / phone) plus hardcoded `(555) 555-0123` phone numbers. **Don't point `lundpodiatry.com` DNS at the deploy until these are filled** — Google will index the placeholder content and that's costly to fix later.

Bulk replace (one-time launch values):

```bash
cd sites/lund-podiatry && \
find . -name '*.html' -exec sed -i '' \
  -e 's|TODO_UPDATE_STREET_ADDRESS|2510 47th St|g' \
  -e 's|TODO_UPDATE_CITY|Boulder|g' \
  -e 's|TODO_UPDATE_STATE|CO|g' \
  -e 's|TODO_UPDATE_ZIP|80301|g' \
  -e 's|+1-555-555-0123|+1-303-555-0123|g' \
  -e 's|(555) 555-0123|(303) 555-0123|g' {} +

# Verify zero TODOs remain
grep -rE 'TODO_|555-555' . | wc -l    # must return 0
```

Adjust placeholder values to your real practice before running. Then commit + push:

```bash
cd .. && git add sites/lund-podiatry/ && git commit -m "content: fill NAP placeholders" && git push
```

> ⚠️ **Don't forget the four Google Maps lat/lng in `about.html` JSON-LD**:
>
> - Search your practice address on Google Maps → right-click the pin → **"What's here?"**
> - Copy the **latitude** and **longitude** (6 decimals, e.g. `40.015740, -105.270240`)
> - Replace `TODO_UPDATE_LAT` and `TODO_UPDATE_LNG` in `about.html` JSON-LD `geo` block AND in `contact.html` Maps iframe query

Critical for Google Maps pack ranking.

---

## Step 7 — Verify the live deployment end-to-end

Hit every page from your phone (cellular, not wifi — simulates a real patient).

| URL | What you should see |
|---|---|
| `/` | Sticky "Book Appointment" CTA, conditions grid with 9 cards, hero with green-featured **Orthotics** |
| `/about.html` | Dr. Lund biography, credentials, philosophy |
| `/contact.html` | 4-step wizard with **Cloudflare Turnstile widget** rendering properly + Google Maps iframe |
| `/services/orthotics.html` | Featured service, "3D casting" section |
| `/services/heel-pain.html` | Heel pain / plantar fasciitis |
| `/services/bunions.html` | Bunion treatment |
| `/services/hammertoes.html` | Hammertoes |
| `/services/diabetic-foot-care.html` | Diabetic foot screening |
| `/services/ingrown-toenails.html` | Ingrown toenails |
| `/services/sports-injuries.html` | Sports podiatry |
| `/services/neuropathy.html` | Neuropathy screening |
| `/services/plantar-fasciitis.html` | Plantar fasciitis (separate from heel-pain) |
| `/insurance.html` | Insurance plans, payment options |
| `/thank-you.html` | Post-submit page |

**Submit a REAL lead** through the form: open `/contact.html` → complete all 4 steps → solve Turnstile → submit.
- Within ~30 seconds, the email should arrive at `hello@lundpodiatry.com` (with `WEB3FORMS_ACCESS_KEY` set).
- If not, check **Vercel → Project → Logs → Functions** for `event: lead_capture` (logs PHI-light: condition, duration, insurance — never name or email — for HIPAA safety).

---

## Step 8 — Connect `lundpodiatry.com`

Vercel → Project → **Settings** → **Domains** → **Add** → type `lundpodiatry.com` → **Add**.

Vercel will show you DNS records to add at your registrar (likely GoDaddy since the original site was on GoDaddy Builder):

| Domain | Type | Value |
|---|---|---|
| `lundpodiatry.com` | A | `76.76.21.21` |
| `www.lundpodiatry.com` | CNAME | `cname.vercel-dns.com` |

**At your registrar (GoDaddy example)**:
1. GoDaddy → My Products → `lundpodiatry.com` → **DNS** → **Manage Zones**.
2. Delete any existing A records on `@` (apex), add `76.76.21.21`.
3. Delete existing CNAME on `www`, add `cname.vercel-dns.com`.
4. Save.

**Wait 5–30 minutes** for DNS propagation. Vercel auto-detects and provisions a free SSL cert.

Verify: `dig lundpodiatry.com +short` should return `76.76.21.21`. Curl `https://lundpodiatry.com/` should serve your page.

Optional: in Vercel **Domains**, redirect `www` → apex so `www.lundpodiatry.com` lands at `lundpodiatry.com` (and Google sees one URL, not duplicates).

---

## Step 9 — Submit to Google Search Console (once DNS is live)

1. https://search.google.com/search-console → **Add property** → URL prefix → `https://lundpodiatry.com` → verify via DNS TXT record.
2. **Sitemaps** → submit `https://lundpodiatry.com/sitemap.xml`.
3. **URL Inspection** → each of your 14 URLs → **Request Indexing**.

For fastest Google pickup within 24-48 hours, also ping Bing Webmaster Tools with the same sitemap.

---

## Troubleshooting

| Symptom | Cause | Fix |
|---|---|---|
| Form posts but no email arrives | Missing `WEB3FORMS_ACCESS_KEY` or wrong environment scope | Vercel → Settings → Env Vars → make sure **Production** is checked (or all 3 for preview parity) |
| Form posts but 403 turnstile_failed | `TURNSTILE_SECRET_KEY` doesn't match the sitekey in HTML | Make sure both keys came from the **same** Turnstile widget |
| Build fails with "no such file" errors | Root Directory misconfigured | Vercel → Project Settings → General → Root Directory must be `sites/lund-podiatry` (with leading `./` if prompted) |
| `vercel.json` at repo root taking over | Parent directory's conf is being read | Double-check Root Directory includes the trailing subdir |
| Lead arrives but PHI fields blank | Browser didn't include them | Check Vercel logs (Project → Logs → Functions) for `event: lead_capture` raw JSON |
| DNS still on GoDaddy hours later | DNS propagation delay | Wait; or `dig lundpodiatry.com @8.8.8.8 +short` to use Google DNS |
| Maps shows "Google Maps can't find this place" | `TODO_UPDATE_*` still in the iframe `src` query | Run the Steps 6 sed replace + push |

---

## HIPAA / BAA note (last-mile — now with Resend built-in)

The contact handler auto-dispatches by env precedence:

| Env var state | Relay | BAA status |
|---|---|---|
| `RESEND_API_KEY` set | **Resend** (Pro plan with signed BAA) | ✅ HIPAA-eligible |
| `RESEND_API_KEY` unset, `WEB3FORMS_ACCESS_KEY` set | Web3Forms (free tier) | ❌ No BAA |
| Both unset | Log only (leads appear in Vercel Function logs) | N/A |

**Until option 1 (Resend + signed BAA) is configured**, the form copy reads "Encrypted in transit" instead of "HIPAA-secure" to avoid an unsupported compliance claim. To re-enable the "HIPAA-secure" wording after signing Resend's BAA, swap it back in `sites/lund-podiatry/contact.html`.

Three upgrade paths if Resend isn't the right fit:

1. **Upgrade to Web3Forms paid tier** — email Web3Forms support, BAA available on request (~$10–25/mo).
2. **Paubox intake forms** — healthcare-specific (~$30–50/mo).
3. **Formspree HIPAA tier** — broader CMS-ish integration (~$50/mo).

While Web3Forms-free-tier is in use and you're collecting anything more than initials + condition + insurance, **STOP**: Web3Forms is not contractually obligated to safeguard PHI. Either upgrade Web3Forms (path 1) or migrate complete relay to Resend (cleaner code path; no code change needed beyond adding the API key + signing their BAA).

---

## Daily workflow after launch

```bash
# Make an edit
vim sites/lund-podiatry/contact.html

# Commit + push
git add sites/lund-podiatry/
git commit -m "fix: clarify form copy"
git push origin main

# Vercel auto-builds + deploys in ~30 sec. Done.
```

That's it. Every push, every preview URL, every rollback available from the Vercel dashboard.

---

## Alternative tail: drag-and-drop (one-off)

If you ever need to deploy **without** GitHub (e.g., vendor handoff, paper prototype to a non-coding stakeholder):

1. Open Finder → navigate to `sites/lund-podiatry/`.
2. Open https://vercel.com/new in a browser.
3. Drag the `lund-podiatry` folder onto vercel.com/new.
4. Vercel skips the Git integration and deploys immediately.

**Caveats**: drag-and-drop creates a *separate* project from the GitHub-wired one. Two management paths for two projects is the trade-off. If you do this regularly, move to GitHub.

---

## You're done 🎉

If `https://lundpodiatry.com/` serves the right content, the form delivers leads to your inbox, and Google indexes the sitemap within 48 hours — you're launched.

Ongoing: monitor Vercel Function logs daily for the first week. Submit more pages to Google Search Console if you add blog content. Re-verify SSL auto-renew 60 days later.
