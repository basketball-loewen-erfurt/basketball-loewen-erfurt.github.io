/* Nächstes-Heimspiel-Karte im Homepage-Hero: ersetzt den früheren Top-News-Slider.
   Liest /data/heimspiele.json und zeigt standardmäßig nur das nächste anstehende
   Heimspiel. Gibt es weitere, erscheinen Punkte zum manuellen Durchblättern der
   nächsten bis zu drei Heimspiele — es wird NICHT automatisch weitergeschaltet. */
(function () {
  var MONATE = ['Januar', 'Februar', 'März', 'April', 'Mai', 'Juni', 'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember'];

  function parseDMY(str) {
    var parts = str.split('.').map(Number);
    return new Date(parts[2], parts[1] - 1, parts[0]);
  }

  function gameSlideHTML(g, i) {
    var dateStr = g.date.getDate() + '. ' + MONATE[g.date.getMonth()] + ' ' + g.date.getFullYear();
    return '<div class="next-game-slide' + (i === 0 ? ' is-active' : '') + '">' +
      '<h3 class="t-h4" style="margin:10px 0 6px">Basketball Löwen – ' + g.s.gegner + '</h3>' +
      '<p class="t-body-sm" style="margin-bottom:16px;display:flex;flex-direction:column;gap:4px">' +
        '<span style="display:inline-flex;align-items:center;gap:6px"><i data-lucide="calendar" style="width:14px;height:14px"></i>' + dateStr + '</span>' +
        '<span style="display:inline-flex;align-items:center;gap:6px"><i data-lucide="clock" style="width:14px;height:14px"></i>' + g.s.zeit + ' Uhr · Riethsporthalle</span>' +
      '</p>' +
      '<a class="btn btn-outline-orange btn-sm" href="/tickets.html">Tickets sichern <i data-lucide="arrow-right" style="width:14px;height:14px"></i></a>' +
    '</div>';
  }

  var card = document.getElementById('next-game-card');
  if (!card) return;

  fetch('/data/heimspiele.json').then(function (r) { return r.json(); }).then(function (d) {
    var today = new Date();
    today.setHours(0, 0, 0, 0);

    var upcoming = d.spiele
      .map(function (s) { return { s: s, date: parseDMY(s.datum) }; })
      .filter(function (g) { return g.date >= today; })
      .sort(function (a, b) { return a.date - b.date; })
      .slice(0, 3);

    if (!upcoming.length) { card.style.display = 'none'; return; }

    var dotsHTML = upcoming.length > 1
      ? '<div class="news-dots">' + upcoming.map(function (g, i) {
          return '<button class="news-dot' + (i === 0 ? ' is-active' : '') + '" data-slide-to="' + i + '" aria-label="Heimspiel ' + (i + 1) + ' von ' + upcoming.length + ': gegen ' + g.s.gegner + '"></button>';
        }).join('') + '</div>'
      : '';

    card.innerHTML =
      '<span class="eyebrow">Nächstes Heimspiel</span>' +
      '<div class="next-game-slides">' + upcoming.map(gameSlideHTML).join('') + '</div>' +
      dotsHTML;

    if (window.lucide) lucide.createIcons();

    var slides = card.querySelectorAll('.next-game-slide');
    var dots = card.querySelectorAll('.news-dot');
    dots.forEach(function (dot, i) {
      dot.addEventListener('click', function () {
        slides.forEach(function (s, si) { s.classList.toggle('is-active', si === i); });
        dots.forEach(function (d, di) { d.classList.toggle('is-active', di === i); });
      });
    });
  });
})();
