// ===== ADMIN ATTENDANCE REPORT JS =====
let sortCol = 'classSN';
let sortAsc = true;

let currentCachedSessions = [];
let currentCachedStudents = [];
let currentCachedRecords = [];

document.addEventListener('DOMContentLoaded', async () => {
  await requireAdmin();
  
  // Set default date range to last 30 days
  const today = new Date();
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(today.getDate() - 30);
  
  document.getElementById('dateTo').value = today.toISOString().split('T')[0];
  document.getElementById('dateFrom').value = thirtyDaysAgo.toISOString().split('T')[0];

  await renderAll();
});

async function renderAll() {
  try {
    currentCachedSessions = await DB.getAttSessions();
    currentCachedStudents = await DB.getStudents();
    currentCachedRecords = await DB.getAttRecords();
  } catch (err) {
    console.error("Error fetching attendance report data:", err);
    showToast("Failed to fetch attendance data.", "error");
    return;
  }
  
  renderSummaryStats(currentCachedSessions, currentCachedStudents, currentCachedRecords);
  renderSessionBreakdown(currentCachedSessions, currentCachedStudents, currentCachedRecords);
  renderStudentTable();
  renderCompare();
}

// ============================================================
// STATISTICS SUMMARY CARDS
// ============================================================
function renderSummaryStats(allSessions, allStudents, allRecords) {
  const classF = document.getElementById('classFilter').value;
  const fromF = document.getElementById('dateFrom').value;
  const toF = document.getElementById('dateTo').value;

  let sessions = allSessions.filter(s => s.status === 'closed');
  if (classF)   sessions = sessions.filter(s => s.class === classF || s.class === 'Joint');
  if (fromF)    sessions = sessions.filter(s => s.date >= fromF);
  if (toF)      sessions = sessions.filter(s => s.date <= toF);

  let records = [];
  sessions.forEach(s => {
    let recs = allRecords.filter(r => r.sessionId === s.id);
    if (classF) {
      recs = recs.filter(r => r.class === classF);
    }
    records.push(...recs);
  });

  const totalSessions = sessions.length;
  const totalRecords  = records.length;
  const presentCount  = records.filter(r => r.status === 'present').length;
  const lateCount     = records.filter(r => r.status === 'late').length;
  const absentCount    = records.filter(r => r.status === 'absent').length;

  const avgPresent = totalRecords ? Math.round((presentCount / totalRecords) * 100) : 0;
  const avgLate    = totalRecords ? Math.round((lateCount / totalRecords) * 100) : 0;
  const avgAbsent  = totalRecords ? Math.round((absentCount / totalRecords) * 100) : 0;

  document.getElementById('rs-sessions').textContent = totalSessions;
  document.getElementById('rs-present').textContent = avgPresent + '%';
  document.getElementById('rs-late').textContent    = avgLate + '%';
  document.getElementById('rs-absent').textContent  = avgAbsent + '%';
}

