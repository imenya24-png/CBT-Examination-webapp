// ===== SecureCBT — Shared Navigation Sidebar & Topbar JS =====
document.addEventListener('DOMContentLoaded', async () => {
  // If we are on the login page, do not inject sidebar
  if (window.location.pathname.includes('admin-login.html')) return;

  // Retrieve user session & profile
  let profile = null;
  try {
    profile = await DB.getCurrentProfile();
  } catch (err) {
    console.error("Error retrieving profile in sidebar builder:", err);
  }

  if (!profile) return; // Guard page will redirect

  // ── INJECT SIDEBAR STYLES ──
  const style = document.createElement('style');
  style.textContent = `
    /* Flex layout wrapper */
    .admin-layout {
      display: flex !important;
      min-height: 100vh;
      width: 100%;
      background: #f8fafc;
    }
    .admin-container {
      flex: 1;
      min-width: 0;
      display: flex;
      flex-direction: column;
      height: 100vh;
      overflow-y: auto;
      background: #f8fafc;
    }

    /* Sidebar container styling */
    .cbt-sidebar {
      width: 280px;
      background: #0f172a; /* Slate 900 */
      color: #cbd5e1; /* Slate 300 */
      display: flex;
      flex-direction: column;
      flex-shrink: 0;
      height: 100vh;
      position: sticky;
      top: 0;
      z-index: 200;
      border-right: 1px solid rgba(255, 255, 255, 0.05);
      transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1), width 0.3s;
    }

    /* Sidebar Brand Header */
    .cbt-sidebar-brand {
      padding: 24px;
      display: flex;
      align-items: center;
      gap: 12px;
      border-bottom: 1px solid rgba(255, 255, 255, 0.05);
    }
    .cbt-sidebar-logo {
      width: 36px;
      height: 36px;
      background: linear-gradient(135deg, #2563eb, #7c3aed);
      border-radius: 10px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 18px;
      color: #fff;
      font-weight: 800;
      box-shadow: 0 4px 12px rgba(37, 99, 235, 0.3);
    }
    .cbt-sidebar-title-wrap {
      display: flex;
      flex-direction: column;
    }
    .cbt-sidebar-title {
      font-size: 16px;
      font-weight: 800;
      color: #fff;
      letter-spacing: 0.5px;
    }
    .cbt-sidebar-subtitle {
      font-size: 11px;
      color: #64748b; /* Slate 500 */
      font-weight: 600;
    }

    /* Profile Badge Card */
    .cbt-sidebar-profile {
      padding: 16px 20px;
      margin: 16px 14px;
      background: rgba(255, 255, 255, 0.03);
      border: 1px solid rgba(255, 255, 255, 0.04);
      border-radius: 12px;
      display: flex;
      align-items: center;
      gap: 12px;
    }
    .cbt-sidebar-avatar {
      width: 40px;
      height: 40px;
      border-radius: 50%;
      background: #1e293b; /* Slate 800 */
      border: 2px solid rgba(255, 255, 255, 0.1);
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 18px;
      flex-shrink: 0;
    }
    .cbt-sidebar-user-details {
      min-width: 0;
      flex: 1;
    }
    .cbt-sidebar-username {
      font-size: 13px;
      font-weight: 700;
      color: #fff;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    .cbt-sidebar-user-role {
      font-size: 10px;
      font-weight: 800;
      text-transform: uppercase;
      padding: 2px 8px;
      border-radius: 99px;
      display: inline-block;
      margin-top: 4px;
      letter-spacing: 0.5px;
    }
    .role-superadmin {
      background: rgba(220, 38, 38, 0.15);
      color: #fca5a5;
      border: 1px solid rgba(220, 38, 38, 0.2);
    }
    .role-tutor {
      background: rgba(16, 185, 129, 0.15);
      color: #6ee7b7;
      border: 1px solid rgba(16, 185, 129, 0.2);
    }

    /* Sidebar Navigation Links */
    .cbt-sidebar-menu {
      flex: 1;
      padding: 8px 14px;
      overflow-y: auto;
      display: flex;
      flex-direction: column;
      gap: 4px;
    }
    .cbt-sidebar-item {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 12px 16px;
      font-size: 14px;
      font-weight: 600;
      color: #94a3b8; /* Slate 400 */
      border-radius: 10px;
      transition: all 0.2s ease;
      cursor: pointer;
    }
    .cbt-sidebar-item:hover {
      color: #fff;
      background: rgba(255, 255, 255, 0.04);
    }
    .cbt-sidebar-item.active {
      color: #fff;
      background: #2563eb; /* Blue 600 */
      box-shadow: 0 4px 12px rgba(37, 99, 235, 0.25);
    }
    .cbt-sidebar-item-icon {
      font-size: 16px;
      width: 20px;
      display: flex;
      justify-content: center;
      opacity: 0.8;
    }
    .cbt-sidebar-item.active .cbt-sidebar-item-icon {
      opacity: 1;
    }

    /* Footer Menu Item */
    .cbt-sidebar-footer {
      padding: 14px;
      border-top: 1px solid rgba(255, 255, 255, 0.05);
    }
    .btn-logout {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 10px;
      width: 100%;
      padding: 12px;
      background: rgba(220, 38, 38, 0.1);
      color: #f87171;
      border: 1px solid rgba(220, 38, 38, 0.15);
      border-radius: 10px;
      font-size: 13px;
      font-weight: 700;
      transition: all 0.2s;
      cursor: pointer;
    }
    .btn-logout:hover {
      background: #dc2626;
      color: #fff;
      box-shadow: 0 4px 12px rgba(220, 38, 38, 0.2);
    }

    /* Injected Header / Topbar Style Adjustments */
    .admin-topbar {
      box-shadow: var(--shadow-sm);
      border-bottom: 1.5px solid var(--admin-border) !important;
      background: #fff !important;
      position: sticky !important;
      top: 0 !important;
      z-index: 150 !important;
      height: 70px;
      display: flex;
      align-items: center;
      padding: 0 28px !important;
    }

    /* Mobile toggle button styling */
    .mobile-nav-toggle {
      display: none;
      background: none;
      border: none;
      font-size: 20px;
      cursor: pointer;
      color: var(--admin-text);
      padding: 6px;
      margin-right: 12px;
      border-radius: 6px;
      align-items: center;
      justify-content: center;
      transition: background 0.2s;
    }
    .mobile-nav-toggle:hover {
      background: #f1f5f9;
    }

    /* Desktop Viewport adjustments */
    @media (max-width: 1024px) {
      .cbt-sidebar {
        position: fixed;
        transform: translateX(-100%);
      }
      .cbt-sidebar.open {
        transform: translateX(0);
      }
      .mobile-nav-toggle {
        display: flex;
      }
      /* Click-away backdrop overlay */
      .cbt-sidebar-overlay {
        position: fixed;
        inset: 0;
        background: rgba(0, 0, 0, 0.4);
        backdrop-filter: blur(2px);
        z-index: 190;
        opacity: 0;
        pointer-events: none;
        transition: opacity 0.3s;
      }
      .cbt-sidebar-overlay.active {
        opacity: 1;
        pointer-events: all;
      }
    }
  `;
  document.head.appendChild(style);

  // ── PREPARE BACKDROP OVERLAY FOR MOBILE ──
  const overlay = document.createElement('div');
  overlay.className = 'cbt-sidebar-overlay';
  document.body.appendChild(overlay);

  // ── BUILD SIDEBAR ──
  const isSuperadmin = profile.role === 'superadmin';
  const currentPath = window.location.pathname;

  // Helper check if link is active
  const isActive = (path) => currentPath.includes(path) ? 'active' : '';

  const menuItems = [];

  // Superadmin dashboard or Tutor redirect (if they have dashboard or are superadmin, else show Attendance)
  const hasMultipleTutorModules = isSuperadmin || 
    ['Students', 'Questions', 'Results', 'Sessions', 'Violations', 'Settings', 'Logs']
      .some(m => profile[`allow${m}`] === true);

  if (hasMultipleTutorModules) {
    menuItems.push({ name: 'Dashboard', path: 'admin-dashboard.html', icon: '📊' });
  }

  // Define potential pages and their permission keys
  const permissionPages = [
    { name: 'Attendance', path: 'admin-attendance.html', icon: '📋', key: 'allowAttendance' },
    { name: 'Attendance Reports', path: 'admin-attendance-report.html', icon: '📈', key: 'allowAttendance' },
    { name: 'Manage Students', path: 'admin-students.html', icon: '👥', key: 'allowStudents' },
    { name: 'Question Bank', path: 'admin-questions.html', icon: '❓', key: 'allowQuestions' },
    { name: 'View Results', path: 'admin-results.html', icon: '🏆', key: 'allowResults' },
    { name: 'Active Sessions', path: 'admin-sessions.html', icon: '👁️', key: 'allowSessions' },
    { name: 'Violation Logs', path: 'admin-violations.html', icon: '⚠️', key: 'allowViolations' },
    { name: 'System Settings', path: 'admin-settings.html', icon: '⚙️', key: 'allowSettings' },
    { name: 'Activity Audit Logs', path: 'admin-logs.html', icon: '📜', key: 'allowLogs' }
  ];

  permissionPages.forEach(p => {
    // Add item if superadmin OR if the specific permission is set to true
    if (isSuperadmin || profile[p.key] === true) {
      menuItems.push(p);
    }
  });

  const sidebarEl = document.createElement('div');
  sidebarEl.className = 'cbt-sidebar';
  sidebarEl.innerHTML = `
    <div class="cbt-sidebar-brand">
      <div class="cbt-sidebar-logo">🛡️</div>
      <div class="cbt-sidebar-title-wrap">
        <span class="cbt-sidebar-title">SecureCBT</span>
        <span class="cbt-sidebar-subtitle">Control Panel</span>
      </div>
    </div>

    <div class="cbt-sidebar-profile">
      <div class="cbt-sidebar-avatar">👤</div>
      <div class="cbt-sidebar-user-details">
        <div class="cbt-sidebar-username" title="${profile.name}">${profile.name}</div>
        <div class="cbt-sidebar-user-role ${isSuperadmin ? 'role-superadmin' : 'role-tutor'}">
          ${isSuperadmin ? 'Superadmin' : 'Tutor Access'}
        </div>
      </div>
    </div>

    <div class="cbt-sidebar-menu">
      ${menuItems.map(item => `
        <div class="cbt-sidebar-item ${isActive(item.path)}" onclick="window.location.href='${item.path}'">
          <span class="cbt-sidebar-item-icon">${item.icon}</span>
          <span>${item.name}</span>
        </div>
      `).join('')}
    </div>

    <div class="cbt-sidebar-footer">
      <button class="btn-logout" id="sidebarLogoutBtn">
        <span class="cbt-sidebar-item-icon">🚪</span>
        <span>Logout</span>
      </button>
    </div>
  `;

  // ── INJECT SIDEBAR & BIND EVENTS ──
  const layout = document.querySelector('.admin-layout');
  if (layout) {
    layout.insertBefore(sidebarEl, layout.firstChild);
  }

  // Bind logout action
  document.getElementById('sidebarLogoutBtn').onclick = async () => {
    if (confirm("Are you sure you want to log out?")) {
      await DB.signOut();
      window.location.href = 'admin-login.html';
    }
  };

  // ── MOBILE SIDEBAR TRIGGER SETUP ──
  const topbar = document.querySelector('.admin-topbar');
  if (topbar) {
    const toggleBtn = document.createElement('button');
    toggleBtn.className = 'mobile-nav-toggle';
    toggleBtn.innerHTML = `
      <svg width="24" height="24" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24">
        <line x1="3" y1="12" x2="21" y2="12"></line>
        <line x1="3" y1="6" x2="21" y2="6"></line>
        <line x1="3" y1="18" x2="21" y2="18"></line>
      </svg>
    `;
    topbar.insertBefore(toggleBtn, topbar.firstChild);

    // Open Mobile Drawer
    toggleBtn.onclick = () => {
      sidebarEl.classList.add('open');
      overlay.classList.add('active');
    };

    // Close Mobile Drawer
    overlay.onclick = () => {
      sidebarEl.classList.remove('open');
      overlay.classList.remove('active');
    };
  }

  // ── DYNAMICALLY RENDER USER EMAIL IN TOPBAR ──
  const emailEl = document.getElementById('adminEmailDisplay');
  if (emailEl) {
    emailEl.textContent = `${profile.email} (${profile.role === 'superadmin' ? 'Superadmin' : 'Tutor'})`;
  }
});
