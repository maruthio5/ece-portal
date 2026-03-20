// assets/js/shared/shell.js
// Renders the main app shell: header + bottom nav + page content area
// Used by all authenticated pages

import { getCurrentUser, logout } from '../auth.js'
import { toggleTheme } from '../theme.js'
import { db } from '../db.js'

const navConfigs = {
  admin: [
    { id: 'dashboard',    icon: '⊞',  label: 'Dashboard',  href: '#/admin/dashboard'    },
    { id: 'students',     icon: '👥',  label: 'Students',   href: '#/admin/students'     },
    { id: 'teachers',     icon: '🧑‍🏫', label: 'Teachers',   href: '#/admin/teachers'     },
    { id: 'attendance',   icon: '📋',  label: 'Attendance', href: '#/admin/attendance'   },
    { id: 'marks',        icon: '📊',  label: 'Marks',      href: '#/admin/marks'        },
    { id: 'timetable',    icon: '📅',  label: 'Timetable',  href: '#/admin/timetable'    },
    { id: 'leave',        icon: '🏖',  label: 'Leave',      href: '#/admin/leave'        },
    { id: 'notices',      icon: '📢',  label: 'Notices',    href: '#/admin/notices'      },
    { id: 'events',       icon: '📆',  label: 'Events',     href: '#/admin/events'       },
    { id: 'achievements', icon: '🏆',  label: 'Achieve',    href: '#/admin/achievements' },
  ],
  teacher: [
    { id: 'dashboard',   icon: '⊞',  label: 'Dashboard', href: '#/teacher/dashboard'   },
    { id: 'attendance',  icon: '📋',  label: 'Attendance',href: '#/teacher/attendance'  },
    { id: 'marks-entry', icon: '📊',  label: 'Marks',     href: '#/teacher/marks-entry' },
    { id: 'timetable',   icon: '📅',  label: 'Timetable', href: '#/teacher/timetable'   },
    { id: 'projects',    icon: '🗂',  label: 'Projects',  href: '#/teacher/projects'    },
    { id: 'chat',        icon: '💬',  label: 'Chat',      href: '#/teacher/chat'        },
    { id: 'qr-generate', icon: '⬛',  label: 'QR Code',   href: '#/teacher/qr-generate' },
  ],
  student: [
    { id: 'dashboard',  icon: '⊞', label: 'Dashboard', href: '#/student/dashboard'  },
    { id: 'attendance', icon: '📋', label: 'Attendance',href: '#/student/attendance' },
    { id: 'marks',      icon: '📊', label: 'Marks',     href: '#/student/marks'      },
    { id: 'timetable',  icon: '📅', label: 'Timetable', href: '#/student/timetable'  },
    { id: 'leave',      icon: '🏖', label: 'Leave',     href: '#/student/leave'      },
    { id: 'chat',       icon: '💬', label: 'Chat',      href: '#/student/chat'       },
    { id: 'projects',   icon: '🗂', label: 'Projects',  href: '#/student/projects'   },
    { id: 'qr-scan',    icon: '📷', label: 'QR Scan',   href: '#/student/qr-scan'    },
  ]
}

// Only show first 5 in bottom nav, rest in a "More" sheet
const BOTTOM_NAV_MAX = 5

