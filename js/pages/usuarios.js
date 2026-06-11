// js/pages/usuarios.js - Gestão de Usuários (Admin)
let usersState = {
  page: 1,
  paginas: 1,
  ordem: 'nome',
  direcao: 'ASC',
  dados: []
};

async function renderUsuarios(container) {
  usersState.page = 1;

  container.innerHTML = `
    <div class="section-header">
      <h2 class="section-title">Usuários do Sistema</h2>
      <div style="display:flex;gap:8px;">
        <button class="btn btn-outline btn-sm" onclick="usersExportar()">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3"/></svg>
          Exportar CSV
        </button>
        <button class="btn btn-primary btn-sm" onclick="userAbrirModal()">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 5v14M5 12h14"/></svg>
          Novo Usuário
        </button>
      </div>
    </div>

    <!-- Estatísticas rápidas de usuários -->
    <div id="users-stats" style="display:grid;grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:14px;margin-bottom:20px;">
      <div class="skeleton" style="height:76px;border-radius:10px;"></div>
      <div class="skeleton" style="height:76px;border-radius:10px;"></div>
      <div class="skeleton" style="height:76px;border-radius:10px;"></div>
    </div>

    <div class="search-bar">
      <div class="search-input-wrap">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/></svg>
        <input type="text" id="user-busca" placeholder="Buscar por nome ou e-mail..." oninput="usersDebounce()">
      </div>
      <select class="form-control" id="user-perfil-filtro" style="width:auto;" onchange="usersCarregar()">
        <option value="">Todos os perfis</option>
        <option value="administrador">Administradores</option>
        <option value="colaborador">Colaboradores</option>
      </select>
    </div>

    <div class="card">
      <div class="table-wrapper">
        <table>
          <thead>
            <tr>
              <th onclick="usersOrdenar('nome')" id="uth-nome">Nome ↕</th>
              <th onclick="usersOrdenar('email')" id="uth-email">E-mail ↕</th>
              <th onclick="usersOrdenar('perfil')" id="uth-perfil">Perfil ↕</th>
              <th onclick="usersOrdenar('createdAt')" id="uth-data">Cadastro ↕</th>
              <th>Ações</th>
            </tr>
          </thead>
          <tbody id="users-tbody">
            ${skeletonTable(5, 5)}
          </tbody>
        </table>
      </div>
      <div id="users-pagination" style="padding:0 16px;"></div>
    </div>
  `;

  usersCarregar();
}

let usersTimer;
function usersDebounce() {
  clearTimeout(usersTimer);
  usersTimer = setTimeout(usersCarregar, 400);
}

function usersOrdenar(campo) {
  if (usersState.ordem === campo) {
    usersState.direcao = usersState.direcao === 'ASC' ? 'DESC' : 'ASC';
  } else {
    usersState.ordem = campo;
    usersState.direcao = 'ASC';
  }
  usersCarregar();
}

