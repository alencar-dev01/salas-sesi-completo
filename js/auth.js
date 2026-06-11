// js/auth.js - Autenticação frontend
let currentUser = null;

function authInit() {
  const token = localStorage.getItem('token');
  const user = localStorage.getItem('user');
  if (token && user) {
    currentUser = JSON.parse(user);
    api.setToken(token);
    return true;
  }
  return false;
}

async function authLogin() {
  const email = document.getElementById('login-email').value.trim();
  const senha = document.getElementById('login-senha').value;
  const btn = document.getElementById('login-btn');
  const errEl = document.getElementById('login-error');

  errEl.classList.add('hidden');
  if (!email || !senha) {
    errEl.textContent = 'Informe e-mail e senha.';
    errEl.classList.remove('hidden');
    return;
  }

  btn.innerHTML = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" class="loading-spin"><path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/></svg> Entrando...';
  btn.disabled = true;

  try {
    const data = await api.login(email, senha);
    currentUser = data.user;
    api.setToken(data.token);
    localStorage.setItem('token', data.token);
    localStorage.setItem('user', JSON.stringify(data.user));
    authShowApp();
  } catch (err) {
    errEl.textContent = err.erro || 'Erro ao fazer login.';
    errEl.classList.remove('hidden');
  } finally {
    btn.innerHTML = '<span id="login-btn-text">Entrar no sistema</span>';
    btn.disabled = false;
  }
}

function authShowApp() {
  document.getElementById('login-page').classList.add('hidden');
  document.getElementById('app-layout').classList.remove('hidden');
  updateUserUI();
  updateAdminUI();
  navigate('dashboard');
}

function authShowLogin() {
  document.getElementById('login-page').classList.remove('hidden');
  document.getElementById('app-layout').classList.add('hidden');
}

function authLogout() {
  currentUser = null;
  api.setToken(null);
  localStorage.removeItem('token');
  localStorage.removeItem('user');
  authShowLogin();
  showToast('Você saiu do sistema.', '', 'info');
}

function updateUserUI() {
  if (!currentUser) return;
  const avatarEl = document.getElementById('user-avatar');
  const nameEl = document.getElementById('user-name');
  const roleEl = document.getElementById('user-role');
  if (avatarEl) avatarEl.textContent = currentUser.nome.charAt(0).toUpperCase();
  if (nameEl) nameEl.textContent = currentUser.nome;
  if (roleEl) roleEl.textContent = currentUser.perfil === 'administrador' ? 'Administrador' : 'Colaborador';
}

function updateAdminUI() {
  const isAdmin = currentUser && currentUser.perfil === 'administrador';
  document.querySelectorAll('.admin-only').forEach(el => {
    el.style.display = isAdmin ? '' : 'none';
  });
  const adminSection = document.getElementById('nav-admin-section');
  if (adminSection) adminSection.style.display = isAdmin ? '' : 'none';
}

// Enter key login
document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('login-senha')?.addEventListener('keydown', e => {
    if (e.key === 'Enter') authLogin();
  });
  document.getElementById('login-email')?.addEventListener('keydown', e => {
    if (e.key === 'Enter') authLogin();
  });
});