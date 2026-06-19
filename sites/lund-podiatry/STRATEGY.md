# Lund Podiatry — Full Implementation Strategy

> **Goal:** Transform lundpodiatry.com from a single-page GoDaddy Website Builder site into a modern, conversion-optimized medical practice website that ranks for high-intent local searches and captures leads through a frictionless multi-step contact form.

---

## 0. Executive Summary

Lund Podiatry has a strong foundation (real credentialed doctor, clear medical positioning) but the current site leaves significant revenue, ranking, and trust on the table. The redesign focuses on four pillars:

| Pillar | Goal | Primary lever |
|---|---|---|
| **Conversion** | Convert 3–6% more visitors into leads | Multi-step form with asymmetric incentive |
| **SEO — Local** | Rank #1–3 for "[condition] podiatrist + [city]" | LocalBusiness + Physician schema, NAP consistency |
| **SEO — Long-tail** | Rank for 8 high-intent conditions | Dedicated silo pages with MedicalCondition schema |
| **Trust / Commercial** | Increase perceived premium without losing medical credibility | Modern visual system, real photography, outcome proof |

---

## 1. Current-State Audit (lundpodiatry.com)

**Strengths to keep**
- Real, named doctor (Dr. Alexis Lund) — strong E-E-A-T signal
- Clear medical positioning, clean current copy
- Direct phone number visibility

**Conversion gaps**
- Single page only — no dedicated landing pages for high-intent searches
- No testimonials, reviews, or before/after — zero social proof
- 'Contact Us' form push (form is generic, no friction reduction)
- No insurance information (top driver of medical bounce)
- No online scheduling / booking
- No calls-to-action above the fold aside from phone

**SEO gaps**
- Single page → no topical authority / silo structure
- No visible city/neighborhood SEO content
- Schema markup likely absent (template default)
- Slow GoDaddy template, large LCP, no `font-display: swap`
- No `robots.txt`, no `sitemap.xml`
- No blog / educational content
- Open Graph probably missing

**Visual gaps**
- Stock template feel (right out of 2018)
- No brand identity: no logo, generic typography
- No actual photos of Dr. Lund or the clinic
- No motion, no hierarchy

---

## 2. Information Architecture (New)

```
/                            → Homepage (conversion-focused)
/about/                      → About Dr. Lund + Physician schema
/contact/                    → Multi-step lead form
/insurance/                  → Accepted insurances (high-traffic)
/thank-you/                  → Form completion confirmation
/services/
   plantar-fasciitis/        → MedicalCondition + FAQ schema
   bunions/
   ingrown-toenails/
   diabetic-foot-care/
   heel-pain/
   hammertoes/
   neuropathy/
   sports-injuries/
/blog/                       → Editorial hub (future; stubbed)
/resources/                  → Patient forms, post-op instructions (future)
```

**Why this structure?**
- Each service URL becomes a long-tail landing page that ranks for "[condition] podiatrist [city]" and converts that traffic with condition-specific social proof
- Internal links from condition pages → /contact/ create a clean conversion path
- Schema per page type trains Google for rich results (FAQ rich snippets, local pack)

---

## 3. Homepage Architecture (Conversion Order)

The page is read top-to-bottom, so sections are ordered by **trust + intent**:

1. **Sticky Header** — Phone number (left), "Free Insurance Check" CTA (right, sage pill button)
2. **Hero** — Lifestyle image of doctor with patient (right), H1 "Step without pain.", H2 with city, dual CTA (form / call), microcopy ("2-hour reply • HIPAA-secure")
3. **Trust Bar** — Google 5.0 stars (badge) • Years in practice • "Most insurance accepted" • Board-certified logos placeholder
4. **Conditions Grid** — 8 cards, each linking to its silo page. Cards = icon + condition + 1-line symptom + "Learn more" arrow
5. **"What to Expect" Process Strip** — 3-step visual: Book → Comprehensive Exam → Personalized Plan. Reduces anxiety; answers "what happens?" objection
6. **About Dr. Lund** — Photo + 3-bullet bio + credentials + link to full bio
7. **Testimonials** — 3 quoted cards (placeholder copy with note to swap with real), with star ratings and condition tag (e.g., "Heel Pain")
8. **Insurance** — Inline strip: "Most major insurance accepted — free coverage check below"
9. **FAQ Accordion** — 6 questions (insurance, first visit cost, do I need a referral, etc.) — also serves as FAQPage schema for rich snippets
10. **Final CTA Section** — "Ready to move without pain?" — full-width sage band with form/phone CTAs
11. **Footer** — NAP (Name, Address, Phone), embedded Google Map preview, hours, social links, HIPAA privacy link, sitemap link, "© 2026 Lund Podiatry"

Micro-details throughout:
- **Sticky mobile bar** with phone + book buttons
- **Floating phone bar** appears after 8s scroll on desktop
- **"How can we help?" chat-style prompt** removed (avoid HIPAA risk; use form instead)

---

## 4. Conversion Strategy — Multi-Step Form

The form is the single highest-leverage element. We replace generic "Contact Us" with a 4-step **intent-capture** flow:

