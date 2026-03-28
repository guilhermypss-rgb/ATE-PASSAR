/* =============================================
   ATÉ PASSAR — Dashboard Module
   ============================================= */
const DashboardModule = {
  render(container) {
    const todayStr = App.getDateString(new Date());
    const todayActivities = App.getTodayActivities();
    const todaySeconds = todayActivities.reduce((s, a) => s + (a.duration || 0), 0);
    const goalSeconds = (App.userData.settings.dailyGoal || 6) * 3600;
    const pct = Math.min(100, Math.round((todaySeconds / goalSeconds) * 100));

    // Week data
    const weekRange = App.getWeekRange();
    const weekSeconds = App.getTotalSecondsForRange(weekRange.start, weekRange.end);
    const weekActivities = App.getActivitiesForRange(weekRange.start, weekRange.end);

    // Streak
    const streak = this.calculateStreak();

    // Recent activities (last 5)
    const recent = [...App.userData.activities].sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 5);

    // Subject summary
    const subjectTotals = {};
    weekActivities.forEach(a => {
      if (!subjectTotals[a.subjectId]) subjectTotals[a.subjectId] = 0;
      subjectTotals[a.subjectId] += a.duration || 0;
    });

    container.innerHTML = `
      <div class="grid-4" style="margin-bottom:24px">
        <div class="app-card stat-card">
          <span class="stat-label">📖 Hoje</span>
          <span class="stat-value">${App.formatDurationShort(todaySeconds)}</span>
          <span class="stat-sub">Meta: ${App.userData.settings.dailyGoal}h • ${pct}%</span>
        </div>
        <div class="app-card stat-card">
          <span class="stat-label">📅 Esta semana</span>
          <span class="stat-value">${App.formatDurationShort(weekSeconds)}</span>
          <span class="stat-sub">${weekActivities.length} sessões</span>
        </div>
        <div class="app-card stat-card">
          <span class="stat-label">🔥 Sequência</span>
          <span class="stat-value">${streak}</span>
          <span class="stat-sub">dias seguidos</span>
        </div>
        <div class="app-card stat-card">
          <span class="stat-label">📚 Matérias</span>
          <span class="stat-value">${App.userData.subjects.length}</span>
          <span class="stat-sub">cadastradas</span>
        </div>
      </div>

      <div class="grid-2" style="margin-bottom:24px">
        <div class="app-card">
          <div class="card-title">📊 Progresso de hoje</div>
          <div style="margin-bottom:12px">
            <div style="display:flex;justify-content:space-between;font-size:13px;color:var(--text3);margin-bottom:6px">
              <span>${App.formatDurationShort(todaySeconds)}</span>
              <span>${App.userData.settings.dailyGoal}h</span>
            </div>
            <div style="height:10px;background:rgba(255,255,255,.06);border-radius:5px;overflow:hidden">
              <div style="height:100%;width:${pct}%;background:var(--grad);border-radius:5px;transition:width .5s"></div>
            </div>
          </div>
          ${todayActivities.length > 0 ? `
            <div style="display:flex;flex-direction:column;gap:4px;margin-top:12px">
              ${todayActivities.map(a => {
                const sub = App.getSubjectById(a.subjectId);
                return `<div style="display:flex;align-items:center;gap:8px;font-size:13px">
                  <span class="color-dot" style="background:${sub ? sub.color : '#444'}"></span>
                  <span style="flex:1;color:var(--text2)">${sub ? sub.name : 'Sem matéria'}</span>
                  <span style="color:var(--text3)">${App.formatDurationShort(a.duration)}</span>
                </div>`;
              }).join('')}
            </div>
          ` : '<p style="color:var(--text3);font-size:14px">Nenhuma sessão hoje. Comece agora!</p>'}
        </div>

        <div class="app-card">
          <div class="card-title">📈 Últimos 7 dias</div>
          <div class="chart-wrap" style="height:200px">
            <canvas id="dash-week-chart"></canvas>
          </div>
        </div>
      </div>

      <div class="grid-2">
        <div class="app-card">
          <div class="card-title">🕐 Atividades recentes</div>
          ${recent.length > 0 ? `
            <div style="display:flex;flex-direction:column;gap:0">
              ${recent.map(a => {
                const sub = App.getSubjectById(a.subjectId);
                const hasQuestions = a.questionsCount && a.questionsCount > 0;
                return `<div class="activity-item">
                  <div class="activity-color" style="background:${sub ? sub.color : '#444'}"></div>
                  <div class="activity-details">
                    <span class="activity-subject">${sub ? sub.name : 'Sem matéria'}</span>
                    <span class="activity-content-name">${a.content || ''}</span>
                    ${hasQuestions ? `<span style="font-size:12px;color:var(--text3)">✅ ${a.correctCount}/${a.questionsCount} (${Math.round((a.correctCount/a.questionsCount)*100)}%)</span>` : ''}
                  </div>
                  <div style="text-align:right">
                    <div class="activity-time">${App.formatDurationShort(a.duration)}</div>
                    <div class="activity-date">${App.formatDate(a.date)}</div>
                  </div>
                </div>`;
              }).join('')}
            </div>
          ` : '<div class="empty-state"><p class="empty-desc">Nenhuma atividade registrada ainda.</p><button class="btn-primary" onclick="App.navigate(\'timer\')">⏱️ Iniciar sessão</button></div>'}
        </div>

        <div class="app-card">
          <div class="card-title">📚 Distribuição semanal</div>
          ${Object.keys(subjectTotals).length > 0 ? `
            <div class="chart-wrap" style="height:200px">
              <canvas id="dash-pie-chart"></canvas>
            </div>
          ` : '<div class="empty-state"><p class="empty-desc">Estude esta semana para gerar o gráfico.</p></div>'}
        </div>
      </div>
    `;

    // Render charts
    setTimeout(() => this.renderCharts(weekRange, subjectTotals), 50);
  },

  renderCharts(weekRange, subjectTotals) {
    // Week bar chart
    const weekCanvas = document.getElementById('dash-week-chart');
    if (weekCanvas) {
      const labels = [];
      const data = [];
      const dayNames = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
      for (let i = 0; i < 7; i++) {
        const d = new Date(weekRange.start);
        d.setDate(d.getDate() + i);
        const dateStr = App.getDateString(d);
        labels.push(dayNames[d.getDay()]);
        data.push(+(App.getTotalSecondsForDate(dateStr) / 3600).toFixed(1));
      }
      App.charts.dashWeek = new Chart(weekCanvas, {
        type: 'bar',
        data: {
          labels,
          datasets: [{
            data,
            backgroundColor: 'rgba(124,58,237,0.5)',
            borderColor: '#7C3AED',
            borderWidth: 1,
            borderRadius: 6,
            maxBarThickness: 32
          }]
        },
        options: {
          responsive: true, maintainAspectRatio: false,
          plugins: { legend: { display: false } },
          scales: {
            y: { beginAtZero: true, ticks: { color: '#64748B', font: { size: 11 }, callback: v => v + 'h' }, grid: { color: 'rgba(255,255,255,.04)' } },
            x: { ticks: { color: '#64748B', font: { size: 11 } }, grid: { display: false } }
          }
        }
      });
    }

    // Pie chart
    const pieCanvas = document.getElementById('dash-pie-chart');
    if (pieCanvas && Object.keys(subjectTotals).length > 0) {
      const labels = [];
      const data = [];
      const colors = [];
      Object.entries(subjectTotals).forEach(([id, secs]) => {
        const sub = App.getSubjectById(id);
        labels.push(sub ? sub.name : 'Sem matéria');
        data.push(+(secs / 3600).toFixed(1));
        colors.push(sub ? sub.color : '#444');
      });
      App.charts.dashPie = new Chart(pieCanvas, {
        type: 'doughnut',
        data: {
          labels,
          datasets: [{ data, backgroundColor: colors, borderWidth: 0 }]
        },
        options: {
          responsive: true, maintainAspectRatio: false,
          plugins: { legend: { position: 'right', labels: { color: '#94A3B8', font: { size: 12 }, padding: 12, usePointStyle: true, pointStyleWidth: 10 } } },
          cutout: '65%'
        }
      });
    }
  },

  calculateStreak() {
    let streak = 0;
    const today = new Date();
    for (let i = 0; i < 365; i++) {
      const d = new Date(today);
      d.setDate(today.getDate() - i);
      const dateStr = App.getDateString(d);
      const secs = App.getTotalSecondsForDate(dateStr);
      if (secs > 0) {
        streak++;
      } else if (i > 0) {
        break;
      }
    }
    return streak;
  }
};
