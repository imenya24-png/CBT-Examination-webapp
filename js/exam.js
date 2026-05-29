// ===== EXAM ENGINE =====
let state   = null;
let cfg     = null;
let timer   = null;

document.addEventListener('DOMContentLoaded', async () => {
  state = DB.getExamState();
  cfg   = await DB.getConfig();

  if (!state || !state.questions || !state.questions.length) {
    alert('No active exam session found. Redirecting to start.');
    window.location.href = 'student-login.html';
    return;
  }

  // Update session heartbeat. Do not block the exam if live monitoring fails.
  try {
    await DB.upsertSession({ email: state.email, status: 'active', lastSeen: new Date().toISOString() });
  } catch (err) {
    console.warn('Session heartbeat failed:', err);
  }

  setupProctoring();
  renderQuestion();
  renderGrid();
  startTimer();

  document.getElementById('examTitleEl').textContent = cfg.examTitle || 'Examination';
  document.getElementById('studentNameEl').textContent = state.studentName || state.email;
});

// ===== TIMER =====
function startTimer() {
  updateTimerDisplay();
  timer = setInterval(() => {
    state.timeLeft--;
    DB.setExamState(state);
    updateTimerDisplay();
    if (state.timeLeft <= 0) {
      clearInterval(timer);
      autoSubmit('Time expired');
    }
  }, 1000);

  // Heartbeat — update lastSeen every 30 seconds so admin sees student is live
  setInterval(async () => {
    if (state && state.email) {
      try {
        await DB.upsertSession({
          email: state.email,
          name: state.studentName,
          class: state.class,
          status: 'active',
          lastSeen: new Date().toISOString()
        });
      } catch (err) {
        console.warn('Heartbeat update failed:', err);
      }
    }
  }, 30000);
}

function updateTimerDisplay() {
  const el = document.getElementById('timerEl');
  el.textContent = formatTime(state.timeLeft);
  el.className = 'exam-timer';
  if (state.timeLeft <= 60)        el.classList.add('danger');
  else if (state.timeLeft <= 300)  el.classList.add('warning');
}

// ===== RENDER QUESTION =====
function renderQuestion() {
  const q   = state.questions[state.currentIndex];
  const ans = state.answers[q.id];
  const total = state.questions.length;

  document.getElementById('questionCounter').textContent = `Question ${state.currentIndex + 1} of ${total}`;

  const badge = document.getElementById('questionTypeBadge');
  const typeLabels = { mcq: 'Multiple Choice', truefalse: 'True / False', fill: 'Fill in Blank', short: 'Short Answer', code: 'Code' };
  badge.textContent = typeLabels[q.type] || q.type.toUpperCase();
  badge.className = `question-type-badge ${q.type}`;

  document.getElementById('questionText').textContent = q.text;

  const optEl = document.getElementById('questionOptions');
  if (q.type === 'mcq') {
    optEl.innerHTML = `<div class="mcq-options">${q.options.map((opt, i) => `
      <label class="mcq-option${ans === i ? ' selected' : ''}" onclick="selectMCQ(${i})">
        <input type="radio" name="mcq" ${ans === i ? 'checked' : ''}/>
        <span class="mcq-letter">${'ABCD'[i]}</span>
        <span class="mcq-option-text">${opt}</span>
      </label>`).join('')}</div>`;
  } else if (q.type === 'truefalse') {
    optEl.innerHTML = `<div class="tf-options">
      <button class="tf-btn true-btn${ans === true ? ' selected' : ''}" onclick="selectTF(true)">✅ True</button>
      <button class="tf-btn false-btn${ans === false ? ' selected' : ''}" onclick="selectTF(false)">❌ False</button>
    </div>`;
  } else if (q.type === 'fill') {
    optEl.innerHTML = `<input class="text-answer" type="text" id="textAns" placeholder="Type your answer here..." value="${ans || ''}" oninput="saveText(this.value)" style="min-height:unset;"/>`;
  } else if (q.type === 'short') {
    optEl.innerHTML = `<textarea class="text-answer" id="textAns" placeholder="Write your answer here..." oninput="saveText(this.value)" rows="5">${ans || ''}</textarea>`;
  } else if (q.type === 'code') {
    optEl.innerHTML = `<textarea class="code-answer" id="textAns" placeholder="Write your code here..." oninput="saveText(this.value)" rows="8" spellcheck="false">${ans || ''}</textarea>`;
  }

  // Progress
  const answered = Object.keys(state.answers).length;
  document.getElementById('progressFill').style.width = `${(answered / total) * 100}%`;

  // Nav buttons
  const prevBtn = document.getElementById('prevBtn');
  const nextBtn = document.getElementById('nextBtn');
  prevBtn.disabled = state.currentIndex === 0 || !cfg.allowBackNav;
  if (prevBtn.disabled) {
    prevBtn.style.opacity = '0.3';
    prevBtn.style.cursor = 'default';
  } else {
    prevBtn.style.opacity = '1';
    prevBtn.style.cursor = 'pointer';
  }
  nextBtn.textContent = state.currentIndex === total - 1 ? '✅ Finish' : 'Next →';
  if (state.currentIndex === total - 1) {
    nextBtn.onclick = showSubmitConfirm;
  } else {
    nextBtn.onclick = () => navigate(1);
  }
}

