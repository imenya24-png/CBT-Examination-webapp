// ===== LOCALSTORAGE ABSTRACTION =====
const DB = {
  KEYS: {
    CONFIG:        'securecbt_config',
    STUDENTS:      'securecbt_students',
    QUESTIONS:     'securecbt_questions',
    RESULTS:       'securecbt_results',
    VIOLATIONS:    'securecbt_violations',
    SESSIONS:      'securecbt_sessions',
    ADMIN_AUTH:    'securecbt_admin_auth',
    EXAM_STATE:    'securecbt_exam_state',
    // Attendance
    ATT_SESSIONS:  'securecbt_att_sessions',
    ATT_RECORDS:   'securecbt_att_records',
    ATT_EDIT_REQS: 'securecbt_att_edit_requests',
    ADMIN_LOGS:    'securecbt_admin_logs',
  },

  get(key)        { try { return JSON.parse(localStorage.getItem(key)); } catch { return null; } },
  set(key, value) { localStorage.setItem(key, JSON.stringify(value)); },
  remove(key)     { localStorage.removeItem(key); },

  // ── Config ──
  getConfig()  { return this.get(this.KEYS.CONFIG) || {}; },
  setConfig(v) { this.set(this.KEYS.CONFIG, v); },

  // ── Students ──
  getStudents()       { return this.get(this.KEYS.STUDENTS) || []; },
  setStudents(v)      { this.set(this.KEYS.STUDENTS, v); },
  addStudent(s)       { const arr = this.getStudents(); arr.push(s); this.setStudents(arr); },
  deleteStudent(id)   { this.setStudents(this.getStudents().filter(s => s.id !== id)); },
  findStudentBySN(sn) {
    return this.getStudents().find(s => (s.classSN || '').toUpperCase() === sn.toUpperCase()) || null;
  },

  // ── Questions ──
  getQuestions()     { return this.get(this.KEYS.QUESTIONS) || []; },
  setQuestions(v)    { this.set(this.KEYS.QUESTIONS, v); },
  deleteQuestion(id) { this.setQuestions(this.getQuestions().filter(q => q.id !== id)); },

  // ── Exam Results ──
  getResults()  { return this.get(this.KEYS.RESULTS) || []; },
  setResults(v) { this.set(this.KEYS.RESULTS, v); },
  addResult(r)  { const arr = this.getResults(); arr.push(r); this.setResults(arr); },

  // ── Proctoring Violations ──
  getViolations()  { return this.get(this.KEYS.VIOLATIONS) || []; },
  setViolations(v) { this.set(this.KEYS.VIOLATIONS, v); },
  addViolation(v)  { const arr = this.getViolations(); arr.push(v); this.setViolations(arr); },

  // ── Exam Live Sessions ──
  getSessions()    { return this.get(this.KEYS.SESSIONS) || []; },
  setSessions(v)   { this.set(this.KEYS.SESSIONS, v); },
  upsertSession(s) {
    const arr = this.getSessions();
    const idx = arr.findIndex(x => x.email === s.email);
    if (idx >= 0) arr[idx] = { ...arr[idx], ...s };
    else arr.push(s);
    this.setSessions(arr);
  },

  // ── Admin Auth ──
  isAdminLoggedIn() { return this.get(this.KEYS.ADMIN_AUTH) === true; },
  setAdminAuth(v)   { this.set(this.KEYS.ADMIN_AUTH, v); },

  // ── Exam State (in-progress) ──
  getExamState()   { return this.get(this.KEYS.EXAM_STATE); },
  setExamState(v)  { this.set(this.KEYS.EXAM_STATE, v); },
  clearExamState() { this.remove(this.KEYS.EXAM_STATE); },

  // ── Attendance Sessions ──
  getAttSessions()  { return this.get(this.KEYS.ATT_SESSIONS) || []; },
  setAttSessions(v) { this.set(this.KEYS.ATT_SESSIONS, v); },
  addAttSession(s)  { const arr = this.getAttSessions(); arr.push(s); this.setAttSessions(arr); },
  updateAttSession(id, patch) {
    const arr = this.getAttSessions();
    const idx = arr.findIndex(s => s.id === id);
    if (idx >= 0) arr[idx] = { ...arr[idx], ...patch };
    this.setAttSessions(arr);
  },
  deleteAttSession(id) { this.setAttSessions(this.getAttSessions().filter(s => s.id !== id)); },
  getOpenAttSession()  { return this.getAttSessions().find(s => s.status === 'open') || null; },

  // ── Attendance Records ──
  getAttRecords()   { return this.get(this.KEYS.ATT_RECORDS) || []; },
  setAttRecords(v)  { this.set(this.KEYS.ATT_RECORDS, v); },
  addAttRecord(r)   { const arr = this.getAttRecords(); arr.push(r); this.setAttRecords(arr); },
  addAttRecords(recs) { const arr = this.getAttRecords(); this.setAttRecords([...arr, ...recs]); },
  getRecordsBySession(sessionId) { return this.getAttRecords().filter(r => r.sessionId === sessionId); },
  getRecordsByStudent(email)     { return this.getAttRecords().filter(r => r.email === email); },
  updateAttRecord(id, patch) {
    const arr = this.getAttRecords();
    const idx = arr.findIndex(r => r.id === id);
    if (idx >= 0) arr[idx] = { ...arr[idx], ...patch };
    this.setAttRecords(arr);
  },
  deleteRecordsBySession(sessionId) {
    this.setAttRecords(this.getAttRecords().filter(r => r.sessionId !== sessionId));
  },

  // ── Attendance Edit Requests ──
  getAttEditReqs()   { return this.get(this.KEYS.ATT_EDIT_REQS) || []; },
  setAttEditReqs(v)  { this.set(this.KEYS.ATT_EDIT_REQS, v); },
  addAttEditReq(r)   { const arr = this.getAttEditReqs(); arr.push(r); this.setAttEditReqs(arr); },
  updateAttEditReq(id, patch) {
    const arr = this.getAttEditReqs();
    const idx = arr.findIndex(r => r.id === id);
    if (idx >= 0) arr[idx] = { ...arr[idx], ...patch };
    this.setAttEditReqs(arr);
  },
  getPendingEditReqs() { return this.getAttEditReqs().filter(r => r.status === 'pending'); },

  // ── Wipe / Reset ──
  wipeStudentData() {
    this.setStudents([]);
    this.setResults([]);
    this.setViolations([]);
    this.setSessions([]);
    this.setAttSessions([]);
    this.setAttRecords([]);
    this.setAttEditReqs([]);
  },
  resetAll() { Object.values(this.KEYS).forEach(k => localStorage.removeItem(k)); },

  // ── Admin Activity Logs ──
  getAdminLogs()  { return this.get(this.KEYS.ADMIN_LOGS) || []; },
  setAdminLogs(v) { this.set(this.KEYS.ADMIN_LOGS, v); },
  addAdminLog(action, category) {
    const logs = this.getAdminLogs();
    logs.unshift({
      id: generateId(),
      action,
      category,
      timestamp: new Date().toISOString()
    });
    if (logs.length > 500) {
      logs.length = 500;
    }
    this.setAdminLogs(logs);
  },
  clearAdminLogs() { this.setAdminLogs([]); }
};

