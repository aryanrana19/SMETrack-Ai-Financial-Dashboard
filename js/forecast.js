/* ============================================================
   SMETrack – Forecast JavaScript
   Depends on: js/main.js + js/dashboard.js (loaded first)
   ============================================================ */

// ── Base Data (last 8 months actuals) ─────────────────────
const ACTUAL_INCOME  = [180000, 210000, 195000, 225000, 240000, 215000, 253200, 284500];
const ACTUAL_EXPENSE = [125000, 138000, 120000, 145000, 152000, 148000, 169200, 162300];

const ALL_MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug',
                    'Sep','Oct','Nov','Dec','Jan','Feb','Mar','Apr'];

// Growth rates derived from actuals
const AVG_INCOME_GROWTH  = 0.065; // ~6.5% MoM
const AVG_EXPENSE_GROWTH = 0.035; // ~3.5% MoM

let currentHorizon = 3;
let forecastChart  = null;

// Simulator defaults
const SIM_DEFAULTS = {
  incomeGrowth: 5,
  expenseChange: 0,
  investment: 0,
  recurring: 0,
};

// ── Init ───────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  buildForecast(3);
  animateHealthScore();
});

// ── Horizon Toggle ─────────────────────────────────────────
function setHorizon(months, btn) {
  currentHorizon = months;
  document.querySelectorAll('.topbar-right .filter-btn')
    .forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  buildForecast(months);
}

// ── Core Forecast Engine ───────────────────────────────────
function buildForecast(horizon) {
  const lastIncome  = ACTUAL_INCOME[ACTUAL_INCOME.length - 1];
  const lastExpense = ACTUAL_EXPENSE[ACTUAL_EXPENSE.length - 1];

  const incomeGrowth  = 1 + (parseFloat(document.getElementById('slider-income-growth')?.value  || 5)  / 100);
  const expenseChange = 1 + (parseFloat(document.getElementById('slider-expense-change')?.value || 0)  / 100);
  const investment    =     parseFloat(document.getElementById('slider-investment')?.value       || 0);
  const recurring     =     parseFloat(document.getElementById('slider-recurring')?.value        || 0);

  const projIncome  = [];
  const projExpense = [];

  for (let i = 0; i < horizon; i++) {
    projIncome.push(Math.round(lastIncome  * Math.pow(incomeGrowth,  i + 1)));
    projExpense.push(Math.round(
      (lastExpense * Math.pow(expenseChange, i + 1)) + recurring + (i === 0 ? investment : 0)
    ));
  }

  // Labels: actuals + projected
  const actualMonths = ALL_MONTHS.slice(0, ACTUAL_INCOME.length);
  const projMonths   = ALL_MONTHS.slice(ACTUAL_INCOME.length, ACTUAL_INCOME.length + horizon);

  updateSummaryCards(projIncome, projExpense, horizon);
  renderForecastChart(actualMonths, projMonths, projIncome, projExpense, horizon);
  updateSimResult(projIncome, projExpense);
}

// ── Summary Cards ──────────────────────────────────────────
function updateSummaryCards(projIncome, projExpense, horizon) {
  const totalIncome  = projIncome.reduce((a,b)  => a+b, 0);
  const totalExpense = projExpense.reduce((a,b) => a+b, 0);
  const net          = totalIncome - totalExpense;

  const lastActualNet   = ACTUAL_INCOME[ACTUAL_INCOME.length-1] - ACTUAL_EXPENSE[ACTUAL_EXPENSE.length-1];
  const projMonthlyNet  = net / horizon;
  const growth          = lastActualNet > 0
    ? Math.round(((projMonthlyNet - lastActualNet) / lastActualNet) * 100)
    : 0;

  animateValue('fc-income',  totalIncome,  '₹');
  animateValue('fc-expense', totalExpense, '₹');
  animateValue('fc-net',     net,          '₹');

  const growthEl = document.getElementById('fc-growth');
  if (growthEl) {
    growthEl.textContent = (growth >= 0 ? '+' : '') + growth + '%';
    growthEl.style.color = growth >= 0 ? '#16A34A' : '#DC2626';
  }

  const label = `Next ${horizon} month${horizon > 1 ? 's' : ''}`;
  ['fc-income-sub','fc-expense-sub','fc-net-sub'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.textContent = label;
  });
  const gs = document.getElementById('fc-growth-sub');
  if (gs) gs.textContent = `vs current period`;
}

