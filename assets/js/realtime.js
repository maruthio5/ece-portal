// assets/js/realtime.js
// Supabase Realtime subscriptions — chat, notifications, leaves, project posts

import { supabase } from './supabase.js'

// ─── ACTIVE CHANNELS (for cleanup) ──────────────────────────────
const channels = {}

function unsubscribe(key) {
  if (channels[key]) {
    channels[key].unsubscribe()
    delete channels[key]
  }
}

// ─── CHAT ───────────────────────────────────────────────────────
/**
 * Subscribe to new messages for a batch
 * @param {number} semester
 * @param {string} batch
 * @param {(msg: object) => void} onNewMessage
 * @returns {Function} cleanup
 */
export function subscribeToChat(semester, batch, onNewMessage) {
  const key = `chat:${semester}:${batch}`
  unsubscribe(key)

  channels[key] = supabase
    .channel(key)
    .on('postgres_changes', {
      event: 'INSERT',
      schema: 'public',
      table: 'messages',
      filter: `semester=eq.${semester}`
    }, payload => {
      if (payload.new.batch === batch) onNewMessage(payload.new)
    })
    .subscribe()

  return () => unsubscribe(key)
}

// ─── NOTIFICATIONS ──────────────────────────────────────────────
/**
 * Subscribe to new notifications for a user
 * @param {string} userId
 * @param {string} role
 * @param {(notif: object) => void} onNew
 * @returns {Function} cleanup
 */
export function subscribeToNotifications(userId, role, onNew) {
  const key = `notif:${userId}`
  unsubscribe(key)

  channels[key] = supabase
    .channel(key)
    .on('postgres_changes', {
      event: 'INSERT',
      schema: 'public',
      table: 'notifications'
    }, payload => {
      const n = payload.new
      const isForMe = n.target_user_id === userId || n.target_role === role
      if (isForMe && n.exclude_user_id !== userId) onNew(n)
    })
    .subscribe()

  return () => unsubscribe(key)
}

// ─── LEAVE UPDATES ──────────────────────────────────────────────
/**
 * Subscribe to leave request status changes for a student
 * @param {string} studentId
 * @param {(leave: object) => void} onUpdate
 * @returns {Function} cleanup
 */
export function subscribeToLeaveUpdates(studentId, onUpdate) {
  const key = `leave:${studentId}`
  unsubscribe(key)

  channels[key] = supabase
    .channel(key)
    .on('postgres_changes', {
      event: 'UPDATE',
      schema: 'public',
      table: 'leave_requests',
      filter: `student_id=eq.${studentId}`
    }, payload => onUpdate(payload.new))
    .subscribe()

  return () => unsubscribe(key)
}

// ─── PROJECT POSTS ──────────────────────────────────────────────
/**
 * Subscribe to new project posts for a group
 * @param {string} groupId
 * @param {(post: object) => void} onNew
 * @returns {Function} cleanup
 */
export function subscribeToProjectPosts(groupId, onNew) {
  const key = `project:${groupId}`
  unsubscribe(key)

  channels[key] = supabase
    .channel(key)
    .on('postgres_changes', {
      event: 'INSERT',
      schema: 'public',
      table: 'project_posts',
      filter: `group_id=eq.${groupId}`
    }, payload => onNew(payload.new))
    .subscribe()

  return () => unsubscribe(key)
}

// ─── CLEANUP ALL ─────────────────────────────────────────────────
export function unsubscribeAll() {
  Object.keys(channels).forEach(unsubscribe)
}

