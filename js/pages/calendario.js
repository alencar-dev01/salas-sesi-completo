// js/pages/calendario.js
let calState = {
  view: 'mensal',
  year: new Date().getFullYear(),
  month: new Date().getMonth(),
  weekStart: null,
  reservas: [],
  salas: [],
  filtroSala: ''
};

// async function renderCalendario(container) {
//   container.innerHTML = `
//     <div class="card" style="margin-bottom:16px;padding:12px 16px;">
//       <div style="display:flex;align-items:center;gap:10px;flex-wrap:wrap;">
//         <label style="font-size:12px;font-weight:600;color:var(--texto-leve);">Filtrar sala:</label>
//         <select id="cal-filtro-sala" class="form-control" style="width:auto;min-width:160px;" onchange="calFiltroSala()">
//           <option value="">Todas as salas</option>
//         </select>
//         <div style="margin-left:auto;display:flex;gap:8px;">
//           <span style="display:flex;align-items:center;gap:5px;font-size:11px;"><span class="color-dot" style="background:#8DC63F;"></span>Confirmada</span>
//           <span style="display:flex;align-items:center;gap:5px;font-size:11px;"><span class="color-dot" style="background:#F36F21;"></span>Pendente</span>
//           <span style="display:flex;align-items:center;gap:5px;font-size:11px;"><span class="color-dot" style="background:#DC3545;"></span>Cancelada</span>
//         </div>
//       </div>
//     </div>
//     <div class="calendar-wrapper" id="cal-wrapper">
//       <div class="calendar-header">
//         <button class="calendar-nav-btn" id="cal-prev" onclick="calNav(-1)">‹ Anterior</button>
//         <div style="text-align:center;">
//           <div class="calendar-title" id="cal-title">—</div>
//           <div class="calendar-view-tabs" style="margin-top:8px;">
//             <button class="calendar-view-tab active" onclick="calSetView('mensal')">Mês</button>
//             <button class="calendar-view-tab" onclick="calSetView('semanal')">Semana</button>
//             <button class="calendar-view-tab" onclick="calSetView('diario')">Dia</button>
//           </div>
//         </div>
//         <button class="calendar-nav-btn" id="cal-next" onclick="calNav(1)">Próximo ›</button>
//       </div>
//       <div class="calendar-grid" id="cal-body">
//         <div style="padding:32px;text-align:center;color:var(--texto-leve);">Carregando...</div>
//       </div>
//     </div>
//   `;

//   // Carrega salas
//   try {
//     const s = await api.getSalas({ status: 'ativa', limit: 100 });
//     calState.salas = s.dados;
//     const sel = document.getElementById('cal-filtro-sala');
//     s.dados.forEach(sala => {
//       sel.innerHTML += `<option value="${sala.id}">${sala.nome}</option>`;
//     });
//   } catch(e) {}

//   if (!calState.weekStart) {
//     const now = new Date();
//     const day = now.getDay();
//     calState.weekStart = new Date(now);
//     calState.weekStart.setDate(now.getDate() - day);
//   }

//   await calCarregarReservas();
//   calRender();
// }

//semanl e diario
{/* <button class="calendar-view-tab" onclick="calSetView('semanal')">Semana</button>
<button class="calendar-view-tab" onclick="calSetView('diario')">Dia</button> */}

