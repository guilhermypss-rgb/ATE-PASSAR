/* =============================================
   ATÉ PASSAR — Timer Module
   Stopwatch + Pomodoro
   ============================================= */
const TimerModule = {
  delegationSetup: false, // Flag para garantir setup uma só vez

  render(container) {
    // Setup global delegation apenas uma vez
    if (!this.delegationSetup) {
      this.setupGlobalDelegation();
      this.delegationSetup = true;
    }

    const ts = App.timerState;
    const subjects = App.userData.subjects;
    const settings = App.userData.settings;

    const subjectOptions = subjects.map(s => `<option value="${s.id}" ${ts.subjectId === s.id ? 'selected' : ''}>${s.name}</option>`).join('');
    const contentOptions = this.getContentOptions(ts.subjectId);

    let formHtml = '';
    
    if (ts.mode === 'manual') {
      const subjectsOnly = subjects.map(s => `<option value="${s.id}">${s.name}</option>`).join('');
      formHtml = `
        <div class="manual-entry-form">
          <div class="app-field">
            <label>Matéria *</label>
            <select id="manual-subject" required>
              <option value="">Selecione uma matéria...</option>
              ${subjectsOnly}
            </select>
          </div>
          
          <div class="app-field">
            <label>Conteúdo/Assunto *</label>
            <select id="manual-content" required>
              <option value="">Selecione o assunto...</option>
            </select>
          </div>

          <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:12px">
            <div class="app-field" style="margin:0">
              <label>Duração (minutos) *</label>
              <input type="number" id="manual-duration" min="1" max="480" value="30" required />
            </div>
            <div class="app-field" style="margin:0">
              <label>Modo</label>
              <select id="manual-studyType">
                <option value="Teoria" selected>Teoria</option>
                <option value="Videoaula">Videoaula</option>
                <option value="Exercícios">Exercícios</option>
                <option value="Revisão">Revisão</option>
              </select>
            </div>
            <div class="app-field" style="margin:0">
              <label>Data (opcional)</label>
              <input type="date" id="manual-date" value="${new Date().toISOString().slice(0,10)}" />
            </div>
          </div>
          
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px">
            <div class="app-field" style="margin:0">
              <label>Duração (minutos) *</label>
              <input type="number" id="manual-duration" min="1" max="480" value="30" required />
            </div>
            <div class="app-field" style="margin:0">
              <label>Questões resolvidas</label>
              <input type="number" id="manual-questions" min="0" />
            </div>
          </div>
          
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px">
            <div class="app-field" style="margin:0">
              <label>Acertos</label>
              <input type="number" id="manual-correct" min="0" />
            </div>
            <div class="app-field" style="margin:0">
              <label>Data (opcional)</label>
              <input type="date" id="manual-date" value="${new Date().toISOString().slice(0,10)}" />
            </div>
          </div>
          
          <div class="app-field">
            <label>Notas (opcional)</label>
            <textarea id="manual-notes" placeholder="Descreva a sessão..."></textarea>
          </div>
          
          <button class="btn-primary" id="btn-manual-save">💾 Registrar Estudo</button>
        </div>
      `;
    } else {
      // Stopwatch / Pomodoro form
      const sessionHtml = (ts.running || ts.paused) ? `
        <div class="timer-session-info">
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:12px">
            <div class="app-field" style="margin:0">
              <label>Matéria</label>
              <select id="timer-subject-running" disabled>
                ${subjects.map(s => `<option value="${s.id}" ${ts.subjectId === s.id ? 'selected' : ''}>${s.name}</option>`).join('')}
              </select>
            </div>
            <div class="app-field" style="margin:0">
              <label>Conteúdo/Assunto</label>
              <select id="timer-content-running">
                ${(() => {
                  const sub = App.getSubjectById(ts.subjectId);
                  if (!sub || !sub.contents || sub.contents.length === 0) return '<option value="">Nenhum conteúdo disponível</option>';
                  return `<option value="">Selecione...</option>` + sub.contents.map(c => `<option value="${c}" ${ts.contentName === c ? 'selected' : ''}>${c}</option>`).join('');
                })()}
              </select>
            </div>
          </div>
          Início: ${ts.startedAt ? App.formatTime(ts.startedAt) : '--:--'}
          <button class="btn-secondary btn-sm" id="btn-switch-subject" style="margin-top:10px;width:100%">🔄 Trocar Matéria</button>
          ${ts.subjectBlocks && ts.subjectBlocks.length > 0 ? `<div style="margin-top:8px;font-size:12px;color:var(--text3)">Matérias nesta sessão: ${ts.subjectBlocks.map(b => { const s = App.getSubjectById(b.subjectId); return s ? s.name : 'Removida'; }).join(', ')}</div>` : ''}
        </div>

        <div class="timer-questions-tracker">
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px">
            <div class="app-field" style="margin:0">
              <label>✏️ Questões</label>
              <input type="number" id="timer-questions" min="0" value="${ts.questionsCount}" />
            </div>
            <div class="app-field" style="margin:0">
              <label>✅ Acertos</label>
              <input type="number" id="timer-correct" min="0" value="${ts.correctCount}" />
            </div>
          </div>
          ${ts.questionsCount > 0 ? `<div style="text-align:center;font-size:13px;color:var(--text3)">Acurácia: <strong style="color:var(--text2)">${Math.round((ts.correctCount / ts.questionsCount) * 100)}%</strong></div>` : ''}
        </div>
      ` : '';

      const controlButtons = this.getControlButtons();

      formHtml = `
        <div class="timer-form">
          <div class="timer-selectors" style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:16px;margin-bottom:16px;">
            <div class="app-field" style="margin:0">
              <label>Matéria</label>
              <select id="timer-subject" ${ts.running ? 'disabled' : ''}>
                <option value="">Selecione uma matéria...</option>
                ${subjectOptions}
              </select>
            </div>
            <div class="app-field" style="margin:0">
              <label>Conteúdo</label>
              <select id="timer-content" ${ts.running ? 'disabled' : ''}>
                <option value="">Selecione o conteúdo...</option>
                ${contentOptions}
              </select>
            </div>
            <div class="app-field" style="margin:0">
              <label>Modo</label>
              <select id="timer-studyType" ${ts.running ? 'disabled' : ''}>
                <option value="Teoria" ${ts.studyType === 'Teoria' ? 'selected' : ''}>Teoria</option>
                <option value="Videoaula" ${ts.studyType === 'Videoaula' ? 'selected' : ''}>Vídeo</option>
                <option value="Exercícios" ${ts.studyType === 'Exercícios' ? 'selected' : ''}>Exercícios</option>
                <option value="Revisão" ${ts.studyType === 'Revisão' ? 'selected' : ''}>Revisão</option>
              </select>
            </div>
          </div>

          <div class="timer-controls" id="timer-controls">
            ${controlButtons}
          </div>

          ${sessionHtml}
        </div>
      `;
    }

    container.innerHTML = `
      <div class="timer-view">
        <div class="timer-mode-toggle">
          <button class="timer-mode-btn ${ts.mode === 'stopwatch' ? 'active' : ''}" id="mode-stopwatch">⏱ Cronômetro</button>
          <button class="timer-mode-btn ${ts.mode === 'pomodoro' ? 'active' : ''}" id="mode-pomodoro">🍅 Pomodoro</button>
          <button class="timer-mode-btn ${ts.mode === 'manual' ? 'active' : ''}" id="mode-manual">✏️ Manual</button>
        </div>

        ${ts.mode !== 'manual' ? `<div class="timer-display" id="timer-display">${this.getDisplayTime()}</div>` : ''}

        ${ts.mode === 'pomodoro' ? `
          <div class="pomodoro-info">
            <span class="pi-label">Fase: ${ts.pomodoroPhase === 'work' ? '📖 Foco' : '☕ Pausa'}</span>
            <span>Ciclo ${ts.pomodoroCount + 1}</span>
            <span>${settings.pomodoroWork}min / ${settings.pomodoroBreak}min</span>
          </div>
        ` : ''}

        ${formHtml}

        ${!ts.running && !ts.paused && subjects.length === 0 ? `
          <div class="empty-state" style="padding:24px">
            <p class="empty-desc">Cadastre pelo menos uma matéria antes de iniciar o timer.</p>
            <button class="btn-primary" onclick="App.navigate('subjects')">📚 Cadastrar matéria</button>
          </div>
        ` : ''}
      </div>
    `;

    this.bindEvents();
  },

  getDisplayTime() {
    const ts = App.timerState;
    if (ts.mode === 'pomodoro' && !ts.running && !ts.paused) {
      return App.formatDuration(App.userData.settings.pomodoroWork * 60);
    }
    return App.formatDuration(ts.seconds);
  },

  getContentOptions(subjectId) {
    if (!subjectId) return '';
    const sub = App.getSubjectById(subjectId);
    if (!sub || !sub.contents || sub.contents.length === 0) return '';
    return sub.contents.map(c => `<option value="${c}">${c}</option>`).join('');
  },

  getControlButtons() {
    const ts = App.timerState;
    if (!ts.running && !ts.paused) {
      return `<button class="timer-ctrl-btn start" id="btn-timer-start">▶️ Iniciar</button>`;
    }
    if (ts.running && !ts.paused) {
      return `
        <button class="timer-ctrl-btn pause" id="btn-timer-pause">⏸ Pausar</button>
        <button class="timer-ctrl-btn save" id="btn-timer-save">💾 Salvar</button>
      `;
    }
    if (ts.paused) {
      return `
        <button class="timer-ctrl-btn resume" id="btn-timer-resume">▶️ Continuar</button>
        <button class="timer-ctrl-btn save" id="btn-timer-save">💾 Salvar</button>
      `;
    }
    return ''; // Retorno padrão
  },

  bindEvents() {
    const ts = App.timerState;
    const timerModule = this; // Salva referência para usar em event listeners

    document.getElementById('mode-stopwatch')?.addEventListener('click', () => {
      if (ts.running) return;
      ts.mode = 'stopwatch';
      ts.seconds = 0;
      timerModule.render(document.getElementById('view-container'));
    });

    document.getElementById('mode-pomodoro')?.addEventListener('click', () => {
      if (ts.running) return;
      ts.mode = 'pomodoro';
      ts.seconds = App.userData.settings.pomodoroWork * 60;
      ts.pomodoroPhase = 'work';
      ts.pomodoroCount = 0;
      timerModule.render(document.getElementById('view-container'));
    });

    document.getElementById('mode-manual')?.addEventListener('click', () => {
      if (ts.running) return;
      ts.mode = 'manual';
      ts.seconds = 0;
      timerModule.render(document.getElementById('view-container'));
    });

    document.getElementById('timer-subject')?.addEventListener('change', (e) => {
      ts.subjectId = e.target.value || null;
      const contentSelect = document.getElementById('timer-content');
      if (contentSelect) {
        contentSelect.innerHTML = '<option value="">Selecione o conteúdo...</option>' + timerModule.getContentOptions(ts.subjectId);
      }
    });

    document.getElementById('timer-content')?.addEventListener('change', (e) => {
      ts.contentName = e.target.value || '';
    });

    document.getElementById('timer-studyType')?.addEventListener('change', (e) => {
      ts.studyType = e.target.value || 'Teoria';
    });

    document.getElementById('timer-content-running')?.addEventListener('change', (e) => {
      ts.contentName = e.target.value || '';
    });

    document.getElementById('btn-timer-start')?.addEventListener('click', () => timerModule.startTimer());
    document.getElementById('btn-timer-pause')?.addEventListener('click', () => timerModule.pauseTimer());
    document.getElementById('btn-timer-resume')?.addEventListener('click', () => timerModule.resumeTimer());
    document.getElementById('btn-timer-save')?.addEventListener('click', () => timerModule.saveTimer());

    // Manual entry
    document.getElementById('btn-manual-save')?.addEventListener('click', () => timerModule.saveManualEntry());
    document.getElementById('manual-subject')?.addEventListener('change', () => timerModule.updateManualContentOptions());
    timerModule.updateManualContentOptions(); // Initialize on first load

    // Questions & correct tracker handled by setupGlobalDelegation
    // (using event delegation instead of direct listeners to avoid duplicates on re-render)

    // Floating bar events
    document.getElementById('ft-pause-btn')?.addEventListener('click', () => {
      if (ts.paused) timerModule.resumeTimer(); else timerModule.pauseTimer();
    });
    document.getElementById('ft-stop-btn')?.addEventListener('click', () => timerModule.saveTimer());
    document.getElementById('ft-expand-btn')?.addEventListener('click', () => App.navigate('timer'));

    // Switch subject during timer - COM FALLBACK
    const switchBtn = document.getElementById('btn-switch-subject');
    if (switchBtn) {
      switchBtn.addEventListener('click', () => {
        timerModule.openSwitchSubjectModal();
      });
    }
  },

  setupGlobalDelegation() {
    const timerModule = this;
    const ts = App.timerState;
    
    // Event delegation global - TODOS os listeners críticos
    document.addEventListener('click', (e) => {
      // Botão trocar matéria
      if (e.target.closest('#btn-switch-subject')) {
        timerModule.openSwitchSubjectModal();
      }
      
      // FLOATING BAR BUTTONS
      if (e.target.closest('#ft-pause-btn')) {
        e.preventDefault();
        if (ts.paused) timerModule.resumeTimer(); else timerModule.pauseTimer();
      }
      
      if (e.target.closest('#ft-stop-btn')) {
        e.preventDefault();
        timerModule.saveTimer();
      }
      
      if (e.target.closest('#ft-expand-btn')) {
        e.preventDefault();
        App.navigate('timer');
      }
    });

    // Track input changes para questões e acertos - real-time
    document.addEventListener('change', (e) => {
      if (e.target.id === 'timer-questions') {
        ts.questionsCount = parseInt(e.target.value || 0);
        if (ts.correctCount > ts.questionsCount) {
          ts.correctCount = ts.questionsCount;
        }
      }
      
      if (e.target.id === 'timer-correct') {
        ts.correctCount = parseInt(e.target.value || 0);
        if (ts.correctCount > ts.questionsCount) {
          ts.correctCount = ts.questionsCount;
          e.target.value = String(ts.questionsCount);
        }
      }
    });

    // Input event para captura instantânea
    document.addEventListener('input', (e) => {
      if (e.target.id === 'timer-questions') {
        ts.questionsCount = parseInt(e.target.value || 0);
      }
      
      if (e.target.id === 'timer-correct') {
        ts.correctCount = parseInt(e.target.value || 0);
      }
    });
  },

  startTimer() {
    const ts = App.timerState;
    const subjectSelect = document.getElementById('timer-subject');
    const contentSelect = document.getElementById('timer-content');
    const typeSelect = document.getElementById('timer-studyType');

    ts.subjectId = subjectSelect?.value || null;
    ts.contentName = contentSelect?.value || '';
    if (typeSelect) ts.studyType = typeSelect.value;

    if (!ts.subjectId) {
      alert('Selecione uma matéria antes de iniciar.');
      return;
    }

    // CONTEÚDO AGORA OBRIGATÓRIO
    if (!ts.contentName) {
      alert('Selecione um assunto/conteúdo antes de iniciar.');
      return;
    }

    ts.running = true;
    ts.paused = false;
    ts.startedAt = new Date().toISOString();
    ts.pausedTime = 0;
    ts.subjectBlocks = [];
    ts.secondsAtBlockStart = 0; // Track block duration
    ts.questionsCount = 0; // Reinicia questões
    ts.correctCount = 0; // Reinicia acertos

    if (ts.mode === 'stopwatch') {
      ts.seconds = 0;
    } else {
      ts.seconds = App.userData.settings.pomodoroWork * 60;
      ts.pomodoroPhase = 'work';
    }

    // Request notification permission for Pomodoro
    if (ts.mode === 'pomodoro') {
      App.requestNotificationPermission();
    }
    
    this.tick();
    App.showFloatingTimer();
    App.updateFloatingTimer();
    this.render(document.getElementById('view-container'));
  },

  tick() {
    const ts = App.timerState;
    if (ts.interval) clearInterval(ts.interval);
    ts.interval = setInterval(() => {
      if (!ts.running || ts.paused) return;

      if (ts.mode === 'stopwatch') {
        ts.seconds++;
      } else {
        ts.seconds--;
        // Check if current phase ended
        if (ts.seconds <= 0) {
          this.pomodoroPhaseEnd();
          // Continue ticking for next phase
          return;
        }
      }

      // Update displays
      const display = document.getElementById('timer-display');
      if (display) display.textContent = App.formatDuration(ts.seconds);
      App.updateFloatingTimer();
    }, 1000);
  },

  pauseTimer() {
    const ts = App.timerState;
    
    // Safety: only pause if timer is running and not already paused
    if (!ts.running || ts.paused) return;
    
    ts.paused = true;
    // Update floating timer state
    App.updateFloatingTimer();
    if (App.currentView === 'timer') this.render(document.getElementById('view-container'));
  },

  resumeTimer() {
    const ts = App.timerState;
    
    // Safety: only resume if timer is running and currently paused
    if (!ts.running || !ts.paused) return;
    
    ts.paused = false;
    // Update floating timer state
    App.updateFloatingTimer();
    if (App.currentView === 'timer') this.render(document.getElementById('view-container'));
  },

  saveTimer() {
    const ts = App.timerState;
    
    // Os valores já foram capturados em tempo real pelas event listeners do setupGlobalDelegation
    // Mas vamos garantir que estão atualizados:
    const questionsInput = document.getElementById('timer-questions');
    const correctInput = document.getElementById('timer-correct');
    
    if (questionsInput) {
      ts.questionsCount = parseInt(questionsInput.value || 0);
    }
    if (correctInput) {
      ts.correctCount = parseInt(correctInput.value || 0);
    }
    
    // Stop the interval
    if (ts.interval) {
      clearInterval(ts.interval);
      ts.interval = null;
    }

    // Calculate duration based on mode
    let actualDuration;
    if (ts.mode === 'stopwatch') {
      actualDuration = ts.seconds;
    } else {
      // Pomodoro: track actual study time (work phases only, not breaks)
      const completedWorkSeconds = ts.pomodoroCount * (App.userData.settings.pomodoroWork * 60);
      const currentPhaseSeconds = ts.pomodoroPhase === 'work' 
        ? (App.userData.settings.pomodoroWork * 60) - ts.seconds 
        : App.userData.settings.pomodoroWork * 60; // If in break, count full work time
      actualDuration = completedWorkSeconds + currentPhaseSeconds;
      actualDuration = Math.max(1, actualDuration); // Ensure at least 1 second
    }

    // Show save modal
    App.openModal(`
      <h3 class="modal-title">💾 Salvar sessão de estudo</h3>
      <div style="text-align:center;margin-bottom:20px">
        <div style="font-family:var(--font);font-size:2.5rem;font-weight:900;background:var(--grad);-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text">${App.formatDuration(actualDuration)}</div>
        <p style="color:var(--text3);font-size:14px;margin-top:6px">${(() => { const s = App.getSubjectById(ts.subjectId); return s ? s.name : 'Sem matéria'; })()}${ts.contentName ? ' — ' + ts.contentName : ''}</p>
      </div>

      <div style="background:rgba(124,58,237,.08);border:1px solid var(--primary);border-radius:8px;padding:12px;margin-bottom:16px">
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;font-size:13px">
          <div><strong>Questões:</strong> <span style="color:var(--text2)">${ts.questionsCount}</span></div>
          <div><strong>Acertos:</strong> <span style="color:var(--text2)">${ts.correctCount}</span></div>
          ${ts.questionsCount > 0 ? `<div style="grid-column:1/-1"><strong>Acurácia:</strong> <span style="color:var(--text2)">${Math.round((ts.correctCount / ts.questionsCount) * 100)}%</span></div>` : ''}
        </div>
      </div>

      <div class="app-field">
        <label>Anotações (opcional)</label>
        <textarea id="session-notes" placeholder="O que você estudou? Como foi a sessão?"></textarea>
      </div>
      <div class="modal-actions">
        <button class="modal-btn secondary" id="btn-cancel-save">Continuar estudando</button>
        <button class="modal-btn primary" id="btn-confirm-save">✅ Salvar sessão</button>
      </div>
    `);

    document.getElementById('btn-cancel-save').addEventListener('click', () => {
      App.closeModal();
      // Resume timer (restart interval)
      this.tick();
    });

    document.getElementById('btn-confirm-save').addEventListener('click', () => {
      const notes = document.getElementById('session-notes').value.trim();

      // Calculate accuracy for current subject
      const accuracy = ts.questionsCount > 0 ? (ts.correctCount / ts.questionsCount * 100) : 0;

      // Check if there are multiple subject blocks
      if (ts.subjectBlocks.length > 0) {
        // Multi-subject session - add current block if exists
        if (ts.subjectId) {
          const currentBlockDuration = ts.seconds - ts.secondsAtBlockStart;
          if (currentBlockDuration > 0) {
            ts.subjectBlocks.push({
              subjectId: ts.subjectId,
              content: ts.contentName,
              studyType: ts.studyType,
              duration: currentBlockDuration,
              questions: ts.questionsCount,
              correct: ts.correctCount
            });
          }
        }

        // Create activity for EACH block
        ts.subjectBlocks.forEach((block, index) => {
          const blockAccuracy = block.questions > 0 ? (block.correct / block.questions * 100) : 0;
          App.userData.activities.push({
            id: App.generateId(),
            subjectId: block.subjectId,
            content: block.content,
            studyType: block.studyType || 'Teoria',
            duration: block.duration,
            questionsCount: block.questions,
            correctCount: block.correct,
            accuracy: Math.round(blockAccuracy * 100) / 100,
            date: ts.startedAt || new Date().toISOString(),
            notes: index === ts.subjectBlocks.length - 1 ? notes : '', // Only on last block
            mode: ts.mode,
            pomodoroCount: ts.pomodoroCount
          });
        });
      } else {
        // Single subject session
        let actualDuration;
        if (ts.mode === 'stopwatch') {
          actualDuration = ts.seconds;
        } else {
          // Pomodoro: track actual study time (work phases only, not breaks)
          const completedWorkSeconds = ts.pomodoroCount * (App.userData.settings.pomodoroWork * 60);
          const currentPhaseSeconds = ts.pomodoroPhase === 'work' 
            ? (App.userData.settings.pomodoroWork * 60) - ts.seconds 
            : App.userData.settings.pomodoroWork * 60; // If in break, count full work time
          actualDuration = completedWorkSeconds + currentPhaseSeconds;
          actualDuration = Math.max(1, actualDuration); // Ensure at least 1 second
        }

        App.userData.activities.push({
          id: App.generateId(),
          subjectId: ts.subjectId,
          content: ts.contentName,
          studyType: ts.studyType || 'Teoria',
          duration: actualDuration,
          questionsCount: ts.questionsCount,
          correctCount: ts.correctCount,
          accuracy: Math.round(accuracy * 100) / 100,
          date: ts.startedAt || new Date().toISOString(),
          notes,
          mode: ts.mode,
          pomodoroCount: ts.pomodoroCount
        });
      }

      App.saveData();
      App.closeModal();

      // Reset timer state completely
      ts.running = false;
      ts.paused = false;
      ts.seconds = 0;
      ts.subjectId = null;
      ts.contentName = '';
      ts.startedAt = null;
      ts.pausedTime = 0;
      ts.pomodoroCount = 0;
      ts.pomodoroPhase = 'work';
      ts.questionsCount = 0;
      ts.correctCount = 0;
      ts.subjectBlocks = [];
      ts.currentBlockStartTime = null;
      ts.mode = 'stopwatch'; // Reset to stopwatch

      App.hideFloatingTimer();
      App.navigate('dashboard');
    });
  },

  pomodoroPhaseEnd() {
    const ts = App.timerState;
    if (ts.pomodoroPhase === 'work') {
      // Work phase ended, start break
      ts.pomodoroCount++;
      ts.pomodoroPhase = 'break';
      ts.seconds = App.userData.settings.pomodoroBreak * 60;
      // Notify
      if ('Notification' in window && Notification.permission === 'granted') {
        new Notification('ATÉ PASSAR', { 
          body: '☕ Hora da pausa! Descanse um pouco.'
        });
      }
    } else {
      // Break phase ended, restart work
      ts.pomodoroPhase = 'work';
      ts.seconds = App.userData.settings.pomodoroWork * 60;
      // Notify
      if ('Notification' in window && Notification.permission === 'granted') {
        new Notification('ATÉ PASSAR', { 
          body: '📖 Pausa acabou! De volta ao foco.'
        });
      }
    }
    
    // Update UI to show phase change
    if (App.currentView === 'timer') {
      this.render(document.getElementById('view-container'));
    }
    
    // Update floating timer
    App.updateFloatingTimer();
  },

  saveManualEntry() {
    const subjectId = document.getElementById('manual-subject').value;
    if (!subjectId) {
      alert('Selecione uma matéria.');
      return;
    }

    const content = document.getElementById('manual-content').value;
    if (!content) {
      alert('Selecione um assunto/conteúdo.');
      return;
    }

    const durationMinutes = parseInt(document.getElementById('manual-duration').value || 0);
    const questionsCount = parseInt(document.getElementById('manual-questions').value || 0);
    const correctCount = parseInt(document.getElementById('manual-correct').value || 0);
    const dateStr = document.getElementById('manual-date').value;
    const notes = document.getElementById('manual-notes').value.trim();

    if (durationMinutes < 1) {
      alert('Digite uma duração válida (mínimo 1 minuto).');
      return;
    }

    const durationSeconds = durationMinutes * 60;
    const activityDate = new Date(dateStr + 'T12:00:00').toISOString();
    const typeSelect = document.getElementById('manual-studyType');

    // Calculate accuracy
    const accuracy = questionsCount > 0 ? (correctCount / questionsCount * 100) : 0;

    // Create activity
    App.userData.activities.push({
      id: App.generateId(),
      subjectId,
      content,
      studyType: typeSelect ? typeSelect.value : 'Teoria',
      duration: durationSeconds,
      questionsCount,
      correctCount,
      accuracy: Math.round(accuracy * 100) / 100,
      date: activityDate,
      notes,
      mode: 'manual'
    });

    App.saveData();

    // Show success message
    alert(`✅ Estudo de ${durationMinutes}min registrado com sucesso!`);

    // Reset form
    document.getElementById('manual-subject').value = '';
    document.getElementById('manual-content').value = '';
    document.getElementById('manual-duration').value = '30';
    document.getElementById('manual-questions').value = '';
    document.getElementById('manual-correct').value = '';
    document.getElementById('manual-notes').value = '';
    document.getElementById('manual-date').value = new Date().toISOString().slice(0,10);

    // Navigate to dashboard to confirm
    App.navigate('dashboard');
  },

  openSwitchSubjectModal() {
    const ts = App.timerState;
    const subjects = App.userData.subjects;
    const subjectOptions = subjects.map(s => `<option value="${s.id}">${s.name}</option>`).join('');

    App.openModal(`
      <h3 class="modal-title">🔄 Trocar Matéria</h3>
      
      <div style="background:rgba(124,58,237,.08);border-left:3px solid var(--primary);padding:12px;border-radius:4px;margin-bottom:16px">
        <p style="color:var(--text2);font-size:13px;margin:0">📍 <strong>Matéria Atual:</strong> ${App.getSubjectById(ts.subjectId)?.name || 'Sem matéria'} ${ts.contentName ? `— ${ts.contentName}` : ''}</p>
      </div>

      <p style="color:var(--text3);font-size:12px;margin-bottom:16px">Antes de trocar, registre os dados da matéria atual:</p>
      
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:16px">
        <div class="app-field" style="margin:0">
          <label>Questões resolvidas</label>
          <input type="number" id="current-questions" min="0" value="${ts.questionsCount}" />
        </div>
        <div class="app-field" style="margin:0">
          <label>Acertos</label>
          <input type="number" id="current-correct" min="0" value="${ts.correctCount}" />
        </div>
      </div>

      <div style="border-top:1px solid var(--border);padding-top:16px;margin-top:16px">
        <p style="color:var(--text3);font-size:12px;margin-bottom:12px">Agora escolha a nova matéria:</p>
        
        <div class="app-field">
          <label>Nova matéria *</label>
          <select id="new-subject">
            <option value="">Selecione...</option>
            ${subjectOptions}
          </select>
        </div>

        <div class="app-field">
          <label>Novo assunto/conteúdo *</label>
          <select id="new-content">
            <option value="">Selecione a matéria primeiro...</option>
          </select>
        </div>

        <div class="app-field">
          <label>Novo Modo de Estudo</label>
          <select id="new-studyType">
            <option value="Teoria" ${ts.studyType === 'Teoria' ? 'selected' : ''}>Teoria</option>
            <option value="Videoaula" ${ts.studyType === 'Videoaula' ? 'selected' : ''}>Videoaula</option>
            <option value="Exercícios" ${ts.studyType === 'Exercícios' ? 'selected' : ''}>Exercícios</option>
            <option value="Revisão" ${ts.studyType === 'Revisão' ? 'selected' : ''}>Revisão</option>
          </select>
        </div>
      </div>

      <div class="modal-actions" style="margin-top:20px">
        <button class="modal-btn secondary" id="btn-cancel-switch">Cancelar</button>
        <button class="modal-btn primary" id="btn-confirm-switch">✅ Trocar Matéria</button>
      </div>
    `);

    const updateContentOptions = () => {
      const newSubjectId = document.getElementById('new-subject')?.value || '';
      const contentSelect = document.getElementById('new-content');
      if (contentSelect) {
        if (newSubjectId) {
          const contentOptions = this.getContentOptions(newSubjectId);
          contentSelect.innerHTML = `<option value="">Selecione o assunto...</option>${contentOptions}`;
          contentSelect.disabled = false;
        } else {
          contentSelect.innerHTML = `<option value="">Selecione a matéria primeiro...</option>`;
          contentSelect.disabled = true;
        }
      }
    };

    // Add listener for subject change
    const subjectSelect = document.getElementById('new-subject');
    if (subjectSelect) {
      subjectSelect.addEventListener('change', updateContentOptions);
    }

    // Initial setup - if a subject is already selected, populate contents
    updateContentOptions();

    document.getElementById('btn-cancel-switch')?.addEventListener('click', () => {
      App.closeModal();
    });

    document.getElementById('btn-confirm-switch')?.addEventListener('click', () => {
      const newSubjectId = document.getElementById('new-subject')?.value;
      const newContent = document.getElementById('new-content')?.value;
      const newStudyType = document.getElementById('new-studyType')?.value || 'Teoria';
      const currentQuestions = parseInt(document.getElementById('current-questions')?.value || 0);
      const currentCorrect = parseInt(document.getElementById('current-correct')?.value || 0);

      if (!newSubjectId) {
        alert('Selecione uma matéria.');
        return;
      }
      if (!newContent) {
        alert('Selecione um assunto/conteúdo.');
        return;
      }

      // Update current block with final questions/correct counts
      ts.questionsCount = currentQuestions;
      ts.correctCount = currentCorrect;

      // Calculate duration of current block (NOT from timestamp, but from timer seconds)
      const blockDuration = ts.seconds - ts.secondsAtBlockStart;

      // Save current block
      if (ts.subjectId && blockDuration > 0) {
        ts.subjectBlocks.push({
          subjectId: ts.subjectId,
          content: ts.contentName,
          studyType: ts.studyType,
          duration: blockDuration,
          questions: ts.questionsCount,
          correct: ts.correctCount
        });
      }

      // Switch to new subject/content
      ts.subjectId = newSubjectId;
      ts.contentName = newContent;
      ts.studyType = newStudyType;
      ts.questionsCount = 0; // Reset questions for new subject
      ts.correctCount = 0; // Reset correct for new subject
      ts.secondsAtBlockStart = ts.seconds; // Mark start time of new block

      App.closeModal();
      this.render(document.getElementById('view-container'));
    });
  }
};
