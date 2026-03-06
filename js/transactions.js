/* ============================================================
   SMETrack – Transactions JavaScript
   Depends on: js/main.js + js/dashboard.js (loaded first)
   ============================================================ */

// ── State ──────────────────────────────────────────────────
let allTransactions = [
  { date:'2024-08-15', description:'Client Payment – Nexus Corp',    type:'income',  category:'Sales',      amount:84000, status:'completed' },
  { date:'2024-08-14', description:'AWS Cloud Infrastructure',        type:'expense', category:'Operations', amount:12400, status:'completed' },
  { date:'2024-08-13', description:'Freelance Design Project',        type:'income',  category:'Services',   amount:36500, status:'completed' },
  { date:'2024-08-12', description:'Office Rent – August',            type:'expense', category:'Rent',       amount:18000, status:'completed' },
  { date:'2024-08-11', description:'Google Ads Campaign',             type:'expense', category:'Marketing',  amount: 9800, status:'pending'   },
  { date:'2024-08-10', description:'Software License Renewal',        type:'expense', category:'Operations', amount: 6200, status:'failed'    },
  { date:'2024-08-09', description:'Product Sales – Batch #12',       type:'income',  category:'Sales',      amount:52000, status:'completed' },
  { date:'2024-08-08', description:'Staff Payroll – August',          type:'expense', category:'Payroll',    amount:48000, status:'completed' },
  { date:'2024-08-07', description:'Consulting Fee – StartupXYZ',     type:'income',  category:'Services',   amount:28000, status:'completed' },
  { date:'2024-08-06', description:'Electricity & Internet Bill',     type:'expense', category:'Utilities',  amount: 4200, status:'completed' },
  { date:'2024-08-05', description:'Export Order – Global Traders',   type:'income',  category:'Sales',      amount:96000, status:'pending'   },
  { date:'2024-08-04', description:'Office Supplies & Stationery',    type:'expense', category:'Misc',       amount: 2800, status:'completed' },
];

let filtered      = [...allTransactions];
let currentFilter = 'all';
let currentPage   = 1;
const PAGE_SIZE   = 8;
let deleteTarget  = null;

// ── Init ───────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  // Set today as default date in modal
  document.getElementById('m-date').value = new Date().toISOString().split('T')[0];
  applyFilters();
});

// ── Filter & Search ────────────────────────────────────────
function setFilter(val, btn) {
  currentFilter = val;
  currentPage   = 1;
  document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  applyFilters();
}

function applyFilters() {
  const search   = (document.getElementById('search-input')?.value || '').toLowerCase();
  const category = document.getElementById('category-filter')?.value || '';
  const status   = document.getElementById('status-filter')?.value.toLowerCase() || '';

  filtered = allTransactions.filter(t => {
    const matchType     = currentFilter === 'all' || t.type === currentFilter;
    const matchSearch   = !search || t.description.toLowerCase().includes(search) || t.category.toLowerCase().includes(search);
    const matchCategory = !category || t.category === category;
    const matchStatus   = !status   || t.status === status;
    return matchType && matchSearch && matchCategory && matchStatus;
  });

  currentPage = 1;
  renderTable();
  updateSummary();
}

// ── Render Table ───────────────────────────────────────────
function renderTable() {
  const tbody    = document.getElementById('txn-body');
  const empty    = document.getElementById('empty-state');
  const pagEl    = document.getElementById('pagination');

  if (!tbody) return;

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const start      = (currentPage - 1) * PAGE_SIZE;
  const pageData   = filtered.slice(start, start + PAGE_SIZE);

  if (filtered.length === 0) {
    tbody.innerHTML = '';
    empty.style.display = 'block';
    pagEl.innerHTML = '';
    return;
  }
  empty.style.display = 'none';

  tbody.innerHTML = pageData.map((t, i) => {
    const realIndex = allTransactions.indexOf(t);
    const sign   = t.type === 'income' ? '+' : '-';
    const amount = '₹' + t.amount.toLocaleString('en-IN');
    const date   = new Date(t.date).toLocaleDateString('en-IN', { day:'numeric', month:'short', year:'numeric' });

    return `
      <tr>
        <td style="color:var(--text-muted); font-size:12.5px; white-space:nowrap;">${date}</td>
        <td><div style="font-weight:600; font-size:13.5px; max-width:220px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;">${t.description}</div></td>
        <td><span class="type-badge ${t.type}">${capitalize(t.type)}</span></td>
        <td style="color:var(--text-muted);">${t.category}</td>
        <td><span class="txn-amount ${t.type}">${sign}${amount}</span></td>
        <td><span class="status-badge ${t.status}">${capitalize(t.status)}</span></td>
        <td>
          <div class="action-btns">
            <button class="btn-icon edit" onclick="openEdit(${realIndex})" title="Edit">
              <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/></svg>
            </button>
            <button class="btn-icon delete" onclick="openDelete(${realIndex})" title="Delete">
              <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
            </button>
          </div>
        </td>
      </tr>`;
  }).join('');

  renderPagination(totalPages);
}

// ── Pagination ─────────────────────────────────────────────
function renderPagination(totalPages) {
  const el = document.getElementById('pagination');
  if (!el || totalPages <= 1) { if(el) el.innerHTML=''; return; }

  let html = `
    <button class="page-btn" onclick="goPage(${currentPage-1})" ${currentPage===1?'disabled':''}>
      <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" width="14"><path stroke-linecap="round" stroke-linejoin="round" d="M15 19l-7-7 7-7"/></svg>
    </button>`;

  for (let p = 1; p <= totalPages; p++) {
    html += `<button class="page-btn ${p===currentPage?'active':''}" onclick="goPage(${p})">${p}</button>`;
  }

  html += `
    <button class="page-btn" onclick="goPage(${currentPage+1})" ${currentPage===totalPages?'disabled':''}>
      <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" width="14"><path stroke-linecap="round" stroke-linejoin="round" d="M9 5l7 7-7 7"/></svg>
    </button>`;

  el.innerHTML = html;
}

