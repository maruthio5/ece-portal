import React, { useState, useMemo } from 'react';
import { Search, BarChart3, Users, GraduationCap, ClipboardCheck, FileText, Activity, User, CheckCircle2, XCircle, Clock, Award, TrendingUp, BookOpen, Plus, Trash2, Mail, Phone, Building2, Calendar, Target, X, Bell, MessageSquare, Send, Zap, Trophy, CalendarDays, Home, LogIn, Shield, Presentation, LayoutGrid, ChevronRight, Star, AlertCircle, Info, MapPin } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';

function safe(v) { return String(v ?? '').trim(); }
function num(v) { const n = Number(v); return isNaN(n) ? 0 : n; }

const ACCENT = { lilac: '#B8A9E8', amber: '#F5A623', teal: '#4ECDC4', coral: '#FF6B6B', green: '#4ADE80', ink: '#1A1A1A' };

const ATT_COLOR = { Present: ACCENT.green, Absent: ACCENT.coral, Late: ACCENT.amber, Excused: ACCENT.teal };
const ATT_TEXT = { Present: '#166534', Absent: '#DC2626', Late: '#92400E', Excused: '#115E59' };
const PROJ_COLOR = { 'Not Started': ACCENT.coral, 'In Progress': ACCENT.amber, 'Submitted': ACCENT.teal, 'Reviewed': ACCENT.lilac, 'Approved': ACCENT.green };
const PROJ_TEXT = { 'Not Started': '#DC2626', 'In Progress': '#92400E', 'Submitted': '#115E59', 'Reviewed': '#5B21B6', 'Approved': '#166534' };
const GRADE_COLOR = { 'A+': ACCENT.green, 'A': ACCENT.green, 'B+': ACCENT.teal, 'B': ACCENT.teal, 'C': ACCENT.amber, 'D': ACCENT.coral, 'F': ACCENT.coral };
const LEAVE_COLOR = { Pending: ACCENT.amber, Approved: ACCENT.green, Declined: ACCENT.coral, Withdrawn: '#6B6B6B' };
const LEAVE_TEXT = { Pending: '#92400E', Approved: '#166534', Declined: '#DC2626', Withdrawn: '#6B6B6B' };
const PRIORITY_COLOR = { Low: ACCENT.teal, Normal: ACCENT.lilac, High: ACCENT.amber, Urgent: ACCENT.coral };
const PRIORITY_TEXT = { Low: '#115E59', Normal: '#5B21B6', High: '#92400E', Urgent: '#DC2626' };
const CAT_COLOR = { Academic: ACCENT.lilac, Cultural: ACCENT.coral, Sports: ACCENT.green, Workshop: ACCENT.amber, Seminar: ACCENT.teal, Competition: ACCENT.lilac, Technical: ACCENT.teal, Research: ACCENT.lilac, Other: '#6B6B6B' };

