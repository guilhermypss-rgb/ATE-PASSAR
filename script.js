/* =========================================
   ATÉ PASSAR — JavaScript
   Interactions, Animations, UI Logic
   ========================================= */

'use strict';

// ── Navbar scroll effect ──────────────────────
const navbar = document.getElementById('navbar');
let lastScroll = 0;

window.addEventListener('scroll', () => {
  const current = window.scrollY;
  if (current > 60) {
    navbar.classList.add('scrolled');
  } else {
    navbar.classList.remove('scrolled');
  }
  lastScroll = current;
}, { passive: true });

// ── Mobile hamburger menu ─────────────────────
const hamburger = document.getElementById('hamburger-btn');
const navLinks = document.getElementById('nav-links');

if (hamburger && navLinks) {
  hamburger.addEventListener('click', () => {
    navLinks.classList.toggle('open');
    const isOpen = navLinks.classList.contains('open');
    hamburger.setAttribute('aria-expanded', isOpen);
  });

  // Close menu on link click
  navLinks.querySelectorAll('a').forEach(link => {
  link.addEventListener('click', () => {
    navLinks.classList.remove('open');
  });
});

// ── Smooth scroll for anchor links ───────────
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
  anchor.addEventListener('click', function (e) {
    const targetId = this.getAttribute('href');
    if (targetId === '#') return;
    const target = document.querySelector(targetId);
    if (target) {
      e.preventDefault();
      const offset = 80;
      const top = target.getBoundingClientRect().top + window.scrollY - offset;
      window.scrollTo({ top, behavior: 'smooth' });
    }
  });
});

// ── Cookie banner ─────────────────────────────
const cookieBanner = document.getElementById('cookie-banner');
const cookieAccept = document.getElementById('cookie-accept');
const cookieReject = document.getElementById('cookie-reject');

function dismissCookie() {
  if (cookieBanner) cookieBanner.classList.add('hidden');
  localStorage.setItem('ap_cookie_consent', 'true');
}

if (localStorage.getItem('ap_cookie_consent')) {
  if (cookieBanner) cookieBanner.classList.add('hidden');
}

if (cookieAccept) cookieAccept.addEventListener('click', dismissCookie);
if (cookieReject) cookieReject.addEventListener('click', dismissCookie);

// ── Intersection Observer — Scroll animations ─
const observerOptions = {
  threshold: 0.1,
  rootMargin: '0px 0px -50px 0px'
};

const observer = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add('visible');
      // Don't unobserve — keep it visible
    }
  });
}, observerOptions);

// Add animation classes and observe elements
function setupAnimations() {
  const animatables = [
    '.feature-card',
    '.step-card',
    '.pricing-card',
    '.testi-card',
    '.trust-logo',
    '.section-title',
    '.section-subtitle',
    '.section-tag',
  ];

  animatables.forEach(selector => {
    document.querySelectorAll(selector).forEach((el, i) => {
      el.style.opacity = '0';
      el.style.transform = 'translateY(24px)';
      el.style.transition = `opacity 0.5s ease ${i * 0.07}s, transform 0.5s ease ${i * 0.07}s`;
      observer.observe(el);
    });
  });
}

// Observer callback updates styles
const animObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.style.opacity = '1';
      entry.target.style.transform = 'translateY(0)';
    }
  });
}, { threshold: 0.1, rootMargin: '0px 0px -40px 0px' });

function initAnimations() {
  const selectors = [
    '.feature-card',
    '.step-card',
    '.pricing-card',
    '.testi-card',
    '.hero-badge',
    '.section-tag',
  ];

  selectors.forEach(sel => {
    document.querySelectorAll(sel).forEach((el, i) => {
      el.style.opacity = '0';
      el.style.transform = 'translateY(24px)';
      el.style.transition = `opacity 0.55s cubic-bezier(0.4,0,0.2,1) ${i * 0.08}s, transform 0.55s cubic-bezier(0.4,0,0.2,1) ${i * 0.08}s`;
      animObserver.observe(el);
    });
  });
}

initAnimations();

