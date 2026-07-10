/* Gemeinsame Flip-Kachel für Partner-/Sponsoren-Logos — Inhalt und Verhalten
   (Logo vorne, Claim + Kurzbeschreibung hinten, Klick dreht um) sind auf allen
   Seiten identisch. Nur die Größe variiert je Seite über CSS (siehe
   .partner-tile-* Größenklassen in site.css, ggf. mit Scoping-Overrides). */
function partnerTileInnerHTML(p) {
  var front = p.logo ? '<img src="' + p.logo + '" alt="' + p.name + '" loading="lazy" />' : p.name;
  var back = '';
  if (p.tier === 'wirkungspartner') back += '<span class="partner-tag">Wirkungspartner</span>';
  if (p.claim) back += '<p>„' + p.claim + '“</p>';
  if (p.beschreibung) back += '<span class="partner-desc">' + p.beschreibung + '</span>';
  return '<div class="partner-tile-inner">' +
    '<div class="partner-tile-front">' + front + '</div>' +
    '<div class="partner-tile-back">' + back + '</div>' +
  '</div>';
}

function initPartnerTileFlip(container) {
  container.querySelectorAll('.partner-tile').forEach(function (tile) {
    tile.addEventListener('click', function () { tile.classList.toggle('is-flipped'); });
  });
}
