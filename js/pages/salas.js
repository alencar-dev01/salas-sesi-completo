// js/pages/salas.js - Gestão de Salas (Admin)
let salasState = {
  page: 1,
  paginas: 1,
  ordem: 'nome',
  direcao: 'ASC',
  dados: []
};

async function renderSalas(container) {
  salasState.page = 1;

  container.innerHTML = `
    <div class="section-header">
      <h2 class="section-title">Salas de Informática</h2>
      <div style="display:flex;gap:8px;">
        <button class="btn btn-outline btn-sm" onclick="salasExportar()">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3"/></svg>
          Exportar CSV
        </button>
        <button class="btn btn-primary btn-sm" onclick="salaAbrirModal()">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 5v14M5 12h14"/></svg>
          Nova Sala
        </button>
      </div>
    </div>

    <div class="search-bar">
      <div class="search-input-wrap">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/></svg>
        <input type="text" id="sala-busca" placeholder="Buscar por nome ou localização..." oninput="salasDebounce()">
      </div>
      <select class="form-control" id="sala-status-filtro" style="width:auto;" onchange="salasCarregar()">
        <option value="">Todos os status</option>
        <option value="ativa">Ativas</option>
        <option value="inativa">Inativas</option>
      </select>
    </div>

    <div class="card">
      <div class="table-wrapper">
        <table>
          <thead>
            <tr>
              <th onclick="salasOrdenar('nome')" id="th-nome">Nome ↕</th>
              <th onclick="salasOrdenar('capacidade')" id="th-cap">Capacidade ↕</th>
              <th onclick="salasOrdenar('localizacao')" id="th-loc">Localização ↕</th>
              <th>Descrição</th>
              <th onclick="salasOrdenar('status')" id="th-status">Status ↕</th>
              <th>Ações</th>
            </tr>
          </thead>
          <tbody id="salas-tbody">
            ${skeletonTable(5, 6)}
          </tbody>
        </table>
      </div>
      <div id="salas-pagination" style="padding:0 16px;"></div>
    </div>
  `;

  salasCarregar();
}

let salasTimer;
function salasDebounce() {
  clearTimeout(salasTimer);
  salasTimer = setTimeout(salasCarregar, 400);
}

function salasOrdenar(campo) {
  if (salasState.ordem === campo) {
    salasState.direcao = salasState.direcao === 'ASC' ? 'DESC' : 'ASC';
  } else {
    salasState.ordem = campo;
    salasState.direcao = 'ASC';
  }
  // Atualiza ícones dos th
  ['nome','cap','loc','status'].forEach(k => {
    const el = document.getElementById(`th-${k}`);
    if (el) el.classList.remove('sorted');
  });
  const campoMap = { nome:'nome', capacidade:'cap', localizacao:'loc', status:'status' };
  const thEl = document.getElementById(`th-${campoMap[campo]}`);
  if (thEl) thEl.classList.add('sorted');
  salasCarregar();
}

