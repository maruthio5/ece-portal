// assets/js/pages/teacher/marks-entry.js
import { requireAuth } from '../../auth.js'
import { db } from '../../db.js'
import { renderShell } from '../../shared/shell.js'
import { showToast } from '../../toast.js'

export async function renderMarksEntry() {
  const user = requireAuth(['teacher'])
  if (!user) return

  renderShell(user, 'marks-entry')
  const content = document.getElementById('pageContent')
  content.innerHTML = `
    <div class="page-container animate-up">
      <div class="page-header">
        <h1 class="page-title">Enter Marks</h1>
      </div>

      <!-- Filters -->
      <div class="filter-panel">
        <div class="filter-row">
          <div class="field-group flex-1">
            <label>Subject</label>
            <input type="text" id="marksSubject" class="field-input" placeholder="e.g. Digital Electronics" />
          </div>
          <div class="field-group" style="width:120px">
            <label>Semester</label>
            <select id="marksSem" class="field-input">
              ${[1,2,3,4,5,6].map(s => `<option value="${s}">${s}</option>`).join('')}
            </select>
          </div>
        </div>
        <button class="btn-primary" style="width:100%" onclick="loadStudentsForMarks()">Load Students</button>
      </div>

      <div id="marksTable" style="margin-top:16px"></div>
    </div>
  `

  window.loadStudentsForMarks = loadStudentsForMarks
  window.saveAllMarks = saveAllMarks

  async function loadStudentsForMarks() {
    const subject = document.getElementById('marksSubject').value.trim()
    const semester = parseInt(document.getElementById('marksSem').value)
    if (!subject) { showToast('Enter a subject name', 'error'); return }

    const el = document.getElementById('marksTable')
    el.innerHTML = `<div class="skeleton" style="height:300px;border-radius:12px"></div>`

    try {
      const [students, existingMarks] = await Promise.all([
        db.profiles.getAll('student').then(all => all.filter(s => s.semester === semester)),
        db.marks.getByBatch(semester, null)
      ])

      if (!students.length) {
        el.innerHTML = `<p class="empty-state">No students in Semester ${semester}</p>`
        return
      }

      // Map existing marks
      const markMap = {}
      existingMarks.filter(m => m.subject === subject).forEach(m => { markMap[m.student_id] = m })

      el.innerHTML = `
        <div class="marks-entry-header">
          <div class="marks-subject-tag">${subject} · Sem ${semester}</div>
          <button class="btn-primary" onclick="saveAllMarks('${subject}', ${semester})">💾 Save All</button>
        </div>
        <div class="marks-table-wrap">
          <table class="data-table">
            <thead>
              <tr>
                <th>Student</th>
                <th>Internal<br><small>/20</small></th>
                <th>Assessment<br><small>/30</small></th>
                <th>Practical<br><small>/25</small></th>
              </tr>
            </thead>
            <tbody id="marksBody">
              ${students.map(s => {
                const m = markMap[s.id] || {}
                return `
                  <tr data-student-id="${s.id}" data-student-name="${escStr(s.name)}">
                    <td>
                      <div class="font-medium">${s.name}</div>
                      <div class="text-muted" style="font-size:12px">${s.enrollment_no || ''}</div>
                    </td>
                    <td><input type="number" class="marks-input" data-field="internal"
                      value="${m.internal ?? ''}" min="0" max="20" placeholder="0" /></td>
                    <td><input type="number" class="marks-input" data-field="assessment"
                      value="${m.assessment ?? ''}" min="0" max="30" placeholder="0" /></td>
                    <td><input type="number" class="marks-input" data-field="practical"
                      value="${m.practical ?? ''}" min="0" max="25" placeholder="0" /></td>
                  </tr>
                `
              }).join('')}
            </tbody>
          </table>
        </div>
      `
    } catch (err) {
      el.innerHTML = `<p class="empty-state">Failed to load students</p>`
      showToast('Load failed: ' + err.message, 'error')
    }
  }

  async function saveAllMarks(subject, semester) {
    const rows = document.querySelectorAll('#marksBody tr')
    if (!rows.length) return

    const records = []
    let valid = true

    rows.forEach(row => {
      const studentId   = row.dataset.studentId
      const studentName = row.dataset.studentName
      const internal    = parseInt(row.querySelector('[data-field="internal"]').value) || 0
      const assessment  = parseInt(row.querySelector('[data-field="assessment"]').value) || 0
      const practical   = parseInt(row.querySelector('[data-field="practical"]').value) || 0

      if (internal > 20 || assessment > 30 || practical > 25) {
        showToast(`Invalid marks for ${studentName}`, 'error')
        valid = false; return
      }

      // ⚠️ Never include total/percentage — GENERATED columns
      records.push({ student_id: studentId, student_name: studentName, subject, internal, assessment, practical, semester, added_by: user.id })
    })

    if (!valid) return

    try {
      showToast('Saving…', 'info')
      await Promise.all(records.map(r => db.marks.upsert(r)))
      showToast(`✅ Saved marks for ${records.length} students`, 'success')

      // Notify students
      await db.notifications.create({
        type: 'marks',
        title: `📊 Marks Updated: ${subject}`,
        body: `Your marks for ${subject} have been entered`,
        target_role: 'student',
        target_semester: semester
      })
    } catch (err) {
      showToast('Save failed: ' + err.message, 'error')
    }
  }
}

function escStr(s) { return String(s).replace(/'/g, "\\'").replace(/"/g, '&quot;') }

