// js/pages/admin-extras.js
// Contém: Painel de Ocupação, Comunicados, Bloqueios, Manutenção Preventiva, Auditoria, Dashboard Executivo

// ═══════════════════════════════════════════════════════
// PAINEL DE OCUPAÇÃO
// ═══════════════════════════════════════════════════════
let painelInterval = null;

async function renderPainelOcupacao(container) {
  container.innerHTML = `
    <div class="section-header">
      <h2 class="section-title">📺 Painel de Ocupação em Tempo Real</h2>
      <div style="display:flex;gap:8px;align-items:center;">
        <span id="painel-hora" style="font-size:20px;font-weight:800;color:var(--azul-principal);font-family:monospace;"></span>
        <button class="btn btn-outline btn-sm" onclick="painelFullscreen()">⛶ Tela Cheia</button>
        <button class="btn btn-primary btn-sm" onclick="painelAtualizar()">🔄 Atualizar</button>
      </div>
    </div>
    <div id="painel-grid" style="display:grid;grid-template-columns:repeat(auto-fill,minmax(260px,1fr));gap:14px;"></div>
    <div style="margin-top:16px;font-size:11px;color:var(--texto-leve);text-align:center;">Atualização automática a cada 60 segundos</div>
  `;

  painelAtualizarRelogio();
  await painelAtualizar();

  // Auto-refresh
  clearInterval(painelInterval);
  painelInterval = setInterval(async () => {
    if (currentPage === 'painel-ocupacao') await painelAtualizar();
    else clearInterval(painelInterval);
  }, 60000);
}

function painelAtualizarRelogio() {
  const el = document.getElementById('painel-hora');
  if (!el) { clearInterval(painelInterval); return; }
  const now = new Date();
  el.textContent = now.toLocaleTimeString('pt-BR', { hour:'2-digit', minute:'2-digit', second:'2-digit' });
  setTimeout(painelAtualizarRelogio, 1000);
}

async function painelAtualizar() {
  const grid = document.getElementById('painel-grid');
  if (!grid) return;
  try {
    const data = await api.get('/admin/painel-ocupacao');
    grid.innerHTML = data.salas.map(s => {
      const cls = s.ocupada ? 'ocupada' : 'livre';
      const statusTxt = s.ocupada ? '🔴 OCUPADA' : '🟢 LIVRE';
      const reservaAtual = s.reservaAtual;
      const proxima = s.proximaReserva;
      return `
        <div class="painel-sala-card ${cls}">
          <div class="painel-status-badge">${statusTxt}</div>
          <div class="painel-sala-nome">${s.sala.nome}</div>
          <div class="painel-sala-info">📍 ${s.sala.localizacao || '—'} · 👥 cap. ${s.sala.capacidade}</div>
          ${reservaAtual ? `
            <div style="margin-top:10px;background:rgba(0,0,0,0.15);border-radius:8px;padding:8px 10px;">
              <div style="font-size:11px;opacity:.8;margin-bottom:2px;">EM USO AGORA</div>
              <div style="font-weight:700;font-size:13px;">${reservaAtual.titulo}</div>
              <div style="font-size:11px;opacity:.85;">${reservaAtual.horaInicio}–${reservaAtual.horaFim} · ${reservaAtual.responsavel || reservaAtual.usuario?.nome || '—'}</div>
            </div>` : ''}
          ${proxima ? `
            <div style="margin-top:8px;font-size:11px;opacity:.8;">
              ⏭ Próxima: <strong>${proxima.horaInicio}</strong> — ${proxima.titulo}
            </div>` : `<div style="margin-top:8px;font-size:11px;opacity:.7;">Sem mais reservas hoje</div>`}
          <div style="margin-top:8px;font-size:11px;opacity:.7;">📅 ${s.totalHoje} reserva(s) hoje</div>
        </div>
      `;
    }).join('');
  } catch(e) {
    grid.innerHTML = `<div style="color:white;background:var(--erro);border-radius:10px;padding:20px;grid-column:1/-1;">Erro ao carregar painel: ${e.erro||'Tente novamente.'}</div>`;
  }
}

function painelFullscreen() {
  const el = document.getElementById('app-layout') || document.documentElement;
  if (document.fullscreenElement) document.exitFullscreen();
  else el.requestFullscreen?.();
}

