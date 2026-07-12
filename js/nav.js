/* Nav interactions: desktop dropdowns, tablet "Mehr" panel, mobile drawer. */
window.initNav = function initNav() {
  var navItems = document.querySelectorAll('[data-nav-item]');
  var moreBtn = document.getElementById('more-btn');
  var hamburgerBtn = document.getElementById('hamburger-btn');
  var drawer = document.getElementById('nav-drawer');
  var drawerBackdrop = document.getElementById('nav-drawer-backdrop');
  var drawerClose = document.getElementById('drawer-close');

  function closeAllDropdowns() {
    navItems.forEach(function (item) { item.classList.remove('open'); });
  }

  navItems.forEach(function (item) {
    item.addEventListener('click', function (e) {
      if (e.target.closest('.dropdown-panel')) return; /* let sub-links navigate */
      e.stopPropagation();
      var isOpen = item.classList.contains('open');
      closeAllDropdowns();
      if (!isOpen) item.classList.add('open');
    });
  });

  document.addEventListener('click', function (e) {
    if (!e.target.closest('[data-nav-item]')) closeAllDropdowns();
  });
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') { closeAllDropdowns(); closeDrawer(); }
  });

  var lastFocusedBeforeDrawer = null;

  function getFocusable(container) {
    return Array.prototype.slice.call(container.querySelectorAll(
      'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])'
    ));
  }

  function trapDrawerFocus(e) {
    if (e.key !== 'Tab' || !drawer) return;
    var focusable = getFocusable(drawer);
    if (!focusable.length) return;
    var first = focusable[0], last = focusable[focusable.length - 1];
    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault(); last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault(); first.focus();
    }
  }

  function openDrawer(trigger) {
    lastFocusedBeforeDrawer = trigger || document.activeElement;
    drawer.classList.add('open');
    drawer.removeAttribute('inert');
    drawer.setAttribute('aria-hidden', 'false');
    drawerBackdrop.classList.add('open');
    document.body.style.overflow = 'hidden';
    if (moreBtn) moreBtn.setAttribute('aria-expanded', 'true');
    if (hamburgerBtn) hamburgerBtn.setAttribute('aria-expanded', 'true');
    document.addEventListener('keydown', trapDrawerFocus);
    if (drawerClose) drawerClose.focus();
  }
  function closeDrawer() {
    if (!drawer) return;
    drawer.classList.remove('open');
    drawer.setAttribute('aria-hidden', 'true');
    drawer.setAttribute('inert', '');
    drawerBackdrop.classList.remove('open');
    document.body.style.overflow = '';
    if (moreBtn) moreBtn.setAttribute('aria-expanded', 'false');
    if (hamburgerBtn) hamburgerBtn.setAttribute('aria-expanded', 'false');
    document.removeEventListener('keydown', trapDrawerFocus);
    if (lastFocusedBeforeDrawer) lastFocusedBeforeDrawer.focus();
  }

  if (moreBtn) moreBtn.addEventListener('click', function (e) { e.stopPropagation(); openDrawer(moreBtn); });
  if (hamburgerBtn) hamburgerBtn.addEventListener('click', function (e) { e.stopPropagation(); openDrawer(hamburgerBtn); });
  if (drawerClose) drawerClose.addEventListener('click', closeDrawer);
  if (drawerBackdrop) drawerBackdrop.addEventListener('click', closeDrawer);

  document.querySelectorAll('[data-drawer-toggle]').forEach(function (toggle) {
    toggle.addEventListener('click', function () {
      var li = toggle.closest('.drawer-nav-item');
      var wasOpen = li.classList.contains('open');
      document.querySelectorAll('.drawer-nav-item.open').forEach(function (el) { el.classList.remove('open'); });
      if (!wasOpen) li.classList.add('open');
    });
  });

  /* Großes Logo über Utility- + Hauptnav-Leiste im Ruhezustand; beim Scrollen
     verschwindet die Utility-Leiste und das Logo schrumpft in die Nav-Zeile. */
  var header = document.querySelector('.site-header');
  if (header) {
    var onScroll = function () {
      if (window.scrollY > 16) header.classList.add('scrolled');
      else header.classList.remove('scrolled');
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
  }

  /* Hero-Inhalt gleitet beim Runterscrollen nach oben aus und blendet aus,
     das Hero-Bild dahinter bleibt stehen. Übersprungen bei reduced-motion,
     da scroll-gekoppelte Bewegung für vestibulär empfindliche Nutzer:innen
     problematisch sein kann. */
  var hero = document.querySelector('.hero-photo');
  var heroInner = hero ? hero.querySelector('.container') : null;
  var prefersReducedMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (hero && heroInner && !prefersReducedMotion) {
    var onHeroScroll = function () {
      var progress = Math.min(window.scrollY / hero.offsetHeight, 1);
      heroInner.style.transform = 'translateY(' + (progress * -50) + 'px)';
      heroInner.style.opacity = String(1 - progress);
    };
    window.addEventListener('scroll', onHeroScroll, { passive: true });
    onHeroScroll();
  }

  /* Footer-Badge (Zertifizierter Nachwuchsstandort): Klick vergrößert das Logo
     in einem Popup, analog zum Teamfoto-Popup auf den Team-Seiten. */
  var footerBadgeOpen = document.getElementById('footer-badge-open');
  var footerBadgeModal = document.getElementById('footer-badge-modal');
  if (footerBadgeOpen && footerBadgeModal) {
    footerBadgeOpen.addEventListener('click', function () {
      footerBadgeModal.classList.add('open');
    });
    footerBadgeModal.addEventListener('click', function (e) {
      if (e.target === footerBadgeModal || e.target.closest('[data-footer-badge-close]')) {
        footerBadgeModal.classList.remove('open');
      }
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') footerBadgeModal.classList.remove('open');
    });
  }

  /* Feedback-Widget (nur Launch-Phase — siehe Kommentar in footer.html):
     Klick öffnet das Panel, Absenden schickt an den n8n-Webhook, der das
     Feedback als Seite in der Notion-Datenbank "Website-Feedback" anlegt. */
  var feedbackWidget = document.getElementById('feedback-widget');
  var feedbackToggle = document.getElementById('feedback-widget-toggle');
  var feedbackClose = document.getElementById('feedback-widget-close');
  var feedbackForm = document.getElementById('feedback-widget-form');
  if (feedbackWidget && feedbackToggle && feedbackForm) {
    feedbackToggle.addEventListener('click', function () {
      feedbackWidget.classList.add('open');
    });
    if (feedbackClose) {
      feedbackClose.addEventListener('click', function () {
        feedbackWidget.classList.remove('open');
      });
    }
    feedbackForm.addEventListener('submit', function (e) {
      e.preventDefault();
      var message = feedbackForm.querySelector('[name="message"]').value.trim();
      if (!message) return;
      var contact = feedbackForm.querySelector('[name="contact"]').value.trim();
      var submitBtn = feedbackForm.querySelector('.feedback-widget-submit');
      submitBtn.disabled = true;
      submitBtn.textContent = 'Wird gesendet …';
      fetch('https://blev.app.n8n.cloud/webhook/website-feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: message, contact: contact, page: window.location.href })
      }).then(function (res) {
        if (!res.ok) throw new Error('Feedback-Webhook antwortete mit Fehler');
        feedbackForm.hidden = true;
        feedbackWidget.querySelector('.feedback-widget-success').hidden = false;
        setTimeout(function () { feedbackWidget.classList.remove('open'); }, 2500);
      }).catch(function () {
        submitBtn.disabled = false;
        submitBtn.textContent = 'Absenden';
        alert('Senden hat leider nicht geklappt — bitte später noch einmal versuchen.');
      });
    });
  }
};
