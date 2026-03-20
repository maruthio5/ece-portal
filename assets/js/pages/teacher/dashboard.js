// assets/js/pages/teacher/dashboard.js
import { requireAuth } from '../../auth.js'
import { db } from '../../db.js'
import { renderShell } from '../../shared/shell.js'
import { showToast } from '../../toast.js'

export async function renderTeacherDashboard() {
  const user = requireAuth(['teacher'])
  if (!user) return

  renderShell(user, 'dashboard')
  const content = document.getElementById('pageContent')
  content.innerHTML = `
    <div class="page-container animate-up">
      <div class="page-header">
        <div>
          <h1 class="page-title">Dashboard</h1>
          <p class="page-sub">Good ${getGreeting()}, ${user.name.split(' ')[0]}</p>
        </div>
      </div>

      <!-- Quick actions -->
      <div class="quick-actions">
        <a href="#/teacher/qr-generate" class="quick-action-btn">
          <span class="quick-icon">â¬›</span>
          <span>Generate QR</span>
        </a>
        <a href="#/teacher/attendance" class="quick-action-btn">
          <span class="quick-icon">ðŸ“‹</span>
          <span>Attendance</span>
        </a>
        <a href="#/teacher/marks-entry" class="quick-action-btn">
          <span class="quick-icon">ðŸ“Š</span>
          <span>Enter Marks</span>
        </a>
        <a href="#/teacher/chat" class="quick-action-btn">
          <span class="quick-icon">ðŸ’¬</span>
          <span>Chat</span>
        </a>
      </div>

      <!-- Stats -->
      <div class="stats-grid" id="teacherStats">
        ${[1,2,3].map(() => `<div class="stat-card skeleton"></div>`).join('')}
      </div>

      <!-- Today's schedule -->
      <div class="panel" style="margin-top:20px">
        <div class="panel-header"><h3>Today's Schedule</h3><a href="#/teacher/timetable" class="panel-link">Full timetable</a></div>
        <div id="teacherSchedule"><div class="skeleton" style="height:100px;border-radius:8px"></div></div>
      </div>

      <!-- Pending leave requests -->
      <div class="panel" style="margin-top:16px">
        <div class="panel-header"><h3>Pending Leave Requests</h3></div>
        <div id="pendingLeave"><div class="skeleton" style="height:80px;border-radius:8px"></div></div>
      </div>
    </div>
  `

  loadTeacherStats(user)
  loadTeacherSchedule(user)
  loadPendingLeave()
}

async function loadTeacherStats(user) {
  try {
    const [students, todayAtt, pendingLeave] = await Promise.all([
      db.profiles.getAll('student'),
      db.attendance.getToday(),
      db.leave.getPending()
    ])
    document.getElementById('teacherStats').innerHTML = `
      <div class="stat-card" style="--card-accent:#00e5a0">
        <div class="stat-icon">ðŸ‘¨â€ðŸŽ“</div>
        <div class="stat-value">${students.length}</div>
        <div class="stat-label">Total Students</div>
      </div>
      <div class="stat-card" style="--card-accent:#58a6ff">
        <div class="stat-icon">ðŸ“‹</div>
        <div class="stat-value">${todayAtt.length}</div>
        <div class="stat-label">Today's Records</div>
      </div>
      <div class="stat-card" style="--card-accent:#ffa657">
        <div class="stat-icon">ðŸ“</div>
        <div class="stat-value">${pendingLeave.length}</div>
        <div class="stat-label">Pending Leaves</div>
      </div>
    `
  } catch (err) { /* silent */ }
}

async function loadTeacherSchedule(user) {
  const el = document.getElementById('teacherSchedule')
  try {
    // Get all timetable and filter by teacher
    const all = await db.timetable.getAll()
    const days = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat']
    const today = days[new Date().getDay()]
    const mine = all.filter(t => t.teacher_id === user.id || t.teacher === user.name)
    const todaySlots = mine.filter(t => t.day === today)

    if (!todaySlots.length) {
      el.innerHTML = `<p class="empty-state">No classes today ðŸŽ‰</p>`
      return
    }
    el.innerHTML = todaySlots.map(t => `
      <div class="timetable-slot">
        <div class="slot-time">${t.start_time.slice(0,5)}â€“${t.end_time.slice(0,5)}</div>
        <div class="slot-info">
          <div class="slot-subject">${t.subject}</div>
          <div class="slot-meta">Sem ${t.semester} Â· ${t.batch} Â· ${t.room}</div>
        </div>
        <span class="badge badge-type-${t.type.toLowerCase()}">${t.type}</span>
      </div>
    `).join('')
  } catch (err) {
    el.innerHTML = `<p class="empty-state">Could not load schedule</p>`
  }
}

async function loadPendingLeave() {
  const el = document.getElementById('pendingLeave')
  try {
    const leaves = await db.leave.getPending()
    if (!leaves.length) { el.innerHTML = `<p class="empty-state">No pending requests ðŸŽ‰</p>`; return }
    el.innerHTML = leaves.slice(0, 3).map(l => `
      <div class="list-item">
        <div class="list-item-main">
          <span class="font-medium">${l.student_name}</span>
          <span class="badge badge-warning">Pending</span>
        </div>
        <div class="list-item-sub">${formatDate(l.from_date)} â€“ ${formatDate(l.to_date)}</div>
      </div>
    `).join('')
  } catch (_) { el.innerHTML = `<p class="empty-state">â€”</p>` }
}

function getGreeting() {
  const h = new Date().getHours()
  if (h < 12) return 'morning'; if (h < 17) return 'afternoon'; return 'evening'
}
function formatDate(d) { return new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }) }

