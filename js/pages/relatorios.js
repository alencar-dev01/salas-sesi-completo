// js/pages/relatorios.js - Módulo de Relatórios Administrativos
let relState = { tipo: 'executivo', dados: null };

async function renderRelatorios(container) {
  container.innerHTML = `
    <div class="section-header">
      <h2 class="section-title">📊 Relatórios Administrativos</h2>
      <div style="display:flex;gap:8px;">
        <button class="btn btn-outline btn-sm" onclick="relExportarCSV()">📥 CSV</button>
        <button class="btn btn-outline btn-sm" onclick="relExportarPDF()">📄 PDF</button>
        <button class="btn btn-primary btn-sm" onclick="relGerar()">🔄 Gerar Relatório</button>
      </div>
    </div>

    <!-- Seleção de tipo -->
    <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(175px,1fr));gap:10px;margin-bottom:20px;">
      ${[
        { id:'executivo',       icon:'📈', nome:'Executivo Mensal',      desc:'KPIs e visão geral' },
        { id:'utilizacao',      icon:'📅', nome:'Utilização das Salas',  desc:'Histórico de reservas' },
        { id:'salas',           icon:'🏫', nome:'Reservas por Sala',     desc:'Ranking de salas' },
        { id:'usuarios_ativos', icon:'👥', nome:'Usuários Mais Ativos',  desc:'Quem mais reserva' },
        { id:'cancelamentos',   icon:'❌', nome:'Cancelamentos',          desc:'Reservas canceladas' },
        { id:'chamados',        icon:'🎫', nome:'Chamados',              desc:'Central de suporte' },
      ].map(r => `
        <div class="relatorio-card ${r.id === relState.tipo ? 'active' : ''}" id="relcard-${r.id}" onclick="relSelecionarTipo('${r.id}')">
          <div class="rel-icon">${r.icon}</div>
          <div class="rel-nome">${r.nome}</div>
          <div class="rel-desc">${r.desc}</div>
        </div>
      `).join('')}
    </div>

    <!-- Filtros -->
    <div class="card" style="margin-bottom:16px;">
      <div class="card-body">
        <div style="display:flex;align-items:center;gap:12px;flex-wrap:wrap;">
          <div>
            <label class="form-label">Período inicial</label>
            <input type="date" id="rel-di" class="form-control" value="${primeroDiaMes()}" style="width:auto;">
          </div>
          <div>
            <label class="form-label">Período final</label>
            <input type="date" id="rel-df" class="form-control" value="${todayISO()}" style="width:auto;">
          </div>
          <div id="rel-filtro-sala-wrap">
            <label class="form-label">Sala</label>
            <select id="rel-sala" class="form-control" style="width:auto;min-width:140px;">
              <option value="">Todas</option>
            </select>
          </div>
          <div style="margin-top:18px;">
            <button class="btn btn-primary" onclick="relGerar()">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:15px;height:15px;"><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/></svg>
              Gerar
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Resultado -->
    <div id="rel-resultado">
      <div class="empty-state">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" style="width:52px;height:52px;opacity:.25;margin:0 auto 12px;display:block;">
          <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/>
        </svg>
        <p>Selecione um tipo e clique em <strong>Gerar</strong>.</p>
      </div>
    </div>
  `;

  // Carrega salas no filtro
  api.getSalas({ status: 'ativa', limit: 100 }).then(s => {
    const sel = document.getElementById('rel-sala');
    if (sel) s.dados.forEach(x => sel.innerHTML += `<option value="${x.id}">${x.nome}</option>`);
  }).catch(() => {});

  // Gera executivo automático
  relGerar();
}

