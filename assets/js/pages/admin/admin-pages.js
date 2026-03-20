// assets/js/pages/admin/students.js
import { requireAuth } from '../../auth.js'
import { db } from '../../db.js'
import { renderShell } from '../../shared/shell.js'
import { showToast } from '../../toast.js'

export async function renderAdminStudents() {
  const user = requireAuth(['admin'])
  if (!user) return
  renderShell(user, 'students')
  const content = document.getElementById('pageContent')
  content.innerHTML = `
    <div class="page-container animate-up">
      <div class="page-header">
        <h1 class="page-title">Students</h1>
        <button class="btn-primary" onclick="openAddUserModal('student')">+ Add Student</button>
      </div>
      <div class="search-bar">
        <input type="text" id="studentSearch" class="field-input" placeholder="🔍 Search by name, email, enrollment…" oninput="filterStudents()" />
      </div>
      <div id="studentsList"><div class="skeleton" style="height:400px;border-radius:12px;margin-top:12px"></div></div>
    </div>
    ${addUserModalHTML()}
  `
  let allStudents = []
  window.filterStudents = () => renderStudentList(allStudents.filter(s =>
    `${s.name} ${s.email} ${s.enrollment_no}`.toLowerCase().includes(document.getElementById('studentSearch').value.toLowerCase())
  ))
  window.deleteUser = deleteUser
  window.openAddUserModal = openAddUserModal
  window.closeAddUserModal = () => document.getElementById('addUserModal').classList.add('hidden')
  window.submitAddUser = submitAddUser

  try {
    allStudents = await db.profiles.getAll('student')
    renderStudentList(allStudents)
  } catch (err) { showToast('Failed to load students', 'error') }
}

function renderStudentList(students) {
  const el = document.getElementById('studentsList')
  if (!students.length) { el.innerHTML = `<p class="empty-state">No students found</p>`; return }
  el.innerHTML = `
    <div class="user-cards">
      ${students.map(s => `
        <div class="user-card">
          <div class="user-avatar-sm">${getInitials(s.name)}</div>
          <div class="user-info">
            <div class="user-name">${s.name} ${s.is_cr ? '🌟' : ''}</div>
            <div class="user-meta">${s.enrollment_no || '—'} · Sem ${s.semester || '?'} · ${s.batch || '—'}</div>
            <div class="user-email">${s.email}</div>
          </div>
          <button class="btn-danger-sm" onclick="deleteUser('${s.id}', '${escStr(s.name)}')">✕</button>
        </div>
      `).join('')}
    </div>
  `
}

// ─── TEACHERS ─────────────────────────────────────────────────────
export async function renderAdminTeachers() {
  const user = requireAuth(['admin'])
  if (!user) return
  renderShell(user, 'teachers')
  const content = document.getElementById('pageContent')
  content.innerHTML = `
    <div class="page-container animate-up">
      <div class="page-header">
        <h1 class="page-title">Teachers</h1>
        <button class="btn-primary" onclick="openAddUserModal('teacher')">+ Add Teacher</button>
      </div>
      <div id="teachersList"><div class="skeleton" style="height:300px;border-radius:12px"></div></div>
    </div>
    ${addUserModalHTML()}
  `
  window.openAddUserModal = openAddUserModal
  window.closeAddUserModal = () => document.getElementById('addUserModal').classList.add('hidden')
  window.submitAddUser = submitAddUser
  window.deleteUser = deleteUser
  try {
    const teachers = await db.profiles.getAll('teacher')
    const el = document.getElementById('teachersList')
    if (!teachers.length) { el.innerHTML = `<p class="empty-state">No teachers yet</p>`; return }
    el.innerHTML = `<div class="user-cards">${teachers.map(t => `
      <div class="user-card">
        <div class="user-avatar-sm">${getInitials(t.name)}</div>
        <div class="user-info">
          <div class="user-name">${t.name}</div>
          <div class="user-meta">${t.employee_id || '—'} · ${(t.subjects||[]).slice(0,2).join(', ')}</div>
          <div class="user-email">${t.email}</div>
        </div>
        <button class="btn-danger-sm" onclick="deleteUser('${t.id}', '${escStr(t.name)}')">✕</button>
      </div>
    `).join('')}</div>`
  } catch (err) { showToast('Failed to load teachers', 'error') }
}