async function renderCalendario(container) {
  container.innerHTML = `
    <div class="card" style="margin-bottom:16px;padding:12px 16px;">
      <div style="display:flex;align-items:center;gap:10px;flex-wrap:wrap;">
        <label style="font-size:12px;font-weight:600;color:var(--texto-leve);">Filtrar sala:</label>
        <select id="cal-filtro-sala" class="form-control" style="width:auto;min-width:160px;" onchange="calFiltroSala()">
          <option value="">Todas as salas</option>
        </select>
        <div style="margin-left:auto;display:flex;gap:8px;">
          <span style="display:flex;align-items:center;gap:5px;font-size:11px;"><span class="color-dot" style="background:#8DC63F;"></span>Confirmada</span>
          <span style="display:flex;align-items:center;gap:5px;font-size:11px;"><span class="color-dot" style="background:#F36F21;"></span>Pendente</span>
          <span style="display:flex;align-items:center;gap:5px;font-size:11px;"><span class="color-dot" style="background:#DC3545;"></span>Cancelada</span>
        </div>
      </div>
    </div>
    <div class="calendar-wrapper" id="cal-wrapper">
      <div class="calendar-header">
        <button class="calendar-nav-btn" id="cal-prev" onclick="calNav(-1)">‹ Anterior</button>
        <div style="text-align:center;">
          <div class="calendar-title" id="cal-title">—</div>
          <div class="calendar-view-tabs" style="margin-top:8px;">
            <button class="calendar-view-tab active" onclick="calSetView('mensal')">Mês</button>
          </div>
        </div>
        <button class="calendar-nav-btn" id="cal-next" onclick="calNav(1)">Próximo ›</button>
      </div>
      <div class="calendar-grid" id="cal-body">
        <div style="padding:32px;text-align:center;color:var(--texto-leve);">Carregando...</div>
      </div>
    </div>

    <div id="cal-box-dia" style="display: none; position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.5); z-index: 9999; align-items: center; justify-content: center; backdrop-filter: blur(2px);">
      <div class="card" style="width: 90%; max-width: 500px; padding: 20px; position: relative; border-radius: 12px; box-shadow: 0 10px 25px rgba(0,0,0,0.2); animation: fadeIn 0.2s ease;">
        <button onclick="document.getElementById('cal-box-dia').style.display='none'" style="position: absolute; top: 15px; right: 15px; border: none; background: none; font-size: 22px; cursor: pointer; color: var(--texto-leve);">&times;</button>
        <h3 id="cal-box-dia-titulo" style="margin-top: 0; margin-bottom: 15px; font-size: 16px; font-weight: 700; color: var(--azul-principal);">Reservas do Dia</h3>
        <div id="cal-box-dia-conteudo" style="max-height: 380px; overflow-y: auto; padding-right: 5px;">
          </div>
      </div>
    </div>
  `;

  // Carrega salas
  try {
    const s = await api.getSalas({ status: 'ativa', limit: 100 });
    calState.salas = s.dados;
    const sel = document.getElementById('cal-filtro-sala');
    s.dados.forEach(sala => {
      sel.innerHTML += `<option value="${sala.id}">${sala.nome}</option>`;
    });
  } catch(e) {}

  if (!calState.weekStart) {
    const now = new Date();
    const day = now.getDay();
    calState.weekStart = new Date(now);
    calState.weekStart.setDate(now.getDate() - day);
  }

  await calCarregarReservas();
  calRender();
}

function calFiltroSala() {
  calState.filtroSala = document.getElementById('cal-filtro-sala').value;
  calRender();
}

function calSetView(v) {
  calState.view = v;
  document.querySelectorAll('.calendar-view-tab').forEach((el, i) => {
    el.classList.toggle('active', ['mensal','semanal','diario'][i] === v);
  });
  calRender();
}

async function calNav(dir) {
  if (calState.view === 'mensal') {
    calState.month += dir;
    if (calState.month < 0) { calState.month = 11; calState.year--; }
    if (calState.month > 11) { calState.month = 0; calState.year++; }
  } else if (calState.view === 'semanal') {
    calState.weekStart.setDate(calState.weekStart.getDate() + dir * 7);
  } else {
    const d = new Date(calState.weekStart);
    d.setDate(d.getDate() + dir);
    calState.weekStart = d;
  }
  await calCarregarReservas();
  calRender();
}

async function calCarregarReservas() {
  let di, df;
  if (calState.view === 'mensal') {
    di = `${calState.year}-${String(calState.month+1).padStart(2,'0')}-01`;
    df = `${calState.year}-${String(calState.month+1).padStart(2,'0')}-${new Date(calState.year, calState.month+1, 0).getDate()}`;
  } else if (calState.view === 'semanal') {
    di = calState.weekStart.toISOString().split('T')[0];
    const end = new Date(calState.weekStart); end.setDate(end.getDate()+6);
    df = end.toISOString().split('T')[0];
  } else {
    di = df = calState.weekStart.toISOString().split('T')[0];
  }
  try {
    const params = { dataInicio: di, dataFim: df };
    if (calState.filtroSala) params.salaId = calState.filtroSala;
    calState.reservas = await api.getCalendario(params);
  } catch(e) { calState.reservas = []; }
}

function calRender() {
  const body = document.getElementById('cal-body');
  if (!body) return;

  if (calState.view === 'mensal') calRenderMensal(body);
  else if (calState.view === 'semanal') calRenderSemanal(body);
  else calRenderDiario(body);
}

