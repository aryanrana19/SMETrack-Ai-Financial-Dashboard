/* ============================================================
   SMETrack – dashboard.js
   Depends on: main.js (load first)

   HOW TO USE:
   1. Fill USER info below
   2. Fill incomeData / expenseData arrays (one number per month)
   3. Fill pieData labels + values
   4. Fill dashTransactions array
   Everything else — KPIs, trends, charts, table — is automatic.
============================================================ */

/* ── Config ───────────────────────────────────────────────── */

const DASH_CONFIG = {
  locale:   'en-IN',
  currency: '₹',
  months:   ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'],
  animation: { duration: 1200, delay: 200 },
  chart: {
    incomeColor:  '#2563EB',
    expenseColor: '#F59E0B',
    incomeBg:     'rgba(37,99,235,0.08)',
    expenseBg:    'rgba(245,158,11,0.06)',
    tooltipBg:    '#1E293B'
  },
  pie: { cutout: '68%', borderWidth: 2, borderColor: '#fff' }
};


/* ══════════════════════════════════════════════════════════
   USER  –  Change this to your SME owner's details
══════════════════════════════════════════════════════════ */

const USER = {
  name:   '',        // e.g. 'Riya Sharma'
  role:   '',        // e.g. 'Business Owner'
  initials: ''       // e.g. 'RS'  (shown in avatar circles)
};


/* ══════════════════════════════════════════════════════════
   NOTIFICATIONS  –  Add your own or leave empty []
   Each: { msg: '...', time: '...' }
══════════════════════════════════════════════════════════ */

const NOTIFICATIONS = [
  // { msg: 'Cash flow forecast ready for Q3', time: '2 min ago' },
  // { msg: 'Expense limit at 85% this month',  time: '1 hr ago'  },
];


/* ══════════════════════════════════════════════════════════
   DATA  –  Fill these with your SME's numbers.

   incomeData / expenseData : monthly figures, Jan = index 0
   Only fill months that have passed — leave the rest empty.
   Example for Jan–Aug: [72000, 85000, 91000, 78000, 104000, 112000, 98000, 125000]

   pieData : expense breakdown by category for current month
   dashTransactions : recent records shown in the table
══════════════════════════════════════════════════════════ */

const incomeData  = [];
const expenseData = [];

const pieData = {
  labels: [],
  values: [],
  colors: ['#2563EB','#F59E0B','#10B981','#6366F1','#EC4899','#94A3B8']
};

const dashTransactions = [];
/*
  Each transaction object:
  {
    date:        'YYYY-MM-DD',
    description: 'Short label',
    type:        'income' or 'expense',
    category:    'Sales' / 'Payroll' / 'Rent' / etc.,
    amount:      number,
    status:      'completed' / 'pending' / 'failed'
  }
*/


/* ── Init ─────────────────────────────────────────────────── */

document.addEventListener('DOMContentLoaded', () => {
  setCurrentDate();
  renderUser();
  renderNotifications();
  renderKPIs();
  renderDashTransactions();
  initLineChart();
  initPieChart();
});


/* ── Date ─────────────────────────────────────────────────── */

function setCurrentDate() {
  const el = document.getElementById('current-date');
  if (!el) return;
  el.textContent = new Date().toLocaleDateString(DASH_CONFIG.locale, {
    day: 'numeric', month: 'long', year: 'numeric'
  });
}


/* ── User Info ────────────────────────────────────────────── */

function renderUser() {
  setText('sidebar-name',   USER.name);
  setText('sidebar-role',   USER.role);
  setText('sidebar-avatar', USER.initials);
  setText('topbar-name',    USER.name);
  setText('topbar-role',    USER.role);
  setText('topbar-avatar',  USER.initials);
}


/* ── Notifications ────────────────────────────────────────── */

function renderNotifications() {
  const list  = document.getElementById('notif-list');
  const badge = document.getElementById('notif-badge');
  if (!list) return;

  if (!NOTIFICATIONS.length) {
    list.innerHTML = `<div style="padding:20px;text-align:center;color:#94A3B8;font-size:13px;">No new notifications</div>`;
    if (badge) badge.style.display = 'none';
    return;
  }

  list.innerHTML = NOTIFICATIONS.map(n => `
    <div class="notif-item unread">
      <div class="notif-dot"></div>
      <div>
        <div class="notif-msg">${n.msg}</div>
        <div class="notif-time">${n.time}</div>
      </div>
    </div>`).join('');

  if (badge) badge.textContent = NOTIFICATIONS.length;
}

function toggleNotif() {
  document.getElementById('notif-dropdown').classList.toggle('open');
}