// ===== PASSWORD ACTION AUTHORIZATION UTILITY =====
function authorizeAction(callback) {
  let modal = document.getElementById('actionAuthModal');
  if (modal) modal.remove();

  modal = document.createElement('div');
  modal.id = 'actionAuthModal';
  modal.className = 'modal-overlay active';
  modal.style.zIndex = '9999';
  modal.style.position = 'fixed';
  modal.style.inset = '0';
  modal.style.background = 'rgba(0,0,0,0.5)';
  modal.style.display = 'flex';
  modal.style.alignItems = 'center';
  modal.style.justifyContent = 'center';
  modal.innerHTML = `
    <div class="modal" style="max-width:380px;background:#fff;border-radius:18px;padding:24px;box-shadow:0 20px 40px rgba(0,0,0,0.15);border:1.5px solid var(--admin-border);position:relative;">
      <div class="modal-header" style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px;">
        <div class="modal-title" style="font-size:16px;font-weight:800;color:var(--admin-text);">🔐 Action Authorization</div>
        <button class="modal-close" id="authCloseBtn" style="background:none;border:none;font-size:20px;cursor:pointer;color:var(--admin-text-muted);">×</button>
      </div>
      <div class="form-group" style="margin-top:10px;">
        <p style="font-size:13px;color:var(--admin-text-muted);margin-bottom:14px;line-height:1.5;">
          Please enter the <strong>Action Protection Password</strong> to authorize this deletion or wipe.
        </p>
        <input class="form-input" type="password" id="authProtectionPassword" placeholder="Enter protection password" style="text-align:center;font-size:16px;letter-spacing:4px;padding:10px;border-radius:8px;border:1.5px solid var(--admin-border);width:100%;box-sizing:border-box;"/>
        <div id="authErrorMsg" style="display:none;color:var(--red);font-size:12px;margin-top:8px;text-align:center;font-weight:700;">Incorrect password.</div>
      </div>
      <button class="btn btn-primary w-full" id="authConfirmBtn" style="margin-top:18px;width:100%;padding:12px;font-weight:700;display:block;">Confirm &amp; Proceed</button>
    </div>
  `;
  document.body.appendChild(modal);
  const passwordInput = document.getElementById('authProtectionPassword');
  passwordInput.focus();

  const close = () => modal.remove();
  document.getElementById('authCloseBtn').onclick = close;
  modal.onclick = (e) => { if (e.target === modal) close(); };

  document.getElementById('authConfirmBtn').onclick = () => {
    const input = passwordInput.value;
    const cfg = DB.getConfig();
    const correctPassword = cfg.protectionPassword || 'secure123';
    if (input === correctPassword) {
      close();
      callback();
    } else {
      document.getElementById('authErrorMsg').style.display = 'block';
      showToast('Authorization failed. Incorrect password.', 'error');
    }
  };

  passwordInput.onkeydown = (e) => {
    if (e.key === 'Enter') {
      document.getElementById('authConfirmBtn').click();
    }
  };
}

