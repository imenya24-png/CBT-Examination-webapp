// ===== ADMIN AUTH — Supabase Auth =====
document.addEventListener('DOMContentLoaded', async () => {
  const session = await DB.getSession();
  if (session) {
    let redirectPage = 'admin-dashboard.html';
    try {
      const profile = await DB.getCurrentProfile();
      const isSuperadmin = profile?.role === 'superadmin';
      const hasMultipleModules = isSuperadmin || 
        ['Students', 'Questions', 'Results', 'Sessions', 'Violations', 'Settings', 'Logs']
          .some(m => profile?.[`allow${m}`] === true);
      
      if (!hasMultipleModules && profile?.allowAttendance) {
        redirectPage = 'admin-attendance.html';
      }
    } catch (e) {
      console.warn("Could not determine role redirect, defaulting to dashboard:", e);
    }
    window.location.href = redirectPage;
    return;
  }

  document.getElementById('adminPass').addEventListener('keydown', e => { if (e.key === 'Enter') doLogin(); });
});

async function doLogin() {
  const email = document.getElementById('adminEmail').value.trim();
  const pass  = document.getElementById('adminPass').value.trim();
  const errEl = document.getElementById('loginError');
  const btn   = document.getElementById('loginBtn');

  if (!email || !pass) {
    errEl.textContent = 'Please enter email and password.';
    errEl.style.display = 'block';
    return;
  }

  btn.textContent = 'Logging in...';
  btn.disabled = true;

  try {
    const { data, error } = await DB.signIn(email, pass);

    if (error || !data?.session) {
      let errMsg = 'Invalid credentials. Please try again.';
      if (error) {
        if (error.message === 'Email not confirmed') {
          errMsg = 'Email not confirmed. Please confirm your email in the Supabase Dashboard, or disable "Confirm email" under Auth -> Providers -> Email.';
        } else {
          errMsg = error.message;
        }
      }
      errEl.textContent = errMsg;
      errEl.style.display = 'block';
      document.getElementById('adminPass').value = '';
      btn.textContent = 'Access Dashboard';
      btn.disabled = false;
      setTimeout(() => errEl.style.display = 'none', 6000);
    } else {
      let redirectPage = 'admin-dashboard.html';
      try {
        const profile = await DB.getCurrentProfile();
        const isSuperadmin = profile?.role === 'superadmin';
        const hasMultipleModules = isSuperadmin || 
          ['Students', 'Questions', 'Results', 'Sessions', 'Violations', 'Settings', 'Logs']
            .some(m => profile?.[`allow${m}`] === true);
        
        if (!hasMultipleModules && profile?.allowAttendance) {
          redirectPage = 'admin-attendance.html';
        }
      } catch (e) {
        console.warn("Could not determine role redirect on login:", e);
      }
      window.location.href = redirectPage;
    }
  } catch (err) {
    console.error("Login error:", err);
    errEl.textContent = err.message || 'An unexpected error occurred.';
    errEl.style.display = 'block';
    btn.textContent = 'Access Dashboard';
    btn.disabled = false;
  }
}
