// assets/js/db.js
// Complete data access layer — all Supabase queries in one place
// IMPORTANT: marks INSERT/UPDATE never include total/percentage (GENERATED columns)

import { supabase, uploadFile, SUPABASE_URL } from './supabase.js'

export const db = {

  // ─── PROFILES ─────────────────────────────────────────────────
  profiles: {
    async getAll(role = null) {
      let q = supabase.from('profiles').select('*').order('name')
      if (role) q = q.eq('role', role)
      const { data, error } = await q
      if (error) throw error
      return data
    },

    async getById(id) {
      const { data, error } = await supabase
        .from('profiles').select('*').eq('id', id).single()
      if (error) throw error
      return data
    },

    async update(id, updates) {
      const { data, error } = await supabase
        .from('profiles').update(updates).eq('id', id).select().single()
      if (error) throw error
      return data
    },

    async uploadAvatar(userId, file) {
      const ext = file.name.split('.').pop()
      const path = `${userId}/avatar.${ext}`
      const { url } = await uploadFile(file, 'avatars', path)
      await supabase.from('profiles').update({ avatar_url: url }).eq('id', userId)
      return url
    },

    async delete(userId) {
      const { data: { session } } = await supabase.auth.getSession()
      const res = await fetch(`${SUPABASE_URL}/functions/v1/delete-user`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.access_token}`
        },
        body: JSON.stringify({ userId })
      })
      if (!res.ok) {
        const err = await res.text()
        throw new Error(err || 'Failed to delete user')
      }
    }
  },

  // ─── ATTENDANCE ───────────────────────────────────────────────
  attendance: {
    async getByStudent(studentId) {
      const { data, error } = await supabase
        .from('attendance').select('*')
        .eq('student_id', studentId)
        .order('date', { ascending: false })
      if (error) throw error
      return data
    },

    async getByBatch(semester, batch, date = null) {
      let q = supabase.from('attendance').select('*')
        .eq('semester', semester).eq('batch', batch)
        .order('date', { ascending: false })
      if (date) q = q.eq('date', date)
      const { data, error } = await q
      if (error) throw error
      return data
    },

    async getToday() {
      const today = new Date().toISOString().split('T')[0]
      const { data, error } = await supabase
        .from('attendance').select('*').eq('date', today)
      if (error) throw error
      return data
    },

    async upsert(record) {
      const { data, error } = await supabase
        .from('attendance')
        .upsert(record, { onConflict: 'student_id,subject,date' })
        .select().single()
      if (error) throw error
      return data
    },

    async upsertMany(records) {
      const { data, error } = await supabase
        .from('attendance')
        .upsert(records, { onConflict: 'student_id,subject,date' })
        .select()
      if (error) throw error
      return data
    },

    async getSummary(studentId) {
      const { data, error } = await supabase
        .from('attendance_summary').select('*')
        .eq('student_id', studentId).single()
      if (error) throw error
      return data
    },

    async getAllSummaries(semester = null, batch = null) {
      let q = supabase.from('attendance_summary').select('*')
      if (semester) q = q.eq('semester', semester)
      if (batch) q = q.eq('batch', batch)
      const { data, error } = await q
      if (error) throw error
      return data
    }
  },

  // ─── MARKS ────────────────────────────────────────────────────
  marks: {
    async getByStudent(studentId) {
      const { data, error } = await supabase
        .from('marks').select('*')
        .eq('student_id', studentId).order('subject')
      if (error) throw error
      return data
    },

    async getByBatch(semester, batch) {
      const { data, error } = await supabase
        .from('marks')
        .select('*, profiles!marks_student_id_fkey(name, enrollment_no, batch, semester)')
        .eq('semester', semester)
        .order('subject')
      if (error) throw error
      return data
    },

    async getToppers(limit = 5) {
      const { data, error } = await supabase
        .from('marks_summary').select('*').limit(limit)
      if (error) throw error
      return data
    },

    async upsert(record) {
      // ⚠️ NEVER include total or percentage — these are GENERATED columns
      const { total, percentage, ...safeRecord } = record
      const { data, error } = await supabase
        .from('marks')
        .upsert(safeRecord, { onConflict: 'student_id,subject' })
        .select().single()
      if (error) throw error
      return data
    },

    async delete(id) {
      const { error } = await supabase.from('marks').delete().eq('id', id)
      if (error) throw error
    }
  },

  // ─── TIMETABLE ────────────────────────────────────────────────
  timetable: {
    async getAll() {
      const { data, error } = await supabase
        .from('timetable').select('*').order('start_time')
      if (error) throw error
      return data
    },

    async getByBatch(semester, batch) {
      const { data, error } = await supabase
        .from('timetable').select('*')
        .eq('semester', semester).eq('batch', batch)
        .order('start_time')
      if (error) throw error
      return data
    },

    async insert(period) {
      const { data, error } = await supabase
        .from('timetable').insert(period).select().single()
      if (error) throw error
      return data
    },

    async update(id, updates) {
      const { data, error } = await supabase
        .from('timetable').update(updates).eq('id', id).select().single()
      if (error) throw error
      return data
    },

    async delete(id) {
      const { error } = await supabase.from('timetable').delete().eq('id', id)
      if (error) throw error
    }
  },

  // ─── MESSAGES ─────────────────────────────────────────────────
  messages: {
    async getByBatch(semester, batch, limit = 100) {
      const { data, error } = await supabase
        .from('messages')
        .select('*, message_reads(user_id)')
        .eq('semester', semester).eq('batch', batch)
        .order('created_at', { ascending: true })
        .limit(limit)
      if (error) throw error
      return data.map(m => ({
        ...m,
        seenBy: m.message_reads?.map(r => r.user_id) || []
      }))
    },

    async send(msg) {
      const { data, error } = await supabase
        .from('messages').insert(msg).select().single()
      if (error) throw error
      return data
    },

    async markRead(messageId, userId) {
      await supabase.from('message_reads')
        .upsert({ message_id: messageId, user_id: userId },
                 { onConflict: 'message_id,user_id' })
    },

    async markManyRead(messageIds, userId) {
      if (!messageIds.length) return
      const records = messageIds.map(id => ({ message_id: id, user_id: userId }))
      await supabase.from('message_reads')
        .upsert(records, { onConflict: 'message_id,user_id' })
    },

    async uploadMedia(file, userId) {
      const ext = file.name.split('.').pop()
      const path = `${userId}/${Date.now()}.${ext}`
      const expiresAt = new Date(Date.now() + 5 * 60 * 60 * 1000).toISOString() // 5h
      const { path: storedPath, url } = await uploadFile(file, 'chat-media', path)
      return { path: storedPath, url, expiresAt }
    },

    async delete(id) {
      const { error } = await supabase.from('messages').delete().eq('id', id)
      if (error) throw error
    }
  },

  // ─── LEAVE ────────────────────────────────────────────────────
  leave: {
    async getByStudent(studentId) {
      const { data, error } = await supabase
        .from('leave_requests').select('*')
        .eq('student_id', studentId)
        .order('applied_at', { ascending: false })
      if (error) throw error
      return data
    },

    async getAll() {
      const { data, error } = await supabase
        .from('leave_requests')
        .select('*, profiles(semester, batch, phone)')
        .order('applied_at', { ascending: false })
      if (error) throw error
      return data
    },

    async getPending() {
      const { data, error } = await supabase
        .from('leave_requests').select('*, profiles(semester, batch)')
        .eq('status', 'pending')
        .order('applied_at', { ascending: false })
      if (error) throw error
      return data
    },

    async create(request) {
      const { data, error } = await supabase
        .from('leave_requests').insert(request).select().single()
      if (error) throw error
      return data
    },

    async updateStatus(id, status, reviewerId) {
      const { data, error } = await supabase
        .from('leave_requests')
        .update({ status, reviewed_by: reviewerId, reviewed_at: new Date().toISOString() })
        .eq('id', id).select().single()
      if (error) throw error
      return data
    },

    async delete(id) {
      const { error } = await supabase
        .from('leave_requests').delete().eq('id', id).eq('status', 'pending')
      if (error) throw error
    }
  },

  // ─── NOTICES ──────────────────────────────────────────────────
  notices: {
    async getAll() {
      const { data, error } = await supabase
        .from('notices').select('*').order('date', { ascending: false })
      if (error) throw error
      return data
    },

    async create(notice) {
      const { data, error } = await supabase
        .from('notices').insert(notice).select().single()
      if (error) throw error
      return data
    },

    async delete(id) {
      const { error } = await supabase.from('notices').delete().eq('id', id)
      if (error) throw error
    }
  },

  // ─── EVENTS ───────────────────────────────────────────────────
  events: {
    async getAll() {
      const { data, error } = await supabase
        .from('events').select('*').order('date', { ascending: true })
      if (error) throw error
      return data
    },

    async getUpcoming(limit = 5) {
      const today = new Date().toISOString().split('T')[0]
      const { data, error } = await supabase
        .from('events').select('*').gte('date', today)
        .order('date', { ascending: true }).limit(limit)
      if (error) throw error
      return data
    },

    async create(event) {
      const { data, error } = await supabase
        .from('events').insert(event).select().single()
      if (error) throw error
      return data
    },

    async delete(id) {
      const { error } = await supabase.from('events').delete().eq('id', id)
      if (error) throw error
    }
  },

  // ─── PROJECTS ─────────────────────────────────────────────────
  projects: {
    async getAll() {
      const { data, error } = await supabase
        .from('project_groups')
        .select('*, project_members(count), project_posts(count)')
        .order('created_at', { ascending: false })
      if (error) throw error
      return data
    },

    async getMine(userId) {
      const { data, error } = await supabase
        .from('project_groups')
        .select('*, project_members!inner(user_id), project_posts(count)')
        .eq('project_members.user_id', userId)
      if (error) throw error
      return data
    },

    async create(group) {
      const { data, error } = await supabase
        .from('project_groups').insert(group).select().single()
      if (error) throw error
      return data
    },

    async addMember(groupId, userId) {
      const { error } = await supabase
        .from('project_members').insert({ group_id: groupId, user_id: userId })
      if (error) throw error
    },

    async getPosts(groupId) {
      const { data, error } = await supabase
        .from('project_posts').select('*').eq('group_id', groupId)
        .order('created_at', { ascending: false })
      if (error) throw error
      return data
    },

    async addPost(post) {
      const { data, error } = await supabase
        .from('project_posts').insert(post).select().single()
      if (error) throw error
      return data
    },

    async addFeedback(postId, feedback) {
      const { data, error } = await supabase
        .from('project_posts')
        .update({ teacher_feedback: feedback }).eq('id', postId)
        .select().single()
      if (error) throw error
      return data
    },

    async uploadMedia(file, userId) {
      const ext = file.name.split('.').pop()
      const path = `${userId}/${Date.now()}.${ext}`
      const expiresAt = new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString() // 2h
      const { path: storedPath, url } = await uploadFile(file, 'post-media', path)
      return { path: storedPath, url, expiresAt }
    }
  },

  // ─── ACHIEVEMENTS ─────────────────────────────────────────────
  achievements: {
    async getAll() {
      const { data, error } = await supabase
        .from('achievements').select('*').order('date', { ascending: false })
      if (error) throw error
      return data
    },

    async create(ach) {
      const { data, error } = await supabase
        .from('achievements').insert(ach).select().single()
      if (error) throw error
      return data
    },

    async update(id, updates) {
      const { data, error } = await supabase
        .from('achievements').update(updates).eq('id', id).select().single()
      if (error) throw error
      return data
    },

    async delete(id) {
      const { error } = await supabase.from('achievements').delete().eq('id', id)
      if (error) throw error
    }
  },

  // ─── NOTIFICATIONS ────────────────────────────────────────────
  notifications: {
    async getMine(userId, role) {
      const { data, error } = await supabase
        .from('notifications').select('*')
        .or(`target_user_id.eq.${userId},target_role.eq.${role}`)
        .neq('exclude_user_id', userId)
        .order('created_at', { ascending: false })
        .limit(60)
      if (error) throw error
      return data
    },

    async getUnreadCount(userId, role) {
      const { count, error } = await supabase
        .from('notifications')
        .select('*', { count: 'exact', head: true })
        .or(`target_user_id.eq.${userId},target_role.eq.${role}`)
        .eq('is_read', false)
        .neq('exclude_user_id', userId)
      if (error) throw error
      return count || 0
    },

    async create(notif) {
      const { error } = await supabase.from('notifications').insert(notif)
      if (error) throw error
    },

    async markRead(id) {
      await supabase.from('notifications').update({ is_read: true }).eq('id', id)
    },

    async markAllRead(userId, role) {
      await supabase.from('notifications').update({ is_read: true })
        .or(`target_user_id.eq.${userId},target_role.eq.${role}`)
    }
  },

  // ─── DASHBOARD STATS ──────────────────────────────────────────
  stats: {
    async getDashboard() {
      const today = new Date().toISOString().split('T')[0]
      const [students, teachers, todayAtt, pendingLeave, notices, achievements, events] =
        await Promise.all([
          supabase.from('profiles').select('id', { count: 'exact', head: true }).eq('role', 'student'),
          supabase.from('profiles').select('id', { count: 'exact', head: true }).eq('role', 'teacher'),
          supabase.from('attendance').select('id', { count: 'exact', head: true }).eq('date', today),
          supabase.from('leave_requests').select('id', { count: 'exact', head: true }).eq('status', 'pending'),
          supabase.from('notices').select('id', { count: 'exact', head: true }),
          supabase.from('achievements').select('id', { count: 'exact', head: true }),
          supabase.from('events').select('id', { count: 'exact', head: true }).gte('date', today)
        ])
      return {
        students:          students.count || 0,
        teachers:          teachers.count || 0,
        today_attendance:  todayAtt.count || 0,
        pending_leave:     pendingLeave.count || 0,
        notices:           notices.count || 0,
        achievements:      achievements.count || 0,
        upcoming_events:   events.count || 0
      }
    }
  }
}

