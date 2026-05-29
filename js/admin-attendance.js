// ===== ADMIN ATTENDANCE JS — Supabase async version =====
document.addEventListener('DOMContentLoaded', async () => {
  await requireAdmin();
  // Set today's date as default in new session modal
  const dateInput = document.getElementById('nsDate');
  if (dateInput) {
    dateInput.value = new Date().toISOString().split('T')[0];
  }
  await refresh();
});

async function refresh() {
  await renderOpenSession();
  await renderHistory();
  await renderPendingEditsBanner();
}

// ============================================================
// OPEN SESSION PANEL
// ============================================================
async function renderOpenSession() {
  const session = await DB.getOpenAttSession();
  const panel   = document.getElementById('openSessionPanel');
  if (!session) { 
    if (panel) panel.style.display = 'none'; 
    return; 
  }
  if (panel) panel.style.display = 'block';

  const r1 = session.round1Serials || [];
  const r2 = session.round2Serials || [];
  
  const titleEl = document.getElementById('openSessionTitle');
  if (titleEl) {
    titleEl.textContent = (session.topic || 'Untitled Session') + ' — ' + session.date;
  }
  const metaEl = document.getElementById('openSessionMeta');
  if (metaEl) {
    metaEl.textContent = session.class + (session.notes ? ' · ' + session.notes : '');
  }
  const r1CountEl = document.getElementById('openSessionR1Count');
  if (r1CountEl) {
    r1CountEl.textContent = 'Round 1: ' + r1.length + ' present';
  }
  const r2CountEl = document.getElementById('openSessionR2Count');
  if (r2CountEl) {
    r2CountEl.textContent = 'Round 2: ' + r2.length + ' late';
  }
}

// ============================================================
// SERIAL NUMBER PARSER
// ============================================================
function parseSerials(raw) {
  return [...new Set(
    raw.toUpperCase().split(/[\s,;]+/)
      .map(s => s.trim())
      .filter(s => /^[A-Z]\d+$/.test(s))
  )];
}

async function resolveSerials(serials, sessionClass) {
  const students = await DB.getStudents();
  const results  = { matched: [], unknown: [], wrongClass: [] };

  serials.forEach(sn => {
    const student = students.find(s => (s.classSN || '').toUpperCase() === sn);
    if (!student) {
      results.unknown.push(sn);
    } else if (sessionClass !== 'Joint' && student.class !== sessionClass) {
      results.wrongClass.push({ sn, student });
    } else {
      results.matched.push({ sn, student });
    }
  });
  return results;
}

// ============================================================
// LIVE PREVIEW
// ============================================================
async function livePreview(round) {
  const session = await DB.getOpenAttSession();
  if (!session) return;
  const raw     = document.getElementById('r' + round + 'Input').value;
  const serials = parseSerials(raw);
  const preview = document.getElementById('r' + round + 'Preview');
  if (!serials.length) { preview.innerHTML = ''; return; }

  const res     = await resolveSerials(serials, session.class);
  const r1      = session.round1Serials || [];
  const r2      = session.round2Serials || [];

  let html = '<div class="att-preview-grid">';

  res.matched.forEach(({ sn, student }) => {
    const alreadyR1 = round === 2 && r1.includes(sn);
    const alreadyR2 = r2.includes(sn);
    let tag = '', tagStyle = '';
    if (alreadyR1) { tag = 'Already Present'; tagStyle = 'background:#dcfce7;color:#16a34a;'; }
    else if (alreadyR2 && round === 2) { tag = 'Duplicate'; tagStyle = 'background:#fef3c7;color:#92400e;'; }
    html += `<div class="att-preview-chip ok">
      <span class="att-chip-sn">${sn}</span>
      <span class="att-chip-name">${student.name}</span>
      ${tag ? '<span class="att-chip-tag" style="' + tagStyle + '">' + tag + '</span>' : ''}
    </div>`;
  });

  res.wrongClass.forEach(({ sn, student }) => {
    html += `<div class="att-preview-chip warn">
      <span class="att-chip-sn">${sn}</span>
      <span class="att-chip-name">${student.name}</span>
      <span class="att-chip-tag" style="background:#ffedd5;color:#c2410c;">Wrong class (${student.class})</span>
    </div>`;
  });

  res.unknown.forEach(sn => {
    html += `<div class="att-preview-chip err">
      <span class="att-chip-sn">${sn}</span>
      <span class="att-chip-name" style="color:var(--red);">Unknown serial</span>
    </div>`;
  });

  html += '</div>';
  html += `<div class="att-preview-summary">
    <span style="color:var(--green);">✅ ${res.matched.length} matched</span>
    ${res.wrongClass.length ? '<span style="color:var(--orange);">⚠️ ' + res.wrongClass.length + ' wrong class</span>' : ''}
    ${res.unknown.length   ? '<span style="color:var(--red);">❌ ' + res.unknown.length + ' unknown</span>' : ''}
  </div>`;
  preview.innerHTML = html;
}

