/* ============================================================
   SMETrack – main.js
   Global utilities shared across all pages.
   Load this BEFORE any page-specific JS file.
============================================================ */

/* ── Toast Notification ───────────────────────────────────── */

function showToast(msg, type) {
  const t = document.getElementById('toast');
  if (!t) return;
  t.textContent = msg;
  t.className = 'toast ' + (type || '') + ' show';
  setTimeout(() => { t.className = 'toast ' + (type || ''); }, 3000);
}


/* ── Button Loading State ─────────────────────────────────── */

function setLoading(btnId, on) {
  const btn = document.getElementById(btnId);
  if (!btn) return;
  btn.classList.toggle('loading', on);
  btn.disabled = on;
}


/* ── Email Validation ─────────────────────────────────────── */

function isValidEmail(v) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
}


/* ── Field Error Toggle ───────────────────────────────────── */

function setError(fieldId, show) {
  const el = document.getElementById(fieldId);
  if (el) el.classList.toggle('has-error', show);
}

function clearErrors() {
  document.querySelectorAll('.field.has-error')
    .forEach(f => f.classList.remove('has-error'));
}


/* ── Password Visibility Toggle ───────────────────────────── */

function togglePw(inputId, btn) {
  const input = document.getElementById(inputId);
  if (!input) return;
  const show = input.type === 'password';
  input.type = show ? 'text' : 'password';
  btn.innerHTML = show
    ? `<svg fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.8">
        <path stroke-linecap="round" stroke-linejoin="round"
          d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"/>
       </svg>`
    : `<svg fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.8">
        <path stroke-linecap="round" stroke-linejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>
        <path stroke-linecap="round" stroke-linejoin="round"
          d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/>
       </svg>`;
}


/* ── Password Strength Meter ──────────────────────────────── */

function checkStrength(pw) {
  const el    = document.getElementById('pw-strength');
  const fill  = document.getElementById('pw-strength-fill');
  const label = document.getElementById('pw-strength-label');
  if (!el) return;

  if (!pw) { el.classList.remove('visible'); return; }
  el.classList.add('visible');

  let score = 0;
  if (pw.length >= 8)  score++;
  if (pw.length >= 12) score++;
  if (/[A-Z]/.test(pw) && /[a-z]/.test(pw)) score++;
  if (/\d/.test(pw))   score++;
  if (/[^A-Za-z0-9]/.test(pw)) score++;

  const levels = [
    { pct: '20%', color: '#EF4444', text: 'Very weak'  },
    { pct: '40%', color: '#F97316', text: 'Weak'       },
    { pct: '60%', color: '#EAB308', text: 'Fair'       },
    { pct: '80%', color: '#3B82F6', text: 'Strong'     },
    { pct: '100%',color: '#10B981', text: 'Very strong'},
  ];

  const lvl = levels[Math.min(score, 4)];
  fill.style.width      = lvl.pct;
  fill.style.background = lvl.color;
  label.textContent     = lvl.text;
  label.style.color     = lvl.color;
}


/* ── Sidebar Toggle (used on all inner pages) ─────────────── */

function toggleSidebar() {
  const sidebar  = document.getElementById('sidebar');
  const mainWrap = document.querySelector('.main-wrap');
  const isMobile = window.innerWidth <= 768;

  if (isMobile) {
    sidebar.classList.toggle('open');
  } else {
    sidebar.classList.toggle('collapsed');
    if (mainWrap) mainWrap.classList.toggle('expanded');
  }
}


/* ── Active Nav Highlight ─────────────────────────────────── */

function setActiveNav() {
  const page = window.location.pathname.split('/').pop() || 'dashboard.html';
  document.querySelectorAll('[data-nav]').forEach(link => {
    link.classList.toggle('active', link.dataset.nav === page);
  });
}

document.addEventListener('DOMContentLoaded', setActiveNav);