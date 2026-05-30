
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



const FC_USER = {
  name:     'Aryan Rana',
  role:     'Business Owner',
  initials: 'AR'
};

function renderFcUser() {
  const ids = {
    'sidebar-name':   FC_USER.name,
    'sidebar-role':   FC_USER.role,
    'sidebar-avatar': FC_USER.initials,
    'topbar-name':    FC_USER.name,
    'topbar-role':    FC_USER.role,
    'topbar-avatar':  FC_USER.initials,
  };
  Object.entries(ids).forEach(([id, val]) => {
    const el = document.getElementById(id);
    if (el) el.textContent = val;
  });
}


/* ── State ────────────────────────────────────────────────── */

let currentHorizon = 3;
let forecastChart  = null;

// Populated from /forecast endpoint
const ACTUAL = {
  income:  [],
  expense: []
};

// ML baseline predictions from backend
let ML_BASELINE = {
  income:  [],
  expense: []
};


/* ── Init ─────────────────────────────────────────────────── */

document.addEventListener('DOMContentLoaded', async () => {
  renderFcUser();
  await loadForecastData();
  await loadHealthScore();
});


async function loadForecastData() {
  try {
    const res  = await fetch(`${API}/forecast?horizon=${currentHorizon}`);
    const data = await res.json();

    if (data.error) {
      console.warn('Forecast API:', data.error);
      return;
    }

    // Store actuals
    ACTUAL.income  = data.actual_income  || [];
    ACTUAL.expense = data.actual_expense || [];

    // Store ML baseline predictions
    ML_BASELINE.income  = data.predicted_income  || [];
    ML_BASELINE.expense = data.predicted_expense || [];

    renderForecastFromML(currentHorizon);

  } catch (err) {
    console.warn('Backend not reachable for forecast:', err);
  }
}


/* ── Load score from /score endpoint ──────────────────────── */

async function loadHealthScore() {
  try {
    const res  = await fetch(`${API}/score`);
    const data = await res.json();

    if (data.error) {
      console.warn('Score API:', data.error);
      return;
    }

    renderHealthScore(data);

  } catch (err) {
    console.warn('Backend not reachable for score:', err);
  }
}



/* ── Render forecast using ML baseline ── */

function renderForecastFromML(horizon) {
  if (!ACTUAL.income.length || !ML_BASELINE.income.length) return;

  // Slider adjustments on top of ML baseline
  const incomeGrowth  = 1 + getSlider('slider-income-growth',  FC_CONFIG.sim.incomeGrowth)  / 100;
  const expenseChange = 1 + getSlider('slider-expense-change', FC_CONFIG.sim.expenseChange) / 100;
  const investment    =     getSlider('slider-investment',     FC_CONFIG.sim.investment);
  const recurring     =     getSlider('slider-recurring',      FC_CONFIG.sim.recurring);

  // Apply slider multipliers on top of ML predictions
  const projIncome  = ML_BASELINE.income.slice(0, horizon).map(
    (v, i) => Math.round(v * Math.pow(incomeGrowth, i + 1))
  );
  const projExpense = ML_BASELINE.expense.slice(0, horizon).map(
    (v, i) => Math.round(v * Math.pow(expenseChange, i + 1) + recurring + (i === 0 ? investment : 0))
  );

  const actualMonths = FC_CONFIG.months.slice(0, ACTUAL.income.length);
  const projMonths   = FC_CONFIG.months.slice(ACTUAL.income.length, ACTUAL.income.length + horizon);

  updateFcCards(projIncome, projExpense, horizon);
  renderForecastChart(actualMonths, projMonths, projIncome, projExpense, horizon);
  updateSimResult(projIncome, projExpense);
}


/* ── Horizon Toggle ───────────────────────────────────────── */

function setHorizon(months, btn) {
  currentHorizon = months;
  document.querySelectorAll('.topbar-right .filter-btn').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  // Re-fetch ML predictions for new horizon
  loadForecastData();
}


/* ── Simulator slider update ──────────────────────────────── */

function updateSim() {
  const ig = getSlider('slider-income-growth',  0);
  const ec = getSlider('slider-expense-change', 0);
  const iv = getSlider('slider-investment',     0);
  const rc = getSlider('slider-recurring',      0);

  setText('val-income-growth',  (ig >= 0 ? '+' : '') + ig + '%');
  setText('val-expense-change', (ec >= 0 ? '+' : '') + ec + '%');
  setText('val-investment',     fmtCurrency(iv));
  setText('val-recurring',      fmtCurrency(rc) + '/mo');

  // Re-render with updated sliders on top of ML baseline
  renderForecastFromML(currentHorizon);
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

  const label = `Next ${horizon} month${horizon > 1 ? 's' : ''} · ML forecast`;
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
        { label:'ML Projected Income',   data:incomeProj, borderColor:FC_CONFIG.chart.incomeColor,  borderWidth:2,   pointRadius:4, pointHoverRadius:6, pointBackgroundColor:'#fff', pointBorderColor:FC_CONFIG.chart.incomeColor,  borderDash:[6,4], fill:false, tension:0.4 },
        { label:'Actual Expenses',    data:expenseActual, borderColor:FC_CONFIG.chart.expenseColor, borderWidth:2.5, pointRadius:4, pointHoverRadius:6, pointBackgroundColor:FC_CONFIG.chart.expenseColor, fill:false, tension:0.4 },
        { label:'ML Projected Expenses', data:expenseProj, borderColor:FC_CONFIG.chart.expenseColor, borderWidth:2,  pointRadius:4, pointHoverRadius:6, pointBackgroundColor:'#fff', pointBorderColor:FC_CONFIG.chart.expenseColor, borderDash:[6,4], fill:false, tension:0.4 },
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

  setText('chart-subtitle', `ML-powered forecast · Next ${horizon} months`);
}


/* ── Simulator Result ─────────────────────────────────────── */

function updateSimResult(projIncome, projExpense) {
  if (!ACTUAL.income.length) return;

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
    else if (impact > 0)   msg = '✅ ML baseline improved by simulator. Good time to act.';
    else                   msg = '📈 Stable scenario. Adjust sliders to explore what-if strategies.';
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


/* ── Render Health Score from /score API ──────────────────── */

function renderHealthScore(data) {
  const total       = data.score || 0;
  const breakdown   = data.breakdown || {};
  const cashflow    = breakdown.cashflow_stability || 0;
  const margin      = breakdown.profit_margin      || 0;
  const growth      = breakdown.revenue_growth     || 0;
  const expense     = breakdown.expense_control    || 0;

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
      if      (total >= 80) { label = '🏆 ' + data.label; cls = 'excellent'; }
      else if (total >= 60) { label = '✅ ' + data.label; cls = 'good';      }
      else if (total >= 40) { label = '⚠️ ' + data.label; cls = 'fair';      }
      else                  { label = '❌ ' + data.label; cls = 'poor';      }
      badge.textContent = label;
      badge.className   = 'score-badge ' + cls;
    }, 800);

    animBar('ind-cashflow', 'fill-cashflow', cashflow, 25);
    animBar('ind-margin',   'fill-margin',   margin,   25);
    animBar('ind-growth',   'fill-growth',   growth,   25);
    animBar('ind-expense',  'fill-expense',  expense,  25);

    renderRecs(total, cashflow, margin, growth, expense);

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