// ============================================================
// SUBMIT ROUND
// ============================================================
async function submitRound(round) {
  const session = await DB.getOpenAttSession();
  if (!session) return;
  const raw     = document.getElementById('r' + round + 'Input').value;
  const serials = parseSerials(raw);
  if (!serials.length) return showToast('No valid serial numbers entered.', 'error');

  const res = await resolveSerials(serials, session.class);
  const r1  = session.round1Serials || [];
  const r2  = session.round2Serials || [];

  if (round === 1) {
    const newSerials = res.matched.map(m => m.sn).filter(sn => !r1.includes(sn));
    await DB.updateAttSession(session.id, { round1Serials: [...r1, ...newSerials] });
    showToast(newSerials.length + ' student(s) marked Present.', 'success');
  } else {
    const newSerials = res.matched
      .filter(m => !r1.includes(m.sn) && !r2.includes(m.sn))
      .map(m => m.sn);
    const skipped = res.matched.filter(m => r1.includes(m.sn)).length;
    await DB.updateAttSession(session.id, { round2Serials: [...r2, ...newSerials] });
    let msg = newSerials.length + ' student(s) marked Late.';
    if (skipped) msg += ' ' + skipped + ' skipped (already Present).';
    showToast(msg, skipped ? 'info' : 'success');
  }

  document.getElementById('r' + round + 'Input').value = '';
  document.getElementById('r' + round + 'Preview').innerHTML = '';
  await renderOpenSession();
}

function clearRoundInput(round) {
  document.getElementById('r' + round + 'Input').value = '';
  document.getElementById('r' + round + 'Preview').innerHTML = '';
}

function switchRound(round) {
  document.getElementById('round1Panel').style.display = round === 1 ? 'block' : 'none';
  document.getElementById('round2Panel').style.display = round === 2 ? 'block' : 'none';
  document.getElementById('tabR1Btn').classList.toggle('active', round === 1);
  document.getElementById('tabR2Btn').classList.toggle('active', round === 2);
}

// ============================================================
// CLOSE SESSION → AUTO-MARK ABSENT
// ============================================================
async function showCloseConfirm() {
  const session = await DB.getOpenAttSession();
  if (!session) return;
  const students = await getSessionStudents(session);
  const r1 = session.round1Serials || [];
  const r2 = session.round2Serials || [];
  const absent = students.filter(s => !r1.includes(s.classSN) && !r2.includes(s.classSN));

  document.getElementById('closeConfirmBody').innerHTML = `
    <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:12px;margin-bottom:16px;">
      <div style="background:#dcfce7;border-radius:10px;padding:14px;text-align:center;">
        <div style="font-size:28px;font-weight:900;color:#16a34a;">${r1.length}</div>
        <div style="font-size:12px;font-weight:600;color:#16a34a;">Present</div>
      </div>
      <div style="background:#fef3c7;border-radius:10px;padding:14px;text-align:center;">
        <div style="font-size:28px;font-weight:900;color:#92400e;">${r2.length}</div>
        <div style="font-size:12px;font-weight:600;color:#92400e;">Late</div>
      </div>
      <div style="background:#fee2e2;border-radius:10px;padding:14px;text-align:center;">
        <div style="font-size:28px;font-weight:900;color:var(--red);">${absent.length}</div>
        <div style="font-size:12px;font-weight:600;color:var(--red);">Will be Absent</div>
      </div>
    </div>
    <p style="font-size:13px;color:var(--admin-text-muted);">
      Closing this session will permanently record attendance for all ${students.length} students.
    </p>`;
  document.getElementById('closeConfirmModal').classList.add('active');
}

