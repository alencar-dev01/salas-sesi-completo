// js/pages/impressoras.js
let impState = { page:1, paginas:1, dados:[] };

async function renderImpressoras(container) {
  container.innerHTML = `
    <div class="section-header">
      <h2 class="section-title">🖨️ Impressoras</h2>
      <div style="display:flex;gap:8px;">
        <button class="btn btn-outline btn-sm" onclick="impExportar()">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3"/></svg> CSV
        </button>
        <button class="btn btn-primary btn-sm" onclick="impAbrirModal()">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 5v14M5 12h14"/></svg>
          Nova Impressora
        </button>
      </div>
    </div>

    <!-- Dashboard KPIs -->
    <div id="imp-kpis" style="display:grid;grid-template-columns:repeat(auto-fit,minmax(160px,1fr));gap:14px;margin-bottom:20px;">
      ${[1,2,3,4].map(()=>`<div class="skeleton" style="height:76px;border-radius:10px;"></div>`).join('')}
    </div>

    <div class="search-bar">
      <div class="search-input-wrap">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/></svg>
        <input type="text" id="imp-busca" placeholder="Nome, setor, IP, modelo..." oninput="impDebounce()">
      </div>
      <select class="form-control" id="imp-status" style="width:auto;" onchange="impCarregar()">
        <option value="">Todos</option>
        <option value="Online">🟢 Online</option>
        <option value="Offline">🔴 Offline</option>
        <option value="Em manutenção">🟠 Em manutenção</option>
        <option value="Desativada">⚫ Desativada</option>
      </select>
    </div>

    <div id="imp-grid" style="display:grid;grid-template-columns:repeat(auto-fill,minmax(300px,1fr));gap:14px;">
      ${[1,2,3,4,5,6].map(()=>`<div class="skeleton" style="height:160px;border-radius:10px;"></div>`).join('')}
    </div>
    <div id="imp-pagination" style="padding:8px 0;"></div>
  `;

  impCarregarKPIs();
  impCarregar();
}

async function impCarregarKPIs() {
  try {
    const d = await api.get('/impressoras/dashboard');
    document.getElementById('imp-kpis').innerHTML = `
      <div class="stat-card"><div class="stat-icon blue"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="6 9 6 2 18 2 18 9"/><path d="M6 18H4a2 2 0 01-2-2v-5a2 2 0 012-2h16a2 2 0 012 2v5a2 2 0 01-2 2h-2"/><rect x="6" y="14" width="12" height="8"/></svg></div><div class="stat-info"><div class="stat-value">${d.total}</div><div class="stat-label">Total</div></div></div>
      <div class="stat-card"><div class="stat-icon green"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/></svg></div><div class="stat-info"><div class="stat-value">${d.online}</div><div class="stat-label">Online</div></div></div>
      <div class="stat-card"><div class="stat-icon red"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="4.93" y1="4.93" x2="19.07" y2="19.07"/></svg></div><div class="stat-info"><div class="stat-value">${d.offline}</div><div class="stat-label">Offline</div></div></div>
      <div class="stat-card"><div class="stat-icon orange"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14.7 6.3a1 1 0 000 1.4l1.6 1.6a1 1 0 001.4 0l3.77-3.77a6 6 0 01-7.94 7.94l-6.91 6.91a2.12 2.12 0 01-3-3l6.91-6.91a6 6 0 017.94-7.94l-3.76 3.76z"/></svg></div><div class="stat-info"><div class="stat-value">${d.manutencao}</div><div class="stat-label">Em manutenção</div></div></div>
    `;
  } catch(e) {}
}

let impTimer;
function impDebounce() { clearTimeout(impTimer); impTimer = setTimeout(impCarregar, 400); }

