// Admin Questions JS — Supabase async version
let parsedQuestions = [];

document.addEventListener('DOMContentLoaded', async () => {
  await requirePermission('Questions');
  await renderQuestions();
});

const TYPE_LABELS  = { mcq:'MCQ', truefalse:'TRUEFALSE', fill:'FILL', short:'SHORT', code:'CODE' };
const TYPE_COLORS  = { mcq:'badge-blue', truefalse:'badge-green', fill:'badge-purple', short:'badge-orange', code:'badge-gray' };
const LEVEL_COLORS = { easy:'badge-green', medium:'badge-orange', hard:'badge-red' };

async function renderQuestions() {
  const q   = document.getElementById('searchInput').value.toLowerCase();
  const tp  = document.getElementById('typeFilter').value;
  const lvl = document.getElementById('levelFilter').value;
  let questions = await DB.getQuestions();
  const all = questions;

  if (q)   questions = questions.filter(x => x.text.toLowerCase().includes(q));
  if (tp)  questions = questions.filter(x => x.type === tp);
  if (lvl) questions = questions.filter(x => x.level === lvl);

  document.getElementById('qCountLabel').textContent = `${all.length} total questions`;

  const types = ['mcq','truefalse','fill','short','code'];
  const summaryColors = { mcq:'#dbeafe', truefalse:'#dcfce7', fill:'#ede9fe', short:'#ffedd5', code:'#f3f4f6' };
  document.getElementById('typeSummary').innerHTML = types.map(t => `
    <div style="background:${summaryColors[t]};border-radius:12px;padding:16px;text-align:center;">
      <div style="font-size:24px;font-weight:900;color:var(--admin-text);">${all.filter(x=>x.type===t).length}</div>
      <div style="font-size:11px;font-weight:700;color:var(--admin-text-muted);margin-top:4px;">${TYPE_LABELS[t]}</div>
    </div>
  `).join('');

  const list = document.getElementById('questionList');
  if (!questions.length) {
    list.innerHTML = `<div class="card"><div class="empty-state"><p>No questions found.</p></div></div>`;
    return;
  }
  list.innerHTML = questions.map((q, i) => `
    <div class="question-item">
      <div style="flex:1;">
        <div class="question-meta">
          <span class="question-num">Q${i+1}</span>
          <span class="badge ${TYPE_COLORS[q.type]}">${TYPE_LABELS[q.type]}</span>
          <span class="badge ${LEVEL_COLORS[q.level]}">${q.level}</span>
          <span class="badge badge-gray">${q.section||''}</span>
        </div>
        <div class="question-text">${q.text}</div>
      </div>
      <div class="question-actions">
        <button class="icon-btn view" onclick="viewQuestion('${q.id}')" title="View">👁️</button>
        <button class="icon-btn del"  onclick="deleteQuestion('${q.id}')" title="Delete">🗑️</button>
      </div>
    </div>
  `).join('');
}

async function viewQuestion(id) {
  const questions = await DB.getQuestions();
  const q = questions.find(x => x.id === id);
  if (!q) return;
  let extra = '';
  if (q.type === 'mcq' && q.options) {
    extra = `<div style="margin-top:12px;"><div style="font-size:12px;font-weight:700;color:var(--admin-text-muted);margin-bottom:8px;">OPTIONS</div>${q.options.map((o,i)=>`<div style="padding:8px 12px;border-radius:8px;margin-bottom:6px;background:${i===q.answer?'#dcfce7':'#f9fafb'};border:1.5px solid ${i===q.answer?'#86efac':'#e5e7eb'};font-size:14px;"><strong>${['A','B','C','D'][i]}.</strong> ${o}${i===q.answer?' ✅':''}</div>`).join('')}</div>`;
  }
  if (q.type === 'truefalse') {
    extra = `<div style="margin-top:12px;"><span style="background:${q.answer?'#dcfce7':'#fee2e2'};padding:6px 16px;border-radius:8px;font-weight:700;color:${q.answer?'#16a34a':'#dc2626'}">Answer: ${q.answer?'TRUE':'FALSE'}</span></div>`;
  }
  document.getElementById('viewModalContent').innerHTML = `
    <div style="display:flex;gap:8px;margin-bottom:14px;flex-wrap:wrap;">
      <span class="badge ${TYPE_COLORS[q.type]}">${TYPE_LABELS[q.type]}</span>
      <span class="badge ${LEVEL_COLORS[q.level]}">${q.level}</span>
      <span class="badge badge-gray">${q.section||''}</span>
    </div>
    <div style="font-size:16px;font-weight:600;color:var(--admin-text);line-height:1.6;">${q.text}</div>
    ${extra}
    ${['fill','short','code'].includes(q.type) ? `<div style="margin-top:14px;background:#f8fafc;border:1.5px solid #e5e7eb;border-radius:8px;padding:12px;"><div style="font-size:12px;font-weight:700;color:var(--admin-text-muted);margin-bottom:4px;">EXPECTED ANSWER</div><div style="font-size:14px;font-family:${q.type==='code'?'monospace':'inherit'};white-space:pre-wrap;">${q.answer}</div></div>` : ''}
  `;
  document.getElementById('viewModal').classList.add('active');
}

