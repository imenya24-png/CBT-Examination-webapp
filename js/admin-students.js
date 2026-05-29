// Admin Students JS — Supabase async version
document.addEventListener('DOMContentLoaded', async () => {
  await requireAdmin();
  await renderStudents();
});

async function renderStudents() {
  const q  = document.getElementById('searchInput').value.toLowerCase();
  const cl = document.getElementById('classFilter').value;
  const gd = document.getElementById('genderFilter').value;
  let students = await DB.getStudents();
  const allCount = students.length;

  if (q)  students = students.filter(s => s.name.toLowerCase().includes(q) || s.email.toLowerCase().includes(q));
  if (cl) students = students.filter(s => s.class === cl);
  if (gd) students = students.filter(s => s.gender === gd);

  document.getElementById('studentCountLabel').textContent = `${allCount} total students`;
  const tbody = document.getElementById('studentTableBody');

  if (!students.length) {
    tbody.innerHTML = `<tr><td colspan="7"><div class="empty-state"><p>No students found.</p></div></td></tr>`;
    return;
  }
  tbody.innerHTML = students.map(s => `
    <tr>
      <td><strong>${s.name}</strong></td>
      <td style="color:var(--admin-text-muted);font-size:13px;">${s.email}</td>
      <td style="font-size:13px;">${s.phone || '—'}</td>
      <td style="font-size:13px;">${s.gender || '—'}</td>
      <td><span class="badge badge-purple">${s.class || '—'}</span></td>
      <td><span class="badge badge-blue" style="font-family:monospace;font-weight:800;">${s.classSN || '—'}</span></td>
      <td>
        <div style="display:flex;gap:6px;">
          <button class="icon-btn view" onclick="openEditModal('${s.id}')" title="Edit">✏️</button>
          <button class="icon-btn del" onclick="deleteStudent('${s.id}')" title="Delete">🗑️</button>
        </div>
      </td>
    </tr>
  `).join('');
}

async function addStudent() {
  const name    = document.getElementById('newName').value.trim();
  const email   = document.getElementById('newEmail').value.trim();
  const phone   = document.getElementById('newPhone').value.trim();
  const gender  = document.getElementById('newGender').value;
  const cls     = document.getElementById('newClass').value;
  const classSN = document.getElementById('newClassSN').value.trim().toUpperCase();

  if (!name || !email) return showToast('Name and Email are required.', 'error');
  const students = await DB.getStudents();
  const exists = students.find(s => s.email.toLowerCase() === email.toLowerCase());
  if (exists) return showToast('A student with this email already exists.', 'error');

  await DB.addStudent({ id: generateId(), name, email, phone, gender, class: cls, classSN, createdAt: new Date().toISOString() });
  await DB.addAdminLog(`Added student: ${name} (${classSN || 'No Serial'})`, 'students');
  closeModal('addModal');
  clearAddForm();
  await renderStudents();
  showToast('Student added successfully!', 'success');
}

function clearAddForm() {
  ['newName','newEmail','newPhone'].forEach(id => document.getElementById(id).value = '');
  ['newGender','newClass'].forEach(id => document.getElementById(id).value = '');
}

async function deleteStudent(id) {
  const students = await DB.getStudents();
  const student  = students.find(s => s.id === id);
  if (!student) return;
  authorizeAction(async () => {
    await DB.deleteStudent(id);
    await DB.addAdminLog(`Deleted student: ${student.name} (${student.classSN || 'No Serial'})`, 'students');
    await renderStudents();
    showToast('Student removed.', 'info');
  });
}

async function wipeAll() {
  authorizeAction(async () => {
    showToast('Creating backup...', 'info');
    await triggerBackupDownload();
    await DB.setStudents([]);
    await DB.addAdminLog('Wiped all student profiles', 'students');
    await renderStudents();
    showToast('All students removed and backup auto-downloaded.', 'info');
  });
}

async function exportStudentsCSV() {
  const students = await DB.getStudents();
  if (!students.length) return showToast('No students to export.', 'error');
  exportCSV('students.csv',
    ['Name','Email','Phone','Gender','Class','ClassSN'],
    students.map(s => [s.name, s.email, s.phone, s.gender, s.class, s.classSN])
  );
  showToast('Students exported!', 'success');
}

