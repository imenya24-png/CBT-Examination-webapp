// Admin Sessions JS — Supabase async version with real-time updates
document.addEventListener('DOMContentLoaded', async () => {
  await requireAdmin();
  await renderSessions();

  // Real-time updates via Supabase subscription
  DB.subscribeToSessions(async () => {
    await renderSessions();
  });

  // Fallback refresh every 15 seconds
  setInterval(renderSessions, 15000);
});

async function renderSessions() {
  const q   = document.getElementById('searchInput').value.toLowerCase();
  const st  = document.getElementById('statusFilter').value;
  let sessions   = await DB.getSessions();
  const violations = await DB.getViolations();

  // Stats
  const active    = sessions.filter(s => s.status === 'active').length;
  const completed = sessions.filter(s => s.status === 'completed').length;
  document.getElementById('ss-active').textContent     = active;
  document.getElementById('ss-completed').textContent  = completed;
  document.getElementById('ss-violations').textContent = violations.length;
  document.getElementById('sessionSubtitle').textContent =
    `${sessions.length} total sessions · Real-time via Supabase`;

  // Filters
  if (q)  sessions = sessions.filter(s =>
    (s.name || '').toLowerCase().includes(q) || (s.email || '').toLowerCase().includes(q));
  if (st) sessions = sessions.filter(s => s.status === st);

  const tbody = document.getElementById('sessionTableBody');
  if (!sessions.length) {
    tbody.innerHTML = `<tr><td colspan="6"><div class="empty-state"><p>No sessions found.</p></div></td></tr>`;
    return;
  }

  // Sort: active first, then most recent
  sessions.sort((a, b) => {
    if (a.status === 'active' && b.status !== 'active') return -1;
    if (b.status === 'active' && a.status !== 'active') return  1;
    return new Date(b.startedAt) - new Date(a.startedAt);
  });

  tbody.innerHTML = sessions.map(s => {
    const isActive = s.status === 'active';
    const vCount   = violations.filter(v => v.email === s.email).length;

    // Format started time
    let started = '—';
    if (s.startedAt) {
      try { started = new Date(s.startedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }); } catch(e) {}
    }

    // Format lastSeen — show for ALL sessions (active shows "X ago", completed shows full time)
    let lastSeenTxt = '—';
    if (s.lastSeen) {
      try {
        const ls = new Date(s.lastSeen);
        if (isActive) {
          lastSeenTxt = `<span style="color:var(--green);font-weight:700;">● ${timeSince(ls)} ago</span>`;
        } else {
          lastSeenTxt = ls.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        }
      } catch(e) {}
    } else if (isActive) {
      lastSeenTxt = '<span style="color:#f59e0b;">Waiting...</span>';
    }

    return `
    <tr>
      <td>
        <div style="display:flex;align-items:center;gap:8px;">
          ${isActive ? '<span style="width:8px;height:8px;border-radius:50%;background:#16a34a;animation:pulse-green 2s infinite;display:inline-block;flex-shrink:0;"></span>' : ''}
          <div>
            <strong>${s.name || '—'}</strong><br>
            <span style="font-size:12px;color:var(--admin-text-muted);">${s.email}</span>
          </div>
        </div>
      </td>
      <td><span class="badge badge-purple">${s.class || '—'}</span></td>
      <td>
        <span class="badge ${isActive ? 'badge-green' : 'badge-gray'}">
          ${isActive ? '▶ Active' : '✓ Completed'}
        </span>
      </td>
      <td style="font-size:13px;">${started}</td>
      <td style="font-size:13px;">${lastSeenTxt}</td>
      <td>
        <span class="badge ${vCount > 0 ? 'badge-red' : 'badge-gray'}">${vCount} violation${vCount !== 1 ? 's' : ''}</span>
      </td>
    </tr>`;
  }).join('');
}

function timeSince(date) {
  const seconds = Math.floor((new Date() - date) / 1000);
  if (seconds < 60)   return `${seconds}s`;
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m`;
  return `${Math.floor(seconds / 3600)}h`;
}