// ── Forecast Chart ─────────────────────────────────────────
function renderForecastChart(actualMonths, projMonths, projIncome, projExpense, horizon) {
  const ctx = document.getElementById('forecastChart');
  if (!ctx) return;

  const allLabels  = [...actualMonths, ...projMonths];
  const incomeActual  = [...ACTUAL_INCOME,  ...new Array(horizon).fill(null)];
  const expenseActual = [...ACTUAL_EXPENSE, ...new Array(horizon).fill(null)];

  // Connect last actual point to first projected
  const incomeProj  = [...new Array(ACTUAL_INCOME.length - 1).fill(null),  ACTUAL_INCOME[ACTUAL_INCOME.length-1],  ...projIncome];
  const expenseProj = [...new Array(ACTUAL_EXPENSE.length - 1).fill(null), ACTUAL_EXPENSE[ACTUAL_EXPENSE.length-1], ...projExpense];

  const netFlow = allLabels.map((_, i) => {
    const inc = incomeActual[i]  ?? incomeProj[i];
    const exp = expenseActual[i] ?? expenseProj[i];
    return (inc != null && exp != null) ? inc - exp : null;
  });

  if (forecastChart) { forecastChart.destroy(); forecastChart = null; }

  forecastChart = new Chart(ctx, {
    type: 'line',
    data: {
      labels: allLabels,
      datasets: [
        {
          label: 'Actual Income',
          data: incomeActual,
          borderColor: '#2563EB',
          backgroundColor: 'rgba(37,99,235,0.07)',
          borderWidth: 2.5,
          pointBackgroundColor: '#2563EB',
          pointRadius: 4, pointHoverRadius: 6,
          fill: false, tension: 0.4,
        },
        {
          label: 'Projected Income',
          data: incomeProj,
          borderColor: '#2563EB',
          borderDash: [6, 4],
          backgroundColor: 'rgba(37,99,235,0.04)',
          borderWidth: 2,
          pointBackgroundColor: '#fff',
          pointBorderColor: '#2563EB',
          pointRadius: 4, pointHoverRadius: 6,
          fill: false, tension: 0.4,
        },
        {
          label: 'Actual Expenses',
          data: expenseActual,
          borderColor: '#F59E0B',
          backgroundColor: 'rgba(245,158,11,0.05)',
          borderWidth: 2.5,
          pointBackgroundColor: '#F59E0B',
          pointRadius: 4, pointHoverRadius: 6,
          fill: false, tension: 0.4,
        },
        {
          label: 'Projected Expenses',
          data: expenseProj,
          borderColor: '#F59E0B',
          borderDash: [6, 4],
          borderWidth: 2,
          pointBackgroundColor: '#fff',
          pointBorderColor: '#F59E0B',
          pointRadius: 4, pointHoverRadius: 6,
          fill: false, tension: 0.4,
        },
        {
          label: 'Net Cash Flow',
          data: netFlow,
          borderColor: '#10B981',
          backgroundColor: 'rgba(16,185,129,0.06)',
          borderWidth: 2,
          pointRadius: 0,
          fill: true, tension: 0.4,
          borderDash: [],
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
          titleFont: { family:'DM Sans', size:12, weight:'600' },
          bodyFont:  { family:'DM Sans', size:12 },
          padding: 12, cornerRadius: 10,
          callbacks: {
            label: ctx => {
              if (ctx.raw == null) return null;
              return ` ${ctx.dataset.label}: ₹${ctx.raw.toLocaleString('en-IN')}`;
            },
          },
        },
        annotation: {},
      },
      scales: {
        x: {
          grid: { display: false },
          border: { display: false },
          ticks: { font:{family:'DM Sans',size:12}, color:'#94A3B8' },
        },
        y: {
          grid: { color:'#F1F5F9' },
          border: { display: false },
          ticks: {
            font:{family:'DM Sans',size:11}, color:'#94A3B8',
            callback: v => '₹' + (v/1000).toFixed(0) + 'k',
          },
        },
      },
    },
  });

  // Update subtitle
  const sub = document.getElementById('chart-subtitle');
  if (sub) sub.textContent = `Projected income & expenses · Next ${horizon} months`;
}

// ── Simulator Update ───────────────────────────────────────
function updateSim() {
  const ig = parseInt(document.getElementById('slider-income-growth').value);
  const ec = parseInt(document.getElementById('slider-expense-change').value);
  const iv = parseInt(document.getElementById('slider-investment').value);
  const rc = parseInt(document.getElementById('slider-recurring').value);

  // Update display labels
  setText('val-income-growth',  (ig >= 0 ? '+' : '') + ig + '%');
  setText('val-expense-change', (ec >= 0 ? '+' : '') + ec + '%');
  setText('val-investment',     '₹' + iv.toLocaleString('en-IN'));
  setText('val-recurring',      '₹' + rc.toLocaleString('en-IN') + '/mo');

  buildForecast(currentHorizon);
}

