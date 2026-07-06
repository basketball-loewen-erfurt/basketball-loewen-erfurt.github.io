/* "News"-Box im Aktuelles-Bereich der Startseite: lädt /data/news.json und lässt
   die neuesten Beiträge (max. 10) im 10-Sekunden-Takt durchlaufen — Titel und
   Kurztext laufen bewusst als normaler Fließtext (keine fette/schwarze
   Überschrift), die Box-Überschrift "News" bleibt immer gleich. */
fetch('/data/news.json').then(function (r) { return r.json(); }).then(function (d) {
  var items = (d.artikel || []).slice(0, 10);
  if (!items.length) return;

  var text = document.getElementById('news-rotator-text');
  var link = document.getElementById('news-rotator-link');
  if (!text || !link) return;

  var i = 0;
  function show(index) {
    var a = items[index];
    text.textContent = a.titel + ' — ' + a.kurztext;
    link.href = a.url;
  }
  show(0);
  if (items.length > 1) {
    setInterval(function () {
      i = (i + 1) % items.length;
      show(i);
    }, 10000);
  }
});