// ═══════════════════════════════════════════════════════
// COMUNICADOS
// ═══════════════════════════════════════════════════════
async function renderComunicados(container) {
  const isAdmin = currentUser?.perfil === 'administrador';

  container.innerHTML = `
    <div class="section-header">
      <h2 class="section-title">📢 Comunicados Internos</h2>
      ${isAdmin ? `<button class="btn btn-primary btn-sm" onclick="comAbrirModal()">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 5v14M5 12h14"/></svg>
        Novo Comunicado
      </button>` : ''}
    </div>
    <div id="com-lista" style="display:grid;gap:10px;">
      ${[1,2,3].map(()=>`<div class="skeleton skeleton-row" style="height:80px;"></div>`).join('')}
    </div>
  `;

  comCarregar();
}

async function comCarregar() {
  const lista = document.getElementById('com-lista');
  try {
    const data = await api.get('/admin/comunicados');
    const isAdmin = currentUser?.perfil === 'administrador';

    if (!data.length) {
      lista.innerHTML = `<div class="empty-state"><p>Nenhum comunicado ativo.</p></div>`;
      return;
    }

    const priIcon = { Normal:'ℹ️', Importante:'⚠️', Urgente:'🚨' };
    const tipoIcon = { Aviso:'📢', Manutenção:'🔧', Interrupção:'⛔', Evento:'🎉', Outro:'📌' };

    lista.innerHTML = data.map(c => `
      <div class="comunicado-banner ${c.tipo}" style="position:relative;">
        <span style="font-size:24px;flex-shrink:0;">${tipoIcon[c.tipo]||'📌'}</span>
        <div style="flex:1;">
          <div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap;margin-bottom:4px;">
            <span style="font-weight:800;font-size:14px;color:var(--texto);">${c.titulo}</span>
            ${c.prioridade !== 'Normal' ? `<span style="font-size:10px;font-weight:700;background:var(--laranja-detalhe);color:white;padding:2px 7px;border-radius:10px;">${priIcon[c.prioridade]} ${c.prioridade}</span>` : ''}
            <span style="font-size:11px;color:var(--texto-leve);">por ${c.autor?.nome} · ${formatDate(c.createdAt?.split('T')[0])}</span>
            ${c.dataExpiracao ? `<span style="font-size:11px;color:var(--texto-leve);">· expira ${formatDate(c.dataExpiracao)}</span>` : ''}
          </div>
          <div style="font-size:13px;color:var(--texto);">${c.conteudo}</div>
        </div>
        ${isAdmin ? `
          <div style="display:flex;gap:5px;flex-shrink:0;">
            <button class="btn btn-outline btn-sm btn-icon" onclick="comAbrirModal(${c.id})" title="Editar">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
            </button>
            <button class="btn btn-danger btn-sm btn-icon" onclick="comExcluir(${c.id})" title="Excluir">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/></svg>
            </button>
          </div>` : ''}
      </div>
    `).join('');
  } catch(e) {
    lista.innerHTML = `<div style="color:var(--erro);padding:16px;">${e.erro||'Erro ao carregar.'}</div>`;
  }
}

function comAbrirModal(id = null) {
  const load = id ? api.get('/admin/comunicados').then(d=>d.find(x=>x.id===id)) : Promise.resolve(null);
  load.then(c => {
    createModal({
      id: 'modal-com', title: c ? 'Editar Comunicado' : 'Novo Comunicado',
      body: `
        <div class="form-group"><label class="form-label">Título *</label><input id="com-f-titulo" class="form-control" placeholder="Título do comunicado" value="${c?.titulo||''}"></div>
        <div class="form-row form-row-2">
          <div class="form-group"><label class="form-label">Tipo</label>
            <select id="com-f-tipo" class="form-control">
              ${['Aviso','Manutenção','Interrupção','Evento','Outro'].map(t=>`<option value="${t}" ${c?.tipo===t?'selected':''}>${t}</option>`).join('')}
            </select>
          </div>
          <div class="form-group"><label class="form-label">Prioridade</label>
            <select id="com-f-pri" class="form-control">
              ${['Normal','Importante','Urgente'].map(p=>`<option value="${p}" ${c?.prioridade===p?'selected':''}>${p}</option>`).join('')}
            </select>
          </div>
          <div class="form-group"><label class="form-label">Data de expiração</label><input id="com-f-exp" type="date" class="form-control" value="${c?.dataExpiracao||''}"></div>
        </div>
        <div class="form-group"><label class="form-label">Conteúdo *</label><textarea id="com-f-conteudo" class="form-control" rows="4" placeholder="Mensagem do comunicado...">${c?.conteudo||''}</textarea></div>
        <div id="com-f-err" class="hidden" style="color:var(--erro);font-size:13px;padding:10px;background:rgba(220,53,69,.08);border-radius:8px;"></div>
      `,
      footer: `<button class="btn btn-outline" onclick="closeModal('modal-com')">Cancelar</button><button class="btn btn-primary" id="com-f-save" onclick="comSalvar(${id||'null'})">${c?'Salvar':'Publicar'}</button>`
    });
    openModal('modal-com');
  });
}

