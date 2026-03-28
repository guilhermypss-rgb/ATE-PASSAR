# ✅ Timer Testing Checklist — Phase 4

## Setup
1. Abra http://localhost:8080/app/login.html
2. Crie uma conta (ex: user@test.com / 123456)
3. Crie pelo menos 2 matérias com cores diferentes (ex: "Matemática", "História")
4. Navegue para **Cronômetro**

---

## 🧪 Test Suite: Stopwatch (Cronômetro)

### Test 1.1: Basic Start/Pause/Resume (Cronômetro)
- [ ] Cronômetro display mostra "00:00:00" inicially
- [ ] Selecione uma matéria e clique "▶️ Iniciar"
- [ ] Floating timer bar aparece com matéria selecionada
- [ ] Timer inicia e incrementa a cada segundo
- [ ] Clique "⏸ Pausar" — timer para
- [ ] Floating bar pausa button muda para "▶️"
- [ ] Clique "▶️ Continuar" — timer retoma
- [ ] Floating bar pausa button muda para "⏸"

### Test 1.2: Navigation with Running Timer
- [ ] Inicie cronômetro
- [ ] Navegue para "Dashboard" (sidebar)
- [ ] Volte para "Cronômetro"
- [ ] ✅ Timer continua contando (não resetou)
- [ ] Navegue para "Matérias"
- [ ] Volte para "Dashboard"
- [ ] ✅ Timer ainda está rodando (visible na floating bar)

### Test 1.3: Save Stopwatch Session
- [ ] Inicie cronômetro, deixe rodar ~5 segundos
- [ ] Clique "💾 Salvar"
- [ ] Modal abre com duração (~5sec) e matéria
- [ ] Adicione anotações (opcional)
- [ ] Clique "Salvar sessão"
- [ ] ✅ Volta para Dashboard
- [ ] ✅ Floating timer desaparece
- [ ] ✅ Timer reset: display "00:00:00", sem matéria selecionada
- [ ] Navegue para "Histórico"
- [ ] ✅ Atividade aparece com ~5 segundos de duração

### Test 1.4: Cancel Save (volta estudando)
- [ ] Inicie cronômetro, deixe rodar ~10 segundos
- [ ] Clique "💾 Salvar"
- [ ] Modal abre
- [ ] Clique "Continuar estudando"
- [ ] ✅ Modal fecha, timer continua rodando

### Test 1.5: Mode Switch (Stopwatch → Pomodoro)
- [ ] Cronômetro está parado
- [ ] Clique "🍅 Pomodoro"
- [ ] Display muda para "25:00" (ou configurado)
- [ ] Informações de Pomodoro aparecem (Fase: Foco, Ciclo 1)
- [ ] ✅ Clique "⏱ Cronômetro" volta para "00:00:00"
- [ ] ⚠️ Validação: Não permite trocar modo enquanto timer está rodando

---

## 🍅 Test Suite: Pomodoro

### Test 2.1: Start Pomodoro
- [ ] Navegue para "Pomodoro"
- [ ] Display mostra tempo configurado (ex: 25:00 para foco, 5:00 para pausa)
- [ ] Selecione matéria e clique "▶️ Iniciar"
- [ ] ✅ Browser pede permissão para notificações (1ª vez)
  - [ ] Permita notificações (Approved)
  - [ ] OU Recuse (bloqueia notificações para esta sessão)
- [ ] Timer inicia, decrementa a cada segundo

### Test 2.2: Pomodoro Phase Auto-Advance (Work → Break)
- [ ] Inicie Pomodoro com work phase
- [ ] Deixe contar até 0
- [ ] ⚠️ OBS: Para acelerar testes, você pode abrir DevTools (F12) e fazer:
  ```javascript
  App.timerState.seconds = 1; // Set to 1 second before end
  ```
- [ ] Quando chegar a 0:
  - [ ] ✅ Fase muda automaticamente para "☕ Pausa"
  - [ ] ✅ Display muda para 5:00 (pausa)
  - [ ] ✅ Notificação dispara: "☕ Hora da pausa! Descanse um pouco." (se permitida)
  - [ ] ✅ Timer continua rodando sem interrupção

### Test 2.3: Pomodoro Phase Auto-Advance (Break → Work)
- [ ] Deixe phase de pausa contar até 0
- [ ] ⚠️ OBS: Abra DevTools:
  ```javascript
  App.timerState.seconds = 1; // Near end
  ```
