// assets/js/pages/teacher/chat.js
// Teacher chat â€” mirrors student chat but teacher can message all batches
import { requireAuth } from '../../auth.js'
import { db } from '../../db.js'
import { renderShell } from '../../shared/shell.js'
import { showToast } from '../../toast.js'
import { subscribeToChat } from '../../realtime.js'

let cleanupChat = null

export async function renderTeacherChat() {
  const user = requireAuth(['teacher'])
  if (!user) return

  renderShell(user, 'chat')
  const content = document.getElementById('pageContent')

  // Load batches from timetable
  let batches = []
  try {
    const tt = await db.timetable.getAll()
    const unique = new Map()
    tt.forEach(t => { if (t.semester && t.batch) unique.set(`${t.semester}||${t.batch}`, { semester: t.semester, batch: t.batch }) })
    batches = [...unique.values()]
  } catch (_) {}

  if (!batches.length) batches = [{ semester: 3, batch: '2024-2027' }]

  content.innerHTML = `
    <div class="chat-shell">
      <div class="chat-header-bar">
        <select id="batchSelect" class="chat-batch-select" onchange="switchBatch()">
          ${batches.map(b => `<option value="${b.semester}||${b.batch}">Sem ${b.semester} Â· ${b.batch}</option>`).join('')}
        </select>
      </div>
      <div class="chat-messages" id="chatMessages"><div class="chat-loading">Loadingâ€¦</div></div>
      <div class="chat-input-bar">
        <button class="chat-attach-btn" id="attachBtn">ðŸ“Ž</button>
        <input type="file" id="mediaInput" hidden accept="image/*,video/*,.pdf" />
        <input type="text" class="chat-input" id="chatInput" placeholder="Message to batchâ€¦" autocomplete="off" />
        <button class="chat-send-btn" id="sendBtn">âž¤</button>
      </div>
    </div>
  `

  let activeSemester = batches[0].semester
  let activeBatch    = batches[0].batch

  window.switchBatch = () => {
    const [sem, batch] = document.getElementById('batchSelect').value.split('||')
    activeSemester = parseInt(sem)
    activeBatch = batch
    loadMessages()
  }

  const loadMessages = async () => {
    const el = document.getElementById('chatMessages')
    el.innerHTML = `<div class="chat-loading">Loadingâ€¦</div>`
    try {
      const msgs = await db.messages.getByBatch(activeSemester, activeBatch)
      el.innerHTML = ''
      if (!msgs.length) { el.innerHTML = `<div class="chat-empty">No messages yet</div>`; return }
      msgs.forEach(m => appendMsg(m, user, true))
      el.scrollTop = el.scrollHeight
      const unread = msgs.filter(m => m.sender_id !== user.id && !m.seenBy?.includes(user.id))
      if (unread.length) await db.messages.markManyRead(unread.map(m => m.id), user.id)
    } catch (err) { el.innerHTML = `<div class="chat-empty">Load failed</div>` }

    if (cleanupChat) cleanupChat()
    cleanupChat = subscribeToChat(activeSemester, activeBatch, (msg) => {
      if (msg.sender_id !== user.id) {
        appendMsg(msg, user, false)
        document.getElementById('chatMessages').scrollTop = 9999
      }
    })
  }

  document.getElementById('chatInput').addEventListener('keydown', e => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMsg() }
  })
  document.getElementById('sendBtn').addEventListener('click', sendMsg)
  document.getElementById('attachBtn').addEventListener('click', () => document.getElementById('mediaInput').click())
  document.getElementById('mediaInput').addEventListener('change', sendMedia)

  async function sendMsg() {
    const input = document.getElementById('chatInput')
    const text = input.value.trim()
    if (!text) return
    input.value = ''
    try {
      const msg = await db.messages.send({
        sender_id: user.id, sender_name: user.name, sender_role: user.role,
        message: text, semester: activeSemester, batch: activeBatch
      })
      appendMsg({ ...msg, seenBy: [] }, user, false)
      document.getElementById('chatMessages').scrollTop = 9999
    } catch (err) { showToast('Send failed', 'error'); input.value = text }
  }

  async function sendMedia(e) {
    const file = e.target.files[0]
    if (!file) return
    if (file.size > 10485760) { showToast('Max 10MB', 'error'); return }
    try {
      showToast('Uploadingâ€¦', 'info')
      const { path, url, expiresAt } = await db.messages.uploadMedia(file, user.id)
      const msg = await db.messages.send({
        sender_id: user.id, sender_name: user.name, sender_role: user.role,
        message: null, semester: activeSemester, batch: activeBatch,
        media_type: file.type, media_url: url, media_path: path,
        file_name: file.name, file_size: fmtBytes(file.size), expires_at: expiresAt
      })
      appendMsg({ ...msg, seenBy: [] }, user, false)
      document.getElementById('chatMessages').scrollTop = 9999
    } catch (err) { showToast('Upload failed', 'error') }
    e.target.value = ''
  }

  window.addEventListener('hashchange', () => { if (cleanupChat) { cleanupChat(); cleanupChat = null } }, { once: true })
  loadMessages()
}

function appendMsg(msg, me, skipAnim) {
  const el = document.getElementById('chatMessages')
  const isMine = msg.sender_id === me.id
  const div = document.createElement('div')
  div.className = `chat-msg ${isMine ? 'chat-msg-mine' : 'chat-msg-theirs'} ${skipAnim ? '' : 'animate-up'}`
  const time = new Date(msg.created_at).toLocaleTimeString('en-IN', { hour:'2-digit', minute:'2-digit' })
  const expired = msg.message?.startsWith('[Expired]')
  let media = ''
  if (msg.media_url && !expired) {
    media = msg.media_type?.startsWith('image/')
      ? `<img src="${msg.media_url}" class="msg-media-img" onclick="window.open('${msg.media_url}')" />`
      : `<a href="${msg.media_url}" class="msg-file-link" target="_blank">ðŸ“Ž ${msg.file_name || 'File'}</a>`
  }
  div.innerHTML = `
    ${!isMine ? `<div class="msg-sender">${msg.sender_name} <span class="msg-role-tag">${capitalize(msg.sender_role)}</span></div>` : ''}
    <div class="msg-bubble ${expired ? 'msg-expired' : ''}">
      ${media}
      ${msg.message ? `<div class="msg-text">${esc(msg.message)}</div>` : ''}
      <div class="msg-time">${time}</div>
    </div>
  `
  el.appendChild(div)
}

function esc(s) { return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;') }
function capitalize(s) { return s ? s[0].toUpperCase() + s.slice(1) : '' }
function fmtBytes(b) { return b < 1048576 ? (b/1024).toFixed(1)+'KB' : (b/1048576).toFixed(1)+'MB' }