function goPage(p) {
  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  if (p < 1 || p > totalPages) return;
  currentPage = p;
  renderTable();
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

// ── Summary Cards ──────────────────────────────────────────
function updateSummary() {
  const income  = allTransactions.filter(t => t.type === 'income');
  const expense = allTransactions.filter(t => t.type === 'expense');
  const pending = allTransactions.filter(t => t.status === 'pending');

  const totalIncome  = income.reduce((s,t)  => s + t.amount, 0);
  const totalExpense = expense.reduce((s,t) => s + t.amount, 0);
  const totalPending = pending.reduce((s,t) => s + t.amount, 0);
  const net          = totalIncome - totalExpense;

  setText('summary-income',        '₹' + totalIncome.toLocaleString('en-IN'));
  setText('summary-expense',       '₹' + totalExpense.toLocaleString('en-IN'));
  setText('summary-net',           (net >= 0 ? '+' : '') + '₹' + Math.abs(net).toLocaleString('en-IN'));
  setText('summary-pending',       '₹' + totalPending.toLocaleString('en-IN'));
  setText('summary-income-count',  income.length + ' transactions');
  setText('summary-expense-count', expense.length + ' transactions');
  setText('summary-total-count',   allTransactions.length + ' total records');
  setText('summary-pending-count', pending.length + ' pending');

  // Color net positive/negative
  const netEl = document.getElementById('summary-net');
  if (netEl) netEl.style.color = net >= 0 ? '#16A34A' : '#DC2626';
}

function setText(id, val) {
  const el = document.getElementById(id);
  if (el) el.textContent = val;
}

// ── Modal: Add ─────────────────────────────────────────────
function openModal() {
  document.getElementById('modal-title').textContent = 'Add Transaction';
  document.getElementById('edit-index').value = '';
  document.getElementById('m-desc').value     = '';
  document.getElementById('m-date').value     = new Date().toISOString().split('T')[0];
  document.getElementById('m-amount').value   = '';
  document.getElementById('m-type').value     = 'income';
  document.getElementById('m-category').value = 'Sales';
  document.getElementById('m-status').value   = 'completed';
  clearModalErrors();
  document.getElementById('modal-overlay').classList.add('open');
}

// ── Modal: Edit ────────────────────────────────────────────
function openEdit(index) {
  const t = allTransactions[index];
  document.getElementById('modal-title').textContent = 'Edit Transaction';
  document.getElementById('edit-index').value = index;
  document.getElementById('m-desc').value     = t.description;
  document.getElementById('m-date').value     = t.date;
  document.getElementById('m-amount').value   = t.amount;
  document.getElementById('m-type').value     = t.type;
  document.getElementById('m-category').value = t.category;
  document.getElementById('m-status').value   = t.status;
  clearModalErrors();
  document.getElementById('modal-overlay').classList.add('open');
}

function closeModal() {
  document.getElementById('modal-overlay').classList.remove('open');
}
function closeModalOutside(e) {
  if (e.target === document.getElementById('modal-overlay')) closeModal();
}

// ── Save ───────────────────────────────────────────────────
function saveTransaction() {
  clearModalErrors();

  const desc    = document.getElementById('m-desc').value.trim();
  const date    = document.getElementById('m-date').value;
  const amount  = parseFloat(document.getElementById('m-amount').value);
  const type    = document.getElementById('m-type').value;
  const category= document.getElementById('m-category').value;
  const status  = document.getElementById('m-status').value;
  const editIdx = document.getElementById('edit-index').value;

  let valid = true;
  if (!desc)              { showFieldError('err-desc', true);   valid = false; }
  if (!date)              { showFieldError('err-date', true);   valid = false; }
  if (!amount || amount<=0){ showFieldError('err-amount', true); valid = false; }
  if (!valid) return;

  const record = { date, description: desc, type, category, amount, status };

  setLoading('btn-save', true);
  setTimeout(() => {
    setLoading('btn-save', false);
    if (editIdx !== '') {
      allTransactions[parseInt(editIdx)] = record;
      showToast('✓ Transaction updated successfully', 'success');
    } else {
      allTransactions.unshift(record);
      showToast('✓ Transaction added successfully', 'success');
    }
    closeModal();
    applyFilters();
  }, 600);
}

function showFieldError(id, show) {
  const el = document.getElementById(id);
  if (!el) return;
  el.style.display = show ? 'block' : 'none';
  // also highlight parent field
  const field = el.closest?.('.field');
  if (field) field.classList.toggle('has-error', show);
}
function clearModalErrors() {
  ['err-desc','err-date','err-amount'].forEach(id => showFieldError(id, false));
}

// ── Delete ─────────────────────────────────────────────────
function openDelete(index) {
  deleteTarget = index;
  document.getElementById('del-overlay').classList.add('open');
}
function closeDelete() {
  deleteTarget = null;
  document.getElementById('del-overlay').classList.remove('open');
}
function closeDeleteOutside(e) {
  if (e.target === document.getElementById('del-overlay')) closeDelete();
}
function confirmDelete() {
  if (deleteTarget === null) return;
  allTransactions.splice(deleteTarget, 1);
  deleteTarget = null;
  closeDelete();
  applyFilters();
  showToast('Transaction deleted', 'error');
}

// ── Helpers ────────────────────────────────────────────────
function capitalize(s) { return s.charAt(0).toUpperCase() + s.slice(1); }

