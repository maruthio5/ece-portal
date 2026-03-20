// assets/js/pages/teacher/projects.js
import { requireAuth } from '../../auth.js'
import { db } from '../../db.js'
import { renderShell } from '../../shared/shell.js'
import { showToast } from '../../toast.js'
import { subscribeToProjectPosts } from '../../realtime.js'

let cleanupRealtime = null

const STATUS_META = {
  planning:   { label: 'Planning',    color: '#58a6ff' },
  inprogress: { label: 'In Progress', color: '#ffa657' },
  completed:  { label: 'Completed',   color: '#00e5a0' },
  stuck:      { label: 'Stuck 🛑',    color: '#ff5370' },
  review:     { label: 'In Review',   color: '#c084fc' },
  feedback:   { label: 'Feedback',    color: '#f0c040' },
}

export async function renderTeacherProjects() {
  const user = requireAuth(['teacher'])
  if (!user) return

  renderShell(user, 'projects')
  const content = document.getElementById('pageContent')
  content.innerHTML = `
    <div class="page-container animate-up">
      <div class="page-header">
        <h1 class="page-title">Project Groups</h1>
        <button class="btn-primary" onclick="openCreateGroupModal()">+ Create Group</button>
      </div>
      <div id="groupsList"><div class="skeleton" style="height:300px;border-radius:12px"></div></div>
      <div class="project-feed-wrap hidden" id="feedWrap">
        <button class="btn-outline back-btn" onclick="backToGroups()">← Back</button>
        <div id="feedHeader"></div>
        <div class="project-feed" id="projectFeed"></div>
      </div>
    </div>

    <!-- Create Group Modal -->
    <div class="modal hidden" id="createGroupModal">
      <div class="modal-box">
        <div class="modal-header">
          <h3>Create Project Group</h3>
          <button class="modal-close" onclick="closeCreateGroupModal()">✕</button>
        </div>
        <div class="modal-body">
          <div class="field-group"><label>Group Name</label>
            <input type="text" id="gName" class="field-input" placeholder="Team Alpha" /></div>
          <div class="field-group"><label>Subject</label>
            <input type="text" id="gSubject" class="field-input" placeholder="Project subject" /></div>
          <div class="field-group"><label>Description</label>
            <textarea id="gDesc" class="field-input" rows="2" placeholder="Brief description…"></textarea></div>
          <div class="modal-grid">
            <div class="field-group"><label>Semester</label>
              <select id="gSem" class="field-input">${[1,2,3,4,5,6].map(s=>`<option value="${s}">${s}</option>`).join('')}</select></div>
            <div class="field-group"><label>Batch</label>
              <input type="text" id="gBatch" class="field-input" placeholder="2024-2027" /></div>
          </div>
          <div class="field-group"><label>Deadline</label>
            <input type="date" id="gDeadline" class="field-input" /></div>
        </div>
        <div class="modal-footer">
          <button class="btn-outline" onclick="closeCreateGroupModal()">Cancel</button>
          <button class="btn-primary" onclick="createGroup()">Create Group</button>
        </div>
      </div>
    </div>

    <!-- Feedback Modal -->
    <div class="modal hidden" id="feedbackModal">
      <div class="modal-box">
        <div class="modal-header"><h3>Add Feedback</h3>
          <button class="modal-close" onclick="closeFeedbackModal()">✕</button></div>
        <div class="modal-body">
          <textarea id="feedbackText" class="field-input" rows="4" placeholder="Your feedback…"></textarea>
        </div>
        <div class="modal-footer">
          <button class="btn-outline" onclick="closeFeedbackModal()">Cancel</button>
          <button class="btn-primary" onclick="submitFeedback()">Submit Feedback</button>
        </div>
      </div>
    </div>
  `

  let feedbackTargetPostId = null

  window.openCreateGroupModal = () => document.getElementById('createGroupModal').classList.remove('hidden')
  window.closeCreateGroupModal = () => document.getElementById('createGroupModal').classList.add('hidden')
  window.closeFeedbackModal = () => document.getElementById('feedbackModal').classList.add('hidden')
  window.openFeedbackModal = (postId) => {
    feedbackTargetPostId = postId
    document.getElementById('feedbackText').value = ''
    document.getElementById('feedbackModal').classList.remove('hidden')
  }
  window.submitFeedback = async () => {
    const text = document.getElementById('feedbackText').value.trim()
    if (!text || !feedbackTargetPostId) return
    try {
      await db.projects.addFeedback(feedbackTargetPostId, text)
      showToast('Feedback submitted!', 'success')
      window.closeFeedbackModal()
      // Refresh post in feed
      document.querySelector(`[data-post-id="${feedbackTargetPostId}"] .post-feedback`)?.remove()
      const postEl = document.querySelector(`[data-post-id="${feedbackTargetPostId}"]`)
      if (postEl) postEl.insertAdjacentHTML('beforeend', `<div class="post-feedback">💬 Teacher: ${text}</div>`)
    } catch (err) { showToast('Failed: ' + err.message, 'error') }
  }
  window.createGroup = async () => {
    const name    = document.getElementById('gName').value.trim()
    const subject = document.getElementById('gSubject').value.trim()
    const desc    = document.getElementById('gDesc').value.trim()
    const sem     = parseInt(document.getElementById('gSem').value)
    const batch   = document.getElementById('gBatch').value.trim()
    const deadline= document.getElementById('gDeadline').value || null
    if (!name || !batch) { showToast('Name and batch required', 'error'); return }
    try {
      await db.projects.create({ name, subject, description: desc, semester: sem, batch, deadline, teacher_id: user.id })
      showToast('Group created!', 'success')
      window.closeCreateGroupModal()
      loadGroups()
    } catch (err) { showToast('Failed: ' + err.message, 'error') }
  }
  window.backToGroups = () => {
    document.getElementById('groupsList').classList.remove('hidden')
    document.getElementById('feedWrap').classList.add('hidden')
    if (cleanupRealtime) { cleanupRealtime(); cleanupRealtime = null }
  }
  window.openFeed = openFeed

  loadGroups()

  window.addEventListener('hashchange', () => {
    if (cleanupRealtime) { cleanupRealtime(); cleanupRealtime = null }
  }, { once: true })

  async function loadGroups() {
    try {
      const groups = await db.projects.getAll()
      const el = document.getElementById('groupsList')
      if (!groups.length) { el.innerHTML = `<div class="empty-state-card"><div class="empty-icon">🗂</div><p>No groups yet</p></div>`; return }
      el.innerHTML = groups.map(g => `
        <div class="project-card" onclick="openFeed('${g.id}', '${escStr(g.name)}', '${escStr(g.subject||'')}')">
          <div class="project-card-header">
            <div class="project-name">${g.name}</div>
            <span class="badge badge-info">${g.subject || 'General'}</span>
          </div>
          ${g.description ? `<div class="project-desc">${g.description}</div>` : ''}
          <div class="project-meta">Sem ${g.semester} · ${g.batch}${g.deadline ? ` · Deadline: ${new Date(g.deadline).toLocaleDateString('en-IN')}` : ''}</div>
        </div>
      `).join('')
    } catch (err) { showToast('Failed to load groups', 'error') }
  }

  async function openFeed(groupId, name, subject) {
    document.getElementById('groupsList').classList.add('hidden')
    document.getElementById('feedWrap').classList.remove('hidden')
    document.getElementById('feedHeader').innerHTML = `
      <div class="project-feed-title"><div class="project-name">${name}</div>
        <span class="badge badge-info">${subject}</span></div>
    `
    const feedEl = document.getElementById('projectFeed')
    feedEl.innerHTML = `<div class="chat-loading">Loading…</div>`
    try {
      const posts = await db.projects.getPosts(groupId)
      feedEl.innerHTML = ''
      if (!posts.length) { feedEl.innerHTML = `<div class="chat-empty">No updates yet</div>`; return }
      posts.forEach(p => feedEl.insertAdjacentHTML('beforeend', postHTML(p)))
    } catch (err) { feedEl.innerHTML = `<div class="chat-empty">Load failed</div>` }

    if (cleanupRealtime) cleanupRealtime()
    cleanupRealtime = subscribeToProjectPosts(groupId, (post) => {
      const feedEl = document.getElementById('projectFeed')
      if (feedEl) feedEl.insertAdjacentHTML('afterbegin', postHTML(post))
    })
  }
}