async function closeSession() {
  const session = await DB.getOpenAttSession();
  if (!session) return;
  const students = await getSessionStudents(session);
  const r1 = session.round1Serials || [];
  const r2 = session.round2Serials || [];
  const records = [];

  students.forEach(s => {
    let status = 'absent';
    if (r1.includes(s.classSN)) status = 'present';
    else if (r2.includes(s.classSN)) status = 'late';
    records.push({
      id: generateId(),
      sessionId: session.id,
      date: session.date,
      studentId: s.id,
      studentName: s.name,
      email: s.email,
      class: s.class,
      classSN: s.classSN,
      status,
    });
  });

  await DB.addAttRecords(records);
  await DB.updateAttSession(session.id, { status: 'closed', closedAt: new Date().toISOString() });
  await DB.addAdminLog(`Closed attendance session: ${session.date} (${session.class})`, 'attendance');
  closeModal('closeConfirmModal');
  await refresh();
  showToast('Session closed. ' + records.length + ' records saved.', 'success');
}

async function getSessionStudents(session) {
  const students = await DB.getStudents();
  if (session.class === 'Joint') return students.filter(s => s.class === 'Class A' || s.class === 'Class B');
  return students.filter(s => s.class === session.class);
}

// ============================================================
// SESSION HISTORY TABLE
// ============================================================
async function renderHistory() {
  const clsF  = document.getElementById('classFilterHistory').value;
  const stF   = document.getElementById('statusFilterHistory').value;
  
  let sessions = await DB.getAttSessions();
  // Newest first
  sessions.sort((a,b) => b.createdAt.localeCompare(a.createdAt));

  if (clsF) sessions = sessions.filter(s => s.class === clsF);
  if (stF)  sessions = sessions.filter(s => s.status === stF);

  const students = await DB.getStudents();
  const allRecords = await DB.getAttRecords();

  const getSessionStudentsCount = (session) => {
    if (session.class === 'Joint') return students.filter(s => s.class === 'Class A' || s.class === 'Class B').length;
    return students.filter(s => s.class === session.class).length;
  };

  document.getElementById('attSubtitle').textContent =
    sessions.length + ' total sessions · ' +
    sessions.filter(s => s.status === 'closed').length + ' closed';

  const tbody = document.getElementById('historyTableBody');
  if (!sessions.length) {
    tbody.innerHTML = '<tr><td colspan="10"><div class="empty-state"><p>No sessions yet. Click "+ New Session" to start.</p></div></td></tr>';
    return;
  }

  tbody.innerHTML = sessions.map(s => {
    const records  = allRecords.filter(r => r.sessionId === s.id);
    const present  = records.filter(r => r.status === 'present').length;
    const late     = records.filter(r => r.status === 'late').length;
    const absent   = records.filter(r => r.status === 'absent').length;
    const total    = records.length || (s.status === 'open' ? getSessionStudentsCount(s) : 0);
    const attPct   = total ? Math.round((present / total) * 100) : 0;
    const isOpen   = s.status === 'open';

    return `<tr>
      <td style="font-weight:600;white-space:nowrap;">${s.date}</td>
      <td><span class="badge ${s.class === 'Joint' ? 'badge-orange' : s.class === 'Class A' ? 'badge-blue' : 'badge-purple'}">${s.class}</span></td>
      <td style="font-size:13px;max-width:160px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${s.topic || '—'}</td>
      <td><strong style="color:var(--green);">${present}</strong></td>
      <td><strong style="color:#f59e0b;">${late}</strong></td>
      <td><strong style="color:var(--red);">${absent}</strong></td>
      <td>${total}</td>
      <td>
        <div style="display:flex;align-items:center;gap:8px;">
          <div style="flex:1;height:6px;background:#f3f4f6;border-radius:3px;overflow:hidden;">
            <div style="height:100%;width:${attPct}%;background:${attPct>=75?'#16a34a':attPct>=50?'#f59e0b':'#dc2626'};border-radius:3px;"></div>
          </div>
          <span style="font-size:12px;font-weight:700;">${attPct}%</span>
        </div>
      </td>
      <td>
        <span class="badge ${isOpen ? 'badge-green' : 'badge-gray'}">
          ${isOpen ? '🟢 Open' : '✓ Closed'}
        </span>
      </td>
      <td>
        <div style="display:flex;gap:6px;">
          <button class="icon-btn view" onclick="viewSession('${s.id}')" title="View">👁️</button>
          <button class="icon-btn view" onclick="exportSessionCSV('${s.id}')" title="Export" style="background:#f0fdf4;color:#16a34a;">⬇️</button>
          <button class="icon-btn view" onclick="openEditReqModal('${s.id}')" title="Request Edit" style="background:#fef3c7;color:#92400e;">✏️</button>
          <button class="icon-btn del"  onclick="deleteSession('${s.id}')" title="Delete">🗑️</button>
        </div>
      </td>
    </tr>`;
  }).join('');
}