// ─── LEAVE ────────────────────────────────────────────────────────
export async function renderAdminLeave() {
  const user = requireAuth(['admin'])
  if (!user) return
  renderShell(user, 'leave')
  const content = document.getElementById('pageContent')
  content.innerHTML = `
    <div class="page-container animate-up">
      <div class="page-header"><h1 class="page-title">Leave Requests</h1></div>
      <div class="filter-bar">
        <select id="leaveStatusFilter" class="filter-select" onchange="filterLeave()">
          <option value="">All</option>
          <option value="pending">Pending</option>
          <option value="approved">Approved</option>
          <option value="declined">Declined</option>
        </select>
      </div>
      <div id="leaveList"><div class="skeleton" style="height:300px;border-radius:12px;margin-top:12px"></div></div>
    </div>
  `
  let allLeaves = []
  window.filterLeave = () => {
    const f = document.getElementById('leaveStatusFilter').value
    renderLeaveList(f ? allLeaves.filter(l => l.status === f) : allLeaves)
  }
  window.updateLeaveStatus = updateLeaveStatus

  try {
    allLeaves = await db.leave.getAll()
    renderLeaveList(allLeaves)
  } catch (err) { showToast('Failed to load leaves', 'error') }

  async function updateLeaveStatus(id, status) {
    try {
      await db.leave.updateStatus(id, status, user.id)
      showToast(`Leave ${status}`, status === 'approved' ? 'success' : 'error')
      allLeaves = await db.leave.getAll()
      window.filterLeave()

      // Notify student
      const leave = allLeaves.find(l => l.id === id)
      if (leave) {
        await db.notifications.create({
          type: 'leave_update',
          title: `Leave Request ${status === 'approved' ? 'Approved ✅' : 'Declined ❌'}`,
          body: `Your request from ${leave.from_date} to ${leave.to_date} was ${status}`,
          target_user_id: leave.student_id
        })
      }
    } catch (err) { showToast('Update failed', 'error') }
  }
}

function renderLeaveList(leaves) {
  const el = document.getElementById('leaveList')
  if (!leaves.length) { el.innerHTML = `<p class="empty-state">No leave requests</p>`; return }
  const sColors = { pending:'#ffa657', approved:'#00e5a0', declined:'#ff5370' }
  el.innerHTML = leaves.map(l => `
    <div class="leave-card">
      <div class="leave-header">
        <div>
          <div class="font-medium">${l.student_name}</div>
          <div class="leave-dates">${formatDate(l.from_date)} – ${formatDate(l.to_date)}</div>
        </div>
        <span class="badge" style="background:${sColors[l.status]}20;color:${sColors[l.status]}">${capitalize(l.status)}</span>
      </div>
      <div class="leave-reason">${l.reason}</div>
      ${l.status === 'pending' ? `
        <div class="leave-actions">
          <button class="btn-primary btn-sm" onclick="updateLeaveStatus('${l.id}','approved')">✅ Approve</button>
          <button class="btn-danger-sm" onclick="updateLeaveStatus('${l.id}','declined')">❌ Decline</button>
        </div>
      ` : ''}
    </div>
  `).join('')
}