// ===== TOAST UTILITY =====
function showToast(message, type = 'info', duration = 3000) {
  let container = document.getElementById('toast-container');
  if (!container) {
    container = document.createElement('div');
    container.id = 'toast-container';
    document.body.appendChild(container);
  }
  const icons = { success: '✅', error: '❌', info: 'ℹ️' };
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.innerHTML = `<span>${icons[type] || 'ℹ️'}</span><span>${message}</span>`;
  container.appendChild(toast);
  setTimeout(() => {
    toast.style.opacity = '0'; toast.style.transform = 'translateX(100%)';
    toast.style.transition = '0.3s ease';
    setTimeout(() => toast.remove(), 300);
  }, duration);
}

// ===== CSV EXPORT UTILITY =====
function exportCSV(filename, headers, rows) {
  const lines = [headers.join(','), ...rows.map(r => r.map(c => `"${String(c ?? '').replace(/"/g, '""')}"`).join(','))];
  const blob = new Blob([lines.join('\n')], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a'); a.href = url; a.download = filename; a.click();
  URL.revokeObjectURL(url);
}

// ===== ADMIN GUARD =====
function requireAdmin() {
  if (!DB.isAdminLoggedIn()) { window.location.href = 'admin-login.html'; }
}

// ===== GRADE UTIL =====
function getGrade(pct) {
  if (pct >= 70) return 'A';
  if (pct >= 60) return 'B';
  if (pct >= 50) return 'C';
  if (pct >= 45) return 'D';
  return 'F';
}

function formatTime(seconds) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`;
}

function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}

function triggerBackupDownload() {
  const data = {
    config:     DB.getConfig(),
    students:   DB.getStudents(),
    questions:  DB.getQuestions(),
    results:    DB.getResults(),
    violations: DB.getViolations(),
    sessions:   DB.getSessions(),
    attSessions:DB.getAttSessions(),
    attRecords: DB.getAttRecords(),
    logs:       DB.getAdminLogs(),
    exportedAt: new Date().toISOString()
  };
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  a.href = url; a.download = `securecbt_autobackup_${Date.now()}.json`; a.click();
  URL.revokeObjectURL(url);
}
