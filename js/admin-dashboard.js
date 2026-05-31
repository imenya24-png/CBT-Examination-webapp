// Admin Dashboard JS — Supabase async version
let realtimeChannel = null;

document.addEventListener('DOMContentLoaded', async () => {
  const profile = await requireAdmin();
  const isSuperadmin = profile?.role === 'superadmin';
  const hasMultipleModules = isSuperadmin || 
    ['Students', 'Questions', 'Results', 'Sessions', 'Violations', 'Settings', 'Logs']
      .some(m => profile?.[`allow${m}`] === true);
  
  if (!hasMultipleModules && profile?.allowAttendance) {
    window.location.href = 'admin-attendance.html';
    return;
  }

  await loadDashboard();

  // Real-time live student monitoring via Supabase subscriptions
  realtimeChannel = DB.subscribeToSessions(async () => {
    await loadDashboard();
  });

  // Also subscribe to new results to update count live
  DB.subscribeToResults(async () => {
    await loadDashboard();
  });

  // Refresh stats every 30s as a fallback
  setInterval(loadDashboard, 30000);
});

async function loadDashboard() {
  const [cfg, students, questions, results, violations, sessions] = await Promise.all([
    DB.getConfig(),
    DB.getStudents(),
    DB.getQuestions(),
    DB.getResults(),
    DB.getViolations(),
    DB.getSessions()
  ]);

  // Admin email from Supabase Auth session
  const session = await DB.getSession();
  document.getElementById('adminEmailDisplay').textContent =
    session?.user?.email || cfg.adminEmail || 'admin@cbt.com';

  // Stats
  document.getElementById('statStudents').textContent   = students.length;
  document.getElementById('statQuestions').textContent  = questions.length;
  document.getElementById('statCompleted').textContent  = results.length;
  document.getElementById('statViolations').textContent = violations.length;

  const activeSessions = sessions.filter(s => s.status === 'active').length;
  document.getElementById('statActive').textContent = activeSessions;

  // Live students panel
  renderLiveStudents(sessions);

  // Status banner
  const banner      = document.getElementById('statusBanner');
  const statusTx    = document.getElementById('statusText');
  const examTitleEl = document.getElementById('statusExamTitle');
  examTitleEl.textContent = cfg.examTitle || '';

  if (cfg.examActive) {
    banner.className = 'status-banner active';
    statusTx.textContent = 'Exam is currently ACTIVE';
    document.getElementById('examToggleBtn').textContent = '⏹ Stop Exam';
    document.getElementById('examToggleBtn').className = 'btn btn-danger btn-sm';
  } else {
    banner.className = 'status-banner inactive';
    statusTx.textContent = 'Exam is currently INACTIVE';
    document.getElementById('examToggleBtn').textContent = '▶️ Start Exam';
    document.getElementById('examToggleBtn').className = 'btn btn-sm';
    document.getElementById('examToggleBtn').style.background = 'var(--green)';
    document.getElementById('examToggleBtn').style.color = '#fff';
  }
}

function renderLiveStudents(sessions) {
  const liveEl = document.getElementById('liveStudentsPanel');
  if (!liveEl) return;

  const active = sessions.filter(s => s.status === 'active');
  const completed = sessions.filter(s => s.status === 'completed');

  if (!sessions.length) {
    liveEl.innerHTML = '<div class="empty-state" style="padding:16px;"><p>No active exam sessions.</p></div>';
    return;
  }

  liveEl.innerHTML = `
    <div style="display:flex;gap:12px;flex-wrap:wrap;margin-bottom:12px;">
      <span style="font-size:13px;font-weight:700;color:var(--green);">🟢 Active: ${active.length}</span>
      <span style="font-size:13px;font-weight:700;color:var(--admin-text-muted);">✅ Completed: ${completed.length}</span>
    </div>
    <div style="display:flex;flex-direction:column;gap:6px;max-height:200px;overflow-y:auto;">
      ${sessions.map(s => `
        <div style="display:flex;justify-content:space-between;align-items:center;padding:8px 12px;border-radius:8px;background:${s.status==='active'?'#f0fdf4':'#f9fafb'};border:1.5px solid ${s.status==='active'?'#bbf7d0':'#e5e7eb'};">
          <span style="font-size:13px;font-weight:600;">${s.email}</span>
          <span class="badge ${s.status==='active'?'badge-green':'badge-gray'}">${s.status}</span>
        </div>
      `).join('')}
    </div>
  `;
}

async function toggleExam() {
  const cfg = await DB.getConfig();
  cfg.examActive = !cfg.examActive;
  await DB.setConfig(cfg);
  await DB.addAdminLog(
    cfg.examActive ? 'Started/Activated examination period' : 'Stopped/Deactivated examination period',
    'system'
  );
  await loadDashboard();
  showToast(cfg.examActive ? 'Exam is now ACTIVE' : 'Exam has been STOPPED', cfg.examActive ? 'success' : 'error');
}

async function doLogout() {
  await DB.signOut();
  window.location.href = 'admin-login.html';
}

async function doBackup() {
  await triggerBackupDownload();
  await DB.addAdminLog('Created manual system backup', 'system');
  showToast('Backup downloaded!', 'success');
}

async function doReset() {
  authorizeAction(async () => {
    showToast('Creating backup...', 'info');
    await triggerBackupDownload();
    await DB.wipeStudentData();
    await DB.addAdminLog(
      'Wiped all student profiles, exam records, violations and sessions (Auto-Backup performed)',
      'system'
    );
    await loadDashboard();
    showToast('System data has been reset and backup auto-downloaded.', 'info');
  });
}