// ============================================================
// OVERVIEW TAB: SESSION BREAKDOWN LIST
// ============================================================
function renderSessionBreakdown(allSessions, allStudents, allRecords) {
  const classF = document.getElementById('classFilter').value;
  const fromF = document.getElementById('dateFrom').value;
  const toF = document.getElementById('dateTo').value;

  let sessions = allSessions.filter(s => s.status === 'closed');
  if (classF)   sessions = sessions.filter(s => s.class === classF || s.class === 'Joint');
  if (fromF)    sessions = sessions.filter(s => s.date >= fromF);
  if (toF)      sessions = sessions.filter(s => s.date <= toF);

  // Newest first
  sessions.sort((a, b) => b.date.localeCompare(a.date));

  const listEl = document.getElementById('sessionBreakdownList');
  if (!sessions.length) {
    listEl.innerHTML = '<div class="empty-state"><p>No session data available in this range.</p></div>';
    return;
  }

  listEl.innerHTML = sessions.map(s => {
    let recs = allRecords.filter(r => r.sessionId === s.id);
    if (classF) {
      recs = recs.filter(r => r.class === classF);
    }
    const totalCount = recs.length;
    const presCount  = recs.filter(r => r.status === 'present').length;
    const lateCount  = recs.filter(r => r.status === 'late').length;
    const absCount   = recs.filter(r => r.status === 'absent').length;

    const presPct = totalCount ? Math.round((presCount / totalCount) * 100) : 0;
    const latePct = totalCount ? Math.round((lateCount / totalCount) * 100) : 0;
    const absPct  = totalCount ? Math.round((absCount / totalCount) * 100) : 0;

    return `
      <div style="padding:16px 20px;border-bottom:1.5px solid var(--admin-border);transition:background 0.2s ease;">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;flex-wrap:wrap;gap:8px;">
          <div style="flex:1;">
            <span style="font-weight:700;color:var(--admin-text);font-size:14px;">${s.topic || 'Untitled Session'}</span>
            <span class="badge ${s.class === 'Joint' ? 'badge-orange' : s.class === 'Class A' ? 'badge-blue' : 'badge-purple'}" style="margin-left:8px;">${s.class}</span>
          </div>
          <div style="font-size:13px;color:var(--admin-text-muted);font-weight:600;">${s.date}</div>
        </div>
        <div style="display:flex;height:20px;border-radius:10px;overflow:hidden;background:#e5e7eb;box-shadow:inset 0 1px 2px rgba(0,0,0,0.1);">
          ${presPct ? `<div style="width:${presPct}%;background:var(--green);color:#fff;text-align:center;font-size:11px;font-weight:700;line-height:20px;" title="Present: ${presCount}">${presPct}%</div>` : ''}
          ${latePct ? `<div style="width:${latePct}%;background:#f59e0b;color:#fff;text-align:center;font-size:11px;font-weight:700;line-height:20px;" title="Late: ${lateCount}">${latePct}%</div>` : ''}
          ${absPct  ? `<div style="width:${absPct}%;background:var(--red);color:#fff;text-align:center;font-size:11px;font-weight:700;line-height:20px;" title="Absent: ${absCount}">${absPct}%</div>` : ''}
        </div>
        <div style="display:flex;justify-content:space-between;font-size:12px;margin-top:6px;color:var(--admin-text-muted);">
          <span>✅ Present: <strong>${presCount}</strong></span>
          <span>🕐 Late: <strong>${lateCount}</strong></span>
          <span>❌ Absent: <strong>${absCount}</strong></span>
          <span>Total Records: <strong>${totalCount}</strong></span>
        </div>
      </div>
    `;
  }).join('');
}

