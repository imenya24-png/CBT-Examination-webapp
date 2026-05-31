// Admin Violations JS — Supabase async version
document.addEventListener('DOMContentLoaded', async () => {
  await requirePermission('Violations');
  await renderViolations();
});

async function renderViolations() {
  const q  = document.getElementById('searchInput').value.toLowerCase();
  const tp = document.getElementById('typeFilter').value;
  let violations = await DB.getViolations();
  const all = violations;

  // Stats
  document.getElementById('vCountLabel').textContent = `${all.length} total violations`;
  document.getElementById('vs-tab').textContent      = all.filter(v => v.type === 'tab_switch').length;
  document.getElementById('vs-vis').textContent      = all.filter(v => v.type === 'visibility').length;
  document.getElementById('vs-refresh').textContent  = all.filter(v => v.type === 'refresh').length;
  document.getElementById('vs-click').textContent    = all.filter(v => v.type === 'right_click').length;
  document.getElementById('vs-copy').textContent     = all.filter(v => v.type === 'copy_paste').length;

  // Filters
  if (q)  violations = violations.filter(v =>
    (v.email || '').toLowerCase().includes(q) || (v.studentName || '').toLowerCase().includes(q));
  if (tp) violations = violations.filter(v => v.type === tp);

  // Sort newest first
  violations = [...violations].sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

  const tbody = document.getElementById('vTableBody');
  if (!violations.length) {
    tbody.innerHTML = `<tr><td colspan="4"><div class="empty-state"><p>No violations found.</p></div></td></tr>`;
    return;
  }

  const typeLabels = {
    tab_switch:  { label: '🖥️ Tab Switch',        badge: 'badge-red' },
    visibility:  { label: '👁️ Visibility Change',  badge: 'badge-orange' },
    refresh:     { label: '↻ Page Refresh',         badge: 'badge-blue' },
    right_click: { label: '🖱️ Right Click',         badge: 'badge-purple' },
    copy_paste:  { label: '📋 Copy / Paste',         badge: 'badge-gray' },
  };

  tbody.innerHTML = violations.map(v => {
    const info = typeLabels[v.type] || { label: v.type, badge: 'badge-gray' };
    const time = v.timestamp ? new Date(v.timestamp).toLocaleString() : '—';
    return `
    <tr>
      <td>
        <strong>${v.studentName || '—'}</strong><br>
        <span style="font-size:12px;color:var(--admin-text-muted);">${v.email || '—'}</span>
      </td>
      <td><span class="badge ${info.badge}">${info.label}</span></td>
      <td style="font-size:13px;color:var(--admin-text-muted);">${v.detail || '—'}</td>
      <td style="font-size:13px;white-space:nowrap;">${time}</td>
    </tr>`;
  }).join('');
}

async function clearViolations() {
  authorizeAction(async () => {
    showToast('Creating backup...', 'info');
    await triggerBackupDownload();
    await DB.setViolations([]);
    await DB.addAdminLog('Wiped proctoring violation logs (Auto-Backup performed)', 'system');
    await renderViolations();
    showToast('Violation logs cleared and backup auto-downloaded.', 'info');
  });
}
