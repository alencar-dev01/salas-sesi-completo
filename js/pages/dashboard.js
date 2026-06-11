// js/pages/dashboard.js
async function renderDashboard(container) {
  container.innerHTML = `
    <div class="section">
      <div class="stats-grid" id="dash-stats">
        ${skeletonStats()}
      </div>
    </div>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:18px;">
      <div class="card">
        <div class="card-header"><span class="card-title">📅 Próximas Reservas</span></div>
        <div class="card-body" id="dash-proximas"><div class="skeleton skeleton-row"></div><div class="skeleton skeleton-row"></div><div class="skeleton skeleton-row"></div></div>
      </div>
      <div class="card">
        <div class="card-header"><span class="card-title">📊 Mini Calendário</span>
          <button class="btn btn-outline btn-sm" onclick="navigate('calendario')">Ver completo</button>
        </div>
        <div class="card-body" id="dash-mini-cal"></div>
      </div>
    </div>
  `;

  try {
    const data = await api.dashboard();

    document.getElementById('dash-stats').innerHTML = `
      <div class="stat-card">
        <div class="stat-icon blue">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3"/></svg>
        </div>
        <div class="stat-info">
          <div class="stat-value">${data.totalSalas}</div>
          <div class="stat-label">Total de Salas</div>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon green">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
        </div>
        <div class="stat-info">
          <div class="stat-value">${data.salasAtivas}</div>
          <div class="stat-label">Salas Ativas</div>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon orange">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/></svg>
        </div>
        <div class="stat-info">
          <div class="stat-value">${data.reservasHoje}</div>
          <div class="stat-label">Reservas Hoje</div>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon blue">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 6h16M4 10h16M4 14h16M4 18h16"/></svg>
        </div>
        <div class="stat-info">
          <div class="stat-value">${data.totalReservas}</div>
          <div class="stat-label">Total de Reservas</div>
        </div>
      </div>
    `;

    // Próximas reservas
    const prox = document.getElementById('dash-proximas');
    if (!data.proximasReservas.length) {
      prox.innerHTML = '<div class="empty-state"><p>Nenhuma reserva próxima.</p></div>';
    } else {
      prox.innerHTML = data.proximasReservas.map(r => `
        <div style="display:flex;align-items:center;gap:12px;padding:10px 0;border-bottom:1px solid var(--cinza-medio);">
          <div style="width:42px;height:42px;background:var(--azul-principal);border-radius:10px;display:flex;flex-direction:column;align-items:center;justify-content:center;color:white;font-size:10px;font-weight:700;flex-shrink:0;">
            <span style="font-size:16px;line-height:1;">${r.data.split('-')[2]}</span>
            <span style="font-size:8px;opacity:.8;">${monthName(parseInt(r.data.split('-')[1])-1).slice(0,3).toUpperCase()}</span>
          </div>
          <div style="flex:1;min-width:0;">
            <div style="font-weight:700;font-size:13px;color:var(--texto);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${r.titulo}</div>
            <div style="font-size:11px;color:var(--texto-leve);">${r.sala?.nome || '—'} · ${r.horaInicio} – ${r.horaFim}</div>
          </div>
          ${statusBadge(r.status)}
        </div>
      `).join('');
    }

    // Mini calendário
    renderMiniCalendar(document.getElementById('dash-mini-cal'));

  } catch (err) {
    document.getElementById('dash-stats').innerHTML = `<div style="grid-column:1/-1;color:var(--erro);padding:16px;">${err.erro || 'Erro ao carregar dashboard.'}</div>`;
  }
}

function renderMiniCalendar(container) {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();
  const today = now.getDate();
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  let html = `
    <div style="text-align:center;font-weight:700;color:var(--azul-principal);margin-bottom:8px;font-size:14px;">
      ${monthName(month)} ${year}
    </div>
    <div style="display:grid;grid-template-columns:repeat(7,1fr);gap:2px;text-align:center;">
  `;

  ['D','S','T','Q','Q','S','S'].forEach(d => {
    html += `<div style="font-size:10px;font-weight:700;color:var(--texto-leve);padding:4px;">${d}</div>`;
  });

  for (let i = 0; i < firstDay; i++) html += `<div></div>`;

  for (let d = 1; d <= daysInMonth; d++) {
    const isToday = d === today;
    html += `
      <div onclick="navigate('calendario')" style="padding:5px 2px;font-size:12px;font-weight:${isToday?700:400};cursor:pointer;border-radius:50%;
        ${isToday ? 'background:var(--azul-principal);color:white;' : 'color:var(--texto);'} 
        transition:all 0.2s;text-align:center;"
        onmouseover="if(!${isToday})this.style.background='rgba(0,74,152,0.1)'"
        onmouseout="if(!${isToday})this.style.background='transparent'"
      >${d}</div>
    `;
  }

  html += `</div>`;
  container.innerHTML = html;
}