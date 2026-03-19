// assets/js/auth.js
// Authentication: login, logout, session guard, role routing

import { supabase, getCurrentProfile } from './supabase.js'
import { router } from './router.js'
import { showToast } from './toast.js'

const PROFILE_KEY = 'ECE_currentUser'

// ─── LOGIN ──────────────────────────────────────────────────────
export async function login(email, password) {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password })
  if (error) throw new Error(error.message)

  const profile = await getCurrentProfile()
  if (!profile) throw new Error('Profile not found. Contact administrator.')

  sessionStorage.setItem(PROFILE_KEY, JSON.stringify(profile))

  const routes = {
    admin:   '#/admin/dashboard',
    teacher: '#/teacher/dashboard',
    student: '#/student/dashboard'
  }
  window.location.hash = routes[profile.role] || '#/login'
  return profile
}

// ─── LOGOUT ─────────────────────────────────────────────────────
export async function logout() {
  await supabase.auth.signOut()
  sessionStorage.removeItem(PROFILE_KEY)
  window.location.hash = '#/login'
}

// ─── GET CURRENT USER (cached) ──────────────────────────────────
export function getCurrentUser() {
  const stored = sessionStorage.getItem(PROFILE_KEY)
  return stored ? JSON.parse(stored) : null
}

// ─── REFRESH PROFILE FROM DB ────────────────────────────────────
export async function refreshProfile() {
  const profile = await getCurrentProfile()
  if (profile) sessionStorage.setItem(PROFILE_KEY, JSON.stringify(profile))
  return profile
}

// ─── UPDATE CACHED PROFILE ──────────────────────────────────────
export function updateCachedProfile(updates) {
  const user = getCurrentUser()
  if (!user) return
  const updated = { ...user, ...updates }
  sessionStorage.setItem(PROFILE_KEY, JSON.stringify(updated))
  return updated
}

// ─── REQUIRE AUTH (page guard) ──────────────────────────────────
export function requireAuth(allowedRoles = []) {
  const user = getCurrentUser()
  if (!user) {
    window.location.hash = '#/login'
    return null
  }
  if (allowedRoles.length && !allowedRoles.includes(user.role)) {
    const home = {
      admin:   '#/admin/dashboard',
      teacher: '#/teacher/dashboard',
      student: '#/student/dashboard'
    }
    window.location.hash = home[user.role] || '#/login'
    return null
  }
  return user
}

// ─── SESSION WATCHER ────────────────────────────────────────────
// Listens for token expiry / sign-out events from Supabase
supabase.auth.onAuthStateChange((event, session) => {
  if (event === 'SIGNED_OUT' || event === 'TOKEN_REFRESHED') {
    if (event === 'SIGNED_OUT') {
      sessionStorage.removeItem(PROFILE_KEY)
      window.location.hash = '#/login'
    }
    if (event === 'TOKEN_REFRESHED' && session) {
      // Silently refresh cached profile
      getCurrentProfile().then(p => {
        if (p) sessionStorage.setItem(PROFILE_KEY, JSON.stringify(p))
      })
    }
  }
})