async function comSalvar(id) {
  const btn=document.getElementById('com-f-save'), err=document.getElementById('com-f-err');
  err.classList.add('hidden');
  const dados={titulo:document.getElementById('com-f-titulo')?.value?.trim(),tipo:document.getElementById('com-f-tipo')?.value,prioridade:document.getElementById('com-f-pri')?.value,dataExpiracao:document.getElementById('com-f-exp')?.value||null,conteudo:document.getElementById('com-f-conteudo')?.value?.trim()};
  if(!dados.titulo||!dados.conteudo){err.textContent='Título e conteúdo são obrigatórios.';err.classList.remove('hidden');return;}
  btn.disabled=true;btn.textContent='Salvando...';
  try{
    id ? await api.put('/admin/comunicados/'+id,dados) : await api.post('/admin/comunicados',dados);
    showToast(id?'Comunicado atualizado!':'Comunicado publicado!','','success');
    closeModal('modal-com'); comCarregar();
  }catch(e){err.textContent=e.erro||'Erro.';err.classList.remove('hidden');}
  finally{btn.disabled=false;btn.textContent=id?'Salvar':'Publicar';}
}

async function comExcluir(id) {
  if(!confirm('Excluir este comunicado?'))return;
  try{await api.delete('/admin/comunicados/'+id);showToast('Comunicado excluído.','','success');comCarregar();}
  catch(e){showToast('Erro',e.erro||'','error');}
}

// ═══════════════════════════════════════════════════════
// BLOQUEIOS DE SALAS
// ═══════════════════════════════════════════════════════
async function renderBloqueios(container) {
  let salas = [];
  try { const s = await api.getSalas({ limit:100 }); salas = s.dados; } catch(e) {}

  container.innerHTML = `
    <div class="section-header">
      <h2 class="section-title">🔒 Bloqueios de Salas</h2>
      <button class="btn btn-primary btn-sm" onclick="bloqAbrirModal(${JSON.stringify(salas).replace(/"/g,'&quot;')})">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 5v14M5 12h14"/></svg>
        Novo Bloqueio
      </button>
    </div>
    <div id="bloq-lista" style="display:grid;gap:8px;">
      <div class="skeleton skeleton-row"></div><div class="skeleton skeleton-row"></div>
    </div>
  `;
  bloqCarregar();
}

async function bloqCarregar() {
  const lista = document.getElementById('bloq-lista');
  try {
    const data = await api.get('/admin/bloqueios?ativo=true');
    if (!data.length) { lista.innerHTML=`<div class="empty-state"><p>Nenhum bloqueio ativo.</p></div>`; return; }
    const motivoIcon = { 'Manutenção':'🔧','Evento Interno':'🎭','Treinamento':'📚','Auditoria':'🔍','Outro':'📌' };
    lista.innerHTML = data.map(b => `
      <div class="bloqueio-item">
        <div class="bloqueio-icon">${motivoIcon[b.motivo]||'📌'}</div>
        <div class="bloqueio-info">
          <div class="bloqueio-titulo">${b.titulo}</div>
          <div class="bloqueio-meta">
            🏫 ${b.sala?.nome||'—'} · 📅 ${formatDate(b.dataInicio)} → ${formatDate(b.dataFim)}
            ${!b.diaInteiro ? ` · ⏰ ${b.horaInicio}–${b.horaFim}` : ' · Dia inteiro'}
            · ${b.motivo} · por ${b.criadoPor?.nome||'—'}
          </div>
        </div>
        <button class="btn btn-danger btn-sm" onclick="bloqRemover(${b.id})">Remover</button>
      </div>
    `).join('');
  } catch(e) { lista.innerHTML=`<div style="color:var(--erro);padding:16px;">${e.erro||'Erro.'}</div>`; }
}

