// ============================================
// PORTFOLIO — script.js
// Ibrahim Talib
// ============================================

document.addEventListener('DOMContentLoaded', () => {

  // ============================================
  // THEME TOGGLE
  //
  // How it works:
  // 1. On load, check localStorage for saved preference
  //    — user's choice persists across page reloads
  // 2. Clicking the button toggles 'light-theme' on <html>
  // 3. CSS variables update automatically — every color
  //    on the page changes via the cascade
  // 4. Preference is saved to localStorage immediately
  // ============================================

  const themeToggle = document.getElementById('theme-toggle');
  const htmlEl      = document.documentElement;

  // Restore saved theme on page load
  const savedTheme = localStorage.getItem('portfolio-theme');
  if (savedTheme === 'light') {
    htmlEl.classList.add('light-theme');
  }

  if (themeToggle) {
    themeToggle.addEventListener('click', () => {
      htmlEl.classList.toggle('light-theme');

      // Save preference — persists across reloads and sessions
      const isLight = htmlEl.classList.contains('light-theme');
      localStorage.setItem('portfolio-theme', isLight ? 'light' : 'dark');
    });
  }

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
  // CONTACT FORM — PREVENT DEFAULT SUBMIT
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
  // SCROLL REVEAL — INTERSECTION OBSERVER
  // Skill cards are excluded — anime.js handles them below
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

    // Navbar opacity
    if (window.scrollY > 50) {
      header.classList.add('scrolled');
    } else {
      header.classList.remove('scrolled');
    }

    // Active link highlighting
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
  //
  // How it works:
  // 1. All bars start at width: 0
  // 2. IntersectionObserver fires when skills section enters view
  // 3. For each bar: set CSS width to data-pct value
  //    CSS transition: width 1s ease handles the animation
  // 4. Counter counts up simultaneously using anime.js
  // 5. Each bar staggers by 100ms — cascade effect
  // ============================================

  const skillsSection = document.querySelector('#skills');

  const skillsObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {

        document.querySelectorAll('.skill-bar-item').forEach((item, index) => {
          const pct    = parseInt(item.getAttribute('data-pct')) || 0;
          const fill   = item.querySelector('.skill-bar-fill');
          const pctEl  = item.querySelector('.skill-bar-pct');

          // Stagger each bar by 100ms
          setTimeout(() => {

            // Animate the bar width
            if (fill) fill.style.width = pct + '%';

            // Count up the percentage number
            if (pctEl) {
              const counter = { val: 0 };
              anime({
                targets:  counter,
                val:      pct,
                round:    1,
                duration: 1000,
                easing:   'easeOutExpo',
                update: () => {
                  pctEl.textContent = counter.val + '%';
                }
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
  // TYPING ANIMATION — HERO TITLE
  //
  // How it works:
  // 1. An array of titles cycles endlessly
  // 2. typeChar() adds one character at a time
  //    using substring(0, charIndex++)
  // 3. Once the full title is typed, pause then
  //    deleteChar() removes one character at a time
  // 4. Once empty, move to the next title and repeat
  //
  // The blinking cursor is a CSS ::after pseudo-element
  // toggled by the .typing class on the element
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

    let titleIndex = 0;   // which title we're currently on
    let charIndex  = 0;   // how many characters are currently shown
    let isDeleting = false;

    // Typing speeds (milliseconds per character)
    const TYPE_SPEED   = 70;   // how fast characters appear
    const DELETE_SPEED = 35;   // how fast characters disappear
    const PAUSE_END    = 1800; // pause after fully typed
    const PAUSE_START  = 400;  // pause after fully deleted

    const tick = () => {

      const currentTitle = titles[titleIndex];

      if (isDeleting) {

        // Remove one character
        charIndex--;
        dynamicEl.textContent = currentTitle.substring(0, charIndex);

        if (charIndex === 0) {
          // Fully deleted — move to next title
          isDeleting = false;
          titleIndex = (titleIndex + 1) % titles.length;
          setTimeout(tick, PAUSE_START);
          return;
        }

        setTimeout(tick, DELETE_SPEED);

      } else {

        // Add one character
        charIndex++;
        dynamicEl.textContent = currentTitle.substring(0, charIndex);

        if (charIndex === currentTitle.length) {
          // Fully typed — pause then start deleting
          isDeleting = true;
          setTimeout(tick, PAUSE_END);
          return;
        }

        setTimeout(tick, TYPE_SPEED);

      }
    };

    // Small initial delay so it starts after the hero fade-in
    setTimeout(tick, 1200);

  }
});