// ===== ANSWER SELECTION =====
function selectMCQ(i) {
  const q = state.questions[state.currentIndex];
  state.answers[q.id] = i;
  DB.setExamState(state);
  renderQuestion();
  renderGrid();
}

function selectTF(val) {
  const q = state.questions[state.currentIndex];
  state.answers[q.id] = val;
  DB.setExamState(state);
  renderQuestion();
  renderGrid();
}

function saveText(val) {
  const q = state.questions[state.currentIndex];
  state.answers[q.id] = val;
  DB.setExamState(state);
  renderGrid();
}

// ===== NAVIGATION =====
function navigate(dir) {
  const total = state.questions.length;
  const next  = state.currentIndex + dir;
  if (next < 0 || next >= total) return;
  state.currentIndex = next;
  DB.setExamState(state);
  renderQuestion();
  renderGrid();
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

// ===== QUESTION GRID =====
function renderGrid() {
  const grid = document.getElementById('questionGrid');
  grid.innerHTML = state.questions.map((q, i) => {
    let cls = 'q-bubble';
    if (i === state.currentIndex) cls += ' current';
    if (state.answers[q.id] !== undefined) cls += ' answered';
    return `<div class="${cls}" onclick="jumpTo(${i})">${i + 1}</div>`;
  }).join('');
}

function jumpTo(i) {
  state.currentIndex = i;
  DB.setExamState(state);
  renderQuestion();
  renderGrid();
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

// ===== SUBMIT =====
function showSubmitConfirm() {
  const total    = state.questions.length;
  const answered = Object.keys(state.answers).length;
  const unanswered = total - answered;
  document.getElementById('submitSummary').textContent =
    `You answered ${answered} of ${total} questions. ${unanswered > 0 ? `${unanswered} question(s) left unanswered.` : 'All questions answered!'}`;
  const ol = document.getElementById('submitOverlay');
  ol.style.display = 'flex';
}

function hideSubmitConfirm() {
  document.getElementById('submitOverlay').style.display = 'none';
}

async function confirmSubmit() {
  hideSubmitConfirm();
  const nextBtn = document.getElementById('nextBtn');
  if (nextBtn) {
    nextBtn.disabled = true;
    nextBtn.textContent = 'Submitting...';
  }
  await submitExam('voluntary');
}

async function autoSubmit(reason) {
  await submitExam(reason);
}

async function submitExam(reason) {
  clearInterval(timer);
  disableProctoring();

  const questions = state.questions;
  const answers   = state.answers;
  const cfg       = await DB.getConfig();

  // Grade
  let score = 0;
  const autoGradable = ['mcq', 'truefalse', 'fill'];
  questions.forEach(q => {
    const qType = String(q.type).trim().toLowerCase();
    const ans = answers[q.id];
    if (ans === undefined || ans === '' || ans === null) return;
    if (qType === 'mcq') {
      if (parseInt(ans) === parseInt(q.answer)) score++;
    } else if (qType === 'truefalse') {
      if (String(ans).trim().toLowerCase() === String(q.answer).trim().toLowerCase()) score++;
    } else if (qType === 'fill') {
      if (String(ans).trim().toLowerCase() === String(q.answer).trim().toLowerCase()) score++;
    } else {
      // short/code — counts as attempted, admin grades manually
      score += 0.5;
    }
  });

  const gradableCount = questions.filter(q => autoGradable.includes(String(q.type).trim().toLowerCase())).length;
  const subjectiveCount = questions.filter(q => !autoGradable.includes(String(q.type).trim().toLowerCase())).length;
  const finalScore = Math.round(score);
  const percentage = Math.round((score / questions.length) * 100);
  const timeTaken  = (cfg.duration * 60) - state.timeLeft;

  const result = {
    id: generateId(),
    studentName: state.studentName,
    email: state.email,
    class: state.class,
    score: finalScore,
    total: questions.length,
    percentage,
    violations: state.violations,
    timeTaken,
    submittedAt: new Date().toISOString(),
    answers,
    questions: questions.map(q => ({ id: q.id, text: q.text, type: q.type, answer: q.answer, options: q.options })),
    reason,
  };

  try {
    await DB.addResult(result);
    result.saved = true;
  } catch (err) {
    console.error("Error submitting results to server:", err);
    result.saved = false;
    result.saveError = err?.message || 'Could not save result to the server.';
  }

  try {
    await DB.upsertSession({ email: state.email, status: 'completed', completedAt: new Date().toISOString() });
  } catch (err) {
    console.warn('Could not mark session as completed:', err);
  }

  if (result.saved) {
    DB.clearExamState();
  }

  // Store a local result snapshot so the result page does not need anonymous
  // SELECT access to protected result rows.
  sessionStorage.setItem('lastResult', JSON.stringify(result));
  sessionStorage.setItem('lastResultId', result.id);
  window.location.href = 'result.html';
}

// ===== PROCTORING =====
let proctoringEnabled = true;

function setupProctoring() {
  // Tab switch / visibility change
  document.addEventListener('visibilitychange', onVisibilityChange);
  window.addEventListener('blur', onWindowBlur);
  // Right click
  document.addEventListener('contextmenu', e => { e.preventDefault(); logViolation('right_click', 'Right-click attempted'); });
  // Copy/paste
  document.addEventListener('copy',  e => { e.preventDefault(); logViolation('copy_paste', 'Copy attempted'); });
  document.addEventListener('paste', e => { e.preventDefault(); logViolation('copy_paste', 'Paste attempted'); });
  // Key shortcuts (Ctrl+C, Ctrl+V, F12, etc.)
  document.addEventListener('keydown', e => {
    if ((e.ctrlKey || e.metaKey) && ['c','v','u','a','s'].includes(e.key.toLowerCase())) {
      e.preventDefault();
      logViolation('copy_paste', `Keyboard shortcut blocked: Ctrl+${e.key.toUpperCase()}`);
    }
    if (e.key === 'F12' || e.key === 'F5') e.preventDefault();
  });
}

function disableProctoring() {
  proctoringEnabled = false;
}

function onVisibilityChange() {
  if (!proctoringEnabled) return;
  if (document.hidden) {
    logViolation('tab_switch', 'Tab was switched or window was minimized');
  }
}

function onWindowBlur() {
  if (!proctoringEnabled) return;
  logViolation('visibility', 'Window lost focus');
}

async function logViolation(type, detail) {
  if (!proctoringEnabled || !state) return;
  state.violations++;
  DB.setExamState(state);

  const v = {
    id: generateId(),
    email: state.email,
    studentName: state.studentName,
    type,
    detail,
    timestamp: new Date().toISOString(),
  };
  
  try {
    await DB.addViolation(v);
  } catch (err) {
    console.error("Error logging violation to server:", err);
  }

  const maxV = cfg.maxViolations || 5;
  showViolationOverlay(type, detail, state.violations, maxV);

  if (state.violations >= maxV) {
    dismissViolation();
    await autoSubmit(`Auto-submitted after ${maxV} violations`);
  }
}

function showViolationOverlay(type, detail, count, max) {
  const ol = document.getElementById('violationOverlay');
  document.getElementById('violationTitle').textContent = '⚠️ Violation Detected';
  document.getElementById('violationMsg').textContent = detail;
  document.getElementById('violationCount').textContent = `Violation ${count} of ${max}. ${max - count} remaining before auto-submit.`;
  ol.style.display = 'flex';
}

function dismissViolation() {
  document.getElementById('violationOverlay').style.display = 'none';
}
