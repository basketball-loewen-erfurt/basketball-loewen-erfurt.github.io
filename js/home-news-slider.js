// Steuert die Pfeile/Punkte des Desktop-News-Sliders (2 Bento-Seiten à 5 News).
document.addEventListener('DOMContentLoaded', function () {
  var track = document.getElementById('news-slider-track-desktop');
  if (!track) return;
  var prevBtn = document.querySelector('[data-news-prev]');
  var nextBtn = document.querySelector('[data-news-next]');
  var dots = document.querySelectorAll('[data-news-dot]');
  var pageCount = track.children.length;

  function currentPage() {
    return Math.round(track.scrollLeft / track.clientWidth);
  }

  function update() {
    var page = currentPage();
    dots.forEach(function (d, i) { d.classList.toggle('active', i === page); });
    prevBtn.disabled = page <= 0;
    nextBtn.disabled = page >= pageCount - 1;
  }

  function goTo(page) {
    // scrollIntoView auf die Zielseite selbst statt scrollLeft/scrollTo auf dem
    // Track — zusammen mit scroll-snap-type deutlich zuverlässiger.
    track.children[page].scrollIntoView({ behavior: 'instant', block: 'nearest', inline: 'start' });
  }

  prevBtn.addEventListener('click', function () { goTo(Math.max(0, currentPage() - 1)); });
  nextBtn.addEventListener('click', function () { goTo(Math.min(pageCount - 1, currentPage() + 1)); });
  dots.forEach(function (d, i) { d.addEventListener('click', function () { goTo(i); }); });

  var resizeTimer;
  track.addEventListener('scroll', function () {
    window.clearTimeout(resizeTimer);
    resizeTimer = window.setTimeout(update, 60);
  });
  window.addEventListener('resize', update);
  update();
});
