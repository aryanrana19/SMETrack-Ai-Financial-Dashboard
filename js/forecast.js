/* ============================================================
   SMETrack – forecast.js
   Depends on: main.js (load first)

   HOW TO USE:
   Fill ACTUAL.income and ACTUAL.expense with the SAME numbers
   you used in dashboard.js incomeData / expenseData.
   Everything else is automatic.
============================================================ */

/* ── Config ───────────────────────────────────────────────── */

const FC_CONFIG = {
  locale:   'en-IN',
  currency: '₹',
  months: [
    'Jan','Feb','Mar','Apr','May','Jun','Jul','Aug',
    'Sep','Oct','Nov','Dec','Jan','Feb','Mar','Apr'
  ],
  animation: { duration: 1000, scoreDelay: 300 },
  chart: {
    incomeColor:  '#2563EB',
    expenseColor: '#F59E0B',
    netColor:     '#10B981',
    tooltipBg:    '#1E293B',
    incomeBg:     'rgba(37,99,235,0.07)',
    expenseBg:    'rgba(245,158,11,0.05)',
    netBg:        'rgba(16,185,129,0.06)'
  },
  score: { circumference: 314 },
  sim: { incomeGrowth: 5, expenseChange: 0, investment: 0, recurring: 0 }
};


/* ══════════════════════════════════════════════════════════
   DATA  –  Copy the same numbers from dashboard.js here.
   ACTUAL.income  = incomeData  (same array)
   ACTUAL.expense = expenseData (same array)
══════════════════════════════════════════════════════════ */

const ACTUAL = {
  income:  [],   // e.g. [72000, 85000, 91000, ...]
  expense: []    // e.g. [48000, 54000, 52000, ...]
};


/* ── State ────────────────────────────────────────────────── */

let currentHorizon = 3;
let forecastChart  = null;


/* ── Init ─────────────────────────────────────────────────── */

document.addEventListener('DOMContentLoaded', () => {
  buildForecast(3);
  animateHealthScore();
});


/* ── Horizon Toggle ───────────────────────────────────────── */

function setHorizon(months, btn) {
  currentHorizon = months;
  document.querySelectorAll('.topbar-right .filter-btn').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  buildForecast(months);
}


/* ── Core Forecast Engine ─────────────────────────────────── */

function buildForecast(horizon) {
  if (!ACTUAL.income.length || !ACTUAL.expense.length) return;

  const lastIncome  = ACTUAL.income[ACTUAL.income.length - 1];
  const lastExpense = ACTUAL.expense[ACTUAL.expense.length - 1];

  const incomeGrowth  = 1 + getSlider('slider-income-growth',  FC_CONFIG.sim.incomeGrowth)  / 100;
  const expenseChange = 1 + getSlider('slider-expense-change', FC_CONFIG.sim.expenseChange) / 100;
  const investment    =     getSlider('slider-investment',     FC_CONFIG.sim.investment);
  const recurring     =     getSlider('slider-recurring',      FC_CONFIG.sim.recurring);

  const projIncome  = [];
  const projExpense = [];

  for (let i = 0; i < horizon; i++) {
    projIncome.push(Math.round(lastIncome * Math.pow(incomeGrowth, i + 1)));
    projExpense.push(Math.round(
      lastExpense * Math.pow(expenseChange, i + 1) + recurring + (i === 0 ? investment : 0)
    ));
  }

  const actualMonths = FC_CONFIG.months.slice(0, ACTUAL.income.length);
  const projMonths   = FC_CONFIG.months.slice(ACTUAL.income.length, ACTUAL.income.length + horizon);

  updateFcCards(projIncome, projExpense, horizon);
  renderForecastChart(actualMonths, projMonths, projIncome, projExpense, horizon);
  updateSimResult(projIncome, projExpense);
}


/* ── Forecast Summary Cards ───────────────────────────────── */

function updateFcCards(projIncome, projExpense, horizon) {
  const totalIncome  = sumArr(projIncome);
  const totalExpense = sumArr(projExpense);
  const net          = totalIncome - totalExpense;

  const lastNet        = ACTUAL.income[ACTUAL.income.length - 1] - ACTUAL.expense[ACTUAL.expense.length - 1];
  const projMonthlyNet = net / horizon;
  const growth         = lastNet > 0 ? Math.round(((projMonthlyNet - lastNet) / lastNet) * 100) : 0;

  animVal('fc-income',  totalIncome,  FC_CONFIG.currency);
  animVal('fc-expense', totalExpense, FC_CONFIG.currency);
  animVal('fc-net',     net,          FC_CONFIG.currency);

  const growthEl = document.getElementById('fc-growth');
  if (growthEl) {
    growthEl.textContent = (growth >= 0 ? '+' : '') + growth + '%';
    growthEl.style.color = growth >= 0 ? '#16A34A' : '#DC2626';
  }

  const label = `Next ${horizon} month${horizon > 1 ? 's' : ''}`;
  ['fc-income-sub','fc-expense-sub','fc-net-sub'].forEach(id => setText(id, label));
}


