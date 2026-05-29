// Admin Results JS — Supabase async version
document.addEventListener('DOMContentLoaded', async () => {
  await requireAdmin();
  await renderResults();
});

async function renderResults() {
  const q   = document.getElementById('searchInput').value.toLowerCase();
  const cl  = document.getElementById('classFilter').value;
  const st  = document.getElementById('statusFilter').value;
  let results = await DB.getResults();
  const all   = results;

  // Always sort ALL results descending by percentage first
  const allSorted = [...all].sort((a, b) => b.percentage - a.percentage);

  // Render Top 5 leaderboard from the full unfiltered set
  renderTop5(allSorted);

  // Now apply filters for the table
  if (q)  results = results.filter(r => r.studentName?.toLowerCase().includes(q) || r.email?.toLowerCase().includes(q));
  if (cl) results = results.filter(r => r.class === cl);
  if (st) results = results.filter(r => st === 'pass' ? r.percentage >= 50 : r.percentage < 50);

  // Sort filtered results descending by score
  results.sort((a, b) => b.percentage - a.percentage);

  document.getElementById('resultCountLabel').textContent = `${all.length} total submission${all.length !== 1 ? 's' : ''}`;
  document.getElementById('rs-total').textContent = all.length;

  if (all.length) {
    const avg  = Math.round(all.reduce((s,r) => s + r.percentage, 0) / all.length);
    const high = Math.max(...all.map(r => r.percentage));
    const pass = Math.round((all.filter(r => r.percentage >= 50).length / all.length) * 100);
    document.getElementById('rs-avg').textContent  = avg + '%';
    document.getElementById('rs-high').textContent = high + '%';
    document.getElementById('rs-pass').textContent = pass + '%';
  } else {
    ['rs-avg','rs-high','rs-pass'].forEach(id => document.getElementById(id).textContent = '0%');
  }

  const tbody = document.getElementById('resultsTableBody');
  if (!results.length) {
    tbody.innerHTML = `<tr><td colspan="12"><div class="empty-state"><p>No results found.</p></div></td></tr>`;
    return;
  }

  // Build global rank map (based on full sorted list, not filtered)
  const rankMap = {};
  allSorted.forEach((r, i) => { rankMap[r.id] = i + 1; });

  tbody.innerHTML = results.map(r => {
    const pass  = r.percentage >= 50;
    const grade = getGrade(r.percentage);
    const timeTaken  = r.timeTaken  ? formatTime(r.timeTaken)  : '—';
    const submitted  = r.submittedAt ? new Date(r.submittedAt).toLocaleString() : '—';

    let triggerBadge = '<span class="badge badge-green">Voluntary</span>';
    if (r.reason === 'Time expired') {
      triggerBadge = '<span class="badge badge-orange">Time Expired</span>';
    } else if (r.reason && r.reason.toLowerCase().includes('violations')) {
      triggerBadge = '<span class="badge badge-red" style="font-weight:700;">Violations</span>';
    } else if (r.reason) {
      triggerBadge = `<span class="badge badge-gray">${r.reason}</span>`;
    }

    return `
    <tr>
      <td><strong>${r.studentName || r.email}</strong><br><span style="font-size:12px;color:var(--admin-text-muted);">${r.email}</span></td>
      <td><span class="badge badge-purple">${r.class || '—'}</span></td>
      <td>${r.score} / ${r.total}</td>
      <td style="font-weight:700;color:${pass?'var(--green)':'var(--red)'};">${r.percentage}%</td>
      <td><span class="badge ${pass?'badge-green':'badge-red'}">${grade}</span></td>
      <td><span class="badge ${pass?'badge-green':'badge-red'}">${pass?'PASS':'FAIL'}</span></td>
      <td>${r.violations || 0}</td>
      <td>${timeTaken}</td>
      <td>${triggerBadge}</td>
      <td style="font-size:12px;">${submitted}</td>
      <td>
        <button class="icon-btn view" onclick="viewResult('${r.id}')" title="View">👁️</button>
      </td>
    </tr>`;
  }).join('');
}

function renderTop5(allSorted) {
  const panel = document.getElementById('top5Panel');
  if (!panel) return;
  const top5 = allSorted.slice(0, 5);
  if (!top5.length) {
    panel.innerHTML = '<div class="empty-state" style="padding:20px;"><p>No submissions yet.</p></div>';
    return;
  }
  const medals = ['🥇','🥈','🥉','4️⃣','5️⃣'];
  const medalColors = ['#f59e0b','#9ca3af','#b45309','#6366f1','#06b6d4'];
  const medalBg    = ['#fffbeb','#f9fafb','#fdf4e7','#eef2ff','#ecfeff'];
  panel.innerHTML = top5.map((r, i) => {
    const pass = r.percentage >= 50;
    const grade = getGrade(r.percentage);
    return `
    <div style="display:flex;align-items:center;gap:14px;padding:12px 16px;border-radius:12px;background:${medalBg[i]};border:2px solid ${medalColors[i]}20;margin-bottom:8px;">
      <div style="font-size:28px;flex-shrink:0;">${medals[i]}</div>
      <div style="flex:1;min-width:0;">
        <div style="font-weight:700;font-size:14px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${r.studentName || r.email}</div>
        <div style="font-size:12px;color:var(--admin-text-muted);">${r.class || '—'} · ${r.email}</div>
      </div>
      <div style="text-align:right;flex-shrink:0;">
        <div style="font-size:22px;font-weight:900;color:${pass ? 'var(--green)' : 'var(--red)'}">${r.percentage}%</div>
        <div style="font-size:12px;color:var(--admin-text-muted);">${r.score}/${r.total} · Grade ${grade}</div>
      </div>
    </div>`;
  }).join('');
}