function bloqAbrirModal(salas) {
  if (typeof salas === 'string') try { salas=JSON.parse(salas); }catch(e){ salas=[]; }
  const salaOpts = (salas||[]).map(s=>`<option value="${s.id}">${s.nome}</option>`).join('');
  createModal({
    id:'modal-bloq', title:'🔒 Bloquear Sala',
    body:`
      <div class="form-group"><label class="form-label">Título / Motivo *</label><input id="bl-titulo" class="form-control" placeholder="Ex: Manutenção preventiva computadores"></div>
      <div class="form-row form-row-2">
        <div class="form-group"><label class="form-label">Sala *</label><select id="bl-sala" class="form-control"><option value="">Selecione...</option>${salaOpts}</select></div>
        <div class="form-group"><label class="form-label">Tipo de bloqueio</label>
          <select id="bl-motivo" class="form-control">
            ${['Manutenção','Evento Interno','Treinamento','Auditoria','Outro'].map(m=>`<option value="${m}">${m}</option>`).join('')}
          </select>
        </div>
        <div class="form-group"><label class="form-label">Data início *</label><input id="bl-di" type="date" class="form-control" value="${todayISO()}"></div>
        <div class="form-group"><label class="form-label">Data fim *</label><input id="bl-df" type="date" class="form-control" value="${todayISO()}"></div>
      </div>
      <div style="display:flex;align-items:center;gap:8px;margin-bottom:12px;">
        <input type="checkbox" id="bl-dia-inteiro" checked onchange="document.getElementById('bl-horas').style.display=this.checked?'none':'grid'" style="width:16px;height:16px;">
        <label for="bl-dia-inteiro" class="form-label" style="margin:0;cursor:pointer;">Bloquear dia(s) inteiro(s)</label>
      </div>
      <div id="bl-horas" style="display:none;" class="form-row form-row-2">
        <div class="form-group"><label class="form-label">Hora início</label><input id="bl-hi" type="time" class="form-control" value="08:00"></div>
        <div class="form-group"><label class="form-label">Hora fim</label><input id="bl-hf" type="time" class="form-control" value="18:00"></div>
      </div>
      <div class="form-group"><label class="form-label">Observações</label><textarea id="bl-obs" class="form-control" rows="2"></textarea></div>
      <div id="bl-err" class="hidden" style="color:var(--erro);font-size:13px;padding:10px;background:rgba(220,53,69,.08);border-radius:8px;"></div>
    `,
    footer:`<button class="btn btn-outline" onclick="closeModal('modal-bloq')">Cancelar</button><button class="btn btn-danger" id="bl-save" onclick="bloqSalvar()">🔒 Bloquear Sala</button>`
  });
  openModal('modal-bloq');
}

async function bloqSalvar() {
  const btn=document.getElementById('bl-save'), err=document.getElementById('bl-err');
  err.classList.add('hidden');
  const diaInteiro = document.getElementById('bl-dia-inteiro')?.checked;
  const dados={titulo:document.getElementById('bl-titulo')?.value?.trim(),salaId:document.getElementById('bl-sala')?.value,motivo:document.getElementById('bl-motivo')?.value,dataInicio:document.getElementById('bl-di')?.value,dataFim:document.getElementById('bl-df')?.value,diaInteiro,horaInicio:diaInteiro?null:document.getElementById('bl-hi')?.value,horaFim:diaInteiro?null:document.getElementById('bl-hf')?.value,observacoes:document.getElementById('bl-obs')?.value};
  if(!dados.titulo||!dados.salaId||!dados.dataInicio||!dados.dataFim){err.textContent='Preencha os campos obrigatórios.';err.classList.remove('hidden');return;}
  btn.disabled=true;btn.textContent='Salvando...';
  try{await api.post('/admin/bloqueios',dados);showToast('Sala bloqueada!',dados.titulo,'warning');closeModal('modal-bloq');bloqCarregar();}
  catch(e){err.textContent=e.erro||'Erro.';err.classList.remove('hidden');}
  finally{btn.disabled=false;btn.textContent='🔒 Bloquear Sala';}
}

async function bloqRemover(id) {
  if(!confirm('Remover este bloqueio?'))return;
  try{await api.delete('/admin/bloqueios/'+id);showToast('Bloqueio removido.','','success');bloqCarregar();}
  catch(e){showToast('Erro',e.erro||'','error');}
}

