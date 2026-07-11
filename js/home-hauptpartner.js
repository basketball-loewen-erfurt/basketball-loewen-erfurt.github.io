/* Hauptpartner-Kacheln auf der Startseite — aus data/sponsoren.json gefiltert
   auf bestätigtes Cash-Sponsoring ab MIN_BETRAG ODER manuelles hauptpartner:true
   Override (siehe hinweis in sponsoren.json), alphabetisch sortiert. */
(function () {
  var MIN_BETRAG = 10000;
  var grid = document.getElementById('hauptpartner-grid');
  if (!grid) return;

  var v = (document.currentScript && document.currentScript.src.split('?v=')[1]) || '';
  fetch('/data/sponsoren.json' + (v ? '?v=' + v : '')).then(function (r) { return r.json(); }).then(function (data) {
    var hauptpartner = data.partner
      .filter(function (p) { return p.logo && (p.betrag >= MIN_BETRAG || p.hauptpartner); })
      .sort(function (a, b) { return a.name.localeCompare(b.name, 'de'); });

    grid.innerHTML = hauptpartner.map(partnerTileHTML).join('');

    if (window.lucide) window.lucide.createIcons();
  });
})();
