// Admin Settings JS — Supabase async version
document.addEventListener('DOMContentLoaded', async () => {
  await requirePermission('Settings');
  await loadSettings();
  await loadAdminProfiles();
});

async function loadAdminProfiles() {
  const currentProfile = await DB.getCurrentProfile();
  const section = document.getElementById('tutorPermissionsSection');
  if (section && currentProfile?.role !== 'superadmin') {
    section.innerHTML = '<div class="empty-state" style="padding:22px;text-align:center;">Only Superadmins can manage tutor permissions.</div>';
    return;
  }

  const profiles = await DB.getAdminProfiles();
  renderAdminProfiles(profiles);
}

function renderAdminProfiles(profiles) {
  const tbody = document.getElementById('adminProfilesTable');
  if (!tbody) return;

  if (!profiles.length) {
    tbody.innerHTML = '<tr><td colspan="11"><div class="empty-state"><p>No tutors or admin profiles found.</p></div></td></tr>';
    return;
  }

  const rows = profiles.sort((a,b) => (a.role === 'superadmin' ? -1 : 1) - (b.role === 'superadmin' ? -1 : 1));
  tbody.innerHTML = rows.map(profile => {
    const isSuper = profile.role === 'superadmin';
    const toggles = ['Attendance','Students','Questions','Results','Sessions','Violations','Settings','Logs']
      .map(feature => {
        const key = `allow${feature}`;
        const checked = profile[key] ? 'checked' : '';
        const disabled = isSuper ? 'disabled' : '';
        return `<td class="permission-cell"><label class="toggle-switch small"><input type="checkbox" ${checked} ${disabled} onchange="toggleProfilePermission('${profile.id}','${key}', this.checked)"/><span class="toggle-slider"></span></label></td>`;
      }).join('');

    return `
      <tr>
        <td>${profile.name}</td>
        <td>${profile.email}</td>
        <td><span class="profile-role-badge ${isSuper ? 'role-superadmin' : 'role-tutor'}">${profile.role}</span></td>
        ${toggles}
      </tr>`;
  }).join('');
}

async function toggleProfilePermission(profileId, permissionKey, isEnabled) {
  try {
    await DB.updateAdminProfile(profileId, { [permissionKey]: isEnabled });
    await DB.addAdminLog(`Updated ${permissionKey} for profile ${profileId}`, 'settings');
    showToast('Permission updated successfully.', 'success');
    await loadAdminProfiles();

    const current = await DB.getCurrentProfile();
    if (current.id === profileId && permissionKey === 'allowSettings' && !isEnabled) {
      showToast('Settings access removed. Redirecting to permitted page...', 'error');
      window.location.href = 'admin-dashboard.html';
      return;
    }
  } catch (err) {
    console.error('Failed to update profile permission:', err);
    showToast('Unable to update permission. Please try again.', 'error');
  }
}

async function loadSettings() {
  const cfg = await DB.getConfig();

  // Home page
  document.getElementById('s-badgeText').value         = cfg.badgeText   || '';
  document.getElementById('s-mainTitle').value          = cfg.mainTitle   || '';
  document.getElementById('s-examLabel').value          = cfg.examLabel   || '';
  document.getElementById('s-description').value        = cfg.description || '';

  // Exam config
  document.getElementById('s-examTitle').value          = cfg.examTitle          || '';
  document.getElementById('s-totalQuestions').value     = cfg.totalQuestions     || 50;
  document.getElementById('s-questionsToAttempt').value = cfg.questionsToAttempt || 30;
  document.getElementById('s-duration').value           = cfg.duration           || 30;

  // Navigation
  document.getElementById('s-allowBackNav').checked     = !!cfg.allowBackNav;
  document.getElementById('s-allowReview').checked      = !!cfg.allowReview;
  document.getElementById('s-shuffleQuestions').checked = !!cfg.shuffleQuestions;
  document.getElementById('s-shuffleOptions').checked   = !!cfg.shuffleOptions;

  // Results
  document.getElementById('s-showScoreAfter').checked      = !!cfg.showScoreAfter;
  document.getElementById('s-showCorrectAnswers').checked   = !!cfg.showCorrectAnswers;

  // Security
  document.getElementById('s-maxViolations').value      = cfg.maxViolations   || 5;
  document.getElementById('s-networkGrace').value       = cfg.networkGrace    || 10;
  document.getElementById('s-monitorVisibility').checked = !!cfg.monitorVisibility;

  // Action Protection Password
  document.getElementById('s-protectionPassword').value = cfg.protectionPassword || 'secure123';

  updateStatusBanner(cfg.examActive);
}