async function usersCarregar(page) {
  if (page) usersState.page = page;

  const busca = document.getElementById('user-busca')?.value;
  const perfil = document.getElementById('user-perfil-filtro')?.value;

  const params = {
    page: usersState.page, limit: 10,
    ordem: usersState.ordem, direcao: usersState.direcao
  };
  if (busca) params.busca = busca;
  if (perfil) params.perfil = perfil;

  const tbody = document.getElementById('users-tbody');
  if (tbody) tbody.innerHTML = skeletonTable(5, 5);

  try {
    const data = await api.getUsuarios(params);
    usersState.dados = data.dados;
    usersState.paginas = data.paginas;

    // Atualiza stats
    const statsEl = document.getElementById('users-stats');
    if (statsEl) {
      const total = data.total;
      const admins = data.dados.filter(u => u.perfil === 'administrador').length;
      const colabs = data.dados.filter(u => u.perfil === 'colaborador').length;
      statsEl.innerHTML = `
        <div class="stat-card">
          <div class="stat-icon blue">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75"/></svg>
          </div>
          <div class="stat-info">
            <div class="stat-value">${total}</div>
            <div class="stat-label">Total de usuários</div>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon orange">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="8" r="4"/><path d="M20 21a8 8 0 10-16 0"/><path d="M15 11l5 5m0-5l-5 5"/></svg>
          </div>
          <div class="stat-info">
            <div class="stat-value">${data.dados.filter(u => u.perfil === 'administrador').length + (total > 10 ? '+' : '')}</div>
            <div class="stat-label">Administradores</div>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon green">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
          </div>
          <div class="stat-info">
            <div class="stat-value">${data.dados.filter(u => u.perfil === 'colaborador').length + (total > 10 ? '+' : '')}</div>
            <div class="stat-label">Colaboradores</div>
          </div>
        </div>
      `;
    }

    if (!tbody) return;

    if (!data.dados.length) {
      tbody.innerHTML = `<tr><td colspan="5">
        <div class="empty-state">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/></svg>
          <p>Nenhum usuário encontrado.</p>
        </div>
      </td></tr>`;
      return;
    }

    tbody.innerHTML = data.dados.map(u => {
      const initial = u.nome.charAt(0).toUpperCase();
      const isMe = currentUser && u.id === currentUser.id;
      return `
        <tr>
          <td>
            <div style="display:flex;align-items:center;gap:10px;">
              <div style="width:36px;height:36px;border-radius:50%;background:linear-gradient(135deg,${u.perfil === 'administrador' ? 'var(--laranja-detalhe),var(--azul-principal)' : 'var(--verde-detalhe),var(--azul-secundario)'});display:flex;align-items:center;justify-content:center;color:white;font-weight:700;font-size:14px;flex-shrink:0;">${initial}</div>
              <div>
                <div style="font-weight:700;color:var(--texto);">${u.nome} ${isMe ? '<span style="font-size:10px;background:var(--azul-principal);color:white;padding:1px 6px;border-radius:10px;margin-left:4px;">Você</span>' : ''}</div>
              </div>
            </div>
          </td>
          <td>
            <a href="mailto:${u.email}" style="color:var(--azul-principal);text-decoration:none;font-size:13px;">${u.email}</a>
          </td>
          <td>${statusBadge(u.perfil)}</td>
          <td style="font-size:12px;color:var(--texto-leve);">${formatDate(u.createdAt?.split('T')[0])}</td>
          <td>
            <div class="table-actions">
              <button class="btn btn-outline btn-sm" onclick="userAbrirModal(${u.id})" title="Editar">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                Editar
              </button>
              ${!isMe ? `
              <button class="btn btn-danger btn-sm btn-icon" onclick="userExcluir(${u.id}, '${u.nome}')" title="Excluir">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4a1 1 0 011-1h4a1 1 0 011 1v2"/></svg>
              </button>` : ''}
            </div>
          </td>
        </tr>
      `;
    }).join('');

    const pag = document.getElementById('users-pagination');
    if (pag) renderPagination(pag, usersState.page, usersState.paginas, usersCarregar);

  } catch (err) {
    if (tbody) tbody.innerHTML = `<tr><td colspan="5" style="color:var(--erro);padding:20px;">${err.erro || 'Erro ao carregar usuários.'}</td></tr>`;
  }
}