/* ── Forecast Chart ───────────────────────────────────────── */

function renderForecastChart(actualMonths, projMonths, projIncome, projExpense, horizon) {
  const ctx = document.getElementById('forecastChart');
  if (!ctx) return;

  const labels        = [...actualMonths, ...projMonths];
  const incomeActual  = [...ACTUAL.income,  ...Array(horizon).fill(null)];
  const expenseActual = [...ACTUAL.expense, ...Array(horizon).fill(null)];

  const incomeProj  = [...Array(ACTUAL.income.length - 1).fill(null),  ACTUAL.income[ACTUAL.income.length - 1],   ...projIncome];
  const expenseProj = [...Array(ACTUAL.expense.length - 1).fill(null), ACTUAL.expense[ACTUAL.expense.length - 1], ...projExpense];

  const netFlow = labels.map((_, i) => {
    const inc = incomeActual[i]  ?? incomeProj[i];
    const exp = expenseActual[i] ?? expenseProj[i];
    return (inc != null && exp != null) ? inc - exp : null;
  });

  if (forecastChart) { forecastChart.destroy(); forecastChart = null; }

  forecastChart = new Chart(ctx, {
    type: 'line',
    data: {
      labels,
      datasets: [
        { label:'Actual Income',      data:incomeActual,  borderColor:FC_CONFIG.chart.incomeColor,  borderWidth:2.5, pointRadius:4, pointHoverRadius:6, pointBackgroundColor:FC_CONFIG.chart.incomeColor,  fill:false, tension:0.4 },
        { label:'Projected Income',   data:incomeProj,    borderColor:FC_CONFIG.chart.incomeColor,  borderWidth:2,   pointRadius:4, pointHoverRadius:6, pointBackgroundColor:'#fff', pointBorderColor:FC_CONFIG.chart.incomeColor,  borderDash:[6,4], fill:false, tension:0.4 },
        { label:'Actual Expenses',    data:expenseActual, borderColor:FC_CONFIG.chart.expenseColor, borderWidth:2.5, pointRadius:4, pointHoverRadius:6, pointBackgroundColor:FC_CONFIG.chart.expenseColor, fill:false, tension:0.4 },
        { label:'Projected Expenses', data:expenseProj,   borderColor:FC_CONFIG.chart.expenseColor, borderWidth:2,   pointRadius:4, pointHoverRadius:6, pointBackgroundColor:'#fff', pointBorderColor:FC_CONFIG.chart.expenseColor, borderDash:[6,4], fill:false, tension:0.4 },
        { label:'Net Cash Flow',      data:netFlow,       borderColor:FC_CONFIG.chart.netColor,     borderWidth:2,   pointRadius:0, backgroundColor:FC_CONFIG.chart.netBg, fill:true, tension:0.4 }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      interaction: { mode: 'index', intersect: false },
      plugins: {
        legend: { display: false },
        tooltip: {
          backgroundColor: FC_CONFIG.chart.tooltipBg,
          padding: 12, cornerRadius: 10,
          callbacks: {
            label: ctx => {
              if (ctx.raw == null) return null;
              return ` ${ctx.dataset.label}: ${FC_CONFIG.currency}${ctx.raw.toLocaleString(FC_CONFIG.locale)}`;
            }
          }
        }
      },
      scales: {
        x: { grid: { display: false }, border: { display: false } },
        y: {
          grid: { color: '#F1F5F9' }, border: { display: false },
          ticks: { callback: v => FC_CONFIG.currency + (v / 1000).toFixed(0) + 'k' }
        }
      }
    }
  });

  setText('chart-subtitle', `Projected income & expenses · Next ${horizon} months`);
}


/* ── Simulator ────────────────────────────────────────────── */

function updateSim() {
  const ig = getSlider('slider-income-growth',  0);
  const ec = getSlider('slider-expense-change', 0);
  const iv = getSlider('slider-investment',     0);
  const rc = getSlider('slider-recurring',      0);

  setText('val-income-growth',  (ig >= 0 ? '+' : '') + ig + '%');
  setText('val-expense-change', (ec >= 0 ? '+' : '') + ec + '%');
  setText('val-investment',     fmtCurrency(iv));
  setText('val-recurring',      fmtCurrency(rc) + '/mo');

  buildForecast(currentHorizon);
}

function updateSimResult(projIncome, projExpense) {
  const baseNet = (ACTUAL.income[ACTUAL.income.length - 1] - ACTUAL.expense[ACTUAL.expense.length - 1]) * currentHorizon;
  const simNet  = sumArr(projIncome) - sumArr(projExpense);
  const impact  = simNet - baseNet;

  const netEl = document.getElementById('sim-net');
  if (netEl) {
    netEl.textContent = fmtCurrency(Math.abs(simNet));
    netEl.className   = 'sim-result-val ' + (simNet >= 0 ? 'positive' : 'negative');
  }

  const impactEl = document.getElementById('sim-impact');
  if (impactEl) {
    impactEl.textContent = (impact >= 0 ? '+' : '-') + fmtCurrency(Math.abs(impact));
    impactEl.className   = 'sim-result-val ' + (impact >= 0 ? 'positive' : 'negative');
  }

  const bEl = document.getElementById('sim-breakeven');
  if (bEl) {
    let cumNet = 0, be = null;
    for (let i = 0; i < projIncome.length; i++) {
      cumNet += projIncome[i] - projExpense[i];
      if (cumNet >= 0 && be === null) be = i + 1;
    }
    bEl.textContent = be ? `Month ${be}` : (simNet < 0 ? 'Not in period' : 'Already profitable');
    bEl.className   = 'sim-result-val ' + (be ? 'positive' : '');
  }

  const insightEl = document.getElementById('sim-insight');
  if (insightEl) {
    const ig = getSlider('slider-income-growth', 0);
    const iv = getSlider('slider-investment',    0);
    const rc = getSlider('slider-recurring',     0);
    let msg = '';
    if      (simNet < 0)   msg = '⚠️ This scenario leads to a net loss. Reduce investment or recurring costs.';
    else if (ig >= 15)     msg = '🚀 High income growth projected. Ensure operations can scale.';
    else if (iv > 100000)  msg = '💡 Large one-time investment. Check your cash reserves first.';
    else if (rc > 30000)   msg = '📊 High recurring expense added. Monitor cash flow carefully.';
    else if (impact > 0)   msg = '✅ Scenario improves your baseline. Good time to act.';
    else                   msg = '📈 Stable scenario. Adjust sliders to explore strategies.';
    insightEl.textContent = msg;
    insightEl.classList.add('visible');
  }
}

function resetSimulator() {
  const d = FC_CONFIG.sim;
  setVal('slider-income-growth',  d.incomeGrowth);
  setVal('slider-expense-change', d.expenseChange);
  setVal('slider-investment',     d.investment);
  setVal('slider-recurring',      d.recurring);
  updateSim();
  showToast('Simulator reset to defaults', '');
}


/* ── Health Score ─────────────────────────────────────────── */

function animateHealthScore() {
  if (!ACTUAL.income.length) return;

  const income  = ACTUAL.income;
  const expense = ACTUAL.expense;
  const nets    = income.map((v, i) => v - expense[i]);
  const avg     = sumArr(nets) / nets.length;

  // 1. Cash Flow Stability /25
  const variance  = nets.reduce((s, v) => s + Math.pow(v - avg, 2), 0) / nets.length;
  const cv        = Math.sqrt(variance) / avg;
  const cashflow  = Math.round(Math.max(0, Math.min(25, 25 * (1 - Math.min(cv, 1)))));

  // 2. Profit Margin /25
  const lastMargin  = (income[income.length-1] - expense[expense.length-1]) / income[income.length-1];
  const marginScore = Math.round(Math.max(0, Math.min(25, lastMargin * 60)));

  // 3. Revenue Growth /25
  let gSum = 0;
  for (let i = 1; i < income.length; i++) gSum += (income[i] - income[i-1]) / income[i-1];
  const avgGrowth   = gSum / (income.length - 1);
  const growthScore = Math.round(Math.max(0, Math.min(25, avgGrowth * 200)));

  // 4. Expense Control /25
  let eSum = 0;
  for (let i = 1; i < expense.length; i++) eSum += (expense[i] - expense[i-1]) / expense[i-1];
  const avgExpGrowth  = eSum / (expense.length - 1);
  const expenseScore  = Math.round(Math.max(0, Math.min(25, (avgGrowth - avgExpGrowth + 0.05) * 200)));

  const total = cashflow + marginScore + growthScore + expenseScore;

  setTimeout(() => {
    const arc = document.getElementById('score-arc');
    if (arc) {
      arc.style.transition       = 'stroke-dashoffset 1.4s cubic-bezier(.4,0,.2,1)';
      arc.style.strokeDashoffset = FC_CONFIG.score.circumference - (total / 100) * FC_CONFIG.score.circumference;
    }

    animVal('score-number', total, '');

    setTimeout(() => {
      const badge = document.getElementById('score-badge');
      if (!badge) return;
      let label, cls;
      if      (total >= 80) { label = '🏆 Excellent – Investment Ready'; cls = 'excellent'; }
      else if (total >= 60) { label = '✅ Good – Mostly Healthy';        cls = 'good';      }
      else if (total >= 40) { label = '⚠️ Fair – Needs Improvement';     cls = 'fair';      }
      else                  { label = '❌ Poor – High Risk';              cls = 'poor';      }
      badge.textContent = label;
      badge.className   = 'score-badge ' + cls;
    }, 800);

    animBar('ind-cashflow', 'fill-cashflow', cashflow,    25);
    animBar('ind-margin',   'fill-margin',   marginScore, 25);
    animBar('ind-growth',   'fill-growth',   growthScore, 25);
    animBar('ind-expense',  'fill-expense',  expenseScore,25);

    renderRecs(total, cashflow, marginScore, growthScore, expenseScore);

  }, FC_CONFIG.animation.scoreDelay);
}

function animBar(scoreId, fillId, score, max) {
  const scoreEl = document.getElementById(scoreId);
  const fillEl  = document.getElementById(fillId);
  if (scoreEl) scoreEl.textContent = `${score}/${max}`;
  if (fillEl)  setTimeout(() => fillEl.style.width = ((score / max) * 100) + '%', 200);
}

function renderRecs(total, cashflow, margin, growth, expense) {
  const chips = [
    growth  >= 20 ? { text:'Strong revenue growth',     cls:'green',  icon:'📈' } : { text:'Focus on growing revenue',  cls:'blue',   icon:'💡' },
    margin  >= 18 ? { text:'Healthy profit margin',      cls:'green',  icon:'✅' } : { text:'Improve profit margins',    cls:'yellow', icon:'⚠️' },
    expense >= 18 ? { text:'Expenses well controlled',   cls:'green',  icon:'🎯' } : { text:'Reduce operational costs',  cls:'red',    icon:'🔴' },
    total   >= 70 ? { text:'Ready for investment',       cls:'green',  icon:'🏦' } : { text:'Build cash reserves first', cls:'yellow', icon:'💰' },
  ];
  const el = document.getElementById('rec-chips');
  if (!el) return;
  el.innerHTML = chips.map(c => `<div class="rec-chip ${c.cls}"><span>${c.icon}</span> ${c.text}</div>`).join('');
}


/* ── Utilities ────────────────────────────────────────────── */

function animVal(id, target, prefix) {
  const el = document.getElementById(id);
  if (!el) return;
  const start = performance.now();
  function tick(now) {
    const progress = Math.min((now - start) / FC_CONFIG.animation.duration, 1);
    const ease     = 1 - Math.pow(1 - progress, 3);
    const val      = Math.round(Math.abs(target) * ease);
    el.textContent = prefix === FC_CONFIG.currency ? fmtCurrency(val) : val + (prefix || '');
    if (progress < 1) requestAnimationFrame(tick);
  }
  requestAnimationFrame(tick);
}

function getSlider(id, def) { return parseFloat(document.getElementById(id)?.value ?? def); }
function setText(id, val)   { const el = document.getElementById(id); if (el) el.textContent = val; }
function setVal(id, val)    { const el = document.getElementById(id); if (el) el.value = val; }
function sumArr(arr)        { return arr.reduce((a, b) => a + b, 0); }
function fmtCurrency(val)   { return FC_CONFIG.currency + val.toLocaleString(FC_CONFIG.locale); }
function showToast(msg, type) {
  const t = document.getElementById('toast');
  if (!t) return;
  t.textContent = msg;
  t.className   = 'toast ' + (type || '') + ' show';
  setTimeout(() => { t.className = 'toast ' + (type || ''); }, 3000);
}