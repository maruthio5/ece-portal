// assets/js/router.js
// Hash-based client-side router with role guards

import { getCurrentUser } from './auth.js'

// ─── ROUTE TABLE ────────────────────────────────────────────────
// Each route: { roles, loader }
// loader() is called when the route matches — it renders the page
const routes = {}

export const router = {
  // ─── REGISTER ROUTE ─────────────────────────────────────────
  register(path, { roles = [], loader }) {
    routes[path] = { roles, loader }
  },

  // ─── NAVIGATE ───────────────────────────────────────────────
  navigate(hash) {
    window.location.hash = hash
  },

  // ─── RESOLVE CURRENT HASH ───────────────────────────────────
  async resolve() {
    const hash = window.location.hash || '#/login'
    const path = hash.replace('#', '') || '/login'

    // Strip trailing slash
    const cleanPath = path.replace(/\/$/, '') || '/login'

    const route = routes[cleanPath]

    if (!route) {
      // Unknown route — go to login or dashboard
      const user = getCurrentUser()
      if (user) {
        const home = {
          admin:   '#/admin/dashboard',
          teacher: '#/teacher/dashboard',
          student: '#/student/dashboard'
        }
        window.location.hash = home[user.role] || '#/login'
      } else {
        window.location.hash = '#/login'
      }
      return
    }

    // Role guard
    if (route.roles && route.roles.length > 0) {
      const user = getCurrentUser()
      if (!user) { window.location.hash = '#/login'; return }
      if (!route.roles.includes(user.role)) {
        const home = {
          admin:   '#/admin/dashboard',
          teacher: '#/teacher/dashboard',
          student: '#/student/dashboard'
        }
        window.location.hash = home[user.role] || '#/login'
        return
      }
    }

    // Execute loader
    try {
      await route.loader()
    } catch (err) {
      console.error('Router: loader error for', cleanPath, err)
    }
  },

  // ─── START (listen to hash changes) ─────────────────────────
  start() {
    window.addEventListener('hashchange', () => this.resolve())
    this.resolve() // resolve on initial load
  }
}

