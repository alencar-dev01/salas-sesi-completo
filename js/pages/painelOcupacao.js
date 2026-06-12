// js/pages/painelOcupacao.js
async function renderPainelOcupacao(container) {
  container.innerHTML = `
    <div class="section-header">
      <h2 class="section-title">🕒 Painel de Ocupação (Hoje)</h2>
      <button class="btn btn-outline" onclick="renderPainelOcupacao(document.getElementById('page-content'))">Atualizar</button>
    </div>
    <div id="ocupacao-grid" style="display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 16px;">
      ${`<div class="skeleton" style="height:150px; border-radius:8px;"></div>`.repeat(4)}
    </div>
  `;

  try {
    // Pega a data de hoje no formato YYYY-MM-DD
    const hojeStr = new Date().toISOString().split('T')[0];

    // Busca Salas e Reservas
    const [resSalas, resReservas] = await Promise.all([
      api.get('/salas'),
      api.get('/reservas')
    ]);
    
    const salas = resSalas.dados || resSalas || [];
    const reservas = resReservas.dados || resReservas || [];
    
    // Filtra apenas as reservas confirmadas de hoje
    const reservasHoje = reservas.filter(r => r.data === hojeStr && r.status !== 'Cancelada');

    const grid = document.getElementById('ocupacao-grid');
    if (!salas.length) {
      grid.innerHTML = `<div style="grid-column: 1/-1;" class="empty-state"><p>Nenhuma sala cadastrada.</p></div>`;
      return;
    }

    grid.innerHTML = salas.map(sala => {
      // Verifica se existe reserva para esta sala hoje
      const reservasDaSalaHoje = reservasHoje.filter(r => r.salaId === sala.id || r.sala?.id === sala.id);
      const isOcupadaHoje = reservasDaSalaHoje.length > 0;
      
      // Monta os turnos reservados para exibir
      const turnos = reservasDaSalaHoje.map(r => r.turno).join(', ');

      const cor = isOcupadaHoje ? 'var(--alerta)' : 'var(--sucesso)';
      const statusTexto = isOcupadaHoje ? `Reservada (${turnos})` : 'Livre Hoje';

      return `
        <div style="background: var(--branco); border: 1px solid var(--cinza-borda); border-radius: 8px; padding: 20px; text-align: center; border-top: 4px solid ${cor};">
          <h3 style="margin: 0 0 10px 0; font-size: 18px;">${sala.nome}</h3>
          <p style="margin: 0 0 15px 0; color: var(--texto-leve); font-size: 13px;">Capacidade: ${sala.capacidade}</p>
          <span class="badge" style="background: ${cor}22; color: ${cor}; font-weight: bold; padding: 6px 12px; font-size: 12px;">
            ${statusTexto}
          </span>
        </div>
      `;
    }).join('');
  } catch (e) {
    document.getElementById('ocupacao-grid').innerHTML = `<div style="grid-column: 1/-1; color: var(--erro);">Erro ao carregar ocupação. Verifique a API.</div>`;
  }
}