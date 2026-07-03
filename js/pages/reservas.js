// js/pages/reservas.js
let resState = {
  page: 1,
  total: 0,
  paginas: 1,
  filtros: {},
  allMode: false,
  ordem: 'data',
  direcao: 'DESC',
  dados: []
};

function renderReservas(container, allMode) {
  resState.allMode = allMode;
  resState.page = 1;
  resState.filtros = {};

  container.innerHTML = `
    <div class="section-header">
      <h2 class="section-title">${allMode ? 'Todas as Reservas' : 'Minhas Reservas'}</h2>
      <div style="display:flex;gap:8px;">
        <button class="btn btn-outline btn-sm" onclick="resExportar()">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3"/></svg>
          Exportar CSV
        </button>
        <button class="btn btn-primary btn-sm" onclick="navigate('nova-reserva')">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 5v14M5 12h14"/></svg>
          Nova Reserva
        </button>
      </div>
    </div>

    <div class="search-bar">
      <div class="search-input-wrap">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/></svg>
        <input type="text" id="res-busca" placeholder="Buscar por título, responsável, turma..." oninput="resDebounce()">
      </div>
      <select class="form-control" id="res-status-filtro" style="width:auto;" onchange="resCarregar()">
        <option value="">Todos os status</option>
        <option value="confirmada">Confirmada</option>
        <option value="pendente">Pendente</option>
        <option value="cancelada">Cancelada</option>
        <option value="finalizada">Finalizada</option>
      </select>
      <input type="date" class="form-control" id="res-di" style="width:auto;" onchange="resCarregar()" placeholder="De">
      <input type="date" class="form-control" id="res-df" style="width:auto;" onchange="resCarregar()" placeholder="Até">
      <select class="form-control" id="res-sala-filtro" style="width:auto;min-width:140px;" onchange="resCarregar()">
        <option value="">Todas salas</option>
      </select>
    </div>

    <div class="card">
      <div class="table-wrapper">
        <table>
          <thead>
            <tr>
              <th onclick="resOrdenar('titulo')">Título</th>
              <th onclick="resOrdenar('salaId')">Sala</th>
              <th onclick="resOrdenar('data')">Data</th>
              <th>Horário</th>
              <th onclick="resOrdenar('responsavel')">Responsável</th>
              <th onclick="resOrdenar('status')">Status</th>
              <th>Ações</th>
            </tr>
          </thead>
          <tbody id="res-tbody">
            ${skeletonTable(5, 7)}
          </tbody>
        </table>
      </div>
      <div id="res-pagination" style="padding: 16px; display: flex; gap: 8px; align-items: center; justify-content: flex-start;"></div>
    </div>
  `;

  // Carrega salas para filtro
  api.getSalas({ status: 'ativa', limit: 100 }).then(s => {
    const sel = document.getElementById('res-sala-filtro');
    if (sel) s.dados.forEach(sala => sel.innerHTML += `<option value="${sala.id}">${sala.nome}</option>`);
  }).catch(() => {});

  resCarregar();
}

let resTimer;
function resDebounce() {
  clearTimeout(resTimer);
  resTimer = setTimeout(resCarregar, 400);
}

function resOrdenar(campo) {
  if (resState.ordem === campo) {
    resState.direcao = resState.direcao === 'ASC' ? 'DESC' : 'ASC';
  } else {
    resState.ordem = campo;
    resState.direcao = 'ASC';
  }
  resCarregar();
}