async function impCarregar(page) {
  if (page) impState.page = page;
  const params = { page: impState.page, limit: 12, busca: document.getElementById('imp-busca')?.value||'', status: document.getElementById('imp-status')?.value||'' };
  Object.keys(params).forEach(k => !params[k] && delete params[k]);

  const grid = document.getElementById('imp-grid');
  if (grid) grid.innerHTML = [1,2,3].map(()=>`<div class="skeleton" style="height:160px;border-radius:10px;"></div>`).join('');

  try {
    const data = await api.get('/impressoras?' + new URLSearchParams(params));
    impState.dados = data.dados; impState.paginas = data.paginas;

    if (!data.dados.length) { grid.innerHTML = `<div class="empty-state" style="grid-column:1/-1;"><p>Nenhuma impressora encontrada.</p></div>`; return; }

    grid.innerHTML = data.dados.map(imp => {
      const stColor = { Online:'#4a8a10', Offline:'#b02a37', 'Em manutenção':'#c55a10', Desativada:'#999' };
      const stDot   = { Online:'var(--verde-detalhe)', Offline:'var(--erro)', 'Em manutenção':'var(--laranja-detalhe)', Desativada:'var(--cinza-escuro)' };
      return `
        <div class="impressora-card ${imp.status.replace(' ','-')}" onclick="impAbrirDetalhe(${imp.id})">
          <div style="display:flex;align-items:flex-start;justify-content:space-between;margin-bottom:10px;">
            <div>
              <div style="font-weight:800;font-size:14px;color:var(--texto);">${imp.nome}</div>
              <div style="font-size:11px;color:var(--texto-leve);">${imp.modelo||'—'} · ${imp.fabricante||'—'}</div>
            </div>
            <span style="display:flex;align-items:center;gap:5px;font-size:11px;font-weight:700;color:${stColor[imp.status]};">
              <span style="width:8px;height:8px;border-radius:50%;background:${stDot[imp.status]};display:inline-block;"></span>
              ${imp.status}
            </span>
          </div>
          <div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:10px;">
            ${imp.enderecoIp ? `<span class="ip-chip" onclick="event.stopPropagation();copiarTexto('${imp.enderecoIp}','IP copiado!')">
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/></svg>
              ${imp.enderecoIp}
            </span>` : ''}
            ${imp.setor ? `<span style="font-size:11px;background:var(--cinza-claro);padding:2px 8px;border-radius:6px;color:var(--texto-leve);">📍 ${imp.setor}</span>` : ''}
          </div>
          <div style="display:flex;justify-content:space-between;align-items:center;">
            <span style="font-size:11px;color:var(--texto-leve);">${imp.localizacao||'—'}</span>
            <div style="display:flex;gap:5px;">
              ${imp.enderecoIp ? `<button class="btn btn-outline btn-sm btn-icon" title="Abrir página web" onclick="event.stopPropagation();window.open('http://${imp.enderecoIp}','_blank')">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6M15 3h6v6M10 14L21 3"/></svg>
              </button>` : ''}
              <button class="btn btn-outline btn-sm btn-icon" title="Manutenção" onclick="event.stopPropagation();impAbrirManutencao(${imp.id})">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14.7 6.3a1 1 0 000 1.4l1.6 1.6a1 1 0 001.4 0l3.77-3.77a6 6 0 01-7.94 7.94l-6.91 6.91a2.12 2.12 0 01-3-3l6.91-6.91a6 6 0 017.94-7.94l-3.76 3.76z"/></svg>
              </button>
              <button class="btn btn-primary btn-sm btn-icon" title="QR Code" onclick="event.stopPropagation();impQRCode(${imp.id},'${imp.nome}')">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><path d="M14 14h.01M18 14h.01M14 18h.01M18 18h.01M21 14v4"/></svg>
              </button>
            </div>
          </div>
        </div>
      `;
    }).join('');
    renderPagination(document.getElementById('imp-pagination'), impState.page, impState.paginas, impCarregar);
  } catch(e) { grid.innerHTML = `<div style="color:var(--erro);padding:16px;grid-column:1/-1;">${e.erro||'Erro ao carregar.'}</div>`; }
}