// ─── NOTICES ──────────────────────────────────────────────────────
export async function renderAdminNotices() {
  const user = requireAuth(['admin'])
  if (!user) return
  renderShell(user, 'notices')
  const content = document.getElementById('pageContent')
  content.innerHTML = `
    <div class="page-container animate-up">
      <div class="page-header">
        <h1 class="page-title">Notices</h1>
        <button class="btn-primary" onclick="openNoticeModal()">+ Add</button>
      </div>
      <div id="noticesList"><div class="skeleton" style="height:300px;border-radius:12px"></div></div>
    </div>
    <div class="modal hidden" id="noticeModal">
      <div class="modal-box">
        <div class="modal-header"><h3>Add Notice</h3>
          <button class="modal-close" onclick="document.getElementById('noticeModal').classList.add('hidden')">✕</button></div>
        <div class="modal-body">
          <div class="field-group"><label>Title</label>
            <input type="text" id="noticeTitle" class="field-input" placeholder="Notice title" /></div>
          <div class="field-group"><label>Content</label>
            <textarea id="noticeContent" class="field-input" rows="4" placeholder="Notice content…"></textarea></div>
          <div class="field-group"><label>Priority</label>
            <select id="noticePriority" class="field-input">
              <option value="low">Low</option><option value="medium" selected>Medium</option><option value="high">High</option>
            </select></div>
        </div>
        <div class="modal-footer">
          <button class="btn-outline" onclick="document.getElementById('noticeModal').classList.add('hidden')">Cancel</button>
          <button class="btn-primary" onclick="addNotice()">Add Notice</button>
        </div>
      </div>
    </div>
  `
  window.openNoticeModal = () => document.getElementById('noticeModal').classList.remove('hidden')
  window.addNotice = addNotice
  window.deleteNotice = deleteNotice
  loadNotices()

  async function loadNotices() {
    try {
      const notices = await db.notices.getAll()
      const el = document.getElementById('noticesList')
      const pColors = { high:'#ff5370', medium:'#ffa657', low:'#00e5a0' }
      if (!notices.length) { el.innerHTML = `<p class="empty-state">No notices</p>`; return }
      el.innerHTML = notices.map(n => `
        <div class="notice-item">
          <div class="notice-priority-dot" style="background:${pColors[n.priority]}"></div>
          <div style="flex:1">
            <div class="notice-title">${n.title}</div>
            <div class="notice-content">${n.content}</div>
            <div class="notice-date">${formatDate(n.date)}</div>
          </div>
          <button class="btn-danger-sm" onclick="deleteNotice('${n.id}')">✕</button>
        </div>
      `).join('')
    } catch (err) { showToast('Failed to load notices', 'error') }
  }

  async function addNotice() {
    const title    = document.getElementById('noticeTitle').value.trim()
    const content  = document.getElementById('noticeContent').value.trim()
    const priority = document.getElementById('noticePriority').value
    if (!title || !content) { showToast('Fill all fields', 'error'); return }
    try {
      await db.notices.create({ title, content, priority, created_by: user.id })
      await db.notifications.create({ type: 'notice', title: `📢 ${title}`, body: content.slice(0,80), target_role: 'student' })
      showToast('Notice added!', 'success')
      document.getElementById('noticeModal').classList.add('hidden')
      loadNotices()
    } catch (err) { showToast('Failed: ' + err.message, 'error') }
  }

  async function deleteNotice(id) {
    if (!confirm('Delete this notice?')) return
    try { await db.notices.delete(id); showToast('Deleted', 'success'); loadNotices() }
    catch (err) { showToast('Delete failed', 'error') }
  }
}

