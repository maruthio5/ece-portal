// assets/js/pages/student/qr-scan.js
import { requireAuth } from '../../auth.js'
import { db } from '../../db.js'
import { renderShell } from '../../shared/shell.js'
import { showToast } from '../../toast.js'

let scanner = null

export async function renderQRScan() {
  const user = requireAuth(['student'])
  if (!user) return

  renderShell(user, 'qr-scan')
  const content = document.getElementById('pageContent')
  content.innerHTML = `
    <div class="page-container animate-up">
      <div class="page-header">
        <h1 class="page-title">QR Attendance</h1>
      </div>

      <div class="qr-scan-card">
        <div class="qr-viewfinder" id="qrReader"></div>
        <div class="qr-status" id="qrStatus">
          <div class="qr-status-icon">📷</div>
          <p>Point camera at the QR code displayed by your teacher</p>
        </div>
      </div>

      <div class="qr-result hidden" id="qrResult"></div>

      <div class="qr-controls">
        <button class="btn-primary" id="startScanBtn" onclick="startScan()">Start Camera</button>
        <button class="btn-outline hidden" id="stopScanBtn" onclick="stopScan()">Stop Camera</button>
      </div>

      <div class="qr-manual-card">
        <p class="qr-manual-title">Or enter code manually</p>
        <div class="qr-manual-row">
          <input type="text" id="manualCode" class="field-input" placeholder="Enter attendance code…" />
          <button class="btn-primary" onclick="processManualCode()">Submit</button>
        </div>
      </div>
    </div>
  `

  window.startScan = () => startScanner(user)
  window.stopScan  = stopScanner
  window.processManualCode = () => {
    const code = document.getElementById('manualCode').value.trim()
    if (code) processQRData(code, user)
    else showToast('Enter a code', 'error')
  }

  // Cleanup on nav away
  window.addEventListener('hashchange', stopScanner, { once: true })
}

function startScanner(user) {
  if (!window.Html5Qrcode) {
    showToast('QR library not loaded', 'error'); return
  }
  document.getElementById('startScanBtn').classList.add('hidden')
  document.getElementById('stopScanBtn').classList.remove('hidden')

  scanner = new Html5Qrcode('qrReader')
  scanner.start(
    { facingMode: 'environment' },
    { fps: 10, qrbox: { width: 220, height: 220 } },
    (decodedText) => {
      stopScanner()
      processQRData(decodedText, user)
    },
    () => {} // ignore frame errors
  ).catch(err => {
    showToast('Camera error: ' + err, 'error')
    stopScanner()
  })
}

function stopScanner() {
  if (scanner) {
    scanner.stop().catch(() => {})
    scanner = null
  }
  document.getElementById('startScanBtn')?.classList.remove('hidden')
  document.getElementById('stopScanBtn')?.classList.add('hidden')
}

async function processQRData(data, user) {
  try {
    // QR payload: JSON { subject, teacher, semester, batch, date, expires }
    let payload
    try {
      payload = JSON.parse(data)
    } catch {
      showResult('error', '❌', 'Invalid QR code format')
      return
    }

    const { subject, teacher, semester, batch, date, expires } = payload

    // Validate expiry
    if (expires && Date.now() > expires) {
      showResult('error', '⏰', 'QR code has expired. Ask your teacher to regenerate.')
      return
    }

    // Validate batch match
    if (semester && user.semester && Number(semester) !== Number(user.semester)) {
      showResult('error', '🚫', `This QR is for Semester ${semester}, not yours (${user.semester})`)
      return
    }
    if (batch && user.batch && batch !== user.batch) {
      showResult('error', '🚫', `This QR is for batch ${batch}, not yours`)
      return
    }

    // Mark attendance
    await db.attendance.upsert({
      student_id:   user.id,
      student_name: user.name,
      subject:      subject || 'Unknown',
      date:         date || new Date().toISOString().split('T')[0],
      time:         new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
      status:       'present',
      semester:     user.semester,
      batch:        user.batch,
      teacher_name: teacher || '',
      qr_verified:  true
    })

    showResult('success', '✅', `Attendance marked for <strong>${subject}</strong>!`)
    showToast('Attendance marked!', 'success')

  } catch (err) {
    if (err.message?.includes('duplicate') || err.code === '23505') {
      showResult('warning', '⚠️', 'Already marked present for this class today')
    } else {
      showResult('error', '❌', 'Failed: ' + err.message)
      showToast('Mark attendance failed', 'error')
    }
  }
}

function showResult(type, icon, message) {
  const el = document.getElementById('qrResult')
  const colors = { success: '#00e5a0', error: '#ff5370', warning: '#ffa657' }
  el.className = `qr-result`
  el.style.borderColor = colors[type] || '#8b949e'
  el.innerHTML = `<span style="font-size:2rem">${icon}</span><p>${message}</p>`
  el.classList.remove('hidden')
}

