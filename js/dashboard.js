/* ============================================================
   SMETrack – Dashboard JavaScript
   Depends on: js/main.js (must be loaded first)
   Paste this BELOW the existing code in js/dashboard.js
   ============================================================ */

// ── Sample Data ────────────────────────────────────────────
const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

const incomeData  = [180000, 210000, 195000, 225000, 240000, 215000, 253200, 284500, 0, 0, 0, 0];
const expenseData = [125000, 138000, 120000, 145000, 152000, 148000, 169200, 162300, 0, 0, 0, 0];

const pieData = {
  labels: ['Payroll', 'Operations', 'Marketing', 'Rent', 'Utilities', 'Misc'],
  values: [52000, 34000, 28000, 18000, 16000, 14300],
  colors: ['#2563EB','#F59E0B','#10B981','#6366F1','#EC4899','#94A3B8'],
};

const transactions = [
  { date:'2024-08-15', description:'Client Payment – Nexus Corp',   type:'income',  category:'Sales',      amount: 84000, status:'completed' },
  { date:'2024-08-14', description:'AWS Cloud Infrastructure',       type:'expense', category:'Operations', amount: 12400, status:'completed' },
  { date:'2024-08-13', description:'Freelance Design Project',       type:'income',  category:'Services',   amount: 36500, status:'completed' },
  { date:'2024-08-12', description:'Office Rent – August',           type:'expense', category:'Rent',       amount: 18000, status:'completed' },
  { date:'2024-08-11', description:'Google Ads Campaign',            type:'expense', category:'Marketing',  amount:  9800, status:'pending'   },
  { date:'2024-08-10', description:'Software License Renewal',       type:'expense', category:'Operations', amount:  6200, status:'failed'    },
];

// ── Init ───────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  setCurrentDate();
  animateKPIs();
  renderTransactions();
  initLineChart();
  initPieChart();
});

// ── Date ───────────────────────────────────────────────────
function setCurrentDate() {
  const el = document.getElementById('current-date');
  if (!el) return;
  el.textContent = new Date().toLocaleDateString('en-IN', {
    day:'numeric', month:'long', year:'numeric'
  });
}

// ── KPI Counter Animation ──────────────────────────────────
function animateKPIs() {
  document.querySelectorAll('.kpi-value[data-target]').forEach(el => {
    const target = parseInt(el.dataset.target);
    const suffix = el.dataset.suffix || '';
    const isPercent = suffix === '%';
    const duration = 1200;
    const start = performance.now();

    function tick(now) {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      const ease = 1 - Math.pow(1 - progress, 3); // ease-out-cubic
      const val = Math.round(target * ease);
      el.textContent = isPercent
        ? val + '%'
        : '₹' + val.toLocaleString('en-IN');
      if (progress < 1) requestAnimationFrame(tick);
    }
    // Wait for card animation to start
    setTimeout(() => requestAnimationFrame(tick), 200);
  });
}

// ── Transactions Table ─────────────────────────────────────
function renderTransactions() {
  const tbody = document.getElementById('txn-body');
  if (!tbody) return;

  tbody.innerHTML = transactions.map(t => {
    const sign   = t.type === 'income' ? '+' : '-';
    const amount = '₹' + t.amount.toLocaleString('en-IN');
    const date   = new Date(t.date).toLocaleDateString('en-IN', { day:'numeric', month:'short', year:'numeric' });

    return `
      <tr>
        <td style="color:var(--text-muted); font-size:12.5px;">${date}</td>
        <td>
          <div style="font-weight:600; font-size:13.5px;">${t.description}</div>
        </td>
        <td><span class="type-badge ${t.type}">${t.type.charAt(0).toUpperCase()+t.type.slice(1)}</span></td>
        <td style="color:var(--text-muted);">${t.category}</td>
        <td><span class="txn-amount ${t.type}">${sign}${amount}</span></td>
        <td><span class="status-badge ${t.status}">${t.status.charAt(0).toUpperCase()+t.status.slice(1)}</span></td>
      </tr>`;
  }).join('');
}