async function resCarregar(page) {
  if (page) resState.page = page;
  const busca = document.getElementById('res-busca')?.value;
  const status = document.getElementById('res-status-filtro')?.value;
  const di = document.getElementById('res-di')?.value;
  const df = document.getElementById('res-df')?.value;
  const salaId = document.getElementById('res-sala-filtro')?.value;

  const params = {
    page: resState.page, limit: 10,
    ordem: resState.ordem, direcao: resState.direcao
  };
  if (busca) params.busca = busca;
  if (status) params.status = status;
  if (di) params.dataInicio = di;
  if (df) params.dataFim = df;
  if (salaId) params.salaId = salaId;

  const tbody = document.getElementById('res-tbody');
  if (tbody) tbody.innerHTML = skeletonTable(5, 7);

  try {
    const data = await api.getReservas(params);
    resState.dados = data.dados;
    resState.total = data.total;
    resState.paginas = data.paginas;

    if (!tbody) return;

    if (!data.dados.length) {
      tbody.innerHTML = `<tr><td colspan="7"><div class="empty-state"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2"/><rect x="9" y="3" width="6" height="4" rx="1"/></svg><p>Nenhuma reserva encontrada.</p></div></td></tr>`;
      return;
    }

    tbody.innerHTML = data.dados.map(r => `
      <tr>
        <td><span style="font-weight:600;">${r.titulo}</span>${r.turma ? `<br><span style="font-size:11px;color:var(--texto-leve);">Turma: ${r.turma}</span>` : ''}</td>
        <td><span style="font-size:13px;">${r.sala?.nome || '—'}</span></td>
        <td>${formatDate(r.data)}</td>
        <td style="white-space:nowrap;">${r.horaInicio} – ${r.horaFim}</td>
        <td>${r.responsavel || r.usuario?.nome || '—'}</td>
        <td>${statusBadge(r.status)}</td>
        <td>
          <div class="table-actions">
            <button class="btn btn-outline btn-sm btn-icon" title="Ver detalhes" onclick="resVer(${r.id})">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
            </button>
            
            ${(r.status === 'confirmada' || r.status === 'pendente') ? `
            <button class="btn btn-outline btn-sm btn-icon" title="Finalizar Reserva" onclick="resFinalizar(${r.id})">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 6L9 17l-5-5"/></svg>
            </button>
            ` : ''}

            ${r.status !== 'cancelada' && r.status !== 'finalizada' ? `
            <button class="btn btn-outline btn-sm btn-icon" title="Editar" onclick="resEditar(${r.id})">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
            </button>
            <button class="btn btn-danger btn-sm btn-icon" title="Cancelar" onclick="resCancelar(${r.id})">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>
            </button>` : ''}
          </div>
        </td>
      </tr>
    `).join('');

    const pag = document.getElementById('res-pagination');
    if (pag) renderPagination(pag, resState.page, resState.paginas, 'resCarregar');

  } catch (err) {
    if (tbody) tbody.innerHTML = `<tr><td colspan="7" style="color:var(--erro);padding:20px;">${err.erro || 'Erro ao carregar reservas.'}</td></tr>`;
  }
}

async function resVer(id) {
  try {
    const r = await api.getReserva(id);
    const colorMap = { confirmada:'#8DC63F', pendente:'#F36F21', cancelada:'#DC3545', finalizada:'#999' };
    createModal({
      id: 'modal-ver-res',
      title: 'Detalhes da Reserva',
      body: `
        <div style="background:${colorMap[r.status]||'#8DC63F'};color:white;border-radius:10px;padding:14px 16px;margin-bottom:16px;">
          <div style="font-size:18px;font-weight:800;">${r.titulo}</div>
          <div style="font-size:12px;opacity:.85;">${r.sala?.nome||'—'} · ${formatDate(r.data)} · ${r.horaInicio}–${r.horaFim}</div>
        </div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;font-size:13px;">
          <div><strong>Responsável:</strong><br>${r.responsavel||'—'}</div>
          <div><strong>Turma:</strong><br>${r.turma||'—'}</div>
          <div><strong>Status:</strong><br>${statusBadge(r.status)}</div>
          <div><strong>Criado por:</strong><br>${r.usuario?.nome||'—'}</div>
          ${r.descricao?`<div style="grid-column:1/-1;"><strong>Descrição:</strong><br>${r.descricao}</div>`:''}
          ${r.observacoes?`<div style="grid-column:1/-1;"><strong>Observações:</strong><br>${r.observacoes}</div>`:''}
        </div>
      `,
      footer: `<button class="btn btn-outline" onclick="closeModal('modal-ver-res')">Fechar</button>`
    });
    openModal('modal-ver-res');
  } catch(e) { showToast('Erro', e.erro||'Erro ao carregar.', 'error'); }
}

