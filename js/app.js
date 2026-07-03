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
};

let currentPage = null;

const adminPages = ['salas','bloqueios','usuarios','todas-reservas','relatorios','auditoria','comunicados','manutencao','dashboard-exec','impressoras'];

function navigate(page) {
  if (adminPages.includes(page) && (!currentUser || currentUser.perfil !== 'administrador')) {
    showToast('Acesso negado', 'Área restrita a administradores.', 'error');
    return;
  }

  currentPage = page;

  document.querySelectorAll('.nav-item').forEach(el =>
    el.classList.toggle('active', el.getAttribute('data-page') === page)
  );

  const titleEl = document.getElementById('page-title');
  if (titleEl) titleEl.textContent = pageTitles[page] || page;
  document.title = `SESI/SENAI – ${pageTitles[page] || page}`;

  document.getElementById('sidebar').classList.remove('open');

  const content = document.getElementById('page-content');
  content.innerHTML = '';

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
    // case 'conhecimento':     renderConhecimento(content); break;
    case 'relatorios':       renderRelatorios(content); break;
    case 'auditoria':        renderAuditoria(content); break;
    case 'comunicados':      renderComunicados(content); break;
    // case 'manutencao':       renderManutencao(content); break;
    default:
      content.innerHTML = `<div class="empty-state"><p>Página não encontrada.</p></div>`;
  }
}

document.addEventListener('DOMContentLoaded', () => {
  if (authInit()) {
    authShowApp();
  } else {
    authShowLogin();
  }
});