function primeroDiaMes() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-01`;
}

function relSelecionarTipo(tipo) {
  relState.tipo = tipo;
  document.querySelectorAll('.relatorio-card').forEach(c => c.classList.remove('active'));
  document.getElementById('relcard-' + tipo)?.classList.add('active');
}

async function relGerar() {
  const resultado = document.getElementById('rel-resultado');
  if (!resultado) return;
  resultado.innerHTML = `<div style="text-align:center;padding:40px;color:var(--texto-leve);">
    <svg class="loading-spin" style="width:32px;height:32px;margin:0 auto 12px;display:block;" viewBox="0 0 24 24" fill="none" stroke="var(--azul-principal)" stroke-width="2.5">
      <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/>
    </svg>
    Gerando relatório...
  </div>`;

  const params = {
    tipo: relState.tipo,
    dataInicio: document.getElementById('rel-di')?.value || primeroDiaMes(),
    dataFim: document.getElementById('rel-df')?.value || todayISO(),
    salaId: document.getElementById('rel-sala')?.value || ''
  };
  Object.keys(params).forEach(k => !params[k] && delete params[k]);

  try {
    const data = await api.get('/admin/relatorios?' + new URLSearchParams(params));
    relState.dados = data;
    relRenderResultado(data, resultado);
  } catch(e) {
    resultado.innerHTML = `<div style="color:var(--erro);padding:20px;text-align:center;">${e.erro || 'Erro ao gerar relatório.'}</div>`;
  }
}

function relRenderResultado(data, container) {
  const { tipo, dados, periodo } = data;
  const periodoLabel = periodo ? `${formatDate(periodo.di)} a ${formatDate(periodo.df)}` : '';

  switch(tipo) {

    case 'executivo':
      container.innerHTML = `
        <div style="margin-bottom:16px;font-size:12px;color:var(--texto-leve);">📅 Período: ${periodoLabel}</div>
        <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:14px;margin-bottom:24px;">
          ${[
            { label:'Reservas no período', val: dados.totalReservas,   cls:'primary' },
            { label:'Reservas ativas',     val: dados.reservasAtivas,  cls:'success' },
            { label:'Total de chamados',   val: dados.totalChamados,   cls:'primary' },
            { label:'Chamados abertos',    val: dados.chamadosAbertos, cls:'warning' },
            { label:'Chamados críticos',   val: dados.chamadosCriticos,cls:'danger'  },
            { label:'Salas ativas',        val: dados.salasAtivas + '/' + dados.totalSalas, cls:'success' },
          ].map(k => `
            <div class="exec-kpi ${k.cls}">
              <div class="exec-kpi-val">${k.val}</div>
              <div class="exec-kpi-label">${k.label}</div>
            </div>
          `).join('')}
        </div>
        <div style="background:rgba(0,74,152,0.05);border:1px solid rgba(0,74,152,0.15);border-radius:10px;padding:16px;font-size:13px;color:var(--texto-leve);">
          ℹ️ Use os outros tipos de relatório para detalhar cada métrica. Exporte em CSV ou PDF para apresentações.
        </div>
      `;
      break;

    case 'utilizacao':
      container.innerHTML = `
        <div style="margin-bottom:12px;display:flex;align-items:center;justify-content:space-between;">
          <div style="font-size:13px;color:var(--texto-leve);">📅 ${periodoLabel} — <strong>${dados.length}</strong> reservas</div>
        </div>
        <div class="card">
          <div class="table-wrapper">
            <table>
              <thead><tr><th>Título</th><th>Sala</th><th>Data</th><th>Horário</th><th>Responsável</th><th>Usuário</th><th>Status</th></tr></thead>
              <tbody>
                ${dados.length ? dados.map(r => `
                  <tr>
                    <td style="font-weight:600;">${r.titulo}</td>
                    <td>${r.sala?.nome||'—'}</td>
                    <td>${formatDate(r.data)}</td>
                    <td style="white-space:nowrap;">${r.horaInicio}–${r.horaFim}</td>
                    <td>${r.responsavel||'—'}</td>
                    <td>${r.usuario?.nome||'—'}</td>
                    <td>${statusBadge(r.status)}</td>
                  </tr>`).join('') : '<tr><td colspan="7" style="text-align:center;color:var(--texto-leve);padding:24px;">Nenhum dado no período.</td></tr>'}
              </tbody>
            </table>
          </div>
        </div>
      `;
      break;

    case 'salas': {
      const max = Math.max(...dados.map(s => s.totalReservas), 1);
      container.innerHTML = `
        <div style="margin-bottom:16px;font-size:13px;color:var(--texto-leve);">📅 ${periodoLabel}</div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:20px;">
          <div class="card">
            <div class="card-header"><span class="card-title">Reservas por Sala</span></div>
            <div class="card-body">
              <div class="bar-chart">
                ${dados.map(s => `
                  <div class="bar-row">
                    <div class="bar-label" title="${s.nome}">${s.nome}</div>
                    <div class="bar-track">
                      <div class="bar-fill blue" style="width:${Math.max(s.totalReservas/max*100,2)}%">${s.totalReservas}</div>
                    </div>
                  </div>
                `).join('')}
              </div>
            </div>
          </div>
          <div class="card">
            <div class="card-header"><span class="card-title">Tabela de Salas</span></div>
            <div class="table-wrapper">
              <table>
                <thead><tr><th>Sala</th><th>Capacidade</th><th>Reservas</th><th>Status</th></tr></thead>
                <tbody>
                  ${dados.map(s => `<tr><td style="font-weight:600;">${s.nome}</td><td>${s.capacidade}</td><td><strong>${s.totalReservas}</strong></td><td>${statusBadge(s.status)}</td></tr>`).join('')}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      `;
      break;
    }

    case 'usuarios_ativos': {
      const max = Math.max(...dados.map(u => u.totalReservas), 1);
      container.innerHTML = `
        <div style="margin-bottom:16px;font-size:13px;color:var(--texto-leve);">📅 ${periodoLabel}</div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:20px;">
          <div class="card">
            <div class="card-header"><span class="card-title">Ranking de Usuários</span></div>
            <div class="card-body">
              <div class="bar-chart">
                ${dados.slice(0,10).map((u,i) => `
                  <div class="bar-row">
                    <div class="bar-label" title="${u.nome}">${i+1}. ${u.nome.split(' ')[0]}</div>
                    <div class="bar-track">
                      <div class="bar-fill ${['blue','green','orange'][i%3]}" style="width:${Math.max(u.totalReservas/max*100,2)}%">${u.totalReservas}</div>
                    </div>
                  </div>
                `).join('')}
              </div>
            </div>
          </div>
          <div class="card">
            <div class="table-wrapper">
              <table>
                <thead><tr><th>#</th><th>Usuário</th><th>Perfil</th><th>Reservas</th></tr></thead>
                <tbody>
                  ${dados.map((u,i) => `<tr><td style="color:var(--texto-leve);">${i+1}</td><td style="font-weight:600;">${u.nome}</td><td>${statusBadge(u.perfil)}</td><td><strong>${u.totalReservas}</strong></td></tr>`).join('')}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      `;
      break;
    }

    case 'cancelamentos':
      container.innerHTML = `
        <div style="margin-bottom:12px;font-size:13px;color:var(--texto-leve);">📅 ${periodoLabel} — <strong>${dados.length}</strong> cancelamentos</div>
        <div class="card">
          <div class="table-wrapper">
            <table>
              <thead><tr><th>Título</th><th>Sala</th><th>Data</th><th>Horário</th><th>Usuário</th><th>Cancelado em</th></tr></thead>
              <tbody>
                ${dados.length ? dados.map(r => `
                  <tr>
                    <td style="font-weight:600;">${r.titulo}</td>
                    <td>${r.sala?.nome||'—'}</td>
                    <td>${formatDate(r.data)}</td>
                    <td>${r.horaInicio}–${r.horaFim}</td>
                    <td>${r.usuario?.nome||'—'}</td>
                    <td style="font-size:11px;color:var(--texto-leve);">${formatDateTime(r.updatedAt)}</td>
                  </tr>`).join('') : '<tr><td colspan="6" style="text-align:center;padding:24px;color:var(--texto-leve);">Nenhum cancelamento no período.</td></tr>'}
              </tbody>
            </table>
          </div>
        </div>
      `;
      break;

    case 'chamados': {
      const abertos   = dados.filter(c => c.status === 'Aberto').length;
      const resolvidos = dados.filter(c => c.status === 'Resolvido').length;
      const criticos  = dados.filter(c => c.prioridade === 'Crítica').length;
      const catCount  = {};
      dados.forEach(c => { catCount[c.categoria] = (catCount[c.categoria]||0) + 1; });
      const maxCat = Math.max(...Object.values(catCount), 1);

      container.innerHTML = `
        <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:12px;margin-bottom:20px;">
          <div class="exec-kpi primary"><div class="exec-kpi-val">${dados.length}</div><div class="exec-kpi-label">Total</div></div>
          <div class="exec-kpi warning"><div class="exec-kpi-val">${abertos}</div><div class="exec-kpi-label">Abertos</div></div>
          <div class="exec-kpi success"><div class="exec-kpi-val">${resolvidos}</div><div class="exec-kpi-label">Resolvidos</div></div>
          <div class="exec-kpi danger"><div class="exec-kpi-val">${criticos}</div><div class="exec-kpi-label">Críticos</div></div>
        </div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:20px;">
          <div class="card">
            <div class="card-header"><span class="card-title">Por Categoria</span></div>
            <div class="card-body">
              <div class="bar-chart">
                ${Object.entries(catCount).sort((a,b)=>b[1]-a[1]).map(([cat,cnt]) => `
                  <div class="bar-row">
                    <div class="bar-label">${cat}</div>
                    <div class="bar-track"><div class="bar-fill orange" style="width:${Math.max(cnt/maxCat*100,2)}%">${cnt}</div></div>
                  </div>
                `).join('')}
              </div>
            </div>
          </div>
          <div class="card">
            <div class="table-wrapper">
              <table>
                <thead><tr><th>#</th><th>Título</th><th>Status</th><th>Prioridade</th></tr></thead>
                <tbody>
                  ${dados.slice(0,15).map(c => `
                    <tr>
                      <td style="color:var(--texto-leve);font-size:12px;">${c.id}</td>
                      <td style="font-weight:600;font-size:12px;">${c.titulo}</td>
                      <td><span class="badge badge-${c.status==='Resolvido'?'green':c.status==='Aberto'?'orange':'gray'}" style="font-size:10px;">${c.status}</span></td>
                      <td><span class="prioridade-badge pri-${c.prioridade}" style="font-size:10px;">${c.prioridade}</span></td>
                    </tr>`).join('')}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      `;
      break;
    }

    default:
      container.innerHTML = `<div class="empty-state"><p>Tipo de relatório não reconhecido.</p></div>`;
  }
}

function relExportarCSV() {
  if (!relState.dados?.dados?.length && !Array.isArray(relState.dados?.dados)) {
    showToast('Gere um relatório primeiro.', '', 'warning'); return;
  }
  const dados = relState.dados.dados;
  if (!dados?.length) { showToast('Sem dados para exportar.', '', 'warning'); return; }
  exportCSV(dados, `relatorio-${relState.tipo}`);
}

function relExportarPDF() {
  const resultado = document.getElementById('rel-resultado');
  if (!resultado || !relState.dados) { showToast('Gere um relatório primeiro.', '', 'warning'); return; }

  const html = `
    <!DOCTYPE html><html lang="pt-BR"><head>
      <meta charset="UTF-8">
      <title>Relatório SESI/SENAI — ${relState.tipo}</title>
      <style>
        body { font-family: 'Segoe UI', sans-serif; color: #243B53; padding: 30px; font-size: 13px; }
        h1 { color: #004A98; font-size: 20px; margin-bottom: 4px; }
        .sub { color: #627D98; font-size: 12px; margin-bottom: 24px; }
        table { width: 100%; border-collapse: collapse; font-size: 12px; }
        th { background: #004A98; color: white; padding: 8px 10px; text-align: left; }
        td { padding: 7px 10px; border-bottom: 1px solid #D9E2EC; }
        tr:nth-child(even) td { background: #F5F7FA; }
        .badge { padding: 2px 8px; border-radius: 10px; font-size: 10px; font-weight: 700; }
      </style>
    </head><body>
      <h1>📊 Relatório SESI/SENAI</h1>
      <div class="sub">Tipo: ${relState.tipo} · Gerado em: ${new Date().toLocaleString('pt-BR')}</div>
      ${resultado.innerHTML}
      <script>window.onload = () => { window.print(); }<\/script>
    </body></html>
  `;

  const w = window.open('', '_blank');
  w.document.write(html);
  w.document.close();
}