// ── Counter animation for hero stats ─────────
function animateCounter(el, target, suffix = '', decimals = 0) {
  const start = 0;
  const duration = 2000;
  const startTime = performance.now();

  function update(currentTime) {
    const elapsed = currentTime - startTime;
    const progress = Math.min(elapsed / duration, 1);
    // Ease out cubic
    const eased = 1 - Math.pow(1 - progress, 3);
    const current = start + (target - start) * eased;
    el.textContent = (decimals > 0 ? current.toFixed(decimals) : Math.floor(current)) + suffix;
    if (progress < 1) requestAnimationFrame(update);
  }

  requestAnimationFrame(update);
}

// Observe hero stats
const heroStats = document.getElementById('hero-stats');
if (heroStats) {
  const statsObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        // Counter animations would go here if using live data
        statsObserver.unobserve(entry.target);
      }
    });
  }, { threshold: 0.5 });
  statsObserver.observe(heroStats);
}

// ── Pomodoro timer simulation ─────────────────
let pomodoroInterval = null;
let pomodoroSeconds = 24 * 60 + 37; // start time shown
let isPaused = false;

const timerDisplay = document.querySelector('.session-timer');
const pauseBtn = document.getElementById('mock-pause');
const stopBtn = document.getElementById('mock-stop');

function formatTime(secs) {
  const m = Math.floor(secs / 60);
  const s = secs % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

function startMockTimer() {
  pomodoroInterval = setInterval(() => {
    if (!isPaused && pomodoroSeconds > 0) {
      pomodoroSeconds--;
      if (timerDisplay) timerDisplay.textContent = formatTime(pomodoroSeconds);
    }
    if (pomodoroSeconds === 0) {
      clearInterval(pomodoroInterval);
      if (timerDisplay) timerDisplay.textContent = '00:00';
    }
  }, 1000);
}

if (pauseBtn) {
  pauseBtn.addEventListener('click', () => {
    isPaused = !isPaused;
    pauseBtn.textContent = isPaused ? '▶️' : '⏸';
  });
}

if (stopBtn) {
  stopBtn.addEventListener('click', () => {
    pomodoroSeconds = 25 * 60;
    isPaused = true;
    if (timerDisplay) timerDisplay.textContent = formatTime(pomodoroSeconds);
    if (pauseBtn) pauseBtn.textContent = '▶️';
  });
}

startMockTimer();

// ── Active nav link highlighting ──────────────
const sections = document.querySelectorAll('section[id]');
const navItems = document.querySelectorAll('.nav-link');

window.addEventListener('scroll', () => {
  const scrollY = window.scrollY + 100;

  sections.forEach(section => {
    const top = section.offsetTop;
    const height = section.offsetHeight;
    const id = section.getAttribute('id');

    if (scrollY >= top && scrollY < top + height) {
      navItems.forEach(link => {
        link.classList.remove('active');
        if (link.getAttribute('href') === `#${id}`) {
          link.classList.add('active');
        }
      });
    }
  });
}, { passive: true });

// Add active style
const style = document.createElement('style');
style.textContent = `.nav-link.active { color: var(--purple-400) !important; background: rgba(124,58,237,0.1) !important; }`;
document.head.appendChild(style);

// ── Feature card hover ripple ─────────────────
document.querySelectorAll('.feature-card, .pricing-card, .testi-card').forEach(card => {
  card.addEventListener('mousemove', (e) => {
    const rect = card.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    card.style.setProperty('--mouse-x', `${x}%`);
    card.style.setProperty('--mouse-y', `${y}%`);
  });
});

// ── Typewriter effect for hero title ─────────
// Light animation — just ensures text is visible
const heroTitle = document.querySelector('.hero-title');
if (heroTitle) {
  heroTitle.style.opacity = '1';
}

// ── Subject progress bar animation ───────────
const progressBars = document.querySelectorAll('.ms-fill');
const progressObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.style.transition = 'width 1.2s ease';
      progressObserver.unobserve(entry.target);
    }
  });
}, { threshold: 0.5 });

progressBars.forEach(bar => progressObserver.observe(bar));

// ── Pricing card hover glow ───────────────────
document.querySelectorAll('.pricing-card').forEach(card => {
  card.addEventListener('mouseenter', () => {
    card.style.transition = 'all 0.3s ease';
  });
});