async function resEditar(id) {
  try {
    const r = await api.getReserva(id);
    const salas = await api.getSalas({ status: 'ativa', limit: 100 });
    const salaOpts = salas.dados.map(s => `<option value="${s.id}" ${s.id==r.salaId?'selected':''}>${s.nome}</option>`).join('');

    createModal({
      id: 'modal-edit-res',
      title: 'Editar Reserva',
      size: 'modal-lg',
      body: `
        <div class="form-row form-row-2">
          <div class="form-group"><label class="form-label">Título *</label><input id="eres-titulo" class="form-control" value="${r.titulo}"></div>
          <div class="form-group"><label class="form-label">Sala *</label><select id="eres-sala" class="form-control">${salaOpts}</select></div>
          <div class="form-group"><label class="form-label">Data *</label><input id="eres-data" type="date" class="form-control" value="${r.data}"></div>
          <div class="form-row form-row-2">
            <div class="form-group"><label class="form-label">Início *</label><input id="eres-inicio" type="time" class="form-control" value="${r.horaInicio}"></div>
            <div class="form-group"><label class="form-label">Fim *</label><input id="eres-fim" type="time" class="form-control" value="${r.horaFim}"></div>
          </div>
          <div class="form-group"><label class="form-label">Responsável</label><input id="eres-resp" class="form-control" value="${r.responsavel||''}"></div>
          <div class="form-group"><label class="form-label">Turma</label><input id="eres-turma" class="form-control" value="${r.turma||''}"></div>
        </div>
        <div class="form-group"><label class="form-label">Descrição</label><textarea id="eres-desc" class="form-control" rows="2">${r.descricao||''}</textarea></div>
        <div class="form-group"><label class="form-label">Observações</label><textarea id="eres-obs" class="form-control" rows="2">${r.observacoes||''}</textarea></div>
        <div id="eres-err" class="hidden" style="color:var(--erro);font-size:13px;padding:8px;background:rgba(220,53,69,.08);border-radius:6px;"></div>
      `,
      footer: `
        <button class="btn btn-outline" onclick="closeModal('modal-edit-res')">Cancelar</button>
        <button class="btn btn-primary" id="eres-save-btn" onclick="resSalvarEdicao(${id})">Salvar alterações</button>
      `
    });
    openModal('modal-edit-res');
  } catch(e) { showToast('Erro', e.erro||'Erro ao carregar.', 'error'); }
}

async function resSalvarEdicao(id) {
  const btn = document.getElementById('eres-save-btn');
  const err = document.getElementById('eres-err');
  err.classList.add('hidden');
  btn.disabled = true; btn.textContent = 'Salvando...';

  const dados = {
    titulo: document.getElementById('eres-titulo')?.value,
    salaId: document.getElementById('eres-sala')?.value,
    data: document.getElementById('eres-data')?.value,
    horaInicio: document.getElementById('eres-inicio')?.value,
    horaFim: document.getElementById('eres-fim')?.value,
    responsavel: document.getElementById('eres-resp')?.value,
    turma: document.getElementById('eres-turma')?.value,
    descricao: document.getElementById('eres-desc')?.value,
    observacoes: document.getElementById('eres-obs')?.value,
  };

  try {
    await api.atualizarReserva(id, dados);
    closeModal('modal-edit-res');
    showToast('Reserva atualizada!', '', 'success');
    resCarregar();
  } catch(e) {
    err.textContent = e.erro || 'Erro ao salvar.';
    err.classList.remove('hidden');
  } finally {
    btn.disabled = false; btn.textContent = 'Salvar alterações';
  }
}

