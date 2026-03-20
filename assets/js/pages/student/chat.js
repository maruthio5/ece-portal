// assets/js/pages/student/chat.js
import { requireAuth } from '../../auth.js'
import { db } from '../../db.js'
import { renderShell } from '../../shared/shell.js'
import { showToast } from '../../toast.js'
import { subscribeToChat } from '../../realtime.js'

let cleanupChat = null
let pendingMarkRead = []
let markReadTimer = null

export async function renderStudentChat() {
  const user = requireAuth(['student'])
  if (!user) return

  if (!user.semester || !user.batch) {
    renderShell(user, 'chat')
    document.getElementById('pageContent').innerHTML = `
      <div class="empty-state-card"><div class="empty-icon">ðŸ’¬</div><p>No batch assigned yet.</p></div>
    `
    return
  }

  renderShell(user, 'chat')
  const content = document.getElementById('pageContent')
  content.innerHTML = `
    <div class="chat-shell">
      <div class="chat-header-bar">
        <div class="chat-title">Batch Chat</div>
        <div class="chat-subtitle">Sem ${user.semester} Â· ${user.batch}</div>
      </div>
      <div class="chat-messages" id="chatMessages">
        <div class="chat-loading">Loading messagesâ€¦</div>
      </div>
      <div class="chat-input-bar">
        <button class="chat-attach-btn" id="attachBtn" title="Attach media">ðŸ“Ž</button>
        <input type="file" id="mediaInput" hidden accept="image/*,video/*,.pdf,.doc,.docx" />
        <input type="text" class="chat-input" id="chatInput" placeholder="Type a messageâ€¦" autocomplete="off" />
        <button class="chat-send-btn" id="sendBtn">âž¤</button>
      </div>
    </div>
  `

  await loadMessages(user)

  // Subscribe to realtime new messages
  if (cleanupChat) cleanupChat()
  cleanupChat = subscribeToChat(user.semester, user.batch, (msg) => {
    if (msg.sender_id !== user.id) appendMessage(msg, user, false)
    scrollToBottom()
    scheduleBatchMarkRead(msg.id, user)
  })

  // Send on enter / button
  document.getElementById('chatInput').addEventListener('keydown', e => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(user) }
  })
  document.getElementById('sendBtn').addEventListener('click', () => sendMessage(user))
  document.getElementById('attachBtn').addEventListener('click', () => document.getElementById('mediaInput').click())
  document.getElementById('mediaInput').addEventListener('change', e => sendMediaMessage(e, user))

  // Cleanup on nav away
  window.addEventListener('hashchange', () => {
    if (cleanupChat) { cleanupChat(); cleanupChat = null }
    flushMarkRead(user)
  }, { once: true })
}

async function loadMessages(user) {
  const el = document.getElementById('chatMessages')
  try {
    const messages = await db.messages.getByBatch(user.semester, user.batch)
    el.innerHTML = ''
    if (!messages.length) {
      el.innerHTML = `<div class="chat-empty">No messages yet. Say hello! ðŸ‘‹</div>`
      return
    }
    messages.forEach(m => appendMessage(m, user, true))
    scrollToBottom()

    // Batch mark all unread as read
    const unread = messages.filter(m => m.sender_id !== user.id && !m.seenBy?.includes(user.id))
    if (unread.length) {
      await db.messages.markManyRead(unread.map(m => m.id), user.id)
    }
  } catch (err) {
    el.innerHTML = `<div class="chat-empty">Failed to load messages</div>`
    showToast('Chat load failed', 'error')
  }
}

function appendMessage(msg, currentUser, skipAnimation = false) {
  const el = document.getElementById('chatMessages')
  const isMine = msg.sender_id === currentUser.id
  const div = document.createElement('div')
  div.className = `chat-msg ${isMine ? 'chat-msg-mine' : 'chat-msg-theirs'} ${skipAnimation ? '' : 'animate-up'}`
  div.dataset.msgId = msg.id

  const time = new Date(msg.created_at).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })
  const isExpired = msg.message?.startsWith('[Expired]')
  const roleTag = msg.sender_role !== 'student' ? `<span class="msg-role-tag">${capitalize(msg.sender_role)}</span>` : ''

  let mediaHtml = ''
  if (msg.media_url && !isExpired) {
    if (msg.media_type?.startsWith('image/')) {
      mediaHtml = `<img src="${msg.media_url}" class="msg-media-img" onclick="window.open('${msg.media_url}')" />`
    } else {
      mediaHtml = `<a href="${msg.media_url}" target="_blank" class="msg-file-link">ðŸ“Ž ${msg.file_name || 'File'} (${msg.file_size || ''})</a>`
    }
  }

  div.innerHTML = `
    ${!isMine ? `<div class="msg-sender">${msg.sender_name} ${roleTag}</div>` : ''}
    <div class="msg-bubble ${isExpired ? 'msg-expired' : ''}">
      ${mediaHtml}
      ${msg.message ? `<div class="msg-text">${escapeHtml(msg.message)}</div>` : ''}
      <div class="msg-time">${time}${isMine ? ' âœ“' : ''}</div>
    </div>
  `
  el.appendChild(div)
}

async function sendMessage(user) {
  const input = document.getElementById('chatInput')
  const text = input.value.trim()
  if (!text) return

  input.value = ''
  try {
    const msg = await db.messages.send({
      sender_id: user.id,
      sender_name: user.name,
      sender_role: user.role,
      message: text,
      semester: user.semester,
      batch: user.batch
    })
    appendMessage({ ...msg, seenBy: [] }, user, false)
    scrollToBottom()
  } catch (err) {
    showToast('Failed to send message', 'error')
    input.value = text
  }
}

async function sendMediaMessage(e, user) {
  const file = e.target.files[0]
  if (!file) return
  if (file.size > 10 * 1024 * 1024) { showToast('File must be under 10MB', 'error'); return }

  try {
    showToast('Uploadingâ€¦', 'info')
    const { path, url, expiresAt } = await db.messages.uploadMedia(file, user.id)
    const msg = await db.messages.send({
      sender_id: user.id,
      sender_name: user.name,
      sender_role: user.role,
      message: null,
      semester: user.semester,
      batch: user.batch,
      media_type: file.type,
      media_url: url,
      media_path: path,
      file_name: file.name,
      file_size: formatBytes(file.size),
      expires_at: expiresAt
    })
    appendMessage({ ...msg, seenBy: [] }, user, false)
    scrollToBottom()
    showToast('Sent! (expires in 5h)', 'success')
  } catch (err) {
    showToast('Upload failed: ' + err.message, 'error')
  }
  e.target.value = ''
}

function scheduleBatchMarkRead(msgId, user) {
  pendingMarkRead.push(msgId)
  if (markReadTimer) clearTimeout(markReadTimer)
  markReadTimer = setTimeout(() => flushMarkRead(user), 1500)
}

async function flushMarkRead(user) {
  if (!pendingMarkRead.length) return
  const ids = [...pendingMarkRead]
  pendingMarkRead = []
  await db.messages.markManyRead(ids, user.id).catch(() => {})
}

function scrollToBottom() {
  const el = document.getElementById('chatMessages')
  if (el) el.scrollTop = el.scrollHeight
}

function escapeHtml(str) {
  return String(str).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')
}
function capitalize(s) { return s ? s[0].toUpperCase() + s.slice(1) : '' }
function formatBytes(b) {
  if (b < 1024) return b + 'B'
  if (b < 1048576) return (b/1024).toFixed(1) + 'KB'
  return (b/1048576).toFixed(1) + 'MB'
}

