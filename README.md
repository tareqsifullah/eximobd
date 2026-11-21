# Eximo website

Static site — no framework, no dependencies. Every push to `main` rebuilds and deploys to GitHub Pages (`.github/workflows/pages.yml`).

- **Edit content:** `build/data.mjs` (contact details, countries, visa requirements, FAQs)
- **Rebuild pages:** `node build/build.mjs` (regenerates all HTML in `site/` — don't hand-edit those files)
- **Styles / interactions:** `site/assets/css/style.css`, `site/assets/js/main.js`
- **Preview locally:** `node build/serve.mjs` → http://localhost:4173

## Before going live
- Connect the consultation form: add `data-endpoint="https://…"` to the `<form data-form>` in `consultForm()` in `build/build.mjs` (e.g. a Formspree URL). Without it the form only shows a thank-you message.
- Review visa details in `build/data.mjs` against official sources — rules change often.
- Add verified language partner institutes to `providers` in `build/data.mjs` (the Languages page lists them automatically).
- Refresh `workMarkets` (BMET figures and market status) each quarter, and the investment/nomad thresholds at least yearly.

## Domain
GitHub Pages serves the site at `www.eximobd.com` (set under repo Settings → Pages). DNS is managed in the Namecheap hosting cPanel (Zone Editor):
- `www` → CNAME `tareqsifullah.github.io`
- `eximobd.com` → A `185.199.108.153`, `185.199.109.153`, `185.199.110.153`, `185.199.111.153`
- Leave MX / mail / TXT records unchanged (email runs on Namecheap hosting).
