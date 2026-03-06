/* ============================================================
   SMETrack – transactions.js
   Depends on: main.js (load first)

   HOW TO USE:
   Fill the allTransactions array below with your own data.
   Everything else — filters, pagination, CRUD — is automatic.
============================================================ */

/* ── Config ───────────────────────────────────────────────── */

const TXN_CONFIG = {
  locale:   'en-IN',
  currency: '₹',
  pageSize: 8,
  toastDelay: 600,
  defaultType:     'income',
  defaultCategory: 'Sales',
  defaultStatus:   'completed',
  colors: { positive: '#16A34A', negative: '#DC2626' }
};


/* ══════════════════════════════════════════════════════════
   DATA  –  Fill this array with your SME's transactions.
   Each object needs these exact fields:
   {
     date:        'YYYY-MM-DD',
     description: 'Short label',
     type:        'income' or 'expense',
     category:    'Sales' / 'Payroll' / 'Rent' / etc.,
     amount:      number  (no ₹ sign, just the number),
     status:      'completed' / 'pending' / 'failed'
   }
══════════════════════════════════════════════════════════ */

let allTransactions = [];


/* ── State ────────────────────────────────────────────────── */

let txnFiltered     = [];
let txnCurrentFilter = 'all';
let txnCurrentPage   = 1;
let deleteTarget     = null;


/* ── Init ─────────────────────────────────────────────────── */

document.addEventListener('DOMContentLoaded', () => {
  txnFiltered = [...allTransactions];
  setValue('m-date', today());
  applyFilters();
});


/* ── Filters ──────────────────────────────────────────────── */

function setFilter(val, btn) {
  txnCurrentFilter = val;
  txnCurrentPage   = 1;
  document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  applyFilters();
}

function applyFilters() {
  const search   = (getValue('search-input') || '').toLowerCase();
  const category =  getValue('category-filter') || '';
  const status   = (getValue('status-filter')   || '').toLowerCase();

  txnFiltered = allTransactions.filter(t => {
    const matchType     = txnCurrentFilter === 'all' || t.type === txnCurrentFilter;
    const matchSearch   = !search   || t.description.toLowerCase().includes(search) || t.category.toLowerCase().includes(search);
    const matchCategory = !category || t.category === category;
    const matchStatus   = !status   || t.status === status;
    return matchType && matchSearch && matchCategory && matchStatus;
  });

  txnCurrentPage = 1;
  renderTable();
  updateSummary();
}


/* ── Table ────────────────────────────────────────────────── */

function renderTable() {
  const tbody = document.getElementById('txn-body');
  const empty = document.getElementById('empty-state');
  const pagEl = document.getElementById('pagination');
  if (!tbody) return;

  const totalPages = Math.ceil(txnFiltered.length / TXN_CONFIG.pageSize);
  const start      = (txnCurrentPage - 1) * TXN_CONFIG.pageSize;
  const pageData   = txnFiltered.slice(start, start + TXN_CONFIG.pageSize);

  if (!txnFiltered.length) {
    tbody.innerHTML       = '';
    empty.style.display   = 'block';
    pagEl.innerHTML       = '';
    return;
  }

  empty.style.display = 'none';
  tbody.innerHTML = pageData.map(t => buildRow(t)).join('');
  renderPagination(totalPages);
}

function buildRow(t) {
  const index  = allTransactions.indexOf(t);
  const sign   = t.type === 'income' ? '+' : '-';
  const amount = TXN_CONFIG.currency + t.amount.toLocaleString(TXN_CONFIG.locale);
  const date   = new Date(t.date).toLocaleDateString(TXN_CONFIG.locale, {
    day: 'numeric', month: 'short', year: 'numeric'
  });

  return `
    <tr>
      <td style="color:var(--text-muted);font-size:12.5px;white-space:nowrap;">${date}</td>
      <td><div style="font-weight:600;">${t.description}</div></td>
      <td><span class="type-badge ${t.type}">${cap(t.type)}</span></td>
      <td style="color:var(--text-muted);">${t.category}</td>
      <td><span class="txn-amount ${t.type}">${sign}${amount}</span></td>
      <td><span class="status-badge ${t.status}">${cap(t.status)}</span></td>
      <td>
        <div class="action-btns">
          <button class="btn-icon edit" onclick="openEdit(${index})" title="Edit">
            <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round"
                d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/>
            </svg>
          </button>
          <button class="btn-icon delete" onclick="openDelete(${index})" title="Delete">
            <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round"
                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
            </svg>
          </button>
        </div>
      </td>
    </tr>`;
}


/* ── Pagination ───────────────────────────────────────────── */

function renderPagination(totalPages) {
  const el = document.getElementById('pagination');
  if (!el || totalPages <= 1) { if (el) el.innerHTML = ''; return; }

  let html = `<button class="page-btn" onclick="goPage(${txnCurrentPage - 1})" ${txnCurrentPage === 1 ? 'disabled' : ''}>&#8249;</button>`;
  for (let p = 1; p <= totalPages; p++) {
    html += `<button class="page-btn ${p === txnCurrentPage ? 'active' : ''}" onclick="goPage(${p})">${p}</button>`;
  }
  html += `<button class="page-btn" onclick="goPage(${txnCurrentPage + 1})" ${txnCurrentPage === totalPages ? 'disabled' : ''}>&#8250;</button>`;
  el.innerHTML = html;
}

function goPage(p) {
  const totalPages = Math.ceil(txnFiltered.length / TXN_CONFIG.pageSize);
  if (p < 1 || p > totalPages) return;
  txnCurrentPage = p;
  renderTable();
}


