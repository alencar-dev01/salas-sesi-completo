// js/pages/chamados.js
let chamadosState = { page: 1, paginas: 1, dados: [] };

async function renderChamados(container) {
  chamadosState.page = 1;
  const isAdmin = currentUser?.perfil === 'administrador';

  container.innerHTML = `
    <div class="section-header">
      <h2 class="section-title">🎫 Central de Chamados</h2>
      <button class="btn btn-primary btn-sm" onclick="chamadoAbrirModal()">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 5v14M5 12h14"/></svg>
        Abrir Chamado
      </button>
    </div>

    <div id="ch-kpis" style="display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:12px;margin-bottom:18px;">
      ${[1, 2, 3, 4].map(() => `<div class="skeleton" style="height:72px;border-radius:10px;"></div>`).join('')}
    </div>

    <div class="search-bar">
      <div class="search-input-wrap">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/></svg>
        <input type="text" id="ch-busca" placeholder="Buscar chamados..." oninput="chDebounce()">
      </div>
      <select class="form-control" id="ch-status" style="width:auto;" onchange="chamadosCarregar()">
        <option value="">Todos os status</option>
        <option value="Aberto">Aberto</option>
        <option value="Em andamento">Em andamento</option>
        <option value="Aguardando peça">Aguardando peça</option>
        <option value="Aguardando usuário">Aguardando usuário</option>
        <option value="Resolvido">Resolvido</option>
        <option value="Encerrado">Encerrado</option>
      </select>
      <select class="form-control" id="ch-cat" style="width:auto;" onchange="chamadosCarregar()">
        <option value="">Todas categorias</option>
        ${['Computador', 'Projetor', 'Rede/Internet', 'Impressora', 'Software', 'Hardware', 'Infraestrutura', 'Sistema', 'Outros']
          .map(c => `<option value="${c}">${c}</option>`).join('')}
      </select>
      <select class="form-control" id="ch-pri" style="width:auto;" onchange="chamadosCarregar()">
        <option value="">Todas prioridades</option>
        <option value="Crítica">🔴 Crítica</option>
        <option value="Alta">🟠 Alta</option>
        <option value="Média">🔵 Média</option>
        <option value="Baixa">🟢 Baixa</option>
      </select>
    </div>

    <div id="ch-lista" style="display:grid;gap:10px;">
      ${[1, 2, 3].map(() => `<div class="skeleton skeleton-row"></div>`).join('')}
    </div>
    <div id="ch-pagination"></div>
  `;

  chamadosCarregar();
  chamadosCarregarKPIs();
}

async function chamadosCarregarKPIs() {
  try {
    const dados = await api.get('/chamados?limit=1000');
    const abertos   = dados.dados.filter(c => c.status === 'Aberto').length;
    const andamento = dados.dados.filter(c => c.status === 'Em andamento').length;
    const criticos  = dados.dados.filter(c => c.prioridade === 'Crítica' && !['Resolvido', 'Encerrado'].includes(c.status)).length;
    const resolvidos = dados.dados.filter(c => c.status === 'Resolvido').length;

    document.getElementById('ch-kpis').innerHTML = `
      <div class="stat-card"><div class="stat-icon orange"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg></div><div class="stat-info"><div class="stat-value">${abertos}</div><div class="stat-label">Abertos</div></div></div>
      <div class="stat-card"><div class="stat-icon blue"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/></svg></div><div class="stat-info"><div class="stat-value">${andamento}</div><div class="stat-label">Em andamento</div></div></div>
      <div class="stat-card"><div class="stat-icon red"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg></div><div class="stat-info"><div class="stat-value">${criticos}</div><div class="stat-label">Críticos</div></div></div>
      <div class="stat-card"><div class="stat-icon green"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 11.08V12a10 10 0 11-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg></div><div class="stat-info"><div class="stat-value">${resolvidos}</div><div class="stat-label">Resolvidos</div></div></div>
    `;

    const badge = document.getElementById('badge-chamados');
    if (badge) { badge.textContent = abertos + andamento; badge.classList.toggle('hidden', abertos + andamento === 0); }
  } catch (e) {}
}

let chTimer;
function chDebounce() { clearTimeout(chTimer); chTimer = setTimeout(chamadosCarregar, 400); }