// ── CTA button pulse animation ────────────────
const heroPrimary = document.querySelector('.btn-hero-primary');
if (heroPrimary) {
  let pulseTimeout;
  function schedulePulse() {
    pulseTimeout = setTimeout(() => {
      heroPrimary.classList.add('pulse-anim');
      setTimeout(() => heroPrimary.classList.remove('pulse-anim'), 600);
      schedulePulse();
    }, 4000);
  }
  schedulePulse();
}

// Add pulse style
const pulseStyle = document.createElement('style');
pulseStyle.textContent = `
  @keyframes ctaPulse {
    0% { box-shadow: 0 4px 20px rgba(124,58,237,0.4); }
    50% { box-shadow: 0 4px 40px rgba(124,58,237,0.7), 0 0 0 8px rgba(124,58,237,0.1); }
    100% { box-shadow: 0 4px 20px rgba(124,58,237,0.4); }
  }
  .pulse-anim { animation: ctaPulse 0.6s ease !important; }
`;
document.head.appendChild(pulseStyle);

// ── Testimonials auto-scroll hint ────────────
// Subtle visual feedback for grid cards
document.querySelectorAll('.testi-card').forEach(card => {
  card.addEventListener('mouseenter', () => {
    card.style.zIndex = '2';
  });
  card.addEventListener('mouseleave', () => {
    card.style.zIndex = '';
  });
});

// ── Console easter egg ────────────────────────
console.log(
  '%c ATÉ PASSAR 🚀 ',
  'background: linear-gradient(135deg, #7C3AED, #06B6D4); color: white; font-family: Outfit, sans-serif; font-size: 18px; font-weight: 900; padding: 8px 16px; border-radius: 8px;'
);
console.log('%c Sua aprovação está chegando! Feito com ❤️ para estudantes brasileiros.', 'color: #8B5CF6; font-size: 14px;');

// ── Page load complete ────────────────────────
window.addEventListener('load', () => {
  document.body.classList.add('loaded');
});

// loaded style
const loadedStyle = document.createElement('style');
loadedStyle.textContent = `
  body { opacity: 0; transition: opacity 0.3s ease; }
  body.loaded { opacity: 1; }
`;
document.head.insertBefore(loadedStyle, document.head.firstChild);

// ── FAQ Accordion ─────────────────────────────
const faqItems = document.querySelectorAll('.faq-item');

faqItems.forEach(item => {
  const btn = item.querySelector('.faq-question');
  const answer = item.querySelector('.faq-answer');

  btn.addEventListener('click', () => {
    const isOpen = item.classList.contains('open');

    // Close all others
    faqItems.forEach(other => {
      other.classList.remove('open');
      other.querySelector('.faq-question').setAttribute('aria-expanded', 'false');
    });

    // Toggle this one
    if (!isOpen) {
      item.classList.add('open');
      btn.setAttribute('aria-expanded', 'true');
    }
  });

  // Fade-in animation for FAQ items
  item.style.opacity = '0';
  item.style.transform = 'translateY(16px)';
  item.style.transition = 'opacity 0.45s ease, transform 0.45s ease';
  animObserver.observe(item);
});

// ── Navbar glassmorphism on scroll ────────────
// Enhance the navbar with a gradient border glow on scroll
window.addEventListener('scroll', () => {
  if (window.scrollY > 200) {
    navbar.style.borderBottom = '1px solid rgba(124,58,237,0.2)';
  } else {
    navbar.style.borderBottom = '';
  }
}, { passive: true });

// ── Back to top on logo click ─────────────────
const logoLink = document.getElementById('nav-logo-link');
if (logoLink) {
  logoLink.addEventListener('click', (e) => {
    e.preventDefault();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });
}

// ── Pricing card — highlight on hover ────────
document.querySelectorAll('.pricing-card').forEach(card => {
  card.addEventListener('mouseenter', () => {
    document.querySelectorAll('.pricing-card').forEach(c => {
      if (c !== card) c.style.opacity = '0.7';
    });
  });
  card.addEventListener('mouseleave', () => {
    document.querySelectorAll('.pricing-card').forEach(c => {
      c.style.opacity = '';
    });
  });
});