/* ── Summary Cards ────────────────────────────────────────── */

function updateSummary() {
  const income  = allTransactions.filter(t => t.type === 'income');
  const expense = allTransactions.filter(t => t.type === 'expense');
  const pending = allTransactions.filter(t => t.status === 'pending');

  const totalIncome  = sumAmount(income);
  const totalExpense = sumAmount(expense);
  const totalPending = sumAmount(pending);
  const net          = totalIncome - totalExpense;

  setText('summary-income',        fmtCurrency(totalIncome));
  setText('summary-expense',       fmtCurrency(totalExpense));
  setText('summary-net',           (net >= 0 ? '+' : '') + fmtCurrency(Math.abs(net)));
  setText('summary-pending',       fmtCurrency(totalPending));
  setText('summary-income-count',  income.length  + ' transactions');
  setText('summary-expense-count', expense.length + ' transactions');
  setText('summary-total-count',   allTransactions.length + ' total records');
  setText('summary-pending-count', pending.length + ' pending');

  const netEl = document.getElementById('summary-net');
  if (netEl) netEl.style.color = net >= 0 ? TXN_CONFIG.colors.positive : TXN_CONFIG.colors.negative;
}


/* ── Modal: Open Add ──────────────────────────────────────── */

function openModal() {
  setText('modal-title', 'Add Transaction');
  setValue('edit-index', '');
  setValue('m-desc',     '');
  setValue('m-date',     today());
  setValue('m-amount',   '');
  setValue('m-type',     TXN_CONFIG.defaultType);
  setValue('m-category', TXN_CONFIG.defaultCategory);
  setValue('m-status',   TXN_CONFIG.defaultStatus);
  clearModalErrors();
  openOverlay('modal-overlay');
}


/* ── Modal: Open Edit ─────────────────────────────────────── */

function openEdit(index) {
  const t = allTransactions[index];
  setText('modal-title', 'Edit Transaction');
  setValue('edit-index', index);
  setValue('m-desc',     t.description);
  setValue('m-date',     t.date);
  setValue('m-amount',   t.amount);
  setValue('m-type',     t.type);
  setValue('m-category', t.category);
  setValue('m-status',   t.status);
  clearModalErrors();
  openOverlay('modal-overlay');
}


/* ── Modal: Close ─────────────────────────────────────────── */

function closeModal()         { closeOverlay('modal-overlay'); }
function closeDelete()        { closeOverlay('del-overlay');   }
function closeModalOutside(e) { if (e.target === document.getElementById('modal-overlay')) closeModal();  }
function closeDeleteOutside(e){ if (e.target === document.getElementById('del-overlay'))   closeDelete(); }


/* ── Save Transaction ─────────────────────────────────────── */

function saveTransaction() {
  clearModalErrors();

  const desc     = (getValue('m-desc') || '').trim();
  const date     =  getValue('m-date')  || '';
  const amount   = parseFloat(getValue('m-amount') || 0);
  const type     =  getValue('m-type');
  const category =  getValue('m-category');
  const status   =  getValue('m-status');
  const editIdx  =  getValue('edit-index');

  let valid = true;
  if (!desc)       { showFieldError('err-desc',   true); valid = false; }
  if (!date)       { showFieldError('err-date',   true); valid = false; }
  if (amount <= 0) { showFieldError('err-amount', true); valid = false; }
  if (!valid) return;

  const record = { date, description: desc, type, category, amount, status };

  setLoading('btn-save', true);

  setTimeout(() => {
    setLoading('btn-save', false);
    if (editIdx !== '') {
      allTransactions[parseInt(editIdx)] = record;
      showToast('✓ Transaction updated', 'success');
    } else {
      allTransactions.unshift(record);
      showToast('✓ Transaction added', 'success');
    }
    closeModal();
    applyFilters();
  }, TXN_CONFIG.toastDelay);
}


/* ── Delete ───────────────────────────────────────────────── */

function openDelete(index) {
  deleteTarget = index;
  openOverlay('del-overlay');
}

function confirmDelete() {
  if (deleteTarget === null) return;
  allTransactions.splice(deleteTarget, 1);
  deleteTarget = null;
  closeDelete();
  applyFilters();
  showToast('Transaction deleted', 'error');
}


/* ── Field Error Helpers ──────────────────────────────────── */

function showFieldError(id, show) {
  const el = document.getElementById(id);
  if (!el) return;
  el.style.display = show ? 'block' : 'none';
  const field = el.closest('.field');
  if (field) field.classList.toggle('has-error', show);
}

function clearModalErrors() {
  ['err-desc', 'err-date', 'err-amount'].forEach(id => showFieldError(id, false));
}


/* ── Utilities ────────────────────────────────────────────── */

function cap(s)           { return s.charAt(0).toUpperCase() + s.slice(1); }
function sumAmount(arr)   { return arr.reduce((s, t) => s + t.amount, 0); }
function fmtCurrency(val) { return TXN_CONFIG.currency + val.toLocaleString(TXN_CONFIG.locale); }
function today()          { return new Date().toISOString().split('T')[0]; }
function setText(id, val) { const el = document.getElementById(id); if (el) el.textContent = val; }
function getValue(id)     { return document.getElementById(id)?.value || ''; }
function setValue(id, val){ const el = document.getElementById(id); if (el) el.value = val; }
function openOverlay(id)  { document.getElementById(id)?.classList.add('open'); }
function closeOverlay(id) { document.getElementById(id)?.classList.remove('open'); }