async function renderComunicados(container) {
  container.innerHTML = `
    <div class="section-header">
      <h2 class="section-title">📢 Comunicados</h2>
      ${currentUser?.perfil === 'administrador' ? `<button class="btn btn-primary btn-sm">Novo Aviso</button>` : ''}
    </div>
    <div id="comunicados-lista" style="display:flex; flex-direction: column; gap: 16px;">Carregando...</div>
  `;

  try {
    const res = await api.get('/comunicados'); // Exige criar a rota no backend
    const dados = res.dados || res || [];
    const div = document.getElementById('comunicados-lista');

    if(!dados.length) {
      div.innerHTML = `<div class="empty-state"><p>Nenhum comunicado publicado.</p></div>`;
      return;
    }

    div.innerHTML = dados.map(c => `
      <div style="background: #e8f4fd; border: 1px solid #b8daff; padding: 20px; border-radius: 8px;">
        <h3 style="margin: 0 0 10px 0; color: #004085;">${c.titulo}</h3>
        <p style="margin: 0; color: #004085; font-size: 14px; line-height: 1.5;">${c.mensagem}</p>
        <div style="margin-top: 10px; font-size: 12px; color: #6c757d;">Publicado em ${formatDate(c.createdAt)}</div>
      </div>
    `).join('');
  } catch (e) {
    document.getElementById('comunicados-lista').innerHTML = `<div class="empty-state"><p style="color:var(--texto-leve)">Nenhum aviso no momento.</p></div>`;
  }
}