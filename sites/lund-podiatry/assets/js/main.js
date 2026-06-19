/* ==========================================================================
   LUND PODIATRY — Interactivity
   - Scroll reveal via IntersectionObserver
   - FAQ accordion
   - Mobile menu drawer
   - Sticky header scroll state
   - Multi-step form wizard with validation
   - Cloudflare Turnstile callbacks (globals for data-callback attribute)
   ========================================================================== */

/* --- GitHub-Pages subpath base-tag fix -------------------------------
   When deployed under github.io (e.g. lcherouri.github.io/prompt-vault-pro/...),
   root-relative URLs like <a href="/about.html"> don't resolve correctly because
   the site is served from a subdirectory. We inject a <base> tag scoped to the
   github.io hostname so subsequent clicks resolve relatively to the subpath.
   On Vercel (or any non-github.io host), no base tag is added — root-relative
   is correct there because Vercel serves from the apex. Idempotent: skips if a
   <base> already exists in the head, never throws. */
(function injectGitHubPagesBase() {
  try {
    var host = (window.location.hostname || '').toLowerCase();
    if (host.indexOf('github.io') === -1) return;
    var head = document.head || document.getElementsByTagName('head')[0];
    if (!head || head.querySelector('base')) return;
    var b = document.createElement('base');
    b.href = '/prompt-vault-pro/sites/lund-podiatry/';
    head.insertBefore(b, head.firstChild);
  } catch (_) { /* never break the page */ }
})();

// Global handlers for Cloudflare Turnstile — defined at window scope so the
// data-callback="onTurnstileSuccess" attribute can resolve by name.
function onTurnstileSuccess(token) {
  const wizard = document.querySelector('[data-form-wizard]');
  if (!wizard) return;
  const input = wizard.querySelector('#cf-turnstile-response');
  if (input) input.value = token;
  const submitBtn = wizard.querySelector('[data-submit]');
  if (submitBtn) { submitBtn.disabled = false; submitBtn.textContent = 'Submit & Get My Check \u2192'; }
  const errEl = wizard.querySelector('#turnstile-error');
  if (errEl) errEl.replaceChildren();
}
function onTurnstileExpired() {
  const wizard = document.querySelector('[data-form-wizard]');
  if (!wizard) return;
  const submitBtn = wizard.querySelector('[data-submit]');
  if (submitBtn) { submitBtn.disabled = true; submitBtn.textContent = 'Verify you\u2019re human below \u2191'; }
}
function onTurnstileError() {
  const wizard = document.querySelector('[data-form-wizard]');
  if (!wizard) return;
  const submitBtn = wizard.querySelector('[data-submit]');
  if (submitBtn) { submitBtn.disabled = false; }
  const errEl = wizard.querySelector('#turnstile-error');
  if (errEl) {
    errEl.replaceChildren();
    const span = document.createElement('span');
    span.textContent = 'Bot challenge failed. Try again or reload the page.';
    span.style.cssText = 'display:block;color:#B5524A;';
    errEl.appendChild(span);
  }
}

// Loaded later by Cloudflare's script; expose globally so Turnstile JS can invoke.
// (Cloudflare reads the function name from data-callback attribute — must be window-scoped.)

