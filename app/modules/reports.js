/* =============================================
   ATÉ PASSAR — Reports Module
   ============================================= */
const ReportsModule = {
  period: 'today',
  customStart: '',
  customEnd: '',
  tab: 'desempenho',
  tempoGroup: 'materias',
  tempoSubject: '',
  desempenhoGroup: 'materias',
  desempenhoSubject: '',

  render(container) {
    const periods = [
      { id: 'today', label: 'Hoje' },
      { id: 'week', label: 'Semana' },
      { id: 'month', label: 'Mês' },
      { id: 'year', label: 'Ano' },
      { id: 'all', label: 'Tudo' },
      { id: 'custom', label: 'Personalizado' }
    ];

    const { startDate, endDate, activities } = this.getRange();
    const totalSecs = activities.reduce((s, a) => s + (a.duration || 0), 0);
    const activeDays = new Set(activities.map(a => a.date?.slice(0, 10))).size;
    const avgPerDay = activeDays > 0 ? Math.round(totalSecs / activeDays) : 0;

    const totalQuestions = activities.reduce((sum, a) => sum + (a.questionsCount || 0), 0);
    const totalCorrect = activities.reduce((sum, a) => sum + (a.correctCount || 0), 0);
    const accuracy = totalQuestions > 0 ? Math.round((totalCorrect / totalQuestions) * 100) : 0;

    const subjectTotals = {};
    activities.forEach(a => {
      if (!subjectTotals[a.subjectId]) subjectTotals[a.subjectId] = { time: 0, q: 0, c: 0 };
      subjectTotals[a.subjectId].time += a.duration || 0;
      subjectTotals[a.subjectId].q += a.questionsCount || 0;
      subjectTotals[a.subjectId].c += a.correctCount || 0;
    });
    const sortedSubjectsByTime = Object.entries(subjectTotals).sort((a, b) => b[1].time - a[1].time);

    let customInputs = '';
    if (this.period === 'custom') {
      if (!this.customStart) this.customStart = App.getDateString(new Date());
      if (!this.customEnd) this.customEnd = App.getDateString(new Date());
      
      customInputs = `
        <div style="display:flex; gap:12px; margin-top:12px; align-items:center;">
          <input type="date" id="report-custom-start" class="app-input" value="${this.customStart}" style="width: auto; padding: 6px 12px;">
          <span style="color:var(--text3)">até</span>
          <input type="date" id="report-custom-end" class="app-input" value="${this.customEnd}" style="width: auto; padding: 6px 12px;">
          <button id="report-custom-btn" class="btn-primary" style="padding: 6px 16px; border-radius: 6px;">Buscar</button>
        </div>
      `;
    }

    let tabContent = '';

    if (this.tab === 'tempo_estudo') {
      const allSubjectsInPeriod = new Set(activities.map(a => a.subjectId));
      let subjectOptions = '<option value="">Selecione uma matéria</option>';
      allSubjectsInPeriod.forEach(id => {
        const s = App.getSubjectById(id);
        if (s) subjectOptions += `<option value="${id}" ${this.tempoSubject === id ? 'selected' : ''}>${s.name}</option>`;
      });

      let totalsByEntity = {};
      let totalTimeForView = 0;
      let titleForView = 'Tempo total no período';

      if (this.tempoGroup === 'materias') {
        activities.forEach(a => {
          if (!totalsByEntity[a.subjectId]) totalsByEntity[a.subjectId] = 0;
          totalsByEntity[a.subjectId] += a.duration || 0;
          totalTimeForView += a.duration || 0;
        });
      } else {
        activities.filter(a => a.subjectId === this.tempoSubject).forEach(a => {
          const c = a.content || 'Sem conteúdo';
          if (!totalsByEntity[c]) totalsByEntity[c] = 0;
          totalsByEntity[c] += a.duration || 0;
          totalTimeForView += a.duration || 0;
        });
        const sub = App.getSubjectById(this.tempoSubject);
        if (sub) titleForView = `Tempo total em ${sub.name}`;
        else titleForView = 'Selecione uma matéria para ver os conteúdos';
      }

      const sortedEntities = Object.entries(totalsByEntity).sort((a,b) => b[1] - a[1]);

      tabContent = `
        <div class="app-card" style="margin-top:24px">
          <div style="display:flex;gap:32px;margin-bottom:24px;align-items:flex-end">
            <label style="display:flex;align-items:center;gap:8px;cursor:pointer">
              <input type="radio" name="tempo-group" value="materias" ${this.tempoGroup === 'materias' ? 'checked' : ''} style="accent-color:var(--primary)">
              <div style="display:flex;flex-direction:column">
                <strong style="color:var(--text)">Matérias</strong>
                <span style="font-size:11px;color:var(--text3)">Tempo agrupado por matérias</span>
              </div>
            </label>
            <label style="display:flex;align-items:center;gap:8px;cursor:pointer">
              <input type="radio" name="tempo-group" value="conteudos" ${this.tempoGroup === 'conteudos' ? 'checked' : ''} style="accent-color:var(--primary)">
              <div style="display:flex;flex-direction:column">
                <strong style="color:var(--text)">Conteúdos</strong>
                <span style="font-size:11px;color:var(--text3)">Tempo agrupado por conteúdos de uma matéria</span>
              </div>
            </label>
            ${this.tempoGroup === 'conteudos' ? `
              <div style="flex:1">
                <select id="tempo-subject-select" class="app-input" style="max-width:300px;background:var(--bg);border-color:rgba(255,255,255,0.1);color:var(--text)">
                  ${subjectOptions}
                </select>
              </div>
            ` : '<div></div>'}
          </div>

          <div style="display:flex;gap:40px;flex-wrap:wrap">
            <div style="flex:1.5;min-width:300px;position:relative;display:flex;justify-content:center">
              <div class="chart-wrap" style="width:100%;max-width:400px;height:350px"><canvas id="chart-tempo-pie"></canvas></div>
            </div>
            <div style="flex:2;min-width:300px">
              <div style="font-family:var(--font);font-size:2.4rem;font-weight:700;color:var(--text)">${App.formatDuration(totalTimeForView)}</div>
              <div style="font-size:13px;color:var(--text3);margin-bottom:24px">${titleForView}</div>
              
              <div style="display:flex;flex-direction:column;gap:12px">
                ${sortedEntities.map(([idOrName, time], i) => {
                  const PCOLORS = ['#EF4444', '#F97316', '#F59E0B', '#84CC16', '#10B981', '#06B6D4', '#3B82F6', '#6366F1', '#8B5CF6', '#D946EF', '#F43F5E'];
                  let name = idOrName;
                  let color = PCOLORS[i % PCOLORS.length];
                  if (this.tempoGroup === 'materias') {
                    const sub = App.getSubjectById(idOrName);
                    if (sub) { name = sub.name; color = sub.color; }
                    else { name = 'Removida'; color = '#444'; }
                  }
                  
                  const pct = totalTimeForView > 0 ? ((time / totalTimeForView) * 100).toFixed(1) : 0;
                  return `
                    <div style="display:flex;align-items:center;gap:12px;font-size:14px">
                      <span class="color-dot" style="background:${color};width:14px;height:14px;border-radius:50%"></span>
                      <span style="flex:1;font-weight:600;color:var(--text)">${name}</span>
                      <span style="font-family:var(--font);font-weight:700;color:var(--text2)">⏱️ ${App.formatDurationShort(time)}</span>
                      <span style="color:var(--text3);min-width:55px;text-align:right">(${pct.replace('.',',')}%)</span>
                    </div>
                  `;
                }).join('')}
              </div>
            </div>
          </div>
        </div>
      `;
    } else if (this.tab === 'desempenho') {
      const allSubjectsInPeriod = new Set(activities.map(a => a.subjectId));
      let subjectOptions = '<option value="">Selecione uma matéria</option>';
      allSubjectsInPeriod.forEach(id => {
        const s = App.getSubjectById(id);
        if (s) subjectOptions += `<option value="${id}" ${this.desempenhoSubject === id ? 'selected' : ''}>${s.name}</option>`;
      });

      let scopeActivities = activities;
      let titleForView = `Média de desempenho em ${startDate.split('-').reverse().join('/')} a ${endDate.split('-').reverse().join('/')}`;

      let totalsByEntity = {};
      let totalQ = 0;
      let totalC = 0;

      if (this.desempenhoGroup === 'materias') {
        activities.forEach(a => {
          if (!totalsByEntity[a.subjectId]) totalsByEntity[a.subjectId] = { q: 0, c: 0 };
          totalsByEntity[a.subjectId].q += a.questionsCount || 0;
          totalsByEntity[a.subjectId].c += a.correctCount || 0;
          totalQ += a.questionsCount || 0;
          totalC += a.correctCount || 0;
        });
      } else {
        scopeActivities = activities.filter(a => a.subjectId === this.desempenhoSubject);
        scopeActivities.forEach(a => {
          const cName = a.content || 'Sem conteúdo';
          if (!totalsByEntity[cName]) totalsByEntity[cName] = { q: 0, c: 0 };
          totalsByEntity[cName].q += a.questionsCount || 0;
          totalsByEntity[cName].c += a.correctCount || 0;
          totalQ += a.questionsCount || 0;
          totalC += a.correctCount || 0;
        });
        const sub = App.getSubjectById(this.desempenhoSubject);
        if (!sub) titleForView = 'Selecione uma matéria para ver o desempenho dos conteúdos';
      }

      const globalAcc = totalQ > 0 ? Math.round((totalC/totalQ)*100) : 0;
      const sortedEntities = Object.entries(totalsByEntity)
                                   .filter(e => e[1].q > 0)
                                   .sort((a,b) => b[1].q - a[1].q);

      tabContent = `
        <div class="app-card" style="margin-top:24px">
          <div style="display:flex;gap:32px;margin-bottom:24px;align-items:flex-end">
            <label style="display:flex;align-items:center;gap:8px;cursor:pointer">
              <input type="radio" name="des-group" value="materias" ${this.desempenhoGroup === 'materias' ? 'checked' : ''} style="accent-color:var(--primary)">
              <div style="display:flex;flex-direction:column">
                <strong style="color:var(--text)">Matérias</strong>
                <span style="font-size:11px;color:var(--text3)">Desempenho agupado por matérias</span>
              </div>
            </label>
            <label style="display:flex;align-items:center;gap:8px;cursor:pointer">
              <input type="radio" name="des-group" value="conteudos" ${this.desempenhoGroup === 'conteudos' ? 'checked' : ''} style="accent-color:var(--primary)">
              <div style="display:flex;flex-direction:column">
                <strong style="color:var(--text)">Conteúdos</strong>
                <span style="font-size:11px;color:var(--text3)">Desempenho agrupado por conteúdos de uma matéria</span>
              </div>
            </label>
            ${this.desempenhoGroup === 'conteudos' ? `
              <div style="flex:1">
                <select id="desempenho-subject-select" class="app-input" style="max-width:300px;background:var(--bg);border-color:rgba(255,255,255,0.1);color:var(--text)">
                  ${subjectOptions}
                </select>
              </div>
            ` : '<div></div>'}
          </div>

          <div style="display:flex;gap:40px;flex-wrap:wrap">
            <div style="flex:1.5;min-width:300px;position:relative">
              <div class="chart-wrap" style="height:350px"><canvas id="chart-desempenho-line"></canvas></div>
            </div>
            
            <div style="flex:1;min-width:300px">
              <div style="display:flex;align-items:center;gap:24px;margin-bottom:8px">
                <div style="font-family:var(--font);font-size:3.5rem;font-weight:700;color:var(--text);line-height:1">${globalAcc}%</div>
                <div style="display:flex;flex-direction:column;color:var(--text2);font-size:14px">
                  <span><strong style="color:var(--text)">${totalQ}</strong> questões</span>
                  <span><strong style="color:var(--text)">${totalC}</strong> acertos</span>
                </div>
              </div>
              <div style="font-size:13px;color:var(--text3);margin-bottom:32px">${titleForView}</div>
              
              ${sortedEntities.length > 0 ? `
                <div style="display:flex;flex-direction:column;gap:16px;">
                  ${sortedEntities.map(([idOrName, data], i) => {
                    const PCOLORS = ['#EF4444', '#F97316', '#F59E0B', '#84CC16', '#10B981', '#06B6D4', '#3B82F6', '#6366F1', '#8B5CF6', '#D946EF', '#F43F5E'];
                    let name = idOrName;
                    let color = PCOLORS[i % PCOLORS.length];
                    if (this.desempenhoGroup === 'materias') {
                      const sub = App.getSubjectById(idOrName);
                      if (sub) { name = sub.name; color = sub.color; }
                      else { name = 'Removida'; color = '#444'; }
                    }
                    
                    const acc = Math.round((data.c / data.q) * 100);
                    let colorAcc = '#EF4444';
                    if (acc >= 60 && acc < 80) colorAcc = '#F59E0B';
                    if (acc >= 80) colorAcc = '#10B981';

                    return `
                      <div style="display:flex;flex-direction:column;gap:6px">
                        <div style="display:flex;align-items:center;justify-content:space-between;font-size:14px">
                          <div style="display:flex;align-items:center;gap:8px">
                            <span class="color-dot" style="background:${color};width:12px;height:12px;border-radius:50%"></span>
                            <span style="font-weight:600;color:var(--text)">${name}</span>
                          </div>
                          <span style="color:var(--text2);font-family:var(--font)">${data.c}/${data.q} <strong style="color:var(--text)">(${acc.toFixed(1).replace('.',',')}%)</strong></span>
                        </div>
                        <div style="width:100%;height:6px;background:rgba(255,255,255,.06);border-radius:3px;overflow:hidden">
                          <div style="width:${acc}%;height:100%;background:${colorAcc};border-radius:3px"></div>
                        </div>
                      </div>
                    `;
                  }).join('')}
                </div>
              ` : '<div class="empty-state" style="padding:12px"><p class="empty-desc">Nenhuma questão resolvida neste recorte.</p></div>'}
            </div>
          </div>
        </div>
      `;
    } else if (this.tab === 'timeline') {
      tabContent = `
        <div class="app-card" style="margin-bottom:24px; margin-top:24px;">
          <div class="card-title">📊 Horas por Dia (Matérias Empilhadas)</div>
          <div class="chart-wrap" style="height:350px"><canvas id="chart-timeline-stack"></canvas></div>
        </div>

        <div class="app-card">
          <div class="card-title">⏱️ Distribuição do Tempo no Período</div>
          ${sortedSubjectsByTime.length > 0 ? `
            <div style="display:flex;flex-direction:column;gap:12px;margin-top:16px">
              ${sortedSubjectsByTime.map(([id, data]) => {
                const sub = App.getSubjectById(id);
                const pct = Math.round((data.time / totalSecs) * 100);
                return `
                  <div style="display:flex;align-items:center;gap:12px">
                    <span class="color-dot" style="background:${sub ? sub.color : '#444'};width:14px;height:14px"></span>
                    <span style="flex:1;font-weight:600;font-size:14px;color:var(--text)">${sub ? sub.name : 'Removida'}</span>
                    <span style="font-weight:700;font-size:14px;min-width:65px;text-align:right;color:var(--text)">${App.formatDurationShort(data.time)}</span>
                    <div style="width:100px;height:6px;background:rgba(255,255,255,.06);border-radius:3px;overflow:hidden">
                      <div style="width:${pct}%;height:100%;background:${sub ? sub.color : '#444'};border-radius:3px"></div>
                    </div>
                    <span style="font-size:13px;color:var(--text3);min-width:40px;text-align:right">${pct}%</span>
                  </div>
                `;
              }).join('')}
            </div>
          ` : '<div class="empty-state"><p class="empty-desc">Sem atividades logadas neste período.</p></div>'}
        </div>
      `;
    } else if (this.tab === 'modos') {
      const modeTotals = {};
      activities.forEach(a => {
        const mode = a.studyType || 'Teoria';
        if (!modeTotals[mode]) modeTotals[mode] = 0;
        modeTotals[mode] += a.duration || 0;
      });
      const sortedModes = Object.entries(modeTotals).sort((a,b) => b[1] - a[1]);
      const modeColors = { 'Teoria': '#7C3AED', 'Videoaula': '#06B6D4', 'Exercícios': '#10B981', 'Revisão': '#F59E0B' };

      tabContent = `
        <div class="grid-2" style="margin-top:24px">
          <div class="app-card">
            <div class="card-title">📚 Tipos de Estudo</div>
            <div class="chart-wrap" style="height:300px"><canvas id="chart-modos-pie"></canvas></div>
          </div>
          <div class="app-card">
            <div class="card-title">Tempo por Modo</div>
            ${sortedModes.length > 0 ? `
              <div style="display:flex;flex-direction:column;gap:16px;margin-top:16px">
                ${sortedModes.map(([mode, time]) => {
                  const pct = Math.round((time / totalSecs) * 100);
                  const mcolor = modeColors[mode] || '#8B5CF6';
                  return `
                    <div style="display:flex;align-items:center;gap:12px">
                      <span class="color-dot" style="background:${mcolor};width:14px;height:14px"></span>
                      <span style="flex:1;font-weight:600;font-size:14px;color:var(--text)">${mode}</span>
                      <strong style="font-size:14px;color:var(--text)">${App.formatDurationShort(time)}</strong>
                      <span style="font-size:13px;color:var(--text3);min-width:45px;text-align:right">(${pct}%)</span>
                    </div>
                  `;
                }).join('')}
              </div>
            ` : '<div class="empty-state"><p class="empty-desc">Nada registrado.</p></div>'}
          </div>
        </div>
      `;
    }

    container.innerHTML = `
      <div class="report-filters">
        ${periods.map(p => `<button class="report-filter-btn ${this.period === p.id ? 'active' : ''}" data-period="${p.id}">${p.label}</button>`).join('')}
      </div>
      ${customInputs}

      <div style="display:flex; gap:12px; margin-top:24px; border-bottom: 1px solid rgba(255,255,255,0.08); padding-bottom: 0px; margin-bottom: 0px;">
        <button class="app-tab-btn ${this.tab === 'desempenho' ? 'active' : ''}" data-tab="desempenho" style="background:transparent; border:none; color:${this.tab === 'desempenho' ? 'var(--primary)' : 'var(--text3)'}; font-weight:600; padding:12px 16px; border-bottom: ${this.tab === 'desempenho' ? '2px solid var(--primary)' : '2px solid transparent'}; cursor:pointer; font-family:var(--font); font-size:14px; transition: 0.2s;">Desempenho</button>
        <button class="app-tab-btn ${this.tab === 'timeline' ? 'active' : ''}" data-tab="timeline" style="background:transparent; border:none; color:${this.tab === 'timeline' ? 'var(--primary)' : 'var(--text3)'}; font-weight:600; padding:12px 16px; border-bottom: ${this.tab === 'timeline' ? '2px solid var(--primary)' : '2px solid transparent'}; cursor:pointer; font-family:var(--font); font-size:14px; transition: 0.2s;">Linha do Tempo</button>
        <button class="app-tab-btn ${this.tab === 'tempo_estudo' ? 'active' : ''}" data-tab="tempo_estudo" style="background:transparent; border:none; color:${this.tab === 'tempo_estudo' ? 'var(--primary)' : 'var(--text3)'}; font-weight:600; padding:12px 16px; border-bottom: ${this.tab === 'tempo_estudo' ? '2px solid var(--primary)' : '2px solid transparent'}; cursor:pointer; font-family:var(--font); font-size:14px; transition: 0.2s;">Tempo de Estudo</button>
        <button class="app-tab-btn ${this.tab === 'modos' ? 'active' : ''}" data-tab="modos" style="background:transparent; border:none; color:${this.tab === 'modos' ? 'var(--primary)' : 'var(--text3)'}; font-weight:600; padding:12px 16px; border-bottom: ${this.tab === 'modos' ? '2px solid var(--primary)' : '2px solid transparent'}; cursor:pointer; font-family:var(--font); font-size:14px; transition: 0.2s;">Tipos de Estudo</button>
      </div>

      ${tabContent}
    `;

    document.querySelectorAll('.report-filter-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        this.period = btn.dataset.period;
        this.render(document.getElementById('view-container'));
      });
    });

    document.querySelectorAll('.app-tab-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        this.tab = btn.dataset.tab;
        this.render(document.getElementById('view-container'));
      });
    });

    document.querySelectorAll('input[name="tempo-group"]').forEach(el => {
      el.addEventListener('change', (e) => {
        this.tempoGroup = e.target.value;
        this.render(document.getElementById('view-container'));
      });
    });

    const tempoSelect = document.getElementById('tempo-subject-select');
    if (tempoSelect) {
      tempoSelect.addEventListener('change', (e) => {
        this.tempoSubject = e.target.value;
        this.render(document.getElementById('view-container'));
      });
    }

    document.querySelectorAll('input[name="des-group"]').forEach(el => {
      el.addEventListener('change', (e) => {
        this.desempenhoGroup = e.target.value;
        this.render(document.getElementById('view-container'));
      });
    });

    const desSelect = document.getElementById('desempenho-subject-select');
    if (desSelect) {
      desSelect.addEventListener('change', (e) => {
        this.desempenhoSubject = e.target.value;
        this.render(document.getElementById('view-container'));
      });
    }

    if (this.period === 'custom') {
      const btnCustom = document.getElementById('report-custom-btn');
      if (btnCustom) {
        btnCustom.addEventListener('click', () => {
          this.customStart = document.getElementById('report-custom-start').value;
          this.customEnd = document.getElementById('report-custom-end').value;
          if (this.customStart && this.customEnd && this.customStart <= this.customEnd) {
            this.render(document.getElementById('view-container'));
          } else {
            alert('Por favor, selecione um período válido.');
          }
        });
      }
    }

    setTimeout(() => this.renderCharts(activities, startDate, endDate), 50);
  },

  getRange() {
    const today = new Date();
    let startDate, endDate = App.getDateString(today);

    switch (this.period) {
      case 'today': startDate = App.getDateString(today); break;
      case 'week': const w = App.getWeekRange(); startDate = w.start; endDate = w.end; break;
      case 'month': const dMonth = new Date(today); dMonth.setDate(1); startDate = App.getDateString(dMonth); break;
      case 'year': startDate = `${today.getFullYear()}-01-01`; break;
      case 'custom':
        if (!this.customStart) this.customStart = App.getDateString(today);
        if (!this.customEnd) this.customEnd = App.getDateString(today);
        startDate = this.customStart; endDate = this.customEnd;
        break;
      case 'all': startDate = '2020-01-01'; break;
      default: const d7 = new Date(today); d7.setDate(today.getDate() - 6); startDate = App.getDateString(d7);
    }
    const activities = App.getActivitiesForRange(startDate, endDate);
    return { startDate, endDate, activities };
  },

  renderCharts(activities, startDate, endDate) {
    if (this.tab === 'desempenho') {
      const lineCanvas = document.getElementById('chart-desempenho-line');
      if (!lineCanvas) return;
      
      const start = new Date(startDate);
      const end = new Date(endDate);
      const diffDays = Math.max(1, Math.ceil((end - start) / 86400000) + 1);
      const labels = [];
      const datasetsMap = {};

      let scopeActivities = activities;
      const subTotals = {};

      if (this.desempenhoGroup === 'materias') {
        activities.forEach(a => {
          if (!subTotals[a.subjectId]) subTotals[a.subjectId] = { q: 0 };
          subTotals[a.subjectId].q += a.questionsCount || 0;
        });
      } else {
        scopeActivities = activities.filter(a => a.subjectId === this.desempenhoSubject);
        scopeActivities.forEach(a => {
          const cName = a.content || 'Sem conteúdo';
          if (!subTotals[cName]) subTotals[cName] = { q: 0 };
          subTotals[cName].q += a.questionsCount || 0;
        });
      }

      const topEntities = Object.entries(subTotals).sort((a,b)=>b[1].q - a[1].q).slice(0,5).map(x=>x[0]);

      for (let i = 0; i < diffDays; i++) {
        const d = new Date(start); d.setDate(start.getDate() + i);
        const dateStr = App.getDateString(d);
        labels.push(d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }));

        const dayActs = scopeActivities.filter(a => a.date?.startsWith(dateStr));
        topEntities.forEach(idOrName => {
          if (!datasetsMap[idOrName]) datasetsMap[idOrName] = [];
          const acts = dayActs.filter(a => this.desempenhoGroup === 'materias' ? a.subjectId === idOrName : (a.content || 'Sem conteúdo') === idOrName);
          const q = acts.reduce((s,a)=>s+(a.questionsCount||0),0);
          const c = acts.reduce((s,a)=>s+(a.correctCount||0),0);
          if (q > 0) datasetsMap[idOrName].push(Math.round((c/q)*100));
          else datasetsMap[idOrName].push(null);
        });
      }

      const PCOLORS = ['#EF4444', '#F97316', '#F59E0B', '#84CC16', '#10B981', '#06B6D4', '#3B82F6', '#6366F1', '#8B5CF6', '#D946EF', '#F43F5E'];

      const datasets = topEntities.map((idOrName, index) => {
        let name = idOrName;
        let color = PCOLORS[index % PCOLORS.length];
        if (this.desempenhoGroup === 'materias') {
          const sub = App.getSubjectById(idOrName);
          if (sub) { name = sub.name; color = sub.color; }
          else { name = 'Removida'; color = '#444'; }
        }

        return {
          label: name,
          data: datasetsMap[idOrName],
          borderColor: color,
          backgroundColor: color,
          borderWidth: 3,
          tension: 0,
          pointRadius: 5,
          pointHoverRadius: 8,
          pointBackgroundColor: color,
          pointBorderColor: '#12121A',
          pointBorderWidth: 2,
          spanGaps: true
        };
      });

      new Chart(lineCanvas, {
        type: 'line',
        data: { labels, datasets },
        options: {
          responsive: true, maintainAspectRatio: false,
          plugins: { legend: { position: 'top', labels: { color: '#F8FAFC', font: { size: 13, family: 'Inter' } } } },
          scales: {
            y: { 
              min: 0, max: 100, 
              ticks: { color: '#94A3B8', stepSize: 25, callback: v => v + '%' }, 
              grid: { color: 'rgba(255,255,255,0.08)' } 
            },
            x: { 
              ticks: { color: '#94A3B8', font: { size: 11 } }, 
              grid: { display: false } 
            }
          }
        }
      });
    }

    if (this.tab === 'timeline') {
      const barCanvas = document.getElementById('chart-timeline-stack');
      if (!barCanvas) return;
      
      const start = new Date(startDate);
      const end = new Date(endDate);
      const diffDays = Math.max(1, Math.ceil((end - start) / 86400000) + 1);
      const labels = [];
      const subjectsInPeriod = new Set();
      activities.forEach(a => subjectsInPeriod.add(a.subjectId));

      const datasetsData = {};
      subjectsInPeriod.forEach(id => datasetsData[id] = []);

      for (let i = 0; i < diffDays; i++) {
        const d = new Date(start); d.setDate(start.getDate() + i);
        const dateStr = App.getDateString(d);
        labels.push(d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }));

        const dayActs = activities.filter(a => a.date?.startsWith(dateStr));
        subjectsInPeriod.forEach(subId => {
          const secs = dayActs.filter(a => a.subjectId === subId).reduce((s,a)=>s+(a.duration||0), 0);
          datasetsData[subId].push(+(secs / 3600).toFixed(4));
        });
      }

      const datasets = Array.from(subjectsInPeriod).map((id, index) => {
        const sub = App.getSubjectById(id);
        const color = sub ? sub.color : App.COLORS[index % App.COLORS.length];
        return {
          label: sub ? sub.name : 'Unknown',
          data: datasetsData[id],
          backgroundColor: color,
          maxBarThickness: 32
        };
      });

      new Chart(barCanvas, {
        type: 'bar',
        data: { labels, datasets },
        options: {
          responsive: true, maintainAspectRatio: false,
          plugins: { 
            legend: { position: 'top', labels: { color: '#F8FAFC', usePointStyle: true, font: { family: 'Inter' } } },
            tooltip: { callbacks: { label: c => c.dataset.label + ': ' + App.formatDurationShort(c.raw * 3600) } }
          },
          scales: {
            x: { stacked: true, ticks: { color: '#94A3B8' }, grid: { display: false } },
            y: { stacked: true, ticks: { color: '#94A3B8', callback: v => v.toFixed(1) + 'h' }, grid: { color: 'rgba(255,255,255,0.08)' } }
          }
        }
      });
    }

    if (this.tab === 'modos') {
      const pieCanvas = document.getElementById('chart-modos-pie');
      if (!pieCanvas) return;
      
      const modeTotals = {};
      activities.forEach(a => {
        const m = a.studyType || 'Teoria';
        if (!modeTotals[m]) modeTotals[m] = 0;
        modeTotals[m] += a.duration || 0;
      });
      const modeColors = { 'Teoria': '#7C3AED', 'Videoaula': '#06B6D4', 'Exercícios': '#10B981', 'Revisão': '#F59E0B' };
      
      if (Object.keys(modeTotals).length > 0) {
        const labels = Object.keys(modeTotals);
        const data = Object.values(modeTotals).map(s => +(s/3600).toFixed(4));
        const colors = labels.map(l => modeColors[l] || '#8B5CF6');

        new Chart(pieCanvas, {
          type: 'pie',
          data: { labels, datasets: [{ data, backgroundColor: colors, borderWidth: 0 }] },
          options: {
            responsive: true, maintainAspectRatio: false,
            plugins: { 
              legend: { position: 'right', labels: { color: '#F8FAFC', padding: 16, usePointStyle: true, font: { family: 'Inter' } } },
              tooltip: { callbacks: { label: c => ' ' + c.label + ': ' + App.formatDurationShort(c.raw * 3600) } }
            }
          }
        });
      }
    }

    if (this.tab === 'tempo_estudo') {
      const pieCanvas = document.getElementById('chart-tempo-pie');
      if (!pieCanvas) return;

      let totalsByEntity = {};
      if (this.tempoGroup === 'materias') {
        activities.forEach(a => {
          if (!totalsByEntity[a.subjectId]) totalsByEntity[a.subjectId] = 0;
          totalsByEntity[a.subjectId] += a.duration || 0;
        });
      } else {
        activities.filter(a => a.subjectId === this.tempoSubject).forEach(a => {
          const c = a.content || 'Sem conteúdo';
          if (!totalsByEntity[c]) totalsByEntity[c] = 0;
          totalsByEntity[c] += a.duration || 0;
        });
      }

      if (Object.keys(totalsByEntity).length > 0) {
        const labels = [];
        const data = [];
        const colors = [];
        let i = 0;
        Object.entries(totalsByEntity).sort((a,b)=>b[1]-a[1]).forEach(([idOrName, secs]) => {
          const PCOLORS = ['#EF4444', '#F97316', '#F59E0B', '#84CC16', '#10B981', '#06B6D4', '#3B82F6', '#6366F1', '#8B5CF6', '#D946EF', '#F43F5E'];
          let name = idOrName;
          let color = PCOLORS[i % PCOLORS.length];
          if (this.tempoGroup === 'materias') {
            const sub = App.getSubjectById(idOrName);
            if (sub) { name = sub.name; color = sub.color; }
            else { name = 'Removida'; color = '#444'; }
          }
          labels.push(name);
          data.push(+(secs / 3600).toFixed(4));
          colors.push(color);
          i++;
        });

        new Chart(pieCanvas, {
          type: 'pie',
          data: { labels, datasets: [{ data, backgroundColor: colors, borderWidth: 2, borderColor: '#12121A' }] },
          options: {
            responsive: true, maintainAspectRatio: false,
            plugins: { 
              legend: { display: false },
              tooltip: { callbacks: { label: c => ' ' + c.label + ': ' + App.formatDurationShort(c.raw * 3600) } }
            }
          }
        });
      }
    }
  }
};
