// ============================================================
// db.js — SecureCBT Async Data Layer (Supabase)
// Replaces the old storage.js localStorage layer.
// All functions are async and return Promises.
// ============================================================

function assertSupabaseOk(result, fallbackMessage = 'Supabase request failed') {
  if (result?.error) {
    console.error(fallbackMessage, result.error);
    throw result.error;
  }
  return result;
}

function isMissingColumnError(error) {
  const msg = String(error?.message || error?.details || '').toLowerCase();
  return error?.code === '42703' ||
         error?.code === 'PGRST204' ||
         msg.includes('could not find') ||
         msg.includes('does not exist');
}

function pick(obj, keys) {
  return keys.reduce((acc, key) => {
    if (obj[key] !== undefined) acc[key] = obj[key];
    return acc;
  }, {});
}

const DB = {

  // ── Config ──────────────────────────────────────────────
  async getConfig() {
    const { data, error } = await supabase
      .from('config').select('data').eq('id', 1).single();
    if (error || !data) return { ...DEFAULT_CONFIG };
    return { ...DEFAULT_CONFIG, ...data.data };
  },

  async setConfig(v) {
    const result = await supabase.from('config')
      .upsert({ id: 1, data: v, updated_at: new Date().toISOString() });
    assertSupabaseOk(result, 'Failed to save config');
  },

  // ── Students ─────────────────────────────────────────────
  async getStudents() {
    const { data, error } = await supabase
      .from('students').select('*').order('createdAt', { ascending: true });
    if (error) console.warn('Failed to fetch students:', error);
    return data || [];
  },

  async setStudents(arr) {
    // Full replace: delete all then insert
    assertSupabaseOk(
      await supabase.from('students').delete().neq('id', '___none___'),
      'Failed to clear students'
    );
    if (arr.length > 0) {
      assertSupabaseOk(await supabase.from('students').insert(arr), 'Failed to insert students');
    }
  },

  async addStudent(s) {
    assertSupabaseOk(await supabase.from('students').insert(s), 'Failed to add student');
  },

  async updateStudent(id, patch) {
    assertSupabaseOk(
      await supabase.from('students').update({ ...patch, updatedAt: new Date().toISOString() }).eq('id', id),
      'Failed to update student'
    );
  },

  async deleteStudent(id) {
    assertSupabaseOk(await supabase.from('students').delete().eq('id', id), 'Failed to delete student');
  },

  async findStudentByEmailAndSN(email, classSN) {
    const { data, error } = await supabase
      .from('students')
      .select('*')
      .ilike('email', email)
      .ilike('classSN', classSN)
      .maybeSingle();
    if (error) console.warn('Student lookup failed:', error);
    return data || null;
  },

  async findStudentBySN(sn) {
    const { data } = await supabase
      .from('students')
      .select('*')
      .ilike('classSN', sn)
      .maybeSingle();
    return data || null;
  },

  // ── Questions ─────────────────────────────────────────────
  async getQuestions() {
    const { data, error } = await supabase.from('questions').select('*');
    if (error) console.warn('Failed to fetch questions:', error);
    return data || [];
  },

  async setQuestions(arr) {
    assertSupabaseOk(
      await supabase.from('questions').delete().neq('id', '___none___'),
      'Failed to clear questions'
    );
    if (arr.length > 0) {
      assertSupabaseOk(await supabase.from('questions').insert(arr), 'Failed to insert questions');
    }
  },

  async addQuestion(q) {
    assertSupabaseOk(await supabase.from('questions').insert(q), 'Failed to add question');
  },

  async deleteQuestion(id) {
    assertSupabaseOk(await supabase.from('questions').delete().eq('id', id), 'Failed to delete question');
  },

  // ── Exam Results ─────────────────────────────────────────
  async getResults() {
    const { data, error } = await supabase
      .from('results').select('*').order('submittedAt', { ascending: false });
    if (error) console.warn('Failed to fetch results:', error);
    return data || [];
  },

  async addResult(r) {
    assertSupabaseOk(await supabase.from('results').insert(r), 'Failed to submit result');
  },

  async deleteResult(id) {
    assertSupabaseOk(await supabase.from('results').delete().eq('id', id), 'Failed to delete result');
  },

  async setResults(arr) {
    assertSupabaseOk(
      await supabase.from('results').delete().neq('id', '___none___'),
      'Failed to clear results'
    );
    if (arr.length > 0) {
      assertSupabaseOk(await supabase.from('results').insert(arr), 'Failed to insert results');
    }
  },

  async hasSubmittedExam(email) {
    const { data, error } = await supabase
      .rpc('has_submitted_exam', { student_email: email });
    if (error) {
      console.warn('Duplicate-submission RPC unavailable. Falling back to no duplicate match.', error);
      return false;
    }
    return !!data;
  },

  // ── Violations ────────────────────────────────────────────
  async getViolations() {
    const { data } = await supabase
      .from('violations').select('*').order('timestamp', { ascending: false });
    return data || [];
  },

  async addViolation(v) {
    assertSupabaseOk(await supabase.from('violations').insert(v), 'Failed to add violation');
  },

  async setViolations(arr) {
    assertSupabaseOk(
      await supabase.from('violations').delete().neq('id', '___none___'),
      'Failed to clear violations'
    );
    if (arr.length > 0) {
      assertSupabaseOk(await supabase.from('violations').insert(arr), 'Failed to insert violations');
    }
  },

  // ── Exam Live Sessions ────────────────────────────────────
  async getSessions() {
    const { data } = await supabase
      .from('exam_sessions')
      .select('*')
      .order('startedAt', { ascending: false });
    return data || [];
  },

  async upsertSession(s) {
    const payload = { ...s, lastSeen: new Date().toISOString() };
    let result = await supabase.from('exam_sessions')
      .upsert(payload, { onConflict: 'email' });

    if (result.error && isMissingColumnError(result.error)) {
      const compatiblePayload = pick(payload, ['email', 'status', 'lastSeen', 'completedAt']);
      result = await supabase.from('exam_sessions')
        .upsert(compatiblePayload, { onConflict: 'email' });
    }

    assertSupabaseOk(result, 'Failed to upsert exam session');
  },

  async setSessions(arr) {
    assertSupabaseOk(
      await supabase.from('exam_sessions').delete().neq('email', '___none___'),
      'Failed to clear exam sessions'
    );
    if (arr.length > 0) {
      assertSupabaseOk(await supabase.from('exam_sessions').insert(arr), 'Failed to insert exam sessions');
    }
  },

  // ── Admin Auth (via Supabase Auth) ────────────────────────
  async isAdminLoggedIn() {
    const { data: { session } } = await supabase.auth.getSession();
    return !!session;
  },

  async signIn(email, password) {
    return await supabase.auth.signInWithPassword({ email, password });
  },

  async signOut() {
    await supabase.auth.signOut();
  },

  async getSession() {
    const { data: { session } } = await supabase.auth.getSession();
    return session;
  },

  // ── Exam State (kept in sessionStorage for speed during exam) ──
  getExamState()   { try { return JSON.parse(sessionStorage.getItem('cbt_exam_state')); } catch { return null; } },
  setExamState(v)  { sessionStorage.setItem('cbt_exam_state', JSON.stringify(v)); },
  clearExamState() { sessionStorage.removeItem('cbt_exam_state'); },

  // ── Attendance Sessions ───────────────────────────────────
  async getAttSessions() {
    const { data } = await supabase
      .from('att_sessions').select('*').order('createdAt', { ascending: false });
    return data || [];
  },

  async addAttSession(s) {
    let result = await supabase.from('att_sessions').insert(s);
    if (result.error) {
      const fallbackPayload = pick(s, ['id','class','date','topic','notes','status','round1Serials','round2Serials','createdBy','createdAt']);
      if (result.error && isMissingColumnError(result.error)) {
        result = await supabase.from('att_sessions').insert(fallbackPayload);
      }
    }
    assertSupabaseOk(result, 'Failed to add attendance session');
  },

  async updateAttSession(id, patch) {
    assertSupabaseOk(
      await supabase.from('att_sessions').update(patch).eq('id', id),
      'Failed to update attendance session'
    );
  },

  async deleteAttSession(id) {
    assertSupabaseOk(await supabase.from('att_sessions').delete().eq('id', id), 'Failed to delete attendance session');
  },

  async getOpenAttSession() {
    const sessions = await this.getOpenAttSessions();
    return sessions[0] || null;
  },

  async getOpenAttSessions() {
    const { data } = await supabase
      .from('att_sessions')
      .select('*')
      .eq('status', 'open')
      .order('createdAt', { ascending: false });
    return data || [];
  },

  async setAttSessions(arr) {
    assertSupabaseOk(
      await supabase.from('att_sessions').delete().neq('id', '___none___'),
      'Failed to clear attendance sessions'
    );
    if (arr.length > 0) {
      assertSupabaseOk(await supabase.from('att_sessions').insert(arr), 'Failed to insert attendance sessions');
    }
  },

  // ── Attendance Records ────────────────────────────────────
  async getAttRecords() {
    const { data } = await supabase
      .from('att_records').select('*').order('timestamp', { ascending: true });
    return data || [];
  },

  async addAttRecord(r) {
    assertSupabaseOk(await supabase.from('att_records').insert(r), 'Failed to add attendance record');
  },

  async addAttRecords(recs) {
    if (recs.length > 0) {
      assertSupabaseOk(await supabase.from('att_records').insert(recs), 'Failed to add attendance records');
    }
  },

  async getRecordsBySession(sessionId) {
    const { data } = await supabase
      .from('att_records').select('*').eq('sessionId', sessionId);
    return data || [];
  },

  async getRecordsByStudent(email) {
    const { data } = await supabase
      .from('att_records').select('*').eq('email', email);
    return data || [];
  },

  async updateAttRecord(id, patch) {
    assertSupabaseOk(
      await supabase.from('att_records').update(patch).eq('id', id),
      'Failed to update attendance record'
    );
  },

  async deleteRecordsBySession(sessionId) {
    assertSupabaseOk(
      await supabase.from('att_records').delete().eq('sessionId', sessionId),
      'Failed to delete attendance records'
    );
  },

  async setAttRecords(arr) {
    assertSupabaseOk(
      await supabase.from('att_records').delete().neq('id', '___none___'),
      'Failed to clear attendance records'
    );
    if (arr.length > 0) {
      assertSupabaseOk(await supabase.from('att_records').insert(arr), 'Failed to insert attendance records');
    }
  },

  // ── Attendance Edit Requests ──────────────────────────────
  async getAttEditReqs() {
    const { data } = await supabase.from('att_edit_requests').select('*');
    return data || [];
  },

  async addAttEditReq(r) {
    assertSupabaseOk(await supabase.from('att_edit_requests').insert(r), 'Failed to add attendance edit request');
  },

  async updateAttEditReq(id, patch) {
    let result = await supabase.from('att_edit_requests').update(patch).eq('id', id);
    if (result.error && isMissingColumnError(result.error) && patch.resolvedAt !== undefined) {
      const { resolvedAt, ...compatiblePatch } = patch;
      result = await supabase.from('att_edit_requests').update(compatiblePatch).eq('id', id);
    }
    assertSupabaseOk(result, 'Failed to update attendance edit request');
  },

  async getPendingEditReqs() {
    const { data } = await supabase
      .from('att_edit_requests').select('*').eq('status', 'pending');
    return data || [];
  },

  async setAttEditReqs(arr) {
    assertSupabaseOk(
      await supabase.from('att_edit_requests').delete().neq('id', '___none___'),
      'Failed to clear attendance edit requests'
    );
    if (arr.length > 0) {
      assertSupabaseOk(await supabase.from('att_edit_requests').insert(arr), 'Failed to insert attendance edit requests');
    }
  },

  // ── Admin Activity Logs ───────────────────────────────────
  async getAdminLogs() {
    const { data } = await supabase
      .from('admin_logs').select('*').order('timestamp', { ascending: false }).limit(500);
    return data || [];
  },

  async addAdminLog(action, category) {
    let email = 'system@cbt.com';
    let name = 'System';
    try {
      const profile = await this.getCurrentProfile();
      if (profile) {
        email = profile.email;
        name = profile.name;
      }
    } catch (e) {
      console.warn("Could not retrieve profile for log entry:", e);
    }

    const payload = {
      id: generateId(),
      action,
      category,
      timestamp: new Date().toISOString(),
      admin_email: email,
      admin_name: name
    };

    let result = await supabase.from('admin_logs').insert(payload);
    if (result.error && isMissingColumnError(result.error)) {
      const { admin_email, admin_name, ...compatiblePayload } = payload;
      result = await supabase.from('admin_logs').insert(compatiblePayload);
    }
    assertSupabaseOk(result, 'Failed to add admin log');

    // Prune to keep only 500 most recent logs
    const { data: all } = await supabase
      .from('admin_logs').select('id').order('timestamp', { ascending: false });
    if (all && all.length > 500) {
      const toDelete = all.slice(500).map(r => r.id);
      assertSupabaseOk(await supabase.from('admin_logs').delete().in('id', toDelete), 'Failed to prune admin logs');
    }
  },

  // ── Admin Profiles (RBAC Permissions) ─────────────────────
  async getAdminProfiles() {
    const { data } = await supabase
      .from('admin_profiles').select('*').order('createdAt', { ascending: true });
    return data || [];
  },

  async updateAdminProfile(id, patch) {
    assertSupabaseOk(
      await supabase.from('admin_profiles').update(patch).eq('id', id),
      'Failed to update admin profile'
    );
  },

  async upsertAdminProfile(profile) {
    assertSupabaseOk(
      await supabase.from('admin_profiles').upsert(profile),
      'Failed to upsert admin profile'
    );
  },

  async getCurrentProfile() {
    const session = await this.getSession();
    if (!session) return null;
    const { data } = await supabase
      .from('admin_profiles')
      .select('*')
      .eq('id', session.user.id)
      .maybeSingle();
    
    if (!data) {
      const isFirstAdmin = session.user.email === 'admin@cbt.com';
      const role = isFirstAdmin ? 'superadmin' : 'tutor';
      const defaultProfile = {
        id: session.user.id,
        email: session.user.email,
        name: session.user.email.split('@')[0],
        role: role,
        classAssignment: role === 'superadmin' ? null : 'Class A',
        allowAttendance: true,
        allowStudents: isFirstAdmin,
        allowQuestions: isFirstAdmin,
        allowResults: isFirstAdmin,
        allowSessions: true,
        allowSettings: isFirstAdmin,
        allowViolations: isFirstAdmin,
        allowLogs: isFirstAdmin
      };
      try {
        await supabase.from('admin_profiles').insert(defaultProfile);
      } catch (err) {
        console.warn("Failed to auto-insert default profile:", err);
      }
      return defaultProfile;
    }
    return data;
  },

  async clearAdminLogs() {
    assertSupabaseOk(await supabase.from('admin_logs').delete().neq('id', '___none___'), 'Failed to clear admin logs');
  },

  // ── Wipe / Reset ─────────────────────────────────────────
  async wipeStudentData() {
    assertSupabaseOk(await supabase.from('students').delete().neq('id', '___none___'), 'Failed to wipe students');
    assertSupabaseOk(await supabase.from('results').delete().neq('id', '___none___'), 'Failed to wipe results');
    assertSupabaseOk(await supabase.from('violations').delete().neq('id', '___none___'), 'Failed to wipe violations');
    assertSupabaseOk(await supabase.from('exam_sessions').delete().neq('email', '___none___'), 'Failed to wipe exam sessions');
    assertSupabaseOk(await supabase.from('att_sessions').delete().neq('id', '___none___'), 'Failed to wipe attendance sessions');
    assertSupabaseOk(await supabase.from('att_records').delete().neq('id', '___none___'), 'Failed to wipe attendance records');
    assertSupabaseOk(await supabase.from('att_edit_requests').delete().neq('id', '___none___'), 'Failed to wipe attendance edit requests');
  },

  async resetAll() {
    await this.wipeStudentData();
    assertSupabaseOk(await supabase.from('questions').delete().neq('id', '___none___'), 'Failed to wipe questions');
    assertSupabaseOk(await supabase.from('admin_logs').delete().neq('id', '___none___'), 'Failed to wipe admin logs');
    assertSupabaseOk(await supabase.from('config').delete().eq('id', 1), 'Failed to wipe config');
  },

  // ── Real-time: subscribe to exam_sessions changes ─────────
  subscribeToSessions(callback) {
    return supabase
      .channel('exam_sessions_realtime')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'exam_sessions'
      }, callback)
      .subscribe();
  },

  // ── Real-time: subscribe to results changes ───────────────
  subscribeToResults(callback) {
    return supabase
      .channel('results_realtime')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'results'
      }, callback)
      .subscribe();
  },

};