// ============================================================
// VIEW SESSION
// ============================================================
async function viewSession(sessionId) {
  const sessions = await DB.getAttSessions();
  const s = sessions.find(x => x.id === sessionId);
  if (!s) return;
  const records = await DB.getRecordsBySession(sessionId);
  const present = records.filter(r => r.status === 'present');
  const late    = records.filter(r => r.status === 'late');
  const absent  = records.filter(r => r.status === 'absent');
  const total   = records.length;

  const makeList = (recs, color) => recs.length
    ? recs.map(r => `<span style="display:inline-block;background:${color}18;border:1px solid ${color}44;color:${color};border-radius:6px;padding:3px 8px;font-size:12px;font-weight:600;margin:2px;font-family:monospace;">${r.classSN} ${r.studentName}</span>`).join('')
    : '<span style="font-size:13px;color:var(--admin-text-muted);">None</span>';

  document.getElementById('viewSessionContent').innerHTML = `
    <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:12px;margin-bottom:20px;">
      <div style="background:#dcfce7;border-radius:10px;padding:14px;text-align:center;">
        <div style="font-size:26px;font-weight:900;color:#16a34a;">${present.length}</div>
        <div style="font-size:12px;font-weight:600;color:#16a34a;">Present</div>
      </div>
      <div style="background:#fef3c7;border-radius:10px;padding:14px;text-align:center;">
        <div style="font-size:26px;font-weight:900;color:#92400e;">${late.length}</div>
        <div style="font-size:12px;font-weight:600;color:#92400e;">Late</div>
      </div>
      <div style="background:#fee2e2;border-radius:10px;padding:14px;text-align:center;">
        <div style="font-size:26px;font-weight:900;color:var(--red);">${absent.length}</div>
        <div style="font-size:12px;font-weight:600;color:var(--red);">Absent</div>
      </div>
    </div>
    <div style="font-size:13px;margin-bottom:4px;"><strong>Date:</strong> ${s.date}</div>
    <div style="font-size:13px;margin-bottom:4px;"><strong>Class:</strong> ${s.class}</div>
    <div style="font-size:13px;margin-bottom:4px;"><strong>Topic:</strong> ${s.topic || '—'}</div>
    <div style="font-size:13px;margin-bottom:16px;"><strong>Notes:</strong> ${s.notes || '—'}</div>
    ${total ? `
    <div style="margin-bottom:16px;">
      <div style="font-size:13px;font-weight:700;margin-bottom:8px;color:var(--green);">✅ Present (${present.length})</div>
      <div>${makeList(present, '#16a34a')}</div>
    </div>
    <div style="margin-bottom:16px;">
      <div style="font-size:13px;font-weight:700;margin-bottom:8px;color:#f59e0b;">🕐 Late (${late.length})</div>
      <div>${makeList(late, '#f59e0b')}</div>
    </div>
    <div>
      <div style="font-size:13px;font-weight:700;margin-bottom:8px;color:var(--red);">❌ Absent (${absent.length})</div>
      <div>${makeList(absent, '#dc2626')}</div>
    </div>` : '<p style="color:var(--admin-text-muted);font-size:14px;">Session not yet closed. No records saved yet.</p>'}`;
  document.getElementById('viewSessionModal').classList.add('active');
}

