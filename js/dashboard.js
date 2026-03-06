/* ============================================================
   SMETrack – Dashboard JavaScript
============================================================ */

/* ── Config ─────────────────────────────────────────────── */

const CONFIG = {
  locale: 'en-IN',
  currency: '₹',

  months: ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'],

  animation: { duration: 1200, delay: 200 },

  chart: {
    incomeColor:  '#2563EB',
    expenseColor: '#F59E0B',
    incomeBg:     'rgba(37,99,235,0.08)',
    expenseBg:    'rgba(245,158,11,0.06)',
    tooltipBg:    '#1E293B'
  },

  pie: { cutout: '68%', borderWidth: 2, borderColor: '#fff' },

  font: { family: 'DM Sans' }
};


/* ── Sample Data (replace with API call later) ───────────── */
/*
  SME Profile : Riya Handicrafts – handicraft export business
  Period      : Jan – Aug (8 months of actuals)
  Change these numbers to match your chosen SME before presenting
*/

const incomeData  = [72000, 85000, 91000, 78000, 104000, 112000, 98000, 125000];
const expenseData = [48000, 54000, 52000, 61000,  67000,  71000, 65000,  78000];

const pieData = {
  labels: ['Raw Materials', 'Payroll', 'Rent', 'Marketing', 'Shipping', 'Misc'],
  values: [28000, 22000, 10000, 8000, 6000, 4000],
  colors: ['#2563EB','#F59E0B','#10B981','#6366F1','#EC4899','#94A3B8']
};

const transactions = [
  { date:'2024-08-18', description:'Export Order – Dubai Buyer',     type:'income',  category:'Sales',         amount:42000, status:'completed' },
  { date:'2024-08-15', description:'Raw Material Purchase',          type:'expense', category:'Raw Materials',  amount:14000, status:'completed' },
  { date:'2024-08-12', description:'Handicraft Fair – Stall Income', type:'income',  category:'Sales',         amount:18500, status:'completed' },
  { date:'2024-08-10', description:'Staff Wages – August',           type:'expense', category:'Payroll',       amount:22000, status:'completed' },
  { date:'2024-08-07', description:'Online Store Sales',             type:'income',  category:'Sales',         amount:11200, status:'pending'   },
  { date:'2024-08-04', description:'Packaging & Shipping Cost',      type:'expense', category:'Shipping',      amount: 5800, status:'completed' },
];


/* ── Init ───────────────────────────────────────────────── */

document.addEventListener('DOMContentLoaded', () => {
  setCurrentDate();
  animateKPIs();
  renderTransactions();
  initLineChart();
  initPieChart();
});


/* ── Date ───────────────────────────────────────────────── */

function setCurrentDate() {
  const el = document.getElementById('current-date');
  if (!el) return;
  el.textContent = new Date().toLocaleDateString(CONFIG.locale, {
    day: 'numeric', month: 'long', year: 'numeric'
  });
}


/* ── KPI Counter Animation ───────────────────────────────── */

function animateKPIs() {
  document.querySelectorAll('.kpi-value[data-target]').forEach(el => {

    const target    = parseInt(el.dataset.target);
    const suffix    = el.dataset.suffix || '';
    const isPercent = suffix === '%';
    const start     = performance.now();

    function tick(now) {
      const progress = Math.min((now - start) / CONFIG.animation.duration, 1);
      const ease     = 1 - Math.pow(1 - progress, 3);
      const val      = Math.round(target * ease);

      el.textContent = isPercent
        ? val + '%'
        : CONFIG.currency + val.toLocaleString(CONFIG.locale);

      if (progress < 1) requestAnimationFrame(tick);
    }

    setTimeout(() => requestAnimationFrame(tick), CONFIG.animation.delay);
  });
}


/* ── Transactions Table ─────────────────────────────────── */

function renderTransactions() {
  const tbody = document.getElementById('txn-body');
  if (!tbody) return;

  if (!transactions.length) {
    tbody.innerHTML = `<tr><td colspan="6" style="text-align:center;color:#94A3B8;padding:32px;">No transactions yet</td></tr>`;
    return;
  }

  tbody.innerHTML = transactions.map(t => {

    const sign   = t.type === 'income' ? '+' : '-';
    const amount = CONFIG.currency + t.amount.toLocaleString(CONFIG.locale);
    const date   = new Date(t.date).toLocaleDateString(CONFIG.locale, {
      day: 'numeric', month: 'short', year: 'numeric'
    });

    return `
      <tr>
        <td style="color:var(--text-muted);font-size:12.5px;">${date}</td>
        <td><div style="font-weight:600;">${t.description}</div></td>
        <td><span class="type-badge ${t.type}">${capitalize(t.type)}</span></td>
        <td style="color:var(--text-muted);">${t.category}</td>
        <td><span class="txn-amount ${t.type}">${sign}${amount}</span></td>
        <td><span class="status-badge ${t.status}">${capitalize(t.status)}</span></td>
      </tr>`;

  }).join('');
}


