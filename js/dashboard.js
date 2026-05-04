/* ============================================================
   SMETrack – dashboard.js
   Depends on: main.js (load first)
   API constant is defined in main.js — do NOT redefine here.
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
  pie: {
    cutout: '68%', borderWidth: 2, borderColor: '#fff',
    colors: ['#2563EB','#F59E0B','#10B981','#6366F1','#EC4899','#94A3B8']
  }
};


/* ── User ─────────────────────────────────────────────────── */

const USER = {
  name:     'Aryan Rana',
  role:     'Business Owner',
  initials: 'AR'
};


/* ── Notifications ────────────────────────────────────────── */

const NOTIFICATIONS = [];


/* ── Init ─────────────────────────────────────────────────── */

document.addEventListener('DOMContentLoaded', async () => {
  setCurrentDate();
  renderUser();
  renderNotifications();
  await loadDashboardData();
});


/* ── Load All Data From Backend ───────────────────────────── */

async function loadDashboardData() {
  try {
    const res  = await fetch(`${API}/transactions`);
    const data = await res.json();

    if (!data.length) {
      renderDashTransactions([]);
      return;
    }

    const monthlyIncome  = buildMonthlyTotals(data, 'income');
    const monthlyExpense = buildMonthlyTotals(data, 'expense');
    const computedPie    = buildPieFromTransactions(data);

    renderKPIs(monthlyIncome, monthlyExpense, data);
    renderDashTransactions(data.slice(0, 6));
    initLineChart(monthlyIncome, monthlyExpense);
    initPieChart(computedPie);

  } catch (err) {
    renderDashTransactions([]);
  }
}


/* ── Build Monthly Totals ─────────────────────────────────── */

function buildMonthlyTotals(transactions, type) {
  const filtered = transactions.filter(t => t.type === type);
  const map = {};
  filtered.forEach(t => {
    const key = t.date.slice(0, 7);
    map[key] = (map[key] || 0) + t.amount;
  });
  return Object.keys(map).sort().map(k => Math.round(map[k]));
}


/* ── Build Pie Data From Transactions ─────────────────────── */

function buildPieFromTransactions(transactions) {
  const expenses = transactions.filter(t => t.type === 'expense');
  const map = {};
  expenses.forEach(t => {
    map[t.category] = (map[t.category] || 0) + t.amount;
  });

  const labels = Object.keys(map);
  const values = labels.map(l => Math.round(map[l]));
  const colors = DASH_CONFIG.pie.colors.slice(0, labels.length);

  return { labels, values, colors };
}


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


/* ── KPI Cards ────────────────────────────────────────────── */

function renderKPIs(incomeData, expenseData, allTxns) {
  if (!incomeData.length || !expenseData.length) return;

  const len    = Math.min(incomeData.length, expenseData.length);
  const curInc = incomeData[len - 1];
  const curExp = expenseData[len - 1];
  const curNet = curInc - curExp;
  const curSav = Math.round((curNet / curInc) * 100);

  const prevInc = len >= 2 ? incomeData[len - 2]  : null;
  const prevExp = len >= 2 ? expenseData[len - 2] : null;
  const prevNet = prevInc != null ? prevInc - prevExp : null;
  const prevSav = prevInc != null ? Math.round(((prevInc - prevExp) / prevInc) * 100) : null;
  const prevMonth = len >= 2 ? DASH_CONFIG.months[len - 2] : null;

  animateCount('kpi-income',  curInc, false);
  animateCount('kpi-expense', curExp, false);
  animateCount('kpi-profit',  curNet, false);
  animateCount('kpi-savings', curSav, true);

  if (prevInc != null) {
    setTrend('trend-income',  curInc, prevInc, false);
    setTrend('trend-expense', curExp, prevExp, true);
    setTrend('trend-profit',  curNet, prevNet, false);
    setTrend('trend-savings', curSav, prevSav, false);
  }

  if (prevMonth) {
    setText('kpi-income-sub',  `vs ${fmt(prevInc)} in ${prevMonth}`);
    setText('kpi-expense-sub', `vs ${fmt(prevExp)} in ${prevMonth}`);
    setText('kpi-profit-sub',  `vs ${fmt(prevNet)} in ${prevMonth}`);
    setText('kpi-savings-sub', `vs ${prevSav}% in ${prevMonth}`);
  }

  setText('line-subtitle', `Monthly comparison · ${new Date().getFullYear()}`);
  setText('txn-subtitle',  `Showing ${Math.min(allTxns.length, 6)} recent records`);
}


/* ── Trend Badge ──────────────────────────────────────────── */

function setTrend(id, current, previous, invertColor) {
  const el = document.getElementById(id);
  if (!el || previous == null || previous === 0) return;

  const pct    = Math.abs(Math.round(((current - previous) / previous) * 100));
  const up     = current >= previous;
  const isGood = invertColor ? !up : up;

  const arrowUp   = `<svg fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5"><path stroke-linecap="round" stroke-linejoin="round" d="M5 10l7-7m0 0l7 7m-7-7v18"/></svg>`;
  const arrowDown = `<svg fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5"><path stroke-linecap="round" stroke-linejoin="round" d="M19 14l-7 7m0 0l-7-7m7 7V3"/></svg>`;

  el.innerHTML = (up ? arrowUp : arrowDown) + ` ${pct}%`;
  el.className = 'kpi-trend ' + (isGood ? 'up' : 'down');
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

function renderDashTransactions(txns) {
  const tbody = document.getElementById('txn-body');
  if (!tbody) return;

  if (!txns.length) {
    tbody.innerHTML = `<tr><td colspan="6" style="text-align:center;color:#94A3B8;padding:32px;">No transactions yet</td></tr>`;
    return;
  }

  tbody.innerHTML = txns.map(t => {
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

function initLineChart(incomeData, expenseData) {
  const ctx = document.getElementById('lineChart');
  if (!ctx || !incomeData.length) return;

  const len    = Math.min(incomeData.length, expenseData.length);
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

function initPieChart(pieData) {
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

  buildPieLegend(pieData);
}

function buildPieLegend(pieData) {
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