// ─── ACHIEVEMENTS ─────────────────────────────────────────────────
export async function renderAdminAchievements() {
  const user = requireAuth(['admin'])
  if (!user) return
  renderShell(user, 'achievements')
  const content = document.getElementById('pageContent')
  content.innerHTML = `
    <div class="page-container animate-up">
      <div class="page-header"><h1 class="page-title">Achievements</h1>
        <button class="btn-primary" onclick="openAchModal()">+ Add</button></div>
      <div id="achList"><div class="skeleton" style="height:300px;border-radius:12px"></div></div>
    </div>
    <div class="modal hidden" id="achModal">
      <div class="modal-box">
        <div class="modal-header"><h3>Add Achievement</h3>
          <button class="modal-close" onclick="document.getElementById('achModal').classList.add('hidden')">✕</button></div>
        <div class="modal-body">
          <div class="field-group"><label>Title</label><input type="text" id="achTitle" class="field-input" /></div>
          <div class="modal-grid">
            <div class="field-group"><label>Category</label>
              <select id="achCat" class="field-input">
                <option value="project">Project</option><option value="skill">Skill</option>
                <option value="award">Award</option><option value="research">Research</option>
              </select></div>
            <div class="field-group"><label>Semester</label>
              <select id="achSem" class="field-input">${[1,2,3,4,5,6].map(s=>`<option value="${s}">${s}</option>`).join('')}</select></div>
          </div>
          <div class="field-group"><label>Student Name</label><input type="text" id="achStudent" class="field-input" /></div>
          <div class="field-group"><label>Description</label><textarea id="achDesc" class="field-input" rows="3"></textarea></div>
          <div class="field-group"><label>Tags (comma-separated)</label><input type="text" id="achTags" class="field-input" placeholder="IoT, Arduino, Award" /></div>
        </div>
        <div class="modal-footer">
          <button class="btn-outline" onclick="document.getElementById('achModal').classList.add('hidden')">Cancel</button>
          <button class="btn-primary" onclick="addAchievement()">Add Achievement</button>
        </div>
      </div>
    </div>
  `
  window.openAchModal = () => document.getElementById('achModal').classList.remove('hidden')
  window.deleteAch = async (id) => {
    if (!confirm('Delete?')) return
    try { await db.achievements.delete(id); showToast('Deleted', 'success'); loadAch() }
    catch (err) { showToast('Failed', 'error') }
  }
  window.addAchievement = async () => {
    const title    = document.getElementById('achTitle').value.trim()
    const category = document.getElementById('achCat').value
    const semester = parseInt(document.getElementById('achSem').value)
    const student_name = document.getElementById('achStudent').value.trim()
    const description  = document.getElementById('achDesc').value.trim()
    const tags = document.getElementById('achTags').value.split(',').map(t => t.trim()).filter(Boolean)
    if (!title || !student_name) { showToast('Fill required fields', 'error'); return }
    try {
      await db.achievements.create({ title, category, semester, student_name, description, tags, added_by: user.id })
      showToast('Achievement added!', 'success')
      document.getElementById('achModal').classList.add('hidden')
      loadAch()
    } catch (err) { showToast('Failed: ' + err.message, 'error') }
  }
  loadAch()
  async function loadAch() {
    try {
      const items = await db.achievements.getAll()
      const el = document.getElementById('achList')
      const catIcons = { project:'🚀', skill:'💡', award:'🏆', research:'🔬' }
      if (!items.length) { el.innerHTML = `<p class="empty-state">No achievements yet</p>`; return }
      el.innerHTML = items.map(a => `
        <div class="ach-card">
          <div class="ach-icon">${catIcons[a.category] || '⭐'}</div>
          <div class="ach-body">
            <div class="ach-title">${a.title}</div>
            <div class="ach-student">${a.student_name} · Sem ${a.semester || '?'}</div>
            ${a.description ? `<div class="ach-desc">${a.description}</div>` : ''}
            <div class="ach-tags">${(a.tags||[]).map(t=>`<span class="tag-pill">${t}</span>`).join('')}</div>
          </div>
          <button class="btn-danger-sm" onclick="deleteAch('${a.id}')">✕</button>
        </div>
      `).join('')
    } catch (err) { showToast('Failed to load', 'error') }
  }
}

