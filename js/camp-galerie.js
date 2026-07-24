/* Bildergalerie für Basketballcamps und Events — horizontal scrollbarer Foto-Streifen.
   initCampGallery(containerId, campSlug, jsonPath, showComingSoon) rendert bis zu 50
   Fotos aus jsonPath (Default data/camp-galerie.json); mit campSlug werden nur Fotos
   mit passendem 'camp'-Feld gezeigt. showComingSoon hängt eine zusätzliche, immer
   sichtbare Platzhalter-Kachel ("Weitere Fotos folgen in Kürze") ans Ende des
   Streifens an — auch wenn noch gar keine echten Fotos vorliegen. */
function initCampGallery(containerId, campSlug, jsonPath, showComingSoon) {
  var container = document.getElementById(containerId);
  if (!container) return;
  var track = container.querySelector('.news-slider-track');
  var empty = container.querySelector('.camp-gallery-empty');
  var prevBtn = container.querySelector('[data-gallery-prev]');
  var nextBtn = container.querySelector('[data-gallery-next]');

  fetch(jsonPath || '/data/camp-galerie.json').then(function (r) { return r.json(); }).then(function (data) {
    var bilder = (data && data.bilder) || [];
    if (campSlug) bilder = bilder.filter(function (b) { return b.camp === campSlug; });
    bilder = bilder.slice(0, 50);

    if (!bilder.length && !showComingSoon) {
      if (empty) empty.style.display = 'block';
      return;
    }

    var html = bilder.map(function (b) {
      return '<div class="camp-gallery-photo"><img src="' + b.src + '" alt="' + (b.alt || '') + '" loading="lazy" /></div>';
    }).join('');
    if (showComingSoon) {
      html += '<div class="camp-gallery-photo camp-gallery-photo-soon"><span>Weitere Fotos<br>folgen in Kürze</span></div>';
    }
    track.innerHTML = html;

    if (prevBtn) prevBtn.addEventListener('click', function () { track.scrollBy({ left: -260, behavior: 'smooth' }); });
    if (nextBtn) nextBtn.addEventListener('click', function () { track.scrollBy({ left: 260, behavior: 'smooth' }); });
  });
}
