// js/pages/relatorios.js

async function renderRelatorios(container) {
  // Proteção extra de segurança no front
  if (currentUser?.perfil !== 'administrador') {
    container.innerHTML = `<div class="empty-state"><p>Acesso restrito a administradores.</p></div>`;
    return;
  }

  container.innerHTML = `
    <div class="section-header">
      <h2 class="section-title">📊 Relatórios do Sistema</h2>
    </div>

    <div style="background:var(--branco); border: 1px solid var(--cinza-borda); border-radius:12px; padding:24px; margin-bottom: 24px; box-shadow: 0 2px 8px rgba(0,0,0,0.02);">
      <h3 style="margin-top:0; margin-bottom: 16px; font-size: 16px; color: var(--texto);">Configurar Relatório</h3>
      
      <div class="form-row form-row-3" style="align-items: flex-end;">
        <div class="form-group" style="margin-bottom: 0;">
          <label class="form-label">Fonte de Dados</label>
          <select id="rel-tipo" class="form-control">
            <option value="chamados">Histórico de Chamados</option>
            <option value="reservas">Histórico de Reservas</option>
          </select>
        </div>
        
        <div class="form-group" style="margin-bottom: 0;">
          <label class="form-label">Data Inicial</label>
          <input type="date" id="rel-inicio" class="form-control">
        </div>
        
        <div class="form-group" style="margin-bottom: 0;">
          <label class="form-label">Data Final</label>
          <input type="date" id="rel-fim" class="form-control">
        </div>
      </div>
      
      <div style="margin-top: 20px; display: flex; gap: 10px;">
        <button class="btn btn-primary" onclick="relatorioGerar()" id="btn-gerar-rel">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21.21 15.89A10 10 0 1 1 8 2.83"></path><path d="M22 12A10 10 0 0 0 12 2v10z"></path></svg>
          Gerar Prévia
        </button>
        <button class="btn btn-outline" onclick="relatorioExportarCSV()" id="btn-export-rel" style="display:none;">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>
          Baixar CSV
        </button>
      </div>
    </div>

    <div id="rel-resultado">
      <div class="empty-state" style="padding: 40px;">
        <p>Selecione os filtros acima e clique em "Gerar Prévia" para visualizar os dados.</p>
      </div>
    </div>
  `;

  // Preenche as datas com o mês atual por padrão
  const hoje = new Date();
  const primeiroDia = new Date(hoje.getFullYear(), hoje.getMonth(), 1);
  document.getElementById('rel-inicio').value = primeiroDia.toISOString().split('T')[0];
  document.getElementById('rel-fim').value = hoje.toISOString().split('T')[0];
}

let relatorioDataAtual = [];

async function relatorioGerar() {
  const tipo = document.getElementById('rel-tipo').value;
  const dataIni = document.getElementById('rel-inicio').value;
  const dataFim = document.getElementById('rel-fim').value;
  const container = document.getElementById('rel-resultado');
  const btnExportar = document.getElementById('btn-export-rel');
  const btnGerar = document.getElementById('btn-gerar-rel');

  if (!dataIni || !dataFim) {
    showToast('Atenção', 'Preencha as datas inicial e final.', 'error');
    return;
  }

  container.innerHTML = `<div class="skeleton" style="height:300px; border-radius:12px;"></div>`;
  btnGerar.disabled = true;
  btnExportar.style.display = 'none';

  try {
    // Faz a busca na API com limite alto para pegar todos os dados do período
    const endpoint = `/${tipo}?limit=5000`; 
    const response = await api.get(endpoint);
    let dados = response.dados || [];

    // Filtra no frontend pelas datas selecionadas (fallback caso a API não tenha filtro de data nativo)
    dados = dados.filter(item => {
      const dataItem = (item.createdAt || item.data).split('T')[0];
      return dataItem >= dataIni && dataItem <= dataFim;
    });

    relatorioDataAtual = dados; // Salva para o export CSV

    if (dados.length === 0) {
      container.innerHTML = `<div class="empty-state"><p>Nenhum registro encontrado neste período.</p></div>`;
      return;
    }

    btnExportar.style.display = 'inline-flex';

    // Renderiza a tabela de prévia dependendo do tipo
    if (tipo === 'chamados') {
      _renderTabelaChamados(container, dados);
    } else {
      _renderTabelaReservas(container, dados);
    }

  } catch (e) {
    container.innerHTML = `<div class="empty-state"><p style="color:var(--erro)">Erro ao buscar dados: ${e.erro || 'Falha no servidor'}</p></div>`;
  } finally {
    btnGerar.disabled = false;
  }
}