async function resCancelar(id) {
  if (!confirm('Tem certeza que deseja cancelar esta reserva?')) return;
  try {
    await api.cancelarReserva(id);
    showToast('Reserva cancelada.', '', 'warning');
    resCarregar();
  } catch(e) { showToast('Erro', e.erro||'Erro ao cancelar.', 'error'); }
}

async function resExportar() {
  try {
    const params = { limit: 1000 };
    if (resState.filtros) Object.assign(params, resState.filtros);
    const data = await api.getReservas(params);
    const flat = data.dados.map(r => ({
      id: r.id, titulo: r.titulo, sala: r.sala?.nome, data: r.data,
      horaInicio: r.horaInicio, horaFim: r.horaFim, responsavel: r.responsavel,
      turma: r.turma, status: r.status, usuario: r.usuario?.nome,
      criado: r.createdAt
    }));
    exportCSV(flat, 'reservas');
  } catch(e) { showToast('Erro', 'Não foi possível exportar.', 'error'); }
}

// ===== NOVA RESERVA =====
async function renderNovaReserva(container) {
  let salas = [];
  try {
    const s = await api.getSalas({ status: 'ativa', limit: 100 });
    salas = s.dados;
  } catch(e) {}

  const salaOpts = salas.map(s => `<option value="${s.id}">${s.nome} (cap. ${s.capacidade})</option>`).join('');

  container.innerHTML = `
    <div class="card" style="max-width:720px;">
      <div class="card-header"><span class="card-title">Nova Reserva</span></div>
      <div class="card-body">
        <div class="form-row form-row-2">
          <div class="form-group" style="grid-column:1/-1;">
            <label class="form-label">Título da Reserva *</label>
            <input id="res-titulo" class="form-control" placeholder="Ex: Aula de Programação – Turma 2A">
          </div>
          <div class="form-group">
            <label class="form-label">Sala *</label>
            <select id="res-sala" class="form-control" onchange="resVerDisponibilidade()">
              <option value="">Selecione a sala...</option>
              ${salaOpts}
            </select>
          </div>
          <div class="form-group">
            <label class="form-label">Data *</label>
            <input id="res-data" type="date" class="form-control" min="${todayISO()}" onchange="resVerDisponibilidade()">
          </div>
          <div class="form-group">
            <label class="form-label">Hora de Início *</label>
            <input id="res-hora-inicio" type="time" class="form-control" onchange="resVerDisponibilidade()">
          </div>
          <div class="form-group">
            <label class="form-label">Hora de Fim *</label>
            <input id="res-hora-fim" type="time" class="form-control">
          </div>
          <div class="form-group">
            <label class="form-label">Responsável</label>
            <input id="res-responsavel" class="form-control" placeholder="Nome do responsável" value="${currentUser?.nome||''}">
          </div>
          <div class="form-group">
            <label class="form-label">Turma</label>
            <input id="res-turma" class="form-control" placeholder="Ex: 2A, 3B...">
          </div>
          <div class="form-group" style="grid-column:1/-1;">
            <label class="form-label">Descrição</label>
            <textarea id="res-desc" class="form-control" rows="2" placeholder="Descrição da atividade..."></textarea>
          </div>
          <div class="form-group" style="grid-column:1/-1;">
            <label class="form-label">Observações</label>
            <textarea id="res-obs" class="form-control" rows="2" placeholder="Alguma observação..."></textarea>
          </div>
        </div>

        <div id="res-disponibilidade" style="display:none;margin-bottom:16px;">
          <div style="font-size:13px;font-weight:700;color:var(--texto);margin-bottom:8px;">
            <svg style="width:16px;height:16px;vertical-align:middle;margin-right:4px;" viewBox="0 0 24 24" fill="none" stroke="#8DC63F" stroke-width="2"><path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
            Horários disponíveis — clique para preencher:
          </div>
          <div class="availability-grid" id="res-slots"></div>
        </div>

        <div id="res-err" class="hidden" style="color:var(--erro);font-size:13px;padding:10px 14px;background:rgba(220,53,69,.08);border-radius:8px;margin-bottom:12px;"></div>

        <div style="display:flex;gap:10px;justify-content:flex-end;">
          <button class="btn btn-outline" onclick="navigate('reservas')">Cancelar</button>
          <button class="btn btn-primary" id="res-salvar-btn" onclick="resSalvar()">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
            Confirmar Reserva
          </button>
        </div>
      </div>
    </div>
  `;

  // Define data mínima como hoje
  document.getElementById('res-data').value = todayISO();
}

