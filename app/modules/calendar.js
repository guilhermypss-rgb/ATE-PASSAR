/* =============================================
   ATÉ PASSAR — Calendar Module
   ============================================= */
const CalendarModule = {
  currentMonth: new Date().getMonth(),
  currentYear: new Date().getFullYear(),

  render(container) {
    const year = this.currentYear;
    const month = this.currentMonth;
    const monthNames = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];
    const dayNames = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
    const today = new Date();
    const todayStr = App.getDateString(today);

    // Calendar days
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const daysInPrev = new Date(year, month, 0).getDate();

    // Get activities for this month
    const monthStart = `${year}-${String(month + 1).padStart(2, '0')}-01`;
    const monthEnd = `${year}-${String(month + 1).padStart(2, '0')}-${String(daysInMonth).padStart(2, '0')}`;
    const monthActivities = App.getActivitiesForRange(monthStart, monthEnd);

    // Group by day
    const dayActivities = {};
    monthActivities.forEach(a => {
      const day = a.date.slice(8, 10);
      if (!dayActivities[day]) dayActivities[day] = [];
      dayActivities[day].push(a);
    });

    // Build calendar grid cells
    let cells = '';

    // Previous month padding
    for (let i = firstDay - 1; i >= 0; i--) {
      cells += `<div class="cal-day other-month"><span>${daysInPrev - i}</span></div>`;
    }

    // Current month days
    for (let d = 1; d <= daysInMonth; d++) {
      const dayStr = String(d).padStart(2, '0');
      const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${dayStr}`;
      const isToday = dateStr === todayStr;
      const acts = dayActivities[dayStr] || [];
      const hasActs = acts.length > 0;

      // Get unique subject colors for dots
      const subjectColors = [...new Set(acts.map(a => {
        const sub = App.getSubjectById(a.subjectId);
        return sub ? sub.color : '#444';
      }))].slice(0, 4);

      const totalSecs = acts.reduce((s, a) => s + (a.duration || 0), 0);

      cells += `
        <div class="cal-day ${isToday ? 'today' : ''} ${hasActs ? 'has-activity' : ''}" data-date="${dateStr}" title="${hasActs ? App.formatDurationShort(totalSecs) : ''}">
          <span>${d}</span>
          ${hasActs ? `<div class="cal-dots">${subjectColors.map(c => `<span style="background:${c}"></span>`).join('')}</div>` : ''}
        </div>
      `;
    }

    // Next month padding
    const totalCells = firstDay + daysInMonth;
    const remaining = (7 - (totalCells % 7)) % 7;
    for (let i = 1; i <= remaining; i++) {
      cells += `<div class="cal-day other-month"><span>${i}</span></div>`;
    }

    // Month stats
    const monthTotal = monthActivities.reduce((s, a) => s + (a.duration || 0), 0);
    const activeDays = Object.keys(dayActivities).length;

    container.innerHTML = `
      <div class="grid-3" style="margin-bottom:24px">
        <div class="app-card stat-card">
          <span class="stat-label">📖 Total do mês</span>
          <span class="stat-value">${App.formatDurationShort(monthTotal)}</span>
          <span class="stat-sub">${monthActivities.length} sessões</span>
        </div>
        <div class="app-card stat-card">
          <span class="stat-label">📅 Dias ativos</span>
          <span class="stat-value">${activeDays}</span>
          <span class="stat-sub">de ${daysInMonth} dias</span>
        </div>
        <div class="app-card stat-card">
          <span class="stat-label">📊 Média diária</span>
          <span class="stat-value">${activeDays > 0 ? App.formatDurationShort(Math.round(monthTotal / activeDays)) : '0m'}</span>
          <span class="stat-sub">por dia ativo</span>
        </div>
      </div>

      <div class="app-card">
        <div class="cal-header">
          <div class="cal-nav">
            <button id="cal-prev">◀</button>
          </div>
          <h3>${monthNames[month]} ${year}</h3>
          <div class="cal-nav">
            <button id="cal-next">▶</button>
          </div>
        </div>
        <div class="cal-grid">
          ${dayNames.map(d => `<div class="cal-day-header">${d}</div>`).join('')}
          ${cells}
        </div>
      </div>

      <div class="app-card" style="margin-top:16px" id="cal-day-details">
        <div class="card-title">Selecione um dia para ver os detalhes</div>
        <p style="color:var(--text3);font-size:14px">Clique em qualquer dia do calendário acima.</p>
      </div>
    `;

    // Events
    document.getElementById('cal-prev')?.addEventListener('click', () => {
      this.currentMonth--;
      if (this.currentMonth < 0) { this.currentMonth = 11; this.currentYear--; }
      this.render(document.getElementById('view-container'));
    });

    document.getElementById('cal-next')?.addEventListener('click', () => {
      this.currentMonth++;
      if (this.currentMonth > 11) { this.currentMonth = 0; this.currentYear++; }
      this.render(document.getElementById('view-container'));
    });

    document.querySelectorAll('.cal-day[data-date]').forEach(cell => {
      cell.addEventListener('click', () => this.showDayDetails(cell.dataset.date));
    });
  },

  showDayDetails(dateStr) {
    const detailsEl = document.getElementById('cal-day-details');
    const activities = App.userData.activities.filter(a => a.date && a.date.startsWith(dateStr));
    const totalSecs = activities.reduce((s, a) => s + (a.duration || 0), 0);
    const d = new Date(dateStr + 'T12:00:00');
    const formatted = d.toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' });

    detailsEl.innerHTML = `
      <div class="card-title">📅 ${formatted}</div>
      ${activities.length > 0 ? `
        <p style="color:var(--text3);font-size:13px;margin-bottom:12px">${activities.length} sessão(ões) • ${App.formatDurationShort(totalSecs)} total</p>
        ${activities.map(a => {
          const sub = App.getSubjectById(a.subjectId);
          return `
            <div class="activity-item">
              <div class="activity-color" style="background:${sub ? sub.color : '#444'}"></div>
              <div class="activity-details">
                <span class="activity-subject">${sub ? sub.name : 'Matéria removida'}</span>
                <span class="activity-content-name">${a.content || ''}${a.notes ? ' — ' + a.notes : ''}</span>
              </div>
              <div style="text-align:right">
                <div class="activity-time">${App.formatDurationShort(a.duration)}</div>
                <div class="activity-date">${App.formatTime(a.date)}</div>
              </div>
            </div>
          `;
        }).join('')}
      ` : '<p style="color:var(--text3);font-size:14px">Nenhuma sessão de estudo neste dia.</p>'}
    `;
  }
};