// ============================================================
// CREATE SESSION
// ============================================================
async function openNewSessionModal() {
  const open = await DB.getOpenAttSession();
  document.getElementById('openSessionWarning').style.display = open ? 'block' : 'none';
  document.getElementById('newSessionModal').classList.add('active');
}

async function createSession() {
  const cls   = document.getElementById('nsClass').value;
  const date  = document.getElementById('nsDate').value;
  const topic = document.getElementById('nsTopic').value.trim();
  const notes = document.getElementById('nsNotes').value.trim();
  if (!cls)  return showToast('Please select a class.', 'error');
  if (!date) return showToast('Please select a date.', 'error');
  
  const openSession = await DB.getOpenAttSession();
  if (openSession) return showToast('Close the open session first.', 'error');

  const session = {
    id: generateId(),
    class: cls, date, topic, notes,
    status: 'open',
    round1Serials: [],
    round2Serials: [],
    createdAt: new Date().toISOString(),
  };
  await DB.addAttSession(session);
  await DB.addAdminLog(`Started attendance session: ${cls} on ${date}`, 'attendance');
  closeModal('newSessionModal');
  document.getElementById('nsTopic').value = '';
  document.getElementById('nsNotes').value = '';
  await refresh();
  showToast('Session started for ' + cls + ' on ' + date, 'success');
}

// ============================================================
// DELETE SESSION
// ============================================================
async function deleteSession(id) {
  const sessions = await DB.getAttSessions();
  const session = sessions.find(s => s.id === id);
  if (!session) return;
  authorizeAction(async () => {
    await DB.deleteAttSession(id);
    await DB.deleteRecordsBySession(id);
    await DB.addAdminLog(`Deleted attendance session: ${session.date} (${session.class})`, 'attendance');
    await refresh();
    showToast('Session deleted.', 'info');
  });
}

// ============================================================
// EDIT REQUESTS
// ============================================================
async function renderPendingEditsBanner() {
  const pending = await DB.getPendingEditReqs();
  const banner  = document.getElementById('pendingEditsBanner');
  if (!banner) return;
  if (pending.length) {
    banner.style.display = 'flex';
    document.getElementById('pendingEditsText').textContent =
      pending.length + ' Pending Edit Request' + (pending.length > 1 ? 's' : '');
  } else {
    banner.style.display = 'none';
  }
}

async function openEditReqModal(sessionId) {
  const sessions = await DB.getAttSessions();
  const closedSessions = sessions.filter(s => s.status === 'closed');
  const sel = document.getElementById('erSession');
  sel.innerHTML = closedSessions.map(s =>
    `<option value="${s.id}" ${s.id === sessionId ? 'selected' : ''}>${s.date} — ${s.class} — ${s.topic || 'No topic'}</option>`
  ).join('');
  document.getElementById('editReqModal').classList.add('active');
}