// ─── EVENTS ───────────────────────────────────────────────────────
export async function renderAdminEvents() {
  const user = requireAuth(['admin'])
  if (!user) return
  renderShell(user, 'events')
  const content = document.getElementById('pageContent')
  content.innerHTML = `
    <div class="page-container animate-up">
      <div class="page-header"><h1 class="page-title">Events</h1>
        <button class="btn-primary" onclick="openEventModal()">+ Add Event</button></div>
      <div id="eventsList"><div class="skeleton" style="height:300px;border-radius:12px"></div></div>
    </div>
    <div class="modal hidden" id="eventModal">
      <div class="modal-box">
        <div class="modal-header"><h3>Add Event</h3>
          <button class="modal-close" onclick="document.getElementById('eventModal').classList.add('hidden')">✕</button></div>
        <div class="modal-body">
          <div class="field-group"><label>Title</label><input type="text" id="evTitle" class="field-input" /></div>
          <div class="modal-grid">
            <div class="field-group"><label>Date</label><input type="date" id="evDate" class="field-input" /></div>
            <div class="field-group"><label>Type</label>
              <select id="evType" class="field-input">
                <option value="holiday">Holiday</option><option value="exam">Exam</option>
                <option value="seminar">Seminar</option><option value="program">Program</option>
              </select></div>
          </div>
          <div class="field-group"><label>Description</label>
            <textarea id="evDesc" class="field-input" rows="2" placeholder="Optional…"></textarea></div>
        </div>
        <div class="modal-footer">
          <button class="btn-outline" onclick="document.getElementById('eventModal').classList.add('hidden')">Cancel</button>
          <button class="btn-primary" onclick="addEvent()">Add Event</button>
        </div>
      </div>
    </div>
  `
  window.openEventModal = () => document.getElementById('eventModal').classList.remove('hidden')
  window.deleteEvent = async (id) => {
    if (!confirm('Delete?')) return
    try { await db.events.delete(id); showToast('Deleted', 'success'); loadEvents() }
    catch (_) { showToast('Failed', 'error') }
  }
  window.addEvent = async () => {
    const title = document.getElementById('evTitle').value.trim()
    const date  = document.getElementById('evDate').value
    const type  = document.getElementById('evType').value
    const desc  = document.getElementById('evDesc').value.trim()
    if (!title || !date) { showToast('Fill all fields', 'error'); return }
    try {
      await db.events.create({ title, date, type, description: desc, created_by: user.id })
      showToast('Event added!', 'success')
      document.getElementById('eventModal').classList.add('hidden')
      loadEvents()
    } catch (err) { showToast('Failed: ' + err.message, 'error') }
  }
  loadEvents()
  async function loadEvents() {
    try {
      const events = await db.events.getAll()
      const el = document.getElementById('eventsList')
      const typeColors = { holiday:'#ff5370', exam:'#ffa657', seminar:'#58a6ff', program:'#00e5a0' }
      if (!events.length) { el.innerHTML = `<p class="empty-state">No events</p>`; return }
      el.innerHTML = events.map(e => `
        <div class="leave-card">
          <div class="leave-header">
            <div>
              <div class="font-medium">${e.title}</div>
              <div class="leave-dates">${formatDate(e.date)}</div>
            </div>
            <div style="display:flex;align-items:center;gap:8px">
              <span class="badge" style="background:${typeColors[e.type]}20;color:${typeColors[e.type]}">${e.type}</span>
              <button class="btn-danger-sm" onclick="deleteEvent('${e.id}')">✕</button>
            </div>
          </div>
          ${e.description ? `<div class="leave-reason">${e.description}</div>` : ''}
        </div>
      `).join('')
    } catch (err) { showToast('Failed to load events', 'error') }
  }
}

// ─── ADMIN TIMETABLE ──────────────────────────────────────────────
export async function renderAdminTimetable() {
  const user = requireAuth(['admin'])
  if (!user) return
  // Reuse teacher timetable component
  const { renderTeacherTimetable } = await import('../teacher/timetable.js')
  await renderTeacherTimetable()
  // Re-render shell with admin nav
  renderShell(user, 'timetable')
}

// ─── ADMIN MARKS ──────────────────────────────────────────────────
export async function renderAdminMarks() {
  const user = requireAuth(['admin'])
  if (!user) return
  const { renderMarksEntry } = await import('../teacher/marks-entry.js')
  await renderMarksEntry()
  renderShell(user, 'marks')
}

// ─── ADMIN ATTENDANCE ─────────────────────────────────────────────
export async function renderAdminAttendance() {
  const user = requireAuth(['admin'])
  if (!user) return
  const { renderTeacherAttendance } = await import('../teacher/attendance.js')
  await renderTeacherAttendance()
  renderShell(user, 'attendance')
}

