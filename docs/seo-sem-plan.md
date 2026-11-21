# Eximo — speed, SEO, SEM & AI search plan

Audit: Lighthouse 12 (mobile), 22 Nov 2026.

| | Before | After |
|---|---|---|
| Performance | 81 | 96–97 |
| First paint | 3.7 s | 1.2–1.4 s |
| Largest paint | 3.7 s | 2.6–2.8 s |
| Accessibility | 95 | 96–100 |
| SEO / Best practices | 100 / 100 | 100 / 100 |

## Done
### Speed
- [x] Fonts self-hosted (no Google Fonts request), preloaded, `font-display: swap`
- [x] CSS minified and inlined into each page (no render-blocking stylesheet)
- [x] Scripts deferred
- [x] Logo served at display size (68 px) instead of 597 px; favicon + Apple touch icon

### Technical SEO
- [x] Keyword-led titles and meta descriptions on every page ("… Visa from Bangladesh", "Work Abroad from Bangladesh", etc.)
- [x] Canonical URLs on www.eximobd.com, Open Graph + Twitter tags, share image
- [x] `sitemap.xml` (36 URLs) and `robots.txt`
- [x] Custom 404 page (noindex)
- [x] Heading hierarchy and colour-contrast fixes
- [x] Country pages labelled "Visa guide for Bangladeshi nationals"

### Structured data (JSON-LD)
- [x] Organisation (ProfessionalService) on every page: Genova address, phone, Facebook
- [x] Breadcrumbs on every inner page
- [x] FAQPage on the home page and on all 20 country pages (5 visa Q&As each)
- [x] ItemList on visa-type pages, Course on the languages page, Article on work-abroad

### AI search (ChatGPT, Claude, Perplexity, Google AI Overviews)
- [x] `robots.txt` explicitly allows GPTBot, OAI-SearchBot, ClaudeBot, PerplexityBot, Google-Extended
- [x] `llms.txt` — plain-language summary of the business and every page
- [x] "Last reviewed" date on every page header (freshness signal) — set in `build/data.mjs` → `site.reviewed`
- [x] Fact-based, sourced content (BMET figures, official programme rules) that assistants can quote

### SEM / conversions
- [x] Consultation form now opens WhatsApp with the enquiry pre-filled (works without a mail server)
- [x] Events tracked: `generate_lead`, `whatsapp_click`, `phone_click`, `email_click`, `book_consultation_click`
- [x] GA4 ready: set `site.ga4` in `build/data.mjs` and push

## Needs you (accounts only you can create)
1. **Google Search Console** — add `https://www.eximobd.com`, choose *HTML tag*, paste the code into `site.gscVerification`, push, then submit `sitemap.xml`.
2. **Google Analytics 4** — create a property, paste the `G-…` ID into `site.ga4`. Mark `generate_lead` and `whatsapp_click` as key events.
3. **Google Business Profile** — register the Genova office (Via Francesco Ravaschio 97). Biggest single boost for "visa consultant Genova" and map results.
4. **Bing Webmaster Tools** — import from Search Console (feeds ChatGPT search and Copilot).
5. **Facebook page** — add the website link and the same phone/address (consistent NAP helps local ranking).
6. **Real email address** — confirm the inbox to publish (currently `info@eximobd.com`).

## Bangla pages (done)
- [x] `/bn/` home, work abroad, contact, and country guides for Saudi Arabia, Italy, Malaysia, Japan and South Korea (all five visa types each)
- [x] hreflang en ↔ bn on every pair, plus in `sitemap.xml`; language switch in the header
- [x] Bangla fonts self-hosted (Noto Serif / Sans Bengali), loaded only where Bangla text appears
- [x] Bangla FAQ structured data; WhatsApp form sends the enquiry in Bangla
- Lighthouse (Bangla): performance 85–89, accessibility 100, SEO 100
- Content lives in `build/bn.mjs`

## Next content work (recommended order)
1. **More Bangla country guides** — Qatar, Kuwait, Maldives, Singapore, UAE next (largest worker markets).
2. **Italy-specific pages** for the Genova office: permesso di soggiorno, family reunification, Decreto Flussi click-day guide.
3. **Monthly news/updates page** — market openings (Malaysia, Oman), quota dates, scholarship deadlines. Fresh content earns links and AI citations.
4. **Client stories** with permission (real outcomes build trust and E-E-A-T).
5. **Backlinks** — listings in Bangladeshi and Italian business directories, university partner pages, Facebook groups for migrants.

## Google Ads starter plan (when ready)
- Campaigns by intent, each landing on its own page:
  - *Work abroad*: "saudi work visa from bangladesh", "italy work visa bangladesh", "japan ssw bangladesh" → country pages (Work tab)
  - *Study abroad*: "study in uk from bangladesh", "scholarship for bangladeshi students" → visa/study + scholarships
  - *Migration*: "canada pr from bangladesh", "second passport bangladesh" → skilled-migration, residency-citizenship
  - *Local (Italy)*: "consulente visti genova", "permesso di soggiorno genova" → Italy page
- Conversion = `generate_lead` + `whatsapp_click`. Start with a small daily budget per campaign, exact/phrase match, and add negatives ("free visa", "jobs no fee").
- Note: Google requires immigration-services advertisers in some regions to follow its *Immigration services* policy — keep claims factual (no guarantees).

## Maintenance
- Quarterly: update `workMarkets` (BMET data), `site.reviewed`, and any changed visa rules in `build/data.mjs`.
- Yearly: investment and digital-nomad thresholds.
