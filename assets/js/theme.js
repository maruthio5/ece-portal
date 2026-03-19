// assets/js/theme.js
// Dark/light theme toggle with CSS variable switching

const THEME_KEY = 'ECE_theme'

const themes = {
  dark: {
    '--bg-primary':    '#0d1117',
    '--bg-secondary':  '#161b22',
    '--bg-tertiary':   '#21262d',
    '--bg-card':       '#1c2128',
    '--text-primary':  '#f0f6fc',
    '--text-secondary':'#8b949e',
    '--text-muted':    '#484f58',
    '--border':        '#30363d',
  },
  light: {
    '--bg-primary':    '#f6f8fa',
    '--bg-secondary':  '#ffffff',
    '--bg-tertiary':   '#eaeef2',
    '--bg-card':       '#ffffff',
    '--text-primary':  '#24292f',
    '--text-secondary':'#57606a',
    '--text-muted':    '#8c959f',
    '--border':        '#d0d7de',
  }
}

export function applyTheme(theme) {
  const root = document.documentElement
  const vars = themes[theme] || themes.dark
  Object.entries(vars).forEach(([k, v]) => root.style.setProperty(k, v))
  root.setAttribute('data-theme', theme)
  localStorage.setItem(THEME_KEY, theme)

  // Update theme toggle icon if present
  const btn = document.getElementById('themeToggle')
  if (btn) btn.innerHTML = theme === 'dark' ? '☀️' : '🌙'
}

export function getStoredTheme() {
  return localStorage.getItem(THEME_KEY) || 'dark'
}

export function toggleTheme() {
  const current = document.documentElement.getAttribute('data-theme') || 'dark'
  applyTheme(current === 'dark' ? 'light' : 'dark')
}

export function initTheme() {
  applyTheme(getStoredTheme())
  // Wire up toggle button
  document.getElementById('themeToggle')?.addEventListener('click', toggleTheme)
}