function updateSimResult(projIncome, projExpense) {
  const baseIncome  = ACTUAL_INCOME[ACTUAL_INCOME.length-1]   * currentHorizon;
  const baseExpense = ACTUAL_EXPENSE[ACTUAL_EXPENSE.length-1] * currentHorizon;
  const baseNet     = baseIncome - baseExpense;

  const simIncome  = projIncome.reduce((a,b)  => a+b, 0);
  const simExpense = projExpense.reduce((a,b) => a+b, 0);
  const simNet     = simIncome - simExpense;
  const impact     = simNet - baseNet;

  // Net
  const netEl = document.getElementById('sim-net');
  if (netEl) {
    netEl.textContent = '₹' + Math.abs(simNet).toLocaleString('en-IN');
    netEl.className = 'sim-result-val ' + (simNet >= 0 ? 'positive' : 'negative');
  }

  // Impact
  const impactEl = document.getElementById('sim-impact');
  if (impactEl) {
    const sign = impact >= 0 ? '+' : '-';
    impactEl.textContent = sign + '₹' + Math.abs(impact).toLocaleString('en-IN');
    impactEl.className = 'sim-result-val ' + (impact >= 0 ? 'positive' : 'negative');
  }

  // Break-even
  const bEl = document.getElementById('sim-breakeven');
  if (bEl) {
    let cumNet = 0; let breakEven = null;
    for (let i = 0; i < projIncome.length; i++) {
      cumNet += projIncome[i] - projExpense[i];
      if (cumNet >= 0 && breakEven === null) breakEven = i + 1;
    }
    bEl.textContent = breakEven
      ? `Month ${breakEven}`
      : (simNet < 0 ? 'Not in period' : 'Already profitable');
    bEl.className = 'sim-result-val ' + (breakEven ? 'positive' : '');
  }

  // Insight
  const insightEl = document.getElementById('sim-insight');
  if (insightEl) {
    let msg = '';
    const ig = parseInt(document.getElementById('slider-income-growth').value);
    const ec = parseInt(document.getElementById('slider-expense-change').value);
    const iv = parseInt(document.getElementById('slider-investment').value);
    const rc = parseInt(document.getElementById('slider-recurring').value);

    if (ig >= 15 && ec <= 0)
      msg = '🚀 Strong scenario — high income growth with controlled expenses looks very promising.';
    else if (simNet < 0)
      msg = '⚠️ This scenario results in a net loss. Consider reducing the investment or recurring costs.';
    else if (iv > 200000)
      msg = '💡 Large one-time investment detected. Ensure your cash reserves can absorb this before committing.';
    else if (rc > 50000)
      msg = '📊 High recurring expense added. Monitor monthly cash flow closely to stay profitable.';
    else if (impact > 100000)
      msg = '✅ This scenario improves your baseline significantly. Good time to act.';
    else
      msg = '📈 Scenario looks stable. Tweak sliders to explore bolder growth strategies.';

    insightEl.textContent = msg;
    insightEl.classList.add('visible');
  }
}