function updateStatusBanner(active) {
  const banner     = document.getElementById('statusBanner');
  const statusText = document.getElementById('statusText');
  const statusDesc = document.getElementById('statusDesc');
  const btn        = document.getElementById('toggleExamBtn');

  if (active) {
    banner.style.background = '#dcfce7';
    banner.style.border     = '1.5px solid #bbf7d0';
    statusText.textContent  = '✅ Exam is currently ACTIVE';
    statusText.style.color  = '#15803d';
    statusDesc.textContent  = 'Students can currently access and take the exam.';
    statusDesc.style.color  = '#16a34a';
    btn.textContent         = '⏹ Stop Exam';
    btn.style.background    = '#dc2626';
    btn.style.color         = '#fff';
  } else {
    banner.style.background = '#fee2e2';
    banner.style.border     = '1.5px solid #fecaca';
    statusText.textContent  = '🔴 Exam is currently INACTIVE';
    statusText.style.color  = '#b91c1c';
    statusDesc.textContent  = 'Students cannot access the exam until it is started.';
    statusDesc.style.color  = '#dc2626';
    btn.textContent         = '▶️ Start Exam';
    btn.style.background    = '#16a34a';
    btn.style.color         = '#fff';
  }
}

async function toggleExam() {
  const cfg = await DB.getConfig();
  cfg.examActive = !cfg.examActive;
  await DB.setConfig(cfg);
  await DB.addAdminLog(
    cfg.examActive ? 'Started/Activated examination period' : 'Stopped/Deactivated examination period',
    'system'
  );
  updateStatusBanner(cfg.examActive);
  showToast(cfg.examActive ? 'Exam is now ACTIVE' : 'Exam has been STOPPED', cfg.examActive ? 'success' : 'error');
}

async function saveSettings() {
  const cfg = await DB.getConfig();

  Object.assign(cfg, {
    badgeText:          document.getElementById('s-badgeText').value.trim(),
    mainTitle:          document.getElementById('s-mainTitle').value.trim(),
    examLabel:          document.getElementById('s-examLabel').value.trim(),
    description:        document.getElementById('s-description').value.trim(),
    examTitle:          document.getElementById('s-examTitle').value.trim(),
    totalQuestions:     parseInt(document.getElementById('s-totalQuestions').value) || 50,
    questionsToAttempt: parseInt(document.getElementById('s-questionsToAttempt').value) || 30,
    duration:           parseInt(document.getElementById('s-duration').value) || 30,
    allowBackNav:       document.getElementById('s-allowBackNav').checked,
    allowReview:        document.getElementById('s-allowReview').checked,
    shuffleQuestions:   document.getElementById('s-shuffleQuestions').checked,
    shuffleOptions:     document.getElementById('s-shuffleOptions').checked,
    showScoreAfter:     document.getElementById('s-showScoreAfter').checked,
    showCorrectAnswers: document.getElementById('s-showCorrectAnswers').checked,
    maxViolations:      parseInt(document.getElementById('s-maxViolations').value) || 5,
    networkGrace:       parseInt(document.getElementById('s-networkGrace').value) || 10,
    monitorVisibility:  document.getElementById('s-monitorVisibility').checked,
    protectionPassword: document.getElementById('s-protectionPassword').value.trim() || 'secure123',
  });

  await DB.setConfig(cfg);
  await DB.addAdminLog('Saved/updated system settings', 'system');
  showToast('Settings saved successfully!', 'success');
}

async function resetDefaults() {
  if (!confirm('Reset all settings to default values? This will not affect students or questions.')) return;
  const current  = await DB.getConfig();
  const defaults = {
    badgeText: 'Enterprise Python - Backend Development',
    mainTitle: 'Python Basic Fundamental',
    examLabel: 'Test of knowledge',
    description: 'Programming - Algorithm - Pseudocode',
    examTitle: 'Test of knowledge',
    totalQuestions: 50,
    questionsToAttempt: 30,
    duration: 30,
    allowBackNav: false,
    allowReview: true,
    shuffleQuestions: true,
    shuffleOptions: true,
    maxViolations: 5,
    networkGrace: 10,
    monitorVisibility: true,
    showScoreAfter: true,
    showCorrectAnswers: true,
    examActive: current.examActive,
    protectionPassword: 'secure123',
  };
  await DB.setConfig(defaults);
  await DB.addAdminLog('Reset system settings to defaults', 'system');
  await loadSettings();
  showToast('Settings reset to defaults.', 'info');
}