async function chamadosCarregar(page) {
  if (page) chamadosState.page = page;
  const params = {
    page: chamadosState.page, limit: 15,
    busca: document.getElementById('ch-busca')?.value || '',
    status: document.getElementById('ch-status')?.value || '',
    categoria: document.getElementById('ch-cat')?.value || '',
    prioridade: document.getElementById('ch-pri')?.value || ''
  };
  Object.keys(params).forEach(k => !params[k] && delete params[k]);

  const lista = document.getElementById('ch-lista');
  if (lista) lista.innerHTML = `<div class="skeleton skeleton-row"></div>`.repeat(3);

  try {
    // 🛠️ FIX 1: Removido o 'api.getReservas &&' incorreto
    const data = await api.get('/chamados?' + new URLSearchParams(params));
    chamadosState.dados = data.dados;
    chamadosState.paginas = data.paginas;

    if (!data.dados.length) {
      lista.innerHTML = `<div class="empty-state"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" style="width:48px;height:48px;opacity:.3;margin:0 auto 12px;display:block;"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/></svg><p>Nenhum chamado encontrado.</p></div>`;
      return;
    }

    lista.innerHTML = data.dados.map(c => chamadoCardHTML(c)).join('');
    renderPagination(document.getElementById('ch-pagination'), chamadosState.page, chamadosState.paginas, chamadosCarregar);
  } catch (e) {
    if (lista) lista.innerHTML = `<div style="color:var(--erro);padding:16px;">${e.erro || 'Erro ao carregar chamados.'}</div>`;
  }
}

function chamadoCardHTML(c) {
  const stColors = { 'Aberto': 'badge-orange', 'Em andamento': 'badge-blue', 'Aguardando peça': 'badge-gray', 'Aguardando usuário': 'badge-gray', 'Resolvido': 'badge-green', 'Encerrado': 'badge-gray' };
  const stLabels = { 'Aberto': '⚪ Aberto', 'Em andamento': '🔵 Em andamento', 'Aguardando peça': '⏸ Ag. Peça', 'Aguardando usuário': '⏸ Ag. Usuário', 'Resolvido': '✅ Resolvido', 'Encerrado': '⬛ Encerrado' };
  return `
    <div class="chamado-card" onclick="chamadoAbrirDetalhe(${c.id})">
      <div class="chamado-header">
        <div class="chamado-titulo">#${c.id} — ${c.titulo}</div>
        <div style="display:flex;gap:6px;flex-shrink:0;">
          <span class="prioridade-badge pri-${c.prioridade}">${c.prioridade}</span>
          <span class="badge ${stColors[c.status] || 'badge-gray'}">${stLabels[c.status] || c.status}</span>
        </div>
      </div>
      <div style="font-size:12px;color:var(--texto-leve);margin-bottom:8px;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;">${c.descricao}</div>
      <div class="chamado-meta">
        <span>🗂 ${c.categoria}</span>
        ${c.sala ? `<span>🏫 ${c.sala.nome}</span>` : ''}
        ${c.impressora ? `<span>🖨️ ${c.impressora.nome}</span>` : ''}
        <span>👤 ${c.abertoPor?.nome || '—'}</span>
        ${c.tecnico ? `<span>🔧 ${c.tecnico.nome}</span>` : ''}
        <span>📅 ${formatDate(c.createdAt?.split('T')[0])}</span>
      </div>
    </div>
  `;
}

