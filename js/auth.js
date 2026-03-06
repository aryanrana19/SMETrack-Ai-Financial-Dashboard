/* ============================================================
   SMETrack – Auth Page JavaScript
   ============================================================ */

// ── Tab Switching ──────────────────────────────────────────
function switchTab(tab) {
  const isLogin = tab === 'login';
  document.getElementById('tab-login').classList.toggle('active', isLogin);
  document.getElementById('tab-register').classList.toggle('active', !isLogin);
  document.getElementById('form-login').classList.toggle('visible', isLogin);
  document.getElementById('form-register').classList.toggle('visible', !isLogin);
  clearErrors();
}

// ── Login Handler ──────────────────────────────────────────
function handleLogin(e) {
  e.preventDefault();
  clearErrors();

  const email    = document.getElementById('login-email').value.trim();
  const password = document.getElementById('login-password').value;
  let valid = true;

  if (!isValidEmail(email)) { setError('field-login-email', true);    valid = false; }
  if (!password)             { setError('field-login-password', true); valid = false; }
  if (!valid) return;

  setLoading('btn-login', true);
  setTimeout(() => {
    setLoading('btn-login', false);
    showToast('✓ Signed in successfully! Redirecting…', 'success');
    setTimeout(() => { window.location.href = 'dashboard.html'; }, 1200);
  }, 1800);
}

// ── Register Handler ───────────────────────────────────────
function handleRegister(e) {
  e.preventDefault();
  clearErrors();

  const name    = document.getElementById('reg-name').value.trim();
  const email   = document.getElementById('reg-email').value.trim();
  const pw      = document.getElementById('reg-password').value;
  const confirm = document.getElementById('reg-confirm').value;
  let valid = true;

  if (!name)               { setError('field-reg-name', true);     valid = false; }
  if (!isValidEmail(email)){ setError('field-reg-email', true);    valid = false; }
  if (pw.length < 8)       { setError('field-reg-password', true); valid = false; }
  if (pw !== confirm)      { setError('field-reg-confirm', true);  valid = false; }
  if (!valid) return;

  setLoading('btn-register', true);
  setTimeout(() => {
    setLoading('btn-register', false);
    showToast('✓ Account created! Welcome to SMETrack.', 'success');
    setTimeout(() => { window.location.href = 'dashboard.html'; }, 1200);
  }, 1800);
}