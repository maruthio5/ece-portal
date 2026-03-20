// assets/js/pages/teacher/timetable.js
import { requireAuth } from '../../auth.js'
import { db } from '../../db.js'
import { renderShell } from '../../shared/shell.js'
import { showToast } from '../../toast.js'

const DAYS = ['Mon','Tue','Wed','Thu','Fri','Sat']
const TYPES = ['Lecture','Lab','Tutorial','Elective']
const TYPE_COLORS = { Lecture:'#58a6ff', Lab:'#00e5a0', Tutorial:'#ffa657', Elective:'#c084fc' }

export async function renderTeacherTimetable() {
  const user = requireAuth(['teacher'])
  if (!user) return

  renderShell(user, 'timetable')
  const content = document.getElementById('pageContent')
  content.innerHTML = `
    <div class="page-container animate-up">
      <div class="page-header">
        <h1 class="page-title">Timetable</h1>
        <button class="btn-primary" onclick="openAddPeriodModal()">+ Add Period</button>
      </div>

      <!-- Batch filter -->
      <div class="filter-bar">
        <select id="ttSem" class="filter-select" onchange="loadTT()">
          <option value="">All Semesters</option>
          ${[1,2,3,4,5,6].map(s=>`<option value="${s}">Sem ${s}</option>`).join('')}
        </select>
        <input type="text" id="ttBatch" class="filter-select" placeholder="Batch (e.g. 2024-2027)" oninput="loadTT()" />
      </div>

      <div id="ttContent"><div class="skeleton" style="height:400px;border-radius:12px;margin-top:12px"></div></div>
    </div>

    <!-- Add/Edit Period Modal -->
    <div class="modal hidden" id="periodModal">
      <div class="modal-box">
        <div class="modal-header">
          <h3 id="periodModalTitle">Add Period</h3>
          <button class="modal-close" onclick="closePeriodModal()">✕</button>
        </div>
        <div class="modal-body">
          <div class="modal-grid">
            <div class="field-group">
              <label>Day</label>
              <select id="pDay" class="field-input">
                ${DAYS.map(d=>`<option value="${d}">${d}</option>`).join('')}
              </select>
            </div>
            <div class="field-group">
              <label>Type</label>
              <select id="pType" class="field-input">
                ${TYPES.map(t=>`<option value="${t}">${t}</option>`).join('')}
              </select>
            </div>
            <div class="field-group">
              <label>Start Time</label>
              <input type="time" id="pStart" class="field-input" />
            </div>
            <div class="field-group">
              <label>End Time</label>
              <input type="time" id="pEnd" class="field-input" />
            </div>
          </div>
          <div class="field-group">
            <label>Subject</label>
            <input type="text" id="pSubject" class="field-input" placeholder="e.g. Digital Electronics" />
          </div>
          <div class="modal-grid">
            <div class="field-group">
              <label>Room</label>
              <input type="text" id="pRoom" class="field-input" placeholder="Lab 101" />
            </div>
            <div class="field-group">
              <label>Semester</label>
              <select id="pSem" class="field-input">
                ${[1,2,3,4,5,6].map(s=>`<option value="${s}">${s}</option>`).join('')}
              </select>
            </div>
          </div>
          <div class="field-group">
            <label>Batch</label>
            <input type="text" id="pBatch" class="field-input" placeholder="e.g. 2024-2027" />
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn-outline" onclick="closePeriodModal()">Cancel</button>
          <button class="btn-primary" id="savePeriodBtn" onclick="savePeriod()">Add Period</button>
        </div>
      </div>
    </div>
  `

  let editingId = null
  let allPeriods = []

  window.loadTT = loadTT
  window.openAddPeriodModal = () => {
    editingId = null
    document.getElementById('periodModalTitle').textContent = 'Add Period'
    document.getElementById('savePeriodBtn').textContent = 'Add Period'
    ;['pDay','pType','pStart','pEnd','pSubject','pRoom','pSem','pBatch'].forEach(id => {
      const el = document.getElementById(id)
      if (el.tagName === 'SELECT') el.selectedIndex = 0
      else el.value = ''
    })
    document.getElementById('periodModal').classList.remove('hidden')
  }
  window.closePeriodModal = () => document.getElementById('periodModal').classList.add('hidden')
  window.editPeriod = (id) => {
    const p = allPeriods.find(x => x.id === id)
    if (!p) return
    editingId = id
    document.getElementById('periodModalTitle').textContent = 'Edit Period'
    document.getElementById('savePeriodBtn').textContent = 'Save Changes'
    document.getElementById('pDay').value = p.day
    document.getElementById('pType').value = p.type
    document.getElementById('pStart').value = p.start_time.slice(0,5)
    document.getElementById('pEnd').value = p.end_time.slice(0,5)
    document.getElementById('pSubject').value = p.subject
    document.getElementById('pRoom').value = p.room || ''
    document.getElementById('pSem').value = p.semester
    document.getElementById('pBatch').value = p.batch
    document.getElementById('periodModal').classList.remove('hidden')
  }
  window.deletePeriod = async (id) => {
    if (!confirm('Delete this period?')) return
    try {
      await db.timetable.delete(id)
      showToast('Period deleted', 'success')
      loadTT()
    } catch (err) { showToast('Delete failed', 'error') }
  }
  window.savePeriod = async () => {
    const day     = document.getElementById('pDay').value
    const type    = document.getElementById('pType').value
    const start   = document.getElementById('pStart').value
    const end     = document.getElementById('pEnd').value
    const subject = document.getElementById('pSubject').value.trim()
    const room    = document.getElementById('pRoom').value.trim()
    const sem     = parseInt(document.getElementById('pSem').value)
    const batch   = document.getElementById('pBatch').value.trim()

    if (!start || !end || !subject || !batch) {
      showToast('Fill all required fields', 'error'); return
    }

    const payload = { day, type, start_time: start, end_time: end, subject, room,
      semester: sem, batch, teacher: user.name, teacher_id: user.id, created_by: user.id }

    try {
      if (editingId) await db.timetable.update(editingId, payload)
      else await db.timetable.insert(payload)
      showToast(editingId ? 'Period updated' : 'Period added', 'success')
      window.closePeriodModal()
      loadTT()
    } catch (err) { showToast('Save failed: ' + err.message, 'error') }
  }

  async function loadTT() {
    const sem = parseInt(document.getElementById('ttSem').value) || null
    const batch = document.getElementById('ttBatch').value.trim() || null
    const el = document.getElementById('ttContent')
    el.innerHTML = `<div class="skeleton" style="height:300px;border-radius:12px;margin-top:8px"></div>`
    try {
      if (sem && batch) allPeriods = await db.timetable.getByBatch(sem, batch)
      else allPeriods = await db.timetable.getAll()
      renderTimetableGrid(allPeriods, el)
    } catch (err) { el.innerHTML = `<p class="empty-state">Failed to load</p>` }
  }

  loadTT()
}

