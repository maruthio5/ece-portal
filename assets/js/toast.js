// assets/js/toast.js
// Lightweight toast notification system

let container = null

function getContainer() {
  if (!container) {
    container = document.getElementById('toastContainer')
    if (!container) {
      container = document.createElement('div')
      container.id = 'toastContainer'
      container.style.cssText = `
        position: fixed; top: 16px; right: 16px; z-index: 9999;
        display: flex; flex-direction: column; gap: 8px; pointer-events: none;
      `
      document.body.appendChild(container)
    }
  }
  return container
}

/**
 * Show a toast notification
 * @param {string} message
 * @param {'success'|'error'|'warning'|'info'} type
 * @param {number} duration ms
 */
export function showToast(message, type = 'success', duration = 3500) {
  const icons = {
    success: '✓',
    error: '✕',
    warning: '⚠',
    info: 'ℹ'
  }
  const colors = {
    success: '#00e5a0',
    error: '#ff5370',
    warning: '#ffa657',
    info: '#58a6ff'
  }

  const toast = document.createElement('div')
  toast.style.cssText = `
    background: #1c2128;
    border: 1px solid ${colors[type]}40;
    border-left: 3px solid ${colors[type]};
    color: #f0f6fc;
    padding: 12px 16px;
    border-radius: 8px;
    font-size: 14px;
    font-family: 'Plus Jakarta Sans', sans-serif;
    display: flex;
    align-items: center;
    gap: 10px;
    min-width: 240px;
    max-width: 340px;
    pointer-events: all;
    box-shadow: 0 8px 24px rgba(0,0,0,0.4);
    animation: toastIn 0.3s cubic-bezier(0.34,1.56,0.64,1);
    transform-origin: top right;
  `
  toast.innerHTML = `
    <span style="color:${colors[type]};font-weight:700;font-size:16px">${icons[type]}</span>
    <span>${message}</span>
  `

  const c = getContainer()
  c.appendChild(toast)

  setTimeout(() => {
    toast.style.transition = 'opacity 0.3s, transform 0.3s'
    toast.style.opacity = '0'
    toast.style.transform = 'translateX(20px)'
    setTimeout(() => toast.remove(), 300)
  }, duration)
}

