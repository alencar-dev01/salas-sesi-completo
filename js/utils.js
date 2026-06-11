// js/utils.js - Utilitários globais

// ===== TOAST =====
function showToast(title, msg = '', type = 'success') {
  const icons = { success: '✅', error: '❌', warning: '⚠️', info: 'ℹ️' };
  const container = document.getElementById('toast-container');
  const el = document.createElement('div');
  el.className = `toast ${type}`;
  el.innerHTML = `
    <span class="toast-icon">${icons[type] || 'ℹ️'}</span>
    <div class="toast-content">
      <div class="toast-title">${title}</div>
      ${msg ? `<div class="toast-msg">${msg}</div>` : ''}
    </div>
    <button class="toast-close" onclick="this.parentElement.remove()">✕</button>
  `;
  container.appendChild(el);
  setTimeout(() => el.remove(), 4000);
}

// ===== DARK MODE =====
function toggleDark() {
  const html = document.documentElement;
  const isDark = html.getAttribute('data-theme') === 'dark';
  html.setAttribute('data-theme', isDark ? 'light' : 'dark');
  localStorage.setItem('theme', isDark ? 'light' : 'dark');
  updateDarkBtn(!isDark);
}

function updateDarkBtn(isDark) {
  const btn = document.getElementById('dark-btn');
  if (!btn) return;
  btn.innerHTML = isDark
    ? `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>`
    : `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z"/></svg>`;
}

// ===== MODAL =====
function openModal(id) {
  document.getElementById(id)?.classList.remove('hidden');
}

function closeModal(id) {
  document.getElementById(id)?.classList.add('hidden');
}

function createModal({ id, title, body, footer, size = '' }) {
  const existing = document.getElementById(id);
  if (existing) existing.remove();

  const el = document.createElement('div');
  el.id = id;
  el.className = 'modal-overlay hidden';
  el.innerHTML = `
    <div class="modal ${size}">
      <div class="modal-header">
        <span class="modal-title">${title}</span>
        <button class="btn-close" onclick="closeModal('${id}')">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
        </button>
      </div>
      <div class="modal-body">${body}</div>
      ${footer ? `<div class="modal-footer">${footer}</div>` : ''}
    </div>
  `;
  el.addEventListener('click', e => { if (e.target === el) closeModal(id); });
  document.body.appendChild(el);
  return el;
}

// ===== PAGINATION =====
function renderPagination(container, current, total, onPage) {
  if (total <= 1) { container.innerHTML = ''; return; }
  let html = '';
  const prev = current > 1 ? current - 1 : 1;
  const next = current < total ? current + 1 : total;
  html += `<button class="page-btn" onclick="(${onPage})(${prev})" ${current === 1 ? 'disabled' : ''}>‹</button>`;
  for (let i = 1; i <= total; i++) {
    if (i === 1 || i === total || Math.abs(i - current) <= 1) {
      html += `<button class="page-btn ${i === current ? 'active' : ''}" onclick="(${onPage})(${i})">${i}</button>`;
    } else if (Math.abs(i - current) === 2) {
      html += `<span class="page-info">…</span>`;
    }
  }
  html += `<button class="page-btn" onclick="(${onPage})(${next})" ${current === total ? 'disabled' : ''}>›</button>`;
  container.innerHTML = html;
}

// ===== SKELETON =====
function skeletonTable(rows = 5, cols = 4) {
  let trs = '';
  for (let r = 0; r < rows; r++) {
    let tds = '';
    for (let c = 0; c < cols; c++) {
      const w = [80, 60, 55, 40][c] || 70;
      tds += `<td><div class="skeleton skeleton-text" style="width:${w}%"></div></td>`;
    }
    trs += `<tr>${tds}</tr>`;
  }
  return trs;
}

function skeletonStats() {
  return Array(4).fill('<div class="skeleton skeleton-stat"></div>').join('');
}

// ===== DATE HELPERS =====
function formatDate(str) {
  if (!str) return '—';
  const [y, m, d] = str.split('-');
  return `${d}/${m}/${y}`;
}

function formatDateTime(str) {
  if (!str) return '—';
  const d = new Date(str);
  return d.toLocaleDateString('pt-BR') + ' ' + d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
}

function todayISO() {
  return new Date().toISOString().split('T')[0];
}

function monthName(m) {
  return ['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'][m];
}

function weekDayShort(d) {
  return ['Dom','Seg','Ter','Qua','Qui','Sex','Sáb'][d];
}

// ===== BADGE HELPERS =====
function statusBadge(s) {
  const map = {
    confirmada: 'badge-green',
    pendente: 'badge-orange',
    cancelada: 'badge-red',
    finalizada: 'badge-gray',
    ativa: 'badge-green',
    inativa: 'badge-gray',
    administrador: 'badge-blue',
    colaborador: 'badge-green'
  };
  const labels = { confirmada:'Confirmada', pendente:'Pendente', cancelada:'Cancelada', finalizada:'Finalizada', ativa:'Ativa', inativa:'Inativa', administrador:'Administrador', colaborador:'Colaborador' };
  return `<span class="badge ${map[s] || 'badge-gray'}">${labels[s] || s}</span>`;
}

// ===== EXPORT CSV =====
function exportCSV(dados, nome) {
  if (!dados || !dados.length) { showToast('Nenhum dado para exportar', '', 'warning'); return; }
  const keys = Object.keys(dados[0]).filter(k => !['senha'].includes(k));
  const header = keys.join(';');
  const rows = dados.map(r => keys.map(k => {
    const v = r[k];
    if (v === null || v === undefined) return '';
    const str = String(v).replace(/;/g, ',').replace(/\n/g, ' ');
    return str.includes(';') ? `"${str}"` : str;
  }).join(';'));
  const csv = '\uFEFF' + [header, ...rows].join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = `${nome}-${todayISO()}.csv`;
  a.click();
  URL.revokeObjectURL(url);
  showToast('Exportação concluída', `${dados.length} registros exportados.`, 'success');
}

// ===== SIDEBAR MOBILE =====
function toggleSidebar() {
  document.getElementById('sidebar').classList.toggle('open');
}

// ===== INIT THEME =====
(function() {
  const t = localStorage.getItem('theme') || 'light';
  document.documentElement.setAttribute('data-theme', t);
  // Update button after DOM ready
  window.addEventListener('DOMContentLoaded', () => updateDarkBtn(t === 'dark'));
})();