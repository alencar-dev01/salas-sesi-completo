const pageTitles = {
  'dashboard':        'Dashboard',
  'dashboard-exec':   'Dashboard Executivo',
  'calendario':       'Calendário',
  'painel-ocupacao':  'Painel de Ocupação',
  'reservas':         'Minhas Reservas',
  'todas-reservas':   'Todas as Reservas',
  'nova-reserva':     'Nova Reserva',
  'salas':            'Salas de Informática',
  'bloqueios':        'Bloqueios de Salas',
  'usuarios':         'Usuários',
  'chamados':         'Central de Chamados',
  'impressoras':      'Impressoras',
  // 'conhecimento':     'Base de Conhecimento',
  'relatorios':       'Relatórios',
  'auditoria':        'Log de Auditoria',
  'comunicados':      'Comunicados',
  // 'manutencao':       'Manutenção Preventiva',
  'portaria':         'Painel da Portaria'
};

let currentPage = null;

const adminPages = ['salas','bloqueios','usuarios','todas-reservas','relatorios','auditoria','comunicados','manutencao','dashboard-exec','impressoras'];

function navigate(page) {
  // 1. 🚪 DESVIO PRIORITÁRIO DA PORTARIA: Vai direto antes de testar qualquer login ou token
// 1. 🚪 DESVIO PRIORITÁRIO DA PORTARIA
  if (page === 'portaria') {
    // 👇 NOVIDADE: Tira a tela de login da frente e mostra o esqueleto do App
    const telaLogin = document.getElementById('login-page');
    const telaApp = document.getElementById('app-layout');
    
    // Esconde o login e mostra a estrutura do App
    if (telaLogin) telaLogin.classList.add('hidden');
    if (telaApp) {
      telaApp.classList.remove('hidden');
      telaApp.style.display = 'flex'; // Garante que o layout base apareça
    }

    const sidebarEl = document.getElementById('sidebar');
    const topbarEl = document.querySelector('.topbar'); // Nome exato da sua classe
    
    // Esconde o menu lateral e o cabeçalho superior
    if (sidebarEl) sidebarEl.style.display = 'none';
    if (topbarEl) topbarEl.style.display = 'none';
    
    // Remove a margem lateral para a tabela ocupar a tela toda
    const contentWrapper = document.querySelector('.main-content'); 
    if (contentWrapper) contentWrapper.style.marginLeft = '0';

    currentPage = page;
    document.title = `SESI/SENAI – Painel da Portaria`;

    const content = document.getElementById('page-content');
    if (content) {
      content.innerHTML = '';
      renderPortaria(content); // Injeta o painel da portaria
    }
    return; // 🛑 Para a execução aqui!
  }

  // 2. 🔒 TRAVA DE LOGIN: Só roda se NÃO for para a portaria
  if (!api._token && page !== 'login') {
    if (typeof authShowLogin === 'function') {
      authShowLogin();
    } else {
      const content = document.getElementById('page-content');
      if (typeof renderLogin === 'function') renderLogin(content);
    }
    return;
  }

  // 3. 🛡️ TRAVA DE ADMINISTRADOR
  if (adminPages.includes(page) && (!currentUser || currentUser.perfil !== 'administrador')) {
    showToast('Acesso negado', 'Área restrita a administradores.', 'error');
    return;
  }

  // --- FLUXO NORMAL PARA USUÁRIOS LOGADOS ---

  // Restaura o layout padrão caso saia da portaria
  const sidebarEl = document.getElementById('sidebar');
  const navbarEl = document.querySelector('.navbar');
  if (sidebarEl) sidebarEl.style.display = '';
  if (navbarEl) navbarEl.style.display = '';
  const contentWrapper = document.querySelector('.main-content');
  if (contentWrapper) contentWrapper.style.marginLeft = '';

  currentPage = page;

  // Atualiza classe ativa no menu lateral
  document.querySelectorAll('.nav-item').forEach(el =>
    el.classList.toggle('active', el.getAttribute('data-page') === page)
  );

  // Atualiza os títulos da página e da aba do navegador
  const titleEl = document.getElementById('page-title');
  if (titleEl) titleEl.textContent = pageTitles[page] || page;
  document.title = `SESI/SENAI – ${pageTitles[page] || page}`;

  // Fecha o menu mobile se estiver aberto
  if (sidebarEl) sidebarEl.classList.remove('open');

  // Limpa o contêiner principal para receber a nova página
  const content = document.getElementById('page-content');
  if (!content) return;
  content.innerHTML = '';

  // 4. 🔀 ROTEAMENTO
  switch(page) {
    case 'dashboard':        renderDashboard(content); break;
    case 'dashboard-exec':   renderDashboardExec(content); break;
    case 'calendario':       renderCalendario(content); break;
    case 'painel-ocupacao':  renderPainelOcupacao(content); break;
    case 'reservas':         renderReservas(content, false); break;
    case 'todas-reservas':   renderReservas(content, true); break;
    case 'nova-reserva':     renderNovaReserva(content); break;
    case 'salas':            renderSalas(content); break;
    case 'bloqueios':        renderBloqueios(content); break;
    case 'usuarios':         renderUsuarios(content); break;
    case 'chamados':         renderChamados(content); break;
    case 'impressoras':      renderImpressoras(content); break;
    case 'relatorios':       renderRelatorios(content); break;
    case 'auditoria':        renderAuditoria(content); break;
    case 'comunicados':      renderComunicados(content); break;
    case 'portaria':         renderPortaria(content); break;
    default:
      content.innerHTML = `<div class="empty-state"><p>Página não encontrada.</p></div>`;
  }
}

document.addEventListener('DOMContentLoaded', () => {
  if (typeof authInit === 'function' && authInit()) {
    if (typeof authShowApp === 'function') authShowApp();
  } else {
    if (typeof authShowLogin === 'function') authShowLogin();
  }
});