async function chamadoAbrirDetalhe(id) {
  try {
    const c = await api.get('/chamados/' + id);
    const isAdmin = currentUser?.perfil === 'administrador';
    const stOptions = ['Aberto', 'Em andamento', 'Aguardando peça', 'Aguardando usuário', 'Resolvido', 'Encerrado'].map(s => `<option value="${s}" ${c.status === s ? 'selected' : ''}>${s}</option>`).join('');
    const canEdit = isAdmin || c.abertoPorId === currentUser?.id;

    createModal({
      id: 'modal-chamado-detalhe',
      title: `#${c.id} — ${c.titulo}`,
      size: 'modal-lg',
      body: `
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:16px;font-size:13px;">
          <div><strong>Categoria:</strong> ${c.categoria}</div>
          <div><strong>Prioridade:</strong> <span class="prioridade-badge pri-${c.prioridade}">${c.prioridade}</span></div>
          <div><strong>Sala:</strong> ${c.sala?.nome || '—'}</div>
          <div><strong>Impressora:</strong> ${c.impressora?.nome || '—'}</div>
          <div><strong>Aberto por:</strong> ${c.abertoPor?.nome || '—'}</div>
          <div><strong>Técnico:</strong> ${c.tecnico?.nome || 'Não atribuído'}</div>
        </div>
        <div style="background:var(--cinza-claro);border-radius:8px;padding:12px;margin-bottom:16px;font-size:13px;">${c.descricao}</div>
        ${c.solucao ? `<div style="background:rgba(141,198,63,0.1);border:1px solid rgba(141,198,63,0.3);border-radius:8px;padding:12px;margin-bottom:16px;font-size:13px;"><strong>✅ Solução:</strong><br>${c.solucao}</div>` : ''}

        ${isAdmin ? `
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:16px;">
          <div class="form-group"><label class="form-label">Status</label><select id="ch-edit-status" class="form-control">${stOptions}</select></div>
          <div class="form-group"><label class="form-label">Solução</label><input id="ch-edit-solucao" class="form-control" placeholder="Descreva a solução..." value="${c.solucao || ''}"></div>
        </div>
        <div style="display:flex;gap:8px;margin-bottom:16px;">
          ${c.tecnicoId !== currentUser?.id ? `<button class="btn btn-warning btn-sm" onclick="chamadoAssumir(${c.id})">🔧 Assumir Chamado</button>` : ''}
          <button class="btn btn-primary btn-sm" onclick="chamadoAtualizarStatus(${c.id})">💾 Salvar Status</button>
        </div>` : ''}

        <div class="divider"></div>
        <div style="font-weight:700;font-size:13px;margin-bottom:10px;">💬 Histórico</div>
        <ul class="timeline" id="ch-timeline">
          ${(c.comentarios || []).map(com => `
            <li class="timeline-item">
              <div class="timeline-dot ${com.tipo}"></div>
              <div class="timeline-content">
                <span class="timeline-author">${com.usuario?.nome || '—'}</span>
                <span class="timeline-time">${formatDateTime(com.createdAt)}</span>
                <div class="timeline-text">${com.texto}</div>
              </div>
            </li>
          `).join('') || '<li style="color:var(--texto-leve);font-size:13px;">Nenhum comentário ainda.</li>'}
        </ul>

        <div style="margin-top:12px;display:flex;gap:8px;">
          <input id="ch-novo-comentario" class="form-control" placeholder="Adicionar comentário...">
          <button class="btn btn-primary btn-sm" style="white-space:nowrap;" onclick="chamadoComentar(${c.id})">Enviar</button>
        </div>
      `,
      footer: `<button class="btn btn-outline" onclick="closeModal('modal-chamado-detalhe')">Fechar</button>`
    });
    openModal('modal-chamado-detalhe');
  } catch (e) { showToast('Erro', e.erro || 'Erro ao abrir chamado.', 'error'); }
}

async function chamadoAssumir(id) {
  try {
    await api.post('/chamados/' + id + '/assumir', {});
    showToast('Chamado assumido!', '', 'success');
    closeModal('modal-chamado-detalhe');
    chamadosCarregar();
    chamadosCarregarKPIs();
  } catch (e) { showToast('Erro', e.erro || '', 'error'); }
}

async function chamadoAtualizarStatus(id) {
  const status  = document.getElementById('ch-edit-status')?.value;
  const solucao = document.getElementById('ch-edit-solucao')?.value;
  try {
    await api.put('/chamados/' + id, { status, solucao });
    showToast('Chamado atualizado!', '', 'success');
    closeModal('modal-chamado-detalhe');
    chamadosCarregar();
    chamadosCarregarKPIs();
  } catch (e) { showToast('Erro', e.erro || '', 'error'); }
}

async function chamadoComentar(id) {
  const texto = document.getElementById('ch-novo-comentario')?.value?.trim();
  if (!texto) return;
  try {
    const com = await api.post('/chamados/' + id + '/comentar', { texto });
    const tl = document.getElementById('ch-timeline');
    if (tl) {
      const li = document.createElement('li');
      li.className = 'timeline-item';
      li.innerHTML = `<div class="timeline-dot comentario"></div><div class="timeline-content"><span class="timeline-author">${currentUser.nome}</span><span class="timeline-time">Agora</span><div class="timeline-text">${texto}</div></div>`;
      tl.appendChild(li);
    }
    document.getElementById('ch-novo-comentario').value = '';
  } catch (e) { showToast('Erro', e.erro || '', 'error'); }
}