async function viewResult(id) {
  const results = await DB.getResults();
  const r = results.find(x => x.id === id);
  if (!r) return;
  const pass = r.percentage >= 50;
  const cfg  = await DB.getConfig();
  let answersHtml = '';
  if (cfg.showCorrectAnswers && r.answers && r.questions) {
    answersHtml = `
      <div style="margin-top:20px;">
        <div style="font-size:14px;font-weight:700;margin-bottom:12px;">Answers Review</div>
        ${r.questions.map((q, i) => {
          const userAns = r.answers[q.id];
          const correct = q.answer;
          const type = String(q.type).trim().toLowerCase();
          let isCorrect = false;
          if (userAns !== undefined && userAns !== null && userAns !== '' &&
              correct !== undefined && correct !== null && correct !== '') {
            if (type === 'mcq')       isCorrect = parseInt(userAns) === parseInt(correct);
            else if (type === 'truefalse') isCorrect = String(userAns).trim().toLowerCase() === String(correct).trim().toLowerCase();
            else if (type === 'fill') isCorrect = String(userAns).trim().toLowerCase() === String(correct).trim().toLowerCase();
            else                      isCorrect = true; // subjective
          }
          return `<div style="padding:8px 12px;border-radius:8px;margin-bottom:6px;border:1.5px solid ${isCorrect?'#86efac':'#fca5a5'};background:${isCorrect?'#f0fdf4':'#fff5f5'};">
            <div style="font-size:12px;font-weight:600;color:var(--admin-text-muted);">Q${i+1} — ${q.type.toUpperCase()}</div>
            <div style="font-size:13px;margin:4px 0;">${q.text}</div>
            <div style="font-size:12px;color:${isCorrect?'var(--green)':'var(--red)'};">${isCorrect?'✅ Correct':'❌ Wrong'} ${!isCorrect?'— Correct: '+correct:''}</div>
          </div>`;
        }).join('')}
      </div>`;
  }
  document.getElementById('viewResultContent').innerHTML = `
    <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:12px;margin-bottom:20px;">
      <div style="background:${pass?'#dcfce7':'#fee2e2'};border-radius:10px;padding:14px;text-align:center;">
        <div style="font-size:26px;font-weight:900;color:${pass?'var(--green)':'var(--red)'};">${r.percentage}%</div>
        <div style="font-size:12px;color:var(--admin-text-muted);">Score</div>
      </div>
      <div style="background:#f8fafc;border-radius:10px;padding:14px;text-align:center;">
        <div style="font-size:26px;font-weight:900;">${r.score}/${r.total}</div>
        <div style="font-size:12px;color:var(--admin-text-muted);">Correct</div>
      </div>
      <div style="background:#f8fafc;border-radius:10px;padding:14px;text-align:center;">
        <div style="font-size:26px;font-weight:900;">${r.violations||0}</div>
        <div style="font-size:12px;color:var(--admin-text-muted);">Violations</div>
      </div>
    </div>
    <div style="font-size:14px;margin-bottom:4px;"><strong>Student:</strong> ${r.studentName||'—'}</div>
    <div style="font-size:14px;margin-bottom:4px;"><strong>Email:</strong> ${r.email}</div>
    <div style="font-size:14px;margin-bottom:4px;"><strong>Class:</strong> ${r.class||'—'}</div>
    <div style="font-size:14px;margin-bottom:4px;"><strong>Submission Trigger:</strong> <span style="font-weight:700;">${r.reason || 'voluntary'}</span></div>
    <div style="font-size:14px;margin-bottom:4px;"><strong>Time Taken:</strong> ${r.timeTaken ? formatTime(r.timeTaken) : '—'}</div>
    <div style="font-size:14px;"><strong>Submitted:</strong> ${r.submittedAt ? new Date(r.submittedAt).toLocaleString() : '—'}</div>
    ${answersHtml}
  `;
  document.getElementById('viewModal').classList.add('active');
}

async function exportResultsCSV() {
  const results = await DB.getResults();
  if (!results.length) return showToast('No results to export.', 'error');
  exportCSV('exam_results.csv',
    ['Student','Email','Class','Score','Total','Percentage','Grade','Status','Violations','Time','Submitted','Trigger'],
    results.map(r => [
      r.studentName||'', r.email, r.class||'', r.score, r.total, r.percentage+'%',
      getGrade(r.percentage), r.percentage>=50?'Pass':'Fail',
      r.violations||0, r.timeTaken?formatTime(r.timeTaken):'', r.submittedAt||'', r.reason||'voluntary'
    ])
  );
  showToast('Results exported!', 'success');
}

document.querySelectorAll('.modal-overlay').forEach(o => o.addEventListener('click', e => { if (e.target === o) o.classList.remove('active'); }));
