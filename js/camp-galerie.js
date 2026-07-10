/* Bildergalerie für Basketballcamps und Events — horizontal scrollbarer Foto-Streifen.
   initCampGallery(containerId, campSlug, jsonPath) rendert bis zu 50 Fotos aus
   jsonPath (Default data/camp-galerie.json); mit campSlug werden nur Fotos mit
   passendem 'camp'-Feld gezeigt. */
function initCampGallery(containerId, campSlug, jsonPath) {
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

    if (!bilder.length) {
      if (empty) empty.style.display = 'block';
      return;
    }

    track.innerHTML = bilder.map(function (b) {
      return '<div class="camp-gallery-photo"><img src="' + b.src + '" alt="' + (b.alt || '') + '" loading="lazy" /></div>';
    }).join('');

    if (prevBtn) prevBtn.addEventListener('click', function () { track.scrollBy({ left: -260, behavior: 'smooth' }); });
    if (nextBtn) nextBtn.addEventListener('click', function () { track.scrollBy({ left: 260, behavior: 'smooth' }); });
  });
}