// ═══════════════════════════════════════════════════════
// MANUTENÇÃO PREVENTIVA
// ═══════════════════════════════════════════════════════
async function renderManutencao(container) {
  let salas = [];
  try { const s = await api.getSalas({ limit:100 }); salas = s.dados; } catch(e) {}

  container.innerHTML = `
    <div class="section-header">
      <h2 class="section-title">🔧 Manutenção Preventiva</h2>
      <button class="btn btn-primary btn-sm" onclick="manAbrirModal()">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 5v14M5 12h14"/></svg>
        Agendar Manutenção
      </button>
    </div>

    <!-- Filtros -->
    <div style="display:flex;gap:10px;margin-bottom:16px;flex-wrap:wrap;">
      ${['Todas','Agendada','Vencida','Realizada','Cancelada'].map(s =>
        `<button class="btn btn-outline btn-sm" onclick="manFiltrar('${s==='Todas'?'':s}')" style="font-size:12px;">${s}</button>`
      ).join('')}
    </div>

    <div id="man-lista" style="display:grid;gap:8px;">
      ${[1,2,3].map(()=>`<div class="skeleton skeleton-row" style="height:66px;"></div>`).join('')}
    </div>
  `;

  // Guarda salas no estado
  window._manSalas = salas;
  manCarregar('');
}

async function manFiltrar(status) {
  document.querySelectorAll('.section-header ~ div button').forEach(b => b.classList.remove('btn-primary'));
  manCarregar(status);
}

async function manCarregar(status='') {
  const lista = document.getElementById('man-lista');
  try {
    const params = status ? `?status=${status}` : '';
    const data = await api.get('/admin/manutencao-preventiva' + params);
    if (!data.length) { lista.innerHTML=`<div class="empty-state"><p>Nenhuma manutenção encontrada.</p></div>`; return; }

    lista.innerHTML = data.map(m => {
      const parts = m.dataProgramada?.split('-') || [];
      const dia   = parts[2] || '—';
      const mes   = parts[1] ? monthName(parseInt(parts[1])-1).slice(0,3).toUpperCase() : '—';
      return `
        <div class="man-item ${m.status}">
          <div class="man-date-box ${m.status}">
            <span style="font-size:16px;line-height:1;">${dia}</span>
            <span style="font-size:8px;">${mes}</span>
          </div>
          <div style="flex:1;min-width:0;">
            <div style="font-weight:700;font-size:13px;color:var(--texto);">${m.equipamento}</div>
            <div style="font-size:11px;color:var(--texto-leve);">
              ${m.sala?.nome||'Geral'} · ${m.tipoManutencao} · ${m.responsavel||'—'}
            </div>
          </div>
          <div style="text-align:right;flex-shrink:0;">
            ${statusBadge(m.status)}
            <div style="display:flex;gap:5px;margin-top:6px;justify-content:flex-end;">
              ${m.status==='Agendada'||m.status==='Vencida' ? `
                <button class="btn btn-success btn-sm" onclick="manMarcarRealizada(${m.id})">✔ Realizada</button>
                <button class="btn btn-danger btn-sm btn-icon" onclick="manCancelar(${m.id})">
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                </button>` : ''}
            </div>
          </div>
        </div>
      `;
    }).join('');
  } catch(e) { lista.innerHTML=`<div style="color:var(--erro);padding:16px;">${e.erro||'Erro.'}</div>`; }
}

function manAbrirModal() {
  const salas = window._manSalas || [];
  const salaOpts = salas.map(s=>`<option value="${s.id}">${s.nome}</option>`).join('');
  createModal({
    id:'modal-man', title:'🔧 Agendar Manutenção Preventiva',
    body:`
      <div class="form-group"><label class="form-label">Equipamento *</label><input id="man-f-eq" class="form-control" placeholder="Ex: Computadores, Projetores, Ar condicionado..."></div>
      <div class="form-row form-row-2">
        <div class="form-group"><label class="form-label">Sala</label><select id="man-f-sala" class="form-control"><option value="">Todas / Geral</option>${salaOpts}</select></div>
        <div class="form-group"><label class="form-label">Tipo de manutenção</label>
          <select id="man-f-tipo" class="form-control">
            ${['Limpeza','Atualização','Troca de peça','Verificação','Calibração','Outro'].map(t=>`<option value="${t}">${t}</option>`).join('')}
          </select>
        </div>
        <div class="form-group"><label class="form-label">Responsável</label><input id="man-f-resp" class="form-control" placeholder="Nome do técnico responsável"></div>
        <div class="form-group"><label class="form-label">Data programada *</label><input id="man-f-data" type="date" class="form-control" value="${todayISO()}"></div>
      </div>
      <div class="form-group"><label class="form-label">Observações</label><textarea id="man-f-obs" class="form-control" rows="2"></textarea></div>
      <div id="man-f-err" class="hidden" style="color:var(--erro);font-size:13px;padding:10px;background:rgba(220,53,69,.08);border-radius:8px;"></div>
    `,
    footer:`<button class="btn btn-outline" onclick="closeModal('modal-man')">Cancelar</button><button class="btn btn-primary" id="man-f-save" onclick="manSalvar()">Agendar</button>`
  });
  openModal('modal-man');
}