async function submitEditRequest() {
  const serial    = document.getElementById('erSerial').value.trim().toUpperCase();
  const sessionId = document.getElementById('erSession').value;
  const newStatus = document.getElementById('erNewStatus').value;
  const reason    = document.getElementById('erReason').value.trim();
  if (!serial || !sessionId || !reason) return showToast('All fields are required.', 'error');

  const student = await DB.findStudentBySN(serial);
  if (!student) return showToast('Serial number "' + serial + '" not found.', 'error');

  const records = await DB.getRecordsBySession(sessionId);
  const record = records.find(r => r.classSN === serial);
  if (!record) return showToast('No attendance record found for ' + serial + ' in this session.', 'error');

  await DB.addAttEditReq({
    id: generateId(),
    sessionId, recordId: record.id,
    classSN: serial, studentName: student.name,
    currentStatus: record.status, newStatus, reason,
    status: 'pending',
    requestedAt: new Date().toISOString(),
  });

  closeModal('editReqModal');
  document.getElementById('erSerial').value  = '';
  document.getElementById('erReason').value  = '';
  await refresh();
  showToast('Edit request submitted for review.', 'success');
}

async function openEditRequestsModal() {
  await renderEditRequestsList();
  document.getElementById('editRequestsModal').classList.add('active');
}

async function renderEditRequestsList() {
  const reqs = await DB.getPendingEditReqs();
  const el   = document.getElementById('editRequestsList');
  if (!reqs.length) {
    el.innerHTML = '<p style="text-align:center;color:var(--admin-text-muted);padding:24px;">No pending requests.</p>';
    return;
  }
  const sessions = await DB.getAttSessions();
  el.innerHTML = reqs.map(r => {
    const s = sessions.find(x => x.id === r.sessionId);
    const statusColors = { present: '#dcfce7', late: '#fef3c7', absent: '#fee2e2' };
    const statusText   = { present: '✅ Present', late: '🕐 Late', absent: '❌ Absent' };
    return `<div style="border:1.5px solid var(--admin-border);border-radius:10px;padding:16px;margin-bottom:12px;">
      <div style="display:flex;justify-content:space-between;align-items:flex-start;gap:12px;flex-wrap:wrap;">
        <div>
          <div style="font-size:14px;font-weight:700;">${r.studentName} <span style="font-family:monospace;background:#f3f4f6;padding:2px 6px;border-radius:4px;">${r.classSN}</span></div>
          <div style="font-size:12px;color:var(--admin-text-muted);margin-top:2px;">${s ? s.date + ' · ' + s.class : ''}</div>
          <div style="margin-top:8px;display:flex;align-items:center;gap:8px;">
            <span style="background:${statusColors[r.currentStatus]};padding:4px 10px;border-radius:6px;font-size:12px;font-weight:700;">${statusText[r.currentStatus]}</span>
            <span style="color:var(--admin-text-muted);">→</span>
            <span style="background:${statusColors[r.newStatus]};padding:4px 10px;border-radius:6px;font-size:12px;font-weight:700;">${statusText[r.newStatus]}</span>
          </div>
          <div style="font-size:13px;color:var(--admin-text-muted);margin-top:8px;"><strong>Reason:</strong> ${r.reason}</div>
        </div>
        <div style="display:flex;gap:8px;">
          <button class="btn btn-sm" onclick="resolveEditReq('${r.id}', 'approved')" style="background:#dcfce7;color:#16a34a;">✅ Approve</button>
          <button class="btn btn-sm" onclick="resolveEditReq('${r.id}', 'rejected')" style="background:#fee2e2;color:var(--red);">❌ Reject</button>
        </div>
      </div>
    </div>`;
  }).join('');
}

async function resolveEditReq(reqId, decision) {
  const reqs = await DB.getAttEditReqs();
  const req = reqs.find(r => r.id === reqId);
  if (!req) return;
  await DB.updateAttEditReq(reqId, { status: decision, resolvedAt: new Date().toISOString() });
  if (decision === 'approved') {
    await DB.updateAttRecord(req.recordId, { status: req.newStatus });
    await DB.addAdminLog(`Approved attendance edit request for student ${req.classSN} in session on date ${req.requestedAt.split('T')[0]}`, 'attendance');
    showToast('Edit approved — record updated to "' + req.newStatus + '".', 'success');
  } else {
    await DB.addAdminLog(`Rejected attendance edit request for student ${req.classSN}`, 'attendance');
    showToast('Edit request rejected.', 'info');
  }
  await renderEditRequestsList();
  await refresh();
}

