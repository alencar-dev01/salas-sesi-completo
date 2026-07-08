// js/pages/portaria.js

let portariaTimer = null; // 👈 Corrigido aqui

async function renderPortaria(container) {
  // Desenha a estrutura limpa da página
  container.innerHTML = `
    <div style="padding: 20px; max-width: 1000px; margin: 0 auto;">
      <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 20px; flex-wrap: wrap; gap: 15px;">
        <div>
          <h2 style="margin:0; color: var(--azul-principal); font-weight: 800;">Painel da Disciplina</h2>
          <p style="margin:5px 0 0; color: var(--texto-leve); font-size: 13px;">Agendamentos confirmados para o dia de hoje</p>
        </div>
        <div style="background: var(--azul-principal); color: white; padding: 8px 16px; border-radius: 20px; font-weight: 600; font-size: 14px;">
          📅 Hoje: ${new Date().toLocaleDateString('pt-BR')}
        </div>
      </div>

      <div class="card" style="margin-bottom: 20px; padding: 12px;">
        <input type="text" id="portaria-busca" class="form-control" placeholder="🔍 Digite o nome do professor, responsável ou turma para filtrar..." oninput="filtrarPortaria()">
      </div>

      <div class="card" style="padding: 0; overflow-x: auto;">
        <table style="width: 100%; border-collapse: collapse; text-align: left;">
          <thead>
            <tr style="background: #f8f9fa; border-bottom: 20px solid transparent; font-size: 12px; color: var(--texto-leve);">
              <th style="padding: 12px 16px;">HORÁRIO</th>
              <th style="padding: 12px 16px;">SALA / LOCAL</th>
              <th style="padding: 12px 16px;">RESPONSÁVEL / PROFESSOR</th>
              <th style="padding: 12px 16px;">TÍTULO / TURMA</th>
            </tr>
          </thead>
          <tbody id="portaria-tabela-corpo">
            <tr>
              <td colspan="4" style="padding: 30px; text-align: center; color: var(--texto-leve);">Carregando agendamentos...</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  `;

  window.portariaDados = [];

  // Função que vai na API buscar os dados
  async function carregarDados() {
    try {
      const dados = await api.getPortaria(); // 👈 É AQUI que a tela chama o js/api.js!
      window.portariaDados = dados;
      filtrarPortaria(); 
    } catch (e) {
      document.getElementById('portaria-tabela-corpo').innerHTML = `
        <tr><td colspan="4" style="padding: 30px; text-align: center; color: #dc3545; font-weight:600;">Erro ao atualizar dados da portaria.</td></tr>
      `;
    }
  }

  await carregarDados();

  if (portariaTimer) clearInterval(portariaTimer);
  portariaTimer = setInterval(carregarDados, 120000);
}

function filtrarPortaria() {
  const busca = document.getElementById('portaria-busca').value.toLowerCase();
  const corpo = document.getElementById('portaria-tabela-corpo');
  
  const filtrados = window.portariaDados.filter(r => {
    return (r.responsavel || '').toLowerCase().includes(busca) || 
           (r.titulo || '').toLowerCase().includes(busca) || 
           (r.turma || '').toLowerCase().includes(busca);
  });

  if (filtrados.length === 0) {
    corpo.innerHTML = `<tr><td colspan="4" style="padding: 40px; text-align: center; color: var(--texto-leve);">Nenhum agendamento encontrado para hoje.</td></tr>`;
    return;
  }

  corpo.innerHTML = filtrados.map(r => `
    <tr style="border-bottom: 1px solid var(--cinza-medio); font-size: 14px;">
      <td style="padding: 16px; font-weight: 700; color: var(--azul-principal); white-space: nowrap;">
        ⏱️ ${r.horaInicio.slice(0,5)} – ${r.horaFim.slice(0,5)}
      </td>
      <td style="padding: 16px;">
        <span style="font-weight: 600; display:block;">${r.sala?.nome || '—'}</span>
        <small style="color: var(--texto-leve); font-size: 11px;">${r.sala?.localizacao || ''}</small>
      </td>
      <td style="padding: 16px; font-weight: 500;">
        ${r.responsavel.toUpperCase()}
      </td>
      <td style="padding: 16px;">
        <span style="font-weight: 600;">${r.titulo}</span>
        ${r.turma ? `<br><span style="font-size: 11px; padding: 2px 6px; background: #e9ecef; border-radius: 4px; color: #495057;">${r.turma}</span>` : ''}
      </td>
    </tr>
  `).join('');
}