function clearNotifs() {
  document.querySelectorAll('.notif-item').forEach(el => el.classList.remove('unread'));
  const badge = document.getElementById('notif-badge');
  if (badge) badge.style.display = 'none';
  document.getElementById('notif-dropdown').classList.remove('open');
}

document.addEventListener('click', e => {
  const btn      = document.getElementById('notif-btn');
  const dropdown = document.getElementById('notif-dropdown');
  if (dropdown && btn && !btn.contains(e.target) && !dropdown.contains(e.target)) {
    dropdown.classList.remove('open');
  }
});


/* ── KPI Cards (fully computed from data) ─────────────────── */

function renderKPIs() {
  if (!incomeData.length || !expenseData.length) return;

  const len      = incomeData.length;
  const curInc   = incomeData[len - 1];
  const curExp   = expenseData[len - 1];
  const curNet   = curInc - curExp;
  const curSav   = Math.round((curNet / curInc) * 100);

  // Previous month (for trend)
  const prevInc  = len >= 2 ? incomeData[len - 2]  : null;
  const prevExp  = len >= 2 ? expenseData[len - 2] : null;
  const prevNet  = prevInc != null ? prevInc - prevExp : null;
  const prevSav  = prevInc != null ? Math.round(((prevInc - prevExp) / prevInc) * 100) : null;

  const curMonth  = DASH_CONFIG.months[len - 1];
  const prevMonth = len >= 2 ? DASH_CONFIG.months[len - 2] : null;

  // Animate values
  animateCount('kpi-income',  curInc,  false);
  animateCount('kpi-expense', curExp,  false);
  animateCount('kpi-profit',  curNet,  false);
  animateCount('kpi-savings', curSav,  true);

  // Trend badges
  if (prevInc != null) {
    setTrend('trend-income',  curInc, prevInc,  false);
    setTrend('trend-expense', curExp, prevExp,  true);  // expense up = bad (red)
    setTrend('trend-profit',  curNet, prevNet,  false);
    setTrend('trend-savings', curSav, prevSav,  false);
  }

  // Sub-labels
  if (prevMonth) {
    setText('kpi-income-sub',  `vs ${fmt(prevInc)} in ${prevMonth}`);
    setText('kpi-expense-sub', `vs ${fmt(prevExp)} in ${prevMonth}`);
    setText('kpi-profit-sub',  `vs ${fmt(prevNet)} in ${prevMonth}`);
    setText('kpi-savings-sub', `vs ${prevSav}% in ${prevMonth}`);
  }

  // Chart subtitle
  setText('line-subtitle', `Monthly comparison · ${new Date().getFullYear()}`);

  // Transaction section subtitle
  setText('txn-subtitle', `Showing ${dashTransactions.length} recent record${dashTransactions.length !== 1 ? 's' : ''}`);
}


/* ── Trend Badge ──────────────────────────────────────────── */

function setTrend(id, current, previous, invertColor) {
  const el = document.getElementById(id);
  if (!el || previous == null || previous === 0) return;

  const pct  = Math.abs(Math.round(((current - previous) / previous) * 100));
  const up   = current >= previous;

  // invertColor = true means "up is bad" (used for expenses)
  const isGood = invertColor ? !up : up;

  const arrowUp   = `<svg fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5"><path stroke-linecap="round" stroke-linejoin="round" d="M5 10l7-7m0 0l7 7m-7-7v18"/></svg>`;
  const arrowDown = `<svg fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5"><path stroke-linecap="round" stroke-linejoin="round" d="M19 14l-7 7m0 0l-7-7m7 7V3"/></svg>`;

  el.innerHTML  = (up ? arrowUp : arrowDown) + ` ${pct}%`;
  el.className  = 'kpi-trend ' + (isGood ? 'up' : 'down');
}


/* ── Animated Counter ─────────────────────────────────────── */

function animateCount(id, target, isPercent) {
  const el = document.getElementById(id);
  if (!el) return;
  const start = performance.now();

  function tick(now) {
    const progress = Math.min((now - start) / DASH_CONFIG.animation.duration, 1);
    const ease     = 1 - Math.pow(1 - progress, 3);
    const val      = Math.round(Math.abs(target) * ease);
    el.textContent = isPercent
      ? val + '%'
      : DASH_CONFIG.currency + val.toLocaleString(DASH_CONFIG.locale);
    if (progress < 1) requestAnimationFrame(tick);
  }

  setTimeout(() => requestAnimationFrame(tick), DASH_CONFIG.animation.delay);
}


/* ── Transactions Table ───────────────────────────────────── */