async function manSalvar() {
  const btn=document.getElementById('man-f-save'), err=document.getElementById('man-f-err');
  err.classList.add('hidden');
  const dados={equipamento:document.getElementById('man-f-eq')?.value?.trim(),salaId:document.getElementById('man-f-sala')?.value||null,tipoManutencao:document.getElementById('man-f-tipo')?.value,responsavel:document.getElementById('man-f-resp')?.value,dataProgramada:document.getElementById('man-f-data')?.value,observacoes:document.getElementById('man-f-obs')?.value};
  if(!dados.equipamento||!dados.dataProgramada){err.textContent='Equipamento e data são obrigatórios.';err.classList.remove('hidden');return;}
  btn.disabled=true;btn.textContent='Agendando...';
  try{await api.post('/admin/manutencao-preventiva',dados);showToast('Manutenção agendada!',dados.equipamento,'success');closeModal('modal-man');manCarregar('');}
  catch(e){err.textContent=e.erro||'Erro.';err.classList.remove('hidden');}
  finally{btn.disabled=false;btn.textContent='Agendar';}
}

async function manMarcarRealizada(id) {
  try{await api.put('/admin/manutencao-preventiva/'+id,{status:'Realizada',dataRealizada:todayISO()});showToast('Manutenção marcada como realizada!','','success');manCarregar('');}
  catch(e){showToast('Erro',e.erro||'','error');}
}

async function manCancelar(id) {
  if(!confirm('Cancelar esta manutenção?'))return;
  try{await api.put('/admin/manutencao-preventiva/'+id,{status:'Cancelada'});showToast('Manutenção cancelada.','','warning');manCarregar('');}
  catch(e){showToast('Erro',e.erro||'','error');}
}

// ═══════════════════════════════════════════════════════
// LOG DE AUDITORIA
// ═══════════════════════════════════════════════════════
let auditState = { page:1, paginas:1 };

async function renderAuditoria(container) {
  auditState.page = 1;
  container.innerHTML = `
    <div class="section-header">
      <h2 class="section-title">🛡 Log de Auditoria</h2>
      <button class="btn btn-outline btn-sm" onclick="auditExportar()">📥 Exportar CSV</button>
    </div>

    <div class="search-bar">
      <select class="form-control" id="audit-modulo" style="width:auto;" onchange="auditCarregar()">
        <option value="">Todos os módulos</option>
        ${['Autenticação','Reservas','Salas','Usuários','Chamados','Impressoras','Comunicados','Bloqueios'].map(m=>`<option value="${m}">${m}</option>`).join('')}
      </select>
      <input type="date" class="form-control" id="audit-di" style="width:auto;" onchange="auditCarregar()">
      <input type="date" class="form-control" id="audit-df" style="width:auto;" onchange="auditCarregar()">
    </div>

    <div class="card">
      <div class="table-wrapper">
        <table>
          <thead><tr><th>Data/Hora</th><th>Usuário</th><th>Ação</th><th>Módulo</th><th>IP</th><th>Descrição</th></tr></thead>
          <tbody id="audit-tbody">${skeletonTable(8,6)}</tbody>
        </table>
      </div>
      <div id="audit-pagination" style="padding:0 16px;"></div>
    </div>
  `;

  auditCarregar();
}

