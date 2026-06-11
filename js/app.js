// js/app.js - Roteamento e inicialização do app

const pageTitles = {
  dashboard: 'Dashboard',
  calendario: 'Calendário',
  reservas: 'Minhas Reservas',
  'nova-reserva': 'Nova Reserva',
  salas: 'Salas de Informática',
  usuarios: 'Usuários',
  'todas-reservas': 'Todas as Reservas',
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

  switch (page) {
    case 'dashboard': renderDashboard(content); break;
    case 'calendario': renderCalendario(content); break;
    case 'reservas': renderReservas(content, false); break;
    case 'todas-reservas': renderReservas(content, true); break;
    case 'nova-reserva': renderNovaReserva(content); break;
    case 'salas': renderSalas(content); break;
    case 'usuarios': renderUsuarios(content); break;
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