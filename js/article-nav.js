/* Vorheriger/Nächster-Artikel-Navigation für News-Artikelseiten. Sortiert data/news.json
   nach Datum absteigend (gleiche Reihenfolge wie news/aktuelles.html), findet den aktuellen
   Artikel anhand der URL und rendert Links zum chronologisch vorherigen (älteren) und
   nächsten (neueren) Artikel in ein Element mit id="article-nav". */
(function () {
  function parseGermanDate(str) {
    var parts = (str || '').split('.');
    if (parts.length !== 3) return new Date(0);
    return new Date(Number(parts[2]), Number(parts[1]) - 1, Number(parts[0]));
  }

  document.addEventListener('DOMContentLoaded', function () {
    var el = document.getElementById('article-nav');
    if (!el) return;

    fetch('/data/news.json').then(function (r) { return r.json(); }).then(function (data) {
      var items = (data.artikel || []).slice().sort(function (a, b) {
        return parseGermanDate(b.datum) - parseGermanDate(a.datum);
      });
      var path = window.location.pathname;
      var idx = items.findIndex(function (a) { return a.url === path; });
      if (idx === -1) return;

      var newer = idx > 0 ? items[idx - 1] : null;
      var older = idx < items.length - 1 ? items[idx + 1] : null;
      if (!newer && !older) return;

      var html = '';
      html += older
        ? '<a class="article-nav-link article-nav-prev" href="' + older.url + '"><i data-lucide="arrow-left" style="width:16px;height:16px"></i><span><span class="article-nav-label">Vorheriger Artikel</span><span class="article-nav-title">' + older.titel + '</span></span></a>'
        : '<span></span>';
      html += newer
        ? '<a class="article-nav-link article-nav-next" href="' + newer.url + '"><span><span class="article-nav-label">Nächster Artikel</span><span class="article-nav-title">' + newer.titel + '</span></span><i data-lucide="arrow-right" style="width:16px;height:16px"></i></a>'
        : '<span></span>';
      el.innerHTML = html;
      if (window.lucide) window.lucide.createIcons();
    });
  });
})();