| Step | Question | Why this order |
|---|---|---|
| **1** | "Where does it hurt?" (foot map selector or dropdown) | Low-stakes, engages right away |
| **2** | "How long has this been bothering you?" | Triages urgency, primes personalized reply |
| **3** | "Quick insurance check — we accept most major plans" | Removes #1 objection (cost) |
| **4** | Name, phone, email, preferred contact time | Captures contact last — lowest friction |

**Form micro-tactics**
- **Asymmetric incentive:** not "Contact Us" but "Get my free insurance & treatment check"
- **Time-to-reply promise:** "We reply within 2 business hours"
- **HIPAA reassurance:** "Your info is encrypted & HIPAA-secure. We never share data."
- **Progress bar** showing step X of 4
- **Back button** allowed
- **Phone validation** with format hint
- **No required newsletter opt-in** (avoid dark-pattern perception)
- **Submit → thank-you page** with "what happens next" 3-step illustration + emergency-call notice

---

## 5. SEO Strategy

### 5a. Local SEO (Priority #1)

- **NAP consistency** across site footer, Google Business Profile (GBP), Yelp, Healthgrades, Zocdoc, Vitals
- **LocalBusiness JSON-LD** on homepage with: name, address, phone, hours, geo coordinates, servedArea (city list), priceRange, medicalSpecialty
- **Physician JSON-LD** on /about/ with: name, credential (DPM), alumniOf, memberOf, workLocation
- **Google Maps embed** in footer / contact page
- **City mentions** in every homepage section ("Serving [city], [city], and surrounding areas")
- **Reviews** strategy: actively request Google reviews post-visit; embed Google review widget in /about/### 5b. Long-Tail Condition Pages (Priority #2)

Each service page targets "[condition] podiatrist [city]" and follows this template:

1. **Header:** H1 = "[Condition] Treatment in [City] — Personalized Care"  • Eyebrow text
2. **Intro (2 paragraphs):** What it is, who it affects, why personalized care matters
3. **Symptoms checklist:** Visual list of 5–7 symptoms ("Do any apply?")
4. **Our approach:** 3-step treatment explanation (conservative → advanced → surgical if needed)
5. **Why Dr. Lund:** 2 paragraphs differentiating Lund's approach vs general podiatrists
6. **Insurance / Cost:** 1 paragraph ("Most plans accepted — free coverage check")
7. **FAQ accordion** — 5 questions specific to the condition (5x on-page FAQs makes rich snippets likely)
8. **Sticky sidebar CTA** — "Get my free insurance check" → /contact/?source=plantar-fasciitis
9. **Related conditions:** 3–4 cross-links (builds silo)
10. **Schema:** MedicalCondition + FAQPage + BreadcrumbList

**The priority services** (high commercial intent + search volume in podiatry):

1. Plantar Fasciitis — highest volume, very intent-rich
2. Bunions — surgical referrals = high LTV
3. Ingrown Toenails — common new-patient entry point
4. Diabetic Foot Care — high medical authority + recurring
5. Heel Pain / Heel Spurs — covers general queries plantar fasciitis doesn't catch
6. Hammertoes — surgical referral value
7. Neuropathy — chronic-care recurring visits
8. Sports Injuries / Foot & Ankle — niche differentiation
9. **Custom Orthotics** (added per client priority) — productized service, recurring revenue, cross-cuts every condition. Often the cornerstone of multi-condition plans and frequently insurance-covered, so commercial impact is high while keeping the medical positioning honest.

### 5c. Technical SEO (Priority #3)

- **Core Web Vitals targets:** LCP < 2.0s, INP < 200ms, CLS < 0.05
- All images: explicit width/height (CLS), `loading="lazy"` below fold, `srcset` for responsive
- Fonts: Google Fonts with `font-display: swap`, preloaded critical weights
- CSS: single stylesheet, no render-blocking JS
- JS: deferred, no third-party blocking tags in hero
- Canonical tags on every page, no duplicate params
- Open Graph + Twitter Card on every page
- `robots.txt` references sitemap
- `sitemap.xml` lists all pages with `lastmod` and priority
- Structured data validated against Schema.org

---

## 6. Visual Identity System

**Color palette**

| Role | Token | Hex | Where it's used |
|---|---|---|---|
| Primary navy | `--ink` | `#0F1E3D` | Headings, body text, header bg |
| Brand accent (sage) | `--sage` | `#4A9B8F` | Primary buttons, links, accent rules |
| Brand accent (deep) | `--sage-deep` | `#356B63` | Hover, focus rings |
| Cream | `--cream` | `#FAF7F2` | Page background |
| Card white | `--paper` | `#FFFFFF` | Card surfaces |
| Muted | `--mist` | `#E7EEEC` | Dividers, table stripes |
| Text muted | `--slate` | `#5A6373` | Secondary copy |
| Warm accent (warnings) | `--terracotta` | `#C97B5A` | Trust-prompt badges (sparingly) |

**Why this palette?** Navy signals trust (medical), sage signals healing/wellness without feeling sterile, cream is warmer than pure white (modern medical aesthetic). Avoid the cliché "medical cyan blue."

**Typography**

