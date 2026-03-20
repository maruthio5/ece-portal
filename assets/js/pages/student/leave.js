// assets/js/pages/student/leave.js
import { requireAuth } from '../../auth.js'
import { db } from '../../db.js'
import { renderShell } from '../../shared/shell.js'
import { showToast } from '../../toast.js'
import { subscribeToLeaveUpdates } from '../../realtime.js'

let cleanupRealtime = null

export async function renderStudentLeave() {
  const user = requireAuth(['student'])
  if (!user) return

  renderShell(user, 'leave')
  const content = document.getElementById('pageContent')
  content.innerHTML = `
    <div class="page-container animate-up">
      <div class="page-header">
        <h1 class="page-title">Leave Requests</h1>
        <button class="btn-primary" onclick="openLeaveModal()">+ Apply</button>
      </div>
      <div id="leaveList"><div class="skeleton" style="height:200px;border-radius:12px"></div></div>
    </div>

    <!-- Apply Leave Modal -->
    <div class="modal hidden" id="leaveModal">
      <div class="modal-box">
        <div class="modal-header">
          <h3>Apply for Leave</h3>
          <button class="modal-close" onclick="closeLeaveModal()">✕</button>
        </div>
        <div class="modal-body">
          <div class="field-group">
            <label>From Date</label>
            <input type="date" id="leaveFrom" class="field-input" min="${new Date().toISOString().split('T')[0]}" />
          </div>
          <div class="field-group">
            <label>To Date</label>
            <input type="date" id="leaveTo" class="field-input" min="${new Date().toISOString().split('T')[0]}" />
          </div>
          <div class="field-group">
            <label>Reason</label>
            <textarea id="leaveReason" class="field-input" rows="3" placeholder="Briefly explain your reason..."></textarea>
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn-outline" onclick="closeLeaveModal()">Cancel</button>
          <button class="btn-primary" onclick="submitLeave()">Submit Request</button>
        </div>
      </div>
    </div>
  `

  loadLeaves(user)

  // Subscribe to real-time status updates
  if (cleanupRealtime) cleanupRealtime()
  cleanupRealtime = subscribeToLeaveUpdates(user.id, (updated) => {
    showToast(`Leave request ${updated.status === 'approved' ? '✅ approved' : '❌ declined'}`, 
      updated.status === 'approved' ? 'success' : 'error')
    loadLeaves(user)
  })

  window.openLeaveModal = () => document.getElementById('leaveModal').classList.remove('hidden')
  window.closeLeaveModal = () => document.getElementById('leaveModal').classList.add('hidden')
  window.submitLeave = () => submitLeaveRequest(user)
  window.deleteLeave = (id) => deleteLeaveRequest(id, user)

  // Cleanup on nav away
  window.addEventListener('hashchange', () => { if (cleanupRealtime) { cleanupRealtime(); cleanupRealtime = null } }, { once: true })
}

async function loadLeaves(user) {
  try {
    const leaves = await db.leave.getByStudent(user.id)
    const el = document.getElementById('leaveList')
    if (!leaves.length) {
      el.innerHTML = `
        <div class="empty-state-card">
          <div class="empty-icon">🏖</div>
          <p>No leave requests yet</p>
          <p class="empty-sub">Tap "+ Apply" to submit one</p>
        </div>
      `
      return
    }

    const statusColors = { pending: '#ffa657', approved: '#00e5a0', declined: '#ff5370' }
    const statusIcons  = { pending: '⏳', approved: '✅', declined: '❌' }

    el.innerHTML = leaves.map(l => `
      <div class="leave-card">
        <div class="leave-header">
          <div>
            <div class="leave-dates">${formatDate(l.from_date)} → ${formatDate(l.to_date)}</div>
            <div class="leave-days">${daysBetween(l.from_date, l.to_date)} day(s)</div>
          </div>
          <span class="badge" style="background:${statusColors[l.status]}20;color:${statusColors[l.status]}">
            ${statusIcons[l.status]} ${capitalize(l.status)}
          </span>
        </div>
        <div class="leave-reason">${l.reason}</div>
        <div class="leave-footer">
          <span class="leave-applied">Applied: ${timeAgo(l.applied_at)}</span>
          ${l.status === 'pending' ? `
            <button class="btn-danger-sm" onclick="deleteLeave('${l.id}')">Withdraw</button>
          ` : ''}
        </div>
      </div>
    `).join('')
  } catch (err) {
    showToast('Failed to load leaves', 'error')
  }
}

async function submitLeaveRequest(user) {
  const from = document.getElementById('leaveFrom').value
  const to   = document.getElementById('leaveTo').value
  const reason = document.getElementById('leaveReason').value.trim()

  if (!from || !to || !reason) return showToast('Please fill all fields', 'error')
  if (new Date(to) < new Date(from)) return showToast('To date must be after From date', 'error')

  try {
    await db.leave.create({
      student_id: user.id,
      student_name: user.name,
      from_date: from,
      to_date: to,
      reason
    })
    // Notify admin
    await db.notifications.create({
      type: 'leave',
      title: `📝 New Leave Request`,
      body: `${user.name} · ${formatDate(from)} – ${formatDate(to)}`,
      target_role: 'admin'
    })
    showToast('Leave request submitted!', 'success')
    window.closeLeaveModal()
    loadLeaves(user)
  } catch (err) {
    showToast('Failed to submit: ' + err.message, 'error')
  }
}

async function deleteLeaveRequest(id, user) {
  if (!confirm('Withdraw this leave request?')) return
  try {
    await db.leave.delete(id)
    showToast('Request withdrawn', 'success')
    loadLeaves(user)
  } catch (err) {
    showToast('Failed to withdraw: ' + err.message, 'error')
  }
}

function formatDate(d) { return new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }) }
function daysBetween(a, b) { return Math.ceil((new Date(b) - new Date(a)) / 86400000) + 1 }
function capitalize(s) { return s ? s[0].toUpperCase() + s.slice(1) : '' }
function timeAgo(ts) {
  const d = Math.floor((Date.now() - new Date(ts)) / 86400000)
  return d === 0 ? 'today' : d === 1 ? 'yesterday' : `${d}d ago`
}