export function renderShell(user, activePageId) {
  const nav = navConfigs[user.role] || []
  const bottomNav = nav.slice(0, BOTTOM_NAV_MAX)
  const moreNav   = nav.slice(BOTTOM_NAV_MAX)

  document.getElementById('app').innerHTML = `
    <!-- ══════════════ HEADER ══════════════ -->
    <header class="app-header" id="appHeader">
      <div class="header-left">
        <div class="header-logo">⚡ ECE</div>
      </div>
      <div class="header-right">
        <button class="icon-btn" id="themeToggle" title="Toggle theme">☀️</button>
        <button class="icon-btn notif-btn" id="notifBtn" title="Notifications">
          🔔
          <span class="notif-badge hidden" id="notifBadge">0</span>
        </button>
        <button class="avatar-btn" id="profileBtn">
          ${user.avatar_url
            ? `<img src="${user.avatar_url}" class="avatar-img" alt="${user.name}">`
            : `<div class="avatar-initials">${getInitials(user.name)}</div>`
          }
        </button>
      </div>
    </header>

    <!-- ══════════════ MAIN CONTENT ══════════════ -->
    <main class="app-main" id="pageContent">
      <!-- page renders here -->
    </main>

    <!-- ══════════════ BOTTOM NAV ══════════════ -->
    <nav class="bottom-nav" id="bottomNav">
      ${bottomNav.map(item => `
        <a href="${item.href}" class="nav-item ${item.id === activePageId ? 'active' : ''}" data-id="${item.id}">
          <span class="nav-icon">${item.icon}</span>
          <span class="nav-label">${item.label}</span>
        </a>
      `).join('')}
      ${moreNav.length ? `
        <button class="nav-item" id="moreBtn">
          <span class="nav-icon">⋯</span>
          <span class="nav-label">More</span>
        </button>
      ` : ''}
    </nav>

    <!-- ══════════════ MORE SHEET ══════════════ -->
    ${moreNav.length ? `
    <div class="bottom-sheet hidden" id="moreSheet">
      <div class="sheet-handle"></div>
      <div class="sheet-title">More</div>
      <div class="sheet-grid">
        ${moreNav.map(item => `
          <a href="${item.href}" class="sheet-item ${item.id === activePageId ? 'active' : ''}">
            <span class="sheet-icon">${item.icon}</span>
            <span>${item.label}</span>
          </a>
        `).join('')}
        <button class="sheet-item" onclick="handleLogout()">
          <span class="sheet-icon">🚪</span>
          <span>Logout</span>
        </button>
      </div>
    </div>
    <div class="sheet-overlay hidden" id="sheetOverlay"></div>
    ` : ''}

    <!-- ══════════════ PROFILE SHEET ══════════════ -->
    <div class="bottom-sheet hidden" id="profileSheet">
      <div class="sheet-handle"></div>
      <div class="profile-header">
        <div class="profile-avatar" id="profileAvatar">
          ${user.avatar_url
            ? `<img src="${user.avatar_url}" class="avatar-img-lg" alt="${user.name}">`
            : `<div class="avatar-initials-lg">${getInitials(user.name)}</div>`
          }
          <button class="avatar-edit-btn" id="avatarEditBtn" title="Change photo">✏️</button>
          <input type="file" id="avatarInput" accept="image/*" hidden />
        </div>
        <div class="profile-info">
          <div class="profile-name">${user.name}</div>
          <div class="profile-role">${capitalize(user.role)}</div>
          <div class="profile-email">${user.email}</div>
        </div>
      </div>
      ${user.role === 'student' ? `
        <div class="profile-details">
          <div class="detail-row"><span>Enrollment</span><span>${user.enrollment_no || '—'}</span></div>
          <div class="detail-row"><span>Semester</span><span>${user.semester || '—'}</span></div>
          <div class="detail-row"><span>Batch</span><span>${user.batch || '—'}</span></div>
          <div class="detail-row"><span>Class Rep</span><span>${user.is_cr ? '✅ Yes' : 'No'}</span></div>
        </div>
      ` : user.role === 'teacher' ? `
        <div class="profile-details">
          <div class="detail-row"><span>Employee ID</span><span>${user.employee_id || '—'}</span></div>
          <div class="detail-row"><span>Phone</span><span>${user.phone || '—'}</span></div>
          <div class="detail-row"><span>Subjects</span><span>${(user.subjects || []).join(', ') || '—'}</span></div>
        </div>
      ` : ''}
      <button class="btn-outline logout-btn" onclick="handleLogout()">🚪 Logout</button>
    </div>
    <div class="sheet-overlay hidden" id="profileOverlay"></div>

    <!-- ══════════════ NOTIFICATIONS PANEL ══════════════ -->
    <div class="bottom-sheet hidden" id="notifSheet">
      <div class="sheet-handle"></div>
      <div class="panel-header">
        <h3>Notifications</h3>
        <button class="panel-link" onclick="markAllNotifsRead()">Mark all read</button>
      </div>
      <div id="notifList"><div class="skeleton" style="height:60px;border-radius:8px;margin:12px 0"></div></div>
    </div>
    <div class="sheet-overlay hidden" id="notifOverlay"></div>

    <!-- Loader -->
    <div class="loader-overlay hidden" id="loaderOverlay">
      <div class="loader-spinner"></div>
    </div>

    <!-- Toast container -->
    <div id="toastContainer"></div>
  `

  // Wire up interactions
  wireShell(user, moreNav)

  // Load notification badge
  loadNotifBadge(user)
}