// ============================================================
// EXPORT CSV
// ============================================================
async function exportSessionCSV(sessionId) {
  const sessions = await DB.getAttSessions();
  const s       = sessions.find(x => x.id === sessionId);
  const records = await DB.getRecordsBySession(sessionId);
  if (!records.length) return showToast('No records to export (session not closed yet).', 'error');
  exportCSV(
    'attendance_' + (s ? s.date + '_' + s.class.replace(' ','') : sessionId) + '.csv',
    ['Date','Class','Serial No.','Name','Email','Status','Topic'],
    records.map(r => [r.date, r.class, r.classSN, r.studentName, r.email, r.status, s ? s.topic || '' : ''])
  );
  showToast('Session exported!', 'success');
}

async function exportAllCSV() {
  const records  = await DB.getAttRecords();
  const sessions = await DB.getAttSessions();
  if (!records.length) return showToast('No attendance records to export.', 'error');
  exportCSV(
    'all_attendance.csv',
    ['Date','Class','Serial No.','Name','Email','Status','Topic','Session Status'],
    records.map(r => {
      const s = sessions.find(x => x.id === r.sessionId);
      return [r.date, r.class, r.classSN, r.studentName, r.email, r.status, s ? s.topic || '' : '', s ? s.status : ''];
    })
  );
  showToast('All attendance exported!', 'success');
}

// ============================================================
// IMPORT ATTENDANCE CSV
// ============================================================
function openImportModal() {
  document.getElementById('importAttModal').classList.add('active');
}

async function importAttendanceCSV() {
  const file = document.getElementById('attCsvFile').files[0];
  if (!file) return showToast('Please select a CSV file.', 'error');
  const reader = new FileReader();
  reader.onload = async (e) => {
    const lines = e.target.result.split('\n').filter(l => l.trim());
    let imported = 0;
    
    // We run the imports sequentially or gather all records to do them efficiently
    for (let i = 0; i < lines.length; i++) {
      if (i === 0) continue; // skip header
      const parts = lines[i].split(',').map(p => p.trim().replace(/^"|"$/g, ''));
      const [date, cls, serialsPresent, serialsLate, topic, notes] = parts;
      if (!date || !cls) continue;
      
      const session = {
        id: generateId(),
        class: cls, date,
        topic: topic || '', notes: notes || '',
        status: 'closed',
        round1Serials: serialsPresent ? serialsPresent.toUpperCase().split(/\s+/).filter(Boolean) : [],
        round2Serials: serialsLate    ? serialsLate.toUpperCase().split(/\s+/).filter(Boolean) : [],
        createdAt: new Date().toISOString(),
        closedAt: new Date().toISOString(),
        importedFromCSV: true,
      };
      
      await DB.addAttSession(session);

      // Build records
      const students = await getSessionStudents(session);
      const r1 = session.round1Serials, r2 = session.round2Serials;
      const records = students.map(s => ({
        id: generateId(),
        sessionId: session.id, date: session.date,
        studentId: s.id, studentName: s.name,
        email: s.email, class: s.class, classSN: s.classSN,
        status: r1.includes((s.classSN||'').toUpperCase()) ? 'present'
              : r2.includes((s.classSN||'').toUpperCase()) ? 'late' : 'absent',
      }));
      await DB.addAttRecords(records);
      imported++;
    }
    
    closeModal('importAttModal');
    await DB.addAdminLog(`Imported ${imported} attendance sessions from CSV`, 'attendance');
    await refresh();
    showToast(imported + ' session(s) imported!', 'success');
  };
  reader.readAsText(file);
}

// ============================================================
// MODAL HELPERS
// ============================================================
function closeModal(id) { document.getElementById(id).classList.remove('active'); }

document.querySelectorAll('.modal-overlay').forEach(o =>
  o.addEventListener('click', e => { if (e.target === o) o.classList.remove('active'); })
);