// ============================================================
// PASSWORD ACTION AUTHORIZATION UTILITY
// ============================================================
function authorizeAction(callback) {
  let modal = document.getElementById('actionAuthModal');
  if (modal) modal.remove();

  modal = document.createElement('div');
  modal.id = 'actionAuthModal';
  modal.className = 'modal-overlay active';
  modal.style.cssText = 'z-index:9999;position:fixed;inset:0;background:rgba(0,0,0,0.5);display:flex;align-items:center;justify-content:center;';
  modal.innerHTML = `
    <div class="modal" style="max-width:380px;background:#fff;border-radius:18px;padding:24px;box-shadow:0 20px 40px rgba(0,0,0,0.15);border:1.5px solid var(--admin-border,#e5e7eb);position:relative;">
      <div class="modal-header" style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px;">
        <div class="modal-title" style="font-size:16px;font-weight:800;color:var(--admin-text,#111827);">🔐 Action Authorization</div>
        <button id="authCloseBtn" style="background:none;border:none;font-size:20px;cursor:pointer;color:#9ca3af;">×</button>
      </div>
      <div class="form-group" style="margin-top:10px;">
        <p style="font-size:13px;color:#6b7280;margin-bottom:14px;line-height:1.5;">
          Please enter the <strong>Action Protection Password</strong> to authorize this deletion or wipe.
        </p>
        <input class="form-input" type="password" id="authProtectionPassword" placeholder="Enter protection password"
          style="text-align:center;font-size:16px;letter-spacing:4px;padding:10px;border-radius:8px;border:1.5px solid #e5e7eb;width:100%;box-sizing:border-box;"/>
        <div id="authErrorMsg" style="display:none;color:#dc2626;font-size:12px;margin-top:8px;text-align:center;font-weight:700;">Incorrect password.</div>
      </div>
      <button class="btn btn-primary" id="authConfirmBtn" style="margin-top:18px;width:100%;padding:12px;font-weight:700;display:block;">Confirm &amp; Proceed</button>
    </div>
  `;
  document.body.appendChild(modal);
  const passwordInput = document.getElementById('authProtectionPassword');
  passwordInput.focus();

  const close = () => modal.remove();
  document.getElementById('authCloseBtn').onclick = close;
  modal.onclick = (e) => { if (e.target === modal) close(); };

  document.getElementById('authConfirmBtn').onclick = async () => {
    const input = passwordInput.value;
    const cfg   = await DB.getConfig();
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
    if (e.key === 'Enter') document.getElementById('authConfirmBtn').click();
  };
}

