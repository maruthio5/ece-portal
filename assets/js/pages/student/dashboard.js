// assets/js/pages/student/dashboard.js
import { requireAuth } from '../../auth.js'
import { db } from '../../db.js'
import { renderShell } from '../../shared/shell.js'
import { showToast } from '../../toast.js'

export async function renderStudentDashboard() {
  const user = requireAuth(['student'])
  if (!user) return

  renderShell(user, 'dashboard')
  const content = document.getElementById('pageContent')
  content.innerHTML = `
    <div class="page-container animate-up">
      <div class="page-header">
        <div>
          <h1 class="page-title">My Dashboard</h1>
          <p class="page-sub">Welcome back, ${user.name.split(' ')[0]}! ${user.is_cr ? 'ðŸŒŸ Class Rep' : ''}</p>
        </div>
      </div>

      <!-- Quick stats -->
      <div class="stats-grid" id="studentStats">
        ${[1,2,3].map(() => `<div class="stat-card skeleton"></div>`).join('')}
      </div>

      <!-- Today's timetable -->
      <div class="panel" style="margin-top:20px">
        <div class="panel-header"><h3>Today's Schedule</h3><a href="#/student/timetable" class="panel-link">Full timetable</a></div>
        <div id="todaySchedule"><div class="skeleton" style="height:100px;border-radius:8px"></div></div>
      </div>

      <!-- Recent notices -->
      <div class="panel" style="margin-top:16px">
        <div class="panel-header"><h3>Latest Notices</h3></div>
        <div id="recentNotices"><div class="skeleton" style="height:80px;border-radius:8px"></div></div>
      </div>
    </div>
  `

  loadStudentStats(user)
  loadTodaySchedule(user)
  loadRecentNotices()
}

async function loadStudentStats(user) {
  try {
    const [attSummary, marks] = await Promise.all([
      db.attendance.getSummary(user.id).catch(() => null),
      db.marks.getByStudent(user.id).catch(() => [])
    ])

    const avgMarks = marks.length
      ? Math.round(marks.reduce((s, m) => s + (m.percentage || 0), 0) / marks.length)
      : null

    document.getElementById('studentStats').innerHTML = `
      <div class="stat-card" style="--card-accent:#00e5a0">
        <div class="stat-icon">ðŸ“‹</div>
        <div class="stat-value">${attSummary?.percentage ?? 'â€”'}%</div>
        <div class="stat-label">Attendance</div>
      </div>
      <div class="stat-card" style="--card-accent:#58a6ff">
        <div class="stat-icon">ðŸ“Š</div>
        <div class="stat-value">${avgMarks ?? 'â€”'}%</div>
        <div class="stat-label">Avg Marks</div>
      </div>
      <div class="stat-card" style="--card-accent:#c084fc">
        <div class="stat-icon">ðŸ“š</div>
        <div class="stat-value">${marks.length}</div>
        <div class="stat-label">Subjects</div>
      </div>
    `
  } catch (err) {
    document.getElementById('studentStats').innerHTML = `<p class="empty-state">Failed to load stats</p>`
  }
}

async function loadTodaySchedule(user) {
  if (!user.semester || !user.batch) {
    document.getElementById('todaySchedule').innerHTML = `<p class="empty-state">No batch assigned yet</p>`
    return
  }
  try {
    const days = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat']
    const today = days[new Date().getDay()]
    const timetable = await db.timetable.getByBatch(user.semester, user.batch)
    const todaySlots = timetable.filter(t => t.day === today)
    const el = document.getElementById('todaySchedule')
    if (!todaySlots.length) {
      el.innerHTML = `<p class="empty-state">No classes today ðŸŽ‰</p>`
      return
    }
    el.innerHTML = todaySlots.map(t => `
      <div class="timetable-slot">
        <div class="slot-time">${t.start_time.slice(0,5)}â€“${t.end_time.slice(0,5)}</div>
        <div class="slot-info">
          <div class="slot-subject">${t.subject}</div>
          <div class="slot-meta">${t.teacher} Â· ${t.room}</div>
        </div>
        <span class="badge badge-type-${t.type.toLowerCase()}">${t.type}</span>
      </div>
    `).join('')
  } catch (err) {
    document.getElementById('todaySchedule').innerHTML = `<p class="empty-state">Could not load schedule</p>`
  }
}

async function loadRecentNotices() {
  try {
    const notices = await db.notices.getAll()
    const el = document.getElementById('recentNotices')
    if (!notices.length) { el.innerHTML = `<p class="empty-state">No notices</p>`; return }
    const pColors = { high:'#ff5370', medium:'#ffa657', low:'#00e5a0' }
    el.innerHTML = notices.slice(0, 3).map(n => `
      <div class="notice-item">
        <div class="notice-priority-dot" style="background:${pColors[n.priority]}"></div>
        <div>
          <div class="notice-title">${n.title}</div>
          <div class="notice-content">${n.content}</div>
          <div class="notice-date">${new Date(n.date).toLocaleDateString('en-IN')}</div>
        </div>
      </div>
    `).join('')
  } catch (_) { /* silent */ }
}