async function resVerDisponibilidade() {
  const salaId = document.getElementById('res-sala')?.value;
  const data = document.getElementById('res-data')?.value;
  const div = document.getElementById('res-disponibilidade');
  const slotsDiv = document.getElementById('res-slots');
  if (!salaId || !data || !div || !slotsDiv) return;

  try {
    const info = await api.disponibilidade(salaId, data);
    const todos = ['07:00','08:00','09:00','10:00','11:00','12:00','13:00','14:00','15:00','16:00','17:00','18:00','19:00','20:00','21:00','22:00'];
    const livres = new Set(info.horariosDisponiveis);

    slotsDiv.innerHTML = todos.map(h => {
      const livre = livres.has(h);
      return `<div class="avail-slot ${livre?'free':'busy'}" ${livre?`onclick="resPreencherHorario('${h}')"`:''}>${h}</div>`;
    }).join('');

    div.style.display = 'block';
  } catch(e) {}
}

function resPreencherHorario(h) {
  const ini = document.getElementById('res-hora-inicio');
  const fim = document.getElementById('res-hora-fim');
  if (ini) ini.value = h;
  if (fim) {
    const [hh, mm] = h.split(':');
    fim.value = `${String(parseInt(hh)+1).padStart(2,'0')}:${mm}`;
  }
}

async function resSalvar() {
  const btn = document.getElementById('res-salvar-btn');
  const err = document.getElementById('res-err');
  err.classList.add('hidden');

  const dados = {
    titulo: document.getElementById('res-titulo')?.value?.trim(),
    salaId: document.getElementById('res-sala')?.value,
    data: document.getElementById('res-data')?.value,
    horaInicio: document.getElementById('res-hora-inicio')?.value,
    horaFim: document.getElementById('res-hora-fim')?.value,
    responsavel: document.getElementById('res-responsavel')?.value,
    turma: document.getElementById('res-turma')?.value,
    descricao: document.getElementById('res-desc')?.value,
    observacoes: document.getElementById('res-obs')?.value,
  };

  if (!dados.titulo || !dados.salaId || !dados.data || !dados.horaInicio || !dados.horaFim) {
    err.textContent = 'Preencha todos os campos obrigatórios (*).';
    err.classList.remove('hidden');
    return;
  }

  btn.disabled = true; btn.textContent = 'Salvando...';

  try {
    await api.criarReserva(dados);
    showToast('Reserva criada!', `${dados.titulo} confirmada com sucesso.`, 'success');
    navigate('reservas');
  } catch(e) {
    err.textContent = e.erro || 'Erro ao criar reserva.';
    err.classList.remove('hidden');
  } finally {
    btn.disabled = false;
    btn.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16"><path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/></svg> Confirmar Reserva`;
  }
}

async function resFinalizar(id) {
  if (!confirm('Tem certeza que deseja marcar esta reserva como finalizada?')) return;
  try {
    // Usa a sua API existente para atualizar apenas o campo status
    await api.atualizarReserva(id, { status: 'finalizada' });
    showToast('Reserva finalizada!', 'A reserva foi marcada como concluída.', 'success');
    resCarregar(); // Recarrega a tabela para atualizar a cor da badge
  } catch(e) { 
    showToast('Erro', e.erro || 'Erro ao finalizar a reserva.', 'error'); 
  }
}