// ── Line Chart ─────────────────────────────────────────────
function initLineChart() {
  const ctx = document.getElementById('lineChart');
  if (!ctx) return;

  const currentMonth = new Date().getMonth(); // 0-indexed
  const labels = MONTHS.slice(0, currentMonth + 1);
  const income  = incomeData.slice(0, currentMonth + 1);
  const expense = expenseData.slice(0, currentMonth + 1);

  new Chart(ctx, {
    type: 'line',
    data: {
      labels,
      datasets: [
        {
          label: 'Income',
          data: income,
          borderColor: '#2563EB',
          backgroundColor: 'rgba(37,99,235,0.08)',
          borderWidth: 2.5,
          pointBackgroundColor: '#2563EB',
          pointRadius: 4,
          pointHoverRadius: 6,
          fill: true,
          tension: 0.4,
        },
        {
          label: 'Expenses',
          data: expense,
          borderColor: '#F59E0B',
          backgroundColor: 'rgba(245,158,11,0.06)',
          borderWidth: 2.5,
          pointBackgroundColor: '#F59E0B',
          pointRadius: 4,
          pointHoverRadius: 6,
          fill: true,
          tension: 0.4,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      interaction: { mode: 'index', intersect: false },
      plugins: {
        legend: { display: false },
        tooltip: {
          backgroundColor: '#1E293B',
          titleFont: { family: 'DM Sans', size: 12, weight: '600' },
          bodyFont:  { family: 'DM Sans', size: 12 },
          padding: 12,
          cornerRadius: 10,
          callbacks: {
            label: ctx => ' ₹' + ctx.raw.toLocaleString('en-IN'),
          },
        },
      },
      scales: {
        x: {
          grid: { display: false },
          border: { display: false },
          ticks: { font: { family:'DM Sans', size:12 }, color:'#94A3B8' },
        },
        y: {
          grid: { color:'#F1F5F9', drawBorder: false },
          border: { display: false, dash: [4,4] },
          ticks: {
            font: { family:'DM Sans', size:11 },
            color: '#94A3B8',
            callback: v => '₹' + (v/1000).toFixed(0) + 'k',
          },
        },
      },
    },
  });
}

// ── Pie Chart ──────────────────────────────────────────────
function initPieChart() {
  const ctx = document.getElementById('pieChart');
  if (!ctx) return;

  new Chart(ctx, {
    type: 'doughnut',
    data: {
      labels: pieData.labels,
      datasets: [{
        data: pieData.values,
        backgroundColor: pieData.colors,
        borderWidth: 2,
        borderColor: '#fff',
        hoverOffset: 6,
      }],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      cutout: '68%',
      plugins: {
        legend: { display: false },
        tooltip: {
          backgroundColor: '#1E293B',
          titleFont: { family: 'DM Sans', size: 12, weight: '600' },
          bodyFont:  { family: 'DM Sans', size: 12 },
          padding: 12,
          cornerRadius: 10,
          callbacks: {
            label: ctx => ' ₹' + ctx.raw.toLocaleString('en-IN'),
          },
        },
      },
    },
  });

  // Build custom legend
  const legendEl = document.getElementById('pie-legend');
  if (!legendEl) return;
  const total = pieData.values.reduce((a,b) => a+b, 0);
  legendEl.innerHTML = pieData.labels.map((label, i) => `
    <div class="pie-legend-item">
      <div class="pie-legend-color" style="background:${pieData.colors[i]}"></div>
      <span class="pie-legend-label">${label}</span>
      <span class="pie-legend-val">₹${pieData.values[i].toLocaleString('en-IN')}</span>
    </div>
  `).join('');
}

// ── Sidebar Toggle ─────────────────────────────────────────
function toggleSidebar() {
  const sidebar   = document.getElementById('sidebar');
  const mainWrap  = document.querySelector('.main-wrap');
  const isMobile  = window.innerWidth <= 768;

  if (isMobile) {
    sidebar.classList.toggle('open');
  } else {
    sidebar.classList.toggle('collapsed');
    mainWrap.classList.toggle('expanded');
  }
}

// ── Notifications ──────────────────────────────────────────
function toggleNotif() {
  document.getElementById('notif-dropdown').classList.toggle('open');
}
function clearNotifs() {
  document.querySelectorAll('.notif-item').forEach(el => el.classList.remove('unread'));
  const badge = document.getElementById('notif-badge');
  if (badge) badge.style.display = 'none';
  document.getElementById('notif-dropdown').classList.remove('open');
}

// Close notification dropdown on outside click
document.addEventListener('click', e => {
  const btn      = document.getElementById('notif-btn');
  const dropdown = document.getElementById('notif-dropdown');
  if (dropdown && btn && !btn.contains(e.target) && !dropdown.contains(e.target)) {
    dropdown.classList.remove('open');
  }
});