async function salasCarregar(page) {
  if (page) salasState.page = page;
  const busca = document.getElementById('sala-busca')?.value;
  const status = document.getElementById('sala-status-filtro')?.value;

  const params = {
    page: salasState.page, limit: 10,
    ordem: salasState.ordem, direcao: salasState.direcao
  };
  if (busca) params.busca = busca;
  if (status) params.status = status;

  const tbody = document.getElementById('salas-tbody');
  if (tbody) tbody.innerHTML = skeletonTable(5, 6);

  try {
    const data = await api.getSalas(params);
    salasState.dados = data.dados;
    salasState.paginas = data.paginas;

    if (!tbody) return;

    if (!data.dados.length) {
      tbody.innerHTML = `<tr><td colspan="6">
        <div class="empty-state">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"/></svg>
          <p>Nenhuma sala encontrada.</p>
        </div>
      </td></tr>`;
      return;
    }

    tbody.innerHTML = data.dados.map(s => `
      <tr>
        <td>
          <div style="font-weight:700;color:var(--texto);">${s.nome}</div>
        </td>
        <td>
          <div style="display:flex;align-items:center;gap:6px;">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--azul-principal)" stroke-width="2"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75"/></svg>
            <span style="font-weight:600;">${s.capacidade}</span>
            <span style="font-size:11px;color:var(--texto-leve);">pessoas</span>
          </div>
        </td>
        <td>
          ${s.localizacao
            ? `<div style="display:flex;align-items:center;gap:5px;"><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="var(--texto-leve)" stroke-width="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/></svg><span style="font-size:13px;">${s.localizacao}</span></div>`
            : '<span style="color:var(--texto-leve);">—</span>'}
        </td>
        <td>
          <span style="font-size:12px;color:var(--texto-leve);max-width:200px;display:block;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">
            ${s.descricao || '—'}
          </span>
        </td>
        <td>${statusBadge(s.status)}</td>
        <td>
          <div class="table-actions">
            <button class="btn btn-outline btn-sm" title="Editar" onclick="salaAbrirModal(${s.id})">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
              Editar
            </button>
            <button class="btn btn-sm ${s.status === 'ativa' ? 'btn-warning' : 'btn-success'}" title="${s.status === 'ativa' ? 'Inativar' : 'Ativar'}" onclick="salaToggleStatus(${s.id}, '${s.status}')">
              ${s.status === 'ativa'
                ? `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="4.93" y1="4.93" x2="19.07" y2="19.07"/></svg> Inativar`
                : `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/></svg> Ativar`}
            </button>
            <button class="btn btn-danger btn-sm btn-icon" title="Excluir" onclick="salaExcluir(${s.id}, '${s.nome}')">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4a1 1 0 011-1h4a1 1 0 011 1v2"/></svg>
            </button>
          </div>
        </td>
      </tr>
    `).join('');

    const pag = document.getElementById('salas-pagination');
    if (pag) renderPagination(pag, salasState.page, salasState.paginas, salasCarregar);

  } catch (err) {
    if (tbody) tbody.innerHTML = `<tr><td colspan="6" style="color:var(--erro);padding:20px;">${err.erro || 'Erro ao carregar salas.'}</td></tr>`;
  }
}

async function salaAbrirModal(id = null) {
  let sala = null;
  if (id) {
    try { sala = await api.getSala(id); } catch(e) { showToast('Erro', 'Não foi possível carregar a sala.', 'error'); return; }
  }

  createModal({
    id: 'modal-sala',
    title: sala ? `Editar Sala — ${sala.nome}` : 'Nova Sala',
    body: `
      <div class="form-group">
        <label class="form-label">Nome da Sala *</label>
        <input id="s-nome" class="form-control" placeholder="Ex: Lab de Informática 01" value="${sala?.nome || ''}">
      </div>
      <div class="form-row form-row-2">
        <div class="form-group">
          <label class="form-label">Capacidade (pessoas) *</label>
          <input id="s-cap" type="number" min="1" class="form-control" placeholder="Ex: 30" value="${sala?.capacidade || ''}">
        </div>
        <div class="form-group">
          <label class="form-label">Status</label>
          <select id="s-status" class="form-control">
            <option value="ativa" ${!sala || sala.status === 'ativa' ? 'selected' : ''}>Ativa</option>
            <option value="inativa" ${sala?.status === 'inativa' ? 'selected' : ''}>Inativa</option>
          </select>
        </div>
      </div>
      <div class="form-group">
        <label class="form-label">Localização</label>
        <input id="s-loc" class="form-control" placeholder="Ex: Bloco A – 1º Andar" value="${sala?.localizacao || ''}">
      </div>
      <div class="form-group">
        <label class="form-label">Descrição</label>
        <textarea id="s-desc" class="form-control" rows="3" placeholder="Equipamentos, recursos disponíveis...">${sala?.descricao || ''}</textarea>
      </div>
      <div id="s-err" class="hidden" style="color:var(--erro);font-size:13px;padding:10px 14px;background:rgba(220,53,69,.08);border-radius:8px;"></div>
    `,
    footer: `
      <button class="btn btn-outline" onclick="closeModal('modal-sala')">Cancelar</button>
      <button class="btn btn-primary" id="s-save-btn" onclick="salaSalvar(${id || 'null'})">
        ${sala ? 'Salvar alterações' : 'Criar Sala'}
      </button>
    `
  });
  openModal('modal-sala');
}

async function salaSalvar(id) {
  const btn = document.getElementById('s-save-btn');
  const err = document.getElementById('s-err');
  err.classList.add('hidden');

  const dados = {
    nome: document.getElementById('s-nome')?.value?.trim(),
    capacidade: parseInt(document.getElementById('s-cap')?.value),
    localizacao: document.getElementById('s-loc')?.value?.trim(),
    descricao: document.getElementById('s-desc')?.value?.trim(),
    status: document.getElementById('s-status')?.value,
  };

  if (!dados.nome || !dados.capacidade) {
    err.textContent = 'Nome e capacidade são obrigatórios.';
    err.classList.remove('hidden');
    return;
  }

  btn.disabled = true;
  btn.textContent = 'Salvando...';

  try {
    if (id) {
      await api.atualizarSala(id, dados);
      showToast('Sala atualizada!', dados.nome, 'success');
    } else {
      await api.criarSala(dados);
      showToast('Sala criada!', dados.nome, 'success');
    }
    closeModal('modal-sala');
    salasCarregar();
  } catch (e) {
    err.textContent = e.erro || 'Erro ao salvar sala.';
    err.classList.remove('hidden');
  } finally {
    btn.disabled = false;
    btn.textContent = id ? 'Salvar alterações' : 'Criar Sala';
  }
}

async function salaToggleStatus(id, statusAtual) {
  const novoStatus = statusAtual === 'ativa' ? 'inativa' : 'ativa';
  const label = novoStatus === 'ativa' ? 'ativar' : 'inativar';
  if (!confirm(`Deseja ${label} esta sala?`)) return;
  try {
    await api.atualizarSala(id, { status: novoStatus });
    showToast(`Sala ${novoStatus === 'ativa' ? 'ativada' : 'inativada'}!`, '', novoStatus === 'ativa' ? 'success' : 'warning');
    salasCarregar();
  } catch (e) {
    showToast('Erro', e.erro || 'Não foi possível alterar o status.', 'error');
  }
}

async function salaExcluir(id, nome) {
  if (!confirm(`Excluir a sala "${nome}"?\n\nEsta ação não pode ser desfeita.`)) return;
  try {
    await api.excluirSala(id);
    showToast('Sala excluída.', nome, 'success');
    salasCarregar();
  } catch (e) {
    showToast('Não foi possível excluir', e.erro || 'Erro ao excluir sala.', 'error');
  }
}

async function salasExportar() {
  try {
    const data = await api.getSalas({ limit: 1000 });
    exportCSV(data.dados, 'salas');
  } catch (e) {
    showToast('Erro', 'Não foi possível exportar.', 'error');
  }
}