async function deleteQuestion(id) {
  const questions = await DB.getQuestions();
  const q = questions.find(x => x.id === id);
  if (!q) return;
  authorizeAction(async () => {
    await DB.deleteQuestion(id);
    await DB.addAdminLog(`Deleted question: "${q.text.slice(0, 40)}..."`, 'questions');
    await renderQuestions();
    showToast('Question deleted.', 'info');
  });
}

async function clearAll() {
  authorizeAction(async () => {
    showToast('Creating backup...', 'info');
    await triggerBackupDownload();
    await DB.setQuestions([]);
    await DB.addAdminLog('Cleared all questions from bank', 'questions');
    await renderQuestions();
    showToast('Question bank cleared and backup auto-downloaded.', 'info');
  });
}

async function exportBank() {
  const qs = await DB.getQuestions();
  if (!qs.length) return showToast('No questions to export.', 'error');
  const blob = new Blob([JSON.stringify(qs, null, 2)], { type: 'application/json' });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a'); a.href = url; a.download = 'question_bank.json'; a.click();
  URL.revokeObjectURL(url);
  showToast('Question bank exported!', 'success');
}

function openImport()  { document.getElementById('importModal').classList.add('active'); switchTab('input'); }
function closeImport() { document.getElementById('importModal').classList.remove('active'); parsedQuestions = []; document.getElementById('jsonInput').value = ''; }

function switchTab(tab) {
  ['input','preview','ref'].forEach(t => {
    document.getElementById(`tab-${t}`).classList.toggle('active', t===tab);
    document.getElementById(`panel-${t}`).classList.toggle('hidden', t!==tab);
  });
}

function parseJSON() {
  try {
    const raw = document.getElementById('jsonInput').value.trim();
    const arr = JSON.parse(raw);
    if (!Array.isArray(arr)) throw new Error('Not an array');
    parsedQuestions = arr.filter(q => q.text && q.type);
    if (!parsedQuestions.length) throw new Error('No valid questions found');
    document.getElementById('tab-preview').textContent = `Preview (${parsedQuestions.length})`;
    document.getElementById('previewList').innerHTML = parsedQuestions.map((q,i)=>`
      <div style="padding:10px 0;border-bottom:1px solid #f3f4f6;display:flex;gap:8px;align-items:flex-start;">
        <span style="font-size:12px;font-weight:700;color:var(--admin-text-muted);">Q${i+1}</span>
        <span class="badge ${TYPE_COLORS[q.type]||'badge-gray'}" style="flex-shrink:0;">${TYPE_LABELS[q.type]||q.type}</span>
        <span style="font-size:13px;">${q.text}</span>
      </div>
    `).join('');
    document.getElementById('importConfirmBtn').disabled = false;
    switchTab('preview');
    showToast(`${parsedQuestions.length} questions parsed!`, 'success');
  } catch(e) {
    showToast('Invalid JSON. Check format reference.', 'error');
  }
}

async function confirmImport() {
  const existing = await DB.getQuestions();
  const newQ = parsedQuestions.map(q => ({ ...q, id: q.id || generateId() }));
  const merged = [...existing, ...newQ.filter(q => !existing.find(e => e.id === q.id))];
  await DB.setQuestions(merged);
  closeImport();
  await DB.addAdminLog(`Imported ${newQ.length} questions into question bank`, 'questions');
  await renderQuestions();
  showToast(`${newQ.length} questions imported!`, 'success');
}

document.querySelectorAll('.modal-overlay').forEach(o => o.addEventListener('click', e => { if (e.target === o) o.classList.remove('active'); }));