async function impAbrirDetalhe(id) {
  try {
    const imp = await api.get('/impressoras/'+id);
    createModal({
      id:'modal-imp-detalhe', title:`🖨️ ${imp.nome}`, size:'modal-lg',
      body:`
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;font-size:13px;margin-bottom:16px;">
          <div><strong>Modelo:</strong> ${imp.modelo||'—'}</div>
          <div><strong>Fabricante:</strong> ${imp.fabricante||'—'}</div>
          <div><strong>Setor:</strong> ${imp.setor||'—'}</div>
          <div><strong>Localização:</strong> ${imp.localizacao||'—'}</div>
          <div><strong>IP:</strong> ${imp.enderecoIp ? `<span class="ip-chip" onclick="copiarTexto('${imp.enderecoIp}','IP copiado!')">${imp.enderecoIp}</span>` : '—'}</div>
          <div><strong>Porta:</strong> ${imp.porta||'—'}</div>
          <div><strong>Conexão:</strong> ${imp.tipoConexao||'—'}</div>
          <div><strong>Compartilhamento:</strong> ${imp.compartilhamento ? `<span class="ip-chip" onclick="copiarTexto('${imp.compartilhamento}','Nome copiado!')">${imp.compartilhamento}</span>` : '—'}</div>
          <div><strong>Status:</strong> ${statusBadge(imp.status)}</div>
        </div>
        ${imp.observacoes ? `<div style="background:var(--cinza-claro);border-radius:8px;padding:10px;margin-bottom:16px;font-size:13px;">${imp.observacoes}</div>` : ''}
        <div class="divider"></div>
        <div style="font-weight:700;margin-bottom:10px;">🔧 Histórico de Manutenções</div>
        ${(imp.manutencoes||[]).length ? imp.manutencoes.map(m=>`
          <div style="border:1px solid var(--cinza-medio);border-radius:8px;padding:10px;margin-bottom:8px;font-size:12px;">
            <div style="font-weight:700;color:var(--texto);">${formatDate(m.dataManutencao)} — ${m.tecnicoNome||m.tecnico?.nome||'—'}</div>
            <div style="color:var(--texto-leve);margin-top:4px;"><strong>Problema:</strong> ${m.problema}</div>
            ${m.solucao ? `<div style="color:var(--texto-leve);"><strong>Solução:</strong> ${m.solucao}</div>` : ''}
            ${m.pecasSubstituidas ? `<div style="color:var(--texto-leve);"><strong>Peças:</strong> ${m.pecasSubstituidas}</div>` : ''}
          </div>`).join('') : '<p style="color:var(--texto-leve);font-size:13px;">Nenhuma manutenção registrada.</p>'}
        <div style="margin-top:12px;display:flex;gap:8px;flex-wrap:wrap;">
          <button class="btn btn-outline btn-sm" onclick="impAbrirManutencao(${imp.id})">+ Registrar Manutenção</button>
          <button class="btn btn-outline btn-sm" onclick="impAbrirModal(${imp.id})">✏️ Editar</button>
          <button class="btn btn-primary btn-sm" onclick="impQRCode(${imp.id},'${imp.nome}')">📱 QR Code</button>
        </div>
      `,
      footer:`<button class="btn btn-outline" onclick="closeModal('modal-imp-detalhe')">Fechar</button>`
    });
    openModal('modal-imp-detalhe');
  } catch(e) { showToast('Erro','',e); }
}

