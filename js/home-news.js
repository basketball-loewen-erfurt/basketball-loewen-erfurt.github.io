/* Top-News-Bereich im Homepage-Hero: lädt /data/news.json und zeigt nur
   Beiträge mit "topNews": true an. Neue Artikel ohne dieses Flag tauchen
   hier nicht auf, erscheinen aber weiterhin auf der Aktuelles-Seite. */
fetch('/data/news.json').then(function (r) { return r.json(); }).then(function (d) {
  var slider = document.querySelector('[data-news-slider]');
  if (!slider) return;
  var topNews = d.artikel.filter(function (a) { return a.topNews; });
  if (!topNews.length) return;

  var slidesEl = slider.querySelector('.news-slides');
  var dotsEl = slider.querySelector('.news-dots');

  slidesEl.innerHTML = topNews.map(function (a, i) {
    return '<div class="news-slide' + (i === 0 ? ' is-active' : '') + '">' +
      '<h3 class="t-h4">' + a.titel + '</h3>' +
      '<p class="t-body-sm">' + a.kurztext + '</p>' +
      '<a class="btn btn-outline-orange btn-sm" href="' + a.url + '">Weiterlesen <i data-lucide="arrow-right" style="width:14px;height:14px"></i></a>' +
    '</div>';
  }).join('');

  dotsEl.innerHTML = topNews.map(function (a, i) {
    return '<button class="news-dot' + (i === 0 ? ' is-active' : '') + '" data-slide-to="' + i + '" aria-label="News ' + (i + 1) + ': ' + a.titel + '"></button>';
  }).join('');

  if (window.lucide) { lucide.createIcons(); }
  if (window.initNewsSlider) { initNewsSlider(slider); }
});