- **Headings:** `'Plus Jakarta Sans'`, 600 weight, tight tracking
- **Body:** `'Inter'`, 400/500, comfortable reading size
- **Display (hero only):** Same as headings, larger, leading-tight

**Photography direction**

- Warm, well-lit candid shots of doctor with patient (placeholder via Unsplash with note to swap with real shoot)
- Modern clinic interior shots (white + natural wood + greenery)
- Avoid stock-photo "hand on shoulder" stereotypes
- Before/after galleries for bunions, ingrown toenails, fungal nails (with consent)

**Motion**

- `IntersectionObserver` fade-up on sections (8px translate + 400ms ease-out)
- Buttons: scale 00.97 + slight shadow on press
- Cards: 4px translate-up on hover, 350ms
- Sticky header: subtle blur + 1px border on scroll
- Form-step transitions: 200ms cross-fade, no flashy effects (medical site = calm)

---

## 7. Copy Direction (Voice)

Lund Podiatry's voice is **warm, confident, expert-but-not-clinical**. Examples:

- ❌ "Podiatric medicine for foot conditions."
- ✅ "Step without pain. Personalized foot and ankle care that gets results."

- ❌ "Submit inquiry form."
- ✅ "Get my free insurance check"

- ❌ "Dr. Lund has treated many cases of plantar fasciitis."
- ✅ "Dr. Lund has helped hundreds of patients walk pain-free again — without surgery when possible."

**Voice rules**
- Lead with benefit, not condition
- Use second person ("you") more than third ("patients")
- Avoid medical jargon on hero sections; use it for credibility deeper in the page
- Always include number/specificity when possible ("500+ patients", "15 years")

---

## 8. Top 10 Highest-Leverage Implementation Steps

Ranked by impact-to-effort ratio. Do these first if scoping limited:

1. **Rewrite homepage hero** with new H1, sub, and dual CTA (form + phone)
2. **Build the multi-step form** with intent questions before contact fields
3. **Add 8 condition pages** with FAQ schema (these are SEO multipliers)
4. **Add Physician + LocalBusiness JSON-LD** to appropriate pages
5. **Build trust strip** (Google rating, years, insurances, board-cert)
6. **Add FAQ accordion** to homepage (rich snippet opportunity)
7. **Add testimonials section** with real or honest placeholders
8. **Fix NAP footer** with consistent info + Google Maps preview
9. **Add robots.txt + sitemap.xml**
10. **Replace stock photos** with real Dr. Lund / clinic photos

---

## 9. Back-End / Integrations (Not in Static Prototype)

When wiring up the deployed site:

- **Form destination:** Supabase Edge Function (or HubSpot Forms, Mailchimp, Jane App) — store leads, auto-respond with SMS/email
- **Booking (optional Phase 2):** Integrate Jane App / Calendly / Acuity
- **Reviews widget:** Birdeye, Podium, or Google Reviews API
- **Analytics:** Plausible or Umami (privacy-friendly, no cookie banner needed for most jurisdictions) + Google Search Console
- **Call tracking (optional):** CallRail for attribution
- **Chat (NOT recommended):** HIPAA risk; if needed, use compliant providers (e.g., Updox)

---

## 10. Compliance Notes

- **HIPAA:** No PHI (no patient names, DOB, etc.) in analytics, no third-party chat, no plain-text emails with patient info
- **ADA:** All form fields labeled, ARIA live region for form errors, 4.5:1 contrast minimum, keyboard navigation
- **FTC:** Disclose any paid endorsements in testimonials; if images are stock, no false claims
- **State medical board:** Don't make unsubstantiated outcome claims
- **Cookie consent:** Even with privacy-friendly analytics, add a small banner if Google Fonts or Google Maps load (currently Google Fonts is privacy-friendly because no cookies set)

---

## 11. Success Metrics (KPIs)

Track before/after over 90 days:

- Form completion rate (target: 4%+ of visitors)
- Click-to-call rate (target: 2%+ from mobile)
- Phone-call-to-booked-appointment rate (operations)
- Organic impressions in GSC (target: 3× growth in 90 days)
- Ranking for top 8 long-tail conditions (target: top 10 within 6 months)
- Bounce rate (target: <55% on condition pages)
- Average position in local pack (target: top 3 within 6 months)
- Core Web Vitals (target: all green)

---

## 12. What's Included in This Static Prototype

This repo's `sites/lund-podiatry/` contains a **frontend-only** implementation that:

- Shows exactly what every page should look like, copy, and behave
- Implements the visual system, motion, and form fully
- Includes all SEO meta + JSON-LD schemas
- Provides a clean structure to drop into any host (Vercel, Netlify, GoDaddy HTML upload, S3 + CloudFront, etc.)
- Documents integration points (form destination, analytics, etc.) in `README.md`

**What this prototype does NOT include** (deliberately, to keep it portable):
- Form backend submission (form currently goes to `/thank-you/` — wire up Supabase or HubSpot)
- Booking system integration
- Real photography (uses Unsplash placeholders)
- CMS (static HTML — add Sanity/Strapi if non-technical owners will edit content)
- Live review widget (uses hard-coded Google rating placeholder)

See `README.md` for deployment steps and integration wiring.
