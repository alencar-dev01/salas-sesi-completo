// js/pages/conhecimento.js
let kbState = { dados: [] };
let kbTimer;

async function renderConhecimento(container) {
  const isAdmin = currentUser?.perfil === 'administrador';

  container.innerHTML = `
    <div class="section-header">
      <h2 class="section-title">📚 Base de Conhecimento</h2>
      ${isAdmin ? `
        <button class="btn btn-primary btn-sm" onclick="kbAbrirModal()">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 5v14M5 12h14"/></svg>
          Novo Artigo
        </button>
      ` : ''}
    </div>

    <div class="search-bar" style="margin-bottom: 20px;">
      <div class="search-input-wrap" style="max-width: 100%;">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/></svg>
        <input type="text" id="kb-busca" placeholder="Buscar tutoriais, manuais ou soluções..." oninput="kbDebounce()">
      </div>
    </div>

    <div id="kb-lista" style="display:grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 16px;">
      ${[1, 2, 3].map(() => `<div class="skeleton" style="height:120px; border-radius:8px;"></div>`).join('')}
    </div>
  `;

  kbCarregar();
}

function kbDebounce() {
  clearTimeout(kbTimer);
  kbTimer = setTimeout(kbCarregar, 400);
}

async function kbCarregar() {
  const busca = document.getElementById('kb-busca')?.value || '';
  const lista = document.getElementById('kb-lista');
  
  if (lista) lista.innerHTML = `<div class="skeleton" style="height:120px; border-radius:8px;"></div>`.repeat(3);

  try {
    // Usando a rota conhecimento que existe no seu backend
    const params = busca ? `?busca=${encodeURIComponent(busca)}` : '';
    const data = await api.get('/conhecimento' + params);
    kbState.dados = data.dados || data; // Adapte dependendo de como sua API retorna

    if (!kbState.dados.length) {
      lista.style.display = 'block';
      lista.innerHTML = `
        <div class="empty-state">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" style="width:48px;height:48px;opacity:.3;margin:0 auto 12px;display:block;"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path></svg>
          <p>Nenhum artigo encontrado.</p>
        </div>`;
      return;
    }

    lista.style.display = 'grid';
    lista.innerHTML = kbState.dados.map(artigo => `
      <div class="chamado-card" style="cursor:pointer;" onclick="kbAbrirDetalhe(${artigo.id})">
        <div class="chamado-header">
          <div class="chamado-titulo" style="font-size: 16px;">${artigo.titulo}</div>
        </div>
        <div style="font-size:13px;color:var(--texto-leve);margin-bottom:12px;display:-webkit-box;-webkit-line-clamp:3;-webkit-box-orient:vertical;overflow:hidden;">
          ${artigo.conteudo}
        </div>
        <div class="chamado-meta">
          <span class="badge badge-blue">🗂 ${artigo.categoria || 'Geral'}</span>
          <span>📅 ${formatDate(artigo.createdAt?.split('T')[0])}</span>
        </div>
      </div>
    `).join('');
  } catch (e) {
    if (lista) lista.innerHTML = `<div style="color:var(--erro);padding:16px;">${e.erro || 'Erro ao carregar base de conhecimento.'}</div>`;
  }
}

async function kbAbrirDetalhe(id) {
  const artigo = kbState.dados.find(a => a.id === id);
  if (!artigo) return;

  createModal({
    id: 'modal-kb-detalhe',
    title: `📚 ${artigo.titulo}`,
    size: 'modal-lg',
    body: `
      <div style="margin-bottom: 16px;">
        <span class="badge badge-blue">Categoria: ${artigo.categoria || 'Geral'}</span>
        <span style="font-size: 12px; color: var(--texto-leve); margin-left: 10px;">Atualizado em: ${formatDate(artigo.updatedAt?.split('T')[0] || artigo.createdAt?.split('T')[0])}</span>
      </div>
      <div style="background:var(--branco); border: 1px solid var(--cinza-borda); border-radius:8px; padding:20px; font-size:14px; line-height: 1.6; white-space: pre-wrap;">${artigo.conteudo}</div>
    `,
    footer: `<button class="btn btn-outline" onclick="closeModal('modal-kb-detalhe')">Fechar</button>`
  });
  openModal('modal-kb-detalhe');
}

function kbAbrirModal() {
  createModal({
    id: 'modal-novo-artigo',
    title: '📝 Criar Novo Artigo',
    body: `
      <div class="form-group">
        <label class="form-label">Título *</label>
        <input id="kb-titulo" class="form-control" placeholder="Ex: Como configurar a impressora Wi-Fi">
      </div>
      <div class="form-group">
        <label class="form-label">Categoria</label>
        <select id="kb-categoria" class="form-control">
          <option value="Geral">Geral</option>
          <option value="Impressoras">Impressoras</option>
          <option value="Rede">Rede e Internet</option>
          <option value="Sistemas">Sistemas SESI/SENAI</option>
        </select>
      </div>
      <div class="form-group">
        <label class="form-label">Conteúdo do Artigo *</label>
        <textarea id="kb-conteudo" class="form-control" rows="8" placeholder="Escreva o passo a passo ou explicação aqui..."></textarea>
      </div>
      <div id="kb-err" class="hidden" style="color:var(--erro);font-size:13px;padding:10px;background:rgba(220,53,69,.08);border-radius:8px;"></div>
    `,
    footer: `
      <button class="btn btn-outline" onclick="closeModal('modal-novo-artigo')">Cancelar</button>
      <button class="btn btn-primary" id="kb-save-btn" onclick="kbSalvar()">Salvar Artigo</button>
    `
  });
  openModal('modal-novo-artigo');
}

async function kbSalvar() {
  const btn = document.getElementById('kb-save-btn');
  const err = document.getElementById('kb-err');
  err.classList.add('hidden');

  const dados = {
    titulo: document.getElementById('kb-titulo')?.value?.trim(),
    categoria: document.getElementById('kb-categoria')?.value,
    conteudo: document.getElementById('kb-conteudo')?.value?.trim()
  };

  if (!dados.titulo || !dados.conteudo) { 
    err.textContent = 'Título e conteúdo são obrigatórios.'; 
    err.classList.remove('hidden'); 
    return; 
  }

  btn.disabled = true; 
  btn.textContent = 'Salvando...';

  try {
    await api.post('/conhecimento', dados);
    showToast('Artigo criado!', 'O conhecimento foi compartilhado.', 'success');
    closeModal('modal-novo-artigo');
    kbCarregar();
  } catch (e) { 
    err.textContent = e.erro || 'Erro ao salvar artigo.'; 
    err.classList.remove('hidden'); 
  } finally { 
    btn.disabled = false; 
    btn.textContent = 'Salvar Artigo'; 
  }
}