- [ ] Quando chegar a 0:
  - [ ] ✅ Fase muda para "📖 Foco"
  - [ ] ✅ Ciclo incrementa (ex: Ciclo 1 → Ciclo 2)
  - [ ] ✅ Display muda para 25:00
  - [ ] ✅ Notificação dispara: "📖 Pausa acabou! De volta ao foco."
  - [ ] ✅ Timer continua rodando

### Test 2.4: Save Pomodoro Session (Multiple Cycles)
- [ ] Inicie Pomodoro
- [ ] Deixe completar ~2 ciclos (work → break → work)
- [ ] Clique "💾 Salvar" durante work phase
- [ ] Modal mostra duração = (2 ciclos work × 25min) + (tempo decorrido no 3º ciclo)
  - [ ] Ex: Se 50 min de work + 10 min do 3º ciclo = 60 minutos
- [ ] Clique "Salvar sessão"
- [ ] ✅ Atividade registrada em Histórico com duração correta
- [ ] ✅ Salvo com `mode: 'pomodoro'` e `pomodoroCount: 2`

### Test 2.5: Pause/Resume in Pomodoro
- [ ] Inicie Pomodoro
- [ ] Deixe rodar ~5 segundos
- [ ] Clique "⏸ Pausar"
- [ ] ✅ Floating bar button muda para "▶️"
- [ ] ✅ Timer para
- [ ] Clique "▶️ Continuar"
- [ ] ✅ Timer retoma corretamente
- [ ] ✅ Floating bar button muda para "⏸"

---

## 🔘 Test Suite: Floating Timer Bar

### Test 3.1: Floating Bar Display
- [ ] Inicie timer (stopwatch ou pomodoro)
- [ ] Floating bar aparece at bottom center (desktop) ou bottom (mobile)
- [ ] Mostra matéria selecionada
- [ ] Mostra tempo incrementando/decrementando
- [ ] Tem 3 botões: ⏸/▶️ (pause/resume), 💾 (save), 🔼 (expand)

### Test 3.2: Floating Bar Controls
- [ ] Clique ⏸/▶️ button:
  - [ ] ✅ Toggle pause state
  - [ ] ✅ Floating bar button muda de ícone
  - [ ] ✅ Main timer view (if visible) também reflete mudança
- [ ] Clique 💾:
  - [ ] ✅ Abre save modal
- [ ] Clique 🔼:
  - [ ] ✅ Navega para timer view
  - [ ] ✅ Floating bar continua visível

### Test 3.3: Floating Bar Visibility
- [ ] Inicie timer
- [ ] ✅ Floating bar visível
- [ ] Navegue para outra view
- [ ] ✅ Floating bar ainda visível
- [ ] Salve sessão
- [ ] ✅ Floating bar desaparece

### Test 3.4: Floating Bar Mobile Responsiveness
- [ ] Abra DevTools (F12), ative Device Toolbar (Ctrl+Shift+M)
- [ ] Inicie timer
- [ ] ✅ Floating bar responsivo (não sai da tela)
- [ ] ✅ Layout ajustado para celular
- [ ] Botões ainda clicáveis

---

## 🎨 Test Suite: Visual & UX

### Test 4.1: Disabled Selectors While Running
- [ ] Inicie timer
- [ ] ✅ Select "Matéria" aparece desabilitado (disabled)
- [ ] ✅ Select "Conteúdo" aparece desabilitado
- [ ] Pause timer
- [ ] ⚠️ Selectors ficam desabilitados mesmo em pausa (by design)
- [ ] Salve e reset
- [ ] ✅ Selectors voltam habilitados

### Test 4.2: Mode Button States
- [ ] Active mode button tem background gradiente
- [ ] Inactive tem background cinza
- [ ] Ao trocar modo (sem timer rodando):
  - [ ] Active button muda corretamente
  - [ ] Display atualiza

### Test 4.3: Button Feedback
- [ ] Hover sobre botões deve mostrar mudanças de cor/sombra (CSS transitions)
- [ ] Cliques são responsivos

---

## 🔧 Test Suite: Edge Cases

### Test 5.1: No Subject Selected
- [ ] Clique "▶️ Iniciar" SEM selecionar matéria
- [ ] ✅ Alert aparece: "Selecione uma matéria antes de iniciar."
- [ ] Timer não inicia

