async function renderAuditoria(container) {
  if (currentUser?.perfil !== 'administrador') return;

  container.innerHTML = `
    <div class="section-header">
      <h2 class="section-title">🛡️ Log de Auditoria</h2>
    </div>
    <div class="table-container" style="max-height: 500px; overflow-y: auto;">
      <table class="table">
        <thead style="position: sticky; top: 0; background: var(--branco);">
          <tr><th>Data/Hora</th><th>Usuário</th><th>Ação</th><th>Detalhes</th></tr>
        </thead>
        <tbody id="auditoria-tbody">
           <tr><td colspan="4" class="text-center">Buscando logs...</td></tr>
        </tbody>
      </table>
    </div>
  `;

  try {
    const res = await api.get('/auditoria'); // Exige criar a rota no backend
    const dados = res.dados || res || [];
    const tbody = document.getElementById('auditoria-tbody');

    if(!dados.length) {
      tbody.innerHTML = `<tr><td colspan="4" class="text-center" style="padding: 20px;">Nenhum registro de auditoria encontrado.</td></tr>`;
      return;
    }

    tbody.innerHTML = dados.map(a => `
      <tr>
        <td style="font-size:13px;">${formatDate(a.createdAt)}</td>
        <td>${a.usuario?.nome || 'Sistema'}</td>
        <td><span class="badge badge-blue">${a.acao}</span></td>
        <td style="font-size:13px; color: var(--texto-leve);">${a.detalhes}</td>
      </tr>
    `).join('');
  } catch (e) {
    document.getElementById('auditoria-tbody').innerHTML = `<tr><td colspan="4" class="text-center" style="color:var(--erro)">Rota /auditoria não encontrada na API.</td></tr>`;
  }
}