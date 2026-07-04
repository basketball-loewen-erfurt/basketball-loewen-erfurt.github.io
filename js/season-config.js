/* Ein zentraler Schalter für die Hero-CTAs auf der Startseite.
   "offseason" -> "Dauerkarte sichern" / "Zum Spielplan"
   "season"    -> "Tickets sichern" / "Zum Spielplan"
   Auf "season" umstellen, sobald die neue Saison mit dem ersten Pflichtspiel beginnt. */
window.SITE_SEASON_PHASE = "offseason";

document.addEventListener('DOMContentLoaded', function () {
  var groups = document.querySelectorAll('[data-season-phase]');
  groups.forEach(function (el) {
    el.style.display = (el.getAttribute('data-season-phase') === window.SITE_SEASON_PHASE) ? '' : 'none';
  });
});