// ─── SHARED: Add User Modal ────────────────────────────────────────
function addUserModalHTML() {
  return `
    <div class="modal hidden" id="addUserModal">
      <div class="modal-box">
        <div class="modal-header"><h3 id="addUserTitle">Add User</h3>
          <button class="modal-close" onclick="closeAddUserModal()">✕</button></div>
        <div class="modal-body">
          <div class="field-group"><label>Full Name</label><input type="text" id="newName" class="field-input" /></div>
          <div class="field-group"><label>Email</label><input type="email" id="newEmail" class="field-input" /></div>
          <div class="field-group"><label>Password</label><input type="password" id="newPassword" class="field-input" placeholder="Min 6 characters" /></div>
          <div id="studentExtraFields">
            <div class="modal-grid">
              <div class="field-group"><label>Enrollment No.</label><input type="text" id="newEnroll" class="field-input" /></div>
              <div class="field-group"><label>Semester</label>
                <select id="newSem" class="field-input">${[1,2,3,4,5,6].map(s=>`<option value="${s}">${s}</option>`).join('')}</select></div>
            </div>
            <div class="field-group"><label>Batch</label><input type="text" id="newBatch" class="field-input" placeholder="e.g. 2024-2027" /></div>
            <div class="field-group"><label>Phone</label><input type="tel" id="newPhone" class="field-input" /></div>
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn-outline" onclick="closeAddUserModal()">Cancel</button>
          <button class="btn-primary" onclick="submitAddUser()">Create User</button>
        </div>
      </div>
    </div>
  `
}

let addingRole = 'student'
function openAddUserModal(role) {
  addingRole = role
  document.getElementById('addUserTitle').textContent = `Add ${capitalize(role)}`
  document.getElementById('studentExtraFields').style.display = role === 'student' ? '' : 'none'
  document.getElementById('addUserModal').classList.remove('hidden')
}

async function submitAddUser() {
  const name     = document.getElementById('newName').value.trim()
  const email    = document.getElementById('newEmail').value.trim()
  const password = document.getElementById('newPassword').value
  if (!name || !email || password.length < 6) { showToast('Fill all fields (min 6 char password)', 'error'); return }

  const profileData = { role: addingRole }
  if (addingRole === 'student') {
    profileData.enrollment_no = document.getElementById('newEnroll').value.trim()
    profileData.semester = parseInt(document.getElementById('newSem').value)
    profileData.batch    = document.getElementById('newBatch').value.trim()
    profileData.phone    = document.getElementById('newPhone').value.trim()
  }

  try {
    showToast('Creating user…', 'info')
    // Call Supabase Edge Function for admin user creation
    const { supabase, SUPABASE_URL } = await import('../../supabase.js')
    const { data: { session } } = await supabase.auth.getSession()
    const res = await fetch(`${SUPABASE_URL}/functions/v1/create-user`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${session?.access_token}` },
      body: JSON.stringify({ name, email, password, ...profileData })
    })
    const result = await res.json()
    if (!res.ok || result.error) throw new Error(result.error || 'Creation failed')
    showToast(`${capitalize(addingRole)} created!`, 'success')
    document.getElementById('addUserModal').classList.add('hidden')
    window.location.reload()
  } catch (err) { showToast('Failed: ' + err.message, 'error') }
}

async function deleteUser(id, name) {
  if (!confirm(`Delete ${name}? This cannot be undone.`)) return
  try {
    await db.profiles.delete(id)
    showToast(`${name} deleted`, 'success')
    window.location.reload()
  } catch (err) { showToast('Delete failed: ' + err.message, 'error') }
}

function getInitials(name) { return (name || 'U').split(' ').map(w=>w[0]).slice(0,2).join('').toUpperCase() }
function capitalize(s) { return s ? s[0].toUpperCase() + s.slice(1) : '' }
function formatDate(d) { return new Date(d).toLocaleDateString('en-IN', { day:'numeric', month:'short', year:'numeric' }) }
function escStr(s) { return String(s).replace(/'/g, "\\'") }
