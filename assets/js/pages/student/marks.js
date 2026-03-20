// assets/js/pages/student/marks.js
import { requireAuth } from '../../auth.js'
import { db } from '../../db.js'
import { renderShell } from '../../shared/shell.js'
import { showToast } from '../../toast.js'

export async function renderStudentMarks() {
  const user = requireAuth(['student'])
  if (!user) return

  renderShell(user, 'marks')
  const content = document.getElementById('pageContent')
  content.innerHTML = `
    <div class="page-container animate-up">
      <div class="page-header">
        <h1 class="page-title">My Marks</h1>
      </div>
      <div id="marksContent"><div class="skeleton" style="height:400px;border-radius:12px"></div></div>
    </div>
  `

  try {
    const marks = await db.marks.getByStudent(user.id)
    const el = document.getElementById('marksContent')

    if (!marks.length) {
      el.innerHTML = `<p class="empty-state">No marks recorded yet</p>`
      return
    }

    const avg = (marks.reduce((s, m) => s + (m.percentage || 0), 0) / marks.length).toFixed(1)
    const best = marks.reduce((b, m) => (m.percentage > b.percentage ? m : b), marks[0])

    el.innerHTML = `
      <div class="marks-summary-row">
        <div class="marks-summary-card">
          <div class="marks-summary-val">${avg}%</div>
          <div class="marks-summary-label">Average</div>
        </div>
        <div class="marks-summary-card">
          <div class="marks-summary-val">${marks.length}</div>
          <div class="marks-summary-label">Subjects</div>
        </div>
        <div class="marks-summary-card">
          <div class="marks-summary-val" style="color:#00e5a0">${best.percentage}%</div>
          <div class="marks-summary-label">Best</div>
        </div>
      </div>

      <div class="marks-table-wrap">
        <table class="data-table">
          <thead>
            <tr>
              <th>Subject</th>
              <th>Internal<br><small>/20</small></th>
              <th>Assessment<br><small>/30</small></th>
              <th>Practical<br><small>/25</small></th>
              <th>Total<br><small>/75</small></th>
              <th>%</th>
            </tr>
          </thead>
          <tbody>
            ${marks.map(m => {
              const pct = m.percentage || 0
              const color = pct >= 75 ? '#00e5a0' : pct >= 50 ? '#ffa657' : '#ff5370'
              return `
                <tr>
                  <td class="subject-cell">${m.subject}</td>
                  <td class="text-center">${m.internal}</td>
                  <td class="text-center">${m.assessment}</td>
                  <td class="text-center">${m.practical}</td>
                  <td class="text-center font-medium">${m.total}</td>
                  <td class="text-center">
                    <span class="pct-badge" style="color:${color};background:${color}18">${pct}%</span>
                  </td>
                </tr>
              `
            }).join('')}
          </tbody>
        </table>
      </div>
    `
  } catch (err) {
    showToast('Failed to load marks', 'error')
    document.getElementById('marksContent').innerHTML = `<p class="empty-state">Error loading marks</p>`
  }
}

