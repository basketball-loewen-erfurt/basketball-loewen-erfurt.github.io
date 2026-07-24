/* Bildergalerie für Basketballcamps und Events — horizontal scrollbarer Foto-Streifen.
   initCampGallery(containerId, campSlug, jsonPath, showComingSoon) rendert bis zu 50
   Fotos aus jsonPath (Default data/camp-galerie.json); mit campSlug werden nur Fotos
   mit passendem 'camp'-Feld gezeigt. showComingSoon hängt eine zusätzliche, immer
   sichtbare Platzhalter-Kachel ("Weitere Fotos folgen in Kürze") ans Ende des
   Streifens an — auch wenn noch gar keine echten Fotos vorliegen. Klick auf ein
   echtes Foto öffnet es groß in einem Lightbox-Overlay (gemeinsam für alle Galerien
   auf der Seite). */
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
      var alt = (b.alt || '').replace(/"/g, '&quot;');
      return '<div class="camp-gallery-photo" data-lightbox-src="' + b.src + '" data-lightbox-alt="' + alt + '"><img src="' + b.src + '" alt="' + alt + '" loading="lazy" /></div>';
    }).join('');
    if (showComingSoon) {
      html += '<div class="camp-gallery-photo camp-gallery-photo-soon"><span>Weitere Fotos<br>folgen in Kürze</span></div>';
    }
    track.innerHTML = html;

    if (prevBtn) prevBtn.addEventListener('click', function () {
      var atStart = track.scrollLeft <= 4;
      if (atStart) track.scrollTo({ left: track.scrollWidth - track.clientWidth, behavior: 'smooth' });
      else track.scrollBy({ left: -260, behavior: 'smooth' });
    });
    if (nextBtn) nextBtn.addEventListener('click', function () {
      var atEnd = track.scrollLeft + track.clientWidth >= track.scrollWidth - 4;
      if (atEnd) track.scrollTo({ left: 0, behavior: 'smooth' });
      else track.scrollBy({ left: 260, behavior: 'smooth' });
    });

    track.addEventListener('click', function (e) {
      var tile = e.target.closest('.camp-gallery-photo[data-lightbox-src]');
      if (tile) openGalleryLightbox(tile.getAttribute('data-lightbox-src'), tile.getAttribute('data-lightbox-alt'));
    });
  });
}

/* Gemeinsames Lightbox-Overlay für alle Bildergalerien — wird beim ersten Klick
   einmalig erzeugt und danach wiederverwendet. */
function openGalleryLightbox(src, alt) {
  var overlay = document.getElementById('gallery-lightbox');
  if (!overlay) {
    overlay = document.createElement('div');
    overlay.id = 'gallery-lightbox';
    overlay.className = 'gallery-lightbox';
    overlay.innerHTML = '<button type="button" class="gallery-lightbox-close" aria-label="Schließen">&times;</button><img alt="" />';
    document.body.appendChild(overlay);
    overlay.addEventListener('click', function (e) {
      if (e.target === overlay || e.target.classList.contains('gallery-lightbox-close')) {
        closeGalleryLightbox();
      }
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') closeGalleryLightbox();
    });
  }
  overlay.querySelector('img').src = src;
  overlay.querySelector('img').alt = alt || '';
  overlay.classList.add('open');
  document.body.style.overflow = 'hidden';
}

function closeGalleryLightbox() {
  var overlay = document.getElementById('gallery-lightbox');
  if (overlay) overlay.classList.remove('open');
  document.body.style.overflow = '';
}
