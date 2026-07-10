/* Hauptpartner-Kacheln auf der Startseite — aus data/sponsoren.json gefiltert
   auf bestätigtes Cash-Sponsoring ab MIN_BETRAG ODER manuelles hauptpartner:true
   Override (siehe hinweis in sponsoren.json), alphabetisch sortiert. */
(function () {
  var MIN_BETRAG = 10000;
  var grid = document.getElementById('hauptpartner-grid');
  if (!grid) return;

  fetch('/data/sponsoren.json').then(function (r) { return r.json(); }).then(function (data) {
    var hauptpartner = data.partner
      .filter(function (p) { return p.logo && (p.betrag >= MIN_BETRAG || p.hauptpartner); })
      .sort(function (a, b) { return a.name.localeCompare(b.name, 'de'); });

    grid.innerHTML = hauptpartner.map(function (p) {
      return '<div class="partner-tile partner-tile-' + p.tier + '" data-tier="' + p.tier + '">' + partnerTileInnerHTML(p) + '</div>';
    }).join('');

    initPartnerTileFlip(grid);
    if (window.lucide) window.lucide.createIcons();
  });
})();
