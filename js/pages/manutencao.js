async function renderManutencao(container) {
  if (currentUser?.perfil !== 'administrador') return;

  container.innerHTML = `
    <div class="section-header">
      <h2 class="section-title">🔧 Manutenção Preventiva</h2>
      <button class="btn btn-primary btn-sm" onclick="showToast('Aviso', 'Ação será conectada à API', 'info')">Agendar</button>
    </div>
    <div id="manutencao-lista" style="display: grid; gap: 16px;">Carregando...</div>
  `;

  try {
    const res = await api.get('/admin/manutencao-preventiva'); // Exige criar a rota no backend
    const dados = res.dados || res || [];
    const div = document.getElementById('manutencao-lista');

    if(!dados.length) {
      div.innerHTML = `<div class="empty-state"><p>Nenhuma manutenção agendada.</p></div>`;
      return;
    }

    div.innerHTML = dados.map(m => `
      <div style="background: var(--branco); border-left: 4px solid var(--alerta); padding: 16px; border-radius: 0 8px 8px 0; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
        <div style="display:flex; justify-content: space-between; align-items: center;">
          <div>
            <h4 style="margin: 0 0 5px 0;">${m.titulo}</h4>
            <p style="margin: 0; font-size: 13px; color: var(--texto-leve);">Agendado para: <strong>${formatDate(m.dataAgendada)}</strong></p>
          </div>
          <span class="badge badge-orange">${m.status}</span>
        </div>
      </div>
    `).join('');
  } catch (e) {
    document.getElementById('manutencao-lista').innerHTML = `<div class="empty-state"><p style="color:var(--erro)">Rota /manutencoes não encontrada na API.</p></div>`;
  }
}