function impAbrirModal(id=null) {
  // Carrega dados se edição
  const load = id ? api.get('/impressoras/'+id) : Promise.resolve(null);
  load.then(imp => {
    const v = (f) => imp?.[f]||'';
    createModal({
      id:'modal-imp-form', title: imp ? `Editar ${imp.nome}` : 'Nova Impressora',
      body:`
        <div class="form-row form-row-2">
          <div class="form-group"><label class="form-label">Nome *</label><input id="if-nome" class="form-control" value="${v('nome')}" placeholder="Ex: HP LaserJet 01"></div>
          <div class="form-group"><label class="form-label">Setor</label><input id="if-setor" class="form-control" value="${v('setor')}" placeholder="TI, RH, Financeiro..."></div>
          <div class="form-group"><label class="form-label">Localização</label><input id="if-loc" class="form-control" value="${v('localizacao')}" placeholder="Bloco A, 1º Andar"></div>
          <div class="form-group"><label class="form-label">Modelo</label><input id="if-modelo" class="form-control" value="${v('modelo')}" placeholder="LaserJet Pro M404n"></div>
          <div class="form-group"><label class="form-label">Fabricante</label><input id="if-fab" class="form-control" value="${v('fabricante')}" placeholder="HP, Epson, Canon..."></div>
          <div class="form-group"><label class="form-label">Endereço IP</label><input id="if-ip" class="form-control" value="${v('enderecoIp')}" placeholder="192.168.1.100"></div>
          <div class="form-group"><label class="form-label">Porta</label><input id="if-porta" class="form-control" value="${v('porta')||'9100'}" placeholder="9100"></div>
          <div class="form-group"><label class="form-label">Tipo de Conexão</label>
            <select id="if-tipo" class="form-control">
              ${['USB','Rede','Wi-Fi','Bluetooth'].map(t=>`<option value="${t}" ${v('tipoConexao')===t?'selected':''}>${t}</option>`).join('')}
            </select>
          </div>
          <div class="form-group"><label class="form-label">Nome de Compartilhamento</label><input id="if-comp" class="form-control" value="${v('compartilhamento')}" placeholder="\\\\servidor\\impressora1"></div>
          <div class="form-group"><label class="form-label">Status</label>
            <select id="if-status" class="form-control">
              ${['Online','Offline','Em manutenção','Desativada'].map(s=>`<option value="${s}" ${v('status')===s?'selected':''}>${s}</option>`).join('')}
            </select>
          </div>
        </div>
        <div class="form-group"><label class="form-label">Observações</label><textarea id="if-obs" class="form-control" rows="2">${v('observacoes')}</textarea></div>
        <div id="if-err" class="hidden" style="color:var(--erro);font-size:13px;padding:10px;background:rgba(220,53,69,.08);border-radius:8px;"></div>
      `,
      footer:`<button class="btn btn-outline" onclick="closeModal('modal-imp-form')">Cancelar</button><button class="btn btn-primary" id="if-save" onclick="impSalvar(${id||'null'})">${imp?'Salvar':'Criar'}</button>`
    });
    openModal('modal-imp-form');
  });
}

async function impSalvar(id) {
  const btn=document.getElementById('if-save'), err=document.getElementById('if-err');
  err.classList.add('hidden');
  const dados={nome:document.getElementById('if-nome')?.value?.trim(),setor:document.getElementById('if-setor')?.value,localizacao:document.getElementById('if-loc')?.value,modelo:document.getElementById('if-modelo')?.value,fabricante:document.getElementById('if-fab')?.value,enderecoIp:document.getElementById('if-ip')?.value,porta:document.getElementById('if-porta')?.value,tipoConexao:document.getElementById('if-tipo')?.value,compartilhamento:document.getElementById('if-comp')?.value,status:document.getElementById('if-status')?.value,observacoes:document.getElementById('if-obs')?.value};
  if(!dados.nome){err.textContent='Nome é obrigatório.';err.classList.remove('hidden');return;}
  btn.disabled=true;btn.textContent='Salvando...';
  try{
    id ? await api.put('/impressoras/'+id,dados) : await api.post('/impressoras',dados);
    showToast(id?'Impressora atualizada!':'Impressora criada!',dados.nome,'success');
    closeModal('modal-imp-form'); impCarregar(); impCarregarKPIs();
  }catch(e){err.textContent=e.erro||'Erro ao salvar.';err.classList.remove('hidden');}
  finally{btn.disabled=false;btn.textContent=id?'Salvar':'Criar';}
}