function renderDashTransactions() {
  const tbody = document.getElementById('txn-body');
  if (!tbody) return;

  if (!dashTransactions.length) {
    tbody.innerHTML = `<tr><td colspan="6" style="text-align:center;color:#94A3B8;padding:32px;">No transactions yet</td></tr>`;
    return;
  }

  tbody.innerHTML = dashTransactions.map(t => {
    const sign   = t.type === 'income' ? '+' : '-';
    const amount = DASH_CONFIG.currency + t.amount.toLocaleString(DASH_CONFIG.locale);
    const date   = new Date(t.date).toLocaleDateString(DASH_CONFIG.locale, {
      day: 'numeric', month: 'short', year: 'numeric'
    });
    return `
      <tr>
        <td style="color:var(--text-muted);font-size:12.5px;">${date}</td>
        <td><div style="font-weight:600;">${t.description}</div></td>
        <td><span class="type-badge ${t.type}">${cap(t.type)}</span></td>
        <td style="color:var(--text-muted);">${t.category}</td>
        <td><span class="txn-amount ${t.type}">${sign}${amount}</span></td>
        <td><span class="status-badge ${t.status}">${cap(t.status)}</span></td>
      </tr>`;
  }).join('');
}


/* ── Line Chart ───────────────────────────────────────────── */

function initLineChart() {
  const ctx = document.getElementById('lineChart');
  if (!ctx || !incomeData.length) return;

  const len    = incomeData.length;
  const labels = DASH_CONFIG.months.slice(0, len);

  new Chart(ctx, {
    type: 'line',
    data: {
      labels,
      datasets: [
        {
          label: 'Income',
          data: incomeData.slice(0, len),
          borderColor: DASH_CONFIG.chart.incomeColor,
          backgroundColor: DASH_CONFIG.chart.incomeBg,
          borderWidth: 2.5,
          pointBackgroundColor: DASH_CONFIG.chart.incomeColor,
          pointRadius: 4, pointHoverRadius: 6,
          fill: true, tension: 0.4
        },
        {
          label: 'Expenses',
          data: expenseData.slice(0, len),
          borderColor: DASH_CONFIG.chart.expenseColor,
          backgroundColor: DASH_CONFIG.chart.expenseBg,
          borderWidth: 2.5,
          pointBackgroundColor: DASH_CONFIG.chart.expenseColor,
          pointRadius: 4, pointHoverRadius: 6,
          fill: true, tension: 0.4
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      interaction: { mode: 'index', intersect: false },
      plugins: {
        legend: { display: false },
        tooltip: {
          backgroundColor: DASH_CONFIG.chart.tooltipBg,
          padding: 12, cornerRadius: 10,
          callbacks: {
            label: ctx => ' ' + DASH_CONFIG.currency + ctx.raw.toLocaleString(DASH_CONFIG.locale)
          }
        }
      },
      scales: {
        x: { grid: { display: false }, border: { display: false } },
        y: {
          grid: { color: '#F1F5F9' }, border: { display: false },
          ticks: { callback: v => DASH_CONFIG.currency + (v / 1000).toFixed(0) + 'k' }
        }
      }
    }
  });
}


/* ── Pie Chart ────────────────────────────────────────────── */

function initPieChart() {
  const ctx = document.getElementById('pieChart');
  if (!ctx || !pieData.values.length) return;

  new Chart(ctx, {
    type: 'doughnut',
    data: {
      labels: pieData.labels,
      datasets: [{
        data: pieData.values,
        backgroundColor: pieData.colors,
        borderWidth: DASH_CONFIG.pie.borderWidth,
        borderColor: DASH_CONFIG.pie.borderColor,
        hoverOffset: 6
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      cutout: DASH_CONFIG.pie.cutout,
      plugins: {
        legend: { display: false },
        tooltip: {
          backgroundColor: DASH_CONFIG.chart.tooltipBg,
          padding: 12, cornerRadius: 10,
          callbacks: {
            label: ctx => ' ' + DASH_CONFIG.currency + ctx.raw.toLocaleString(DASH_CONFIG.locale)
          }
        }
      }
    }
  });

  buildPieLegend();
}

function buildPieLegend() {
  const el = document.getElementById('pie-legend');
  if (!el) return;
  el.innerHTML = pieData.labels.map((label, i) => `
    <div class="pie-legend-item">
      <div class="pie-legend-color" style="background:${pieData.colors[i]}"></div>
      <span class="pie-legend-label">${label}</span>
      <span class="pie-legend-val">${DASH_CONFIG.currency}${pieData.values[i].toLocaleString(DASH_CONFIG.locale)}</span>
    </div>`
  ).join('');
}


/* ── Utilities ────────────────────────────────────────────── */

function cap(s)         { return s.charAt(0).toUpperCase() + s.slice(1); }
function fmt(val)       { return DASH_CONFIG.currency + Math.abs(val).toLocaleString(DASH_CONFIG.locale); }
function setText(id, v) { const el = document.getElementById(id); if (el) el.textContent = v; }