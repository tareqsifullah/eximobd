// Static site generator for Eximo. Usage: node build/build.mjs
import { writeFileSync, mkdirSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  site, visaTypes, countries, faqs, workMarkets, departureSteps, skilledRoutes,
  nomadVisas, investmentPrograms, languageCourses,
} from './data.mjs';

const OUT = join(dirname(fileURLToPath(import.meta.url)), '..', 'site');
const year = new Date().getFullYear();
const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const tel = site.phone.replace(/[^+\d]/g, '');
const clip = (s, n = 155) => (s.length <= n ? s : s.slice(0, s.lastIndexOf(' ', n - 1)).replace(/[,;:—-]$/, '') + '…');
const A = '<span class="arr" aria-hidden="true">→</span>';
const regions = [
  ['Europe', 'Europe'],
  ['North America', 'North America'],
  ['Oceania', 'Oceania'],
  ['Asia', 'Asia'],
  ['Middle East', 'Gulf & Middle East'],
];
const verbs = { study: 'study', work: 'work', tourist: 'visit', family: 'join family', medical: 'get treatment' };
const byRegion = (r) => countries.filter((c) => c.region === r);
const factsOf = (c) => Array.isArray(c.facts)
  ? c.facts
  : [['Main intakes', c.facts.intakes], ['After study', c.facts.postStudy], ['Language tests', c.facts.test], ['Currency', c.facts.currency]];

const migrationLinks = [
  ['skilled-migration.html', 'Skilled migration', 'Points-based permanent residence'],
  ['digital-nomad.html', 'Digital nomad visas', 'Live abroad, work remotely'],
  ['residency-citizenship.html', 'Residency & second citizenship', 'Investment programmes with partner lawyers'],
];
const studyLinks = [
  ['scholarships.html', 'Scholarships', 'Funded study abroad'],
  ['languages.html', 'Language courses', 'IELTS, German, Japanese, Korean, Italian'],
  ['career-counselling.html', 'Career counselling', 'Choose the course for the career'],
];

const BUILD_DATE = new Date().toISOString().slice(0, 10);
const faqSchema = (pairs) => ({ '@type': 'FAQPage', mainEntity: pairs.map(([q, a]) => ({ '@type': 'Question', name: q, acceptedAnswer: { '@type': 'Answer', text: a } })) });

