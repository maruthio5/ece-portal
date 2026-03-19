# ⚡ ECE Student Portal
### GPT Chintamani Government Polytechnic — Electronics & Communication Engineering

A production-ready, mobile-first multi-role educational portal built on a **100% free stack**.

---

## 🚀 Free Stack

| Layer | Technology | Free Tier |
|-------|-----------|-----------|
| Frontend | Vanilla HTML + CSS + ES Modules | — |
| Hosting | [Vercel](https://vercel.com) | 100GB bandwidth, unlimited deploys |
| Database | [Supabase](https://supabase.com) PostgreSQL | 500MB, 50K MAU |
| Auth | Supabase Auth | 50,000 MAU |
| Storage | Supabase Storage | 1GB |
| Realtime | Supabase Realtime | 2M messages/month |
| Email | [Resend](https://resend.com) | 3,000 emails/month |

---

## 🎭 Roles & Features

### 👤 Admin
- Dashboard with live stats
- Manage students & teachers (create, delete)
- Approve / decline leave requests
- Manage notices, events, achievements, timetable, marks, attendance

### 👩‍🏫 Teacher
- Dashboard with today's schedule
- Generate QR codes for attendance (15 min expiry, countdown timer)
- Take manual attendance by batch
- Enter marks per subject (GENERATED columns handled safely)
- View & edit timetable
- Batch chat with realtime messages
- Manage project groups & post feedback

### 👨‍🎓 Student
- Dashboard with attendance % ring and average marks
- Scan QR code for attendance (validates batch, expiry)
- View attendance per subject with progress bars
- View marks table with totals (from GENERATED columns)
- Apply, track & withdraw leave requests
- Batch chat with media support (5h expiry)
- View & post project group updates (realtime)

---

## ⚙️ Setup in 10 Steps

### 1. Create Supabase Project
1. Go to [supabase.com](https://supabase.com) → New Project
2. Note your **Project URL** and **anon key** from Settings → API

### 2. Run Database Schema
In Supabase Dashboard → SQL Editor, run files **in this order**:
```sql
-- Step 1
supabase/schema.sql

-- Step 2
supabase/functions.sql

-- Step 3
supabase/rls.sql
```

### 3. Create Demo Users
In Supabase Dashboard → Authentication → Users → Add user:
- `admin@gpce.edu` / `admin123`
- `teacher@gpce.edu` / `teacher123`
- `student@gpce.edu` / `student123`
- `priya@gpce.edu` / `student123`
- `amit@gpce.edu` / `student123`

Then run in SQL Editor:
```sql
supabase/seed.sql
```

### 4. Setup Storage Buckets
In Supabase Dashboard → Storage → New bucket:
| Bucket Name | Public |
|-------------|--------|
| `chat-media` | ✅ Yes |
| `post-media` | ✅ Yes |
| `avatars`    | ✅ Yes |

### 5. Configure Frontend
Edit `index.html` — replace the placeholder values:
```html
<script>
  window.__ENV__ = {
    SUPABASE_URL: 'https://YOUR_PROJECT_REF.supabase.co',
    SUPABASE_KEY: 'YOUR_ANON_KEY'
  }
</script>
```

### 6. Deploy Edge Functions
```bash
# Install Supabase CLI
npm install -g supabase

# Login
supabase login

# Link to your project
supabase link --project-ref YOUR_PROJECT_REF

# Deploy all functions
supabase functions deploy create-user
supabase functions deploy delete-user
supabase functions deploy expire-media
supabase functions deploy send-notification-email

# Set secrets for edge functions
supabase secrets set RESEND_API_KEY=re_xxxx
```

### 7. Configure Media Expiry Cron
Create `supabase/config.toml` (or add to existing):
```toml
[functions.expire-media]
schedule = "0 * * * *"
```
Or set it in Supabase Dashboard → Edge Functions → expire-media → Schedule.

### 8. Deploy to Vercel
```bash
# Option A: Vercel CLI
npm install -g vercel
vercel deploy

# Option B: Connect GitHub repo in Vercel dashboard
# No build command needed — static files served directly
```

### 9. Login
| Role | Email | Password |
|------|-------|----------|
| Admin | admin@gpce.edu | admin123 |
| Teacher | teacher@gpce.edu | teacher123 |
| Student | student@gpce.edu | student123 |

---

## 🏗️ Project Structure

```
ece-portal/
├── index.html                     ← Single page app shell + router boot
├── assets/
│   ├── css/
│   │   └── main.css               ← Complete stylesheet (dark/light themes)
│   └── js/
│       ├── supabase.js            ← Supabase client + uploadFile helper
│       ├── auth.js                ← Login, logout, session guard
│       ├── router.js              ← Hash-based router with role guards
│       ├── db.js                  ← Data access layer (all queries)
│       ├── realtime.js            ← Supabase Realtime subscriptions
│       ├── toast.js               ← Toast notification system
│       ├── theme.js               ← Dark/light theme toggle
│       ├── pages/
│       │   ├── login.js
│       │   ├── admin/
│       │   │   ├── dashboard.js
│       │   │   └── admin-pages.js ← Students, teachers, leave, notices, events, achievements
│       │   ├── teacher/
│       │   │   ├── dashboard.js
│       │   │   ├── attendance.js
│       │   │   ├── marks-entry.js
│       │   │   ├── timetable.js
│       │   │   ├── chat.js
│       │   │   ├── projects.js
│       │   │   └── qr-generate.js
│       │   └── student/
│       │       ├── dashboard.js
│       │       ├── attendance.js
│       │       ├── marks.js
│       │       ├── timetable.js
│       │       ├── leave.js
│       │       ├── chat.js
│       │       ├── projects.js
│       │       └── qr-scan.js
│       └── shared/
│           └── shell.js           ← App shell renderer (header, nav, modals)
├── supabase/
│   ├── schema.sql
│   ├── functions.sql
│   ├── rls.sql
│   ├── seed.sql
│   └── functions/
│       ├── create-user/index.ts
│       ├── delete-user/index.ts
│       ├── expire-media/index.ts
│       └── send-notification-email/index.ts
├── vercel.json
├── .env.example
├── .gitignore
└── README.md
```

---

## 🔐 Security Notes

- ✅ All DB access via RLS — never bypassed
- ✅ Service role key only in Edge Functions (never frontend)
- ✅ QR codes include expiry timestamp — validated on scan
- ✅ File uploads validated (size + type) before storage
- ✅ `marks.total` and `marks.percentage` are GENERATED columns — never sent in INSERT/UPDATE payloads
- ✅ Attendance upsert uses `ON CONFLICT (student_id, subject, date)`
- ✅ `message_reads` uses `ON CONFLICT (message_id, user_id)`
- ✅ Realtime channels unsubscribed on page navigation (no memory leaks)
- ✅ Batch mark-read operations (not per-message)

---

## 🐛 Common Fixes

### RLS blocking student attendance insert (QR scan)
The `rls.sql` already contains the correct policy:
```sql
CREATE POLICY "Student inserts own attendance"
  ON attendance FOR INSERT WITH CHECK (
    student_id = auth.uid() OR current_role_name() IN ('teacher','admin')
  );
```

### Marks upsert failing on GENERATED columns
`db.js` strips `total` and `percentage` before every INSERT/UPDATE:
```js
const { total, percentage, ...safeRecord } = record
await supabase.from('marks').upsert(safeRecord, ...)
```

### Realtime not working
Ensure Realtime is enabled in Supabase Dashboard → Database → Replication for tables: `messages`, `notifications`, `leave_requests`, `project_posts`.

### Avatar upload failing
Ensure the `avatars` bucket exists and is set to **Public** in Supabase Storage.

---

## 📊 Free Tier Limits

| Service | Limit |
|---------|-------|
| Supabase DB | 500MB storage |
| Supabase Auth | 50,000 MAU |
| Supabase Storage | 1GB |
| Supabase Realtime | 2M messages/month |
| Supabase Edge Functions | 500K invocations/month |
| Vercel | 100GB bandwidth, unlimited deployments |
| Resend | 3,000 emails/month, 100/day |

---

## 📱 Mobile Features

- `height: 100dvh` (iOS Safari safe)
- `env(safe-area-inset-*)` for notch/home indicator
- `-webkit-tap-highlight-color: transparent`
- Touch-friendly tap targets (min 40px)
- Smooth sheet animations with spring easing
- Bottom navigation with "More" overflow sheet
- QR camera uses `facingMode: 'environment'` (rear camera)