async function auditCarregar(page) {
  if (page) auditState.page = page;
  const params = {
    page: auditState.page, limit: 20,
    modulo:    document.getElementById('audit-modulo')?.value || '',
    dataInicio:document.getElementById('audit-di')?.value || '',
    dataFim:   document.getElementById('audit-df')?.value || ''
  };
  Object.keys(params).forEach(k => !params[k] && delete params[k]);

  const tbody = document.getElementById('audit-tbody');
  if (tbody) tbody.innerHTML = skeletonTable(8,6);

  try {
    const data = await api.get('/admin/auditoria?' + new URLSearchParams(params));
    auditState.paginas = data.paginas;

    if (!data.dados.length) {
      tbody.innerHTML = `<tr><td colspan="6"><div class="empty-state"><p>Nenhum log encontrado.</p></div></td></tr>`;
      return;
    }

    tbody.innerHTML = data.dados.map(l => {
      const acaoKey = l.acao?.toUpperCase().split(' ')[0] || 'ACAO';
      return `
        <tr class="log-row">
          <td style="font-size:11px;white-space:nowrap;">${formatDateTime(l.createdAt)}</td>
          <td style="font-weight:600;font-size:12px;">${l.userNome||'Sistema'}</td>
          <td><span class="acao-chip acao-${acaoKey}">${l.acao}</span></td>
          <td style="font-size:12px;color:var(--texto-leve);">${l.modulo||'—'}</td>
          <td style="font-family:monospace;font-size:11px;color:var(--texto-leve);">${l.ip||'—'}</td>
          <td style="font-size:12px;max-width:280px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;" title="${l.descricao||''}">${l.descricao||'—'}</td>
        </tr>
      `;
    }).join('');
    renderPagination(document.getElementById('audit-pagination'), auditState.page, auditState.paginas, auditCarregar);
  } catch(e) {
    tbody.innerHTML = `<tr><td colspan="6" style="color:var(--erro);padding:16px;">${e.erro||'Erro ao carregar.'}</td></tr>`;
  }
}

async function auditExportar() {
  try {
    const data = await api.get('/admin/auditoria?limit=1000');
    exportCSV(data.dados.map(l=>({data:l.createdAt,usuario:l.userNome,acao:l.acao,modulo:l.modulo,ip:l.ip,descricao:l.descricao})), 'auditoria');
  } catch(e) { showToast('Erro','','error'); }
}

