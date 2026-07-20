/* Hauptpartner-Kacheln auf der Startseite — aus data/sponsoren.json gefiltert
   auf manuelles hauptpartner:true (siehe hinweis in sponsoren.json), alphabetisch
   sortiert. Wer Top-Partner ist, wird bewusst manuell gepflegt statt über einen
   Betrags-Schwellenwert, da sich diese Grenze verschieben kann. */
(function () {
  var grid = document.getElementById('hauptpartner-grid');
  if (!grid) return;

  var v = (document.currentScript && document.currentScript.src.split('?v=')[1]) || '';
  fetch('/data/sponsoren.json' + (v ? '?v=' + v : '')).then(function (r) { return r.json(); }).then(function (data) {
    var hauptpartner = data.partner
      .filter(function (p) { return p.logo && p.hauptpartner; })
      .sort(function (a, b) { return a.name.localeCompare(b.name, 'de'); });

    grid.innerHTML = hauptpartner.map(partnerTileHTML).join('');

    if (window.lucide) window.lucide.createIcons();
  });
})();
