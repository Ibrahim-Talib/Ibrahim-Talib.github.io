// ============================================
// PORTFOLIO — script.js
// Ibrahim Talib
// ============================================

document.addEventListener('DOMContentLoaded', () => {

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
  // HERO — FLOATING NETWORK CANVAS
  //
  // How it works:
  // 1. A <canvas> fills the entire hero section
  // 2. 70 nodes float around, bouncing off edges
  // 3. Lines connect nodes within 140px of each other
  //    — the closer the nodes, the more opaque the line
  // 4. Mouse proximity makes nodes scatter (repel effect)
  //    and turns nearby nodes cyan instead of gold
  // 5. anime.js fades all nodes in on page load
  // ============================================

  const canvas      = document.getElementById('hero-canvas');
  const heroSection = document.querySelector('.hero-section');

  if (canvas && heroSection) {

    const ctx = canvas.getContext('2d');

    let W, H, nodes;
    let mouseX = -9999;
    let mouseY = -9999;

    const NODE_COUNT  = 70;   // total floating nodes
    const MAX_DIST    = 140;  // max distance for drawing a connection line
    const REPEL_DIST  = 110;  // distance at which mouse starts pushing nodes
    const REPEL_FORCE = 2.8;  // how hard the mouse pushes

    // Resize canvas to match hero section dimensions
    const resize = () => {
  W = canvas.width  = heroSection.offsetWidth;
  H = canvas.height = heroSection.offsetHeight;

  // Only create new nodes on first load — not on every resize
  // On mobile, scrolling triggers resize when the address bar hides
  // Calling initNodes() would reset all opacities to 0 permanently
  if (!nodes) {
    initNodes();
    anime({
      targets: nodes,
      opacity: (node) => Math.random() * 0.55 + 0.45,
      duration: 2400,
      delay: anime.stagger(25, { from: 'random' }),
      easing: 'easeOutQuad'
    });
  }
};

    // Create all nodes with random positions, velocities, sizes
    const initNodes = () => {
      nodes = Array.from({ length: NODE_COUNT }, () => ({
        x:       Math.random() * W,
        y:       Math.random() * H,
        vx:      (Math.random() - 0.5) * 0.45,  // horizontal speed
        vy:      (Math.random() - 0.5) * 0.45,  // vertical speed
        r:       Math.random() * 1.8 + 0.6,     // radius
        opacity: 0                               // starts at 0 — anime.js fades in
      }));
    };

    // Track mouse position relative to the hero section
    // We listen on heroSection (not canvas) so clicks on buttons still work
    heroSection.addEventListener('mousemove', e => {
      const rect = heroSection.getBoundingClientRect();
      mouseX = e.clientX - rect.left;
      mouseY = e.clientY - rect.top;
    });

    heroSection.addEventListener('mouseleave', () => {
      mouseX = -9999;
      mouseY = -9999;
    });

    // Main animation loop — runs every frame via requestAnimationFrame
    const drawFrame = () => {

      ctx.clearRect(0, 0, W, H);

      // Update each node's position
      nodes.forEach(node => {

        node.x += node.vx;
        node.y += node.vy;

        // Bounce off the edges
        if (node.x < 0 || node.x > W) node.vx *= -1;
        if (node.y < 0 || node.y > H) node.vy *= -1;

        // Repel from mouse cursor
        const dx   = node.x - mouseX;
        const dy   = node.y - mouseY;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist < REPEL_DIST && dist > 0) {
          // Push node away from cursor — stronger when closer
          const force = (REPEL_DIST - dist) / REPEL_DIST;
          node.x += (dx / dist) * REPEL_FORCE * force;
          node.y += (dy / dist) * REPEL_FORCE * force;
        }

      });

      // Draw connection lines between nearby nodes
      for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {

          const dx   = nodes[i].x - nodes[j].x;
          const dy   = nodes[i].y - nodes[j].y;
          const dist = Math.sqrt(dx * dx + dy * dy);

          if (dist < MAX_DIST) {
            // Closer nodes = more opaque line
            const lineAlpha = (1 - dist / MAX_DIST) * 0.4 *
              Math.min(nodes[i].opacity, nodes[j].opacity);

            ctx.beginPath();
            ctx.moveTo(nodes[i].x, nodes[i].y);
            ctx.lineTo(nodes[j].x, nodes[j].y);
            ctx.strokeStyle = `rgba(200, 168, 75, ${lineAlpha})`;
            ctx.lineWidth = 0.6;
            ctx.stroke();
          }
        }
      }

      // Draw each node as a filled circle
      nodes.forEach(node => {

        const dx       = node.x - mouseX;
        const dy       = node.y - mouseY;
        const nearMouse = Math.sqrt(dx * dx + dy * dy) < 100;

        ctx.beginPath();
        ctx.arc(node.x, node.y, node.r, 0, Math.PI * 2);

        // Gold normally, cyan when near the cursor
        ctx.fillStyle = nearMouse
          ? `rgba(56, 189, 248, ${node.opacity})`
          : `rgba(200, 168, 75, ${node.opacity})`;

        ctx.fill();

      });

      requestAnimationFrame(drawFrame);
    };

    // Boot sequence
    resize();
    window.addEventListener('resize', resize);
    drawFrame();

    // Fade all nodes in using anime.js — staggered spawn effect
    // anime.js animates the .opacity property on each node JS object
    // Our drawFrame() reads node.opacity when drawing — so this works
    anime({
      targets: nodes,
      opacity: (node) => Math.random() * 0.55 + 0.45,
      duration: 2400,
      delay: anime.stagger(25, { from: 'random' }),
      easing: 'easeOutQuad'
    });

  }

// ============================================
  // SKILL PILLS — RING OFFSET + HOVER COUNTER
  // ============================================

  // Pre-calculate each pill's ring offset and store as CSS variable
  // Circumference = 2 * π * 15 = 94.25
  const CIRCUMFERENCE = 132;

  document.querySelectorAll('.skill-pill').forEach(pill => {
    const pct    = parseInt(pill.getAttribute('data-count')) || 0;
    const offset = CIRCUMFERENCE - (CIRCUMFERENCE * pct / 100);
    pill.style.setProperty('--ring-offset', offset);

    const pctEl  = pill.querySelector('.ring-pct');
    let animating = false;

    // Count up on mouseenter
    pill.addEventListener('mouseenter', () => {
      if (animating) return;
      animating = true;
      const counter = { val: 0 };
      anime({
        targets:  counter,
        val:      pct,
        round:    1,
        duration: 700,
        delay:    150,
        easing:   'easeOutExpo',
        update: () => {
          if (pctEl) pctEl.textContent = counter.val + '%';
        },
        complete: () => { animating = false; }
      });
    });

    // Reset on mouseleave
    pill.addEventListener('mouseleave', () => {
      if (pctEl) pctEl.textContent = '0%';
      animating = false;
    });
  });

  // Skills section — cascade animation (pills replace old skill-cards)
  const skillsSection = document.querySelector('#skills');

  document.querySelectorAll('.skill-pill').forEach(pill => {
    pill.style.opacity   = '0';
    pill.style.transform = 'translateY(30px) scale(0.9)';
  });

  const skillsObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        anime({
          targets:    '#skills .skill-pill',
          opacity:    [0, 1],
          translateY: [30, 0],
          scale:      [0.9, 1],
          delay:      anime.stagger(55, { from: 'first' }),
          easing:     'easeOutElastic(1, 0.7)',
          duration:   800
        });
        skillsObserver.unobserve(entry.target);
      }
    });
  }, { threshold: 0.08 });

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