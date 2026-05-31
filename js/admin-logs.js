// ===== ADMIN ACTIVITY LOGS JS — Supabase async version =====
document.addEventListener('DOMContentLoaded', async () => {
  await requirePermission('Logs');
  await renderLogs();
});

async function renderLogs() {
  const searchQ    = document.getElementById('logSearchInput').value.trim().toLowerCase();
  const categoryF  = document.getElementById('logCategoryFilter').value;
  const logs       = await DB.getAdminLogs();

  document.getElementById('logCountLabel').textContent = `${logs.length} logs registered`;

  let filteredLogs = logs;
  if (categoryF) filteredLogs = filteredLogs.filter(l => l.category === categoryF);
  if (searchQ)   filteredLogs = filteredLogs.filter(l => l.action.toLowerCase().includes(searchQ));

  const tbody = document.getElementById('logsTableBody');
  if (!filteredLogs.length) {
    tbody.innerHTML = '<tr><td colspan="4"><div class="empty-state"><p>No logs match the active filters.</p></div></td></tr>';
    return;
  }

  const categoryBadges = {
    system:     '<span class="badge badge-gray">⚙️ System</span>',
    students:   '<span class="badge badge-blue">👥 Students</span>',
    questions:  '<span class="badge badge-purple">❓ Questions</span>',
    results:    '<span class="badge badge-green">📊 Results</span>',
    attendance: '<span class="badge badge-orange">📅 Attendance</span>'
  };

  tbody.innerHTML = filteredLogs.map(l => {
    const badge = categoryBadges[l.category] || `<span class="badge badge-gray">${l.category.toUpperCase()}</span>`;
    const formattedTime = new Date(l.timestamp).toLocaleString();
    const userDetail = l.admin_email ? `<span style="font-weight:700;">${l.admin_name || 'Admin'}</span><br/><span style="font-size:11px;color:var(--admin-text-muted);">${l.admin_email}</span>` : '<span style="color:var(--admin-text-muted); font-style:italic;">System</span>';
    return `
      <tr>
        <td style="font-size:12px;color:var(--admin-text-muted);font-weight:600;white-space:nowrap;">${formattedTime}</td>
        <td>${badge}</td>
        <td style="font-size:12px;color:var(--admin-text);">${userDetail}</td>
        <td style="font-size:13.5px;color:var(--admin-text);font-weight:600;">${l.action}</td>
      </tr>
    `;
  }).join('');
}

async function clearLogs() {
  authorizeAction(async () => {
    showToast('Creating backup before clearing logs...', 'info');
    await triggerBackupDownload();
    await DB.clearAdminLogs();
    await DB.addAdminLog('Wiped admin activity logs history (Auto-Backup performed)', 'system');
    await renderLogs();
    showToast('Activity logs cleared.', 'info');
  });
}

async function exportLogsCSV() {
  const logs = await DB.getAdminLogs();
  if (!logs.length) return showToast('No logs to export.', 'error');
  exportCSV('admin_activity_logs.csv',
    ['Timestamp', 'Category', 'User Name', 'User Email', 'Action Description'],
    logs.map(l => [
      new Date(l.timestamp).toLocaleString(), 
      l.category.toUpperCase(), 
      l.admin_name || 'System', 
      l.admin_email || 'system@cbt.com', 
      l.action
    ])
  );
  showToast('Logs exported successfully.', 'success');
}