function renderTimetableGrid(periods, el) {
  if (!periods.length) { el.innerHTML = `<p class="empty-state" style="margin-top:16px">No periods found</p>`; return }

  el.innerHTML = DAYS.map(day => {
    const slots = periods.filter(p => p.day === day).sort((a,b) => a.start_time.localeCompare(b.start_time))
    if (!slots.length) return ''
    return `
      <div class="tt-day-section">
        <div class="tt-day-label">${day}</div>
        ${slots.map(t => {
          const color = TYPE_COLORS[t.type] || '#8b949e'
          return `
            <div class="tt-card" style="border-left:3px solid ${color}">
              <div class="tt-time">
                <div class="tt-start">${t.start_time.slice(0,5)}</div>
                <div class="tt-divider"></div>
                <div class="tt-end">${t.end_time.slice(0,5)}</div>
              </div>
              <div class="tt-info">
                <div class="tt-subject">${t.subject}</div>
                <div class="tt-meta">Sem ${t.semester} · ${t.batch} · ${t.room || '—'}</div>
              </div>
              <div class="tt-actions">
                <button class="icon-btn-sm" onclick="editPeriod('${t.id}')" title="Edit">✏️</button>
                <button class="icon-btn-sm" onclick="deletePeriod('${t.id}')" title="Delete">🗑</button>
              </div>
            </div>
          `
        }).join('')}
      </div>
    `
  }).join('')
}