function impAbrirManutencao(id) {
  createModal({
    id:'modal-imp-man', title:'🔧 Registrar Manutenção',
    body:`
      <div class="form-group"><label class="form-label">Problema encontrado *</label><textarea id="im-prob" class="form-control" rows="3" placeholder="Descreva o problema..."></textarea></div>
      <div class="form-group"><label class="form-label">Solução aplicada</label><textarea id="im-sol" class="form-control" rows="2" placeholder="Descreva a solução..."></textarea></div>
      <div class="form-row form-row-2">
        <div class="form-group"><label class="form-label">Peças substituídas</label><input id="im-pecas" class="form-control" placeholder="Cartucho, fusível..."></div>
        <div class="form-group"><label class="form-label">Data *</label><input id="im-data" type="date" class="form-control" value="${todayISO()}"></div>
      </div>
      <div class="form-group"><label class="form-label">Observações</label><textarea id="im-obs" class="form-control" rows="2"></textarea></div>
      <div id="im-err" class="hidden" style="color:var(--erro);font-size:13px;padding:10px;background:rgba(220,53,69,.08);border-radius:8px;"></div>
    `,
    footer:`<button class="btn btn-outline" onclick="closeModal('modal-imp-man')">Cancelar</button><button class="btn btn-primary" id="im-save" onclick="impSalvarManutencao(${id})">Registrar</button>`
  });
  openModal('modal-imp-man');
}

async function impSalvarManutencao(id) {
  const btn=document.getElementById('im-save'), err=document.getElementById('im-err');
  const dados={problema:document.getElementById('im-prob')?.value?.trim(),solucao:document.getElementById('im-sol')?.value,pecasSubstituidas:document.getElementById('im-pecas')?.value,dataManutencao:document.getElementById('im-data')?.value,observacoes:document.getElementById('im-obs')?.value};
  if(!dados.problema||!dados.dataManutencao){err.textContent='Problema e data são obrigatórios.';err.classList.remove('hidden');return;}
  btn.disabled=true;btn.textContent='Salvando...';
  try{await api.post('/impressoras/'+id+'/manutencao',dados);showToast('Manutenção registrada!','','success');closeModal('modal-imp-man');}
  catch(e){err.textContent=e.erro||'Erro.';err.classList.remove('hidden');}
  finally{btn.disabled=false;btn.textContent='Registrar';}
}

function impQRCode(id, nome) {
  const url = `${location.origin}/impressoras-qr.html?id=${id}`;
  const qr = gerarQRCodeSVG(url, 200);
  createModal({
    id:'modal-imp-qr', title:`📱 QR Code — ${nome}`,
    body:`
      <div style="text-align:center;">
        <div class="qr-wrapper" style="margin:0 auto;">
          <div id="qr-canvas">${qr}</div>
          <div style="font-size:12px;color:var(--texto-leve);margin-top:8px;">${nome}</div>
          <div style="font-size:10px;color:var(--cinza-escuro);">${url}</div>
        </div>
        <div style="margin-top:14px;display:flex;gap:8px;justify-content:center;">
          <button class="btn btn-outline btn-sm" onclick="impPrintQR()">🖨️ Imprimir</button>
          <button class="btn btn-primary btn-sm" onclick="copiarTexto('${url}','URL copiada!')">📋 Copiar URL</button>
        </div>
      </div>
    `,
    footer:`<button class="btn btn-outline" onclick="closeModal('modal-imp-qr')">Fechar</button>`
  });
  openModal('modal-imp-qr');
}

function impPrintQR() {
  const qr = document.getElementById('qr-canvas')?.innerHTML;
  if (!qr) return;
  const w = window.open('','_blank');
  w.document.write(`<html><body style="display:flex;justify-content:center;align-items:center;padding:40px;">${qr}</body></html>`);
  w.print(); w.close();
}

function impExportar() {
  if (!impState.dados.length) { showToast('Sem dados','','warning'); return; }
  exportCSV(impState.dados.map(i=>({ id:i.id,nome:i.nome,setor:i.setor,modelo:i.modelo,fabricante:i.fabricante,ip:i.enderecoIp,status:i.status,localizacao:i.localizacao })), 'impressoras');
}

function copiarTexto(texto, msg='Copiado!') {
  navigator.clipboard?.writeText(texto).then(()=>showToast(msg,'','success')).catch(()=>{});
}

// Gerador de QR Code simples via API de terceiros
function gerarQRCodeSVG(texto, size=200) {
  const encodedText = encodeURIComponent(texto);
  return `<img src="https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&data=${encodedText}" width="${size}" height="${size}" style="border-radius:8px;" alt="QR Code">`;
}