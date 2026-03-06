/* ============================================================
   SMETrack – dashboard.js
   Depends on: main.js (load first)

   HOW TO USE:
   Fill in the arrays below with your own data before presenting.
   Everything else is automatic.
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
   DATA  –  Fill these in with your SME's numbers.
   incomeData / expenseData : one number per month (Jan first)
   pieData                  : expense breakdown by category
   transactions             : recent records shown on dashboard
══════════════════════════════════════════════════════════ */

const incomeData  = [];   // e.g. [72000, 85000, 91000, ...]
const expenseData = [];   // e.g. [48000, 54000, 52000, ...]

const pieData = {
  labels: [],             // e.g. ['Raw Materials', 'Payroll', 'Rent', ...]
  values: [],             // e.g. [28000, 22000, 10000, ...]
  colors: ['#2563EB','#F59E0B','#10B981','#6366F1','#EC4899','#94A3B8']
};

const dashTransactions = [];
/*
  Each transaction object looks like this:
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
  animateKPIs();
  renderDashTransactions();
  initLineChart();
  initPieChart();
});


/* ── Current Date in Navbar ───────────────────────────────── */

function setCurrentDate() {
  const el = document.getElementById('current-date');
  if (!el) return;
  el.textContent = new Date().toLocaleDateString(DASH_CONFIG.locale, {
    day: 'numeric', month: 'long', year: 'numeric'
  });
}


/* ── KPI Card Counter Animation ───────────────────────────── */

function animateKPIs() {
  document.querySelectorAll('.kpi-value[data-target]').forEach(el => {
    const target    = parseInt(el.dataset.target);
    const isPercent = el.dataset.suffix === '%';
    const start     = performance.now();

    function tick(now) {
      const progress = Math.min((now - start) / DASH_CONFIG.animation.duration, 1);
      const ease     = 1 - Math.pow(1 - progress, 3);
      const val      = Math.round(target * ease);
      el.textContent = isPercent
        ? val + '%'
        : DASH_CONFIG.currency + val.toLocaleString(DASH_CONFIG.locale);
      if (progress < 1) requestAnimationFrame(tick);
    }

    setTimeout(() => requestAnimationFrame(tick), DASH_CONFIG.animation.delay);
  });
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


/* ── Pie / Doughnut Chart ─────────────────────────────────── */

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


/* ── Notifications ────────────────────────────────────────── */

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


/* ── Utility ──────────────────────────────────────────────── */

function cap(s) { return s.charAt(0).toUpperCase() + s.slice(1); }