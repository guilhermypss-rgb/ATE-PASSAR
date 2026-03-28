/* =============================================
   ATÉ PASSAR — Activities Module
   ============================================= */
const ActivitiesModule = {
  filterSubject: '',
  sortOrder: 'desc',

  render(container) {
    const activities = [...App.userData.activities].sort((a, b) => {
      return this.sortOrder === 'desc' ? new Date(b.date) - new Date(a.date) : new Date(a.date) - new Date(b.date);
    });
    const subjects = App.userData.subjects;
    const filtered = this.filterSubject ? activities.filter(a => a.subjectId === this.filterSubject) : activities;
    const totalSecs = filtered.reduce((s, a) => s + (a.duration || 0), 0);

    container.innerHTML = `
      <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:20px;flex-wrap:wrap;gap:12px">
        <div style="display:flex;align-items:center;gap:12px;flex-wrap:wrap">
          <select id="filter-subject" class="btn-secondary" style="padding:8px 14px;font-size:13px;cursor:pointer;appearance:auto">
            <option value="">Todas as matérias</option>
            ${subjects.map(s => `<option value="${s.id}" ${this.filterSubject === s.id ? 'selected' : ''}>${s.name}</option>`).join('')}
          </select>
          <button class="btn-secondary btn-sm" id="btn-sort">${this.sortOrder === 'desc' ? '↓ Recentes' : '↑ Antigas'}</button>
          <span style="font-size:13px;color:var(--text3)">${filtered.length} sessões • ${App.formatDurationShort(totalSecs)} total</span>
        </div>
        <button class="btn-primary btn-sm" id="btn-add-activity">+ Nova atividade</button>
      </div>

      <div class="app-card">
        ${filtered.length > 0 ? `
          ${filtered.map(a => {
            const sub = App.getSubjectById(a.subjectId);
            const accuracyDisplay = a.questionsCount > 0 ? ` • ✅ ${a.correctCount}/${a.questionsCount} (${a.accuracy}%)` : '';
            return `
              <div class="activity-item" id="act-${a.id}">
                <div class="activity-color" style="background:${sub ? sub.color : '#444'}"></div>
                <div class="activity-details">
                  <span class="activity-subject">${sub ? sub.name : 'Matéria removida'}</span>
                  <span class="activity-content-name">${a.content || ''}${a.notes ? ' — ' + a.notes.substring(0, 40) + (a.notes.length > 40 ? '...' : '') : ''}${accuracyDisplay}</span>
                </div>
                <div style="text-align:right;display:flex;align-items:center;gap:12px">
                  <div>
                    <div class="activity-time">${App.formatDurationShort(a.duration)}</div>
                    <div class="activity-date">${App.formatDate(a.date)} às ${App.formatTime(a.date)}</div>
                  </div>
                  <div style="display:flex;gap:4px">
                    <button class="btn-secondary btn-sm" data-edit-act="${a.id}" style="padding:5px 8px">✏️</button>
                    <button class="btn-secondary btn-sm" data-del-act="${a.id}" style="padding:5px 8px;color:var(--red)">🗑️</button>
                  </div>
                </div>
              </div>
            `;
          }).join('')}
        ` : `
          <div class="empty-state">
            <div class="empty-icon">📝</div>
            <p class="empty-title">Nenhuma atividade encontrada</p>
            <p class="empty-desc">${this.filterSubject ? 'Não há sessões para esta matéria.' : 'Registre sua primeira sessão de estudo!'}</p>
            <button class="btn-primary" onclick="App.navigate('timer')">⏱️ Iniciar sessão</button>
          </div>
        `}
      </div>
    `;

    document.getElementById('filter-subject')?.addEventListener('change', (e) => {
      this.filterSubject = e.target.value;
      this.render(document.getElementById('view-container'));
    });

    document.getElementById('btn-sort')?.addEventListener('click', () => {
      this.sortOrder = this.sortOrder === 'desc' ? 'asc' : 'desc';
      this.render(document.getElementById('view-container'));
    });

    document.getElementById('btn-add-activity')?.addEventListener('click', () => this.openManualModal());

    document.querySelectorAll('[data-edit-act]').forEach(btn => {
      btn.addEventListener('click', () => this.openManualModal(btn.dataset.editAct));
    });

    document.querySelectorAll('[data-del-act]').forEach(btn => {
      btn.addEventListener('click', () => {
        if (!confirm('Excluir esta atividade?')) return;
        App.userData.activities = App.userData.activities.filter(a => a.id !== btn.dataset.delAct);
        App.saveData();
        this.render(document.getElementById('view-container'));
      });
    });
  },

  openManualModal(editId) {
    const existing = editId ? App.userData.activities.find(a => a.id === editId) : null;
    const subjects = App.userData.subjects;
    const now = new Date();

    App.openModal(`
      <h3 class="modal-title">${existing ? '✏️ Editar atividade' : '📝 Registrar atividade manual'}</h3>
      <div class="app-field">
        <label>Matéria</label>
        <select id="manual-subject">
          <option value="">Selecione...</option>
          ${subjects.map(s => `<option value="${s.id}" ${existing && existing.subjectId === s.id ? 'selected' : ''}>${s.name}</option>`).join('')}
        </select>
      </div>
      <div class="app-field">
        <label>Conteúdo</label>
        <input type="text" id="manual-content" value="${existing ? (existing.content || '') : ''}" placeholder="Ex: Capítulo 3"/>
      </div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px">
        <div class="app-field">
          <label>Data</label>
          <input type="date" id="manual-date" value="${existing ? existing.date.slice(0,10) : App.getDateString(now)}"/>
        </div>
        <div class="app-field">
          <label>Hora de início</label>
          <input type="time" id="manual-time" value="${existing ? existing.date.slice(11,16) : now.toTimeString().slice(0,5)}"/>
        </div>
      </div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px">
        <div class="app-field">
          <label>Horas</label>
          <input type="number" id="manual-hours" value="${existing ? Math.floor(existing.duration / 3600) : 0}" min="0" max="24"/>
        </div>
        <div class="app-field">
          <label>Minutos</label>
          <input type="number" id="manual-minutes" value="${existing ? Math.floor((existing.duration % 3600) / 60) : 30}" min="0" max="59"/>
        </div>
      </div>
      <div class="app-field">
        <label>Anotações</label>
        <textarea id="manual-notes" placeholder="Observações...">${existing ? (existing.notes || '') : ''}</textarea>
      </div>
      <div class="modal-actions">
        <button class="modal-btn secondary" onclick="App.closeModal()">Cancelar</button>
        <button class="modal-btn primary" id="btn-save-manual">Salvar</button>
      </div>
    `);

    document.getElementById('btn-save-manual').addEventListener('click', () => {
      const subjectId = document.getElementById('manual-subject').value;
      if (!subjectId) return alert('Selecione uma matéria.');
      const content = document.getElementById('manual-content').value.trim();
      const date = document.getElementById('manual-date').value;
      const time = document.getElementById('manual-time').value;
      const hours = parseInt(document.getElementById('manual-hours').value) || 0;
      const minutes = parseInt(document.getElementById('manual-minutes').value) || 0;
      const duration = hours * 3600 + minutes * 60;
      if (duration < 60) return alert('A duração mínima é de 1 minuto.');
      const notes = document.getElementById('manual-notes').value.trim();
      const dateISO = new Date(`${date}T${time || '00:00'}`).toISOString();

      if (existing) {
        existing.subjectId = subjectId;
        existing.content = content;
        existing.duration = duration;
        existing.date = dateISO;
        existing.notes = notes;
      } else {
        App.userData.activities.push({
          id: App.generateId(), subjectId, content, duration, date: dateISO, notes, mode: 'manual'
        });
      }

      App.saveData();
      App.closeModal();
      this.render(document.getElementById('view-container'));
    });
  }
};
