// assets/js/pages/teacher/qr-generate.js
import { requireAuth } from '../../auth.js'
import { db } from '../../db.js'
import { renderShell } from '../../shared/shell.js'
import { showToast } from '../../toast.js'

const QR_VALIDITY_MS = 15 * 60 * 1000 // 15 minutes

export async function renderQRGenerate() {
  const user = requireAuth(['teacher'])
  if (!user) return

  renderShell(user, 'qr-generate')
  const content = document.getElementById('pageContent')

  // Load timetable to pre-fill subjects
  let subjects = []
  try {
    const all = await db.timetable.getAll()
    const mine = all.filter(t => t.teacher_id === user.id || t.teacher === user.name)
    subjects = [...new Set(mine.map(t => t.subject))].sort()
  } catch (_) {}

  content.innerHTML = `
    <div class="page-container animate-up">
      <div class="page-header">
        <h1 class="page-title">QR Attendance</h1>
      </div>

      <div class="panel">
        <h3 class="panel-section-title">Generate QR Code</h3>
        <div class="field-group">
          <label>Subject</label>
          <select id="qrSubject" class="field-input">
            <option value="">— Select Subject —</option>
            ${subjects.map(s => `<option value="${s}">${s}</option>`).join('')}
            <option value="__custom">Other (type below)</option>
          </select>
        </div>
        <div class="field-group hidden" id="customSubjectWrap">
          <label>Custom Subject Name</label>
          <input type="text" id="customSubject" class="field-input" placeholder="Enter subject name" />
        </div>
        <div class="field-group">
          <label>Date</label>
          <input type="date" id="qrDate" class="field-input" value="${new Date().toISOString().split('T')[0]}" />
        </div>
        <div class="field-group">
          <label>Validity</label>
          <select id="qrValidity" class="field-input">
            <option value="900000">15 minutes</option>
            <option value="1800000">30 minutes</option>
            <option value="3600000">1 hour</option>
          </select>
        </div>
        <button class="btn-primary" style="width:100%" onclick="generateQR()">Generate QR Code</button>
      </div>

      <!-- QR Display -->
      <div class="qr-display-card hidden" id="qrDisplay">
        <div class="qr-display-subject" id="qrDisplaySubject"></div>
        <div id="qrCode" class="qr-code-container"></div>
        <div class="qr-timer" id="qrTimer"></div>
        <button class="btn-outline" style="width:100%;margin-top:12px" onclick="regenerateQR()">Regenerate</button>
      </div>
    </div>
  `

  document.getElementById('qrSubject').addEventListener('change', function() {
    document.getElementById('customSubjectWrap').classList.toggle('hidden', this.value !== '__custom')
  })

  let timerInterval = null
  window.generateQR = generateQR
  window.regenerateQR = generateQR

  function generateQR() {
    let subject = document.getElementById('qrSubject').value
    if (subject === '__custom') subject = document.getElementById('customSubject').value.trim()
    const date = document.getElementById('qrDate').value
    const validity = parseInt(document.getElementById('qrValidity').value)

    if (!subject) { showToast('Select or enter a subject', 'error'); return }

    const expires = Date.now() + validity
    const payload = JSON.stringify({
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

