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

  function openDrawer() {
    drawer.classList.add('open');
    drawerBackdrop.classList.add('open');
    document.body.style.overflow = 'hidden';
  }
  function closeDrawer() {
    if (!drawer) return;
    drawer.classList.remove('open');
    drawerBackdrop.classList.remove('open');
    document.body.style.overflow = '';
  }

  if (moreBtn) moreBtn.addEventListener('click', function (e) { e.stopPropagation(); openDrawer(); });
  if (hamburgerBtn) hamburgerBtn.addEventListener('click', function (e) { e.stopPropagation(); openDrawer(); });
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
     das Hero-Bild dahinter bleibt stehen. */
  var hero = document.querySelector('.hero-photo');
  var heroInner = hero ? hero.querySelector('.container') : null;
  if (hero && heroInner) {
    var onHeroScroll = function () {
      var progress = Math.min(window.scrollY / hero.offsetHeight, 1);
      heroInner.style.transform = 'translateY(' + (progress * -50) + 'px)';
      heroInner.style.opacity = String(1 - progress);
    };
    window.addEventListener('scroll', onHeroScroll, { passive: true });
    onHeroScroll();
  }
};