// ============================================================
// PER-STUDENT TAB: TABLE
// ============================================================
function renderStudentTable() {
  const classF = document.getElementById('classFilter').value;
  const fromF = document.getElementById('dateFrom').value;
  const toF = document.getElementById('dateTo').value;

  let sessions = currentCachedSessions.filter(s => s.status === 'closed');
  if (classF)   sessions = sessions.filter(s => s.class === classF || s.class === 'Joint');
  if (fromF)    sessions = sessions.filter(s => s.date >= fromF);
  if (toF)      sessions = sessions.filter(s => s.date <= toF);

  let students = currentCachedStudents;
  if (classF)   students = students.filter(s => s.class === classF);

  let studentsData = students.map(student => {
    const studentRecords = currentCachedRecords.filter(r => r.email === student.email && sessions.some(s => s.id === r.sessionId));
    const total = studentRecords.length;
    const present = studentRecords.filter(r => r.status === 'present').length;
    const late = studentRecords.filter(r => r.status === 'late').length;
    const absent = studentRecords.filter(r => r.status === 'absent').length;
    
    const pct = total ? Math.round((present / total) * 100) : 0;
    const latePct = total ? Math.round((late / total) * 100) : 0;
    const absPct = total ? Math.round((absent / total) * 100) : 0;

    let standing = 'poor';
    if (pct >= 75) standing = 'good';
    else if (pct >= 50) standing = 'risk';

    return {
      student,
      classSN: student.classSN || '',
      studentName: student.name || '',
      email: student.email || '',
      class: student.class || '',
      total,
      present,
      late,
      absent,
      pct,
      latePct,
      absPct,
      standing
    };
  });

  // Apply search filter
  const searchQ = document.getElementById('studentSearch').value.trim().toLowerCase();
  if (searchQ) {
    studentsData = studentsData.filter(x =>
      x.studentName.toLowerCase().includes(searchQ) ||
      x.email.toLowerCase().includes(searchQ) ||
      x.classSN.toLowerCase().includes(searchQ)
    );
  }

  // Apply standing filter
  const standingF = document.getElementById('standingFilter').value;
  if (standingF) {
    studentsData = studentsData.filter(x => x.standing === standingF);
  }

  // Apply sorting
  studentsData.sort((a, b) => {
    let valA = a[sortCol];
    let valB = b[sortCol];
    let cmp = 0;

    if (sortCol === 'classSN') {
      cmp = naturalSort(valA, valB);
    } else if (typeof valA === 'string') {
      cmp = valA.localeCompare(valB);
    } else {
      cmp = valA - valB;
    }
    return sortAsc ? cmp : -cmp;
  });

  const tbody = document.getElementById('studentReportBody');
  if (!tbody) return;
  if (!studentsData.length) {
    tbody.innerHTML = '<tr><td colspan="12"><div class="empty-state"><p>No student data found matching filters.</p></div></td></tr>';
    return;
  }

  tbody.innerHTML = studentsData.map(x => {
    const standingBadge = x.standing === 'good'
      ? '<span class="badge" style="background:#dcfce7;color:#16a34a;font-weight:700;">🟢 Good</span>'
      : x.standing === 'risk'
        ? '<span class="badge" style="background:#fef3c7;color:#d97706;font-weight:700;">🟡 At Risk</span>'
        : '<span class="badge" style="background:#fee2e2;color:#dc2626;font-weight:700;">🔴 Poor</span>';

    return `
      <tr>
        <td style="font-family:monospace;font-weight:700;">${x.classSN || '—'}</td>
        <td><strong>${x.studentName}</strong></td>
        <td><span class="badge badge-purple">${x.class}</span></td>
        <td>${x.total}</td>
        <td><strong style="color:var(--green);">${x.present}</strong></td>
        <td><strong style="color:#f59e0b;">${x.late}</strong></td>
        <td><strong style="color:var(--red);">${x.absent}</strong></td>
        <td><strong>${x.pct}%</strong></td>
        <td style="color:#f59e0b;">${x.latePct}%</td>
        <td style="color:var(--red);">${x.absPct}%</td>
        <td>${standingBadge}</td>
        <td>
          <button class="btn btn-outline btn-sm" onclick="viewStudentDetails('${x.email}')" style="padding:2px 8px;font-size:12px;">👁️ Details</button>
        </td>
      </tr>
    `;
  }).join('');
}

function sortBy(col) {
  if (sortCol === col) {
    sortAsc = !sortAsc;
  } else {
    sortCol = col;
    sortAsc = true;
  }
  renderStudentTable();
}

function naturalSort(a, b) {
  const regex = /^([A-Z]+)(\d+)$/;
  const matchA = String(a).toUpperCase().match(regex);
  const matchB = String(b).toUpperCase().match(regex);
  if (matchA && matchB) {
    if (matchA[1] !== matchB[1]) {
      return matchA[1].localeCompare(matchB[1]);
    }
    return parseInt(matchA[2], 10) - parseInt(matchB[2], 10);
  }
  return String(a).localeCompare(String(b), undefined, { numeric: true, sensitivity: 'base' });
}