async function userAbrirModal(id = null) {
  let user = null;
  if (id) {
    try { user = await api.getUsuario(id); }
    catch (e) { showToast('Erro', 'Não foi possível carregar o usuário.', 'error'); return; }
  }

  createModal({
    id: 'modal-user',
    title: user ? `Editar Usuário — ${user.nome}` : 'Novo Usuário',
    body: `
      <div class="form-group">
        <label class="form-label">Nome completo *</label>
        <input id="u-nome" class="form-control" placeholder="Ex: João da Silva" value="${user?.nome || ''}">
      </div>
      <div class="form-group">
        <label class="form-label">E-mail *</label>
        <input id="u-email" type="email" class="form-control" placeholder="nome@sesi.senai.br" value="${user?.email || ''}">
      </div>
      <div class="form-row form-row-2">
        <div class="form-group">
          <label class="form-label">${user ? 'Nova senha <span style="color:var(--texto-leve);font-weight:400;">(deixe em branco para manter)</span>' : 'Senha *'}</label>
          <input id="u-senha" type="password" class="form-control" placeholder="${user ? '••••••••' : 'Mínimo 6 caracteres'}" autocomplete="new-password">
        </div>
        <div class="form-group">
          <label class="form-label">Perfil *</label>
          <select id="u-perfil" class="form-control">
            <option value="colaborador" ${!user || user.perfil === 'colaborador' ? 'selected' : ''}>Colaborador</option>
            <option value="administrador" ${user?.perfil === 'administrador' ? 'selected' : ''}>Administrador</option>
          </select>
        </div>
      </div>

      ${!user ? `
      <div style="background:rgba(0,74,152,0.06);border:1px solid rgba(0,74,152,0.15);border-radius:8px;padding:12px 14px;margin-top:4px;">
        <div style="font-size:12px;font-weight:700;color:var(--azul-principal);margin-bottom:6px;">ℹ️ Informações de acesso</div>
        <div style="font-size:12px;color:var(--texto-leve);">O usuário receberá acesso ao sistema com o e-mail e senha cadastrados.<br>
        <strong>Colaboradores</strong> podem criar e gerenciar suas próprias reservas.<br>
        <strong>Administradores</strong> têm acesso completo ao sistema.</div>
      </div>` : ''}

      <div id="u-err" class="hidden" style="color:var(--erro);font-size:13px;padding:10px 14px;background:rgba(220,53,69,.08);border-radius:8px;margin-top:12px;"></div>
    `,
    footer: `
      <button class="btn btn-outline" onclick="closeModal('modal-user')">Cancelar</button>
      <button class="btn btn-primary" id="u-save-btn" onclick="userSalvar(${id || 'null'})">
        ${user ? 'Salvar alterações' : 'Criar Usuário'}
      </button>
    `
  });
  openModal('modal-user');
}

async function userSalvar(id) {
  const btn = document.getElementById('u-save-btn');
  const err = document.getElementById('u-err');
  err.classList.add('hidden');

  const nome  = document.getElementById('u-nome')?.value?.trim();
  const email = document.getElementById('u-email')?.value?.trim();
  const senha = document.getElementById('u-senha')?.value;
  const perfil = document.getElementById('u-perfil')?.value;

  if (!nome || !email) {
    err.textContent = 'Nome e e-mail são obrigatórios.';
    err.classList.remove('hidden');
    return;
  }
  if (!id && !senha) {
    err.textContent = 'A senha é obrigatória para novos usuários.';
    err.classList.remove('hidden');
    return;
  }
  if (senha && senha.length < 6) {
    err.textContent = 'A senha deve ter pelo menos 6 caracteres.';
    err.classList.remove('hidden');
    return;
  }

  const dados = { nome, email, perfil };
  if (senha) dados.senha = senha;

  btn.disabled = true;
  btn.textContent = 'Salvando...';

  try {
    if (id) {
      await api.atualizarUsuario(id, dados);
      showToast('Usuário atualizado!', nome, 'success');
      // Atualiza dados locais se for o próprio usuário
      if (currentUser && id === currentUser.id) {
        currentUser.nome = nome;
        currentUser.email = email;
        currentUser.perfil = perfil;
        localStorage.setItem('user', JSON.stringify(currentUser));
        updateUserUI();
      }
    } else {
      await api.criarUsuario(dados);
      showToast('Usuário criado!', nome, 'success');
    }
    closeModal('modal-user');
    usersCarregar();
  } catch (e) {
    err.textContent = e.erro || 'Erro ao salvar usuário.';
    err.classList.remove('hidden');
  } finally {
    btn.disabled = false;
    btn.textContent = id ? 'Salvar alterações' : 'Criar Usuário';
  }
}

async function userExcluir(id, nome) {
  if (!confirm(`Excluir o usuário "${nome}"?\n\nTodas as reservas associadas permanecerão no sistema, mas o usuário perderá o acesso.\n\nEsta ação não pode ser desfeita.`)) return;
  try {
    await api.excluirUsuario(id);
    showToast('Usuário excluído.', nome, 'success');
    usersCarregar();
  } catch (e) {
    showToast('Não foi possível excluir', e.erro || 'Erro ao excluir usuário.', 'error');
  }
}

async function usersExportar() {
  try {
    const data = await api.getUsuarios({ limit: 1000 });
    const flat = data.dados.map(u => ({
      id: u.id,
      nome: u.nome,
      email: u.email,
      perfil: u.perfil,
      cadastro: u.createdAt?.split('T')[0]
    }));
    exportCSV(flat, 'usuarios');
  } catch (e) {
    showToast('Erro', 'Não foi possível exportar.', 'error');
  }
}