// js/pages/dashboardExecutivo.js
async function renderDashboardExecutivo(container) {
    if (currentUser?.perfil !== 'administrador') {
        container.innerHTML = `<div class="empty-state"><p>Acesso restrito a administradores.</p></div>`;
        return;
    }

    container.innerHTML = `
    <div class="section-header">
      <h2 class="section-title">📈 Dashboard Executivo</h2>
    </div>
    <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 20px; margin-bottom: 24px;" id="exec-cards">
      <div class="skeleton" style="height:100px; border-radius:8px;"></div>
      <div class="skeleton" style="height:100px; border-radius:8px;"></div>
      <div class="skeleton" style="height:100px; border-radius:8px;"></div>
    </div>
    <div id="exec-detalhes"></div>
  `;

    try {
        // 🚀 Chamada DIRETA para a rota real do seu back-end admin
        const res = await api.get('/admin/dashboard-executivo');
        // Trata caso a API devolva os dados dentro de um objeto .dados ou diretamente
        const dados = res.dados || res;

        // 🔍 DICA DE OURO: Abra o F12 no navegador e veja a consola!
        // Este log vai mostrar exatamente como o seu adminController estruturou a resposta.
        console.log("Dados recebidos do Dashboard Executivo:", dados);

        // Mapeamento padrão. Se no seu controller os nomes forem diferentes 
        // (por exemplo: total_reservas ou chamados_abertos), altere aqui à direita:
        const taxaOcupacao = dados.taxaOcupacao || dados.taxa || 0;
        const totalReservas = dados.totalReservas || dados.reservas || 0;
        const chamadosCriticos = dados.chamadosCriticos || dados.chamados || 0;

        document.getElementById('exec-cards').innerHTML = `
      <div class="stat-card" style="background: linear-gradient(135deg, #0056b3, #003d82); color: white;">
        <div class="stat-info">
          <div class="stat-value">${taxaOcupacao}%</div>
          <div class="stat-label" style="color: rgba(255,255,255,0.8);">Taxa de Ocupação</div>
        </div>
      </div>
      <div class="stat-card" style="background: linear-gradient(135deg, #28a745, #1e7e34); color: white;">
        <div class="stat-info">
          <div class="stat-value">${totalReservas}</div>
          <div class="stat-label" style="color: rgba(255,255,255,0.8);">Reservas Registadas</div>
        </div>
      </div>
      <div class="stat-card" style="background: linear-gradient(135deg, #dc3545, #c82333); color: white;">
        <div class="stat-info">
          <div class="stat-value">${chamadosCriticos}</div>
          <div class="stat-label" style="color: rgba(255,255,255,0.8);">Chamados Críticos</div>
        </div>
      </div>
    `;

    } catch (e) {
        console.error("Erro ao carregar dashboard executivo:", e);
        document.getElementById('exec-cards').innerHTML = `
      <div style="grid-column: 1/-1;" class="empty-state">
        <p style="color: var(--erro); font-weight: bold; margin-bottom: 4px;">Não foi possível carregar o Dashboard</p>
        <p style="font-size: 13px; color: var(--texto-leve);">Detalhes: ${e.erro || 'Erro na requisição. Verifique a consola (F12).'}</p>
      </div>
    `;
    }
}