(() => {
  'use strict';

  /* --- Cloudflare Turnstile conditional loader -------------------------- */
  // The .cf-turnstile widget on the contact page has a placeholder sitekey
  // (`TODO_TURNSTILE_SITE_KEY`) until you copy the real one from the Cloudflare
  // dashboard. Loading Turnstile's `api.js` against a placeholder always
  // produces a 400020 console error — so we lazy-inject the script tag ONLY
  // when a real sitekey is present, and hide the widget otherwise. Keeps the
  // local preview console clean while still working in production.
  (function maybeLoadTurnstile() {
    const el = document.querySelector('.cf-turnstile[data-sitekey]');
    if (!el) return; // not on contact.html or no widget
    const sk = (el.getAttribute('data-sitekey') || '').trim();
    if (!sk || sk.startsWith('TODO_')) {
      const wrap = el.closest('.cf-turnstile-wrap') || el.parentElement;
      if (wrap) wrap.style.display = 'none';
      const errEl = document.getElementById('turnstile-error');
      if (errEl) errEl.textContent = '';
      return;
    }
    if (document.querySelector('script[data-lp-turnstile]')) return; // idempotent
    const s = document.createElement('script');
    s.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js';
    s.async = true;
    s.defer = true;
    s.setAttribute('data-lp-turnstile', '');
    document.head.appendChild(s);
  })();

  /* --- Scroll Reveal ---------------------------------------------------- */
  const revealTargets = document.querySelectorAll('[data-reveal]');
  if ('IntersectionObserver' in window && revealTargets.length) {
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.setAttribute('data-revealed', 'true');
            io.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12, rootMargin: '0px 0px -40px 0px' }
    );
    revealTargets.forEach((el) => io.observe(el));
  } else {
    revealTargets.forEach((el) => el.setAttribute('data-revealed', 'true'));
  }

  /* --- Sticky Header State --------------------------------------------- */
  const header = document.querySelector('.site-header');
  if (header) {
    const onScroll = () => {
      header.setAttribute('data-scrolled', window.scrollY > 8 ? 'true' : 'false');
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
  }

  /* --- Mobile Menu Drawer ---------------------------------------------- */
  const toggle = document.querySelector('.mobile-toggle');
  const drawer = document.querySelector('.mobile-drawer');
  if (toggle && drawer) {
    toggle.addEventListener('click', () => {
      const open = drawer.getAttribute('data-open') === 'true';
      drawer.setAttribute('data-open', String(!open));
      toggle.setAttribute('aria-expanded', String(!open));
      toggle.setAttribute('aria-label', !open ? 'Close menu' : 'Open menu');
    });
    drawer.querySelectorAll('a').forEach((a) =>
      a.addEventListener('click', () => {
        drawer.setAttribute('data-open', 'false');
        toggle.setAttribute('aria-expanded', 'false');
      })
    );
  }

  /* --- FAQ Accordion ---------------------------------------------------- */
  document.querySelectorAll('.faq-item').forEach((item) => {
    const q = item.querySelector('.faq-q');
    if (!q) return;
    q.addEventListener('click', () => {
      const open = item.getAttribute('data-open') === 'true';
      // Single-open accordion: close all others
      document.querySelectorAll('.faq-item').forEach((i) => i.setAttribute('data-open', 'false'));
      if (!open) item.setAttribute('data-open', 'true');
    });
  });

  /* --- Multi-step Form -------------------------------------------------- */
  const wizard = document.querySelector('[data-form-wizard]');
  if (wizard) {
    const steps = Array.from(wizard.querySelectorAll('.form-step'));
    const progress = wizard.querySelectorAll('.form-progress span');
    const prevBtn = wizard.querySelector('[data-prev]');
    const nextBtn = wizard.querySelector('[data-next]');
    const submitBtn = wizard.querySelector('[data-submit]');
    let current = 0;

    const showStep = (idx) => {
      steps.forEach((s, i) => s.setAttribute('data-active', String(i === idx)));
      progress.forEach((p, i) => {
        p.setAttribute('data-done', String(i < idx));
        p.setAttribute('data-current', String(i === idx));
      });
      current = idx;
      // Move focus to first field of new step for accessibility
      const firstField = steps[idx].querySelector('input, select, textarea, button');
      if (firstField) requestAnimationFrame(() => firstField.focus({ preventScroll: true }));
    };

    const announceError = (id, msg) => {
      const el = document.getElementById(id);
      if (!el) return;
      el.replaceChildren();
      const text = document.createElement('span');
      text.textContent = msg;
      text.style.cssText = 'display:block;';
      el.appendChild(text);
    };

    const validateStep = (idx) => {
      const step = steps[idx];
      let valid = true;
      // Text-input steps
      step.querySelectorAll('.field input, .field select, .field textarea').forEach((field) => {
        const wrap = field.closest('.field') || field.parentElement;
        const bad = !field.value || (field.type === 'email' && !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(field.value));
        if (wrap) wrap.setAttribute('data-invalid', bad ? 'true' : 'false');
        field.setAttribute('aria-invalid', bad ? 'true' : 'false');
        if (bad) valid = false;
      });
      // Choice-only steps: require exactly one selection
      if (step.querySelectorAll('.choice').length > 0) {
        const anyChecked = step.querySelectorAll('.choice input:checked').length > 0;
        const errId = `step-${idx}-error`;
        if (!anyChecked) {
          valid = false;
          announceError(errId, 'Please choose one option to continue.');
          step.querySelector('.choice-grid')?.setAttribute('aria-describedby', errId);
        } else {
          const errNode = document.getElementById(errId);
          if (errNode) errNode.replaceChildren();
          step.querySelector('.choice-grid')?.removeAttribute('aria-describedby');
        }
      }
      return valid;
    };

    nextBtn?.addEventListener('click', () => {
      if (!validateStep(current)) return;
      if (current < steps.length - 1) showStep(current + 1);
    });
    prevBtn?.addEventListener('click', () => {
      if (current > 0) showStep(current - 1);
    });
    steps.forEach((s) => {
      s.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && e.target.tagName !== 'TEXTAREA') {
          e.preventDefault();
          nextBtn?.click();
        }
      });
    });
    wizard.addEventListener('submit', async (e) => {
      e.preventDefault();
      if (!validateStep(current)) return;

      const submitBtn = wizard.querySelector('[data-submit]');
      const origText = submitBtn ? submitBtn.textContent : '';
      if (submitBtn) { submitBtn.disabled = true; submitBtn.textContent = 'Sending…'; }

      const data = Object.fromEntries(new FormData(wizard).entries());
      data._gotcha = data._gotcha || ''; // honeypot — empty for real users
      try { sessionStorage.setItem('lp_lead', JSON.stringify(data)); } catch (_) {}

      const success = wizard.getAttribute('data-success') || '/thank-you.html';
      let serverRejected = false;

      try {
        const resp = await fetch(wizard.getAttribute('action') || '/api/contact', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
          body: JSON.stringify(data),
        });
        if (resp.status === 403) {
          // Turnstile / bot-challenge failure — reset widget, restore button, do NOT redirect
          serverRejected = true;
          if (window.turnstile && typeof window.turnstile.reset === 'function') window.turnstile.reset();
          if (submitBtn) { submitBtn.disabled = false; submitBtn.textContent = origText; }
          if (typeof onTurnstileError === 'function') onTurnstileError();
        } else {
          await resp.json().catch(() => ({}));
        }
      } catch (_) {
        /* network failure — fall through to redirect */
      }

      // Redirect only on success or non-Turnstile failures (fail-open UX preserved)
      if (!serverRejected) {
        window.location.href = success;
      }
    });

    showStep(0);
  }

  /* --- Smooth Anchor Scroll (with offset for sticky header) ------------- */
  document.querySelectorAll('a[href^="#"]').forEach((a) => {
    a.addEventListener('click', (e) => {
      const id = a.getAttribute('href').slice(1);
      const target = document.getElementById(id);
      if (!target) return;
      e.preventDefault();
      const offset = header ? header.offsetHeight + 12 : 0;
      const top = target.getBoundingClientRect().top + window.scrollY - offset;
      window.scrollTo({ top, behavior: 'smooth' });
      history.pushState(null, '', `#${id}`);
    });
  });
})();