// ── Health Score ───────────────────────────────────────────
function animateHealthScore() {
  // Calculate scores from actual data
  const income  = ACTUAL_INCOME;
  const expense = ACTUAL_EXPENSE;

  // 1. Cash Flow Stability (25): lower variance = higher score
  const nets     = income.map((v,i) => v - expense[i]);
  const avgNet   = nets.reduce((a,b) => a+b,0) / nets.length;
  const variance = nets.reduce((s,v) => s + Math.pow(v - avgNet, 2), 0) / nets.length;
  const cv       = Math.sqrt(variance) / avgNet;
  const cashflow = Math.round(Math.max(0, Math.min(25, 25 * (1 - Math.min(cv, 1)))));

  // 2. Profit Margin (25): net / income
  const lastMargin  = (income[income.length-1] - expense[expense.length-1]) / income[income.length-1];
  const marginScore = Math.round(Math.max(0, Math.min(25, lastMargin * 60)));

  // 3. Revenue Growth (25): avg MoM growth
  let growthSum = 0;
  for (let i = 1; i < income.length; i++) {
    growthSum += (income[i] - income[i-1]) / income[i-1];
  }
  const avgGrowth  = growthSum / (income.length - 1);
  const growthScore = Math.round(Math.max(0, Math.min(25, avgGrowth * 200)));

  // 4. Expense Control (25): expense growth < income growth
  let expGrowthSum = 0;
  for (let i = 1; i < expense.length; i++) {
    expGrowthSum += (expense[i] - expense[i-1]) / expense[i-1];
  }
  const avgExpGrowth  = expGrowthSum / (expense.length - 1);
  const expenseScore  = Math.round(Math.max(0, Math.min(25, (avgGrowth - avgExpGrowth + 0.05) * 200)));

  const total = cashflow + marginScore + growthScore + expenseScore;

  // Animate score ring
  setTimeout(() => {
    const arc = document.getElementById('score-arc');
    if (arc) {
      const circumference = 314;
      const offset = circumference - (total / 100) * circumference;
      arc.style.transition = 'stroke-dashoffset 1.4s cubic-bezier(.4,0,.2,1)';
      arc.style.strokeDashoffset = offset;
    }

    // Animate number
    animateValue('score-number', total, '');

    // Badge
    setTimeout(() => {
      const badge = document.getElementById('score-badge');
      if (badge) {
        let label, cls;
        if      (total >= 80) { label = '🏆 Excellent – Investment Ready';  cls = 'excellent'; }
        else if (total >= 60) { label = '✅ Good – Mostly Healthy';         cls = 'good';      }
        else if (total >= 40) { label = '⚠️ Fair – Needs Improvement';      cls = 'fair';      }
        else                  { label = '❌ Poor – High Risk';               cls = 'poor';      }
        badge.textContent = label;
        badge.className   = 'score-badge ' + cls;
      }
    }, 800);

    // Animate indicator bars
    animateBar('ind-cashflow', 'fill-cashflow', cashflow,    25);
    animateBar('ind-margin',   'fill-margin',   marginScore, 25);
    animateBar('ind-growth',   'fill-growth',   growthScore, 25);
    animateBar('ind-expense',  'fill-expense',  expenseScore,25);

    // Recommendations
    renderRecommendations(total, cashflow, marginScore, growthScore, expenseScore);

  }, 300);
}

function animateBar(scoreId, fillId, score, max) {
  const scoreEl = document.getElementById(scoreId);
  const fillEl  = document.getElementById(fillId);
  if (scoreEl) scoreEl.textContent = `${score}/${max}`;
  if (fillEl)  setTimeout(() => fillEl.style.width = ((score / max) * 100) + '%', 200);
}

function renderRecommendations(total, cashflow, margin, growth, expense) {
  const chips = [];

  if (growth >= 20)
    chips.push({ text: 'Strong revenue growth', cls: 'green', icon: '📈' });
  else
    chips.push({ text: 'Boost revenue streams', cls: 'blue', icon: '💡' });

  if (margin >= 18)
    chips.push({ text: 'Healthy profit margin', cls: 'green', icon: '✅' });
  else
    chips.push({ text: 'Improve profit margins', cls: 'yellow', icon: '⚠️' });

  if (expense >= 18)
    chips.push({ text: 'Expenses well controlled', cls: 'green', icon: '🎯' });
  else
    chips.push({ text: 'Reduce operational costs', cls: 'red', icon: '🔴' });

  if (total >= 70)
    chips.push({ text: 'Ready for investment', cls: 'green', icon: '🏦' });
  else
    chips.push({ text: 'Build cash reserves first', cls: 'yellow', icon: '💰' });

  const el = document.getElementById('rec-chips');
  if (!el) return;
  el.innerHTML = chips.map(c => `
    <div class="rec-chip ${c.cls}">
      <span>${c.icon}</span> ${c.text}
    </div>
  `).join('');
}

// ── Reset Simulator ────────────────────────────────────────
function resetSimulator() {
  document.getElementById('slider-income-growth').value  = SIM_DEFAULTS.incomeGrowth;
  document.getElementById('slider-expense-change').value = SIM_DEFAULTS.expenseChange;
  document.getElementById('slider-investment').value     = SIM_DEFAULTS.investment;
  document.getElementById('slider-recurring').value      = SIM_DEFAULTS.recurring;
  updateSim();
  showToast('Simulator reset to defaults', '');
}

// ── Helpers ────────────────────────────────────────────────
function animateValue(id, target, prefix) {
  const el = document.getElementById(id);
  if (!el) return;
  const duration = 1000;
  const start = performance.now();
  const startVal = 0;

  function tick(now) {
    const progress = Math.min((now - start) / duration, 1);
    const ease = 1 - Math.pow(1 - progress, 3);
    const val  = Math.round(startVal + (target - startVal) * ease);
    el.textContent = prefix === '₹'
      ? '₹' + Math.abs(val).toLocaleString('en-IN')
      : val + (prefix || '');
    if (progress < 1) requestAnimationFrame(tick);
  }
  requestAnimationFrame(tick);
}

function setText(id, val) {
  const el = document.getElementById(id);
  if (el) el.textContent = val;
}