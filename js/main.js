/* =========================================================================
   ABC Chape liquide & Carrelage  ·  main.js  ·  v2
   Vanilla JS, sans dependance. Chaque module est defensif (guard si absent).
   ========================================================================= */
(function () {
  'use strict';
  var $ = function (s, c) { return (c || document).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); };

  /* ---------- Menu mobile ---------- */
  (function () {
    var toggle = $('#nav-toggle'), menu = $('#nav-menu');
    if (!toggle || !menu) return;
    toggle.addEventListener('click', function () {
      var open = menu.classList.toggle('active');
      toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
      toggle.setAttribute('aria-label', open ? 'Fermer le menu' : 'Ouvrir le menu');
    });
    $$('a', menu).forEach(function (a) {
      a.addEventListener('click', function () {
        if (menu.classList.contains('active')) {
          menu.classList.remove('active');
          toggle.setAttribute('aria-expanded', 'false');
        }
      });
    });
  })();

  /* ---------- Nav : ombre au scroll ---------- */
  (function () {
    var nav = $('#nav');
    if (!nav) return;
    var onScroll = function () { nav.classList.toggle('scrolled', window.scrollY > 30); };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
  })();

  /* ---------- Reveal au scroll ---------- */
  (function () {
    var els = $$('.reveal');
    if (!els.length || !('IntersectionObserver' in window)) {
      els.forEach(function (el) { el.classList.add('is-visible'); });
      return;
    }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) { e.target.classList.add('is-visible'); io.unobserve(e.target); }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -8% 0px' });
    els.forEach(function (el) { io.observe(el); });
  })();

  /* ---------- Carrousel avis ---------- */
  (function () {
    var track = $('#testimonials-track');
    if (!track) return;
    var slides = $$('.testimonial', track);
    var prev = $('#carousel-prev'), next = $('#carousel-next'), dotsWrap = $('#carousel-dots');
    var i = 0, timer = null, n = slides.length;
    if (n < 2) return;

    if (dotsWrap) {
      slides.forEach(function (_, k) {
        var d = document.createElement('button');
        d.className = 'carousel-dot' + (k === 0 ? ' active' : '');
        d.setAttribute('aria-label', 'Avis ' + (k + 1));
        d.addEventListener('click', function () { go(k); });
        dotsWrap.appendChild(d);
      });
    }
    function render() {
      track.style.transform = 'translateX(-' + (i * 100) + '%)';
      if (dotsWrap) $$('.carousel-dot', dotsWrap).forEach(function (d, k) { d.classList.toggle('active', k === i); });
    }
    function go(k) { i = (k + n) % n; render(); restart(); }
    function restart() { if (timer) clearInterval(timer); timer = setInterval(function () { go(i + 1); }, 5500); }
    if (prev) prev.addEventListener('click', function () { go(i - 1); });
    if (next) next.addEventListener('click', function () { go(i + 1); });
    var wrap = $('#testimonials-carousel');
    if (wrap) {
      wrap.addEventListener('mouseenter', function () { if (timer) clearInterval(timer); });
      wrap.addEventListener('mouseleave', restart);
    }
    render(); restart();
  })();

  /* ---------- Filtres galerie ---------- */
  (function () {
    var filters = $$('.gallery-filter');
    if (!filters.length) return;
    var items = $$('.gallery-item');
    filters.forEach(function (btn) {
      btn.addEventListener('click', function () {
        filters.forEach(function (b) { b.classList.remove('active'); });
        btn.classList.add('active');
        var cat = btn.getAttribute('data-filter');
        items.forEach(function (it) {
          var show = cat === 'all' || it.getAttribute('data-cat') === cat;
          it.classList.toggle('is-hidden', !show);
        });
      });
    });
  })();

  /* ---------- Lightbox ---------- */
  (function () {
    var items = $$('.gallery-item');
    if (!items.length) return;
    var box = $('#lightbox');
    if (!box) {
      box = document.createElement('div');
      box.id = 'lightbox';
      box.className = 'lightbox';
      box.innerHTML = '<button class="lightbox__close" aria-label="Fermer">&times;</button>' +
        '<button class="lightbox__nav lightbox__prev" aria-label="Precedent">&#8249;</button>' +
        '<img alt="">' +
        '<button class="lightbox__nav lightbox__next" aria-label="Suivant">&#8250;</button>' +
        '<div class="lightbox__caption"></div>';
      document.body.appendChild(box);
    }
    var img = $('img', box), cap = $('.lightbox__caption', box);
    var visible = items, idx = 0;
    function open(k) {
      visible = items.filter(function (it) { return !it.classList.contains('is-hidden'); });
      idx = visible.indexOf(items[k]);
      if (idx < 0) idx = 0;
      show();
      box.classList.add('active');
      document.body.style.overflow = 'hidden';
    }
    function show() {
      var it = visible[idx]; if (!it) return;
      var im = $('img', it);
      img.src = im.getAttribute('data-full') || im.src;
      img.alt = im.alt || '';
      var c = it.getAttribute('data-caption') || im.alt || '';
      cap.textContent = c;
    }
    function close() { box.classList.remove('active'); document.body.style.overflow = ''; }
    function move(d) { idx = (idx + d + visible.length) % visible.length; show(); }
    items.forEach(function (it, k) {
      it.addEventListener('click', function () { open(k); });
      it.style.cursor = 'zoom-in';
    });
    $('.lightbox__close', box).addEventListener('click', close);
    $('.lightbox__prev', box).addEventListener('click', function (e) { e.stopPropagation(); move(-1); });
    $('.lightbox__next', box).addEventListener('click', function (e) { e.stopPropagation(); move(1); });
    box.addEventListener('click', function (e) { if (e.target === box) close(); });
    document.addEventListener('keydown', function (e) {
      if (!box.classList.contains('active')) return;
      if (e.key === 'Escape') close();
      if (e.key === 'ArrowLeft') move(-1);
      if (e.key === 'ArrowRight') move(1);
    });
  })();

  /* ---------- Bandeau cookies ---------- */
  (function () {
    var banner = $('#cookie-banner');
    if (!banner) return;
    var KEY = 'abc_cookie_consent';
    function set(v) { try { localStorage.setItem(KEY, v); } catch (e) {} banner.style.display = 'none'; }
    var choice = null;
    try { choice = localStorage.getItem(KEY); } catch (e) {}
    if (!choice) banner.style.display = 'block';
    var acc = $('#cookie-accept'), ref = $('#cookie-refuse'), man = $('#cookie-manage');
    if (acc) acc.addEventListener('click', function () { set('accepted'); });
    if (ref) ref.addEventListener('click', function () { set('refused'); });
    if (man) man.addEventListener('click', function (e) { e.preventDefault(); banner.style.display = 'block'; });
  })();

  /* ---------- Carte (consentement) ---------- */
  (function () {
    var btn = $('#map-load');
    if (!btn) return;
    btn.addEventListener('click', function () {
      var holder = $('#map-holder'); if (!holder) return;
      holder.innerHTML = '<iframe title="Localisation ABC Carrelage" width="100%" height="340" style="border:0;border-radius:16px" loading="lazy" referrerpolicy="no-referrer-when-downgrade" src="https://www.google.com/maps?q=ABC+Chape+liquide+Carrelage+Manosque&output=embed"></iframe>';
    });
  })();

  /* ---------- Formulaire devis : champs conditionnels ---------- */
  (function () {
    var form = $('#devis-form');
    if (!form) return;
    var cards = $$('.toggle-card', form);
    function syncBlock(block, on) {
      block.classList.toggle('open', on);
      $$('[data-req]', block).forEach(function (el) {
        if (on) el.setAttribute('required', 'required'); else el.removeAttribute('required');
      });
    }
    cards.forEach(function (card) {
      var input = $('input', card);
      var block = $('#' + card.getAttribute('data-target'));
      function update() {
        card.classList.toggle('checked', input.checked);
        if (block) syncBlock(block, input.checked);
      }
      input.addEventListener('change', update);
      card.addEventListener('keydown', function (e) {
        if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); input.checked = !input.checked; update(); }
      });
      update();
    });
  })();

  /* ---------- Soumission formulaires (AJAX + honeypot) ---------- */
  (function () {
    function genToken() {
      var a = new Uint8Array(16);
      (window.crypto || {}).getRandomValues ? window.crypto.getRandomValues(a) : a.forEach(function (_, i) { a[i] = i * 17 % 256; });
      return Array.prototype.map.call(a, function (b) { return ('0' + b.toString(16)).slice(-2); }).join('');
    }
    var token = genToken();
    $$('input[name="csrf_token"]').forEach(function (el) { el.value = token; });

    $$('form[data-ajax]').forEach(function (form) {
      var msg = $('.form__message', form);
      form.addEventListener('submit', function (e) {
        e.preventDefault();
        var hp = form.querySelector('[name="website"]');
        if (hp && hp.value) { return; }
        // Au moins une prestation cochee (formulaire devis)
        if (form.id === 'devis-form') {
          var anyService = $$('.toggle-card input', form).some(function (i) { return i.checked; });
          if (!anyService) { showMsg('error', 'Selectionnez au moins une prestation : carrelage ou chape liquide.'); return; }
        }
        var btn = form.querySelector('[type="submit"]');
        if (btn) { btn.disabled = true; btn.dataset.label = btn.textContent; btn.textContent = 'Envoi en cours...'; }
        var data = new FormData(form);
        fetch(form.getAttribute('action') || 'php/send-form.php', {
          method: 'POST', body: data, headers: { 'X-Requested-With': 'XMLHttpRequest' }
        }).then(function (r) { return r.json().catch(function () { return { ok: r.ok }; }); })
          .then(function (res) {
            if (res && res.ok) { onSuccess(); } else { showMsg('error', (res && res.message) || 'Une erreur est survenue. Appelez le 06 52 25 12 26.'); resetBtn(); }
          })
          .catch(function () {
            // En demo statique (pas de PHP), on simule un succes pour la demonstration.
            onSuccess(true);
          });
        function resetBtn() { if (btn) { btn.disabled = false; btn.textContent = btn.dataset.label || 'Envoyer'; } }
        function onSuccess(demo) {
          form.reset();
          $$('.toggle-card', form).forEach(function (c) { c.classList.remove('checked'); });
          $$('.conditional-block', form).forEach(function (b) { b.classList.remove('open'); });
          resetBtn();
          var done = $('#devis-success');
          if (done) { form.style.display = 'none'; done.hidden = false; done.scrollIntoView({ behavior: 'smooth', block: 'center' }); }
          else { showMsg('success', 'Merci, votre demande est bien envoyee. On vous rappelle tres vite.'); }
        }
        function showMsg(type, text) {
          if (!msg) return;
          msg.className = 'form__message form__message--' + type;
          msg.textContent = text;
          msg.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      });
    });
  })();

  /* ---------- Wizard RDV (demo, creneaux mock) ---------- */
  (function () {
    var wiz = $('#rdv-wizard');
    if (!wiz) return;
    var DOW = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'];
    var MON = ['janv.', 'fevr.', 'mars', 'avr.', 'mai', 'juin', 'juil.', 'aout', 'sept.', 'oct.', 'nov.', 'dec.'];
    // Plages devis : mardi/jeudi 14h-17h, samedi 9h-12h (mock, configurable cote prod)
    var WINDOWS = { 2: ['14:00', '14:30', '15:00', '15:30', '16:00', '16:30'], 4: ['14:00', '14:30', '15:00', '15:30', '16:00', '16:30'], 6: ['09:00', '09:30', '10:00', '10:30', '11:00', '11:30'] };
    var state = { step: 1, service: null, serviceLabel: '', dur: '', date: null, time: null };

    var panels = $$('.wizard__panel', wiz);
    var steps = $$('.wizard__steps .ws', wiz);

    function setStep(s) {
      state.step = s;
      panels.forEach(function (p) { p.classList.toggle('active', +p.getAttribute('data-step') === s); });
      steps.forEach(function (st, k) {
        st.classList.toggle('active', k + 1 === s);
        st.classList.toggle('done', k + 1 < s);
      });
      wiz.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }

    // Etape 1 : service
    $$('.svc-option input', wiz).forEach(function (r) {
      r.addEventListener('change', function () {
        state.service = r.value;
        state.serviceLabel = r.getAttribute('data-label');
        state.dur = r.getAttribute('data-dur');
        $('#rdv-next-1').disabled = false;
      });
    });

    // Etape 2 : dates + creneaux
    function buildDates() {
      var strip = $('#rdv-dates', wiz); if (!strip) return;
      strip.innerHTML = '';
      var d = new Date(); d.setHours(0, 0, 0, 0);
      var added = 0, cursor = new Date(d);
      cursor.setDate(cursor.getDate() + 1);
      while (added < 18) {
        var day = cursor.getDay();
        if (WINDOWS[day]) {
          (function (date) {
            var pill = document.createElement('button');
            pill.type = 'button';
            pill.className = 'date-pill';
            pill.innerHTML = '<div class="dow">' + DOW[date.getDay()] + '</div><div class="dnum">' + date.getDate() + '</div><div class="mon">' + MON[date.getMonth()] + '</div>';
            pill.addEventListener('click', function () {
              $$('.date-pill', strip).forEach(function (p) { p.classList.remove('active'); });
              pill.classList.add('active');
              state.date = date; state.time = null;
              buildSlots(date);
              validate2();
            });
            strip.appendChild(pill);
          })(new Date(cursor));
          added++;
        }
        cursor.setDate(cursor.getDate() + 1);
      }
    }
    function buildSlots(date) {
      var grid = $('#rdv-slots', wiz); if (!grid) return;
      grid.innerHTML = '';
      var all = WINDOWS[date.getDay()] || [];
      if (!all.length) { grid.innerHTML = '<p class="slot-empty">Aucun creneau ce jour.</p>'; return; }
      // Indisponibilites pseudo-aleatoires deterministes (simulent l'agenda Google)
      var seed = date.getDate() + date.getMonth() * 31;
      all.forEach(function (t, k) {
        var taken = ((seed * 7 + k * 13) % 10) < 3; // ~30% pris
        var b = document.createElement('button');
        b.type = 'button';
        b.className = 'slot';
        b.textContent = t;
        b.disabled = taken;
        if (!taken) b.addEventListener('click', function () {
          $$('.slot', grid).forEach(function (s) { s.classList.remove('active'); });
          b.classList.add('active');
          state.time = t; validate2();
        });
        grid.appendChild(b);
      });
    }
    function validate2() { var n = $('#rdv-next-2'); if (n) n.disabled = !(state.date && state.time); }

    // Etape 3 -> 4 : recap + confirmation
    function fillSummary() {
      var s = $('#rdv-summary', wiz); if (!s) return;
      var dt = state.date ? DOW[state.date.getDay()] + ' ' + state.date.getDate() + ' ' + MON[state.date.getMonth()] : '';
      s.innerHTML =
        '<div class="row"><span>Prestation</span><b>' + (state.serviceLabel || '') + '</b></div>' +
        '<div class="row"><span>Duree</span><b>' + (state.dur || '') + '</b></div>' +
        '<div class="row"><span>Date</span><b>' + dt + '</b></div>' +
        '<div class="row"><span>Heure</span><b>' + (state.time || '') + '</b></div>';
    }

    // Pre-remplissage depuis le formulaire devis (si tunnel)
    try {
      var pre = JSON.parse(sessionStorage.getItem('abc_rdv_prefill') || 'null');
      if (pre) {
        if ($('#rdv-nom')) $('#rdv-nom').value = pre.nom || '';
        if ($('#rdv-email')) $('#rdv-email').value = pre.email || '';
        if ($('#rdv-tel')) $('#rdv-tel').value = pre.tel || '';
      }
    } catch (e) {}

    // Navigation
    wiz.addEventListener('click', function (e) {
      var t = e.target.closest('[data-go]'); if (!t) return;
      var dir = t.getAttribute('data-go');
      if (dir === 'next') {
        if (state.step === 1 && !state.service) return;
        if (state.step === 2) { if (!(state.date && state.time)) return; fillSummary(); }
        setStep(Math.min(4, state.step + 1));
        if (state.step === 2) buildDates();
      } else if (dir === 'prev') {
        setStep(Math.max(1, state.step - 1));
      } else if (dir === 'confirm') {
        var nom = $('#rdv-nom'), email = $('#rdv-email'), tel = $('#rdv-tel');
        if (nom && !nom.value.trim()) { nom.focus(); return; }
        if (email && !email.value.trim()) { email.focus(); return; }
        if (tel && !tel.value.trim()) { tel.focus(); return; }
        // Demo : pas d'appel reseau, on affiche la confirmation
        var dt = state.date ? DOW[state.date.getDay()] + ' ' + state.date.getDate() + ' ' + MON[state.date.getMonth()] : '';
        var conf = $('#rdv-confirm-text', wiz);
        if (conf) conf.textContent = (state.serviceLabel || 'Rendez-vous') + ' le ' + dt + ' a ' + (state.time || '') + '.';
        setStep(4);
      }
    });

    buildDates();
  })();

  /* ---------- Tunnel : devis -> RDV (memorise les coordonnees) ---------- */
  (function () {
    var form = $('#devis-form');
    if (!form) return;
    form.addEventListener('submit', function () {
      try {
        sessionStorage.setItem('abc_rdv_prefill', JSON.stringify({
          nom: (form.querySelector('[name="nom"]') || {}).value || '',
          email: (form.querySelector('[name="email"]') || {}).value || '',
          tel: (form.querySelector('[name="telephone"]') || {}).value || ''
        }));
      } catch (e) {}
    });
  })();

  /* ---------- Annee dynamique footer ---------- */
  $$('[data-year]').forEach(function (el) { el.textContent = new Date().getFullYear(); });
})();
