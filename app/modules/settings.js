/* =============================================
   ATÉ PASSAR — Settings Module
   ============================================= */
const SettingsModule = {
  render(container) {
    const s = App.userData.settings;
    const u = App.currentUser;
    const totalActivities = App.userData.activities.length;
    const totalSecs = App.userData.activities.reduce((sum, a) => sum + (a.duration || 0), 0);

    container.innerHTML = `
      <div class="grid-2">
        <div>
          <div class="settings-section">
            <h3>👤 Perfil</h3>
            <div class="app-card">
              <div class="app-field">
                <label>Nome</label>
                <input type="text" id="set-name" value="${u.name || ''}"/>
              </div>
              <div class="app-field">
                <label>E-mail</label>
                <input type="email" id="set-email" value="${u.email}" disabled style="opacity:.6"/>
              </div>
              <button class="btn-primary btn-sm" id="btn-save-profile">Salvar perfil</button>
            </div>
          </div>

          <div class="settings-section">
            <h3>⏱ Pomodoro</h3>
            <div class="app-card">
              <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px">
                <div class="app-field">
                  <label>Tempo de foco (min)</label>
                  <input type="number" id="set-pomo-work" value="${s.pomodoroWork || 25}" min="5" max="120"/>
                </div>
                <div class="app-field">
                  <label>Tempo de pausa (min)</label>
                  <input type="number" id="set-pomo-break" value="${s.pomodoroBreak || 5}" min="1" max="30"/>
                </div>
              </div>
              <button class="btn-primary btn-sm" id="btn-save-pomodoro">Salvar Pomodoro</button>
            </div>
          </div>

          <div class="settings-section">
            <h3>🎯 Meta diária</h3>
            <div class="app-card">
              <div class="app-field">
                <label>Horas de estudo por dia</label>
                <input type="number" id="set-daily-goal" value="${s.dailyGoal || 6}" min="1" max="24"/>
              </div>
              <button class="btn-primary btn-sm" id="btn-save-goal">Salvar meta</button>
            </div>
          </div>
        </div>

        <div>
          <div class="settings-section">
            <h3>📊 Estatísticas da conta</h3>
            <div class="app-card">
              <div style="display:flex;flex-direction:column;gap:12px">
                <div style="display:flex;justify-content:space-between;font-size:14px">
                  <span style="color:var(--text3)">Total de sessões</span>
                  <span style="font-family:var(--font);font-weight:700">${totalActivities}</span>
                </div>
                <div style="display:flex;justify-content:space-between;font-size:14px">
                  <span style="color:var(--text3)">Total de horas</span>
                  <span style="font-family:var(--font);font-weight:700">${App.formatDurationShort(totalSecs)}</span>
                </div>
                <div style="display:flex;justify-content:space-between;font-size:14px">
                  <span style="color:var(--text3)">Matérias cadastradas</span>
                  <span style="font-family:var(--font);font-weight:700">${App.userData.subjects.length}</span>
                </div>
                <div style="display:flex;justify-content:space-between;font-size:14px">
                  <span style="color:var(--text3)">Membro desde</span>
                  <span style="font-family:var(--font);font-weight:700">${u.createdAt ? App.formatDate(u.createdAt) : '-'}</span>
                </div>
              </div>
            </div>
          </div>

          <div class="settings-section">
            <h3>💾 Dados</h3>
            <div class="app-card">
              <div style="display:flex;flex-direction:column;gap:10px">
                <button class="btn-secondary btn-sm" id="btn-export-data" style="width:100%">📥 Exportar dados (JSON)</button>
                <button class="btn-secondary btn-sm" id="btn-import-data" style="width:100%">📤 Importar dados (JSON)</button>
                <input type="file" id="import-file" accept=".json" style="display:none"/>
                <hr style="border:none;border-top:1px solid var(--border);margin:8px 0"/>
                <button class="btn-danger btn-sm" id="btn-clear-data" style="width:100%">🗑️ Limpar todos os dados</button>
              </div>
            </div>
          </div>

          <div class="settings-section">
            <h3>🔔 Notificações</h3>
            <div class="app-card">
              <p style="font-size:14px;color:var(--text3);margin-bottom:12px">Permita notificações para receber avisos do Pomodoro.</p>
              <button class="btn-secondary btn-sm" id="btn-enable-notifs" style="width:100%">🔔 Ativar notificações</button>
            </div>
          </div>
        </div>
      </div>
    `;

    // Save profile
    document.getElementById('btn-save-profile')?.addEventListener('click', () => {
      const name = document.getElementById('set-name').value.trim();
      if (!name) return alert('Digite seu nome.');
      App.currentUser.name = name;
      const users = JSON.parse(localStorage.getItem('ap_users') || '{}');
      users[App.currentUser.email].name = name;
      localStorage.setItem('ap_users', JSON.stringify(users));
      App.renderUserInfo();
      alert('Perfil atualizado!');
    });

    // Save pomodoro
    document.getElementById('btn-save-pomodoro')?.addEventListener('click', () => {
      s.pomodoroWork = parseInt(document.getElementById('set-pomo-work').value) || 25;
      s.pomodoroBreak = parseInt(document.getElementById('set-pomo-break').value) || 5;
      App.saveData();
      alert('Configurações do Pomodoro salvas!');
    });

    // Save goal
    document.getElementById('btn-save-goal')?.addEventListener('click', () => {
      s.dailyGoal = parseInt(document.getElementById('set-daily-goal').value) || 6;
      App.saveData();
      alert('Meta diária atualizada!');
    });

    // Export
    document.getElementById('btn-export-data')?.addEventListener('click', () => {
      const data = JSON.stringify(App.userData, null, 2);
      const blob = new Blob([data], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `ate-passar-backup-${App.getDateString(new Date())}.json`;
      a.click();
      URL.revokeObjectURL(url);
    });

    // Import
    document.getElementById('btn-import-data')?.addEventListener('click', () => {
      document.getElementById('import-file').click();
    });

    document.getElementById('import-file')?.addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (ev) => {
        try {
          const data = JSON.parse(ev.target.result);
          if (data.subjects && data.activities) {
            App.userData = data;
            App.saveData();
            alert('Dados importados com sucesso!');
            this.render(document.getElementById('view-container'));
          } else {
            alert('Arquivo inválido.');
          }
        } catch {
          alert('Erro ao ler o arquivo.');
        }
      };
      reader.readAsText(file);
    });

    // Clear data
    document.getElementById('btn-clear-data')?.addEventListener('click', () => {
      if (!confirm('⚠️ Tem certeza? Isso vai apagar TODAS as suas matérias e atividades. Essa ação não pode ser desfeita.')) return;
      if (!confirm('Última chance! Deseja realmente limpar tudo?')) return;
      App.userData.subjects = [];
      App.userData.activities = [];
      App.saveData();
      alert('Todos os dados foram apagados.');
      this.render(document.getElementById('view-container'));
    });

    // Notifications
    document.getElementById('btn-enable-notifs')?.addEventListener('click', () => {
      if ('Notification' in window) {
        Notification.requestPermission().then(perm => {
          if (perm === 'granted') {
            alert('Notificações ativadas!');
            new Notification('ATÉ PASSAR', { body: '🎯 Notificações ativadas com sucesso!' });
          } else {
            alert('Permissão negada. Ative pelo navegador.');
          }
        });
      } else {
        alert('Seu navegador não suporta notificações.');
      }
    });
  }
};
