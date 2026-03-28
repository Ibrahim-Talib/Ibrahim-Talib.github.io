// ============================================
// PORTFOLIO — script.js
// Ibrahim Talib
// ============================================

document.addEventListener('DOMContentLoaded', () => {

  // htmlEl declared FIRST — everything else depends on it
  const htmlEl = document.documentElement;

  // ============================================
  // THEME TOGGLE
  // ============================================

  const savedTheme = localStorage.getItem('portfolio-theme');
  if (savedTheme === 'dark') {
    htmlEl.classList.remove('light-theme');
  } else {
    htmlEl.classList.add('light-theme');
  }

  document.querySelectorAll('.theme-toggle').forEach(btn => {
    btn.addEventListener('click', () => {
      htmlEl.classList.toggle('light-theme');
      const isLight = htmlEl.classList.contains('light-theme');
      localStorage.setItem('portfolio-theme', isLight ? 'light' : 'dark');
    });
  });

  // ============================================
  // HAMBURGER MENU
  // ============================================

  const hamburger = document.querySelector('.hamburger');
  const navLinks  = document.querySelector('.nav-links');
  const header    = document.querySelector('header');

  hamburger.addEventListener('click', () => {
    hamburger.classList.toggle('active');
    navLinks.classList.toggle('nav-open');
  });

  document.querySelectorAll('.nav-links a').forEach(link => {
    link.addEventListener('click', () => {
      hamburger.classList.remove('active');
      navLinks.classList.remove('nav-open');
    });
  });

  document.addEventListener('click', (event) => {
    const clickedOutside =
      !navLinks.contains(event.target) &&
      !hamburger.contains(event.target);
    if (clickedOutside) {
      hamburger.classList.remove('active');
      navLinks.classList.remove('nav-open');
    }
  });

  // ============================================
  // CONTACT FORM
  // ============================================

  const contactForm = document.querySelector('.contact-form');

  if (contactForm) {
    contactForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const btn = contactForm.querySelector('button[type="submit"]');
      const originalText = btn.textContent;
      const formData = new FormData(contactForm);
      btn.textContent = 'Sending...';
      btn.disabled = true;
      fetch(contactForm.action, {
        method: 'POST',
        body: formData,
        headers: { 'Accept': 'application/json' }
      })
      .then(response => {
        if (response.ok) {
          btn.textContent = 'Message Sent ✅';
          contactForm.reset();
          setTimeout(() => {
            btn.textContent = originalText;
            btn.disabled = false;
          }, 3000);
        } else {
          btn.textContent = 'Error — Try Again';
          btn.disabled = false;
        }
      })
      .catch(() => {
        btn.textContent = 'Error — Try Again';
        btn.disabled = false;
      });
    });
  }

  // ============================================
  // SCROLL REVEAL
  // ============================================

  const revealObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        revealObserver.unobserve(entry.target);
      }
    });
  }, {
    threshold: 0.1,
    rootMargin: '0px 0px -60px 0px'
  });

  document.querySelectorAll('.reveal').forEach(el => {
    revealObserver.observe(el);
  });

  // ============================================
  // NAVBAR SCROLL STATE + ACTIVE LINK
  // ============================================

  const sections   = document.querySelectorAll('section[id]');
  const navAnchors = document.querySelectorAll('.nav-links a');

  const onScroll = () => {
    if (window.scrollY > 50) {
      header.classList.add('scrolled');
    } else {
      header.classList.remove('scrolled');
    }

    let currentSection = '';
    sections.forEach(section => {
      const sectionTop    = section.getBoundingClientRect().top;
      const sectionHeight = section.offsetHeight;
      if (sectionTop <= 100 && sectionTop + sectionHeight > 100) {
        currentSection = section.getAttribute('id');
      }
    });

    navAnchors.forEach(anchor => {
      anchor.classList.remove('active');
      if (anchor.getAttribute('href') === `#${currentSection}`) {
        anchor.classList.add('active');
      }
    });
  };

  window.addEventListener('scroll', onScroll);

  // ============================================
  // SKILLS — PROGRESS BAR ANIMATION
  // ============================================

  const skillsSection = document.querySelector('#skills');

  const skillsObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        document.querySelectorAll('.skill-bar-item').forEach((item, index) => {
          const pct   = parseInt(item.getAttribute('data-pct')) || 0;
          const fill  = item.querySelector('.skill-bar-fill');
          const pctEl = item.querySelector('.skill-bar-pct');
          setTimeout(() => {
            if (fill) fill.style.width = pct + '%';
            if (pctEl) {
              const counter = { val: 0 };
              anime({
                targets:  counter,
                val:      pct,
                round:    1,
                duration: 1000,
                easing:   'easeOutExpo',
                update: () => { pctEl.textContent = counter.val + '%'; }
              });
            }
          }, index * 100);
        });
        skillsObserver.unobserve(entry.target);
      }
    });
  }, { threshold: 0.1 });

  if (skillsSection) skillsObserver.observe(skillsSection);

  // ============================================
  // TYPING ANIMATION
  // ============================================

  const dynamicEl = document.querySelector('.title-dynamic');

  if (dynamicEl) {
    const titles = [
      'Vibe Coder',
      'Software Developer',
      'Problem Solver',
      'CS Student @ LUMS',
      'Cybersecurity Analyst',
    ];

    let titleIndex = 0;
    let charIndex  = 0;
    let isDeleting = false;

    const TYPE_SPEED   = 70;
    const DELETE_SPEED = 35;
    const PAUSE_END    = 1800;
    const PAUSE_START  = 400;

    const tick = () => {
      const currentTitle = titles[titleIndex];
      if (isDeleting) {
        charIndex--;
        dynamicEl.textContent = currentTitle.substring(0, charIndex);
        if (charIndex === 0) {
          isDeleting = false;
          titleIndex = (titleIndex + 1) % titles.length;
          setTimeout(tick, PAUSE_START);
          return;
        }
        setTimeout(tick, DELETE_SPEED);
      } else {
        charIndex++;
        dynamicEl.textContent = currentTitle.substring(0, charIndex);
        if (charIndex === currentTitle.length) {
          isDeleting = true;
          setTimeout(tick, PAUSE_END);
          return;
        }
        setTimeout(tick, TYPE_SPEED);
      }
    };

    setTimeout(tick, 1800);
  }

});