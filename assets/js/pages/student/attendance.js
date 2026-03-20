// assets/js/pages/student/attendance.js
import { requireAuth } from '../../auth.js'
import { db } from '../../db.js'
import { renderShell } from '../../shared/shell.js'
import { showToast } from '../../toast.js'

export async function renderStudentAttendance() {
  const user = requireAuth(['student'])
  if (!user) return

  renderShell(user, 'attendance')
  const content = document.getElementById('pageContent')
  content.innerHTML = `
    <div class="page-container animate-up">
      <div class="page-header">
        <h1 class="page-title">My Attendance</h1>
      </div>

      <!-- Summary ring -->
      <div class="attendance-summary-card" id="attSummary">
        <div class="skeleton" style="height:160px;border-radius:12px"></div>
      </div>

      <!-- Filter -->
      <div class="filter-bar">
        <select id="subjectFilter" class="filter-select" onchange="filterAttendance()">
          <option value="">All Subjects</option>
        </select>
      </div>

      <!-- Records -->
      <div id="attRecords">
        <div class="skeleton" style="height:300px;border-radius:12px"></div>
      </div>
    </div>
  `

  window.filterAttendance = () => renderRecords(allRecords, document.getElementById('subjectFilter').value)

  let allRecords = []
  try {
    const [records, summary] = await Promise.all([
      db.attendance.getByStudent(user.id),
      db.attendance.getSummary(user.id).catch(() => null)
    ])
    allRecords = records

    // Render summary
    const pct = summary?.percentage ?? 0
    const color = pct >= 75 ? '#00e5a0' : pct >= 60 ? '#ffa657' : '#ff5370'
    document.getElementById('attSummary').innerHTML = `
      <div class="att-summary-ring">
        <svg viewBox="0 0 120 120" width="120" height="120">
          <circle cx="60" cy="60" r="50" fill="none" stroke="var(--bg-tertiary)" stroke-width="10"/>
          <circle cx="60" cy="60" r="50" fill="none" stroke="${color}" stroke-width="10"
            stroke-dasharray="${2*Math.PI*50}" stroke-dashoffset="${2*Math.PI*50*(1-pct/100)}"
            transform="rotate(-90 60 60)" stroke-linecap="round"/>
          <text x="60" y="60" text-anchor="middle" dominant-baseline="middle"
            fill="${color}" font-size="24" font-weight="700">${pct}%</text>
        </svg>
        <div class="att-summary-stats">
          <div class="att-stat"><span class="att-stat-val" style="color:#00e5a0">${summary?.present ?? 0}</span><span>Present</span></div>
          <div class="att-stat"><span class="att-stat-val" style="color:#ff5370">${summary?.absent ?? 0}</span><span>Absent</span></div>
          <div class="att-stat"><span class="att-stat-val">${summary?.total ?? 0}</span><span>Total</span></div>
        </div>
      </div>
      ${pct < 75 ? `<div class="att-warning">⚠ Attendance below 75% — ${Math.ceil(summary?.total * 0.75 - summary?.present)} more classes needed</div>` : ''}
    `

    // Populate subject filter
    const subjects = [...new Set(records.map(r => r.subject))].sort()
    const sel = document.getElementById('subjectFilter')
    subjects.forEach(s => {
      const opt = document.createElement('option')
      opt.value = s; opt.textContent = s
      sel.appendChild(opt)
    })

    renderRecords(records, '')
  } catch (err) {
    showToast('Failed to load attendance', 'error')
    document.getElementById('attRecords').innerHTML = `<p class="empty-state">Error loading records</p>`
  }
}

function renderRecords(records, subjectFilter) {
  const filtered = subjectFilter ? records.filter(r => r.subject === subjectFilter) : records
  const el = document.getElementById('attRecords')
  if (!filtered.length) { el.innerHTML = `<p class="empty-state">No records found</p>`; return }

  // Group by subject
  const bySubject = {}
  filtered.forEach(r => {
    if (!bySubject[r.subject]) bySubject[r.subject] = []
    bySubject[r.subject].push(r)
  })

  el.innerHTML = Object.entries(bySubject).map(([subject, recs]) => {
    const present = recs.filter(r => r.status === 'present').length
    const pct = Math.round(present / recs.length * 100)
    const color = pct >= 75 ? '#00e5a0' : pct >= 60 ? '#ffa657' : '#ff5370'
    return `
      <div class="att-subject-card">
        <div class="att-subject-header">
          <div>
            <div class="att-subject-name">${subject}</div>
            <div class="att-subject-count">${present}/${recs.length} classes</div>
          </div>
          <div class="att-subject-pct" style="color:${color}">${pct}%</div>
        </div>
        <div class="progress-bar"><div class="progress-fill" style="width:${pct}%;background:${color}"></div></div>
        <div class="att-records-list">
          ${recs.slice(0, 5).map(r => `
            <div class="att-record-row">
              <span>${new Date(r.date).toLocaleDateString('en-IN', {day:'numeric',month:'short'})}</span>
              <span class="badge ${r.status === 'present' ? 'badge-success' : 'badge-danger'}">${r.status}</span>
            </div>
          `).join('')}
          ${recs.length > 5 ? `<div class="att-more">+${recs.length-5} more records</div>` : ''}
        </div>
      </div>
    `
  }).join('')
}