// ═══════════════════════════════════════════════════════
// DASHBOARD EXECUTIVO
// ═══════════════════════════════════════════════════════
async function renderDashboardExec(container) {
  container.innerHTML = `
    <div class="section-header">
      <h2 class="section-title">📈 Dashboard Executivo</h2>
      <span style="font-size:12px;color:var(--texto-leve);">Dados do mês atual · Atualizado agora</span>
    </div>
    <div id="exec-content">
      <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(200px,1fr));gap:14px;margin-bottom:24px;">
        ${[1,2,3,4,5,6].map(()=>`<div class="skeleton" style="height:90px;border-radius:10px;"></div>`).join('')}
      </div>
    </div>
  `;

  try {
    const data = await api.get('/admin/dashboard-executivo');
    const { kpis, rankSalas, chamadosCat, reservas7dias } = data;

    const maxRes = Math.max(...reservas7dias.map(d=>d.total),1);
    const maxSala = Math.max(...rankSalas.map(s=>s.total),1);
    const maxCat  = Math.max(...chamadosCat.map(c=>parseInt(c.total)),1);

    document.getElementById('exec-content').innerHTML = `
      <!-- KPIs -->
      <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(200px,1fr));gap:14px;margin-bottom:24px;">
        <div class="exec-kpi primary"><div class="exec-kpi-val">${kpis.totalReservasMes}</div><div class="exec-kpi-label">Reservas no mês</div></div>
        <div class="exec-kpi success"><div class="exec-kpi-val">${kpis.reservasHoje}</div><div class="exec-kpi-label">Reservas hoje</div></div>
        <div class="exec-kpi warning"><div class="exec-kpi-val">${kpis.chamadosAbertos}</div><div class="exec-kpi-label">Chamados abertos</div></div>
        <div class="exec-kpi danger"><div class="exec-kpi-val">${kpis.chamadosCriticos}</div><div class="exec-kpi-label">Chamados críticos</div></div>
        <div class="exec-kpi success"><div class="exec-kpi-val">${kpis.chamadosResolvidos}</div><div class="exec-kpi-label">Chamados resolvidos</div></div>
        <div class="exec-kpi primary"><div class="exec-kpi-val">${kpis.salasAtivas}<small style="font-size:16px;font-weight:400;">/${kpis.totalSalas}</small></div><div class="exec-kpi-label">Salas ativas</div></div>
        <div class="exec-kpi primary"><div class="exec-kpi-val">${kpis.totalUsuarios}</div><div class="exec-kpi-label">Usuários cadastrados</div></div>
        <div class="exec-kpi ${kpis.impressorasOffline>0?'danger':'success'}">
          <div class="exec-kpi-val">${kpis.totalImpressoras - kpis.impressorasOffline}<small style="font-size:16px;font-weight:400;">/${kpis.totalImpressoras}</small></div>
          <div class="exec-kpi-label">Impressoras online</div>
          ${kpis.impressorasOffline>0?`<div class="exec-kpi-sub" style="color:var(--erro);">⚠️ ${kpis.impressorasOffline} offline</div>`:''}
        </div>
      </div>

      <!-- Gráficos -->
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:20px;margin-bottom:20px;">

        <!-- Reservas últimos 7 dias -->
        <div class="card">
          <div class="card-header"><span class="card-title">📅 Reservas — Últimos 7 dias</span></div>
          <div class="card-body">
            <div style="display:flex;align-items:flex-end;gap:6px;height:80px;margin-bottom:8px;">
              ${reservas7dias.map(d => `
                <div style="flex:1;display:flex;flex-direction:column;align-items:center;gap:4px;">
                  <span style="font-size:10px;font-weight:700;color:var(--azul-principal);">${d.total||''}</span>
                  <div style="width:100%;background:var(--azul-principal);border-radius:4px 4px 0 0;height:${Math.max(d.total/maxRes*60,d.total?4:1)}px;transition:height .5s;"></div>
                </div>
              `).join('')}
            </div>
            <div style="display:flex;gap:6px;">
              ${reservas7dias.map(d => `<div style="flex:1;text-align:center;font-size:9px;color:var(--texto-leve);">${d.data.slice(5).replace('-','/')}</div>`).join('')}
            </div>
          </div>
        </div>

        <!-- Salas mais usadas -->
        <div class="card">
          <div class="card-header"><span class="card-title">🏫 Salas Mais Reservadas</span></div>
          <div class="card-body">
            <div class="bar-chart">
              ${rankSalas.map(s=>`
                <div class="bar-row">
                  <div class="bar-label" title="${s.nome}">${s.nome}</div>
                  <div class="bar-track"><div class="bar-fill blue" style="width:${Math.max(s.total/maxSala*100,2)}%">${s.total}</div></div>
                </div>
              `).join('')}
            </div>
          </div>
        </div>

        <!-- Chamados por categoria -->
        <div class="card">
          <div class="card-header"><span class="card-title">🎫 Chamados por Categoria</span></div>
          <div class="card-body">
            <div class="bar-chart">
              ${chamadosCat.map(c=>`
                <div class="bar-row">
                  <div class="bar-label">${c.categoria}</div>
                  <div class="bar-track"><div class="bar-fill orange" style="width:${Math.max(parseInt(c.total)/maxCat*100,2)}%">${c.total}</div></div>
                </div>
              `).join('')}
            </div>
          </div>
        </div>

        <!-- Taxa de ocupação estimada -->
        <div class="card">
          <div class="card-header"><span class="card-title">📊 Visão Geral do Mês</span></div>
          <div class="card-body">
            <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;">
              ${[
                { label:'Reservas ativas', val:kpis.reservasHoje, total:kpis.totalReservasMes, cor:'var(--azul-principal)' },
                { label:'Chamados resolvidos', val:kpis.chamadosResolvidos, total:kpis.chamadosResolvidos+kpis.chamadosAbertos, cor:'var(--verde-detalhe)' },
              ].map(item => {
                const pct = item.total>0 ? Math.round(item.val/item.total*100) : 0;
                return `
                  <div style="text-align:center;">
                    <div style="position:relative;width:70px;height:70px;margin:0 auto 8px;">
                      <svg viewBox="0 0 36 36" style="width:70px;height:70px;transform:rotate(-90deg);">
                        <circle cx="18" cy="18" r="15.9" fill="none" stroke="var(--cinza-medio)" stroke-width="3"/>
                        <circle cx="18" cy="18" r="15.9" fill="none" stroke="${item.cor}" stroke-width="3" stroke-dasharray="${pct} ${100-pct}" stroke-linecap="round"/>
                      </svg>
                      <div style="position:absolute;inset:0;display:flex;align-items:center;justify-content:center;font-size:14px;font-weight:800;color:var(--texto);">${pct}%</div>
                    </div>
                    <div style="font-size:11px;color:var(--texto-leve);">${item.label}</div>
                  </div>`;
              }).join('')}
            </div>
          </div>
        </div>

      </div>
    `;
  } catch(e) {
    document.getElementById('exec-content').innerHTML = `<div style="color:var(--erro);padding:20px;">${e.erro||'Erro ao carregar dashboard executivo.'}</div>`;
  }
}