// ============================================================
// STUDENT ATTENDANCE MODAL DETAILS
// ============================================================
function viewStudentDetails(email) {
  const student = currentCachedStudents.find(s => s.email === email);
  if (!student) return;
  
  const activeSessions = currentCachedSessions.filter(s => s.status === 'closed');
  const studentRecords = currentCachedRecords.filter(r => r.email === email && activeSessions.some(s => s.id === r.sessionId));

  const total = studentRecords.length;
  const present = studentRecords.filter(r => r.status === 'present').length;
  const late = studentRecords.filter(r => r.status === 'late').length;
  const absent = studentRecords.filter(r => r.status === 'absent').length;
  
  const pct = total ? Math.round((present / total) * 100) : 0;
  const latePct = total ? Math.round((late / total) * 100) : 0;
  const absPct = total ? Math.round((absent / total) * 100) : 0;

  document.getElementById('studentAttModalTitle').textContent = `Attendance Card: ${student.name}`;

  let html = `
    <div style="display:flex;gap:16px;align-items:center;margin-bottom:20px;border-bottom:1.5px solid var(--admin-border);padding-bottom:16px;">
      <div>
        <div style="font-size:18px;font-weight:800;color:var(--admin-text);">${student.name}</div>
        <div style="font-size:13px;color:var(--admin-text-muted);margin-top:2px;">${student.email} · Class: <strong>${student.class}</strong> · S/N: <strong>${student.classSN || '—'}</strong></div>
      </div>
    </div>
    <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:12px;margin-bottom:20px;">
      <div style="background:#f3f4f6;border-radius:10px;padding:12px;text-align:center;">
        <div style="font-size:24px;font-weight:900;color:var(--admin-text);">${total}</div>
        <div style="font-size:11px;font-weight:600;color:var(--admin-text-muted);">Sessions</div>
      </div>
      <div style="background:#dcfce7;border-radius:10px;padding:12px;text-align:center;">
        <div style="font-size:24px;font-weight:900;color:#16a34a;">${present}</div>
        <div style="font-size:11px;font-weight:600;color:#16a34a;">Present (${pct}%)</div>
      </div>
      <div style="background:#fef3c7;border-radius:10px;padding:12px;text-align:center;">
        <div style="font-size:24px;font-weight:900;color:#92400e;">${late}</div>
        <div style="font-size:11px;font-weight:600;color:#92400e;">Late (${latePct}%)</div>
      </div>
      <div style="background:#fee2e2;border-radius:10px;padding:12px;text-align:center;">
        <div style="font-size:24px;font-weight:900;color:var(--red);">${absent}</div>
        <div style="font-size:11px;font-weight:600;color:var(--red);">Absent (${absPct}%)</div>
      </div>
    </div>
    <div style="font-weight:700;font-size:14px;margin-bottom:10px;color:var(--admin-text);">Session history breakdown</div>
    <div style="max-height:280px;overflow-y:auto;border:1.5px solid var(--admin-border);border-radius:8px;">
      <table style="width:100%;border-collapse:collapse;margin:0;">
        <thead>
          <tr style="background:#f9fafb;border-bottom:1.5px solid var(--admin-border);position:sticky;top:0;">
            <th style="padding:10px;text-align:left;font-size:12px;font-weight:700;color:var(--admin-text);">Date</th>
            <th style="padding:10px;text-align:left;font-size:12px;font-weight:700;color:var(--admin-text);">Session Class</th>
            <th style="padding:10px;text-align:left;font-size:12px;font-weight:700;color:var(--admin-text);">Topic</th>
            <th style="padding:10px;text-align:center;font-size:12px;font-weight:700;color:var(--admin-text);">Status</th>
          </tr>
        </thead>
        <tbody>
  `;

  if (!studentRecords.length) {
    html += `<tr><td colspan="4" style="padding:20px;text-align:center;color:var(--admin-text-muted);font-size:13px;">No history recorded yet.</td></tr>`;
  } else {
    // Sort newest first
    studentRecords.sort((a,b) => b.date.localeCompare(a.date));
    studentRecords.forEach(r => {
      const s = activeSessions.find(x => x.id === r.sessionId);
      const statusColors = { present: '#16a34a', late: '#d97706', absent: '#dc2626' };
      const statusBgs = { present: '#dcfce7', late: '#fef3c7', absent: '#fee2e2' };
      const statusLabels = { present: 'Present', late: 'Late', absent: 'Absent' };

      html += `
        <tr style="border-bottom:1px solid var(--admin-border);">
          <td style="padding:10px;font-size:13px;font-weight:600;">${r.date}</td>
          <td style="padding:10px;font-size:12px;"><span class="badge ${s && s.class === 'Joint' ? 'badge-orange' : 'badge-blue'}">${s ? s.class : '—'}</span></td>
          <td style="padding:10px;font-size:12px;color:var(--admin-text-muted);max-width:180px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;" title="${s ? s.topic || '' : ''}">${s ? s.topic || '—' : '—'}</td>
          <td style="padding:10px;text-align:center;">
            <span class="badge" style="background:${statusBgs[r.status]};color:${statusColors[r.status]};font-weight:700;font-size:11px;">${statusLabels[r.status]}</span>
          </td>
        </tr>
      `;
    });
  }

  html += `
        </tbody>
      </table>
    </div>
  `;

  document.getElementById('studentAttModalContent').innerHTML = html;
  document.getElementById('studentAttModal').classList.add('active');
}

