// assets/js/pages/login.js
import { login } from '../auth.js'
import { showToast } from '../toast.js'

export function renderLogin() {
  const app = document.getElementById('app')
  app.innerHTML = `
    <div class="login-screen" id="loginScreen">
      <div class="login-brand">
        <div class="login-logo">âš¡</div>
        <h1 class="login-title">ECE Portal</h1>
        <p class="login-sub">GPT Chintamani Government Polytechnic</p>
        <p class="login-dept">Electronics & Communication Engineering</p>
      </div>
      <div class="login-form-wrap">
        <h2 class="login-form-title">Sign In</h2>
        <form id="loginForm" class="login-form" onsubmit="return false">
          <div class="field-group">
            <label>Email</label>
            <input type="email" id="loginEmail" placeholder="you@gpce.edu" autocomplete="email" required />
          </div>
          <div class="field-group">
            <label>Password</label>
            <div class="pw-wrap">
              <input type="password" id="loginPassword" placeholder="â€¢â€¢â€¢â€¢â€¢â€¢â€¢â€¢" autocomplete="current-password" required />
              <button type="button" class="pw-toggle" id="pwToggle">ðŸ‘</button>
            </div>
          </div>
          <button type="submit" class="btn-primary login-btn" id="loginBtn">
            <span id="loginBtnText">Sign In</span>
          </button>
        </form>
        <div class="login-demo">
          <p>Demo credentials:</p>
          <div class="demo-pills">
            <button class="demo-pill" data-email="admin@gpce.edu" data-pw="admin123">Admin</button>
            <button class="demo-pill" data-email="teacher@gpce.edu" data-pw="teacher123">Teacher</button>
            <button class="demo-pill" data-email="student@gpce.edu" data-pw="student123">Student</button>
          </div>
        </div>
      </div>
    </div>
  `

  // Form submit
  document.getElementById('loginForm').addEventListener('submit', handleLogin)

  // Password toggle
  document.getElementById('pwToggle').addEventListener('click', () => {
    const pw = document.getElementById('loginPassword')
    pw.type = pw.type === 'password' ? 'text' : 'password'
  })

  // Demo pills
  document.querySelectorAll('.demo-pill').forEach(pill => {
    pill.addEventListener('click', () => {
      document.getElementById('loginEmail').value = pill.dataset.email
      document.getElementById('loginPassword').value = pill.dataset.pw
    })
  })
}

async function handleLogin(e) {
  e.preventDefault()
  const email = document.getElementById('loginEmail').value.trim()
  const password = document.getElementById('loginPassword').value
  const btn = document.getElementById('loginBtn')
  const btnText = document.getElementById('loginBtnText')

  if (!email || !password) return showToast('Please enter email and password', 'error')

  btn.disabled = true
  btnText.textContent = 'Signing inâ€¦'

  try {
    await login(email, password)
    // Router will handle redirect
  } catch (err) {
    showToast(err.message || 'Login failed', 'error')
    btn.disabled = false
    btnText.textContent = 'Sign In'
  }
}
