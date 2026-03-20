// assets/js/pages/student/projects.js
import { requireAuth } from '../../auth.js'
import { db } from '../../db.js'
import { renderShell } from '../../shared/shell.js'
import { showToast } from '../../toast.js'
import { subscribeToProjectPosts } from '../../realtime.js'

let cleanupRealtime = null
let activeGroupId = null

const STATUS_META = {
  planning:   { label: 'Planning',     color: '#58a6ff' },
  inprogress: { label: 'In Progress',  color: '#ffa657' },
  completed:  { label: 'Completed',    color: '#00e5a0' },
  stuck:      { label: 'Stuck 🛑',     color: '#ff5370' },
  review:     { label: 'In Review',    color: '#c084fc' },
  feedback:   { label: 'Feedback',     color: '#f0c040' },
}

export async function renderStudentProjects() {
  const user = requireAuth(['student'])
  if (!user) return

  renderShell(user, 'projects')
  const content = document.getElementById('pageContent')
  content.innerHTML = `
    <div class="page-container animate-up">
      <div class="page-header">
        <h1 class="page-title">My Projects</h1>
      </div>
      <div id="projectsContent"><div class="skeleton" style="height:300px;border-radius:12px"></div></div>
    </div>
  `

  window.addEventListener('hashchange', () => {
    if (cleanupRealtime) { cleanupRealtime(); cleanupRealtime = null }
  }, { once: true })

  loadProjects(user)
}

async function loadProjects(user) {
  try {
    const groups = await db.projects.getMine(user.id)
    const el = document.getElementById('projectsContent')

    if (!groups.length) {
      el.innerHTML = `
        <div class="empty-state-card">
          <div class="empty-icon">🗂</div>
          <p>Not assigned to any project group yet.</p>
          <p class="empty-sub">Your teacher will add you to a group.</p>
        </div>
      `
      return
    }

    el.innerHTML = `
      <div class="projects-list" id="projectsList"></div>
      <div class="project-feed-wrap hidden" id="projectFeedWrap">
        <button class="btn-outline back-btn" onclick="showProjectsList()">← Back to Groups</button>
        <div id="projectFeedHeader"></div>
        <div class="project-feed" id="projectFeed"></div>
        <div class="project-post-bar">
          <select id="postStatus" class="status-select">
            ${Object.entries(STATUS_META).map(([k,v]) => `<option value="${k}">${v.label}</option>`).join('')}
          </select>
          <input type="text" id="postText" class="chat-input" placeholder="Post an update…" />
          <button class="chat-send-btn" onclick="submitPost('${user.id}', '${escStr(user.name)}', '${user.role}')">➤</button>
        </div>
      </div>
    `

    const listEl = document.getElementById('projectsList')
    listEl.innerHTML = groups.map(g => `
      <div class="project-card" onclick="openProjectFeed('${g.id}', '${escStr(g.name)}', '${escStr(g.subject||'')}')">
        <div class="project-card-header">
          <div class="project-name">${g.name}</div>
          <span class="badge badge-info">${g.subject || 'General'}</span>
        </div>
        ${g.description ? `<div class="project-desc">${g.description}</div>` : ''}
        <div class="project-meta">
          ${g.deadline ? `📅 Deadline: ${new Date(g.deadline).toLocaleDateString('en-IN')}` : ''}
        </div>
      </div>
    `).join('')

    window.showProjectsList = () => {
      document.getElementById('projectsList').classList.remove('hidden')
      document.getElementById('projectFeedWrap').classList.add('hidden')
      if (cleanupRealtime) { cleanupRealtime(); cleanupRealtime = null }
    }

    window.openProjectFeed = (groupId, name, subject) => openFeed(groupId, name, subject, user)
    window.submitPost = (uid, uname, role) => {
      const status = document.getElementById('postStatus').value
      const text   = document.getElementById('postText').value.trim()
      if (!text) { showToast('Enter an update', 'error'); return }
      postUpdate(activeGroupId, uid, uname, role, status, text)
    }

  } catch (err) {
    showToast('Failed to load projects', 'error')
  }
}

async function openFeed(groupId, name, subject, user) {
  activeGroupId = groupId
  document.getElementById('projectsList').classList.add('hidden')
  const wrap = document.getElementById('projectFeedWrap')
  wrap.classList.remove('hidden')

  document.getElementById('projectFeedHeader').innerHTML = `
    <div class="project-feed-title">
      <div class="project-name">${name}</div>
      <span class="badge badge-info">${subject}</span>
    </div>
  `

  const feedEl = document.getElementById('projectFeed')
  feedEl.innerHTML = `<div class="chat-loading">Loading updates…</div>`

  try {
    const posts = await db.projects.getPosts(groupId)
    renderPosts(posts, feedEl)
  } catch (err) {
    feedEl.innerHTML = `<div class="chat-empty">Failed to load</div>`
  }

  // Subscribe to realtime new posts
  if (cleanupRealtime) cleanupRealtime()
  cleanupRealtime = subscribeToProjectPosts(groupId, (post) => {
    if (post.sender_id !== user.id) {
      const feedEl = document.getElementById('projectFeed')
      if (feedEl) prependPost(post, feedEl)
    }
  })
}

function renderPosts(posts, el) {
  if (!posts.length) { el.innerHTML = `<div class="chat-empty">No updates yet. Post the first one!</div>`; return }
  el.innerHTML = posts.map(p => postHTML(p)).join('')
}

function prependPost(post, el) {
  const div = document.createElement('div')
  div.innerHTML = postHTML(post)
  el.prepend(div.firstChild)
}

function postHTML(p) {
  const meta = STATUS_META[p.status] || { label: p.status, color: '#8b949e' }
  const expired = p.file_name?.startsWith('[Expired]')
  return `
    <div class="post-card">
      <div class="post-header">
        <div class="post-sender">${p.sender_name}</div>
        <span class="badge" style="background:${meta.color}20;color:${meta.color}">${meta.label}</span>
      </div>
      ${p.text ? `<div class="post-text">${p.text}</div>` : ''}
      ${p.media_url && !expired ? `<a href="${p.media_url}" class="msg-file-link" target="_blank">📎 ${p.file_name || 'File'}</a>` : ''}
      ${expired ? `<div class="msg-expired">📎 ${p.file_name}</div>` : ''}
      ${p.teacher_feedback ? `<div class="post-feedback">💬 Teacher: ${p.teacher_feedback}</div>` : ''}
      <div class="post-time">${timeAgo(p.created_at)}</div>
    </div>
  `
}

async function postUpdate(groupId, uid, uname, role, status, text) {
  try {
    const post = await db.projects.addPost({
      group_id: groupId,
      sender_id: uid,
      sender_name: uname,
      sender_role: role,
      status,
      text
    })
    document.getElementById('postText').value = ''
    const feedEl = document.getElementById('projectFeed')
    prependPost(post, feedEl)
    showToast('Update posted!', 'success')
  } catch (err) {
    showToast('Failed to post update', 'error')
  }
}

function timeAgo(ts) {
  const m = Math.floor((Date.now() - new Date(ts)) / 60000)
  if (m < 1) return 'just now'
  if (m < 60) return `${m}m ago`
  const h = Math.floor(m/60)
  if (h < 24) return `${h}h ago`
  return `${Math.floor(h/24)}d ago`
}
function escStr(s) { return String(s).replace(/'/g, "\\'") }