// ============================================================
// CLASS COMPARISON TAB: ANALYTICS
// ============================================================
function renderCompare() {
  const fromF = document.getElementById('dateFrom').value;
  const toF = document.getElementById('dateTo').value;

  let sessions = currentCachedSessions.filter(s => s.status === 'closed');
  if (fromF) sessions = sessions.filter(s => s.date >= fromF);
  if (toF)   sessions = sessions.filter(s => s.date <= toF);

  const renderClassCompare = (classLabel, elementId) => {
    const students = currentCachedStudents.filter(s => s.class === classLabel);
    let records = [];
    sessions.forEach(s => {
      const recs = currentCachedRecords.filter(r => r.sessionId === s.id && r.class === classLabel);
      records.push(...recs);
    });

    const total = records.length;
    const present = records.filter(r => r.status === 'present').length;
    const late = records.filter(r => r.status === 'late').length;
    const absent = records.filter(r => r.status === 'absent').length;

    const pct = total ? Math.round((present / total) * 100) : 0;
    const latePct = total ? Math.round((late / total) * 100) : 0;
    const absPct = total ? Math.round((absent / total) * 100) : 0;

    const el = document.getElementById(elementId);
    if (!el) return;
    if (!total) {
      el.innerHTML = `
        <div style="padding:20px;text-align:center;">
          <h3 style="margin-bottom:12px;color:var(--admin-text);">${classLabel}</h3>
          <div class="empty-state"><p>No session data recorded in this period.</p></div>
        </div>`;
      return;
    }

    el.innerHTML = `
      <div style="padding:20px;">
        <h3 style="margin-top:0;margin-bottom:4px;font-size:18px;font-weight:800;color:var(--admin-text);">${classLabel}</h3>
        <div style="color:var(--admin-text-muted);font-size:13px;margin-bottom:20px;">
          ${students.length} students · ${total} records across matching sessions
        </div>
        
        <div style="display:flex;align-items:baseline;gap:8px;margin-bottom:12px;">
          <span style="font-size:48px;font-weight:900;color:${pct>=75?'#16a34a':pct>=50?'#f59e0b':'#dc2626'};">${pct}%</span>
          <span style="font-size:14px;color:var(--admin-text-muted);font-weight:600;">Avg Attendance</span>
        </div>

        <div style="height:12px;background:#f3f4f6;border-radius:6px;overflow:hidden;margin-bottom:24px;">
          <div style="height:100%;width:${pct}%;background:${pct>=75?'#16a34a':pct>=50?'#f59e0b':'#dc2626'};border-radius:6px;"></div>
        </div>

        <div style="font-weight:700;font-size:13px;margin-bottom:12px;color:var(--admin-text);">Breakdown Analytics</div>
        
        <div style="margin-bottom:12px;">
          <div style="display:flex;justify-content:space-between;font-size:12px;margin-bottom:4px;">
            <span>✅ Present (${present} times)</span>
            <strong>${pct}%</strong>
          </div>
          <div style="height:6px;background:#f3f4f6;border-radius:3px;overflow:hidden;">
            <div style="height:100%;width:${pct}%;background:var(--green);border-radius:3px;"></div>
          </div>
        </div>

        <div style="margin-bottom:12px;">
          <div style="display:flex;justify-content:space-between;font-size:12px;margin-bottom:4px;">
            <span>🕐 Late (${late} times)</span>
            <strong>${latePct}%</strong>
          </div>
          <div style="height:6px;background:#f3f4f6;border-radius:3px;overflow:hidden;">
            <div style="height:100%;width:${latePct}%;background:#f59e0b;border-radius:3px;"></div>
          </div>
        </div>

        <div style="margin-bottom:12px;">
          <div style="display:flex;justify-content:space-between;font-size:12px;margin-bottom:4px;">
            <span>❌ Absent (${absent} times)</span>
            <strong>${absPct}%</strong>
          </div>
          <div style="height:6px;background:#f3f4f6;border-radius:3px;overflow:hidden;">
            <div style="height:100%;width:${absPct}%;background:var(--red);border-radius:3px;"></div>
          </div>
        </div>
      </div>`;
  };

  renderClassCompare('Class A', 'compareA');
  renderClassCompare('Class B', 'compareB');
}