/* ── Line Chart ─────────────────────────────────────────── */

function initLineChart() {
  const ctx = document.getElementById('lineChart');
  if (!ctx) return;

  if (!incomeData.length) return; // guard: no data yet

  const dataLength = incomeData.length;
  const labels     = CONFIG.months.slice(0, dataLength);
  const income     = incomeData.slice(0, dataLength);
  const expense    = expenseData.slice(0, dataLength);

  new Chart(ctx, {
    type: 'line',
    data: {
      labels,
      datasets: [
        {
          label: 'Income',
          data: income,
          borderColor: CONFIG.chart.incomeColor,
          backgroundColor: CONFIG.chart.incomeBg,
          borderWidth: 2.5,
          pointBackgroundColor: CONFIG.chart.incomeColor,
          pointRadius: 4, pointHoverRadius: 6,
          fill: true, tension: 0.4
        },
        {
          label: 'Expenses',
          data: expense,
          borderColor: CONFIG.chart.expenseColor,
          backgroundColor: CONFIG.chart.expenseBg,
          borderWidth: 2.5,
          pointBackgroundColor: CONFIG.chart.expenseColor,
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
          backgroundColor: CONFIG.chart.tooltipBg,
          padding: 12, cornerRadius: 10,
          callbacks: {
            label: ctx => ' ' + CONFIG.currency + ctx.raw.toLocaleString(CONFIG.locale)
          }
        }
      },
      scales: {
        x: { grid: { display: false }, border: { display: false } },
        y: {
          grid: { color: '#F1F5F9' }, border: { display: false },
          ticks: { callback: v => CONFIG.currency + (v / 1000).toFixed(0) + 'k' }
        }
      }
    }
  });
}


/* ── Pie Chart ──────────────────────────────────────────── */

function initPieChart() {
  const ctx = document.getElementById('pieChart');
  if (!ctx) return;

  if (!pieData.values.length) return; // guard: no data yet

  new Chart(ctx, {
    type: 'doughnut',
    data: {
      labels: pieData.labels,
      datasets: [{
        data: pieData.values,
        backgroundColor: pieData.colors,
        borderWidth: CONFIG.pie.borderWidth,
        borderColor: CONFIG.pie.borderColor,
        hoverOffset: 6
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      cutout: CONFIG.pie.cutout,
      plugins: {
        legend: { display: false },
        tooltip: {
          backgroundColor: CONFIG.chart.tooltipBg,
          padding: 12, cornerRadius: 10,
          callbacks: {
            label: ctx => ' ' + CONFIG.currency + ctx.raw.toLocaleString(CONFIG.locale)
          }
        }
      }
    }
  });

  buildPieLegend();
}


/* ── Pie Legend ─────────────────────────────────────────── */

function buildPieLegend() {
  const legendEl = document.getElementById('pie-legend');
  if (!legendEl) return;

  legendEl.innerHTML = pieData.labels.map((label, i) => `
    <div class="pie-legend-item">
      <div class="pie-legend-color" style="background:${pieData.colors[i]}"></div>
      <span class="pie-legend-label">${label}</span>
      <span class="pie-legend-val">${CONFIG.currency}${pieData.values[i].toLocaleString(CONFIG.locale)}</span>
    </div>
  `).join('');
}


/* ── Sidebar Toggle ─────────────────────────────────────── */

function toggleSidebar() {
  const sidebar  = document.getElementById('sidebar');
  const mainWrap = document.querySelector('.main-wrap');
  const isMobile = window.innerWidth <= 768;

  if (isMobile) {
    sidebar.classList.toggle('open');
  } else {
    sidebar.classList.toggle('collapsed');
    mainWrap.classList.toggle('expanded');
  }
}


/* ── Notifications ─────────────────────────────────────── */

function toggleNotif() {
  document.getElementById('notif-dropdown').classList.toggle('open');
}

function clearNotifs() {
  document.querySelectorAll('.notif-item').forEach(el => el.classList.remove('unread'));
  const badge = document.getElementById('notif-badge');
  if (badge) badge.style.display = 'none';
  document.getElementById('notif-dropdown').classList.remove('open');
}


/* ── Utilities ─────────────────────────────────────────── */

function capitalize(str) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}


/* ── Close Dropdown On Outside Click ───────────────────── */

document.addEventListener('click', e => {
  const btn      = document.getElementById('notif-btn');
  const dropdown = document.getElementById('notif-dropdown');
  if (dropdown && btn && !btn.contains(e.target) && !dropdown.contains(e.target)) {
    dropdown.classList.remove('open');
  }
});