function postHTML(p) {
  const meta = STATUS_META[p.status] || { label: p.status, color: '#8b949e' }
  return `
    <div class="post-card" data-post-id="${p.id}">
      <div class="post-header">
        <div class="post-sender">${p.sender_name}</div>
        <div style="display:flex;gap:8px;align-items:center">
          <span class="badge" style="background:${meta.color}20;color:${meta.color}">${meta.label}</span>
          <button class="btn-outline btn-sm" onclick="openFeedbackModal('${p.id}')">+ Feedback</button>
        </div>
      </div>
      ${p.text ? `<div class="post-text">${p.text}</div>` : ''}
      ${p.media_url ? `<a href="${p.media_url}" class="msg-file-link" target="_blank">📎 ${p.file_name||'File'}</a>` : ''}
      ${p.teacher_feedback ? `<div class="post-feedback">💬 Teacher: ${p.teacher_feedback}</div>` : ''}
      <div class="post-time">${timeAgo(p.created_at)}</div>
    </div>
  `
}

function timeAgo(ts) {
  const m = Math.floor((Date.now() - new Date(ts)) / 60000)
  if (m < 1) return 'just now'; if (m < 60) return `${m}m ago`
  const h = Math.floor(m/60); if (h < 24) return `${h}h ago`; return `${Math.floor(h/24)}d ago`
}
function escStr(s) { return String(s).replace(/'/g, "\\'") }
      subject,
      teacher: user.name,
      semester: null, // allow any semester
      batch: null,
      date: date || new Date().toISOString().split('T')[0],
      expires
    })

    const display = document.getElementById('qrDisplay')
    display.classList.remove('hidden')
    document.getElementById('qrDisplaySubject').textContent = subject

    // Clear old QR
    const container = document.getElementById('qrCode')
    container.innerHTML = ''

    if (window.QRCode) {
      new QRCode(container, {
        text: payload,
        width: 220,
        height: 220,
        colorDark: '#00e5a0',
        colorLight: '#0d1117',
        correctLevel: QRCode.CorrectLevel.M
      })
    } else {
      container.innerHTML = `<p style="color:#ff5370">QR library not loaded</p>`
    }

    // Countdown timer
    if (timerInterval) clearInterval(timerInterval)
    const updateTimer = () => {
      const remaining = Math.max(0, Math.ceil((expires - Date.now()) / 1000))
      const min = Math.floor(remaining / 60)
      const sec = remaining % 60
      const timerEl = document.getElementById('qrTimer')
      if (timerEl) {
        timerEl.textContent = remaining > 0
          ? `⏱ Expires in ${min}:${String(sec).padStart(2,'0')}`
          : '⛔ Expired — regenerate'
        timerEl.style.color = remaining < 60 ? '#ff5370' : '#ffa657'
      }
      if (remaining === 0) clearInterval(timerInterval)
    }
    updateTimer()
    timerInterval = setInterval(updateTimer, 1000)

    showToast('QR generated! Show to students', 'success')
  }

  window.addEventListener('hashchange', () => { if (timerInterval) clearInterval(timerInterval) }, { once: true })
}