async function importCSV() {
  const file = document.getElementById('csvFile').files[0];
  if (!file) return showToast('Please select a CSV file.', 'error');
  const reader = new FileReader();
  reader.onload = async (e) => {
    // Normalize line endings: remove \r so Windows CSV files work correctly
    const text = e.target.result.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
    const lines = text.split('\n').filter(l => l.trim());
    let count = 0;
    let skipped = 0;
    let headerCols = [];
    const students = await DB.getStudents();
    for (let i = 0; i < lines.length; i++) {
      // Strip quotes and trim whitespace + stray \r from every field
      const parts = lines[i].split(',').map(p => p.trim().replace(/\r/g, '').replace(/^"|"$/g, '').trim());
      if (i === 0 && lines[i].toLowerCase().includes('name')) {
        headerCols = parts.map(h => h.toLowerCase().replace(/\r/g, '').trim());
        continue;
      }
      const col = (name) => {
        const idx = headerCols.indexOf(name);
        return idx >= 0 ? (parts[idx] || '').trim() : '';
      };
      const name    = col('name')   || parts[0] || '';
      const email   = (col('email')  || parts[1] || '').toLowerCase().trim();
      const phone   = col('phone')  || parts[2] || '';
      const gender  = col('gender') || parts[3] || '';
      const cls     = col('class')  || parts[4] || '';
      const classSN = (col('classsn') || col('class_sn') || col('serial') || col('classsno') || parts[5] || '').toUpperCase().replace(/\r/g, '').trim();
      if (!name || !email || !email.includes('@')) { skipped++; continue; }
      const exists = students.find(s => s.email.toLowerCase() === email);
      if (!exists) {
        await DB.addStudent({ id: generateId(), name, email, phone, gender, class: cls, classSN, createdAt: new Date().toISOString() });
        count++;
      } else {
        skipped++;
      }
    }
    closeModal('importModal');
    await DB.addAdminLog(`Imported ${count} students from CSV (${skipped} skipped/duplicate)`, 'students');
    await renderStudents();
    showToast(`${count} student(s) imported! ${skipped > 0 ? skipped + ' skipped (duplicates/invalid).' : ''}`, count > 0 ? 'success' : 'info');
  };
  reader.readAsText(file);
}

function openAddModal()    { document.getElementById('addModal').classList.add('active'); }
function openImportModal() { document.getElementById('importModal').classList.add('active'); }
function closeModal(id)    { document.getElementById(id).classList.remove('active'); }

document.querySelectorAll('.modal-overlay').forEach(overlay => {
  overlay.addEventListener('click', e => { if (e.target === overlay) overlay.classList.remove('active'); });
});

let editingStudentId = null;

async function openEditModal(id) {
  const students = await DB.getStudents();
  const student  = students.find(s => s.id === id);
  if (!student) return;
  editingStudentId = id;
  document.getElementById('editName').value    = student.name    || '';
  document.getElementById('editEmail').value   = student.email   || '';
  document.getElementById('editPhone').value   = student.phone   || '';
  document.getElementById('editGender').value  = student.gender  || '';
  document.getElementById('editClass').value   = student.class   || '';
  document.getElementById('editClassSN').value = student.classSN || '';
  document.getElementById('editModal').classList.add('active');
}

async function saveStudent() {
  if (!editingStudentId) return;
  const name    = document.getElementById('editName').value.trim();
  const email   = document.getElementById('editEmail').value.trim().toLowerCase();
  const phone   = document.getElementById('editPhone').value.trim();
  const gender  = document.getElementById('editGender').value;
  const cls     = document.getElementById('editClass').value;
  const classSN = document.getElementById('editClassSN').value.trim().toUpperCase();

  if (!name || !email) return showToast('Name and Email are required.', 'error');

  const students = await DB.getStudents();
  const exists   = students.find(s => s.email.toLowerCase() === email && s.id !== editingStudentId);
  if (exists) return showToast('Another student with this email already exists.', 'error');

  await DB.updateStudent(editingStudentId, { name, email, phone, gender, class: cls, classSN });
  await DB.addAdminLog(`Edited student: ${name} (${classSN || 'No Serial'})`, 'students');
  closeModal('editModal');
  await renderStudents();
  showToast('Student updated successfully!', 'success');
}
