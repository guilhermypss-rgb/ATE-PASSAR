/* =============================================
   ATÉ PASSAR — App Core
   Auth, Storage, Router, State, Utilities
   ============================================= */
'use strict';

const App = {
  currentUser: null,
  userData: null,
  currentView: 'dashboard',
  timerState: { running: false, paused: false, seconds: 0, mode: 'stopwatch', subjectId: null, contentName: '', studyType: 'Teoria', startedAt: null, pausedTime: 0, interval: null, pomodoroPhase: 'work', pomodoroCount: 0, questionsCount: 0, correctCount: 0, subjectBlocks: [], secondsAtBlockStart: 0 },
  charts: {},

  // ── INIT ─────────────────────────────────────
  init() {
    const email = localStorage.getItem('ap_current_user');
    if (!email) { window.location.href = 'login.html'; return; }
    const users = JSON.parse(localStorage.getItem('ap_users') || '{}');
    if (!users[email]) { localStorage.removeItem('ap_current_user'); window.location.href = 'login.html'; return; }
    this.currentUser = users[email];
    this.loadData();
    this.renderUserInfo();
    this.setupNav();
    this.setupMobileMenu();
    this.setupLogout();
    this.setupModal();
    this.setDate();
    this.navigate('dashboard');
  },

  // ── DATA ─────────────────────────────────────
  loadData() {
    const key = 'ap_data_' + this.currentUser.email;
    const raw = localStorage.getItem(key);
    if (raw) {
      this.userData = JSON.parse(raw);
    } else {
      this.userData = { subjects: [], activities: [], settings: { pomodoroWork: 25, pomodoroBreak: 5, dailyGoal: this.currentUser.goal || 6 } };
    }
    // Ensure defaults
    if (!this.userData.settings) this.userData.settings = { pomodoroWork: 25, pomodoroBreak: 5, dailyGoal: 6 };
    if (!this.userData.subjects) this.userData.subjects = [];
    if (!this.userData.activities) this.userData.activities = [];
  },

  saveData() {
    const key = 'ap_data_' + this.currentUser.email;
    localStorage.setItem(key, JSON.stringify(this.userData));
  },

  // ── NAV ──────────────────────────────────────
  setupNav() {
    document.querySelectorAll('.nav-item').forEach(item => {
      item.addEventListener('click', (e) => {
        e.preventDefault();
        const view = item.dataset.view;
        this.navigate(view);
        // Close mobile menu
        document.getElementById('sidebar').classList.remove('open');
      });
    });
  },

  navigate(view) {
    this.currentView = view;
    // Update active nav
    document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
    const active = document.querySelector(`.nav-item[data-view="${view}"]`);
    if (active) active.classList.add('active');
    // Update title
    const titles = { dashboard: 'Dashboard', timer: 'Cronômetro', subjects: 'Matérias', activities: 'Histórico', calendar: 'Calendário', reports: 'Relatórios', settings: 'Configurações' };
    document.getElementById('page-title').textContent = titles[view] || view;
    // Render view
    this.renderView(view);
  },

  renderView(view) {
    // Destroy old charts
    Object.values(this.charts).forEach(c => { if (c && c.destroy) c.destroy(); });
    this.charts = {};
    const container = document.getElementById('view-container');
    switch(view) {
      case 'dashboard': DashboardModule.render(container); break;
      case 'timer': TimerModule.render(container); break;
      case 'subjects': SubjectsModule.render(container); break;
      case 'activities': ActivitiesModule.render(container); break;
      case 'calendar': CalendarModule.render(container); break;
      case 'reports': ReportsModule.render(container); break;
      case 'settings': SettingsModule.render(container); break;
      default: container.innerHTML = '<p>Página não encontrada.</p>';
    }
  },

  // ── USER INFO ────────────────────────────────
  renderUserInfo() {
    const u = this.currentUser;
    document.getElementById('user-name').textContent = u.name || 'Usuário';
    document.getElementById('user-email').textContent = u.email;
    document.getElementById('user-avatar').textContent = (u.name || 'U').charAt(0).toUpperCase();
  },

  setDate() {
    const d = new Date();
    const opts = { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' };
    document.getElementById('today-date').textContent = d.toLocaleDateString('pt-BR', opts);
  },

  // ── MOBILE MENU ──────────────────────────────
  setupMobileMenu() {
    document.getElementById('mobile-menu-btn').addEventListener('click', () => {
      document.getElementById('sidebar').classList.toggle('open');
    });
  },

  // ── LOGOUT ───────────────────────────────────
  setupLogout() {
    document.getElementById('btn-logout').addEventListener('click', () => {
      this.cleanupTimer(); // Stop timer before logout
      localStorage.removeItem('ap_current_user');
      window.location.href = 'login.html';
    });
  },

  // ── MODAL ────────────────────────────────────
  setupModal() {
    document.getElementById('modal-overlay').addEventListener('click', (e) => {
      if (e.target.id === 'modal-overlay') this.closeModal();
    });
  },

  openModal(html) {
    document.getElementById('modal-content').innerHTML = html;
    document.getElementById('modal-overlay').classList.remove('hidden');
  },

  closeModal() {
    document.getElementById('modal-overlay').classList.add('hidden');
    document.getElementById('modal-content').innerHTML = '';
  },

  // ── FLOATING TIMER ───────────────────────────
  showFloatingTimer() {
    document.getElementById('floating-timer').classList.remove('hidden');
  },

  hideFloatingTimer() {
    const ft = document.getElementById('floating-timer');
    if (ft) ft.classList.add('hidden');
  },

  updateFloatingTimer() {
    const ft = document.getElementById('floating-timer');
    if (!ft) return; // Timer bar not in DOM (shouldn't happen, but safe)
    
    // Update subject and time
    const sub = this.getSubjectById(this.timerState.subjectId);
    const ftSubject = document.getElementById('ft-subject');
    const ftTime = document.getElementById('ft-time');
    const ftPauseBtn = document.getElementById('ft-pause-btn');
    
    if (ftSubject) ftSubject.textContent = sub ? sub.name : 'Sem matéria';
    if (ftTime) ftTime.textContent = this.formatDuration(this.timerState.seconds);
    
    // Update pause button state (running/paused)
    if (ftPauseBtn) {
      if (this.timerState.paused) {
        ftPauseBtn.textContent = '▶️';
        ftPauseBtn.title = 'Retomar';
      } else if (this.timerState.running) {
        ftPauseBtn.textContent = '⏸';
        ftPauseBtn.title = 'Pausar';
      }
    }
  },

  // ── NOTIFICATIONS ────────────────────────
  requestNotificationPermission() {
    if (!('Notification' in window)) return; // Navegador não suporta
    if (Notification.permission === 'granted') return; // Já permitido
    if (Notification.permission === 'denied') return; // Usuário recusou antes
    
    // Pedir permissão (will show browser dialog)
    Notification.requestPermission().then(permission => {
      // permission é 'granted', 'denied' ou 'default'
    }).catch(() => {
      // Erro ao pedir permissão (ignorar silenciosamente)
    });
  },

  // ── TIMER CLEANUP ────────────────────────
  cleanupTimer() {
    if (this.timerState.interval) {
      clearInterval(this.timerState.interval);
      this.timerState.interval = null;
    }
  },

  // ── UTILITIES ────────────────────────────────
  generateId() {
    return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
  },

  formatDuration(totalSeconds) {
    const h = Math.floor(totalSeconds / 3600);
    const m = Math.floor((totalSeconds % 3600) / 60);
    const s = totalSeconds % 60;
    return `${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`;
  },

  formatDurationShort(totalSeconds) {
    if (totalSeconds < 60) return `${Math.floor(totalSeconds)}s`;
    const h = Math.floor(totalSeconds / 3600);
    const m = Math.floor((totalSeconds % 3600) / 60);
    if (h > 0) return `${h}h ${m}m`;
    return `${m}m`;
  },

  formatDate(isoString) {
    const d = new Date(isoString);
    return d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: '2-digit' });
  },

  formatTime(isoString) {
    const d = new Date(isoString);
    return d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  },

  getSubjectById(id) {
    return this.userData.subjects.find(s => s.id === id) || null;
  },

  getTodayActivities() {
    const today = new Date().toISOString().slice(0, 10);
    return this.userData.activities.filter(a => a.date && a.date.startsWith(today));
  },

  getTotalSecondsForDate(dateStr) {
    return this.userData.activities
      .filter(a => a.date && a.date.startsWith(dateStr))
      .reduce((sum, a) => sum + (a.duration || 0), 0);
  },

  getTotalSecondsForRange(startDate, endDate) {
    return this.userData.activities
      .filter(a => {
        if (!a.date) return false;
        const d = a.date.slice(0, 10);
        return d >= startDate && d <= endDate;
      })
      .reduce((sum, a) => sum + (a.duration || 0), 0);
  },

  getActivitiesForRange(startDate, endDate) {
    return this.userData.activities.filter(a => {
      if (!a.date) return false;
      const d = a.date.slice(0, 10);
      return d >= startDate && d <= endDate;
    });
  },

  getDateString(date) {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  },

  getWeekRange() {
    const today = new Date();
    const day = today.getDay();
    const start = new Date(today);
    start.setDate(today.getDate() - (day === 0 ? 6 : day - 1));
    const end = new Date(start);
    end.setDate(start.getDate() + 6);
    return { start: this.getDateString(start), end: this.getDateString(end) };
  },

  COLORS: ['#7C3AED', '#06B6D4', '#10B981', '#F59E0B', '#EC4899', '#6366F1', '#14B8A6', '#EF4444', '#8B5CF6', '#0EA5E9', '#F97316', '#22D3EE', '#A855F7', '#84CC16']
};