// ============================================================
// BACKUP UTILITY (reads from Supabase, downloads JSON)
// ============================================================
async function triggerBackupDownload() {
  const [config, students, questions, results, violations, sessions, attSessions, attRecords, logs] =
    await Promise.all([
      DB.getConfig(), DB.getStudents(), DB.getQuestions(), DB.getResults(),
      DB.getViolations(), DB.getSessions(), DB.getAttSessions(), DB.getAttRecords(), DB.getAdminLogs()
    ]);
  const data = { config, students, questions, results, violations, sessions, attSessions, attRecords, logs, exportedAt: new Date().toISOString() };
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  a.href = url; a.download = `securecbt_autobackup_${Date.now()}.json`; a.click();
  URL.revokeObjectURL(url);
}

// ============================================================
// ADMIN GUARD
// ============================================================
async function requirePermission(moduleKey) {
  const session = await DB.getSession();
  if (!session) {
    window.location.href = 'admin-login.html';
    throw new Error('Unauthorized access redirecting to login...');
  }
  
  const profile = await DB.getCurrentProfile();
  if (!profile) {
    window.location.href = 'admin-login.html';
    throw new Error('Unauthorized access redirecting to login...');
  }

  // Superadmins bypass all locks
  if (profile.role === 'superadmin') return profile;

  // Check specific column: allowAttendance, allowStudents, allowQuestions, etc.
  const allowed = profile[`allow${moduleKey}`];
  if (!allowed) {
    const modules = ['Attendance', 'Students', 'Questions', 'Results', 'Sessions', 'Violations', 'Settings', 'Logs'];
    let redirectPage = 'admin-login.html';
    for (const m of modules) {
      if (profile[`allow${m}`]) {
        redirectPage = m === 'Attendance' ? 'admin-attendance.html' : `admin-${m.toLowerCase()}.html`;
        break;
      }
    }
    showToast(`Access Denied — '${moduleKey}' permission required!`, 'error');
    window.location.href = redirectPage;
    throw new Error(`Access Denied: '${moduleKey}' permission required.`);
  }
  return profile;
}

async function requireAdmin() {
  const session = await DB.getSession();
  if (!session) {
    window.location.href = 'admin-login.html';
    throw new Error('Unauthorized access redirecting to login...');
  }
  return await DB.getCurrentProfile();
}

// ============================================================
// TOAST UTILITY
// ============================================================
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

// ============================================================
// CSV EXPORT UTILITY
// ============================================================
function exportCSV(filename, headers, rows) {
  const lines = [headers.join(','), ...rows.map(r => r.map(c => `"${String(c ?? '').replace(/"/g, '""')}"`).join(','))];
  const blob = new Blob([lines.join('\n')], { type: 'text/csv' });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a'); a.href = url; a.download = filename; a.click();
  URL.revokeObjectURL(url);
}

// ============================================================
// GRADE UTILITY
// ============================================================
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
