/* Vorheriger/Nächster-Artikel + Zurück-zur-Übersicht-Navigation für News-Artikelseiten.
   Sortiert data/news.json nach Datum absteigend (gleiche Reihenfolge wie
   news/aktuelles.html), findet den aktuellen Artikel anhand der URL und rendert drei
   Kreis-Buttons (Vorheriger/Alle News/Nächster) in ein Element mit id="article-nav".
   Vorheriger/Nächster sind zirkulär (Modulo statt null) — am neuesten Artikel springt
   "Nächster" zum ältesten und umgekehrt, damit man endlos durchklicken kann. */
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

      var newer = items.length > 1 ? items[(idx - 1 + items.length) % items.length] : null;
      var older = items.length > 1 ? items[(idx + 1) % items.length] : null;

      var html = '';
      html += older
        ? '<a class="article-nav-arrow article-nav-prev" href="' + older.url + '" aria-label="Vorheriger Artikel: ' + older.titel + '"><i data-lucide="chevron-left" style="width:20px;height:20px"></i></a>'
        : '<span></span>';
      html += '<a class="article-nav-arrow article-nav-up" href="/news/aktuelles.html" aria-label="Zur Newsübersicht"><i data-lucide="chevron-up" style="width:20px;height:20px"></i></a>';
      html += newer
        ? '<a class="article-nav-arrow article-nav-next" href="' + newer.url + '" aria-label="Nächster Artikel: ' + newer.titel + '"><i data-lucide="chevron-right" style="width:20px;height:20px"></i></a>'
        : '<span></span>';
      el.innerHTML = html;
      if (window.lucide) window.lucide.createIcons();
    });
  });
})();
