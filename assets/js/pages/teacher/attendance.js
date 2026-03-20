// assets/js/pages/teacher/attendance.js
import { requireAuth } from '../../auth.js'
import { db } from '../../db.js'
import { renderShell } from '../../shared/shell.js'
import { showToast } from '../../toast.js'

export async function renderTeacherAttendance() {
  const user = requireAuth(['teacher'])
  if (!user) return

  renderShell(user, 'attendance')
  const content = document.getElementById('pageContent')
  content.innerHTML = `
    <div class="page-container animate-up">
      <div class="page-header">
        <h1 class="page-title">Attendance</h1>
      </div>

      <div class="filter-panel">
        <div class="filter-row">
          <div class="field-group flex-1">
            <label>Subject</label>
            <input type="text" id="attSubject" class="field-input" placeholder="Subject name" />
          </div>
          <div class="field-group" style="width:130px">
            <label>Date</label>
            <input type="date" id="attDate" class="field-input" value="${new Date().toISOString().split('T')[0]}" />
          </div>
        </div>
        <div class="filter-row">
          <div class="field-group flex-1">
            <label>Semester</label>
            <select id="attSem" class="field-input">
              ${[1,2,3,4,5,6].map(s=>`<option value="${s}">${s}</option>`).join('')}
            </select>
          </div>
          <div class="field-group flex-1">
            <label>Batch</label>
            <input type="text" id="attBatch" class="field-input" placeholder="e.g. 2024-2027" />
          </div>
        </div>
        <button class="btn-primary" style="width:100%" onclick="loadAttendanceSheet()">Load Students</button>
      </div>

      <div id="attSheet" style="margin-top:16px"></div>
    </div>
  `

  window.loadAttendanceSheet = loadAttendanceSheet
  window.saveAttendance = saveAttendance

  async function loadAttendanceSheet() {
    const subject  = document.getElementById('attSubject').value.trim()
    const date     = document.getElementById('attDate').value
    const semester = parseInt(document.getElementById('attSem').value)
    const batch    = document.getElementById('attBatch').value.trim()

    if (!subject || !batch) { showToast('Fill subject and batch', 'error'); return }

    const el = document.getElementById('attSheet')
    el.innerHTML = `<div class="skeleton" style="height:300px;border-radius:12px"></div>`

    try {
      const [students, existing] = await Promise.all([
        db.profiles.getAll('student').then(a => a.filter(s => s.semester === semester && s.batch === batch)),
        db.attendance.getByBatch(semester, batch, date).then(r => r.filter(a => a.subject === subject))
      ])

      if (!students.length) { el.innerHTML = `<p class="empty-state">No students in Sem ${semester}, ${batch}</p>`; return }

      const existingMap = {}
      existing.forEach(a => { existingMap[a.student_id] = a.status })

      el.innerHTML = `
        <div class="att-sheet-header">
          <div>
            <div class="marks-subject-tag">${subject} Â· ${date}</div>
            <div class="text-muted" style="font-size:13px">Sem ${semester} Â· ${batch} Â· ${students.length} students</div>
          </div>
          <div class="att-bulk-btns">
            <button class="btn-outline btn-sm" onclick="markAll('present')">All Present</button>
            <button class="btn-outline btn-sm" onclick="markAll('absent')">All Absent</button>
          </div>
        </div>
        <div class="att-student-list" id="attStudentList">
          ${students.map(s => {
            const status = existingMap[s.id] || 'present'
            return `
              <div class="att-student-row" data-id="${s.id}" data-name="${escStr(s.name)}">
                <div class="att-student-info">
                  <div class="font-medium">${s.name}</div>
                  <div class="text-muted" style="font-size:12px">${s.enrollment_no || ''}</div>
                </div>
                <div class="att-toggle">
                  <button class="att-btn ${status === 'present' ? 'att-present' : ''}" 
                    data-status="present" onclick="toggleAtt(this, '${s.id}')">P</button>
                  <button class="att-btn ${status === 'absent' ? 'att-absent' : ''}"
                    data-status="absent" onclick="toggleAtt(this, '${s.id}')">A</button>
                </div>
              </div>
            `
          }).join('')}
        </div>
        <button class="btn-primary" style="width:100%;margin-top:16px"
          onclick="saveAttendance('${subject}', '${date}', ${semester}, '${batch}')">
          ðŸ’¾ Save Attendance
        </button>
      `

      window.markAll = (status) => {
        document.querySelectorAll('.att-student-row').forEach(row => {
          row.querySelectorAll('.att-btn').forEach(btn => {
            btn.classList.remove('att-present','att-absent')
            if (btn.dataset.status === status) btn.classList.add(status === 'present' ? 'att-present' : 'att-absent')
          })
        })
      }
      window.toggleAtt = (btn, studentId) => {
        const row = btn.closest('.att-student-row')
        row.querySelectorAll('.att-btn').forEach(b => b.classList.remove('att-present','att-absent'))
        btn.classList.add(btn.dataset.status === 'present' ? 'att-present' : 'att-absent')
      }

    } catch (err) {
      el.innerHTML = `<p class="empty-state">Failed to load</p>`
      showToast('Load failed', 'error')
    }
  }

  async function saveAttendance(subject, date, semester, batch) {
    const rows = document.querySelectorAll('.att-student-row')
    const records = []
    rows.forEach(row => {
      const activeBtn = row.querySelector('.att-btn.att-present, .att-btn.att-absent')
      const status = activeBtn?.dataset.status || 'present'
      records.push({
        student_id:   row.dataset.id,
        student_name: row.dataset.name,
        subject, date,
        time: new Date().toLocaleTimeString('en-IN', { hour:'2-digit', minute:'2-digit' }),
        status,
        semester,
        batch,
        teacher_name: user.name
      })
    })

    try {
      showToast('Savingâ€¦', 'info')
      await db.attendance.upsertMany(records)
      const presentCount = records.filter(r => r.status === 'present').length
      showToast(`âœ… Saved: ${presentCount}/${records.length} present`, 'success')
    } catch (err) {
      showToast('Save failed: ' + err.message, 'error')
    }
  }
}

function escStr(s) { return String(s).replace(/'/g, "\\'") }