function chamadoAbrirModal() {
  // 🛠:: FIX 2: Alterado para carregar usando a rota padrão da API
  api.get('/salas?status=ativa&limit=100').then(s => {
    const salaOpts = s.dados.map(x => `<option value="${x.id}">${x.nome}</option>`).join('');
    api.get('/impressoras?limit=100').then(imp => {
      const impOpts = (imp.dados || []).map(x => `<option value="${x.id}">${x.nome} (${x.setor || '—'})</option>`).join('');
      _chamadoModal(salaOpts, impOpts);
    }).catch(() => _chamadoModal(salaOpts, ''));
  }).catch(() => _chamadoModal('', ''));
}

function _chamadoModal(salaOpts, impOpts) {
  createModal({
    id: 'modal-novo-chamado',
    title: '🎫 Abrir Novo Chamado',
    body: `
      <div class="form-group"><label class="form-label">Título *</label><input id="nc-titulo" class="form-control" placeholder="Descreva o problema brevemente"></div>
      <div class="form-row form-row-2">
        <div class="form-group"><label class="form-label">Categoria *</label>
          <select id="nc-cat" class="form-control">
            ${['Computador', 'Projetor', 'Rede/Internet', 'Impressora', 'Software', 'Hardware', 'Infraestrutura', 'Sistema', 'Outros'].map(c => `<option value="${c}">${c}</option>`).join('')}
          </select>
        </div>
        <div class="form-group"><label class="form-label">Prioridade</label>
          <select id="nc-pri" class="form-control">
            <option value="Baixa">🟢 Baixa</option>
            <option value="Média" selected>🔵 Média</option>
            <option value="Alta">🟠 Alta</option>
            <option value="Crítica">🔴 Crítica</option>
          </select>
        </div>
        <div class="form-group"><label class="form-label">Sala relacionada</label>
          <select id="nc-sala" class="form-control"><option value="">Nenhuma</option>${salaOpts}</select>
        </div>
        <div class="form-group"><label class="form-label">Impressora relacionada</label>
          <select id="nc-imp" class="form-control"><option value="">Nenhuma</option>${impOpts}</select>
        </div>
      </div>
      <div class="form-group"><label class="form-label">Descrição detalhada *</label>
        <textarea id="nc-desc" class="form-control" rows="4" placeholder="Descreva o problema com o máximo de detalhes..."></textarea>
      </div>
      <div id="nc-err" class="hidden" style="color:var(--erro);font-size:13px;padding:10px;background:rgba(220,53,69,.08);border-radius:8px;"></div>
    `,
    footer: `
      <button class="btn btn-outline" onclick="closeModal('modal-novo-chamado')">Cancelar</button>
      <button class="btn btn-primary" id="nc-save-btn" onclick="chamadoSalvar()">Abrir Chamado</button>
    `
  });
  openModal('modal-novo-chamado');
}

async function chamadoSalvar() {
  const btn = document.getElementById('nc-save-btn');
  const err = document.getElementById('nc-err');
  err.classList.add('hidden');
  const dados = {
    titulo:      document.getElementById('nc-titulo')?.value?.trim(),
    categoria:   document.getElementById('nc-cat')?.value,
    prioridade:  document.getElementById('nc-pri')?.value,
    descricao:   document.getElementById('nc-desc')?.value?.trim(),
    salaId:      document.getElementById('nc-sala')?.value || null,
    impressoraId: document.getElementById('nc-imp')?.value  || null
  };
  if (!dados.titulo || !dados.descricao) { err.textContent = 'Título e descrição são obrigatórios.'; err.classList.remove('hidden'); return; }
  btn.disabled = true; btn.textContent = 'Salvando...';
  try {
    await api.post('/chamados', dados);
    showToast('Chamado aberto!', dados.titulo, 'success');
    closeModal('modal-novo-chamado');
    chamadosCarregar();
    chamadosCarregarKPIs();
  } catch (e) { err.textContent = e.erro || 'Erro ao abrir chamado.'; err.classList.remove('hidden'); }
  finally { btn.disabled = false; btn.textContent = 'Abrir Chamado'; }
}