// js/app.js - Roteamento e inicialização do app

const pageTitles = {
  dashboard: 'Dashboard',
  calendario: 'Calendário',
  reservas: 'Minhas Reservas',
  'nova-reserva': 'Nova Reserva',
  salas: 'Salas de Informática',
  usuarios: 'Usuários',
  'todas-reservas': 'Todas as Reservas',
  chamados: 'Central de Chamados', // <-- Rota mapeada
  impressoras: 'Impressoras',
  conhecimento: 'Base de Conhecimento',
  relatorios: 'Relatórios do Sistema',
  // 'dashboard-executivo': 'Dashboard Executivo',
  'painel-ocupacao': 'Painel de Ocupação',
  // 'bloqueios-salas': 'Bloqueios de Salas',
  'manutencao': 'Manutenção Preventiva',
  comunicados: 'Comunicados',
  // auditoria: 'Log de Auditoria'       // <-- Rota mapeada
};

let currentPage = null;

function navigate(page) {
  // Proteção de acesso admin
  const adminPages = ['salas', 'usuarios', 'todas-reservas'];
  if (adminPages.includes(page) && (!currentUser || currentUser.perfil !== 'administrador')) {
    showToast('Acesso negado', 'Esta área é restrita a administradores.', 'error');
    return;
  }

  currentPage = page;

  // Atualiza nav ativo
  document.querySelectorAll('.nav-item').forEach(el => {
    el.classList.toggle('active', el.getAttribute('data-page') === page);
  });

  // Atualiza título
  const titleEl = document.getElementById('page-title');
  if (titleEl) titleEl.textContent = pageTitles[page] || page;
  document.title = `SESI/SENAI – ${pageTitles[page] || page}`;

  // Fecha sidebar mobile
  document.getElementById('sidebar').classList.remove('open');

  // Renderiza página
  const content = document.getElementById('page-content');
  content.innerHTML = '';

  // O "Guarda de Trânsito" das suas páginas
  switch (page) {
    case 'dashboard': renderDashboard(content); break;
    case 'calendario': renderCalendario(content); break;
    case 'reservas': renderReservas(content, false); break;
    case 'todas-reservas': renderReservas(content, true); break;
    case 'nova-reserva': renderNovaReserva(content); break;
    case 'salas': renderSalas(content); break;
    case 'usuarios': renderUsuarios(content); break;
    case 'chamados': renderChamados(content); break;       // <-- Nova rota de chamados
    case 'impressoras': renderImpressoras(content); break;
    case 'conhecimento': renderConhecimento(content); break;
    case 'relatorios': renderRelatorios(content); break;
    // case 'dashboard-executivo': renderDashboardExecutivo(content); break;
    case 'painel-ocupacao': renderPainelOcupacao(content); break;
    // case 'bloqueios-salas': renderBloqueios(content); break;
    case 'manutencao': renderManutencao(content); break;
    case 'comunicados': renderComunicados(content); break;
    // case 'auditoria': renderAuditoria(content); break;
    default:
      content.innerHTML = '<div class="empty-state"><p>Página não encontrada.</p></div>';
  }
}

// Inicialização
document.addEventListener('DOMContentLoaded', () => {
  if (authInit()) {
    authShowApp();
  } else {
    authShowLogin();
  }
});