// ---------- layout ----------
// Organisation entity shared by every page (helps Google and AI assistants identify the business)
const orgSchema = {
  '@type': 'ProfessionalService',
  '@id': `${site.url}/#org`,
  name: site.legal,
  alternateName: site.name,
  url: `${site.url}/`,
  logo: `${site.url}/assets/img/logo-512.png`,
  image: `${site.url}/assets/img/logo-512.png`,
  description: 'Study abroad, work visa, skilled migration, residency and language-course advisory for students, workers and professionals from Bangladesh.',
  telephone: site.phone.replace(/[^+\d]/g, ''),
  email: site.email,
  address: { '@type': 'PostalAddress', streetAddress: 'Via Francesco Ravaschio 97', addressLocality: 'Genova', addressRegion: 'Liguria', addressCountry: 'IT' },
  areaServed: [{ '@type': 'Country', name: 'Bangladesh' }, { '@type': 'Country', name: 'Italy' }],
  sameAs: [site.facebook],
  contactPoint: { '@type': 'ContactPoint', telephone: site.phone.replace(/[^+\d]/g, ''), contactType: 'customer service', availableLanguage: ['English', 'Bengali', 'Italian'] },
};
const crumbNames = {
  'destinations.html': 'Destinations', 'work-abroad.html': 'Work abroad', 'skilled-migration.html': 'Skilled migration',
  'digital-nomad.html': 'Digital nomad visas', 'residency-citizenship.html': 'Residency & second citizenship', 'languages.html': 'Language courses',
  'scholarships.html': 'Scholarships', 'career-counselling.html': 'Career counselling', 'about.html': 'About', 'contact.html': 'Contact',
};
function breadcrumbSchema(path) {
  if (path === 'index.html') return null;
  const items = [['Home', '']];
  const [dir, file] = path.includes('/') ? path.split('/') : [null, path];
  if (dir === 'countries') items.push(['Destinations', 'destinations.html'], [countries.find((c) => `${c.slug}.html` === file).name, path]);
  else if (dir === 'visas') items.push([visaTypes.find((v) => `${v.key}.html` === file).title, path]);
  else if (crumbNames[path]) items.push([crumbNames[path], path]);
  return { '@type': 'BreadcrumbList', itemListElement: items.map(([name, p], i) => ({ '@type': 'ListItem', position: i + 1, name, item: `${site.url}/${p}` })) };
}
const STYLE = readFileSync(join(OUT, 'assets/css/style.css'), 'utf8')
  .replace(/\/\*[\s\S]*?\*\//g, '').replace(/\s+/g, ' ').replace(/\s*([{}:;,>])\s*/g, '$1').replace(/;}/g, '}').trim();

function layout({ title, description, root, active = '', body, path, schema = [] }) {
  const ddLinks = (list) => list.map(([h, t, s]) => `<a href="${root}${h}">${t}<small>${s}</small></a>`).join('');
  const dest = regions.map(([r, label]) => `<div><p class="f-h">${label}</p>${byRegion(r).map((c) => `<a href="${root}countries/${c.slug}.html">${c.name}</a>`).join('')}</div>`).join('');
  const act = (k) => (active === k ? ' is-active' : '');
  const url = path === 'index.html' ? `${site.url}/` : `${site.url}/${path}`;
  const graph = [orgSchema, breadcrumbSchema(path), ...schema].filter(Boolean);
  const css = STYLE.replace(/url\(\.\.\/fonts\//g, `url(${root}assets/fonts/`);
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(title)}</title>
<meta name="description" content="${esc(description)}">
<link rel="canonical" href="${url}">
<meta name="robots" content="index, follow, max-image-preview:large, max-snippet:-1">
<meta property="og:site_name" content="${site.name}">
<meta property="og:locale" content="en_US">
<meta property="og:url" content="${url}">
<meta property="og:title" content="${esc(title)}">
<meta property="og:description" content="${esc(description)}">
<meta property="og:type" content="website">
<meta property="og:image" content="${site.url}/assets/img/logo-512.png">
<meta property="og:image:width" content="512">
<meta property="og:image:height" content="512">
<meta name="twitter:card" content="summary">
<meta name="theme-color" content="#faf8f3">
${site.gscVerification ? `<meta name="google-site-verification" content="${site.gscVerification}">\n` : ''}<link rel="icon" type="image/png" sizes="32x32" href="${root}assets/img/favicon-32.png">
<link rel="apple-touch-icon" href="${root}assets/img/apple-touch-icon.png">
<link rel="preload" href="${root}assets/fonts/newsreader-latin.woff2" as="font" type="font/woff2" crossorigin>
<link rel="preload" href="${root}assets/fonts/inter-latin.woff2" as="font" type="font/woff2" crossorigin>
<style>${css}</style>
<script>document.documentElement.classList.add('js')</script>
<script type="application/ld+json">${JSON.stringify({ '@context': 'https://schema.org', '@graph': graph })}</script>
${site.ga4 ? `<script async src="https://www.googletagmanager.com/gtag/js?id=${site.ga4}"></script>\n<script>window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments)}gtag('js',new Date());gtag('config','${site.ga4}');</script>\n` : ''}</head>
<body>
<a class="sr-only" href="#main">Skip to content</a>
<header class="header">
  <div class="wrap">
    <a class="brand" href="${root}index.html" aria-label="${site.name} home"><img src="${root}assets/img/logo-68.jpg" alt="" width="34" height="34"><span>${site.name}</span></a>
    <nav class="nav" aria-label="Main">
      <div class="nav-item${act('destinations')}"><button type="button">Destinations</button><div class="dd dd--dest">${dest}<div class="dd-foot"><a href="${root}destinations.html">Compare all destinations ${A}</a></div></div></div>
      <div class="nav-item${act('visas')}"><button type="button">Visas</button><div class="dd">${visaTypes.map((v) => `<a href="${root}visas/${v.key}.html">${v.title}<small>${v.short}</small></a>`).join('')}</div></div>
      <a class="${act('work').trim()}" href="${root}work-abroad.html">Work abroad</a>
      <div class="nav-item${act('migration')}"><button type="button">Migration</button><div class="dd">${ddLinks(migrationLinks)}</div></div>
      <div class="nav-item${act('study')}"><button type="button">Study</button><div class="dd">${ddLinks(studyLinks)}</div></div>
      <a class="${act('contact').trim()}" href="${root}contact.html">Contact</a>
    </nav>
    <a class="btn header-cta" href="${root}contact.html#book">Book a consultation</a>
    <button class="menu-btn" type="button" data-drawer-open aria-expanded="false" aria-controls="drawer">Menu</button>
  </div>
</header>
<div class="drawer" id="drawer" aria-hidden="true">
  <div class="wrap">
    <div class="drawer-top"><a class="brand" href="${root}index.html"><img src="${root}assets/img/logo-68.jpg" alt="" width="34" height="34"><span>${site.name}</span></a><button class="menu-btn" style="display:inline-block;margin:0" type="button" data-drawer-close>Close</button></div>
    <details><summary>Destinations</summary><div class="d-sub">${countries.map((c) => `<a href="${root}countries/${c.slug}.html">${c.name}</a>`).join('')}</div></details>
    <details><summary>Visas</summary><div class="d-sub">${visaTypes.map((v) => `<a href="${root}visas/${v.key}.html">${v.title}</a>`).join('')}</div></details>
    <a class="d-link" href="${root}work-abroad.html">Work abroad</a>
    <details><summary>Migration</summary><div class="d-sub">${migrationLinks.map(([h, t]) => `<a href="${root}${h}">${t}</a>`).join('')}</div></details>
    <details><summary>Study</summary><div class="d-sub">${studyLinks.map(([h, t]) => `<a href="${root}${h}">${t}</a>`).join('')}</div></details>
    <a class="d-link" href="${root}about.html">About</a>
    <a class="d-link" href="${root}contact.html">Contact</a>
    <a class="btn btn--block" href="${root}contact.html#book">Book a consultation ${A}</a>
  </div>
</div>
<main id="main">
${body}
</main>
<footer class="footer">
  <div class="wrap">
    <div class="footer-grid">
      <div class="footer-about">
        <a class="brand" href="${root}index.html"><img src="${root}assets/img/logo-68.jpg" alt="" width="34" height="34"><span>${site.name}</span></a>
        <p>Independent advice on studying, working and settling abroad — for students, workers and professionals from Bangladesh.</p>
      </div>
      <div><p class="f-h">Visas</p><ul>${visaTypes.map((v) => `<li><a href="${root}visas/${v.key}.html">${v.label}</a></li>`).join('')}</ul></div>
      <div><p class="f-h">Services</p><ul><li><a href="${root}work-abroad.html">Work abroad</a></li>${migrationLinks.concat(studyLinks).map(([h, t]) => `<li><a href="${root}${h}">${t}</a></li>`).join('')}</ul></div>
      <div><p class="f-h">Destinations</p><ul>${['uk', 'canada', 'australia', 'germany', 'saudi-arabia', 'japan', 'malaysia'].map((s) => countries.find((c) => c.slug === s)).map((c) => `<li><a href="${root}countries/${c.slug}.html">${c.name}</a></li>`).join('')}<li><a href="${root}destinations.html">All destinations</a></li></ul></div>
      <div><p class="f-h">Contact</p><ul>
        <li><a href="tel:${tel}">${site.phone}</a></li>
        <li><a href="https://wa.me/${site.whatsapp}" target="_blank" rel="noopener">WhatsApp</a></li>
        <li><a href="mailto:${site.email}">${site.email}</a></li>
        <li>Official office — <a href="${site.officeMap}" target="_blank" rel="noopener">${site.office}</a></li>
        <li><a href="${site.facebook}" target="_blank" rel="noopener">Facebook</a></li>
        <li><a href="${root}about.html">About us</a></li>
      </ul></div>
    </div>
    <div class="footer-base">
      <span>© ${year} ${site.legal}</span>
      <p>Visa, residence and citizenship decisions are made only by the relevant government. Requirements change often; information here is general guidance and is confirmed during consultation. Overseas employment is processed through BMET-licensed recruiting agencies.</p>
    </div>
  </div>
</footer>
<script defer src="${root}assets/js/data.js"></script>
<script defer src="${root}assets/js/main.js"></script>
</body>
</html>`;
}

// ---------- shared blocks ----------
const phead = ({ root, crumbs, label, h1, lede, extra = '' }) => `
<section class="phead">
  <div class="wrap">
    <nav class="crumbs" aria-label="Breadcrumb"><a href="${root}index.html">Home</a>${crumbs.map((c) => `<span aria-hidden="true">/</span>${c}`).join('')}</nav>
    <div class="phead-grid">
      <div><span class="label">${label}</span><h1>${h1}</h1></div>
      <div><p class="lede">${lede}</p><p class="small" style="margin:18px 0 0">Last reviewed: ${site.reviewed}</p></div>
    </div>
    ${extra}
  </div>
</section>`;

const head = (n, label, h2, p = '') => `<div class="head"><div><span class="label"><b>${n}</b>${label}</span><h2>${h2}</h2></div>${p ? `<p class="body-lg">${p}</p>` : ''}</div>`;

const steps = (items, row = false) => `<ol class="steps${row ? ' steps--row' : ''}">${items.map(([t, d]) => `<li><div><h3>${t}</h3>${d ? `<p>${d}</p>` : ''}</div></li>`).join('')}</ol>`;

const cta = (root, h = 'Not sure which route <em>fits you?</em>', p = 'Book a consultation. We review your profile and give you a straight answer — including when the honest answer is “not yet”.') => `
<section class="cta">
  <div class="wrap cta-grid">
    <div><h2>${h}</h2><p>${p}</p></div>
    <div class="cta-actions">
      <a class="btn btn--paper btn--block" href="${root}contact.html#book">Book a consultation ${A}</a>
      <a class="btn btn--ghost-light btn--block" href="https://wa.me/${site.whatsapp}" target="_blank" rel="noopener">Message us on WhatsApp</a>
    </div>
  </div>
</section>`;

const statusClass = (s) => (/restrict|suspend/i.test(s) ? ' status--stop' : /limited|reopen|quota|with/i.test(s) ? ' status--warn' : '');

const marketTable = (root, rows) => `
<div class="tbl-wrap"><table class="tbl tbl--stack">
  <thead><tr><th>Destination</th><th>Workers, 2025</th><th>Market status</th><th>Main sectors</th><th>Route</th></tr></thead>
  <tbody>${rows.map((m) => `<tr><td>${m.slug ? `<a class="row-link" href="${root}countries/${m.slug}.html#work">${m.name}</a>` : m.name}</td><td class="num" data-h="Workers">${m.figure}</td><td data-h="Status"><span class="status${statusClass(m.status)}">${m.status}</span></td><td data-h="Sectors">${m.sectors}</td><td data-h="Route">${m.route}</td></tr>`).join('')}</tbody>
</table></div>
<p class="source">Approximate departures in 2025 from BMET data as reported by The Business Standard and BSS (January 2026). *UAE figure is January–August 2026 (BMET via bdnews24). Market status reflects reporting up to late 2026 and changes often — we confirm before you commit.</p>`;

const consultForm = (id = 'book') => `
<div id="${id}">
  <form class="form" data-form data-wa="${site.whatsapp}" novalidate>
    <div class="fld"><label for="f-name">Full name</label><input class="in" id="f-name" name="name" required autocomplete="name"></div>
    <div class="fld"><label for="f-phone">Phone / WhatsApp</label><input class="in" id="f-phone" name="phone" type="tel" required autocomplete="tel"></div>
    <div class="fld full"><label for="f-email">Email</label><input class="in" id="f-email" name="email" type="email" autocomplete="email"></div>
    <div class="fld"><label for="f-goal">Interested in</label><select class="in" id="f-goal" name="goal">${visaTypes.map((v) => `<option>${v.title}</option>`).join('')}<option>Work abroad</option><option>Skilled migration</option><option>Digital nomad visa</option><option>Residency / second citizenship</option><option>Language course</option><option>Scholarships</option><option>Career counselling</option></select></div>
    <div class="fld"><label for="f-country">Destination</label><select class="in" id="f-country" name="country"><option>Not decided</option>${countries.map((c) => `<option>${c.name}</option>`).join('')}</select></div>
    <div class="fld full"><label for="f-msg">Your background (optional)</label><textarea class="in" id="f-msg" name="message" placeholder="e.g. BSc in Civil Engineering, 4 years’ experience, IELTS 7.0"></textarea></div>
    <div class="full"><button class="btn" type="submit">Send via WhatsApp ${A}</button><p class="small" style="margin-top:14px">Opens WhatsApp with your details filled in. We use them only to respond to you.</p></div>
  </form>
  <div class="form-done" aria-live="polite"><h3>Almost done — press send in WhatsApp.</h3><p class="muted" style="margin-top:10px">Your details are ready in a WhatsApp message to our advisors. If it didn’t open, <a class="tlink" href="https://wa.me/${site.whatsapp}" target="_blank" rel="noopener">open WhatsApp</a>.</p></div>
</div>`;

const compareTool = () => `
<div class="compare" data-compare>
  <form onsubmit="return false">
    <div class="ctrl"><span class="ctrl-label">Main goal</span><div class="opts" data-opt="goal"><button type="button" class="is-on" data-v="study">Study</button><button type="button" data-v="work">Work</button><button type="button" data-v="settle">Settle</button></div></div>
    <div class="ctrl"><span class="ctrl-label">Yearly budget</span><div class="opts" data-opt="budget"><button type="button" data-v="1">Under ৳15L</button><button type="button" class="is-on" data-v="2">৳15–35L</button><button type="button" data-v="3">৳35L+</button></div></div>
    <div class="ctrl"><div class="range-head"><label class="ctrl-label" for="c-ielts" style="margin:0">IELTS or equivalent</label><output data-ielts-val>6.5</output></div><input id="c-ielts" type="range" min="0" max="9" step="0.5" value="6.5" data-ielts><div class="range-ends"><span>No test yet</span><span>9.0</span></div></div>
    <div class="ctrl"><span class="ctrl-label">Also important</span>
      <label class="check"><input type="checkbox" data-pref="pr" checked> Path to permanent residence</label>
      <label class="check"><input type="checkbox" data-pref="english"> English-speaking country</label>
      <label class="check"><input type="checkbox" data-pref="near"> Close to Bangladesh</label>
    </div>
  </form>
  <div><div class="results" data-results aria-live="polite"></div><p class="source">Indicative only, based on typical costs and entry requirements. Your advisor confirms options for your profile.</p></div>
</div>`;

const directory = (root) => `<div class="directory">${regions.map(([r, label]) => `<div><h3>${label}</h3>${byRegion(r).map((c) => `<a href="${root}countries/${c.slug}.html">${c.name}<small>${c.primary === 'work' ? 'Work' : c.primary === 'medical' ? 'Medical' : 'Study'}</small></a>`).join('')}</div>`).join('')}</div>`;

const workerHelp = [
  'Agency licence, employer and visa verification before you pay',
  'Contract review — salary, hours, housing and return ticket',
  'Medical, skills test and BMET clearance guidance',
  'Language and skills course referrals to raise your wage',
];

// ---------- pages ----------
function home() {
  const root = '';
  const services = [
    ['scholarships.html', 'Study abroad & scholarships', 'University shortlists, funding searches and student visas for 20 destinations.'],
    ['work-abroad.html', 'Work abroad', 'Safe, verified routes to the Gulf, Asia and Europe — from Saudi Arabia to Italy.'],
    ['skilled-migration.html', 'Skilled migration', 'Points-based permanent residence in Canada, Australia, New Zealand, the UK and Germany.'],
    ['visas/tourist.html', 'Visit, family & medical visas', 'Tourist, Umrah, spouse, parent and treatment visas, prepared properly the first time.'],
    ['digital-nomad.html', 'Digital nomad visas', 'Residence for remote workers and freelancers in Thailand, Malaysia, Dubai, Spain and more.'],
    ['residency-citizenship.html', 'Residency & second citizenship', 'Investment programmes, handled with licensed lawyers in each programme country.'],
    ['languages.html', 'Language courses', 'IELTS, German, Japanese, Korean and Italian — taught by our partner institutes.'],
    ['career-counselling.html', 'Career counselling', 'Decide where you want to be in five years, then choose the course and country.'],
  ];
  const body = `
<section class="hero">
  <div class="wrap">
    <div class="hero-grid">
      <div><span class="label">${site.name} · Genova, Italy</span><h1>Considered advice for a life <em>abroad.</em></h1></div>
      <div class="hero-aside">
        <p class="lede">We help students, workers and professionals choose where to go, how to fund it and which visa gets them there — then prepare every document with care.</p>
        <div class="hero-actions"><a class="btn" href="contact.html#book">Book a consultation ${A}</a><a class="btn btn--line" href="#services">Our services</a></div>
      </div>
    </div>
    <div class="finder" data-finder data-root="${root}">
      <span class="f-label">Find your route</span>
      <span>I’d like to</span>
      <select aria-label="Goal" data-f-goal>${visaTypes.map((v) => `<option value="${v.key}">${verbs[v.key]}</option>`).join('')}</select>
      <span>in</span>
      <select aria-label="Destination" data-f-country>${countries.map((c) => `<option value="${c.slug}">${c.name}</option>`).join('')}</select>
      <a class="btn f-go" href="#" data-f-link>View route ${A}</a>
    </div>
    <div class="finder-meta" aria-live="polite"><span><strong data-f-name></strong></span><span data-f-time></span></div>
    <div class="figures">
      <div><strong>1.13m</strong><span>Bangladeshis left for overseas jobs in 2025</span><small>Source: BMET</small></div>
      <div><strong>${countries.length}</strong><span>Destinations we advise on, each across five visa categories</span></div>
      <div><strong>101</strong><span>Countries where Bangladesh permits dual citizenship</span><small>Source: Ministry of Home Affairs</small></div>
    </div>
  </div>
</section>

<section class="sec" id="services" style="margin-top:96px">
  <div class="wrap">
    ${head('01', 'What we do', 'Eight services, <em>one advisor.</em>', 'The person who assesses your profile is the person who checks your file before it is submitted.')}
    <div class="index">${services.map(([h, t, d], i) => `<a href="${h}"><span class="n">${String(i + 1).padStart(2, '0')}</span><h3>${t}</h3><p>${d}</p>${A}</a>`).join('')}</div>
  </div>
</section>

<section class="sec band">
  <div class="wrap">
    ${head('02', 'Work abroad', 'Where Bangladeshis <em>are working</em> now.', 'Saudi Arabia took about two in every three workers who left in 2025. We help you choose a market with care, and check every offer before you pay.')}
    ${marketTable(root, workMarkets.slice(0, 7))}
    <p style="margin-top:36px"><a class="tlink" href="work-abroad.html">All markets, the departure process and how to avoid fraud ${A}</a></p>
  </div>
</section>

<section class="sec">
  <div class="wrap">
    ${head('03', 'Destinations', 'Twenty countries, <em>five visa types</em> each.', 'Study, work, visit, family and medical requirements laid out the same way for every country, so you can compare.')}
    ${directory(root)}
  </div>
</section>

<section class="sec sec--tint" id="compare">
  <div class="wrap">
    ${head('04', 'Decision helper', 'Which country fits <em>your profile?</em>', 'Set your budget, English score and priorities to get a ranked shortlist to bring to your first consultation.')}
    ${compareTool()}
  </div>
</section>

<section class="sec">
  <div class="wrap cols">
    <div class="sticky"><span class="label"><b>05</b>Languages</span><h2>Learn the language <em>before</em> you go.</h2><p class="body-lg" style="margin-top:20px">Language scores decide admissions, work visas and migration points. We place you with a verified partner institute and track your progress to the exam.</p><a class="tlink" href="languages.html">All language courses ${A}</a></div>
    <div><table class="tbl tbl--stack" style="min-width:0"><thead><tr><th>Course</th><th>Exam</th><th>Leads to</th></tr></thead><tbody>${languageCourses.map((l) => `<tr><td>${l.lang}</td><td data-h="Exam">${l.exam}</td><td data-h="For">${l.for}</td></tr>`).join('')}</tbody></table></div>
  </div>
</section>

<section class="sec sec--tint">
  <div class="wrap">
    ${head('06', 'How we work', 'From first call <em>to arrival.</em>')}
    ${steps([
      ['Profile review', 'Grades, experience, budget and goals — free of charge.'],
      ['Written options', 'A shortlist of countries and routes with realistic costs and risks.'],
      ['Applications', 'Admissions, scholarships, employer or programme paperwork.'],
      ['Visa file', 'Every document checked against current rules before submission.'],
      ['Departure', 'Briefing on housing, banking, BMET clearance and your first weeks.'],
    ], true)}
  </div>
</section>

<section class="sec">
  <div class="wrap cols">
    <div class="sticky"><span class="label"><b>07</b>Questions</span><h2>Straight <em>answers.</em></h2></div>
    <div class="faq">${faqs.map(([q, a]) => `<details><summary>${q}</summary><p>${a}</p></details>`).join('')}</div>
  </div>
</section>

<section class="sec sec--tint">
  <div class="wrap cols">
    <div><span class="label"><b>08</b>Contact</span><h2>Talk to an <em>advisor.</em></h2><p class="body-lg" style="margin-top:20px">The first consultation is free. Bring your transcripts, passport and any offer letters — we will tell you exactly where you stand.</p>
      <dl class="contact-dl"><div><dt>Phone</dt><dd><a href="tel:${tel}">${site.phone}</a></dd></div><div><dt>Email</dt><dd><a href="mailto:${site.email}">${site.email}</a></dd></div><div><dt>WhatsApp</dt><dd><a href="https://wa.me/${site.whatsapp}" target="_blank" rel="noopener">${site.phone}</a></dd></div><div><dt>Office</dt><dd><a href="${site.officeMap}" target="_blank" rel="noopener">${site.office}</a></dd></div><div><dt>Facebook</dt><dd><a href="${site.facebook}" target="_blank" rel="noopener">facebook.com/eximobd</a></dd></div></dl>
    </div>
    ${consultForm()}
  </div>
</section>`;
  return layout({ title: `${site.name} | Study Abroad, Work Visa & Migration Consultancy`, description: `Study abroad, work visas, skilled migration and second residency for Bangladeshi students, workers and professionals. ${countries.length} countries, five visa types. Free consultation.`, root, body, path: 'index.html', schema: [{ '@type': 'WebSite', '@id': `${site.url}/#website`, url: `${site.url}/`, name: site.name, publisher: { '@id': `${site.url}/#org` }, inLanguage: 'en' }, faqSchema(faqs)] });
}

function countryPage(c) {
  const root = '../';
  const primary = c.primary || 'study';
  const panels = visaTypes.map((vt) => {
    const v = c.visas[vt.key];
    return `
<section class="panel" id="${vt.key}" role="tabpanel" aria-labelledby="tab-${vt.key}"${vt.key !== primary ? ' hidden' : ''}>
  <div class="wrap visa-grid">
    <div>
      <span class="label">${vt.label} · ${c.name}</span>
      <h2>${v.name}</h2>
      <p class="lede">${v.summary}</p>
      <h3 class="h4" style="margin-bottom:14px">Key requirements</h3>
      <ul class="ticks ticks--num">${v.points.map((p) => `<li>${p}</li>`).join('')}</ul>
      <div class="callout"><strong>Good to know</strong>${v.note}</div>
    </div>
    <aside class="aside">
      <dl><dt>Typical processing</dt><dd>${v.time}</dd></dl>
      <h3>How we help</h3>
      <ul class="plain">${(vt.key === 'work' && c.study === false ? workerHelp : vt.help.slice(0, 4)).map((h) => `<li>${h}</li>`).join('')}</ul>
      <a class="btn btn--block" href="${root}contact.html#book">Start my application ${A}</a>
      <a class="btn btn--line btn--block" href="${root}visas/${vt.key}.html">Compare ${vt.label.toLowerCase()} visas</a>
    </aside>
  </div>
</section>`;
  }).join('');
  const facts = `<dl class="facts">${factsOf(c).map(([k, v]) => `<div><dt>${k}</dt><dd>${v}</dd></div>`).join('')}</dl>`;
  const body = `
${phead({ root, crumbs: [`<a href="${root}destinations.html">Destinations</a>`, `<span>${c.name}</span>`], label: `${regions.find(([r]) => r === c.region)[1]} · Visa guide for Bangladeshi nationals`, h1: c.name, lede: c.intro, extra: facts })}
<div class="tabs-bar"><div class="wrap"><div class="tabs" role="tablist" aria-label="Visa types">
  ${visaTypes.map((vt) => `<button class="tab" role="tab" id="tab-${vt.key}" aria-controls="${vt.key}" aria-selected="${vt.key === primary}" data-tab="${vt.key}">${vt.label}</button>`).join('')}
</div></div></div>
${panels}
${c.slug === 'italy' ? `<section class="sec sec--sm sec--tint"><div class="wrap cols"><div><span class="label">Our official office</span><h2>Based in <em>Genova.</em></h2></div><div><p class="lede">Eximo’s official office is in Sestri Ponente, Genova. Clients in Italy can meet us in person; clients in Bangladesh are advised by phone, WhatsApp and video call.</p><dl class="contact-dl"><div><dt>Address</dt><dd><a href="${site.officeMap}" target="_blank" rel="noopener">${site.office}</a></dd></div><div><dt>WhatsApp</dt><dd><a href="https://wa.me/${site.whatsapp}" target="_blank" rel="noopener">${site.phone}</a></dd></div></dl></div></div></section>` : ''}
<section class="sec sec--sm" style="margin-top:56px">
  <div class="wrap"><span class="label">Other destinations</span><div class="others">${countries.filter((o) => o.slug !== c.slug).map((o) => `<a href="${o.slug}.html">${o.name}</a>`).join('')}</div></div>
</section>
${cta(root, `Planning a move to <em>${c.name}?</em>`)}`;
  return layout({ title: `${c.name} Visa from Bangladesh: ${visaTypes.find((v) => v.key === (c.primary || 'study')).label} & More | ${site.name}`, description: clip(`${c.name} visa guide for Bangladeshi nationals: ${c.visas[c.primary || 'study'].name}, plus study, work, tourist, family and medical visa requirements and processing times.`), root, active: 'destinations', body, path: `countries/${c.slug}.html`, schema: [faqSchema(visaTypes.map((vt) => { const v = c.visas[vt.key]; return [`What do I need for a ${c.name} ${vt.label.toLowerCase()} visa from Bangladesh?`, `${v.name}: ${v.summary} Key requirements: ${v.points.join('; ')}. ${v.note} Typical processing: ${v.time}.`]; }))] });
}

function visaPage(vt) {
  const root = '../';
  const body = `
${phead({ root, crumbs: ['<span>Visas</span>', `<span>${vt.title}</span>`], label: `${vt.label} visas`, h1: `${vt.title.split(' ')[0]} <em>${vt.title.split(' ').slice(1).join(' ')}</em>`, lede: vt.intro })}
<section class="sec sec--flush">
  <div class="wrap cols">
    <div class="sticky"><span class="label"><b>01</b>What we handle</span><h2>Your file, <em>done properly.</em></h2></div>
    <ul class="ticks ticks--num">${vt.help.map((h) => `<li>${h}</li>`).join('')}</ul>
  </div>
</section>
<section class="sec sec--tint">
  <div class="wrap">${head('02', 'The process', 'Step by <em>step.</em>')}${steps(vt.steps.map((s) => [s, '']), true)}</div>
</section>
<section class="sec" id="countries">
  <div class="wrap">
    ${head('03', 'By destination', `${vt.label} visas in <em>${countries.length} countries.</em>`, 'Select a country for the full requirement list.')}
    <div class="tbl-wrap"><table class="tbl tbl--stack">
      <thead><tr><th>Country</th><th>Visa</th><th>Typical processing</th><th></th></tr></thead>
      <tbody>${countries.map((c) => { const v = c.visas[vt.key]; return `<tr><td>${c.name}</td><td data-h="Visa"><strong style="font-weight:500">${v.name}</strong><br><span class="muted">${v.summary}</span></td><td data-h="Processing">${v.time}</td><td><a class="tlink" href="${root}countries/${c.slug}.html#${vt.key}">Details ${A}</a></td></tr>`; }).join('')}</tbody>
    </table></div>
  </div>
</section>
${cta(root)}`;
  return layout({ title: `${vt.label} Visa from Bangladesh: ${countries.length} Countries Compared | ${site.name}`, description: clip(`${vt.title} for Bangladeshi nationals in ${countries.length} countries. ${vt.intro}`), root, active: 'visas', body, path: `visas/${vt.key}.html`, schema: [{ '@type': 'ItemList', name: `${vt.title} by country`, itemListElement: countries.map((c, i) => ({ '@type': 'ListItem', position: i + 1, name: `${c.name}: ${c.visas[vt.key].name}`, url: `${site.url}/countries/${c.slug}.html` })) }] });
}

function destinationsPage() {
  const root = '';
  const body = `
${phead({ root, crumbs: ['<span>Destinations</span>'], label: 'Destinations', h1: `Twenty countries, <em>compared.</em>`, lede: 'Costs, intakes, post-study options and the right visa for each goal — in one place.' })}
<section class="sec sec--flush">
  <div class="wrap">${head('01', 'All destinations', 'Choose a <em>country.</em>')}${directory(root)}</div>
</section>
<section class="sec sec--tint">
  <div class="wrap">${head('02', 'Decision helper', 'Rank destinations <em>for your profile.</em>')}${compareTool()}</div>
</section>
<section class="sec">
  <div class="wrap">${head('03', 'At a glance', 'Study destinations <em>side by side.</em>')}
    <div class="tbl-wrap"><table class="tbl">
      <thead><tr><th>Country</th><th>Cost</th><th>Typical IELTS</th><th>Intakes</th><th>After study</th><th>Residence path</th></tr></thead>
      <tbody>${countries.filter((c) => c.study !== false).map((c) => `<tr><td><a class="row-link" href="countries/${c.slug}.html">${c.name}</a></td><td>${['', 'Lower', 'Mid', 'Higher'][c.cost]}</td><td>${c.ielts.toFixed(1)}+</td><td>${factsOf(c)[0][1]}</td><td>${factsOf(c)[1][1]}</td><td>${c.pr ? 'Yes' : 'Limited'}</td></tr>`).join('')}</tbody>
    </table></div>
  </div>
</section>
${cta(root)}`;
  return layout({ title: `Best Countries to Study & Work from Bangladesh | ${site.name}`, description: `Compare ${countries.length} destinations for Bangladeshi students and workers: costs, IELTS requirements, intakes, post-study work and residence pathways.`, root, active: 'destinations', body, path: 'destinations.html' });
}

function workPage() {
  const root = '';
  const body = `
${phead({ root, crumbs: ['<span>Work abroad</span>'], label: 'Overseas employment', h1: 'Work abroad, <em>safely.</em>', lede: 'More than a million Bangladeshis took jobs overseas in 2025. We help you pick the right market, check that the offer is real, and prepare for departure — working only with BMET-licensed recruiting agencies.' })}
<section class="sec band sec--flush">
  <div class="wrap">${head('01', 'Market snapshot', 'The largest destinations <em>for Bangladeshi workers.</em>')}${marketTable(root, workMarkets)}</div>
</section>
<section class="sec">
  <div class="wrap">
    ${head('02', 'Routes', 'Three ways to <em>work abroad.</em>')}
    <div class="grid-3">
      <div><h3>Government channels</h3><p>Government-to-government recruitment with set costs and official selection.</p><ul class="plain"><li><a class="tlink" href="countries/south-korea.html#work">South Korea — EPS via BOESL</a></li><li><a class="tlink" href="countries/japan.html#work">Japan — Specified Skilled Worker</a></li><li><a class="tlink" href="countries/malaysia.html#work">Malaysia — approved channel</a></li></ul></div>
      <div><h3>Employer recruitment</h3><p>An overseas employer issues a visa through a BMET-licensed agency. This is how most Gulf jobs work.</p><ul class="plain"><li><a class="tlink" href="countries/saudi-arabia.html#work">Saudi Arabia</a></li><li><a class="tlink" href="countries/qatar.html#work">Qatar</a></li><li><a class="tlink" href="countries/kuwait.html#work">Kuwait</a> · <a class="tlink" href="countries/maldives.html#work">Maldives</a></li></ul></div>
      <div><h3>Skilled & professional</h3><p>Sponsored jobs and points-based routes for graduates and experienced professionals.</p><ul class="plain"><li><a class="tlink" href="countries/singapore.html#work">Singapore — S Pass / EP</a></li><li><a class="tlink" href="countries/italy.html#work">Italy — Decreto Flussi & Blue Card</a></li><li><a class="tlink" href="skilled-migration.html">Skilled migration (PR) ${A}</a></li></ul></div>
    </div>
  </div>
</section>
<section class="sec sec--tint">
  <div class="wrap cols">
    <div class="sticky"><span class="label"><b>03</b>Before you fly</span><h2>The departure <em>process.</em></h2><p class="body-lg" style="margin-top:20px">Every worker leaving Bangladesh legally goes through these steps. We walk you through each one and check your documents along the way.</p></div>
    ${steps(departureSteps)}
  </div>
</section>
<section class="sec">
  <div class="wrap cols">
    <div><span class="label"><b>04</b>Protect yourself</span><h2>How to spot <em>recruitment fraud.</em></h2></div>
    <div>
      <ul class="ticks">
        <li>The agency cannot show a valid BMET recruiting licence.</li>
        <li>You are asked to pay into a personal bank or mobile-money account.</li>
        <li>The visa cannot be verified on the destination country’s official portal.</li>
        <li>You are promised a “free visa” to work for anyone — this is illegal in the Gulf.</li>
        <li>Someone offers to sell a Korean EPS job, an Italian nulla osta or a Japanese CoE. These are not for sale.</li>
        <li>You are not given a written contract before departure.</li>
      </ul>
      <div class="callout"><strong>Send it to us first</strong>Before you pay anyone, send us your offer letter, visa copy and agency details. We will check them at no cost.</div>
    </div>
  </div>
</section>
<section class="sec sec--tint">
  <div class="wrap cols">
    <div><span class="label"><b>05</b>Prepare</span><h2>Skills and language <em>open better jobs.</em></h2></div>
    <div><p class="body-lg">Japan’s SSW needs JLPT N4 or JFT-Basic, Korea’s EPS needs EPS-TOPIK, and Italy’s long-term permit needs Italian A2. We have language partnerships for Japanese, Korean, Italian, German and IELTS.</p><a class="tlink" href="languages.html">Language courses for workers ${A}</a></div>
  </div>
</section>
${cta(root, 'Have a job offer? <em>Let us check it.</em>', 'We verify the employer, visa and agency, and explain the full cost before you pay anything.')}`;
  return layout({ title: `Work Abroad from Bangladesh: Top Destinations 2026 | ${site.name}`, description: 'Where Bangladeshis work abroad: Saudi Arabia, Qatar, Singapore, Kuwait, Maldives, Italy and more. Routes, BMET process and how to avoid recruitment fraud.', root, active: 'work', body, path: 'work-abroad.html', schema: [{ '@type': 'Article', headline: 'Work abroad from Bangladesh: top destinations, routes and departure process', dateModified: BUILD_DATE, author: { '@id': `${site.url}/#org` }, publisher: { '@id': `${site.url}/#org` } }] });
}

function skilledPage() {
  const root = '';
  const body = `
${phead({ root, crumbs: ['<span>Migration</span>', '<span>Skilled migration</span>'], label: 'Skilled migration', h1: 'Permanent residence, <em>by points.</em>', lede: 'For engineers, IT professionals, nurses, accountants and other graduates with experience. We assess your points honestly, plan your language test and skills assessment, and prepare your profile and application.' })}
<section class="sec sec--flush">
  <div class="wrap">
    ${head('01', 'Programmes', 'Where skilled Bangladeshis <em>can settle.</em>')}
    <div class="tbl-wrap"><table class="tbl tbl--stack">
      <thead><tr><th>Country</th><th>Programme</th><th>Selection</th><th>Key documents</th><th>Leads to</th></tr></thead>
      <tbody>${skilledRoutes.map((r) => `<tr><td><a class="row-link" href="countries/${r.slug}.html#work">${r.country}</a></td><td data-h="Programme">${r.program}</td><td data-h="Selection">${r.basis}</td><td data-h="Documents">${r.key}</td><td data-h="Leads to">${r.outcome}</td></tr>`).join('')}</tbody>
    </table></div>
    <p class="source">Points thresholds, occupation lists and draw sizes change every year. We check the current rules for your occupation before you spend on tests or assessments.</p>
  </div>
</section>
<section class="sec sec--tint">
  <div class="wrap cols">
    <div class="sticky"><span class="label"><b>02</b>What we do</span><h2>From points check <em>to landing.</em></h2></div>
    ${steps([
      ['Eligibility & points', 'We score your age, education, experience and language for each country and show where you stand.'],
      ['Language plan', 'Target scores for IELTS General, CELPIP, PTE Core or TEF — with a partner course if needed.'],
      ['Credentials & skills assessment', 'Educational Credential Assessment (WES and others) or skills assessment with Engineers Australia, ACS or VETASSESS.'],
      ['Profile & invitation', 'Express Entry profile, SkillSelect EOI or state nomination, timed for the best draw.'],
      ['PR application', 'Police certificates, medicals, proof of funds and family documents, organised and checked.'],
      ['Landing', 'Settlement planning: first steps, job search and credential licensing.'],
    ])}
  </div>
</section>
<section class="sec">
  <div class="wrap cols">
    <div><span class="label"><b>03</b>Tip</span><h2>Your English score can be worth <em>more than a degree.</em></h2></div>
    <div><p class="body-lg">In Canada’s Express Entry and Australia’s points test, moving from a competent to an expert English score adds more points than most extra qualifications. Our IELTS partner prepares you for the band you need.</p><a class="tlink" href="languages.html">IELTS preparation ${A}</a></div>
  </div>
</section>
${cta(root, 'How many points <em>do you have?</em>', 'Send us your CV and test scores. We will score you against each programme and tell you which is realistic.')}`;
  return layout({ title: `Skilled Migration from Bangladesh: Canada & Australia PR | ${site.name}`, description: 'Permanent residence for Bangladeshi professionals: Canada Express Entry, Australia 189/190/491, New Zealand, UK, Germany and Ireland — points and applications.', root, active: 'migration', body, path: 'skilled-migration.html' });
}

function nomadPage() {
  const root = '';
  const body = `
${phead({ root, crumbs: ['<span>Migration</span>', '<span>Digital nomad visas</span>'], label: 'Digital nomad visas', h1: 'Work remotely, <em>live abroad.</em>', lede: 'For Bangladeshi freelancers, remote employees and online business owners earning from clients outside the host country. These visas let you live abroad legally while you keep working for them.' })}
<section class="sec sec--flush">
  <div class="wrap">
    ${head('01', 'Programmes', 'Remote-work visas <em>open to Bangladeshi applicants.</em>', 'Income and fund thresholds as published at our last review. They change, so we confirm current figures before you apply.')}
    <div class="tbl-wrap"><table class="tbl tbl--stack">
      <thead><tr><th>Country</th><th>Visa</th><th>Stay</th><th>Financial requirement</th><th>Best for</th></tr></thead>
      <tbody>${nomadVisas.map((n) => `<tr><td>${n.country}</td><td data-h="Visa">${n.name}</td><td data-h="Stay">${n.stay}</td><td data-h="Requirement">${n.income}</td><td data-h="For">${n.fit}</td></tr>`).join('')}</tbody>
    </table></div>
  </div>
</section>
<section class="sec sec--tint">
  <div class="wrap">
    ${head('02', 'For Bangladeshi applicants', 'What makes <em>a strong file.</em>')}
    <div class="grid-2">
      <div><h3>Show your income clearly</h3><p class="muted">Bank statements showing foreign income received through legal channels, plus contracts or platform statements (Upwork, Fiverr, employer payslips). Income received outside banking channels is hard to prove.</p></div>
      <div><h3>Prove the work is remote</h3><p class="muted">An employer letter confirming remote work, or client contracts showing your clients are outside the host country.</p></div>
      <div><h3>Check consular jurisdiction</h3><p class="muted">Some European consulates handle Bangladeshi applications from New Delhi or another hub. We confirm where to apply and how long appointments take.</p></div>
      <div><h3>Plan for tax and insurance</h3><p class="muted">Health insurance is mandatory almost everywhere. Long stays can create tax residence, so we explain the basics and refer you to a tax adviser where needed.</p></div>
    </div>
  </div>
</section>
${cta(root, 'Freelancer or remote employee? <em>Let’s find your base.</em>')}`;
  return layout({ title: `Digital Nomad Visas for Bangladeshi Citizens | ${site.name}`, description: 'Remote-work visas open to Bangladeshi freelancers and remote employees: Thailand DTV, Malaysia DE Rantau, Dubai, Indonesia, Spain and Portugal compared.', root, active: 'migration', body, path: 'digital-nomad.html' });
}

function citizenshipPage() {
  const root = '';
  const { citizenship, residency } = investmentPrograms;
  const body = `
${phead({ root, crumbs: ['<span>Migration</span>', '<span>Residency & second citizenship</span>'], label: 'Investment migration', h1: 'Residency and a <em>second passport.</em>', lede: 'For families and business owners who want wider travel access, a second home or a Plan B. We work in partnership with licensed lawyers and government-authorised agents in each programme country, who file your application with the government.' })}
<section class="sec sec--flush">
  <div class="wrap">
    ${head('01', 'Citizenship by investment', 'Programmes that grant <em>citizenship.</em>', 'Minimum amounts per main applicant, before government, due-diligence and legal fees.')}
    <div class="tbl-wrap"><table class="tbl tbl--stack">
      <thead><tr><th>Programme</th><th>Investment route</th><th>Minimum</th><th>Typical timeline</th></tr></thead>
      <tbody>${citizenship.map((p) => `<tr><td>${p.name}</td><td data-h="Route">${p.basis}</td><td class="num" data-h="Minimum">${p.from}</td><td data-h="Timeline">${p.time}</td></tr>`).join('')}</tbody>
    </table></div>
  </div>
</section>
<section class="sec sec--tint">
  <div class="wrap">
    ${head('02', 'Residency by investment', 'Long-term residence, <em>with options later.</em>')}
    <div class="tbl-wrap"><table class="tbl tbl--stack">
      <thead><tr><th>Programme</th><th>Investment</th><th>Minimum</th><th>What you get</th></tr></thead>
      <tbody>${residency.map((p) => `<tr><td>${p.name}</td><td data-h="Investment">${p.basis}</td><td class="num" data-h="Minimum">${p.from}</td><td data-h="Result">${p.note}</td></tr>`).join('')}</tbody>
    </table></div>
    <p class="source">Figures are indicative minimums from official programme rules at our last review. Programmes change, sometimes at short notice — your partner lawyer confirms current terms in writing.</p>
  </div>
</section>
<section class="sec">
  <div class="wrap">
    ${head('03', 'For Bangladeshi nationals', 'Four things to <em>get right first.</em>')}
    <div class="grid-2">
      <div><h3>Dual citizenship</h3><p class="muted">Bangladesh permits dual citizenship with 101 countries, including North America, Europe and 12 Caribbean states, but not SAARC countries. You need a dual-nationality certificate, and dual citizens cannot stand for parliament. We check your chosen programme against the current list.</p></div>
      <div><h3>Source and transfer of funds</h3><p class="muted">Investment funds must be legally earned and documented. Bangladesh Bank foreign-exchange rules restrict moving capital abroad, so most clients invest with funds earned or held outside Bangladesh. Your lawyer and banks will ask for full proof.</p></div>
      <div><h3>Due diligence</h3><p class="muted">Every programme runs background checks on all adult applicants. Governments can refuse, and have revoked citizenship obtained with false information. Full, honest disclosure is essential.</p></div>
      <div><h3>Programme risk</h3><p class="muted">The EU has pressed Caribbean states over their programmes, and visa-free access can change. We explain the current risks of each programme so you can choose with care.</p></div>
    </div>
  </div>
</section>
<section class="sec sec--tint">
  <div class="wrap cols">
    <div class="sticky"><span class="label"><b>04</b>With our lawyer partners</span><h2>How the process <em>works.</em></h2><p class="body-lg" style="margin-top:20px">Eximo is your adviser and coordinator in Bangladesh. The licensed lawyer or authorised agent in the programme country is your legal representative and files with the government.</p></div>
    ${steps([
      ['Confidential review', 'Family, goals, budget and source of funds — under a confidentiality agreement.'],
      ['Programme choice', 'A written comparison of suitable programmes, costs and risks.'],
      ['Partner lawyer engaged', 'You sign directly with a licensed lawyer or authorised agent. We introduce and coordinate.'],
      ['Documents from Bangladesh', 'Police clearance, birth and marriage certificates, attestation, translation and source-of-funds evidence.'],
      ['Government due diligence', 'The application is filed and checked; you are kept informed at each stage.'],
      ['Approval & investment', 'Funds go to the government or approved project only after approval in principle; then the certificate and passport are issued.'],
    ])}
  </div>
</section>
<section class="sec">
  <div class="wrap cols">
    <div><span class="label"><b>05</b>Our standards</span><h2>What we <em>will never do.</em></h2></div>
    <ul class="ticks">
      <li>Sell or “guarantee” a passport. Citizenship is granted only by the issuing government.</li>
      <li>Take investment or government fees into Eximo or personal accounts. These are paid to government or escrow accounts.</li>
      <li>Help hide the source of funds or anyone’s background.</li>
      <li>Recommend a programme without explaining its risks in writing.</li>
    </ul>
  </div>
</section>
${cta(root, 'Considering a <em>second residence?</em>', 'Book a confidential consultation. We review your situation and introduce you to the right licensed lawyer.')}`;
  return layout({ title: `Second Passport & Residency by Investment for Bangladeshis | ${site.name}`, description: 'Citizenship and residency by investment for Bangladeshi nationals with licensed partner lawyers: Caribbean, Türkiye, UAE Golden Visa, Greece, Portugal, MM2H.', root, active: 'migration', body, path: 'residency-citizenship.html' });
}

function languagesPage() {
  const root = '';
  const body = `
${phead({ root, crumbs: ['<span>Study</span>', '<span>Language courses</span>'], label: 'Language courses', h1: 'The language <em>comes first.</em>', lede: 'Scores decide admissions, work visas and migration points. We match you with a verified partner institute in person or online, then track your progress to the exam and into your application.' })}
<section class="sec sec--flush">
  <div class="wrap">
    ${head('01', 'Courses', 'Five languages, <em>one plan.</em>', 'Every course is delivered through one of our partner institutes, in person or online.')}
    <div class="tbl-wrap"><table class="tbl tbl--stack">
      <thead><tr><th>Language</th><th>Course</th><th>Levels</th><th>Duration</th><th>Exam</th><th>Leads to</th></tr></thead>
      <tbody>${languageCourses.map((l) => `<tr><td>${l.lang}</td><td data-h="Course">${l.course}</td><td data-h="Levels">${l.levels}</td><td data-h="Duration">${l.duration}</td><td data-h="Exam">${l.exam}</td><td data-h="For">${l.for}</td></tr>`).join('')}</tbody>
    </table></div>
    <p class="source">Classes are in person or live online. Exams are booked with the official test bodies — IDP, British Council, Goethe-Institut, the Japan Foundation and HRD Korea / BOESL.</p>
  </div>
</section>
<section class="sec sec--tint">
  <div class="wrap">
    ${head('02', 'Verified partners', 'How we choose <em>our institutes.</em>', 'We recommend a provider only after it meets every standard below, and we review partners each term.')}
    <div class="grid-2">
      <div><h3>Registered and accountable</h3><p class="muted">A legally registered institute with a physical address, published fees and a written refund policy.</p></div>
      <div><h3>Qualified teachers</h3><p class="muted">Teachers with recognised qualifications or certified exam experience in the language they teach.</p></div>
      <div><h3>Results we can see</h3><p class="muted">Exam results are shared with us, so we can see real pass rates and score gains, not marketing claims.</p></div>
      <div><h3>Student feedback</h3><p class="muted">We collect feedback from every Eximo student each term and drop partners who fall short.</p></div>
    </div>
    <div class="callout" style="margin-top:56px"><strong>Our language partnerships</strong>We have partnerships with established institutes for Japanese, Italian, IELTS, German and Korean. Your course plan names the institute, its location and timetable before you enrol.</div>
  </div>
</section>
<section class="sec">
  <div class="wrap cols">
    <div class="sticky"><span class="label"><b>03</b>Enrolment</span><h2>From placement <em>to exam day.</em></h2></div>
    ${steps([
      ['Placement test', 'A short assessment to find your current level.'],
      ['Course plan', 'Target score, partner institute, schedule and fees — in writing.'],
      ['Classes', 'In person in person or online, with progress reports shared with your advisor.'],
      ['Mock exams', 'Timed practice tests under exam conditions.'],
      ['Exam & application', 'We book the official exam and add your result to your visa or admission file.'],
    ])}
  </div>
</section>
${cta(root, 'Which language, <em>which level?</em>', 'Tell us your destination and goal. We will tell you the score you need and how long it should take.')}`;
  return layout({ title: `IELTS, German, Japanese, Korean & Italian Courses | ${site.name}`, description: 'Language courses for study, work and migration abroad: IELTS, German, Japanese (JLPT/JFT), Korean (EPS-TOPIK) and Italian, through our partner institutes.', root, active: 'study', body, path: 'languages.html', schema: languageCourses.map((l) => ({ '@type': 'Course', name: `${l.lang}: ${l.course}`, description: `${l.levels}. Exam: ${l.exam}. For: ${l.for}.`, provider: { '@id': `${site.url}/#org` } })) });
}

function scholarshipsPage() {
  const root = '';
  const rows = [
    ['Chevening', 'United Kingdom', 'Master’s (1 year)', 'Tuition, living stipend, flights'],
    ['Commonwealth Scholarships', 'United Kingdom', 'Master’s, PhD', 'Tuition and stipend'],
    ['Fulbright Foreign Student Program', 'United States', 'Master’s, PhD', 'Tuition, living, travel'],
    ['Graduate assistantships', 'United States', 'Master’s, PhD', 'Tuition waiver and stipend'],
    ['DAAD Scholarships', 'Germany', 'Master’s, PhD', 'Monthly stipend, insurance, travel'],
    ['DSU regional scholarships', 'Italy', 'Bachelor’s, Master’s', 'Tuition, stipend, housing (income-based)'],
    ['Australia Awards', 'Australia', 'Master’s', 'Tuition, living, travel'],
    ['MEXT', 'Japan', 'Undergraduate to PhD', 'Tuition, stipend, flights'],
    ['Global Korea Scholarship', 'South Korea', 'Undergraduate to PhD', 'Tuition, stipend, flights, Korean course'],
    ['Saudi university scholarships', 'Saudi Arabia', 'Undergraduate to PhD', 'Tuition, housing, stipend, flights'],
    ['Government of Ireland Scholarship', 'Ireland', 'Master’s, PhD', 'Stipend and fee waiver'],
    ['University merit awards', 'All destinations', 'All levels', 'Partial to full tuition'],
  ];
  const body = `
${phead({ root, crumbs: ['<span>Study</span>', '<span>Scholarships</span>'], label: 'Scholarships & higher studies', h1: 'Funding first, <em>then the offer.</em>', lede: 'We match your academic profile to scholarships, tuition waivers and assistantships, track deadlines, and review every essay before it goes out.' })}
<section class="sec sec--flush">
  <div class="wrap">
    ${head('01', 'Awards we support', 'Major <em>scholarships.</em>', 'Coverage and eligibility change each cycle. Check the current call with us before you apply.')}
    <div class="tbl-wrap"><table class="tbl tbl--stack"><thead><tr><th>Scholarship</th><th>Country</th><th>Level</th><th>Typically covers</th></tr></thead>
    <tbody>${rows.map((r) => `<tr><td>${r[0]}</td><td data-h="Country">${r[1]}</td><td data-h="Level">${r[2]}</td><td data-h="Covers">${r[3]}</td></tr>`).join('')}</tbody></table></div>
  </div>
</section>
<section class="sec sec--tint">
  <div class="wrap">
    ${head('02', 'Our support', 'What we <em>do for you.</em>')}
    <div class="grid-3">
      <div><h3>Profile assessment</h3><p>An honest view of your chances for each award, so you spend time where you can win.</p></div>
      <div><h3>Essays & proposals</h3><p>Feedback on SOPs, personal statements and research proposals. Your words, made clearer — we never write them for you.</p></div>
      <div><h3>Deadline calendar</h3><p>Major awards close 9–12 months before the course starts. We plan backwards from your intake.</p></div>
    </div>
  </div>
</section>
${cta(root, 'Which scholarships <em>fit you?</em>', 'Share your transcripts and scores. We will send you a shortlist of awards and deadlines.')}`;
  return layout({ title: `Scholarships for Bangladeshi Students to Study Abroad | ${site.name}`, description: 'Funded scholarships for Bangladeshi students: Chevening, DAAD, MEXT, GKS, Australia Awards, Fulbright and Italy DSU, with matching and essay review.', root, active: 'study', body, path: 'scholarships.html' });
}

function careerPage() {
  const root = '';
  const body = `
${phead({ root, crumbs: ['<span>Study</span>', '<span>Career counselling</span>'], label: 'Career counselling', h1: 'Choose the course <em>for the career.</em>', lede: 'Before you choose a country, decide where you want to be in five years. We help students and professionals choose subjects, routes and destinations that lead to real jobs.' })}
<section class="sec sec--flush">
  <div class="wrap">
    <div class="grid-2">
      <div><span class="label">For students</span><h3 style="margin-bottom:20px">After HSC, A-levels or a bachelor’s</h3><ul class="ticks"><li>Subject and course choice matched to employment outcomes</li><li>Country comparison by cost, work rights and job market</li><li>Funding plan: scholarships, part-time work and family budget</li></ul></div>
      <div><span class="label">For professionals</span><h3 style="margin-bottom:20px">Mid-career moves abroad</h3><ul class="ticks"><li>Skilled-migration eligibility and points</li><li>CV rewritten for the target market</li><li>When a master’s abroad strengthens your case, and when it doesn’t</li></ul></div>
    </div>
  </div>
</section>
<section class="sec sec--tint">
  <div class="wrap">${head('01', 'A session', 'From questions <em>to a written plan.</em>')}${steps([
    ['Discovery call', 'Where you are now and what you want.'],
    ['Profile review', 'Academics, experience, finances and constraints.'],
    ['Options report', 'Two or three realistic routes with costs and risks.'],
    ['Action plan', 'Tests, documents, applications and deadlines.'],
    ['Follow-up', 'Check-ins as you move through applications.'],
  ], true)}</div>
</section>
${cta(root, 'Get a plan, <em>not just a visa.</em>')}`;
  return layout({ title: `Career Counselling for Study & Work Abroad | ${site.name}`, description: 'Career counselling for Bangladeshi students and professionals: choose the course, country and visa route that leads to the career you want.', root, active: 'study', body, path: 'career-counselling.html' });
}

function aboutPage() {
  const root = '';
  const body = `
${phead({ root, crumbs: ['<span>About</span>'], label: `About ${site.name}`, h1: 'Advice you can <em>decide on.</em>', lede: `${site.name} helps students, workers and professionals choose the right destination, programme and visa route, and prepares applications that meet the rules the first time.` })}
<section class="sec sec--flush">
  <div class="wrap cols">
    <div><span class="label">What we believe</span><h2>Good advice sometimes <em>means “not yet”.</em></h2></div>
    <div><p class="lede">Moving abroad is one of the largest financial decisions a family makes. We would rather tell you to improve your IELTS score, wait an intake or walk away from a doubtful job offer than submit an application we don’t believe in.</p>
      <div class="grid-2" style="margin-top:48px"><div><h3 class="h4">Honest</h3><p class="muted">Clear eligibility assessments and written fees before you commit.</p></div><div><h3 class="h4">Thorough</h3><p class="muted">Every document checked against current rules.</p></div><div><h3 class="h4">Personal</h3><p class="muted">One advisor from start to finish.</p></div><div><h3 class="h4">Partnered</h3><p class="muted">Verified language institutes and licensed lawyers abroad.</p></div></div>
    </div>
  </div>
</section>
${cta(root)}`;
  return layout({ title: `About ${site.name} | Study, Work & Migration Advisory`, description: `${site.name} is a study, work and migration advisory with its official office in Genova, Italy, serving students, workers and professionals from Bangladesh.`, root, body, path: 'about.html' });
}

function contactPage() {
  const root = '';
  const body = `
${phead({ root, crumbs: ['<span>Contact</span>'], label: 'Contact', h1: 'Let’s talk about <em>your plans.</em>', lede: 'Call, message or visit. Or leave your details and an advisor will call you back within one working day.' })}
<section class="sec sec--flush">
  <div class="wrap cols">
    <div>
      <dl class="contact-dl" style="margin-top:0">
        <div><dt>Phone</dt><dd><a href="tel:${tel}">${site.phone}</a></dd></div>
        <div><dt>WhatsApp</dt><dd><a href="https://wa.me/${site.whatsapp}" target="_blank" rel="noopener">${site.phone}</a></dd></div>
        <div><dt>Email</dt><dd><a href="mailto:${site.email}">${site.email}</a></dd></div>
        <div><dt>Official office</dt><dd><a href="${site.officeMap}" target="_blank" rel="noopener">${site.office}</a></dd></div>
        <div><dt>Facebook</dt><dd><a href="${site.facebook}" target="_blank" rel="noopener">facebook.com/eximobd</a></dd></div>
      </dl>
      <div class="callout"><strong>A note on fees</strong>We never ask you to pay visa, embassy or government fees into a personal account. Official fees are paid to the embassy, visa centre or government directly.</div>
    </div>
    ${consultForm()}
  </div>
</section>`;
  return layout({ title: `Contact ${site.name} | Free Consultation on WhatsApp`, description: `Call or WhatsApp ${site.phone}, or visit our official office at Via Francesco Ravaschio 97, Genova, Italy. Your first consultation is free.`, root, active: 'contact', body, path: 'contact.html' });
}

// ---------- write ----------
function out(rel, html) {
  const f = join(OUT, rel);
  mkdirSync(dirname(f), { recursive: true });
  writeFileSync(f, html);
}
const pages = [
  ['index.html', home], ['destinations.html', destinationsPage], ['work-abroad.html', workPage],
  ['skilled-migration.html', skilledPage], ['digital-nomad.html', nomadPage], ['residency-citizenship.html', citizenshipPage],
  ['languages.html', languagesPage], ['scholarships.html', scholarshipsPage], ['career-counselling.html', careerPage],
  ['about.html', aboutPage], ['contact.html', contactPage],
];
pages.forEach(([p, fn]) => out(p, fn()));
countries.forEach((c) => out(`countries/${c.slug}.html`, countryPage(c)));
visaTypes.forEach((v) => out(`visas/${v.key}.html`, visaPage(v)));


// ---------- SEO & AI files ----------
const allPaths = [...pages.map(([p]) => p), ...countries.map((c) => `countries/${c.slug}.html`), ...visaTypes.map((v) => `visas/${v.key}.html`)];
const prio = (p) => (p === 'index.html' ? '1.0' : p.includes('/') ? '0.8' : '0.9');
out('sitemap.xml', `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${allPaths.map((p) => `  <url><loc>${site.url}/${p === 'index.html' ? '' : p}</loc><lastmod>${BUILD_DATE}</lastmod><priority>${prio(p)}</priority></url>`).join('\n')}
</urlset>
`);
out('robots.txt', `# Search engines and AI assistants are welcome to read and cite this site.
User-agent: *
Allow: /

User-agent: GPTBot
Allow: /

User-agent: OAI-SearchBot
Allow: /

User-agent: ChatGPT-User
Allow: /

User-agent: ClaudeBot
Allow: /

User-agent: Claude-User
Allow: /

User-agent: PerplexityBot
Allow: /

User-agent: Google-Extended
Allow: /

Sitemap: ${site.url}/sitemap.xml
`);
out('llms.txt', `# ${site.legal}

> ${orgSchema.description} Official office: ${site.office}. Phone / WhatsApp: ${site.phone}. Facebook: ${site.facebook}. Information last reviewed ${site.reviewed}.

Eximo advises Bangladeshi nationals on study, work, tourist, family and medical visas for ${countries.length} countries, overseas employment, skilled migration, digital nomad visas, residency and citizenship by investment (with licensed partner lawyers), and language courses (IELTS, German, Japanese, Korean, Italian) through partner institutes. Visa decisions are made only by governments; overseas employment is processed through BMET-licensed recruiting agencies.

## Services
- [Work abroad from Bangladesh](${site.url}/work-abroad.html): largest destinations for Bangladeshi workers (2025 BMET data), routes, departure process, fraud warnings
- [Skilled migration](${site.url}/skilled-migration.html): Canada Express Entry, Australia 189/190/491, New Zealand, UK, Germany, Ireland
- [Digital nomad visas](${site.url}/digital-nomad.html): remote-work visas open to Bangladeshi applicants
- [Residency & second citizenship](${site.url}/residency-citizenship.html): investment programmes and rules for Bangladeshi nationals
- [Language courses](${site.url}/languages.html): IELTS, German, Japanese, Korean, Italian
- [Scholarships](${site.url}/scholarships.html): funded study abroad for Bangladeshi students
- [All destinations compared](${site.url}/destinations.html)

## Visa types
${visaTypes.map((v) => `- [${v.title} from Bangladesh](${site.url}/visas/${v.key}.html): ${v.short}`).join('\n')}

## Country guides
${countries.map((c) => `- [${c.name}](${site.url}/countries/${c.slug}.html): ${c.tagline}`).join('\n')}

## Contact
- [Contact and free consultation](${site.url}/contact.html)
`);
out('404.html', layout({ title: `Page not found | ${site.name}`, description: 'The page you were looking for could not be found.', root: '/', path: '404.html', body: `
<section class="phead" style="border:0"><div class="wrap"><span class="label">404</span><h1>This page has <em>moved.</em></h1><p class="lede" style="margin:28px 0 36px">The page you were looking for isn’t here. Try one of these instead.</p>
<div class="hero-actions"><a class="btn" href="/">Home ${A}</a><a class="btn btn--line" href="/destinations.html">Destinations</a><a class="btn btn--line" href="/contact.html">Contact</a></div></div></section>` }).replace('<meta name="robots" content="index, follow, max-image-preview:large, max-snippet:-1">', '<meta name="robots" content="noindex">'));

const clientData = {
  countries: countries.map((c) => ({
    slug: c.slug, name: c.name, region: c.region, cost: c.cost, ielts: c.ielts, pr: c.pr, english: c.english,
    study: c.study !== false, primary: c.primary || 'study', postStudy: factsOf(c)[1][1],
    visas: Object.fromEntries(Object.entries(c.visas).map(([k, v]) => [k, { name: v.name, time: v.time }])),
  })),
};
out('assets/js/data.js', `window.EXIMO=${JSON.stringify(clientData)};`);
console.log(`Built ${pages.length + countries.length + visaTypes.length} pages → ${OUT}`);