### Test 5.2: Pause Without Running
- [ ] Cronômetro parado
- [ ] Tente clicar pause button (se houver no DOM) — não deve quebrar
- [ ] ✅ Nenhum erro no console

### Test 5.3: Resume Without Paused
- [ ] Cronômetro parado
- [ ] Tente clicar resume button — não deve quebrar
- [ ] ✅ Nenhum erro no console

### Test 5.4: Session Info Display
- [ ] Inicie timer
- [ ] Abaixo dos controles aparece:
  - [ ] "Estudando: **[Matéria]**"
  - [ ] "Conteúdo (se selecionado): **[Conteúdo]**"
  - [ ] "Início: HH:MM"

### Test 5.5: Navigate & Return to Timer
- [ ] Inicie timer em pausa
- [ ] Navegue para 3+ views
- [ ] Volte para "Cronômetro"
- [ ] ✅ Estado preservado (paused, time, subject)
- [ ] Clique resume
- [ ] ✅ Timer continua de onde parou

---

## 📊 Test Suite: Data Integrity

### Test 6.1: Activity Saved Correctly
- [ ] Inicie cronômetro, deixe rodar 15 segundos
- [ ] Salve com nota "Test Session"
- [ ] Navegue para "Histórico"
- [ ] ✅ Atividade aparece com:
  - [ ] Matéria correta
  - [ ] Duração ~15s
  - [ ] Nota "Test Session"
  - [ ] Data/hora corretos

### Test 6.2: Pomodoro Data Saved
- [ ] Inicie Pomodoro, deixe completar 1.5 ciclos
- [ ] Salve
- [ ] Verificar em DB (localStorage > ap_data_[email])
  - [ ] [ ] duration = (1 × 25 × 60) + (0.5 × 25 × 60) ≈ 1500 + 750 = 2250 segundos
  - [ ] mode = 'pomodoro'
  - [ ] pomodoroCount = 1

### Test 6.3: No Data Loss on Cancel
- [ ] Inicie timer, deixe rodar 20s
- [ ] Salve, então "Continuar estudando"
- [ ] Deixe rodar mais 10s
- [ ] Salve novamente
- [ ] ✅ Ambas as atividades no histórico (não sobrescreveu primeira)

---

## 🐛 Console Check

### Test 7.1: DevTools Console
- [ ] F12 > Console
- [ ] Inicie timer, deixe rodar
- [ ] ✅ NÃO há erros vermelhos
- [ ] ✅ NÃO há warnings críticos sobre:
  - [ ] `Cannot read property of null` (floating timer elements)
  - [ ] `clearInterval called on invalid ID`
  - [ ] `Notification not defined`

### Test 7.2: Storage Check
- [ ] F12 > Application > Local Storage > http://localhost:8080
- [ ] ✅ `ap_data_[email]` contém array de activities com sessão(s) salva(s)
- [ ] ✅ JSON válido (parse sem erros)

---

## 📋 Verification Checklist

| Componente | Status | Notes |
|-----------|--------|-------|
| Stopwatch Start/Pause/Resume | ⬜ | |
| Stopwatch Navigation Persistence | ⬜ | |
| Stopwatch Save & Activity Log | ⬜ | |
| Pomodoro Phase Transition | ⬜ | |
| Pomodoro Notifications | ⬜ | |
| Pomodoro Duration Calculation | ⬜ | |
| Floating Timer Visibility | ⬜ | |
| Floating Timer Controls | ⬜ | |
| Selector Disable While Running | ⬜ | |
| Edge Cases (No Subject Alert) | ⬜ | |
| Console Errors | ⬜ | |
| Data Integrity (localStorage) | ⬜ | |

---

## 🎯 Summary

**All tests passed?** ✅ → Timer Module is production-ready!
**Any failures?** ❌ → Document error + screenshot + console logs for debugging

---

## Quick DevTools Tricks for Testing

```javascript
// Speed up Pomodoro (set to 5 seconds instead of 25 minutes)
App.userData.settings.pomodoroWork = 5;
App.userData.settings.pomodoroBreak = 2;

// Jump time forward (simulate 24 seconds running)
App.timerState.seconds = 24;

// Check current timer state
console.log(App.timerState);

// Check activities saved
console.log(App.userData.activities);

// Request notifications manually
App.requestNotificationPermission();
```