function wireShell(user, moreNav) {
  // Theme toggle
  document.getElementById('themeToggle').addEventListener('click', toggleTheme)

  // More button
  const moreBtn = document.getElementById('moreBtn')
  if (moreBtn) {
    moreBtn.addEventListener('click', () => toggleSheet('moreSheet', 'sheetOverlay'))
    document.getElementById('sheetOverlay').addEventListener('click', () =>
      closeSheet('moreSheet', 'sheetOverlay'))
  }

  // Profile button
  document.getElementById('profileBtn').addEventListener('click', () =>
    toggleSheet('profileSheet', 'profileOverlay'))
  document.getElementById('profileOverlay')?.addEventListener('click', () =>
    closeSheet('profileSheet', 'profileOverlay'))

  // Notif button
  document.getElementById('notifBtn').addEventListener('click', () => {
    toggleSheet('notifSheet', 'notifOverlay')
    loadNotifications(user)
  })
  document.getElementById('notifOverlay')?.addEventListener('click', () =>
    closeSheet('notifSheet', 'notifOverlay'))

  // Avatar upload
  const avatarEditBtn = document.getElementById('avatarEditBtn')
  const avatarInput = document.getElementById('avatarInput')
  if (avatarEditBtn && avatarInput) {
    avatarEditBtn.addEventListener('click', () => avatarInput.click())
    avatarInput.addEventListener('change', async (e) => {
      const file = e.target.files[0]
      if (!file) return
      if (file.size > 2 * 1024 * 1024) {
        showToastMsg('Image must be under 2MB', 'error'); return
      }
      try {
        showLoader()
        const { db: dbModule } = await import('../db.js')
        const { updateCachedProfile } = await import('../auth.js')
        const { showToast } = await import('../toast.js')
        const url = await dbModule.profiles.uploadAvatar(user.id, file)
        updateCachedProfile({ avatar_url: url })
        // Update all avatar displays
        document.querySelectorAll('.avatar-img, .avatar-img-lg').forEach(img => img.src = url)
        showToast('Avatar updated!', 'success')
      } catch (err) {
        const { showToast } = await import('../toast.js')
        showToast('Upload failed: ' + err.message, 'error')
      } finally {
        hideLoader()
      }
    })
  }
}

function toggleSheet(sheetId, overlayId) {
  const sheet = document.getElementById(sheetId)
  const overlay = document.getElementById(overlayId)
  const isHidden = sheet.classList.contains('hidden')
  if (isHidden) {
    sheet.classList.remove('hidden')
    overlay?.classList.remove('hidden')
    requestAnimationFrame(() => {
      sheet.classList.add('sheet-open')
      overlay?.classList.add('overlay-visible')
    })
  } else {
    closeSheet(sheetId, overlayId)
  }
}

function closeSheet(sheetId, overlayId) {
  const sheet = document.getElementById(sheetId)
  const overlay = document.getElementById(overlayId)
  sheet?.classList.remove('sheet-open')
  overlay?.classList.remove('overlay-visible')
  setTimeout(() => {
    sheet?.classList.add('hidden')
    overlay?.classList.add('hidden')
  }, 300)
}

async function loadNotifBadge(user) {
  try {
    const count = await db.notifications.getUnreadCount(user.id, user.role)
    const badge = document.getElementById('notifBadge')
    if (badge) {
      badge.textContent = count > 9 ? '9+' : count
      badge.classList.toggle('hidden', count === 0)
    }
  } catch (_) { /* silent */ }
}

async function loadNotifications(user) {
  const list = document.getElementById('notifList')
  if (!list) return
  try {
    const notifs = await db.notifications.getMine(user.id, user.role)
    if (!notifs.length) {
      list.innerHTML = `<p class="empty-state">No notifications</p>`
      return
    }
    list.innerHTML = notifs.map(n => `
      <div class="notif-item ${n.is_read ? '' : 'notif-unread'}" onclick="markNotifRead('${n.id}', this)">
        <div class="notif-title">${n.title}</div>
        ${n.body ? `<div class="notif-body">${n.body}</div>` : ''}
        <div class="notif-time">${timeAgo(n.created_at)}</div>
      </div>
    `).join('')
  } catch (err) {
    list.innerHTML = `<p class="empty-state">Failed to load</p>`
  }
}

// Expose to window for inline handlers
window.handleLogout = async () => {
  const { logout } = await import('../auth.js')
  await logout()
}
window.markNotifRead = async (id, el) => {
  const { db } = await import('../db.js')
  await db.notifications.markRead(id)
  el.classList.remove('notif-unread')
}
window.markAllNotifsRead = async () => {
  const user = getCurrentUser()
  if (!user) return
  await db.notifications.markAllRead(user.id, user.role)
  document.querySelectorAll('.notif-unread').forEach(el => el.classList.remove('notif-unread'))
  document.getElementById('notifBadge')?.classList.add('hidden')
}

function showLoader() { document.getElementById('loaderOverlay')?.classList.remove('hidden') }
function hideLoader() { document.getElementById('loaderOverlay')?.classList.add('hidden') }

function getInitials(name) {
  return (name || 'U').split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase()
}
function capitalize(s) { return s ? s[0].toUpperCase() + s.slice(1) : '' }
function timeAgo(ts) {
  const diff = Date.now() - new Date(ts).getTime()
  const m = Math.floor(diff / 60000)
  if (m < 1) return 'just now'
  if (m < 60) return `${m}m ago`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h}h ago`
  return `${Math.floor(h / 24)}d ago`
}
function showToastMsg(msg, type) {
  import('../toast.js').then(m => m.showToast(msg, type))
}

export function showLoader() { document.getElementById('loaderOverlay')?.classList.remove('hidden') }
export function hideLoader() { document.getElementById('loaderOverlay')?.classList.add('hidden') }

