async function renderBloqueios(container) {
  if (currentUser?.perfil !== 'administrador') return;

  container.innerHTML = `
    <div class="section-header">
      <h2 class="section-title">🔒 Bloqueios de Salas</h2>
      <button class="btn btn-primary btn-sm" onclick="showToast('Aviso', 'Ação de adicionar será conectada na API em breve', 'info')">Novo Bloqueio</button>
    </div>
    <div class="table-container">
      <table class="table">
        <thead><tr><th>Sala</th><th>Motivo</th><th>Início</th><th>Fim</th><th>Status</th></tr></thead>
        <tbody id="bloqueios-tbody"><tr><td colspan="5" class="text-center">Carregando dados...</td></tr></tbody>
      </table>
    </div>
  `;

  try {
    const res = await api.get('/admin/bloqueios');
    const dados = res.dados || res || [];
    const tbody = document.getElementById('bloqueios-tbody');
    
    if(!dados.length) {
      tbody.innerHTML = `<tr><td colspan="5" class="text-center" style="padding: 20px;">Nenhum bloqueio ativo.</td></tr>`;
      return;
    }

    tbody.innerHTML = dados.map(b => `
      <tr>
        <td>${b.sala?.nome || 'Geral'}</td>
        <td>${b.motivo}</td>
        <td>${formatDate(b.dataInicio)}</td>
        <td>${formatDate(b.dataFim)}</td>
        <td><span class="badge badge-blue">Ativo</span></td>
      </tr>
    `).join('');
  } catch (e) {
    document.getElementById('bloqueios-tbody').innerHTML = `<tr><td colspan="5" class="text-center" style="color:var(--erro)">Nenhum registro encontrado ou rota /bloqueios não existe na API.</td></tr>`;
  }
}