export default function App() {
  const data = window.__nexusData || {};
  const [students, setStudents] = useState(data.students || []);
  const [teachers, setTeachers] = useState(data.teachers || []);
  const [marks, setMarks] = useState(data.marks || []);
  const [attendance, setAttendance] = useState(data.attendance || []);
  const [projects, setProjects] = useState(data.projects || []);
  const [timetable, setTimetable] = useState(data.timetable || []);
  const [notices, setNotices] = useState(data.notices || []);
  const [events, setEvents] = useState(data.events || []);
  const [achievements, setAchievements] = useState(data.achievements || []);
  const [leaves, setLeaves] = useState(data.leaves || []);
  const [chats, setChats] = useState(data.chats || []);
  const [groups, setGroups] = useState(data.groups || []);
  const [projectPosts, setProjectPosts] = useState(data.projectPosts || []);

  // Role & identity
  const [role, setRole] = useState(null); // 'admin' | 'teacher' | 'student'
  const [currentUserId, setCurrentUserId] = useState(null); // for teacher/student
  const [activePage, setActivePage] = useState('dashboard');

  // Modals
  const [modal, setModal] = useState(null); // { type, ...data }

  const studentById = useMemo(() => Object.fromEntries(students.map(s => [s.id, s])), [students]);
  const teacherById = useMemo(() => Object.fromEntries(teachers.map(t => [t.id, t])), [teachers]);

  async function refreshAll() {
    const fresh = await window.__refreshNexusData();
    if (fresh.students) setStudents(fresh.students);
    if (fresh.teachers) setTeachers(fresh.teachers);
    if (fresh.marks) setMarks(fresh.marks);
    if (fresh.attendance) setAttendance(fresh.attendance);
    if (fresh.projects) setProjects(fresh.projects);
    if (fresh.timetable) setTimetable(fresh.timetable);
    if (fresh.notices) setNotices(fresh.notices);
    if (fresh.events) setEvents(fresh.events);
    if (fresh.achievements) setAchievements(fresh.achievements);
    if (fresh.leaves) setLeaves(fresh.leaves);
    if (fresh.chats) setChats(fresh.chats);
    if (fresh.groups) setGroups(fresh.groups);
    if (fresh.projectPosts) setProjectPosts(fresh.projectPosts);
  }

  // ================= LOGIN VIEW =================
  if (!role) {
    return <LoginView students={students} teachers={teachers}
      onLogin={(r, uid) => { setRole(r); setCurrentUserId(uid); setActivePage('dashboard'); }} />;
  }

  const currentUser = role === 'admin'
    ? { id: 'admin', name: 'Admin Office', email: 'admin@gpce.edu' }
    : role === 'teacher' ? teacherById[currentUserId] : studentById[currentUserId];

  if (!currentUser) {
    // fallback: return to login
    setRole(null);
    return null;
  }

  // ================= NAV =================
  const navItems = {
    admin: [
      { id: 'dashboard', label: 'Dashboard', icon: BarChart3 },
      { id: 'students', label: 'Students', icon: Users },
      { id: 'teachers', label: 'Teachers', icon: Presentation },
      { id: 'attendance', label: 'Attendance', icon: ClipboardCheck },
      { id: 'marks', label: 'Marks', icon: GraduationCap },
      { id: 'leaves', label: 'Leaves', icon: CalendarDays },
      { id: 'notices', label: 'Notices', icon: Bell },
      { id: 'events', label: 'Events', icon: Calendar },
      { id: 'achievements', label: 'Achievements', icon: Trophy },
    ],
    teacher: [
      { id: 'dashboard', label: 'Dashboard', icon: BarChart3 },
      { id: 'timetable', label: 'Timetable', icon: CalendarDays },
      { id: 'attendance', label: 'Attendance', icon: ClipboardCheck },
      { id: 'marks', label: 'Marks Entry', icon: GraduationCap },
      { id: 'projects', label: 'Projects', icon: Target },
      { id: 'chat', label: 'Chat', icon: MessageSquare },
      { id: 'notices', label: 'Notices', icon: Bell },
    ],
    student: [
      { id: 'dashboard', label: 'Dashboard', icon: BarChart3 },
      { id: 'timetable', label: 'Timetable', icon: CalendarDays },
      { id: 'attendance', label: 'Attendance', icon: ClipboardCheck },
      { id: 'marks', label: 'Marks', icon: GraduationCap },
      { id: 'projects', label: 'Projects', icon: Target },
      { id: 'leaves', label: 'Leaves', icon: LogIn },
      { id: 'chat', label: 'Chat', icon: MessageSquare },
      { id: 'notices', label: 'Notices', icon: Bell },
    ],
  }[role];

  const roleTheme = { admin: ACCENT.coral, teacher: ACCENT.amber, student: ACCENT.lilac }[role];
  const roleLabel = { admin: 'Administrator', teacher: 'Teacher', student: 'Student' }[role];

  return (
    <div className="min-h-screen bg-[#FAFAF8]">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-white/80 backdrop-blur-xl border-b border-[#F0F0F0]">
        <div className="max-w-7xl mx-auto px-8 py-4">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-10 h-10 rounded-2xl bg-[#1A1A1A] flex items-center justify-center shrink-0">
                <Zap size={18} className="text-white" />
              </div>
              <div className="min-w-0">
                <h1 className="text-base font-bold text-[#1A1A1A] tracking-tight truncate">ECE Student Portal</h1>
                <p className="text-[11px] text-[#9B9B9B] mt-0.5 truncate">GPT Chintamani Government Polytechnic</p>
              </div>
            </div>
            <div className="flex items-center gap-3 shrink-0">
              <div className="text-right hidden sm:block">
                <p className="text-xs font-semibold text-[#1A1A1A]">{safe(currentUser.name)}</p>
                <p className="text-[10px] text-[#9B9B9B] flex items-center justify-end gap-1">
                  <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ backgroundColor: roleTheme }} />
                  {roleLabel}
                </p>
              </div>
              <div className="w-9 h-9 rounded-xl flex items-center justify-center font-semibold text-sm" style={{ backgroundColor: roleTheme + '20', color: roleTheme }}>
                {safe(currentUser.name).charAt(0).toUpperCase()}
              </div>
              <button onClick={() => { setRole(null); setCurrentUserId(null); }}
                className="text-[11px] text-[#6B6B6B] hover:text-[#DC2626] transition-colors px-2 py-1 rounded-lg hover:bg-[#FF6B6B]/10">
                Sign out
              </button>
            </div>
          </div>

          {/* Nav pills */}
          <div className="flex gap-1 mt-4 bg-[#F0F0F0]/60 rounded-full p-1 w-fit overflow-x-auto max-w-full">
            {navItems.map(n => {
              const Icon = n.icon;
              const active = activePage === n.id;
              return (
                <button key={n.id} onClick={() => setActivePage(n.id)}
                  className={`flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-medium rounded-full transition-all duration-200 whitespace-nowrap ${active ? 'bg-white text-[#1A1A1A] shadow-sm' : 'text-[#6B6B6B] hover:text-[#1A1A1A]'}`}>
                  <Icon size={13} />{n.label}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-8 py-8">
        <div key={role + activePage} className="animate-[fadeIn_300ms_ease-out]">

          {/* ADMIN VIEWS */}
          {role === 'admin' && activePage === 'dashboard' && (
            <AdminDashboard {...{ students, teachers, marks, attendance, projects, leaves, notices, events }} />
          )}
          {role === 'admin' && activePage === 'students' && (
            <StudentsAdmin students={students} attendance={attendance} marks={marks}
              onAdd={() => setModal({ type: 'addStudent' })}
              onDelete={async id => {
                if (!confirm('Delete this student and all related records?')) return;
                await window.__nexusTableSql('/data/students.table', 'delete from ? where id = ?', [id]);
                await refreshAll();
              }}
              onSelect={s => setModal({ type: 'studentDetail', student: s })}
            />
          )}
          {role === 'admin' && activePage === 'teachers' && (
            <TeachersAdmin teachers={teachers}
              onAdd={() => setModal({ type: 'addTeacher' })}
              onDelete={async id => {
                if (!confirm('Delete this teacher?')) return;
                await window.__nexusTableSql('/data/teachers.table', 'delete from ? where id = ?', [id]);
                await refreshAll();
              }} />
          )}
          {role === 'admin' && activePage === 'attendance' && (
            <AttendanceView attendance={attendance} studentById={studentById}
              onAdd={() => setModal({ type: 'addAttendance' })}
              onStatusChange={async (id, status) => {
                setAttendance(prev => prev.map(a => a.id === id ? { ...a, status } : a));
                await window.__nexusTableSql('/data/attendance.table', 'update ? set status = ? where id = ?', [status, id]);
              }}
              onDelete={async id => {
                await window.__nexusTableSql('/data/attendance.table', 'delete from ? where id = ?', [id]);
                await refreshAll();
              }}
              canEdit
            />
          )}
          {role === 'admin' && activePage === 'marks' && (
            <MarksView marks={marks} studentById={studentById}
              onAdd={() => setModal({ type: 'addMark' })}
              onDelete={async id => {
                await window.__nexusTableSql('/data/marks.table', 'delete from ? where id = ?', [id]);
                await refreshAll();
              }}
              canEdit
            />
          )}
          {role === 'admin' && activePage === 'leaves' && (
            <LeavesAdmin leaves={leaves} studentById={studentById}
              onReview={async (id, newStatus) => {
                setLeaves(prev => prev.map(l => l.id === id ? { ...l, status: newStatus, reviewed_by: 'admin' } : l));
                await window.__nexusTableSql('/data/leave_requests.table', 'update ? set status = ?, reviewed_by = ? where id = ?', [newStatus, 'admin', id]);
              }}
            />
          )}
          {role === 'admin' && activePage === 'notices' && (
            <NoticesView notices={notices} canEdit
              onAdd={() => setModal({ type: 'addNotice' })}
              onDelete={async id => {
                await window.__nexusTableSql('/data/notices.table', 'delete from ? where id = ?', [id]);
                await refreshAll();
              }}
            />
          )}
          {role === 'admin' && activePage === 'events' && (
            <EventsView events={events} canEdit
              onAdd={() => setModal({ type: 'addEvent' })}
              onDelete={async id => {
                await window.__nexusTableSql('/data/events.table', 'delete from ? where id = ?', [id]);
                await refreshAll();
              }}
            />
          )}
          {role === 'admin' && activePage === 'achievements' && (
            <AchievementsView achievements={achievements} studentById={studentById} canEdit
              onAdd={() => setModal({ type: 'addAchievement' })}
              onDelete={async id => {
                await window.__nexusTableSql('/data/achievements.table', 'delete from ? where id = ?', [id]);
                await refreshAll();
              }}
            />
          )}

          {/* TEACHER VIEWS */}
          {role === 'teacher' && activePage === 'dashboard' && (
            <TeacherDashboard teacher={currentUser} {...{ timetable, students, attendance, projects, groups }} />
          )}
          {role === 'teacher' && activePage === 'timetable' && (
            <TimetableView timetable={timetable} teacherById={teacherById} filterTeacherId={currentUserId} />
          )}
          {role === 'teacher' && activePage === 'attendance' && (
            <AttendanceView attendance={attendance} studentById={studentById}
              onAdd={() => setModal({ type: 'addAttendance' })}
              onStatusChange={async (id, status) => {
                setAttendance(prev => prev.map(a => a.id === id ? { ...a, status } : a));
                await window.__nexusTableSql('/data/attendance.table', 'update ? set status = ? where id = ?', [status, id]);
              }}
              onDelete={async id => {
                await window.__nexusTableSql('/data/attendance.table', 'delete from ? where id = ?', [id]);
                await refreshAll();
              }}
              canEdit
            />
          )}
          {role === 'teacher' && activePage === 'marks' && (
            <MarksView marks={marks} studentById={studentById}
              onAdd={() => setModal({ type: 'addMark' })}
              onDelete={async id => {
                await window.__nexusTableSql('/data/marks.table', 'delete from ? where id = ?', [id]);
                await refreshAll();
              }}
              canEdit
            />
          )}
          {role === 'teacher' && activePage === 'projects' && (
            <ProjectsView projects={projects} groups={groups} projectPosts={projectPosts} studentById={studentById} teacherById={teacherById}
              currentUser={currentUser} role={role}
              onAddPost={async (groupId, content, type) => {
                const id = 'pp' + Date.now();
                await window.__nexusTableSql('/data/project_posts.table',
                  'insert into ? (id, group_id, author_id, author_name, author_role, content, post_type, posted_at) values (?, ?, ?, ?, ?, ?, ?, ?)',
                  [id, groupId, currentUser.id, currentUser.name, role, content, type, new Date().toISOString().replace('T', ' ').slice(0, 19)]);
                await refreshAll();
              }}
              onUpdateProjectStatus={async (id, newStatus) => {
                setProjects(prev => prev.map(p => p.id === id ? { ...p, status: newStatus } : p));
                await window.__nexusTableSql('/data/projects.table', 'update ? set status = ? where id = ?', [newStatus, id]);
              }}
            />
          )}
          {role === 'teacher' && activePage === 'chat' && (
            <ChatView chats={chats} currentUser={currentUser} role={role} semester={4}
              onSend={async (message) => {
                const id = 'msg' + Date.now();
                const row = { id, sender_id: currentUser.id, sender_name: currentUser.name, sender_role: role, semester: 4, message, sent_at: new Date().toISOString().replace('T', ' ').slice(0, 19) };
                setChats(prev => [...prev, row]);
                await window.__nexusTableSql('/data/chat_messages.table',
                  'insert into ? (id, sender_id, sender_name, sender_role, semester, message, sent_at) values (?, ?, ?, ?, ?, ?, ?)',
                  [id, currentUser.id, currentUser.name, role, 4, message, row.sent_at]);
              }}
            />
          )}
          {role === 'teacher' && activePage === 'notices' && (
            <NoticesView notices={notices} canEdit
              onAdd={() => setModal({ type: 'addNotice' })}
              onDelete={async id => {
                await window.__nexusTableSql('/data/notices.table', 'delete from ? where id = ?', [id]);
                await refreshAll();
              }}
            />
          )}

          {/* STUDENT VIEWS */}
          {role === 'student' && activePage === 'dashboard' && (
            <StudentDashboard student={currentUser} {...{ marks, attendance, projects, notices, timetable, achievements, groups, teacherById }} />
          )}
          {role === 'student' && activePage === 'timetable' && (
            <TimetableView timetable={timetable} teacherById={teacherById} filterSemester={currentUser.semester} />
          )}
          {role === 'student' && activePage === 'attendance' && (
            <StudentAttendance attendance={attendance.filter(a => a.student_id === currentUser.id)} />
          )}
          {role === 'student' && activePage === 'marks' && (
            <StudentMarks marks={marks.filter(m => m.student_id === currentUser.id)} />
          )}
          {role === 'student' && activePage === 'projects' && (
            <ProjectsView projects={projects.filter(p => p.student_id === currentUser.id)} groups={groups.filter(g => safe(g.members).split(',').includes(currentUser.id))}
              projectPosts={projectPosts} studentById={studentById} teacherById={teacherById}
              currentUser={currentUser} role={role}
              onAddPost={async (groupId, content, type) => {
                const id = 'pp' + Date.now();
                await window.__nexusTableSql('/data/project_posts.table',
                  'insert into ? (id, group_id, author_id, author_name, author_role, content, post_type, posted_at) values (?, ?, ?, ?, ?, ?, ?, ?)',
                  [id, groupId, currentUser.id, currentUser.name, role, content, type, new Date().toISOString().replace('T', ' ').slice(0, 19)]);
                await refreshAll();
              }}
            />
          )}
          {role === 'student' && activePage === 'leaves' && (
            <StudentLeaves leaves={leaves.filter(l => l.student_id === currentUser.id)}
              onApply={() => setModal({ type: 'applyLeave', studentId: currentUser.id })}
              onWithdraw={async id => {
                setLeaves(prev => prev.map(l => l.id === id ? { ...l, status: 'Withdrawn' } : l));
                await window.__nexusTableSql('/data/leave_requests.table', 'update ? set status = ? where id = ?', ['Withdrawn', id]);
              }}
            />
          )}
          {role === 'student' && activePage === 'chat' && (
            <ChatView chats={chats.filter(c => c.semester === currentUser.semester)} currentUser={currentUser} role={role} semester={currentUser.semester}
              onSend={async (message) => {
                const id = 'msg' + Date.now();
                const row = { id, sender_id: currentUser.id, sender_name: currentUser.name, sender_role: role, semester: currentUser.semester, message, sent_at: new Date().toISOString().replace('T', ' ').slice(0, 19) };
                setChats(prev => [...prev, row]);
                await window.__nexusTableSql('/data/chat_messages.table',
                  'insert into ? (id, sender_id, sender_name, sender_role, semester, message, sent_at) values (?, ?, ?, ?, ?, ?, ?)',
                  [id, currentUser.id, currentUser.name, role, currentUser.semester, message, row.sent_at]);
              }}
            />
          )}
          {role === 'student' && activePage === 'notices' && (
            <NoticesView notices={notices} />
          )}

        </div>
      </div>

      {/* Modals */}
      {modal?.type === 'addStudent' && <AddStudentModal onClose={() => setModal(null)} onSave={async row => {
        const id = 's' + Date.now();
        await window.__nexusTableSql('/data/students.table',
          'insert into ? (id, name, roll_number, semester, department, email, phone, enrollment_year) values (?, ?, ?, ?, ?, ?, ?, ?)',
          [id, row.name, row.roll_number, num(row.semester), row.department, row.email, row.phone, num(row.enrollment_year)]);
        await refreshAll();
        setModal(null);
      }} />}

      {modal?.type === 'addTeacher' && <AddTeacherModal onClose={() => setModal(null)} onSave={async row => {
        const id = 't' + Date.now();
        await window.__nexusTableSql('/data/teachers.table',
          'insert into ? (id, name, employee_id, department, email, phone, subjects, designation) values (?, ?, ?, ?, ?, ?, ?, ?)',
          [id, row.name, row.employee_id, row.department, row.email, row.phone, row.subjects, row.designation]);
        await refreshAll();
        setModal(null);
      }} />}

      {modal?.type === 'addAttendance' && <AddAttendanceModal students={students} onClose={() => setModal(null)} onSave={async row => {
        const id = 'a' + Date.now();
        await window.__nexusTableSql('/data/attendance.table',
          'insert into ? (id, student_id, date, status, subject, semester) values (?, ?, ?, ?, ?, ?)',
          [id, row.student_id, row.date, row.status, row.subject, num(row.semester)]);
        await refreshAll();
        setModal(null);
      }} />}

      {modal?.type === 'addMark' && <AddMarkModal students={students} onClose={() => setModal(null)} onSave={async row => {
        const id = 'm' + Date.now();
        const total = num(row.internal_marks) + num(row.external_marks);
        const grade = total >= 90 ? 'A+' : total >= 80 ? 'A' : total >= 75 ? 'B+' : total >= 65 ? 'B' : total >= 55 ? 'C' : total >= 40 ? 'D' : 'F';
        const result = total >= 40 ? 'Pass' : 'Fail';
        await window.__nexusTableSql('/data/marks.table',
          'insert into ? (id, student_id, subject, semester, internal_marks, external_marks, total_marks, grade, result) values (?, ?, ?, ?, ?, ?, ?, ?, ?)',
          [id, row.student_id, row.subject, num(row.semester), num(row.internal_marks), num(row.external_marks), total, grade, result]);
        await refreshAll();
        setModal(null);
      }} />}

      {modal?.type === 'addNotice' && <AddNoticeModal onClose={() => setModal(null)} authorName={currentUser.name} authorId={currentUser.id} onSave={async row => {
        const id = 'n' + Date.now();
        await window.__nexusTableSql('/data/notices.table',
          'insert into ? (id, title, content, author_id, author_name, priority, posted_date, target_audience) values (?, ?, ?, ?, ?, ?, ?, ?)',
          [id, row.title, row.content, row.author_id, row.author_name, row.priority, row.posted_date, row.target_audience]);
        await refreshAll();
        setModal(null);
      }} />}

      {modal?.type === 'addEvent' && <AddEventModal onClose={() => setModal(null)} onSave={async row => {
        const id = 'e' + Date.now();
        await window.__nexusTableSql('/data/events.table',
          'insert into ? (id, title, description, event_date, location, category, organizer) values (?, ?, ?, ?, ?, ?, ?)',
          [id, row.title, row.description, row.event_date, row.location, row.category, row.organizer]);
        await refreshAll();
        setModal(null);
      }} />}

      {modal?.type === 'addAchievement' && <AddAchievementModal students={students} onClose={() => setModal(null)} onSave={async row => {
        const id = 'ach' + Date.now();
        await window.__nexusTableSql('/data/achievements.table',
          'insert into ? (id, student_id, title, description, category, date_achieved, rank) values (?, ?, ?, ?, ?, ?, ?)',
          [id, row.student_id, row.title, row.description, row.category, row.date_achieved, row.rank]);
        await refreshAll();
        setModal(null);
      }} />}

      {modal?.type === 'applyLeave' && <ApplyLeaveModal onClose={() => setModal(null)} studentId={modal.studentId} onSave={async row => {
        const id = 'l' + Date.now();
        await window.__nexusTableSql('/data/leave_requests.table',
          'insert into ? (id, student_id, reason, from_date, to_date, status, applied_date, reviewed_by, review_note) values (?, ?, ?, ?, ?, ?, ?, ?, ?)',
          [id, row.student_id, row.reason, row.from_date, row.to_date, 'Pending', new Date().toISOString().slice(0, 10), '', '']);
        await refreshAll();
        setModal(null);
      }} />}

      {modal?.type === 'studentDetail' && (
        <StudentDetailModal student={modal.student} onClose={() => setModal(null)}
          marks={marks.filter(m => m.student_id === modal.student.id)}
          attendance={attendance.filter(a => a.student_id === modal.student.id)}
          projects={projects.filter(p => p.student_id === modal.student.id)}
        />
      )}

      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(8px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}} />
    </div>
  );
}

// =============== LOGIN VIEW ===============
function LoginView({ students, teachers, onLogin }) {
  const [tab, setTab] = useState('admin');
  return (
    <div className="min-h-screen bg-[#FAFAF8] flex items-center justify-center p-6">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-3xl bg-[#1A1A1A] flex items-center justify-center mx-auto mb-4">
            <Zap size={28} className="text-white" />
          </div>
          <h1 className="text-2xl font-bold text-[#1A1A1A]">ECE Student Portal</h1>
          <p className="text-sm text-[#6B6B6B] mt-1">GPT Chintamani Government Polytechnic</p>
          <p className="text-[11px] text-[#9B9B9B] mt-0.5">Electronics & Communication Engineering</p>
        </div>

        <div className="bg-white rounded-2xl border border-[#F0F0F0] p-6 shadow-sm">
          <div className="flex gap-1 bg-[#F0F0F0]/60 rounded-full p-1 mb-5">
            {[
              { id: 'admin', label: 'Admin', c: ACCENT.coral, icon: Shield },
              { id: 'teacher', label: 'Teacher', c: ACCENT.amber, icon: Presentation },
              { id: 'student', label: 'Student', c: ACCENT.lilac, icon: GraduationCap },
            ].map(t => {
              const Icon = t.icon;
              const active = tab === t.id;
              return (
                <button key={t.id} onClick={() => setTab(t.id)}
                  className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-medium rounded-full transition-all ${active ? 'bg-white shadow-sm' : 'text-[#6B6B6B]'}`}
                  style={active ? { color: t.c } : {}}>
                  <Icon size={13} /> {t.label}
                </button>
              );
            })}
          </div>

          {tab === 'admin' && (
            <div>
              <div className="bg-[#FF6B6B]/10 border border-[#FF6B6B]/20 rounded-xl p-4 mb-4">
                <p className="text-[11px] text-[#DC2626] font-medium mb-1">Administrator Access</p>
                <p className="text-[11px] text-[#6B6B6B]">Full access to manage all students, teachers, notices, and approvals.</p>
              </div>
              <button onClick={() => onLogin('admin', 'admin')}
                className="w-full py-2.5 bg-[#B8A9E8] text-[#1A1A1A] rounded-full text-sm font-medium hover:bg-[#A89AD8] shadow-sm hover:shadow-md transition-all flex items-center justify-center gap-2">
                <LogIn size={14} /> Sign in as Admin
              </button>
            </div>
          )}

          {tab === 'teacher' && (
            <div>
              <p className="text-[11px] text-[#6B6B6B] mb-2">Select your teacher profile</p>
              <div className="space-y-2 max-h-72 overflow-y-auto">
                {teachers.map(t => (
                  <button key={t.id} onClick={() => onLogin('teacher', t.id)}
                    className="w-full text-left px-4 py-3 border border-[#F0F0F0] rounded-xl hover:bg-[#FAFAF8] hover:border-[#F5A623]/30 transition-all flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl flex items-center justify-center font-semibold text-sm" style={{ backgroundColor: ACCENT.amber + '20', color: ACCENT.amber }}>
                      {safe(t.name).charAt(0)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-[#1A1A1A] truncate">{safe(t.name)}</p>
                      <p className="text-[11px] text-[#9B9B9B] truncate">{safe(t.designation)} · {safe(t.employee_id)}</p>
                    </div>
                    <ChevronRight size={14} className="text-[#9B9B9B]" />
                  </button>
                ))}
                {teachers.length === 0 && <p className="text-xs text-[#9B9B9B] text-center py-4">No teachers</p>}
              </div>
            </div>
          )}

          {tab === 'student' && (
            <div>
              <p className="text-[11px] text-[#6B6B6B] mb-2">Select your student profile</p>
              <div className="space-y-2 max-h-72 overflow-y-auto">
                {students.map(s => (
                  <button key={s.id} onClick={() => onLogin('student', s.id)}
                    className="w-full text-left px-4 py-3 border border-[#F0F0F0] rounded-xl hover:bg-[#FAFAF8] hover:border-[#B8A9E8]/30 transition-all flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl flex items-center justify-center font-semibold text-sm" style={{ backgroundColor: ACCENT.lilac + '20', color: ACCENT.lilac }}>
                      {safe(s.name).charAt(0)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-[#1A1A1A] truncate">{safe(s.name)}</p>
                      <p className="text-[11px] text-[#9B9B9B] font-mono truncate">{safe(s.roll_number)} · Sem {s.semester}</p>
                    </div>
                    <ChevronRight size={14} className="text-[#9B9B9B]" />
                  </button>
                ))}
                {students.length === 0 && <p className="text-xs text-[#9B9B9B] text-center py-4">No students</p>}
              </div>
            </div>
          )}
        </div>

        <p className="text-[10px] text-center text-[#9B9B9B] mt-6">
          Inspired by <span className="font-mono">maruthio5/ece-portal</span> · Powered by Zaro
        </p>
      </div>
    </div>
  );
}

// =============== ADMIN DASHBOARD ===============
function AdminDashboard({ students, teachers, marks, attendance, projects, leaves, notices, events }) {
  const attPct = attendance.length ? Math.round((attendance.filter(a => safe(a.status) === 'Present').length / attendance.length) * 100) : 0;
  const pendingLeaves = leaves.filter(l => safe(l.status) === 'Pending').length;
  const passRate = marks.length ? Math.round((marks.filter(m => safe(m.result) === 'Pass').length / marks.length) * 100) : 0;

  const stats = [
    { l: 'Total Students', v: students.length, i: Users, c: ACCENT.lilac },
    { l: 'Teachers', v: teachers.length, i: Presentation, c: ACCENT.amber },
    { l: 'Avg Attendance', v: attPct + '%', i: ClipboardCheck, c: ACCENT.green },
    { l: 'Pass Rate', v: passRate + '%', i: Award, c: ACCENT.teal },
    { l: 'Active Projects', v: projects.filter(p => ['In Progress', 'Submitted', 'Reviewed'].includes(safe(p.status))).length, i: Target, c: ACCENT.lilac },
    { l: 'Pending Leaves', v: pendingLeaves, i: CalendarDays, c: ACCENT.coral },
    { l: 'Notices', v: notices.length, i: Bell, c: ACCENT.amber },
    { l: 'Upcoming Events', v: events.length, i: Calendar, c: ACCENT.teal },
  ];

  const deptChart = useMemo(() => {
    const m = {};
    students.forEach(s => { const d = safe(s.department) || 'Other'; m[d] = (m[d] || 0) + 1; });
    return Object.entries(m).map(([name, value]) => ({ name, value }));
  }, [students]);

  const semMarksChart = useMemo(() => {
    const bySem = {};
    marks.forEach(m => {
      const s = String(m.semester);
      if (!bySem[s]) bySem[s] = { total: 0, count: 0 };
      bySem[s].total += num(m.total_marks);
      bySem[s].count++;
    });
    return Object.entries(bySem).map(([sem, v]) => ({ sem: 'Sem ' + sem, avg: Math.round(v.total / v.count) })).sort((a, b) => a.sem.localeCompare(b.sem));
  }, [marks]);

  const PIE_COLORS = [ACCENT.lilac, ACCENT.amber, ACCENT.teal, ACCENT.coral, ACCENT.green];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {stats.map((s, i) => {
          const Icon = s.i;
          return (
            <div key={i} className="bg-white rounded-2xl border border-[#F0F0F0] p-5 hover:-translate-y-0.5 hover:shadow-md transition-all duration-200">
              <div className="flex items-center justify-between mb-3">
                <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ backgroundColor: s.c + '15' }}>
                  <Icon size={14} style={{ color: s.c }} />
                </div>
                <span className="text-2xl font-bold text-[#1A1A1A]">{s.v}</span>
              </div>
              <p className="text-[11px] text-[#9B9B9B] font-medium">{s.l}</p>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl border border-[#F0F0F0] p-6">
          <h3 className="text-sm font-semibold text-[#1A1A1A] mb-4 flex items-center gap-2">
            <Building2 size={14} className="text-[#B8A9E8]" /> Students by Department
          </h3>
          {deptChart.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={deptChart} dataKey="value" nameKey="name" innerRadius={50} outerRadius={85} paddingAngle={3}>
                  {deptChart.map((entry, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                </Pie>
                <Tooltip contentStyle={{ borderRadius: 12, border: '1px solid #F0F0F0', fontSize: 12 }} />
                <Legend wrapperStyle={{ fontSize: 11 }} />
              </PieChart>
            </ResponsiveContainer>
          ) : <p className="text-sm text-[#9B9B9B]">No data</p>}
        </div>

        <div className="bg-white rounded-2xl border border-[#F0F0F0] p-6">
          <h3 className="text-sm font-semibold text-[#1A1A1A] mb-4 flex items-center gap-2">
            <TrendingUp size={14} className="text-[#F5A623]" /> Average Marks per Semester
          </h3>
          {semMarksChart.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={semMarksChart}>
                <CartesianGrid strokeDasharray="3 3" stroke="#F0F0F0" />
                <XAxis dataKey="sem" tick={{ fontSize: 11, fill: '#6B6B6B' }} />
                <YAxis tick={{ fontSize: 11, fill: '#6B6B6B' }} domain={[0, 100]} />
                <Tooltip contentStyle={{ borderRadius: 12, border: '1px solid #F0F0F0', fontSize: 12 }} />
                <Bar dataKey="avg" fill={ACCENT.lilac} radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : <p className="text-sm text-[#9B9B9B]">No data</p>}
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-[#F0F0F0] p-6">
        <h3 className="text-sm font-semibold text-[#1A1A1A] mb-4 flex items-center gap-2">
          <Bell size={14} className="text-[#F5A623]" /> Latest Notices
        </h3>
        <div className="space-y-3">
          {notices.slice(0, 3).map(n => {
            const c = PRIORITY_COLOR[safe(n.priority)] || ACCENT.lilac;
            return (
              <div key={n.id} className="flex items-start gap-3 py-2 border-b border-[#F0F0F0] last:border-0">
                <div className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0" style={{ backgroundColor: c + '15' }}>
                  <Bell size={12} style={{ color: c }} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-[#1A1A1A] truncate">{safe(n.title)}</p>
                  <p className="text-[11px] text-[#9B9B9B] mt-0.5">{safe(n.posted_date)} · {safe(n.author_name)}</p>
                </div>
                <span className="text-[10px] px-2 py-0.5 rounded-full font-semibold border shrink-0" style={{ backgroundColor: c + '1A', color: c, borderColor: c + '33' }}>{safe(n.priority)}</span>
              </div>
            );
          })}
          {notices.length === 0 && <p className="text-xs text-[#9B9B9B] text-center py-4">No notices</p>}
        </div>
      </div>
    </div>
  );
}

// =============== TEACHER DASHBOARD ===============
function TeacherDashboard({ teacher, timetable, students, attendance, projects, groups }) {
  const today = new Date().toLocaleDateString('en-US', { weekday: 'long' });
  const todayClasses = timetable.filter(t => safe(t.day) === today && safe(t.teacher_id) === teacher.id).sort((a, b) => a.period - b.period);
  const myGroups = groups.filter(g => safe(g.mentor_id) === teacher.id);
  const mySubjects = safe(teacher.subjects).split(',').map(s => s.trim()).filter(Boolean);

  const stats = [
    { l: "Today's Classes", v: todayClasses.length, i: CalendarDays, c: ACCENT.amber },
    { l: 'Subjects', v: mySubjects.length, i: BookOpen, c: ACCENT.lilac },
    { l: 'Project Groups', v: myGroups.length, i: Target, c: ACCENT.teal },
    { l: 'Students', v: students.length, i: Users, c: ACCENT.green },
  ];

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-2xl border border-[#F0F0F0] p-6">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl flex items-center justify-center font-bold text-xl" style={{ backgroundColor: ACCENT.amber + '20', color: ACCENT.amber }}>
            {safe(teacher.name).charAt(0)}
          </div>
          <div>
            <h2 className="text-base font-bold text-[#1A1A1A]">Welcome, {safe(teacher.name)}</h2>
            <p className="text-[11px] text-[#9B9B9B] mt-0.5">{safe(teacher.designation)} · {safe(teacher.employee_id)} · {safe(teacher.department)}</p>
            <p className="text-[11px] text-[#6B6B6B] mt-1">{mySubjects.join(' · ')}</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {stats.map((s, i) => {
          const Icon = s.i;
          return (
            <div key={i} className="bg-white rounded-2xl border border-[#F0F0F0] p-5 hover:-translate-y-0.5 hover:shadow-md transition-all duration-200">
              <div className="flex items-center justify-between mb-3">
                <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ backgroundColor: s.c + '15' }}>
                  <Icon size={14} style={{ color: s.c }} />
                </div>
                <span className="text-2xl font-bold text-[#1A1A1A]">{s.v}</span>
              </div>
              <p className="text-[11px] text-[#9B9B9B] font-medium">{s.l}</p>
            </div>
          );
        })}
      </div>

      <div className="bg-white rounded-2xl border border-[#F0F0F0] p-6">
        <h3 className="text-sm font-semibold text-[#1A1A1A] mb-4 flex items-center gap-2">
          <CalendarDays size={14} className="text-[#F5A623]" /> Today's Schedule ({today})
        </h3>
        {todayClasses.length > 0 ? (
          <div className="space-y-2">
            {todayClasses.map(c => (
              <div key={c.id} className="flex items-center gap-4 px-4 py-3 border border-[#F0F0F0] rounded-xl hover:bg-[#FAFAF8] transition-colors">
                <div className="w-9 h-9 rounded-xl flex items-center justify-center font-bold text-sm" style={{ backgroundColor: ACCENT.amber + '15', color: ACCENT.amber }}>
                  {c.period}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-[#1A1A1A]">{safe(c.subject)}</p>
                  <p className="text-[11px] text-[#9B9B9B]">{safe(c.start_time)} - {safe(c.end_time)} · {safe(c.room)} · Sem {c.semester}</p>
                </div>
              </div>
            ))}
          </div>
        ) : <p className="text-xs text-[#9B9B9B] text-center py-4">No classes today. Enjoy the day off!</p>}
      </div>
    </div>
  );
}

// =============== STUDENT DASHBOARD ===============
function StudentDashboard({ student, marks, attendance, projects, notices, timetable, achievements, groups, teacherById }) {
  const myAtt = attendance.filter(a => a.student_id === student.id);
  const mtPresent = myAtt.filter(a => safe(a.status) === 'Present').length;
  const attPct = myAtt.length ? Math.round((mtPresent / myAtt.length) * 100) : 0;
  const myMarks = marks.filter(m => m.student_id === student.id);
  const avgMark = myMarks.length ? Math.round(myMarks.reduce((sum, m) => sum + num(m.total_marks), 0) / myMarks.length) : 0;
  const myProjects = projects.filter(p => p.student_id === student.id);
  const myAch = achievements.filter(a => a.student_id === student.id);
  const myGroups = groups.filter(g => safe(g.members).split(',').includes(student.id));

  const today = new Date().toLocaleDateString('en-US', { weekday: 'long' });
  const todayClasses = timetable.filter(t => safe(t.day) === today && t.semester === student.semester).sort((a, b) => a.period - b.period);

  const stats = [
    { l: 'Attendance', v: attPct + '%', i: ClipboardCheck, c: attPct >= 75 ? ACCENT.green : ACCENT.coral },
    { l: 'Avg Mark', v: avgMark || '—', i: GraduationCap, c: ACCENT.lilac },
    { l: 'Projects', v: myProjects.length, i: Target, c: ACCENT.amber },
    { l: 'Achievements', v: myAch.length, i: Trophy, c: ACCENT.teal },
  ];

  return (
    <div className="space-y-6">
      {/* Welcome banner */}
      <div className="bg-white rounded-2xl border border-[#F0F0F0] p-6">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl flex items-center justify-center font-bold text-xl" style={{ backgroundColor: ACCENT.lilac + '20', color: ACCENT.lilac }}>
            {safe(student.name).charAt(0)}
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="text-base font-bold text-[#1A1A1A]">Hi, {safe(student.name).split(' ')[0]} 👋</h2>
            <p className="text-[11px] text-[#9B9B9B] mt-0.5 font-mono">{safe(student.roll_number)} · Sem {student.semester} · {safe(student.department)}</p>
          </div>
          {/* Attendance ring */}
          <div className="relative w-16 h-16 shrink-0">
            <svg viewBox="0 0 36 36" className="w-full h-full -rotate-90">
              <circle cx="18" cy="18" r="15" fill="none" stroke="#F0F0F0" strokeWidth="3" />
              <circle cx="18" cy="18" r="15" fill="none" stroke={attPct >= 75 ? ACCENT.green : ACCENT.coral} strokeWidth="3" strokeDasharray={`${attPct * 0.94} 100`} strokeLinecap="round" />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-sm font-bold text-[#1A1A1A]">{attPct}%</span>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {stats.map((s, i) => {
          const Icon = s.i;
          return (
            <div key={i} className="bg-white rounded-2xl border border-[#F0F0F0] p-5 hover:-translate-y-0.5 hover:shadow-md transition-all duration-200">
              <div className="flex items-center justify-between mb-3">
                <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ backgroundColor: s.c + '15' }}>
                  <Icon size={14} style={{ color: s.c }} />
                </div>
                <span className="text-2xl font-bold text-[#1A1A1A]">{s.v}</span>
              </div>
              <p className="text-[11px] text-[#9B9B9B] font-medium">{s.l}</p>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl border border-[#F0F0F0] p-6">
          <h3 className="text-sm font-semibold text-[#1A1A1A] mb-4 flex items-center gap-2">
            <CalendarDays size={14} className="text-[#F5A623]" /> Today's Classes ({today})
          </h3>
          {todayClasses.length > 0 ? (
            <div className="space-y-2">
              {todayClasses.map(c => {
                const teacher = teacherById[c.teacher_id];
                return (
                  <div key={c.id} className="flex items-center gap-3 px-3 py-2.5 border border-[#F0F0F0] rounded-xl">
                    <div className="w-8 h-8 rounded-xl flex items-center justify-center font-bold text-xs" style={{ backgroundColor: ACCENT.amber + '15', color: ACCENT.amber }}>
                      {c.period}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-[#1A1A1A] truncate">{safe(c.subject)}</p>
                      <p className="text-[10px] text-[#9B9B9B]">{safe(c.start_time)}-{safe(c.end_time)} · {teacher ? safe(teacher.name) : '—'}</p>
                    </div>
                    <span className="text-[10px] text-[#6B6B6B] flex items-center gap-1"><MapPin size={9} />{safe(c.room)}</span>
                  </div>
                );
              })}
            </div>
          ) : <p className="text-xs text-[#9B9B9B] text-center py-4">No classes today</p>}
        </div>

        <div className="bg-white rounded-2xl border border-[#F0F0F0] p-6">
          <h3 className="text-sm font-semibold text-[#1A1A1A] mb-4 flex items-center gap-2">
            <Bell size={14} className="text-[#F5A623]" /> Latest Notices
          </h3>
          <div className="space-y-3">
            {notices.slice(0, 4).map(n => {
              const c = PRIORITY_COLOR[safe(n.priority)] || ACCENT.lilac;
              return (
                <div key={n.id} className="flex items-start gap-3">
                  <div className="w-2 h-2 rounded-full mt-1.5 shrink-0" style={{ backgroundColor: c }} />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-[#1A1A1A] truncate">{safe(n.title)}</p>
                    <p className="text-[10px] text-[#9B9B9B]">{safe(n.posted_date)}</p>
                  </div>
                </div>
              );
            })}
            {notices.length === 0 && <p className="text-xs text-[#9B9B9B]">No notices</p>}
          </div>
        </div>
      </div>

      {myAch.length > 0 && (
        <div className="bg-white rounded-2xl border border-[#F0F0F0] p-6">
          <h3 className="text-sm font-semibold text-[#1A1A1A] mb-4 flex items-center gap-2">
            <Trophy size={14} className="text-[#F5A623]" /> My Achievements
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {myAch.map(a => {
              const c = CAT_COLOR[safe(a.category)] || ACCENT.amber;
              return (
                <div key={a.id} className="flex items-start gap-3 p-3 border border-[#F0F0F0] rounded-xl">
                  <div className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0" style={{ backgroundColor: c + '15' }}>
                    <Star size={12} style={{ color: c }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-[#1A1A1A]">{safe(a.title)}</p>
                    <p className="text-[11px] text-[#6B6B6B] mt-0.5">{safe(a.category)} · {safe(a.date_achieved)}</p>
                  </div>
                  {safe(a.rank) && <span className="text-[10px] px-2 py-0.5 rounded-full font-bold border" style={{ backgroundColor: c + '1A', color: c, borderColor: c + '33' }}>{safe(a.rank)}</span>}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

// =============== STUDENTS ADMIN ===============
function StudentsAdmin({ students, attendance, marks, onAdd, onDelete, onSelect }) {
  const [search, setSearch] = useState('');
  const filtered = students.filter(s => !search || safe(s.name).toLowerCase().includes(search.toLowerCase()) || safe(s.roll_number).toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[240px] max-w-md">
          <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#9B9B9B]" />
          <input className="w-full pl-10 pr-4 py-2.5 text-sm border border-[#F0F0F0] rounded-full bg-white placeholder:text-[#9B9B9B] focus:outline-none focus:ring-2 focus:ring-[#1A1A1A]/5"
            placeholder="Search by name or roll number…" value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <span className="text-[11px] text-[#9B9B9B]">{filtered.length} students</span>
        <button onClick={onAdd} className="ml-auto flex items-center gap-1.5 px-4 py-2 bg-[#B8A9E8] text-[#1A1A1A] rounded-full text-sm font-medium hover:bg-[#A89AD8] shadow-sm hover:shadow-md transition-all">
          <Plus size={14} /> Add Student
        </button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map(s => {
          const att = attendance.filter(a => a.student_id === s.id);
          const attPct = att.length ? Math.round((att.filter(a => safe(a.status) === 'Present').length / att.length) * 100) : 0;
          const sm = marks.filter(m => m.student_id === s.id);
          const avgMark = sm.length ? Math.round(sm.reduce((t, m) => t + num(m.total_marks), 0) / sm.length) : 0;
          return (
            <div key={s.id} onClick={() => onSelect(s)}
              className="bg-white rounded-2xl border border-[#F0F0F0] p-5 hover:-translate-y-0.5 hover:shadow-md transition-all duration-200 cursor-pointer">
              <div className="flex items-start justify-between mb-3">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center font-bold" style={{ backgroundColor: ACCENT.lilac + '20', color: ACCENT.lilac }}>
                  {safe(s.name).charAt(0)}
                </div>
                <button onClick={e => { e.stopPropagation(); onDelete(s.id); }} className="text-[#9B9B9B] hover:text-[#DC2626]">
                  <Trash2 size={13} />
                </button>
              </div>
              <h4 className="text-sm font-semibold text-[#1A1A1A]">{safe(s.name)}</h4>
              <p className="text-[11px] text-[#9B9B9B] font-mono">{safe(s.roll_number)}</p>
              <p className="text-[11px] text-[#6B6B6B] mt-1">{safe(s.department)} · Sem {s.semester}</p>
              <div className="flex items-center gap-3 mt-3 pt-3 border-t border-[#F0F0F0]">
                <div className="flex-1"><p className="text-[10px] text-[#9B9B9B]">Attend.</p><p className="text-sm font-semibold text-[#1A1A1A]">{attPct}%</p></div>
                <div className="flex-1"><p className="text-[10px] text-[#9B9B9B]">Avg</p><p className="text-sm font-semibold text-[#1A1A1A]">{avgMark || '—'}</p></div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// =============== TEACHERS ADMIN ===============
function TeachersAdmin({ teachers, onAdd, onDelete }) {
  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3">
        <h3 className="text-sm font-semibold text-[#1A1A1A]">Faculty</h3>
        <span className="text-[11px] text-[#9B9B9B]">{teachers.length} teachers</span>
        <button onClick={onAdd} className="ml-auto flex items-center gap-1.5 px-4 py-2 bg-[#B8A9E8] text-[#1A1A1A] rounded-full text-sm font-medium hover:bg-[#A89AD8] shadow-sm hover:shadow-md transition-all">
          <Plus size={14} /> Add Teacher
        </button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {teachers.map(t => (
          <div key={t.id} className="bg-white rounded-2xl border border-[#F0F0F0] p-5 hover:-translate-y-0.5 hover:shadow-md transition-all duration-200">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-xl flex items-center justify-center font-bold text-lg shrink-0" style={{ backgroundColor: ACCENT.amber + '20', color: ACCENT.amber }}>
                {safe(t.name).charAt(0)}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <h4 className="text-sm font-semibold text-[#1A1A1A]">{safe(t.name)}</h4>
                  <span className="text-[10px] px-2 py-0.5 rounded-full font-semibold border" style={{ backgroundColor: ACCENT.amber + '1A', color: '#92400E', borderColor: ACCENT.amber + '33' }}>{safe(t.designation)}</span>
                </div>
                <p className="text-[11px] text-[#9B9B9B] font-mono mt-0.5">{safe(t.employee_id)} · {safe(t.department)}</p>
                <p className="text-[11px] text-[#6B6B6B] mt-2 flex items-center gap-1.5"><BookOpen size={10} className="text-[#B8A9E8]" />{safe(t.subjects)}</p>
                <div className="flex items-center gap-4 mt-2">
                  <span className="text-[10px] text-[#6B6B6B] flex items-center gap-1"><Mail size={9} className="text-[#4ECDC4]" />{safe(t.email)}</span>
                  <span className="text-[10px] text-[#6B6B6B] flex items-center gap-1"><Phone size={9} className="text-[#4ADE80]" />{safe(t.phone)}</span>
                </div>
              </div>
              <button onClick={() => onDelete(t.id)} className="text-[#9B9B9B] hover:text-[#DC2626]">
                <Trash2 size={13} />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// =============== ATTENDANCE (Admin/Teacher) ===============
function AttendanceView({ attendance, studentById, onAdd, onStatusChange, onDelete, canEdit }) {
  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3">
        <h3 className="text-sm font-semibold text-[#1A1A1A]">Attendance Records</h3>
        <span className="text-[11px] text-[#9B9B9B]">{attendance.length} entries</span>
        {canEdit && <button onClick={onAdd} className="ml-auto flex items-center gap-1.5 px-4 py-2 bg-[#B8A9E8] text-[#1A1A1A] rounded-full text-sm font-medium hover:bg-[#A89AD8] shadow-sm hover:shadow-md transition-all">
          <Plus size={14} /> Mark Attendance
        </button>}
      </div>
      <div className="bg-white rounded-2xl border border-[#F0F0F0] overflow-hidden">
        <div className="divide-y divide-[#F0F0F0]">
          {attendance.map(a => {
            const student = studentById[a.student_id];
            const status = safe(a.status);
            const c = ATT_COLOR[status] || ACCENT.lilac;
            const tx = ATT_TEXT[status] || '#5B21B6';
            return (
              <div key={a.id} className="flex items-center gap-3 px-5 py-3.5 hover:bg-[#FAFAF8] transition-colors">
                <Calendar size={14} style={{ color: c }} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-[#1A1A1A] truncate">{student ? safe(student.name) : safe(a.student_id)}</p>
                  <p className="text-[11px] text-[#9B9B9B] truncate">{safe(a.date)} · {safe(a.subject) || 'General'} · Sem {a.semester}</p>
                </div>
                {canEdit ? (
                  <select value={status} onChange={e => onStatusChange(a.id, e.target.value)}
                    className="text-[10px] px-2.5 py-1 rounded-full font-semibold uppercase tracking-wide border cursor-pointer focus:outline-none"
                    style={{ backgroundColor: c + '1A', color: tx, borderColor: c + '33' }}>
                    <option value="Present">Present</option>
                    <option value="Absent">Absent</option>
                    <option value="Late">Late</option>
                    <option value="Excused">Excused</option>
                  </select>
                ) : (
                  <span className="text-[10px] px-2.5 py-0.5 rounded-full font-semibold uppercase tracking-wide border" style={{ backgroundColor: c + '1A', color: tx, borderColor: c + '33' }}>{status}</span>
                )}
                {canEdit && <button onClick={() => onDelete(a.id)} className="text-[#9B9B9B] hover:text-[#DC2626]"><Trash2 size={13} /></button>}
              </div>
            );
          })}
          {attendance.length === 0 && (
            <div className="text-center py-12">
              <ClipboardCheck size={28} className="mx-auto mb-3 text-[#E0E0E0]" />
              <p className="text-sm text-[#9B9B9B]">No attendance records yet</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// =============== MARKS (Admin/Teacher) ===============
function MarksView({ marks, studentById, onAdd, onDelete, canEdit }) {
  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3">
        <h3 className="text-sm font-semibold text-[#1A1A1A]">Marks & Grades</h3>
        <span className="text-[11px] text-[#9B9B9B]">{marks.length} entries</span>
        {canEdit && <button onClick={onAdd} className="ml-auto flex items-center gap-1.5 px-4 py-2 bg-[#B8A9E8] text-[#1A1A1A] rounded-full text-sm font-medium hover:bg-[#A89AD8] shadow-sm hover:shadow-md transition-all">
          <Plus size={14} /> Add Marks
        </button>}
      </div>
      <div className="bg-white rounded-2xl border border-[#F0F0F0] overflow-hidden">
        <div className="grid grid-cols-12 px-5 py-3 border-b border-[#F0F0F0] bg-[#FAFAF8] text-[10px] font-semibold uppercase tracking-wide text-[#9B9B9B]">
          <div className="col-span-3">Student</div>
          <div className="col-span-3">Subject</div>
          <div className="col-span-1 text-center">Sem</div>
          <div className="col-span-1 text-center">Int</div>
          <div className="col-span-1 text-center">Ext</div>
          <div className="col-span-1 text-center">Total</div>
          <div className="col-span-1 text-center">Grade</div>
          <div className="col-span-1 text-right"></div>
        </div>
        <div className="divide-y divide-[#F0F0F0]">
          {marks.map(m => {
            const student = studentById[m.student_id];
            const grade = safe(m.grade);
            const gc = GRADE_COLOR[grade] || ACCENT.lilac;
            return (
              <div key={m.id} className="grid grid-cols-12 items-center px-5 py-3 hover:bg-[#FAFAF8] transition-colors text-sm">
                <div className="col-span-3 min-w-0">
                  <p className="font-medium text-[#1A1A1A] truncate">{student ? safe(student.name) : safe(m.student_id)}</p>
                  <p className="text-[11px] text-[#9B9B9B] font-mono truncate">{student ? safe(student.roll_number) : ''}</p>
                </div>
                <div className="col-span-3 text-[#1A1A1A] truncate flex items-center gap-2">
                  <BookOpen size={12} className="text-[#B8A9E8] shrink-0" />{safe(m.subject)}
                </div>
                <div className="col-span-1 text-center text-[#6B6B6B]">{m.semester}</div>
                <div className="col-span-1 text-center text-[#6B6B6B]">{m.internal_marks}</div>
                <div className="col-span-1 text-center text-[#6B6B6B]">{m.external_marks}</div>
                <div className="col-span-1 text-center font-semibold text-[#1A1A1A]">{m.total_marks}</div>
                <div className="col-span-1 text-center">
                  <span className="text-[10px] px-2 py-0.5 rounded-full font-bold border" style={{ backgroundColor: gc + '1A', color: gc, borderColor: gc + '33' }}>{grade}</span>
                </div>
                <div className="col-span-1 flex items-center justify-end gap-2">
                  {safe(m.result) === 'Pass' ? <CheckCircle2 size={14} className="text-[#4ADE80]" /> : <XCircle size={14} className="text-[#FF6B6B]" />}
                  {canEdit && <button onClick={() => onDelete(m.id)} className="text-[#9B9B9B] hover:text-[#DC2626]"><Trash2 size={12} /></button>}
                </div>
              </div>
            );
          })}
          {marks.length === 0 && <div className="text-center py-12"><GraduationCap size={28} className="mx-auto mb-3 text-[#E0E0E0]" /><p className="text-sm text-[#9B9B9B]">No marks recorded yet</p></div>}
        </div>
      </div>
    </div>
  );
}

// =============== STUDENT ATTENDANCE (per-subject breakdown) ===============
function StudentAttendance({ attendance }) {
  const bySubject = useMemo(() => {
    const map = {};
    attendance.forEach(a => {
      const s = safe(a.subject) || 'General';
      if (!map[s]) map[s] = { total: 0, present: 0 };
      map[s].total++;
      if (safe(a.status) === 'Present') map[s].present++;
    });
    return Object.entries(map).map(([subject, v]) => ({ subject, ...v, pct: Math.round((v.present / v.total) * 100) }));
  }, [attendance]);

  const overall = attendance.length ? Math.round((attendance.filter(a => safe(a.status) === 'Present').length / attendance.length) * 100) : 0;

  return (
    <div className="space-y-5">
      <div className="bg-white rounded-2xl border border-[#F0F0F0] p-6">
        <h3 className="text-sm font-semibold text-[#1A1A1A] mb-4 flex items-center gap-2">
          <ClipboardCheck size={14} className="text-[#4ADE80]" /> Attendance by Subject
        </h3>
        {bySubject.length > 0 ? (
          <div className="space-y-4">
            {bySubject.map(s => {
              const c = s.pct >= 75 ? ACCENT.green : s.pct >= 60 ? ACCENT.amber : ACCENT.coral;
              return (
                <div key={s.subject}>
                  <div className="flex items-center justify-between text-sm mb-1.5">
                    <span className="text-[#1A1A1A] font-medium flex items-center gap-2"><BookOpen size={12} className="text-[#B8A9E8]" />{s.subject}</span>
                    <span className="text-[#6B6B6B]">{s.present}/{s.total} · <span className="font-semibold text-[#1A1A1A]">{s.pct}%</span></span>
                  </div>
                  <div className="w-full h-2 bg-[#F0F0F0] rounded-full overflow-hidden">
                    <div className="h-full rounded-full transition-all duration-300" style={{ width: `${s.pct}%`, backgroundColor: c }} />
                  </div>
                </div>
              );
            })}
            <div className="pt-3 border-t border-[#F0F0F0] flex items-center justify-between">
              <span className="text-sm font-semibold text-[#1A1A1A]">Overall</span>
              <span className={`text-lg font-bold`} style={{ color: overall >= 75 ? ACCENT.green : ACCENT.coral }}>{overall}%</span>
            </div>
          </div>
        ) : <p className="text-xs text-[#9B9B9B] text-center py-4">No attendance records</p>}
      </div>
    </div>
  );
}

// =============== STUDENT MARKS ===============
function StudentMarks({ marks }) {
  const bySem = useMemo(() => {
    const map = {};
    marks.forEach(m => {
      const k = String(m.semester);
      if (!map[k]) map[k] = [];
      map[k].push(m);
    });
    return Object.entries(map).sort((a, b) => Number(b[0]) - Number(a[0]));
  }, [marks]);

  return (
    <div className="space-y-5">
      {bySem.map(([sem, items]) => {
        const avg = Math.round(items.reduce((t, m) => t + num(m.total_marks), 0) / items.length);
        return (
          <div key={sem} className="bg-white rounded-2xl border border-[#F0F0F0] p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-[#1A1A1A] flex items-center gap-2">
                <GraduationCap size={14} className="text-[#F5A623]" /> Semester {sem}
              </h3>
              <span className="text-xs text-[#6B6B6B]">Average: <span className="font-bold text-[#1A1A1A]">{avg}</span></span>
            </div>
            <div className="space-y-2">
              {items.map(m => {
                const gc = GRADE_COLOR[safe(m.grade)] || ACCENT.lilac;
                return (
                  <div key={m.id} className="flex items-center gap-3 px-3 py-2 border border-[#F0F0F0] rounded-xl">
                    <BookOpen size={12} className="text-[#B8A9E8]" />
                    <span className="flex-1 text-sm text-[#1A1A1A]">{safe(m.subject)}</span>
                    <span className="text-[11px] text-[#6B6B6B]">Int {m.internal_marks} · Ext {m.external_marks}</span>
                    <span className="text-sm font-bold text-[#1A1A1A] w-10 text-right">{m.total_marks}</span>
                    <span className="text-[10px] px-2 py-0.5 rounded-full font-bold border" style={{ backgroundColor: gc + '1A', color: gc, borderColor: gc + '33' }}>{safe(m.grade)}</span>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
      {marks.length === 0 && <div className="text-center py-12 bg-white rounded-2xl border border-[#F0F0F0]"><GraduationCap size={28} className="mx-auto mb-3 text-[#E0E0E0]" /><p className="text-sm text-[#9B9B9B]">No marks yet</p></div>}
    </div>
  );
}

// =============== TIMETABLE ===============
function TimetableView({ timetable, teacherById, filterSemester, filterTeacherId }) {
  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const filtered = timetable
    .filter(t => filterSemester ? t.semester === filterSemester : true)
    .filter(t => filterTeacherId ? safe(t.teacher_id) === filterTeacherId : true);

  const periods = [...new Set(filtered.map(t => t.period))].sort((a, b) => a - b);

  return (
    <div className="space-y-5">
      <h3 className="text-sm font-semibold text-[#1A1A1A] flex items-center gap-2">
        <CalendarDays size={14} className="text-[#F5A623]" /> Weekly Timetable
        {filterSemester && <span className="text-[11px] text-[#9B9B9B] font-normal">· Sem {filterSemester}</span>}
      </h3>
      <div className="bg-white rounded-2xl border border-[#F0F0F0] overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-[#F0F0F0] bg-[#FAFAF8]">
              <th className="text-left px-4 py-3 text-[10px] font-semibold uppercase tracking-wide text-[#9B9B9B]">Day</th>
              {periods.map(p => <th key={p} className="text-left px-3 py-3 text-[10px] font-semibold uppercase tracking-wide text-[#9B9B9B]">Period {p}</th>)}
            </tr>
          </thead>
          <tbody className="divide-y divide-[#F0F0F0]">
            {days.map(day => {
              const dayClasses = filtered.filter(t => safe(t.day) === day);
              if (dayClasses.length === 0) return null;
              return (
                <tr key={day}>
                  <td className="px-4 py-3 text-xs font-semibold text-[#1A1A1A] align-top">{day}</td>
                  {periods.map(p => {
                    const cls = dayClasses.find(c => c.period === p);
                    if (!cls) return <td key={p} className="px-3 py-3 text-[10px] text-[#E0E0E0]">—</td>;
                    const teacher = teacherById[cls.teacher_id];
                    return (
                      <td key={p} className="px-3 py-3 align-top">
                        <div className="border border-[#F0F0F0] rounded-lg p-2 bg-[#FAFAF8]/50">
                          <p className="text-[11px] font-semibold text-[#1A1A1A]">{safe(cls.subject)}</p>
                          <p className="text-[10px] text-[#9B9B9B] mt-0.5">{safe(cls.start_time)}-{safe(cls.end_time)}</p>
                          <p className="text-[10px] text-[#6B6B6B] mt-0.5">{teacher ? safe(teacher.name).split(' ').slice(-1)[0] : '—'} · {safe(cls.room)}</p>
                        </div>
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
        {filtered.length === 0 && <div className="text-center py-8"><CalendarDays size={28} className="mx-auto mb-3 text-[#E0E0E0]" /><p className="text-sm text-[#9B9B9B]">No timetable entries</p></div>}
      </div>
    </div>
  );
}

// =============== LEAVES ===============
function LeavesAdmin({ leaves, studentById, onReview }) {
  const pending = leaves.filter(l => safe(l.status) === 'Pending');
  const reviewed = leaves.filter(l => safe(l.status) !== 'Pending');

  const LeaveCard = ({ l, showActions }) => {
    const student = studentById[l.student_id];
    const status = safe(l.status);
    const c = LEAVE_COLOR[status] || ACCENT.lilac;
    const tx = LEAVE_TEXT[status] || '#5B21B6';
    return (
      <div className="bg-white rounded-2xl border border-[#F0F0F0] p-5 hover:shadow-md transition-all">
        <div className="flex items-start gap-3 mb-3">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center font-semibold" style={{ backgroundColor: ACCENT.lilac + '20', color: ACCENT.lilac }}>
            {student ? safe(student.name).charAt(0) : '?'}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-[#1A1A1A]">{student ? safe(student.name) : safe(l.student_id)}</p>
            <p className="text-[11px] text-[#9B9B9B] font-mono">{student ? safe(student.roll_number) : ''}</p>
          </div>
          <span className="text-[10px] px-2.5 py-0.5 rounded-full font-semibold uppercase tracking-wide border" style={{ backgroundColor: c + '1A', color: tx, borderColor: c + '33' }}>{status}</span>
        </div>
        <p className="text-sm text-[#1A1A1A] mb-2">{safe(l.reason)}</p>
        <p className="text-[11px] text-[#6B6B6B] flex items-center gap-1.5"><Calendar size={10} className="text-[#4ECDC4]" />{safe(l.from_date)} → {safe(l.to_date)}</p>
        {safe(l.review_note) && <p className="text-[11px] text-[#6B6B6B] mt-2 pt-2 border-t border-[#F0F0F0] italic">"{safe(l.review_note)}"</p>}
        {showActions && (
          <div className="flex gap-2 mt-3 pt-3 border-t border-[#F0F0F0]">
            <button onClick={() => onReview(l.id, 'Approved')}
              className="flex-1 py-1.5 text-xs font-medium rounded-full border transition-all"
              style={{ backgroundColor: ACCENT.green + '15', color: '#166534', borderColor: ACCENT.green + '33' }}>
              ✓ Approve
            </button>
            <button onClick={() => onReview(l.id, 'Declined')}
              className="flex-1 py-1.5 text-xs font-medium rounded-full border transition-all"
              style={{ backgroundColor: ACCENT.coral + '15', color: '#DC2626', borderColor: ACCENT.coral + '33' }}>
              ✗ Decline
            </button>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {pending.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-[#1A1A1A] mb-3 flex items-center gap-2">
            <AlertCircle size={14} className="text-[#F5A623]" /> Pending Review ({pending.length})
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {pending.map(l => <LeaveCard key={l.id} l={l} showActions />)}
          </div>
        </div>
      )}
      <div>
        <h3 className="text-sm font-semibold text-[#1A1A1A] mb-3 flex items-center gap-2">
          <CalendarDays size={14} className="text-[#B8A9E8]" /> All Leave Requests ({leaves.length})
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {reviewed.map(l => <LeaveCard key={l.id} l={l} showActions={false} />)}
        </div>
        {leaves.length === 0 && <p className="text-xs text-[#9B9B9B] text-center py-8">No leave requests</p>}
      </div>
    </div>
  );
}

function StudentLeaves({ leaves, onApply, onWithdraw }) {
  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3">
        <h3 className="text-sm font-semibold text-[#1A1A1A]">My Leave Requests</h3>
        <span className="text-[11px] text-[#9B9B9B]">{leaves.length} requests</span>
        <button onClick={onApply} className="ml-auto flex items-center gap-1.5 px-4 py-2 bg-[#B8A9E8] text-[#1A1A1A] rounded-full text-sm font-medium hover:bg-[#A89AD8] shadow-sm hover:shadow-md transition-all">
          <Plus size={14} /> Apply Leave
        </button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {leaves.map(l => {
          const status = safe(l.status);
          const c = LEAVE_COLOR[status] || ACCENT.lilac;
          const tx = LEAVE_TEXT[status] || '#5B21B6';
          return (
            <div key={l.id} className="bg-white rounded-2xl border border-[#F0F0F0] p-5">
              <div className="flex items-start justify-between mb-2">
                <span className="text-[10px] px-2.5 py-0.5 rounded-full font-semibold uppercase tracking-wide border" style={{ backgroundColor: c + '1A', color: tx, borderColor: c + '33' }}>{status}</span>
                <p className="text-[10px] text-[#9B9B9B]">Applied {safe(l.applied_date)}</p>
              </div>
              <p className="text-sm text-[#1A1A1A] mb-2">{safe(l.reason)}</p>
              <p className="text-[11px] text-[#6B6B6B] flex items-center gap-1.5"><Calendar size={10} className="text-[#4ECDC4]" />{safe(l.from_date)} → {safe(l.to_date)}</p>
              {safe(l.review_note) && <p className="text-[11px] text-[#6B6B6B] mt-2 pt-2 border-t border-[#F0F0F0] italic">"{safe(l.review_note)}"</p>}
              {status === 'Pending' && (
                <button onClick={() => onWithdraw(l.id)} className="mt-3 w-full py-1.5 text-xs font-medium rounded-full border border-[#F0F0F0] text-[#6B6B6B] hover:bg-[#FAFAF8] transition-all">
                  Withdraw
                </button>
              )}
            </div>
          );
        })}
        {leaves.length === 0 && <div className="col-span-full text-center py-12 bg-white rounded-2xl border border-[#F0F0F0]"><CalendarDays size={28} className="mx-auto mb-3 text-[#E0E0E0]" /><p className="text-sm text-[#9B9B9B]">No leave requests</p></div>}
      </div>
    </div>
  );
}

// =============== NOTICES ===============
function NoticesView({ notices, canEdit, onAdd, onDelete }) {
  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3">
        <h3 className="text-sm font-semibold text-[#1A1A1A]">Notices & Announcements</h3>
        <span className="text-[11px] text-[#9B9B9B]">{notices.length} notices</span>
        {canEdit && <button onClick={onAdd} className="ml-auto flex items-center gap-1.5 px-4 py-2 bg-[#B8A9E8] text-[#1A1A1A] rounded-full text-sm font-medium hover:bg-[#A89AD8] shadow-sm hover:shadow-md transition-all">
          <Plus size={14} /> New Notice
        </button>}
      </div>
      <div className="space-y-3">
        {notices.map(n => {
          const c = PRIORITY_COLOR[safe(n.priority)] || ACCENT.lilac;
          const tx = PRIORITY_TEXT[safe(n.priority)] || '#5B21B6';
          return (
            <div key={n.id} className="bg-white rounded-2xl border border-[#F0F0F0] p-5 hover:shadow-md transition-all">
              <div className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0" style={{ backgroundColor: c + '15' }}>
                  <Bell size={14} style={{ color: c }} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start gap-2">
                    <h4 className="text-sm font-semibold text-[#1A1A1A] flex-1">{safe(n.title)}</h4>
                    <span className="text-[10px] px-2 py-0.5 rounded-full font-semibold uppercase tracking-wide border" style={{ backgroundColor: c + '1A', color: tx, borderColor: c + '33' }}>{safe(n.priority)}</span>
                  </div>
                  <p className="text-sm text-[#6B6B6B] mt-1.5">{safe(n.content)}</p>
                  <div className="flex items-center gap-3 mt-3 text-[10px] text-[#9B9B9B]">
                    <span className="flex items-center gap-1"><User size={9} className="text-[#B8A9E8]" />{safe(n.author_name)}</span>
                    <span>·</span>
                    <span className="flex items-center gap-1"><Calendar size={9} className="text-[#4ECDC4]" />{safe(n.posted_date)}</span>
                    <span>·</span>
                    <span className="flex items-center gap-1"><Users size={9} className="text-[#F5A623]" />{safe(n.target_audience)}</span>
                  </div>
                </div>
                {canEdit && <button onClick={() => onDelete(n.id)} className="text-[#9B9B9B] hover:text-[#DC2626]"><Trash2 size={13} /></button>}
              </div>
            </div>
          );
        })}
        {notices.length === 0 && <div className="text-center py-12 bg-white rounded-2xl border border-[#F0F0F0]"><Bell size={28} className="mx-auto mb-3 text-[#E0E0E0]" /><p className="text-sm text-[#9B9B9B]">No notices yet</p></div>}
      </div>
    </div>
  );
}

// =============== EVENTS ===============
function EventsView({ events, canEdit, onAdd, onDelete }) {
  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3">
        <h3 className="text-sm font-semibold text-[#1A1A1A]">Events</h3>
        <span className="text-[11px] text-[#9B9B9B]">{events.length} events</span>
        {canEdit && <button onClick={onAdd} className="ml-auto flex items-center gap-1.5 px-4 py-2 bg-[#B8A9E8] text-[#1A1A1A] rounded-full text-sm font-medium hover:bg-[#A89AD8] shadow-sm hover:shadow-md transition-all">
          <Plus size={14} /> New Event
        </button>}
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {events.map(e => {
          const c = CAT_COLOR[safe(e.category)] || ACCENT.lilac;
          return (
            <div key={e.id} className="bg-white rounded-2xl border border-[#F0F0F0] p-5 hover:-translate-y-0.5 hover:shadow-md transition-all">
              <div className="flex items-start justify-between mb-3">
                <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ backgroundColor: c + '15' }}>
                  <Calendar size={14} style={{ color: c }} />
                </div>
                <span className="text-[10px] px-2 py-0.5 rounded-full font-semibold border" style={{ backgroundColor: c + '1A', color: c, borderColor: c + '33' }}>{safe(e.category)}</span>
              </div>
              <h4 className="text-sm font-semibold text-[#1A1A1A]">{safe(e.title)}</h4>
              <p className="text-[11px] text-[#6B6B6B] mt-1 line-clamp-2">{safe(e.description)}</p>
              <div className="flex items-center gap-3 mt-3 pt-3 border-t border-[#F0F0F0] text-[10px] text-[#9B9B9B]">
                <span className="flex items-center gap-1"><Calendar size={9} className="text-[#4ECDC4]" />{safe(e.event_date)}</span>
                <span className="flex items-center gap-1"><MapPin size={9} className="text-[#F5A623]" />{safe(e.location)}</span>
              </div>
              {canEdit && <button onClick={() => onDelete(e.id)} className="mt-2 text-[#9B9B9B] hover:text-[#DC2626] float-right"><Trash2 size={12} /></button>}
            </div>
          );
        })}
        {events.length === 0 && <div className="col-span-full text-center py-12 bg-white rounded-2xl border border-[#F0F0F0]"><Calendar size={28} className="mx-auto mb-3 text-[#E0E0E0]" /><p className="text-sm text-[#9B9B9B]">No events</p></div>}
      </div>
    </div>
  );
}

// =============== ACHIEVEMENTS ===============
function AchievementsView({ achievements, studentById, canEdit, onAdd, onDelete }) {
  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3">
        <h3 className="text-sm font-semibold text-[#1A1A1A]">Student Achievements</h3>
        <span className="text-[11px] text-[#9B9B9B]">{achievements.length} achievements</span>
        {canEdit && <button onClick={onAdd} className="ml-auto flex items-center gap-1.5 px-4 py-2 bg-[#B8A9E8] text-[#1A1A1A] rounded-full text-sm font-medium hover:bg-[#A89AD8] shadow-sm hover:shadow-md transition-all">
          <Plus size={14} /> Add Achievement
        </button>}
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {achievements.map(a => {
          const student = studentById[a.student_id];
          const c = CAT_COLOR[safe(a.category)] || ACCENT.amber;
          return (
            <div key={a.id} className="bg-white rounded-2xl border border-[#F0F0F0] p-5 hover:shadow-md transition-all">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ backgroundColor: c + '15' }}>
                  <Trophy size={16} style={{ color: c }} />
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="text-sm font-semibold text-[#1A1A1A]">{safe(a.title)}</h4>
                  <p className="text-[11px] text-[#6B6B6B] mt-0.5">{safe(a.description)}</p>
                  <div className="flex items-center gap-2 mt-2">
                    <span className="text-[10px] px-2 py-0.5 rounded-full font-semibold border" style={{ backgroundColor: c + '1A', color: c, borderColor: c + '33' }}>{safe(a.category)}</span>
                    <span className="text-[10px] text-[#9B9B9B]">{student ? safe(student.name) : safe(a.student_id)}</span>
                    <span className="text-[10px] text-[#9B9B9B]">·</span>
                    <span className="text-[10px] text-[#9B9B9B]">{safe(a.date_achieved)}</span>
                  </div>
                </div>
                {safe(a.rank) && <span className="text-[10px] px-2 py-0.5 rounded-full font-bold border" style={{ backgroundColor: ACCENT.amber + '1A', color: '#92400E', borderColor: ACCENT.amber + '33' }}>{safe(a.rank)}</span>}
                {canEdit && <button onClick={() => onDelete(a.id)} className="text-[#9B9B9B] hover:text-[#DC2626]"><Trash2 size={13} /></button>}
              </div>
            </div>
          );
        })}
        {achievements.length === 0 && <div className="col-span-full text-center py-12 bg-white rounded-2xl border border-[#F0F0F0]"><Trophy size={28} className="mx-auto mb-3 text-[#E0E0E0]" /><p className="text-sm text-[#9B9B9B]">No achievements yet</p></div>}
      </div>
    </div>
  );
}

// =============== PROJECTS + GROUPS ===============
function ProjectsView({ projects, groups, projectPosts, studentById, teacherById, currentUser, role, onAddPost, onUpdateProjectStatus }) {
  const [openGroup, setOpenGroup] = useState(null);
  const [postText, setPostText] = useState('');
  const [postType, setPostType] = useState('Update');

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-sm font-semibold text-[#1A1A1A] mb-3 flex items-center gap-2">
          <Target size={14} className="text-[#4ECDC4]" /> Projects
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {projects.map(p => {
            const student = studentById[p.student_id];
            const status = safe(p.status) || 'Not Started';
            const c = PROJ_COLOR[status] || ACCENT.lilac;
            const tx = PROJ_TEXT[status] || '#5B21B6';
            return (
              <div key={p.id} className="bg-white rounded-2xl border border-[#F0F0F0] p-5">
                <div className="flex items-start justify-between mb-3">
                  <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ backgroundColor: c + '15' }}>
                    <Target size={14} style={{ color: c }} />
                  </div>
                  {onUpdateProjectStatus ? (
                    <select value={status} onChange={e => onUpdateProjectStatus(p.id, e.target.value)}
                      className="text-[10px] px-2.5 py-1 rounded-full font-semibold uppercase tracking-wide border cursor-pointer focus:outline-none"
                      style={{ backgroundColor: c + '1A', color: tx, borderColor: c + '33' }}>
                      {['Not Started', 'In Progress', 'Submitted', 'Reviewed', 'Approved'].map(s => <option key={s}>{s}</option>)}
                    </select>
                  ) : (
                    <span className="text-[10px] px-2.5 py-0.5 rounded-full font-semibold uppercase tracking-wide border" style={{ backgroundColor: c + '1A', color: tx, borderColor: c + '33' }}>{status}</span>
                  )}
                </div>
                <h4 className="text-sm font-semibold text-[#1A1A1A]">{safe(p.title)}</h4>
                <p className="text-[11px] text-[#6B6B6B] mt-1 line-clamp-2">{safe(p.description)}</p>
                <div className="text-[10px] text-[#9B9B9B] mt-3 flex items-center gap-2">
                  <User size={9} className="text-[#B8A9E8]" />
                  <span>{student ? safe(student.name) : safe(p.student_id)}</span>
                  <span>·</span>
                  <span>Sem {p.semester}</span>
                  {num(p.score) > 0 && <><span>·</span><span className="font-semibold text-[#1A1A1A]">Score: {p.score}</span></>}
                </div>
                {safe(p.feedback) && <p className="text-[11px] text-[#6B6B6B] mt-2 pt-2 border-t border-[#F0F0F0] italic">"{safe(p.feedback)}"</p>}
              </div>
            );
          })}
          {projects.length === 0 && <div className="col-span-full text-center py-8 bg-white rounded-2xl border border-[#F0F0F0]"><Target size={28} className="mx-auto mb-3 text-[#E0E0E0]" /><p className="text-sm text-[#9B9B9B]">No projects</p></div>}
        </div>
      </div>

      <div>
        <h3 className="text-sm font-semibold text-[#1A1A1A] mb-3 flex items-center gap-2">
          <Users size={14} className="text-[#B8A9E8]" /> Project Groups
        </h3>
        <div className="space-y-3">
          {groups.map(g => {
            const members = safe(g.members).split(',').map(id => studentById[id.trim()]).filter(Boolean);
            const mentor = teacherById[g.mentor_id];
            const posts = projectPosts.filter(p => p.group_id === g.id).sort((a, b) => safe(b.posted_at).localeCompare(safe(a.posted_at)));
            const isOpen = openGroup === g.id;
            return (
              <div key={g.id} className="bg-white rounded-2xl border border-[#F0F0F0] overflow-hidden">
                <button onClick={() => { setOpenGroup(isOpen ? null : g.id); setPostText(''); }}
                  className="w-full text-left p-5 hover:bg-[#FAFAF8] transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: ACCENT.lilac + '15' }}>
                      <Users size={16} style={{ color: ACCENT.lilac }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="text-sm font-semibold text-[#1A1A1A]">{safe(g.name)}</h4>
                      <p className="text-[11px] text-[#6B6B6B] mt-0.5">{safe(g.description)}</p>
                      <div className="flex items-center gap-3 mt-1.5 text-[10px] text-[#9B9B9B]">
                        <span>{members.length} members</span>
                        <span>·</span>
                        <span>Mentor: {mentor ? safe(mentor.name) : '—'}</span>
                        <span>·</span>
                        <span>{posts.length} posts</span>
                      </div>
                    </div>
                    <ChevronRight size={16} className={`text-[#9B9B9B] transition-transform duration-200 ${isOpen ? 'rotate-90' : ''}`} />
                  </div>
                </button>
                {isOpen && (
                  <div className="border-t border-[#F0F0F0] p-5 space-y-3 bg-[#FAFAF8]/40">
                    <div className="flex flex-wrap items-center gap-2 text-[11px] text-[#6B6B6B]">
                      <span className="font-semibold">Members:</span>
                      {members.map(m => (
                        <span key={m.id} className="px-2 py-0.5 rounded-full bg-white border border-[#F0F0F0]">{safe(m.name)}</span>
                      ))}
                    </div>
                    {posts.length > 0 ? (
                      <div className="space-y-2">
                        {posts.map(p => {
                          const roleColor = p.author_role === 'teacher' ? ACCENT.amber : p.author_role === 'admin' ? ACCENT.coral : ACCENT.lilac;
                          return (
                            <div key={p.id} className="bg-white rounded-xl border border-[#F0F0F0] p-3">
                              <div className="flex items-center gap-2 mb-1">
                                <div className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-semibold" style={{ backgroundColor: roleColor + '20', color: roleColor }}>
                                  {safe(p.author_name).charAt(0)}
                                </div>
                                <span className="text-xs font-semibold text-[#1A1A1A]">{safe(p.author_name)}</span>
                                <span className="text-[9px] px-1.5 py-0.5 rounded-full font-semibold border" style={{ backgroundColor: roleColor + '15', color: roleColor, borderColor: roleColor + '33' }}>{safe(p.post_type)}</span>
                                <span className="text-[10px] text-[#9B9B9B] ml-auto">{safe(p.posted_at)}</span>
                              </div>
                              <p className="text-sm text-[#1A1A1A]">{safe(p.content)}</p>
                            </div>
                          );
                        })}
                      </div>
                    ) : <p className="text-xs text-[#9B9B9B] text-center py-2">No posts yet</p>}
                    <div className="flex gap-2 pt-2">
                      <select value={postType} onChange={e => setPostType(e.target.value)}
                        className="text-xs border border-[#F0F0F0] rounded-full px-3 py-2 bg-white focus:outline-none">
                        <option value="Update">Update</option>
                        <option value="Milestone">Milestone</option>
                        <option value="Question">Question</option>
                        {(role === 'teacher' || role === 'admin') && <option value="Feedback">Feedback</option>}
                      </select>
                      <input value={postText} onChange={e => setPostText(e.target.value)}
                        placeholder="Write a post…"
                        className="flex-1 text-sm border border-[#F0F0F0] rounded-full px-4 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-[#1A1A1A]/5" />
                      <button onClick={async () => { if (postText.trim()) { await onAddPost(g.id, postText, postType); setPostText(''); } }}
                        disabled={!postText.trim()}
                        className="px-4 py-2 bg-[#B8A9E8] text-[#1A1A1A] rounded-full text-xs font-medium hover:bg-[#A89AD8] disabled:opacity-50 transition-all">
                        <Send size={12} />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
          {groups.length === 0 && <div className="text-center py-8 bg-white rounded-2xl border border-[#F0F0F0]"><Users size={28} className="mx-auto mb-3 text-[#E0E0E0]" /><p className="text-sm text-[#9B9B9B]">No project groups yet</p></div>}
        </div>
      </div>
    </div>
  );
}

// =============== CHAT ===============
function ChatView({ chats, currentUser, role, semester, onSend }) {
  const [text, setText] = useState('');
  const sorted = [...chats].sort((a, b) => safe(a.sent_at).localeCompare(safe(b.sent_at)));

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <h3 className="text-sm font-semibold text-[#1A1A1A] flex items-center gap-2">
          <MessageSquare size={14} className="text-[#4ECDC4]" /> Batch Chat · Sem {semester}
        </h3>
        <span className="text-[11px] text-[#9B9B9B]">{sorted.length} messages</span>
      </div>
      <div className="bg-white rounded-2xl border border-[#F0F0F0] overflow-hidden flex flex-col" style={{ height: '60vh' }}>
        <div className="flex-1 overflow-y-auto p-5 space-y-3">
          {sorted.map(m => {
            const isMe = m.sender_id === currentUser.id;
            const roleColor = m.sender_role === 'teacher' ? ACCENT.amber : m.sender_role === 'admin' ? ACCENT.coral : ACCENT.lilac;
            return (
              <div key={m.id} className={`flex gap-2.5 ${isMe ? 'flex-row-reverse' : ''}`}>
                <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold shrink-0" style={{ backgroundColor: roleColor + '20', color: roleColor }}>
                  {safe(m.sender_name).charAt(0)}
                </div>
                <div className={`max-w-[70%] ${isMe ? 'items-end' : 'items-start'} flex flex-col`}>
                  <div className="flex items-center gap-1.5 mb-0.5 text-[10px] text-[#9B9B9B]">
                    <span className="font-semibold text-[#1A1A1A]">{isMe ? 'You' : safe(m.sender_name)}</span>
                    <span className="capitalize" style={{ color: roleColor }}>· {safe(m.sender_role)}</span>
                    <span>· {safe(m.sent_at).slice(11, 16)}</span>
                  </div>
                  <div className={`px-3.5 py-2 rounded-2xl text-sm ${isMe ? 'bg-[#B8A9E8] text-[#1A1A1A]' : 'bg-[#F0F0F0] text-[#1A1A1A]'}`}>
                    {safe(m.message)}
                  </div>
                </div>
              </div>
            );
          })}
          {sorted.length === 0 && (
            <div className="text-center py-12">
              <MessageSquare size={28} className="mx-auto mb-3 text-[#E0E0E0]" />
              <p className="text-sm text-[#9B9B9B]">No messages yet — start the conversation!</p>
            </div>
          )}
        </div>
        <div className="border-t border-[#F0F0F0] p-3 flex gap-2 bg-white">
          <input value={text} onChange={e => setText(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter' && text.trim()) { onSend(text); setText(''); } }}
            placeholder="Type a message…"
            className="flex-1 text-sm border border-[#F0F0F0] rounded-full px-4 py-2.5 bg-[#FAFAF8] focus:outline-none focus:ring-2 focus:ring-[#1A1A1A]/5" />
          <button onClick={() => { if (text.trim()) { onSend(text); setText(''); } }}
            disabled={!text.trim()}
            className="px-4 py-2.5 bg-[#B8A9E8] text-[#1A1A1A] rounded-full text-sm font-medium hover:bg-[#A89AD8] disabled:opacity-50 transition-all flex items-center gap-1.5">
            <Send size={13} /> Send
          </button>
        </div>
      </div>
    </div>
  );
}

// =============== MODALS ===============
function ModalShell({ title, onClose, children }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#1A1A1A]/40 backdrop-blur-sm p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl border border-[#F0F0F0] w-full max-w-lg max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        <div className="sticky top-0 bg-white flex items-center justify-between px-6 py-4 border-b border-[#F0F0F0]">
          <h3 className="text-sm font-semibold text-[#1A1A1A]">{title}</h3>
          <button onClick={onClose} className="text-[#9B9B9B] hover:text-[#1A1A1A]"><X size={16} /></button>
        </div>
        <div className="p-6 space-y-4">{children}</div>
      </div>
    </div>
  );
}
function Field({ label, children }) {
  return (
    <div>
      <label className="block text-[11px] font-medium text-[#6B6B6B] mb-1.5">{label}</label>
      {children}
    </div>
  );
}
const inputCls = "w-full px-3.5 py-2 text-sm border border-[#F0F0F0] rounded-lg bg-white text-[#1A1A1A] placeholder:text-[#9B9B9B] focus:outline-none focus:ring-2 focus:ring-[#1A1A1A]/5";

function AddStudentModal({ onClose, onSave }) {
  const [f, setF] = useState({ name: '', roll_number: '', semester: 1, department: 'Electronics', email: '', phone: '', enrollment_year: new Date().getFullYear() });
  const set = (k, v) => setF(p => ({ ...p, [k]: v }));
  return (
    <ModalShell title="Add Student" onClose={onClose}>
      <Field label="Full Name"><input className={inputCls} value={f.name} onChange={e => set('name', e.target.value)} /></Field>
      <Field label="Roll Number"><input className={inputCls} value={f.roll_number} onChange={e => set('roll_number', e.target.value)} /></Field>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Semester"><input type="number" min="1" max="8" className={inputCls} value={f.semester} onChange={e => set('semester', e.target.value)} /></Field>
        <Field label="Department"><select className={inputCls} value={f.department} onChange={e => set('department', e.target.value)} border-none>
          {['Computer Science', 'Electronics', 'Mechanical', 'Civil', 'Electrical', 'Other'].map(d => <option key={d}>{d}</option>)}
        </select></Field>
      </div>
      <Field label="Email"><input className={inputCls} value={f.email} onChange={e => set('email', e.target.value)} /></Field>
      <Field label="Phone"><input className={inputCls} value={f.phone} onChange={e => set('phone', e.target.value)} /></Field>
      <Field label="Enrollment Year"><input type="number" className={inputCls} value={f.enrollment_year} onChange={e => set('enrollment_year', e.target.value)} /></Field>
      <div className="flex justify-end gap-2 pt-2">
        <button onClick={onClose} className="px-4 py-2 text-sm text-[#6B6B6B]">Cancel</button>
        <button onClick={() => onSave(f)} disabled={!f.name || !f.roll_number}
          className="px-4 py-2 bg-[#B8A9E8] text-[#1A1A1A] rounded-full text-sm font-medium hover:bg-[#A89AD8] disabled:opacity-50 shadow-sm">Save</button>
      </div>
    </ModalShell>
  );
}

function AddTeacherModal({ onClose, onSave }) {
  const [f, setF] = useState({ name: '', employee_id: '', department: 'Electronics', email: '', phone: '', subjects: '', designation: 'Assistant Professor' });
  const set = (k, v) => setF(p => ({ ...p, [k]: v }));
  return (
    <ModalShell title="Add Teacher" onClose={onClose}>
      <Field label="Full Name"><input className={inputCls} value={f.name} onChange={e => set('name', e.target.value)} /></Field>
      <Field label="Employee ID"><input className={inputCls} value={f.employee_id} onChange={e => set('employee_id', e.target.value)} /></Field>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Department"><input className={inputCls} value={f.department} onChange={e => set('department', e.target.value)} /></Field>
        <Field label="Designation"><select className={inputCls} value={f.designation} onChange={e => set('designation', e.target.value)}>
          {['Professor', 'Associate Professor', 'Assistant Professor', 'Lecturer', 'HOD'].map(d => <option key={d}>{d}</option>)}
        </select></Field>
      </div>
      <Field label="Email"><input className={inputCls} value={f.email} onChange={e => set('email', e.target.value)} /></Field>
      <Field label="Phone"><input className={inputCls} value={f.phone} onChange={e => set('phone', e.target.value)} /></Field>
      <Field label="Subjects (comma-separated)"><input className={inputCls} value={f.subjects} onChange={e => set('subjects', e.target.value)} /></Field>
      <div className="flex justify-end gap-2 pt-2">
        <button onClick={onClose} className="px-4 py-2 text-sm text-[#6B6B6B]">Cancel</button>
        <button onClick={() => onSave(f)} disabled={!f.name || !f.employee_id}
          className="px-4 py-2 bg-[#B8A9E8] text-[#1A1A1A] rounded-full text-sm font-medium hover:bg-[#A89AD8] disabled:opacity-50 shadow-sm">Save</button>
      </div>
    </ModalShell>
  );
}

function AddAttendanceModal({ students, onClose, onSave }) {
  const [f, setF] = useState({ student_id: students[0]?.id || '', date: new Date().toISOString().slice(0, 10), status: 'Present', subject: '', semester: 1 });
  const set = (k, v) => setF(p => ({ ...p, [k]: v }));
  return (
    <ModalShell title="Mark Attendance" onClose={onClose}>
      <Field label="Student"><select className={inputCls} value={f.student_id} onChange={e => set('student_id', e.target.value)}>
        {students.map(s => <option key={s.id} value={s.id}>{s.name} ({s.roll_number})</option>)}
      </select></Field>
      <Field label="Date"><input type="date" className={inputCls} value={f.date} onChange={e => set('date', e.target.value)} /></Field>
      <Field label="Status"><select className={inputCls} value={f.status} onChange={e => set('status', e.target.value)}>
        {['Present', 'Absent', 'Late', 'Excused'].map(s => <option key={s}>{s}</option>)}
      </select></Field>
      <Field label="Subject"><input className={inputCls} value={f.subject} onChange={e => set('subject', e.target.value)} /></Field>
      <Field label="Semester"><input type="number" className={inputCls} value={f.semester} onChange={e => set('semester', e.target.value)} /></Field>
      <div className="flex justify-end gap-2 pt-2">
        <button onClick={onClose} className="px-4 py-2 text-sm text-[#6B6B6B]">Cancel</button>
        <button onClick={() => onSave(f)} disabled={!f.student_id}
          className="px-4 py-2 bg-[#B8A9E8] text-[#1A1A1A] rounded-full text-sm font-medium hover:bg-[#A89AD8] disabled:opacity-50 shadow-sm">Save</button>
      </div>
    </ModalShell>
  );
}

function AddMarkModal({ students, onClose, onSave }) {
  const [f, setF] = useState({ student_id: students[0]?.id || '', subject: '', semester: 1, internal_marks: 0, external_marks: 0 });
  const set = (k, v) => setF(p => ({ ...p, [k]: v }));
  return (
    <ModalShell title="Add Marks" onClose={onClose}>
      <Field label="Student"><select className={inputCls} value={f.student_id} onChange={e => set('student_id', e.target.value)}>
        {students.map(s => <option key={s.id} value={s.id}>{s.name} ({s.roll_number})</option>)}
      </select></Field>
      <Field label="Subject"><input className={inputCls} value={f.subject} onChange={e => set('subject', e.target.value)} /></Field>
      <Field label="Semester"><input type="number" className={inputCls} value={f.semester} onChange={e => set('semester', e.target.value)} /></Field>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Internal (0-50)"><input type="number" className={inputCls} value={f.internal_marks} onChange={e => set('internal_marks', e.target.value)} /></Field>
        <Field label="External (0-50)"><input type="number" className={inputCls} value={f.external_marks} onChange={e => set('external_marks', e.target.value)} /></Field>
      </div>
      <div className="flex justify-end gap-2 pt-2">
        <button onClick={onClose} className="px-4 py-2 text-sm text-[#6B6B6B]">Cancel</button>
        <button onClick={() => onSave(f)} disabled={!f.student_id || !f.subject}
          className="px-4 py-2 bg-[#B8A9E8] text-[#1A1A1A] rounded-full text-sm font-medium hover:bg-[#A89AD8] disabled:opacity-50 shadow-sm">Save</button>
      </div>
    </ModalShell>
  );
}

function AddNoticeModal({ onClose, onSave, authorName, authorId }) {
  const [f, setF] = useState({ title: '', content: '', priority: 'Normal', posted_date: new Date().toISOString().slice(0, 10), target_audience: 'All', author_id: authorId, author_name: authorName });
  const set = (k, v) => setF(p => ({ ...p, [k]: v }));
  return (
    <ModalShell title="New Notice" onClose={onClose}>
      <Field label="Title"><input className={inputCls} value={f.title} onChange={e => set('title', e.target.value)} /></Field>
      <Field label="Content"><textarea className={inputCls + ' h-24 resize-none'} value={f.content} onChange={e => set('content', e.target.value)} /></Field>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Priority"><select className={inputCls} value={f.priority} onChange={e => set('priority', e.target.value)}>
          {['Low', 'Normal', 'High', 'Urgent'].map(p => <option key={p}>{p}</option>)}
        </select></Field>
        <Field label="Target Audience"><select className={inputCls} value={f.target_audience} onChange={e => set('target_audience', e.target.value)}>
          {['All', 'Students', 'Teachers', 'Semester 3', 'Semester 4'].map(t => <option key={t}>{t}</option>)}
        </select></Field>
      </div>
      <div className="flex justify-end gap-2 pt-2">
        <button onClick={onClose} className="px-4 py-2 text-sm text-[#6B6B6B]">Cancel</button>
        <button onClick={() => onSave(f)} disabled={!f.title || !f.content}
          className="px-4 py-2 bg-[#B8A9E8] text-[#1A1A1A] rounded-full text-sm font-medium hover:bg-[#A89AD8] disabled:opacity-50 shadow-sm">Post</button>
      </div>
    </ModalShell>
  );
}

function AddEventModal({ onClose, onSave }) {
  const [f, setF] = useState({ title: '', description: '', event_date: new Date().toISOString().slice(0, 10), location: '', category: 'Academic', organizer: '' });
  const set = (k, v) => setF(p => ({ ...p, [k]: v }));
  return (
    <ModalShell title="New Event" onClose={onClose}>
      <Field label="Title"><input className={inputCls} value={f.title} onChange={e => set('title', e.target.value)} /></Field>
      <Field label="Description"><textarea className={inputCls + ' h-20 resize-none'} value={f.description} onChange={e => set('description', e.target.value)} /></Field>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Date"><input type="date" className={inputCls} value={f.event_date} onChange={e => set('event_date', e.target.value)} /></Field>
        <Field label="Category"><select className={inputCls} value={f.category} onChange={e => set('category', e.target.value)}>
          {['Academic', 'Cultural', 'Sports', 'Workshop', 'Seminar', 'Competition'].map(c => <option key={c}>{c}</option>)}
        </select></Field>
      </div>
      <Field label="Location"><input className={inputCls} value={f.location} onChange={e => set('location', e.target.value)} /></Field>
      <Field label="Organizer"><input className={inputCls} value={f.organizer} onChange={e => set('organizer', e.target.value)} /></Field>
      <div className="flex justify-end gap-2 pt-2">
        <button onClick={onClose} className="px-4 py-2 text-sm text-[#6B6B6B]">Cancel</button>
        <button onClick={() => onSave(f)} disabled={!f.title}
          className="px-4 py-2 bg-[#B8A9E8] text-[#1A1A1A] rounded-full text-sm font-medium hover:bg-[#A89AD8] disabled:opacity-50 shadow-sm">Save</button>
      </div>
    </ModalShell>
  );
}

function AddAchievementModal({ students, onClose, onSave }) {
  const [f, setF] = useState({ student_id: students[0]?.id || '', title: '', description: '', category: 'Academic', date_achieved: new Date().toISOString().slice(0, 10), rank: '' });
  const set = (k, v) => setF(p => ({ ...p, [k]: v }));
  return (
    <ModalShell title="Add Achievement" onClose={onClose}>
      <Field label="Student"><select className={inputCls} value={f.student_id} onChange={e => set('student_id', e.target.value)}>
        {students.map(s => <option key={s.id} value={s.id}>{s.name} ({s.roll_number})</option>)}
      </select></Field>
      <Field label="Title"><input className={inputCls} value={f.title} onChange={e => set('title', e.target.value)} /></Field>
      <Field label="Description"><textarea className={inputCls + ' h-20 resize-none'} value={f.description} onChange={e => set('description', e.target.value)} /></Field>
      <div className="grid grid-cols-3 gap-3">
        <Field label="Category"><select className={inputCls} value={f.category} onChange={e => set('category', e.target.value)}>
          {['Academic', 'Sports', 'Cultural', 'Technical', 'Research', 'Other'].map(c => <option key={c}>{c}</option>)}
        </select></Field>
        <Field label="Date"><input type="date" className={inputCls} value={f.date_achieved} onChange={e => set('date_achieved', e.target.value)} /></Field>
        <Field label="Rank"><input className={inputCls} value={f.rank} onChange={e => set('rank', e.target.value)} placeholder="1st, 2nd..." /></Field>
      </div>
      <div className="flex justify-end gap-2 pt-2">
        <button onClick={onClose} className="px-4 py-2 text-sm text-[#6B6B6B]">Cancel</button>
        <button onClick={() => onSave(f)} disabled={!f.title || !f.student_id}
          className="px-4 py-2 bg-[#B8A9E8] text-[#1A1A1A] rounded-full text-sm font-medium hover:bg-[#A89AD8] disabled:opacity-50 shadow-sm">Save</button>
      </div>
    </ModalShell>
  );
}

function ApplyLeaveModal({ studentId, onClose, onSave }) {
  const today = new Date().toISOString().slice(0, 10);
  const [f, setF] = useState({ student_id: studentId, reason: '', from_date: today, to_date: today });
  const set = (k, v) => setF(p => ({ ...p, [k]: v }));
  return (
    <ModalShell title="Apply for Leave" onClose={onClose}>
      <Field label="Reason"><textarea className={inputCls + ' h-24 resize-none'} value={f.reason} onChange={e => set('reason', e.target.value)} placeholder="Explain the reason for your leave…" /></Field>
      <div className="grid grid-cols-2 gap-3">
        <Field label="From Date"><input type="date" className={inputCls} value={f.from_date} onChange={e => set('from_date', e.target.value)} /></Field>
        <Field label="To Date"><input type="date" className={inputCls} value={f.to_date} onChange={e => set('to_date', e.target.value)} /></Field>
      </div>
      <div className="flex justify-end gap-2 pt-2">
        <button onClick={onClose} className="px-4 py-2 text-sm text-[#6B6B6B]">Cancel</button>
        <button onClick={() => onSave(f)} disabled={!f.reason}
          className="px-4 py-2 bg-[#B8A9E8] text-[#1A1A1A] rounded-full text-sm font-medium hover:bg-[#A89AD8] disabled:opacity-50 shadow-sm">Submit</button>
      </div>
    </ModalShell>
  );
}

function StudentDetailModal({ student, onClose, marks, attendance, projects }) {
  const attPresent = attendance.filter(a => safe(a.status) === 'Present').length;
  const attPct = attendance.length ? Math.round((attPresent / attendance.length) * 100) : 0;
  const avgMark = marks.length ? Math.round(marks.reduce((sum, m) => sum + num(m.total_marks), 0) / marks.length) : 0;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#1A1A1A]/40 backdrop-blur-sm p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl border border-[#F0F0F0] w-full max-w-2xl max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        <div className="sticky top-0 bg-white/95 backdrop-blur-xl flex items-center justify-between px-6 py-4 border-b border-[#F0F0F0]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center font-bold" style={{ backgroundColor: ACCENT.lilac + '20', color: ACCENT.lilac }}>
              {safe(student.name).charAt(0)}
            </div>
            <div>
              <h3 className="text-sm font-semibold text-[#1A1A1A]">{safe(student.name)}</h3>
              <p className="text-[11px] text-[#9B9B9B] font-mono">{safe(student.roll_number)} · {safe(student.department)} · Sem {student.semester}</p>
            </div>
          </div>
          <button onClick={onClose} className="text-[#9B9B9B]"><X size={16} /></button>
        </div>
        <div className="p-6 space-y-5">
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-white border border-[#F0F0F0] rounded-xl p-3"><p className="text-[10px] text-[#9B9B9B]">Attendance</p><p className="text-lg font-bold text-[#1A1A1A]">{attPct}%</p></div>
            <div className="bg-white border border-[#F0F0F0] rounded-xl p-3"><p className="text-[10px] text-[#9B9B9B]">Avg Mark</p><p className="text-lg font-bold text-[#1A1A1A]">{avgMark || '—'}</p></div>
            <div className="bg-white border border-[#F0F0F0] rounded-xl p-3"><p className="text-[10px] text-[#9B9B9B]">Projects</p><p className="text-lg font-bold text-[#1A1A1A]">{projects.length}</p></div>
          </div>
          {marks.length > 0 && (
            <div>
              <h4 className="text-xs font-semibold text-[#1A1A1A] mb-2 flex items-center gap-1.5"><GraduationCap size={12} className="text-[#F5A623]" /> Marks</h4>
              <div className="border border-[#F0F0F0] rounded-xl divide-y divide-[#F0F0F0]">
                {marks.map(m => {
                  const gc = GRADE_COLOR[safe(m.grade)] || ACCENT.lilac;
                  return (
                    <div key={m.id} className="flex items-center gap-3 px-3 py-2 text-sm">
                      <BookOpen size={12} className="text-[#B8A9E8]" />
                      <span className="flex-1 truncate">{safe(m.subject)}</span>
                      <span className="text-[#6B6B6B]">{m.total_marks}</span>
                      <span className="text-[10px] px-2 py-0.5 rounded-full font-bold border" style={{ backgroundColor: gc + '1A', color: gc, borderColor: gc + '33' }}>{safe(m.grade)}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
