// assets/js/supabase.js
// Supabase client initialization — single source of truth

import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm'

// ─── CONFIG ─────────────────────────────────────────────────────
// Replace these with your actual values from Supabase dashboard
// OR set them via environment variables if using Vite
const SUPABASE_URL  = window.__ENV__?.SUPABASE_URL  || 'https://YOUR_PROJECT.supabase.co'
const SUPABASE_KEY  = window.__ENV__?.SUPABASE_KEY  || 'YOUR_ANON_KEY'

export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
    storageKey: 'ECE_session'
  },
  realtime: {
    params: { eventsPerSecond: 10 }
  }
})

// ─── HELPERS ────────────────────────────────────────────────────

/**
 * Get the currently authenticated user's full profile from DB
 * @returns {Promise<Object|null>}
 */
export async function getCurrentProfile() {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()
  if (error) { console.error('Profile fetch error:', error); return null }
  return data
}

/**
 * Upload file to Supabase Storage
 * @param {File} file
 * @param {string} bucket  - Storage bucket name
 * @param {string} path    - Storage path (e.g. userId/avatar.jpg)
 * @returns {Promise<{path: string, url: string}>}
 */
export async function uploadFile(file, bucket, path) {
  const { data, error } = await supabase.storage
    .from(bucket)
    .upload(path, file, { upsert: true, cacheControl: '3600' })
  if (error) throw new Error(error.message)
  const { data: { publicUrl } } = supabase.storage.from(bucket).getPublicUrl(data.path)
  return { path: data.path, url: publicUrl }
}

/**
 * Delete file from Supabase Storage
 * @param {string} bucket
 * @param {string} path
 */
export async function deleteFile(bucket, path) {
  const { error } = await supabase.storage.from(bucket).remove([path])
  if (error) console.error('Storage delete error:', error)
}

export { SUPABASE_URL }

