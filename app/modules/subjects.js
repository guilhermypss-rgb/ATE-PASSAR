/* =============================================
   ATÉ PASSAR — Subjects Module
   ============================================= */
const SubjectsModule = {
  render(container) {
    const subjects = App.userData.subjects;
    container.innerHTML = `
      <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:24px">
        <div>
          <p style="color:var(--text3);font-size:14px">${subjects.length} matéria${subjects.length !== 1 ? 's' : ''} cadastrada${subjects.length !== 1 ? 's' : ''}</p>
        </div>
        <button class="btn-primary" id="btn-add-subject">+ Nova matéria</button>
      </div>

      ${subjects.length > 0 ? `
        <div class="subject-list">
          ${subjects.map(s => {
            const totalSecs = App.userData.activities.filter(a => a.subjectId === s.id).reduce((sum, a) => sum + (a.duration || 0), 0);
            return `
              <div class="subject-card" id="subj-${s.id}">
                <div class="subject-color" style="background:${s.color}"></div>
                <div class="subject-info" style="cursor:pointer;flex:1" data-subject-id="${s.id}" title="Clique para ver assuntos">
                  <span class="subject-name" style="cursor:pointer">${s.name}</span>
                  <span class="subject-meta">${s.contents ? s.contents.length : 0} conteúdos${s.weeklyGoal ? ` • Meta: ${s.weeklyGoal}h/sem` : ''}</span>
                </div>
                <span class="subject-hours">${App.formatDurationShort(totalSecs)}</span>
                <div class="subject-actions">
                  <button title="Editar" data-edit="${s.id}">✏️</button>
                  <button title="Excluir" data-delete="${s.id}">🗑️</button>
                </div>
              </div>
            `;
          }).join('')}
        </div>
      ` : `
        <div class="empty-state">
          <div class="empty-icon">📚</div>
          <p class="empty-title">Nenhuma matéria cadastrada</p>
          <p class="empty-desc">Adicione suas matérias para começar a registrar suas sessões de estudo.</p>
        </div>
      `}
    `;

    document.getElementById('btn-add-subject')?.addEventListener('click', () => this.openSubjectModal());
    
    // Clicar no nome da matéria para ver assuntos
    document.querySelectorAll('[data-subject-id]').forEach(el => {
      el.addEventListener('click', (e) => {
        e.stopPropagation();
        this.openContentsModal(el.dataset.subjectId);
      });
    });

    document.querySelectorAll('[data-edit]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        this.openSubjectModal(btn.dataset.edit);
      });
    });
    document.querySelectorAll('[data-delete]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        this.deleteSubject(btn.dataset.delete);
      });
    });
  },

  openContentsModal(subjectId) {
    const subject = App.getSubjectById(subjectId);
    if (!subject) return;

    const contents = subject.contents || [];
    
    App.openModal(`
      <h3 class="modal-title">📚 ${subject.name}</h3>
      <p style="color:var(--text3);font-size:13px;margin-bottom:16px">Assuntos cadastrados para esta matéria</p>
      
      <div style="display:flex;gap:8px;margin-bottom:16px">
        <input type="text" id="new-content-modal" placeholder="Novo assunto..." style="flex:1"/>
        <button class="btn-secondary" id="btn-add-content-modal">Adicionar</button>
      </div>

      <div id="contents-grid" style="display:grid;grid-template-columns:repeat(auto-fill,minmax(160px,1fr));gap:12px">
        ${contents.map((c, idx) => {
          const contentActivities = App.userData.activities.filter(a => a.subjectId === subjectId && a.content === c);
          const totalSecs = contentActivities.reduce((sum, a) => sum + (a.duration || 0), 0);
          const totalQuestions = contentActivities.reduce((sum, a) => sum + (a.questionsCount || 0), 0);
          const totalCorrect = contentActivities.reduce((sum, a) => sum + (a.correctCount || 0), 0);
          const accuracy = totalQuestions > 0 ? Math.round((totalCorrect / totalQuestions) * 100) : 0;
          
          return `
            <div style="background:rgba(124,58,237,.08);border:1px solid rgba(124,58,237,.2);border-radius:8px;padding:12px;cursor:pointer;transition:all .2s" data-content-stats="${subjectId}|${c}">
              <p style="color:var(--text);font-weight:600;font-size:14px;margin-bottom:8px">${c}</p>
              <div style="font-size:12px;color:var(--text3)">
                <p>⏱️ ${App.formatDurationShort(totalSecs)}</p>
                ${totalQuestions > 0 ? `<p>✅ ${totalCorrect}/${totalQuestions} (${accuracy}%)</p>` : ''}
              </div>
            </div>
          `;
        }).join('')}
        ${contents.length === 0 ? '<p style="color:var(--text3);font-size:13px">Nenhum assunto adicionado ainda</p>' : ''}
      </div>

      <div class="modal-actions" style="margin-top:20px">
        <button class="modal-btn secondary" onclick="App.closeModal()">Fechar</button>
      </div>
    `);

    // Adicionar novo assunto
    document.getElementById('btn-add-content-modal').addEventListener('click', () => {
      const newContent = document.getElementById('new-content-modal').value.trim();
      if (!newContent) return alert('Digite um assunto.');
      if (contents.includes(newContent)) return alert('Este assunto já existe.');
      
      subject.contents.push(newContent);
      App.saveData();
      this.openContentsModal(subjectId);
    });

    document.getElementById('new-content-modal').addEventListener('keypress', (e) => {
      if (e.key === 'Enter') document.getElementById('btn-add-content-modal').click();
    });

    // Clicar em um assunto para ver estatísticas
    document.querySelectorAll('[data-content-stats]').forEach(el => {
      el.addEventListener('click', () => {
        const [subjId, contentName] = el.dataset.contentStats.split('|');
        App.closeModal();
        this.openContentStatsModal(subjId, contentName);
      });
    });
  },

  openContentStatsModal(subjectId, contentName) {
    const subject = App.getSubjectById(subjectId);
    if (!subject) return;

    const activities = App.userData.activities.filter(a => a.subjectId === subjectId && a.content === contentName);
    const totalSecs = activities.reduce((sum, a) => sum + (a.duration || 0), 0);
    const totalQuestions = activities.reduce((sum, a) => sum + (a.questionsCount || 0), 0);
    const totalCorrect = activities.reduce((sum, a) => sum + (a.correctCount || 0), 0);
    const accuracy = totalQuestions > 0 ? Math.round((totalCorrect / totalQuestions) * 100) : 0;
    const uniqueDays = new Set(activities.map(a => new Date(a.date).toDateString())).size;
    const methods = {};
    activities.forEach(a => {
      const method = a.mode || 'timer';
      methods[method] = (methods[method] || 0) + 1;
    });

    App.openModal(`
      <h3 class="modal-title">📖 ${subject.name} > ${contentName}</h3>
      
      <div style="display:grid;grid-template-columns:repeat(2,1fr);gap:12px;margin-bottom:20px">
        <div style="background:rgba(124,58,237,.08);padding:14px;border-radius:8px">
          <p style="color:var(--text3);font-size:12px">Tempo Estudado</p>
          <p style="color:var(--text);font-size:20px;font-weight:700">${App.formatDurationShort(totalSecs)}</p>
        </div>
        <div style="background:rgba(16,185,129,.08);padding:14px;border-radius:8px">
          <p style="color:var(--text3);font-size:12px">Dias de Estudo</p>
          <p style="color:var(--green);font-size:20px;font-weight:700">${uniqueDays}</p>
        </div>
        <div style="background:rgba(236,72,153,.08);padding:14px;border-radius:8px">
          <p style="color:var(--text3);font-size:12px">Questões Resolvidas</p>
          <p style="color:var(--pink);font-size:20px;font-weight:700">${totalQuestions}</p>
        </div>
        <div style="background:rgba(59,130,246,.08);padding:14px;border-radius:8px">
          <p style="color:var(--text3);font-size:12px">Acurácia</p>
          <p style="color:#3B82F6;font-size:20px;font-weight:700">${accuracy}%</p>
        </div>
      </div>

      <div>
        <p style="color:var(--text2);font-size:13px;font-weight:600;margin-bottom:8px">Métodos de Estudo</p>
        <div style="display:flex;gap:8px;flex-wrap:wrap">
          ${Object.entries(methods).map(([method, count]) => {
            const icons = { stopwatch: '⏱️', pomodoro: '🍅', manual: '✏️', timer: '⏱️' };
            return `<span style="background:rgba(124,58,237,.15);padding:6px 12px;border-radius:6px;font-size:12px">${icons[method] || '⏲️'} ${method === 'stopwatch' ? 'Cronômetro' : method === 'pomodoro' ? 'Pomodoro' : method === 'manual' ? 'Manual' : 'Timer'} (${count})</span>`;
          }).join('')}
        </div>
      </div>

      <div class="modal-actions" style="margin-top:20px">
        <button class="modal-btn secondary" onclick="App.closeModal()">Fechar</button>
      </div>
    `);
  },

  openSubjectModal(editId) {
    const existing = editId ? App.getSubjectById(editId) : null;
    const colorIdx = App.userData.subjects.length % App.COLORS.length;
    const defaultColor = existing ? existing.color : App.COLORS[colorIdx];
    const existingContents = existing && existing.contents ? existing.contents : [];

    App.openModal(`
      <h3 class="modal-title">${existing ? '✏️ Editar matéria' : '📚 Nova matéria'}</h3>
      <div class="app-field">
        <label>Nome da matéria</label>
        <input type="text" id="subj-name" value="${existing ? existing.name : ''}" placeholder="Ex: Direito Constitucional" required/>
      </div>
      <div class="app-field">
        <label>Cor</label>
        <div style="display:flex;gap:8px;flex-wrap:wrap" id="color-picker">
          ${App.COLORS.map(c => `
            <div class="color-opt" data-color="${c}" style="width:32px;height:32px;border-radius:8px;background:${c};cursor:pointer;border:2px solid ${c === defaultColor ? '#fff' : 'transparent'};transition:border .2s"></div>
          `).join('')}
        </div>
        <input type="hidden" id="subj-color" value="${defaultColor}"/>
      </div>

      <div class="app-field">
        <label>Assuntos/Conteúdos</label>
        <div style="display:flex;gap:8px;margin-bottom:12px">
          <input type="text" id="new-content" placeholder="Novo assunto..." style="flex:1"/>
          <button class="btn-secondary" id="btn-add-content">Adicionar</button>
        </div>
        <div id="contents-list" style="display:flex;flex-direction:column;gap:8px">
          ${existingContents.map((c, idx) => `
            <div style="display:flex;align-items:center;justify-content:space-between;padding:8px;background:rgba(124,58,237,.08);border-radius:6px">
              <span>${c}</span>
              <button class="btn-icon" data-remove="${idx}" title="Remover">✕</button>
            </div>
          `).join('')}
        </div>
        ${existingContents.length === 0 ? `<p style="color:var(--text3);font-size:13px;margin-top:8px">Nenhum assunto adicionado ainda</p>` : ''}
      </div>

      <div class="app-field">
        <label>Meta semanal (horas)</label>
        <input type="number" id="subj-goal" value="${existing ? (existing.weeklyGoal || '') : ''}" placeholder="Ex: 8" min="0" max="100"/>
      </div>
      <div class="modal-actions">
        <button class="modal-btn secondary" onclick="App.closeModal()">Cancelar</button>
        <button class="modal-btn primary" id="btn-save-subject">${existing ? 'Salvar alterações' : 'Cadastrar matéria'}</button>
      </div>
    `);

    // Color picker
    document.querySelectorAll('.color-opt').forEach(opt => {
      opt.addEventListener('click', () => {
        document.querySelectorAll('.color-opt').forEach(o => o.style.border = '2px solid transparent');
        opt.style.border = '2px solid #fff';
        document.getElementById('subj-color').value = opt.dataset.color;
      });
    });

    // Contents management
    let contents = [...existingContents];
    const contentsList = document.getElementById('contents-list');
    const newContentInput = document.getElementById('new-content');

    const renderContents = () => {
      if (contents.length === 0) {
        contentsList.innerHTML = '<p style="color:var(--text3);font-size:13px;margin-top:8px">Nenhum assunto adicionado ainda</p>';
      } else {
        contentsList.innerHTML = contents.map((c, idx) => `
          <div style="display:flex;align-items:center;justify-content:space-between;padding:8px;background:rgba(124,58,237,.08);border-radius:6px">
            <span>${c}</span>
            <button class="btn-icon" data-remove="${idx}" title="Remover">✕</button>
          </div>
        `).join('');
        
        // Bind remove buttons
        document.querySelectorAll('[data-remove]').forEach(btn => {
          btn.addEventListener('click', () => {
            contents.splice(parseInt(btn.dataset.remove), 1);
            renderContents();
          });
        });
      }
    };

    document.getElementById('btn-add-content').addEventListener('click', () => {
      const newContent = newContentInput.value.trim();
      if (!newContent) return alert('Digite um assunto.');
      if (contents.includes(newContent)) return alert('Este assunto já foi adicionado.');
      contents.push(newContent);
      newContentInput.value = '';
      renderContents();
    });

    newContentInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        document.getElementById('btn-add-content').click();
      }
    });

    document.getElementById('btn-save-subject').addEventListener('click', () => {
      const name = document.getElementById('subj-name').value.trim();
      if (!name) return alert('Digite o nome da matéria.');
      const color = document.getElementById('subj-color').value;
      const weeklyGoal = parseInt(document.getElementById('subj-goal').value) || 0;

      if (existing) {
        existing.name = name;
        existing.color = color;
        existing.contents = contents;
        existing.weeklyGoal = weeklyGoal;
      } else {
        App.userData.subjects.push({
          id: App.generateId(),
          name,
          color,
          contents,
          weeklyGoal,
          createdAt: new Date().toISOString()
        });
      }

      App.saveData();
      App.closeModal();
      this.render(document.getElementById('view-container'));
    });
  },

  deleteSubject(id) {
    if (!confirm('Tem certeza que deseja excluir esta matéria? As atividades associadas não serão apagadas.')) return;
    App.userData.subjects = App.userData.subjects.filter(s => s.id !== id);
    App.saveData();
    this.render(document.getElementById('view-container'));
  }
};
