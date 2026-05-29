// Home page logic — load dynamic content from Supabase config
document.addEventListener('DOMContentLoaded', async () => {
  const cfg = await DB.getConfig();
  if (cfg.badgeText)   document.getElementById('heroBadge').textContent = cfg.badgeText;
  if (cfg.mainTitle)   document.getElementById('heroTitle').innerHTML = cfg.mainTitle.replace(' ', '<br/><span>') + '</span>';
  if (cfg.examLabel)   document.getElementById('heroLabel').textContent = cfg.examLabel;
  if (cfg.description) document.getElementById('heroDesc').textContent = cfg.description;

  // Check exam active
  if (!cfg.examActive) {
    const btn = document.getElementById('startBtn');
    if (btn) {
      btn.disabled = true;
      btn.textContent = '⏸ Exam Not Available';
      btn.style.opacity = '0.5';
      btn.style.cursor = 'not-allowed';
    }
  }
});

function toggleMenu() {
  const dropdown = document.getElementById('navDropdown');
  dropdown.classList.toggle('open');
}

// Close menu on outside click
document.addEventListener('click', (e) => {
  if (!e.target.closest('#menuBtn') && !e.target.closest('#navDropdown')) {
    document.getElementById('navDropdown')?.classList.remove('open');
  }
});
