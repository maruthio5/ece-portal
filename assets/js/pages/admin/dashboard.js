// assets/js/pages/admin/dashboard.js
import { requireAuth } from '../../auth.js'
import { db } from '../../db.js'
import { renderShell, setActiveNav } from '../../shared/shell.js'
import { showToast } from '../../toast.js'

export async function renderAdminDashboard() {
  const user = requireAuth(['admin'])
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
        <div class="header-actions">
          <button class="btn-outline" onclick="window.location.reload()">↻ Refresh</button>
        </div>
      </div>

      <!-- Stats Grid -->
      <div class="stats-grid" id="statsGrid">
        ${[1,2,3,4,5,6].map(() => `<div class="stat-card skeleton"></div>`).join('')}
      </div>

      <!-- Bottom Panels -->
      <div class="dashboard-panels">
        <div class="panel">
          <div class="panel-header"><h3>Recent Leave Requests</h3><a href="#/admin/leave" class="panel-link">View all</a></div>
          <div id="recentLeave"><div class="skeleton" style="height:80px;border-radius:8px"></div></div>
        </div>
        <div class="panel">
          <div class="panel-header"><h3>Upcoming Events</h3><a href="#/admin/events" class="panel-link">Manage</a></div>
          <div id="upcomingEvents"><div class="skeleton" style="height:80px;border-radius:8px"></div></div>
        </div>
      </div>
    </div>
  `

  loadStats()
  loadRecentLeave()
  loadUpcomingEvents()
}

async function loadStats() {
  try {
    const s = await db.stats.getDashboard()
    document.getElementById('statsGrid').innerHTML = `
      ${statCard('👨‍🎓', 'Total Students', s.students, '#00e5a0', '#/admin/students')}
      ${statCard('👩‍🏫', 'Total Teachers', s.teachers, '#58a6ff', '#/admin/teachers')}
      ${statCard('📋', "Today's Attendance", s.today_attendance, '#c084fc', '#/admin/attendance')}
      ${statCard('📝', 'Pending Leaves', s.pending_leave, '#ffa657', '#/admin/leave')}
      ${statCard('📢', 'Notices', s.notices, '#ff5370', '#/admin/notices')}
      ${statCard('🏆', 'Achievements', s.achievements, '#00e5a0', '#/admin/achievements')}
    `
  } catch (err) {
    showToast('Failed to load stats', 'error')
  }
}

function statCard(icon, label, value, color, link) {
  return `
    <a href="${link}" class="stat-card" style="--card-accent:${color}">
      <div class="stat-icon">${icon}</div>
      <div class="stat-value">${value ?? '—'}</div>
      <div class="stat-label">${label}</div>
    </a>
  `
}

async function loadRecentLeave() {
  try {
    const leaves = await db.leave.getPending()
    const el = document.getElementById('recentLeave')
    if (!leaves.length) {
      el.innerHTML = `<p class="empty-state">No pending requests 🎉</p>`
      return
    }
    el.innerHTML = leaves.slice(0, 4).map(l => `
      <div class="list-item">
        <div class="list-item-main">
          <span class="font-medium">${l.student_name}</span>
          <span class="badge badge-warning">Pending</span>
        </div>
        <div class="list-item-sub">${formatDate(l.from_date)} – ${formatDate(l.to_date)}</div>
      </div>
    `).join('')
  } catch (err) { /* silent */ }
}

async function loadUpcomingEvents() {
  try {
    const events = await db.events.getUpcoming(4)
    const el = document.getElementById('upcomingEvents')
    if (!events.length) {
      el.innerHTML = `<p class="empty-state">No upcoming events</p>`
      return
    }
    const typeColors = { holiday:'#ff5370', exam:'#ffa657', seminar:'#58a6ff', program:'#00e5a0' }
    el.innerHTML = events.map(e => `
      <div class="list-item">
        <div class="list-item-main">
          <span class="font-medium">${e.title}</span>
          <span class="badge" style="background:${typeColors[e.type]}20;color:${typeColors[e.type]}">${e.type}</span>
        </div>
        <div class="list-item-sub">${formatDate(e.date)}</div>
      </div>
    `).join('')
  } catch (err) { /* silent */ }
}

function getGreeting() {
  const h = new Date().getHours()
  if (h < 12) return 'morning'
  if (h < 17) return 'afternoon'
  return 'evening'
}

function formatDate(d) {
  return new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
}