// ============================================================
// EXPORT SUMMARY CSV
// ============================================================
function exportSummaryCSV() {
  const fromF = document.getElementById('dateFrom').value;
  const toF = document.getElementById('dateTo').value;
  const classF = document.getElementById('classFilter').value;

  let sessions = currentCachedSessions.filter(s => s.status === 'closed');
  if (classF)   sessions = sessions.filter(s => s.class === classF || s.class === 'Joint');
  if (fromF)    sessions = sessions.filter(s => s.date >= fromF);
  if (toF)      sessions = sessions.filter(s => s.date <= toF);

  let students = currentCachedStudents;
  if (classF)   students = students.filter(s => s.class === classF);

  const rows = students.map(student => {
    const studentRecords = currentCachedRecords.filter(r => r.email === student.email && sessions.some(s => s.id === r.sessionId));
    const total = studentRecords.length;
    const present = studentRecords.filter(r => r.status === 'present').length;
    const late = studentRecords.filter(r => r.status === 'late').length;
    const absent = studentRecords.filter(r => r.status === 'absent').length;
    const pct = total ? Math.round((present / total) * 100) : 0;
    
    return [
      student.name,
      student.email,
      student.class,
      student.classSN || '',
      total,
      present,
      late,
      absent,
      pct + '%'
    ];
  });

  exportCSV(
    'attendance_report_summary.csv',
    ['Name', 'Email', 'Class', 'Serial No.', 'Total Sessions', 'Present', 'Late', 'Absent', 'Attendance %'],
    rows
  );
  showToast('Summary CSV exported successfully.', 'success');
}

// ============================================================
// TABS SWITCHING
// ============================================================
function switchTab(tabId) {
  ['overview', 'students', 'compare'].forEach(t => {
    const btn = document.getElementById('tab-' + t);
    const panel = document.getElementById('panel-' + t);
    if (btn) btn.classList.toggle('active', t === tabId);
    if (panel) panel.style.display = t === tabId ? 'block' : 'none';
  });
  if (tabId === 'compare') {
    renderCompare();
  }
}