function _renderTabelaChamados(container, dados) {
  const abertos = dados.filter(c => c.status !== 'Resolvido' && c.status !== 'Encerrado').length;
  
  let html = `
    <div style="display:flex; gap:16px; margin-bottom: 20px;">
      <div class="stat-card"><div class="stat-info"><div class="stat-value">${dados.length}</div><div class="stat-label">Total de Chamados</div></div></div>
      <div class="stat-card"><div class="stat-info"><div class="stat-value">${abertos}</div><div class="stat-label">Pendentes no Período</div></div></div>
    </div>
    <div class="table-container" style="max-height: 400px; overflow-y: auto;">
      <table class="table">
        <thead style="position: sticky; top: 0; background: var(--branco);">
          <tr>
            <th>ID</th>
            <th>Data</th>
            <th>Título</th>
            <th>Categoria</th>
            <th>Status</th>
            <th>Solicitante</th>
          </tr>
        </thead>
        <tbody>
          ${dados.map(c => `
            <tr>
              <td>#${c.id}</td>
              <td>${formatDate(c.createdAt.split('T')[0])}</td>
              <td>${c.titulo}</td>
              <td>${c.categoria}</td>
              <td><span class="badge ${c.status.includes('Resolvido') ? 'badge-green' : 'badge-orange'}">${c.status}</span></td>
              <td>${c.abertoPor?.nome || '—'}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    </div>
  `;
  container.innerHTML = html;
}

function _renderTabelaReservas(container, dados) {
  let html = `
    <div style="display:flex; gap:16px; margin-bottom: 20px;">
      <div class="stat-card"><div class="stat-info"><div class="stat-value">${dados.length}</div><div class="stat-label">Total de Reservas</div></div></div>
    </div>
    <div class="table-container" style="max-height: 400px; overflow-y: auto;">
      <table class="table">
        <thead style="position: sticky; top: 0; background: var(--branco);">
          <tr>
            <th>ID</th>
            <th>Data Uso</th>
            <th>Sala</th>
            <th>Turno</th>
            <th>Professor</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          ${dados.map(r => `
            <tr>
              <td>#${r.id}</td>
              <td>${formatDate(r.data)}</td>
              <td>${r.sala?.nome || '—'}</td>
              <td>${r.turno}</td>
              <td>${r.usuario?.nome || '—'}</td>
              <td><span class="badge badge-blue">${r.status || 'Confirmada'}</span></td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    </div>
  `;
  container.innerHTML = html;
}

function relatorioExportarCSV() {
  if (!relatorioDataAtual.length) return;
  
  const tipo = document.getElementById('rel-tipo').value;
  let csvContent = "data:text/csv;charset=utf-8,";
  
  if (tipo === 'chamados') {
    csvContent += "ID;Data Criação;Título;Categoria;Prioridade;Status;Solicitante;Técnico\n";
    relatorioDataAtual.forEach(c => {
      const row = [
        c.id, c.createdAt?.split('T')[0], c.titulo, c.categoria, c.prioridade, 
        c.status, c.abertoPor?.nome || '', c.tecnico?.nome || ''
      ].map(e => `"${(e||'').toString().replace(/"/g, '""')}"`).join(";");
      csvContent += row + "\n";
    });
  } else {
    csvContent += "ID;Data Uso;Sala;Turno;Professor;Status\n";
    relatorioDataAtual.forEach(r => {
      const row = [
        r.id, r.data, r.sala?.nome || '', r.turno, r.usuario?.nome || '', r.status || ''
      ].map(e => `"${(e||'').toString().replace(/"/g, '""')}"`).join(";");
      csvContent += row + "\n";
    });
  }

  const encodedUri = encodeURI(csvContent);
  const link = document.createElement("a");
  link.setAttribute("href", encodedUri);
  link.setAttribute("download", `relatorio_${tipo}_${new Date().getTime()}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}