function calRenderMensal(body) {
  const { year, month } = calState;
  document.getElementById('cal-title').textContent = `${monthName(month)} ${year}`;

  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const prevDays = new Date(year, month, 0).getDate();
  const today = new Date();
  const todayStr = today.toISOString().split('T')[0];

  // Indexar reservas por data
  const byDate = {};
  calState.reservas.forEach(r => {
    if (!byDate[r.data]) byDate[r.data] = [];
    byDate[r.data].push(r);
  });

  let html = `
    <div class="calendar-days-header">
      ${['Dom','Seg','Ter','Qua','Qui','Sex','Sáb'].map(d => `<div class="cal-day-header">${d}</div>`).join('')}
    </div>
    <div class="calendar-days">
  `;

  // Dias do mês anterior
  for (let i = firstDay - 1; i >= 0; i--) {
    html += `<div class="cal-day other-month"><span class="cal-day-num">${prevDays - i}</span></div>`;
  }

  // Dias do mês atual
  for (let d = 1; d <= daysInMonth; d++) {
    const dateStr = `${year}-${String(month+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
    const isToday = dateStr === todayStr;
    const dayReservas = byDate[dateStr] || [];
    const visible = dayReservas.slice(0, 2);
    const more = dayReservas.length - visible.length;

    html += `
      <div class="cal-day ${isToday ? 'today' : ''}" onclick="calDayClick('${dateStr}')">
        <span class="cal-day-num">${d}</span>
        ${visible.map(r => `<div class="cal-event ${r.status}" title="${r.titulo} (${r.sala?.nome||''})">${r.horaInicio} ${r.titulo}</div>`).join('')}
        ${more > 0 ? `<div class="cal-more">+${more} mais</div>` : ''}
      </div>
    `;
  }

  // Dias do mês seguinte
  const totalCells = Math.ceil((firstDay + daysInMonth) / 7) * 7;
  const afterDays = totalCells - firstDay - daysInMonth;
  for (let d = 1; d <= afterDays; d++) {
    html += `<div class="cal-day other-month"><span class="cal-day-num">${d}</span></div>`;
  }

  html += `</div>`;
  body.innerHTML = html;
}

function calRenderSemanal(body) {
  const ws = calState.weekStart;
  const days = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(ws);
    d.setDate(ws.getDate() + i);
    days.push(d);
  }

  const startStr = days[0].toLocaleDateString('pt-BR', { day:'2-digit', month:'short' });
  const endStr = days[6].toLocaleDateString('pt-BR', { day:'2-digit', month:'short', year:'numeric' });
  document.getElementById('cal-title').textContent = `${startStr} – ${endStr}`;

  const hours = [];
  for (let h = 7; h <= 22; h++) hours.push(`${String(h).padStart(2,'0')}:00`);

  // Cabeçalho
  let html = `<div style="overflow-x:auto;"><table style="width:100%;border-collapse:collapse;min-width:600px;">`;
  html += `<thead><tr><th style="width:60px;padding:8px;font-size:11px;color:var(--texto-leve);border-right:1px solid var(--cinza-medio);border-bottom:1.5px solid var(--cinza-medio);"></th>`;
  days.forEach(d => {
    const isToday = d.toISOString().split('T')[0] === new Date().toISOString().split('T')[0];
    html += `<th style="padding:8px 4px;font-size:12px;font-weight:700;border-right:1px solid var(--cinza-medio);border-bottom:1.5px solid var(--cinza-medio);color:${isToday?'var(--azul-principal)':'var(--texto)'};min-width:90px;">
      <div>${weekDayShort(d.getDay())}</div>
      <div style="font-size:18px;${isToday?'background:var(--azul-principal);color:white;':''}width:28px;height:28px;border-radius:50%;display:flex;align-items:center;justify-content:center;margin:2px auto 0;">${d.getDate()}</div>
    </th>`;
  });
  html += `</tr></thead><tbody>`;

  const byDateHour = {};
  calState.reservas.forEach(r => {
    const key = r.data + '_' + r.horaInicio.slice(0,5);
    if (!byDateHour[key]) byDateHour[key] = [];
    byDateHour[key].push(r);
  });

  hours.forEach(h => {
    html += `<tr>`;
    html += `<td style="padding:4px 8px;font-size:11px;color:var(--texto-leve);text-align:right;border-right:1px solid var(--cinza-medio);border-bottom:1px solid var(--cinza-medio);vertical-align:top;white-space:nowrap;">${h}</td>`;
    days.forEach(d => {
      const dateStr = d.toISOString().split('T')[0];
      const key = dateStr + '_' + h;
      const reservas = byDateHour[key] || [];
      let cells = '';
      if (reservas.length) {
        cells = reservas.map(r => {
          const colorMap = { confirmada:'#8DC63F', pendente:'#F36F21', cancelada:'#DC3545' };
          return `<div style="background:${colorMap[r.status]||'#8DC63F'};color:white;border-radius:4px;padding:2px 4px;font-size:10px;font-weight:600;margin-bottom:2px;cursor:pointer;overflow:hidden;white-space:nowrap;text-overflow:ellipsis;"
            title="${r.titulo} – ${r.sala?.nome||''}" onclick="calAbrirReserva(${r.id})">${r.titulo}</div>`;
        }).join('');
      }
      html += `<td style="border-right:1px solid var(--cinza-medio);border-bottom:1px solid var(--cinza-medio);vertical-align:top;padding:3px;min-height:48px;cursor:pointer;"
        onclick="if(event.target===this)calNovaReservaDia('${dateStr}','${h}')">${cells}</td>`;
    });
    html += `</tr>`;
  });

  html += `</tbody></table></div>`;
  body.innerHTML = html;
}

function calRenderDiario(body) {
  const d = calState.weekStart;
  const dateStr = d.toISOString().split('T')[0];
  document.getElementById('cal-title').textContent = d.toLocaleDateString('pt-BR', { weekday:'long', day:'numeric', month:'long', year:'numeric' });

  const hours = [];
  for (let h = 7; h <= 22; h++) hours.push(`${String(h).padStart(2,'0')}:00`);

  const byHour = {};
  calState.reservas.filter(r => r.data === dateStr).forEach(r => {
    const h = r.horaInicio.slice(0,5);
    if (!byHour[h]) byHour[h] = [];
    byHour[h].push(r);
  });

  let html = '';
  hours.forEach(h => {
    const reservas = byHour[h] || [];
    html += `
      <div style="display:flex;border-bottom:1px solid var(--cinza-medio);min-height:56px;">
        <div style="width:70px;padding:8px;font-size:12px;color:var(--texto-leve);text-align:right;flex-shrink:0;border-right:1px solid var(--cinza-medio);">${h}</div>
        <div style="flex:1;padding:4px 8px;${!reservas.length?'cursor:pointer;':''}" onclick="if(event.target===this)calNovaReservaDia('${dateStr}','${h}')">
          ${reservas.map(r => {
            const colorMap = { confirmada:'#8DC63F', pendente:'#F36F21', cancelada:'#DC3545' };
            return `<div style="background:${colorMap[r.status]||'#8DC63F'};color:white;border-radius:6px;padding:6px 10px;margin-bottom:3px;cursor:pointer;"
              onclick="calAbrirReserva(${r.id})">
              <div style="font-weight:700;font-size:13px;">${r.titulo}</div>
              <div style="font-size:11px;opacity:.9;">${r.sala?.nome||''} · ${r.horaInicio}–${r.horaFim} · ${r.usuario?.nome||''}</div>
            </div>`;
          }).join('')}
        </div>
      </div>
    `;
  });

  body.innerHTML = html || '<div class="empty-state"><p>Nenhuma reserva neste dia.</p></div>';
}

// function calDayClick(dateStr) {
//   calState.weekStart = new Date(dateStr + 'T12:00:00');
//   calSetView('diario');
// }

function calDayClick(dateStr) {
  // 1. Filtra as reservas que pertencem exatamente ao dia clicado
  const reservasDoDia = calState.reservas.filter(r => r.data === dateStr);
  
  // 2. Formata a data para exibir no título da Box (YYYY-MM-DD -> DD/MM/YYYY)
  const [ano, mes, dia] = dateStr.split('-');
  document.getElementById('cal-box-dia-titulo').innerHTML = `📅 Reservas do Dia <strong>${dia}/${mes}/${ano}</strong>`;
  
  const conteudo = document.getElementById('cal-box-dia-conteudo');
  
  // 3. Se não houver reservas, exibe mensagem amigável
  if (reservasDoDia.length === 0) {
    conteudo.innerHTML = `
      <div style="text-align: center; color: var(--texto-leve); padding: 30px 10px; font-size: 13px;">
        Nenhuma reserva registrada para este dia.
      </div>`;
  } else {
    // Mapeamento de cores baseado no status
    const colorMap = { confirmada: '#8DC63F', pendente: '#F36F21', cancelada: '#DC3545' };
    
    // 4. Monta o HTML dos cartões de reserva
    conteudo.innerHTML = reservasDoDia.map(r => `
      <div style="background: #f8f9fa; border-left: 5px solid ${colorMap[r.status] || '#8DC63F'}; border-radius: 6px; padding: 12px; margin-bottom: 10px; box-shadow: 0 2px 4px rgba(0,0,0,0.02);">
        <div style="display: flex; justify-content: space-between; align-items: flex-start; gap: 10px;">
          <span style="font-weight: 700; font-size: 13px; color: var(--texto); display: block; max-width: 75%;">${r.titulo}</span>
          <span style="font-size: 10px; font-weight: 700; padding: 2px 6px; border-radius: 4px; background: ${colorMap[r.status]}20; color: ${colorMap[r.status]}; text-transform: uppercase;">
            ${r.status}
          </span>
        </div>
        
        <div style="font-size: 11px; color: var(--texto-leve); margin-top: 6px; line-height: 1.5;">
          <strong>Sala:</strong> ${r.sala?.nome || '—'} <br>
          <strong>Horário:</strong> ${r.horaInicio.slice(0,5)} às ${r.horaFim.slice(0,5)} <br>
          <strong>Responsável:</strong> ${r.responsavel || r.usuario?.nome || '—'}
          ${r.turma ? `<br><strong>Turma:</strong> ${r.turma}` : ''}
        </div>
      </div>
    `).join('');
  }
  
  // 5. Faz a box "surgir" na tela mudando o display de 'none' para 'flex'
  document.getElementById('cal-box-dia').style.display = 'flex';
}

function calNovaReservaDia(data, hora) {
  navigate('nova-reserva');
  setTimeout(() => {
    const fd = document.getElementById('res-data');
    const fh = document.getElementById('res-hora-inicio');
    if (fd) fd.value = data;
    if (fh) fh.value = hora;
  }, 100);
}

async function calAbrirReserva(id) {
  try {
    const r = await api.getReserva(id);
    const colorMap = { confirmada:'#8DC63F', pendente:'#F36F21', cancelada:'#DC3545' };
    createModal({
      id: 'modal-ver-reserva',
      title: '📋 Detalhes da Reserva',
      body: `
        <div style="display:grid;gap:10px;">
          <div style="background:${colorMap[r.status]||'#8DC63F'};color:white;border-radius:8px;padding:12px 16px;">
            <div style="font-size:16px;font-weight:800;">${r.titulo}</div>
            <div style="font-size:12px;opacity:.85;">${statusBadge(r.status).replace('badge','').replace(/style="[^"]*"/g,'')} ${r.status}</div>
          </div>
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;">
            <div><div style="font-size:11px;color:var(--texto-leve);font-weight:600;">SALA</div><div style="font-weight:700;">${r.sala?.nome||'—'}</div></div>
            <div><div style="font-size:11px;color:var(--texto-leve);font-weight:600;">DATA</div><div style="font-weight:700;">${formatDate(r.data)}</div></div>
            <div><div style="font-size:11px;color:var(--texto-leve);font-weight:600;">HORÁRIO</div><div style="font-weight:700;">${r.horaInicio} – ${r.horaFim}</div></div>
            <div><div style="font-size:11px;color:var(--texto-leve);font-weight:600;">RESPONSÁVEL</div><div style="font-weight:700;">${r.responsavel||'—'}</div></div>
            ${r.turma ? `<div><div style="font-size:11px;color:var(--texto-leve);font-weight:600;">TURMA</div><div style="font-weight:700;">${r.turma}</div></div>` : ''}
          </div>
          ${r.descricao ? `<div><div style="font-size:11px;color:var(--texto-leve);font-weight:600;margin-bottom:4px;">DESCRIÇÃO</div><div style="font-size:13px;">${r.descricao}</div></div>` : ''}
          ${r.observacoes ? `<div><div style="font-size:11px;color:var(--texto-leve);font-weight:600;margin-bottom:4px;">OBSERVAÇÕES</div><div style="font-size:13px;">${r.observacoes}</div></div>` : ''}
        </div>
      `,
      footer: `<button class="btn btn-outline" onclick="closeModal('modal-ver-reserva')">Fechar</button>`
    });
    openModal('modal-ver-reserva');
  } catch(e) { showToast('Erro', 'Não foi possível carregar a reserva.', 'error'); }
}