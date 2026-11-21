(function () {
  'use strict';
  var D = window.EXIMO || { countries: [] };
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var inSub = /\/(countries|visas)\//.test(location.pathname);
  var root = document.documentElement.getAttribute('data-root') || (inSub ? '../' : '');

  // Drawer
  var drawer = $('#drawer');
  var openBtn = $('[data-drawer-open]');
  function setDrawer(open) {
    if (!drawer) return;
    drawer.classList.toggle('is-open', open);
    drawer.setAttribute('aria-hidden', String(!open));
    if (openBtn) openBtn.setAttribute('aria-expanded', String(open));
    document.body.style.overflow = open ? 'hidden' : '';
  }
  if (openBtn) openBtn.addEventListener('click', function () { setDrawer(true); });
  $$('[data-drawer-close]').forEach(function (b) { b.addEventListener('click', function () { setDrawer(false); }); });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape') setDrawer(false); });

  // Sentence finder
  $$('[data-finder]').forEach(function (f) {
    var g = $('[data-f-goal]', f), c = $('[data-f-country]', f);
    var meta = f.parentNode.querySelector('.finder-meta');
    var bnSlugs = (f.getAttribute('data-bn') || '').split(',');
    function update() {
      var country = D.countries.find(function (x) { return x.slug === c.value; });
      if (!country) return;
      var v = country.visas[g.value];
      var dir = f.hasAttribute('data-bn') && bnSlugs.indexOf(country.slug) > -1 ? 'bn/countries/' : 'countries/';
      $('[data-f-link]', f).href = root + dir + country.slug + '.html#' + g.value;
      if (meta) {
        $('[data-f-name]', meta).textContent = v.name;
        $('[data-f-time]', meta).textContent = 'Typical processing: ' + v.time;
      }
    }
    g.addEventListener('change', update); c.addEventListener('change', update); update();
  });

  // Compare tool
  $$('[data-compare]').forEach(function (box) {
    var state = { goal: 'study', budget: 2 };
    var ielts = $('[data-ielts]', box), out = $('[data-results]', box);
    $$('[data-opt]', box).forEach(function (grp) {
      var key = grp.getAttribute('data-opt');
      $$('button', grp).forEach(function (b) {
        b.addEventListener('click', function () {
          $$('button', grp).forEach(function (x) { x.classList.remove('is-on'); });
          b.classList.add('is-on');
          state[key] = key === 'budget' ? Number(b.getAttribute('data-v')) : b.getAttribute('data-v');
          render();
        });
      });
    });
    ielts.addEventListener('input', render);
    $$('[data-pref]', box).forEach(function (c) { c.addEventListener('change', render); });
    function pref(k) { var el = $('[data-pref="' + k + '"]', box); return el && el.checked; }
    var strongJobs = ['uk', 'usa', 'canada', 'australia', 'germany', 'ireland', 'new-zealand', 'singapore', 'japan', 'saudi-arabia', 'qatar', 'italy'];

    function score(c) {
      var s = 0, max = 0, pros = [], cons = [], band = Number(ielts.value);
      max += 30;
      if (c.cost < state.budget) { s += 30; pros.push('comfortably within budget'); }
      else if (c.cost === state.budget) { s += 25; pros.push('within budget'); }
      else if (c.cost === state.budget + 1) { s += 10; cons.push('above budget'); }
      else cons.push('well above budget');
      max += 25;
      if (band === 0) { if (!c.english) { s += 12; pros.push('local-language routes'); } else { s += 4; cons.push('test usually needed'); } }
      else if (band >= c.ielts) { s += 25; pros.push('meets typical IELTS ' + c.ielts.toFixed(1)); }
      else if (band >= c.ielts - 0.5) { s += 12; cons.push('IELTS slightly low'); }
      else cons.push('IELTS ' + c.ielts.toFixed(1) + '+ typical');
      if (state.goal === 'study') {
        max += 15; s += c.english ? 8 : 3;
        if (/Graduate|PGWP|OPT|Post Study|Stamp 1G|job-seeker/i.test(c.postStudy)) { s += 7; pros.push(c.postStudy.replace(/\s*\(.*\)/, '')); }
      }
      if (state.goal === 'work') { max += 15; if (strongJobs.indexOf(c.slug) > -1) { s += 15; pros.push('strong demand for workers'); } else s += 5; }
      if (state.goal === 'settle') { max += 25; if (c.pr) s += 25; else cons.push('no clear residence route'); }
      if (pref('pr')) { max += 20; if (c.pr) { s += 20; pros.push('residence pathway'); } else if (state.goal !== 'settle') cons.push('limited residence path'); }
      if (pref('english')) { max += 10; if (c.english) { s += 10; pros.push('English-speaking'); } else cons.push('local language needed'); }
      if (pref('near')) { max += 15; if (c.region === 'Asia' || c.region === 'Middle East') { s += 15; pros.push('close to home'); } }
      return { c: c, pct: Math.round((s / max) * 100), pros: pros, cons: cons };
    }
    function cap(s) { return s.charAt(0).toUpperCase() + s.slice(1); }
    function render() {
      var b = Number(ielts.value);
      $('[data-ielts-val]', box).textContent = b === 0 ? 'None' : b.toFixed(1);
      var pool = D.countries.filter(function (c) { return state.goal !== 'study' || c.study; });
      var list = pool.map(score).sort(function (a, b2) { return b2.pct - a.pct || a.c.cost - b2.c.cost; }).slice(0, 6);
      var key = state.goal === 'settle' ? 'work' : state.goal;
      out.innerHTML = list.map(function (r, i) {
        var text = cap(r.pros.slice(0, 3).join(' · ') || '—');
        if (r.cons.length) text += ' · <span class="neg">' + r.cons.slice(0, 2).join(' · ') + '</span>';
        return '<a class="result" href="' + root + 'countries/' + r.c.slug + '.html#' + key + '"><span class="rk">' + (i + 1) + '</span><div><h3>' + r.c.name + '</h3><p>' + text + '</p></div><div class="pct">' + r.pct + '%<small>match</small></div></a>';
      }).join('');
    }
    render();
  });

  // Tabs
  var tabs = $$('[data-tab]');
  if (tabs.length) {
    var show = function (key, focus) {
      var ok = false;
      tabs.forEach(function (t) {
        var on = t.getAttribute('data-tab') === key;
        if (on) ok = true;
      });
      if (!ok) return false;
      tabs.forEach(function (t) {
        var on = t.getAttribute('data-tab') === key;
        t.setAttribute('aria-selected', String(on));
        t.tabIndex = on ? 0 : -1;
        var p = document.getElementById(t.getAttribute('aria-controls'));
        if (p) p.hidden = !on;
        if (on) {
          if (focus) t.focus();
          var bar = t.parentNode;
          bar.scrollLeft = t.offsetLeft - (bar.clientWidth - t.offsetWidth) / 2;
        }
      });
      return true;
    };
    tabs.forEach(function (t, i) {
      t.addEventListener('click', function () { var k = t.getAttribute('data-tab'); show(k); history.replaceState(null, '', '#' + k); });
      t.addEventListener('keydown', function (e) {
        var d = e.key === 'ArrowRight' ? 1 : e.key === 'ArrowLeft' ? -1 : 0;
        if (d) show(tabs[(i + d + tabs.length) % tabs.length].getAttribute('data-tab'), true);
      });
    });
    var h = location.hash.replace('#', '');
    if (h && show(h)) {
      var bar = $('.tabs-bar');
      var jump = function () { window.scrollTo({ top: bar.offsetTop - 76, behavior: 'instant' }); };
      if (document.readyState === 'complete') jump(); else window.addEventListener('load', jump);
    } else {
      var sel = tabs.find(function (t) { return t.getAttribute('aria-selected') === 'true'; }) || tabs[0];
      show(sel.getAttribute('data-tab'));
    }
  }

  // Conversion tracking: events go to GA4 / Google Ads when gtag is configured, and to dataLayer for GTM.
  function track(name, params) {
    params = params || {};
    window.dataLayer = window.dataLayer || [];
    window.dataLayer.push(Object.assign({ event: name }, params));
    if (typeof window.gtag === 'function') window.gtag('event', name, params);
  }
  document.addEventListener('click', function (e) {
    var a = e.target.closest && e.target.closest('a[href]');
    if (!a) return;
    var h = a.getAttribute('href');
    if (/wa\.me\//.test(h)) track('whatsapp_click', { link_location: location.pathname });
    else if (/^tel:/.test(h)) track('phone_click', { link_location: location.pathname });
    else if (/^mailto:/.test(h)) track('email_click', { link_location: location.pathname });
    else if (/contact\.html#book/.test(h)) track('book_consultation_click', { link_location: location.pathname });
  });

  // Forms: the enquiry opens in WhatsApp, pre-filled, so it reaches an advisor without a mail server.
  // Optionally set data-endpoint on the <form> (e.g. a Formspree URL) to also store submissions.
  $$('[data-form]').forEach(function (form) {
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var req = $$('[required]', form), bad = req.filter(function (i) { return !i.value.trim(); });
      req.forEach(function (i) { i.classList.toggle('is-bad', bad.indexOf(i) > -1); });
      if (bad.length) { bad[0].focus(); return; }
      var f = function (n) { var el = form.elements[n]; return el ? el.value.trim() : ''; };
      var bn = form.getAttribute('data-lang') === 'bn';
      var msg = bn
        ? 'হ্যালো Eximo, আমি পরামর্শ নিতে চাই।\n\nনাম: ' + f('name') + '\nফোন: ' + f('phone') +
          (f('email') ? '\nইমেইল: ' + f('email') : '') + '\nআগ্রহ: ' + f('goal') + '\nদেশ: ' + f('country') +
          (f('message') ? '\n\nআমার সম্পর্কে: ' + f('message') : '')
        : 'Hello Eximo, I would like a consultation.\n\nName: ' + f('name') + '\nPhone: ' + f('phone') +
          (f('email') ? '\nEmail: ' + f('email') : '') + '\nInterested in: ' + f('goal') + '\nDestination: ' + f('country') +
          (f('message') ? '\n\nAbout me: ' + f('message') : '');
      var wa = 'https://wa.me/' + form.getAttribute('data-wa') + '?text=' + encodeURIComponent(msg);
      track('generate_lead', { form: 'consultation', goal: f('goal'), destination: f('country') });
      var ep = form.getAttribute('data-endpoint');
      if (ep) fetch(ep, { method: 'POST', body: new FormData(form), headers: { Accept: 'application/json' } }).catch(function () {});
      var w = window.open(wa, '_blank', 'noopener');
      if (!w) location.href = wa;
      var done = form.parentNode.querySelector('.form-done');
      $('a', done).href = wa;
      form.hidden = true; done.classList.add('is-shown');
    });
  });
})();
