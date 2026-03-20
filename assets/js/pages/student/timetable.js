// assets/js/pages/student/timetable.js
import { requireAuth } from '../../auth.js'
import { db } from '../../db.js'
import { renderShell } from '../../shared/shell.js'
import { showToast } from '../../toast.js'

const DAYS = ['Mon','Tue','Wed','Thu','Fri','Sat']
const TYPE_COLORS = { Lecture: '#58a6ff', Lab: '#00e5a0', Tutorial: '#ffa657', Elective: '#c084fc' }

export async function renderStudentTimetable() {
  const user = requireAuth(['student'])
  if (!user) return

  renderShell(user, 'timetable')
  const content = document.getElementById('pageContent')

  const todayIdx = [0,1,2,3,4,5,6].indexOf(new Date().getDay()) // 0=Sun
  const activeDayIdx = todayIdx >= 1 && todayIdx <= 6 ? todayIdx - 1 : 0

  content.innerHTML = `
    <div class="page-container animate-up">
      <div class="page-header">
        <h1 class="page-title">Timetable</h1>
        ${user.semester ? `<span class="badge badge-info">Sem ${user.semester} Â· ${user.batch}</span>` : ''}
      </div>

      <!-- Day tabs -->
      <div class="day-tabs" id="dayTabs">
        ${DAYS.map((d, i) => `
          <button class="day-tab ${i === activeDayIdx ? 'active' : ''}" 
            data-day="${d}" onclick="selectDay('${d}', this)">${d}</button>
        `).join('')}
      </div>

      <div id="dayContent">
        <div class="skeleton" style="height:300px;border-radius:12px;margin-top:12px"></div>
      </div>
    </div>
  `

  let timetable = []
  try {
    if (!user.semester || !user.batch) {
      document.getElementById('dayContent').innerHTML = `
        <div class="empty-state-card">
          <div class="empty-icon">ðŸ“…</div>
          <p>No semester/batch assigned to your profile yet.</p>
          <p class="empty-sub">Contact your administrator.</p>
        </div>
      `
      return
    }
    timetable = await db.timetable.getByBatch(user.semester, user.batch)
  } catch (err) {
    showToast('Failed to load timetable', 'error')
    return
  }

  window._timetableData = timetable
  window.selectDay = (day, btn) => {
    document.querySelectorAll('.day-tab').forEach(b => b.classList.remove('active'))
    btn.classList.add('active')
    renderDaySlots(day, timetable)
  }

  renderDaySlots(DAYS[activeDayIdx], timetable)
}

function renderDaySlots(day, timetable) {
  const slots = timetable.filter(t => t.day === day).sort((a, b) => a.start_time.localeCompare(b.start_time))
  const el = document.getElementById('dayContent')

  if (!slots.length) {
    el.innerHTML = `
      <div class="empty-state-card" style="margin-top:12px">
        <div class="empty-icon">ðŸŽ‰</div>
        <p>No classes on ${day}</p>
      </div>
    `
    return
  }

  el.innerHTML = `
    <div class="timetable-day-list">
      ${slots.map((t, i) => {
        const color = TYPE_COLORS[t.type] || '#8b949e'
        return `
          <div class="tt-card animate-up" style="animation-delay:${i * 60}ms;border-left:3px solid ${color}">
            <div class="tt-time">
              <div class="tt-start">${t.start_time.slice(0,5)}</div>
              <div class="tt-divider"></div>
              <div class="tt-end">${t.end_time.slice(0,5)}</div>
            </div>
            <div class="tt-info">
              <div class="tt-subject">${t.subject}</div>
              <div class="tt-meta">${t.teacher || 'â€”'} &bull; ${t.room || 'â€”'}</div>
            </div>
            <span class="badge" style="background:${color}20;color:${color};white-space:nowrap">${t.type}</span>
          </div>
        `
      }).join('')}
    </div>
  `
}

