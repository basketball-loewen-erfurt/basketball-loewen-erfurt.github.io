/* Spielplan-Seite: rendert je Team (Profis/Damen/NBBL) die nächsten 3 Spiele,
   mit "Alle Spiele anzeigen"-Accordion für den Rest. Profis-Heimspiele kommen aus
   data/heimspiele.json (echte Termine), Profis-Auswärtstermine + Damen/NBBL aus
   data/spielplan-saison.json (teils noch Platzhalter, s. Hinweis dort). */
(function () {
  var MONATE = ['Januar', 'Februar', 'März', 'April', 'Mai', 'Juni', 'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember'];
  var WOCHENTAGE = ['So', 'Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa'];

  function parseDMY(str) {
    var parts = str.split('.').map(Number);
    return new Date(parts[2], parts[1] - 1, parts[0]);
  }
  function pad2(n) { return String(n).padStart(2, '0'); }
  function formatShort(d) { return pad2(d.getDate()) + '.' + pad2(d.getMonth() + 1) + '.' + d.getFullYear(); }
  function gcalStamp(d) { return d.getFullYear() + pad2(d.getMonth() + 1) + pad2(d.getDate()) + 'T' + pad2(d.getHours()) + pad2(d.getMinutes()) + '00'; }

  function calendarLink(g) {
    var timeParts = (g.zeit || '00:00').split(':').map(Number);
    var start = new Date(g.date.getFullYear(), g.date.getMonth(), g.date.getDate(), timeParts[0], timeParts[1]);
    var end = new Date(start.getTime() + 2 * 60 * 60 * 1000);
    var text = g.heim ? ('Basketball ' + g.teamLabel + ' – ' + g.gegner) : (g.gegner + ' – Basketball ' + g.teamLabel);
    var params = {
      action: 'TEMPLATE',
      text: text,
      dates: gcalStamp(start) + '/' + gcalStamp(end),
      details: g.heim ? 'Heimspiel der Basketball Löwen Erfurt in der Riethsporthalle.' : 'Auswärtsspiel der Basketball Löwen Erfurt.',
      ctz: 'Europe/Berlin'
    };
    if (g.heim) params.location = 'Essener Straße 20, 99089 Erfurt';
    return 'https://calendar.google.com/calendar/render?' + new URLSearchParams(params).toString();
  }

  function rowHTML(g) {
    var isPast = g.date < window.__spielplanToday;
    var dateStr = WOCHENTAGE[g.date.getDay()] + ', ' + formatShort(g.date);
    var matchup = g.heim ? ('Basketball ' + g.teamLabel + ' – ' + g.gegner) : (g.gegner + ' – Basketball ' + g.teamLabel);
    var venue = g.heim ? 'Heimspiel · Riethsporthalle' : 'Auswärts';
    var actionsHTML;
    if (isPast) {
      actionsHTML = '<div style="display:flex;flex-direction:column;align-items:flex-end;gap:6px">' +
        '<div class="fixture-result">' + (g.ergebnis || '– – : – –') + '</div>' +
        (g.spielberichtUrl ? '<a class="card-link" style="font-size:13px" href="' + g.spielberichtUrl + '">Spielbericht <i data-lucide="arrow-right" style="width:12px;height:12px"></i></a>' : '') +
        '</div>';
    } else {
      actionsHTML = '<div style="display:flex;gap:10px;align-items:center;flex-wrap:wrap;justify-content:flex-end">' +
        (g.ticketUrl ? '<a class="btn btn-outline-orange btn-sm" href="' + g.ticketUrl + '">Tickets <i data-lucide="arrow-right" style="width:14px;height:14px"></i></a>' : '') +
        '<a class="cal-link" href="' + calendarLink(g) + '" target="_blank" rel="noopener" title="Ins Kalender eintragen"><i data-lucide="calendar-plus" style="width:18px;height:18px"></i></a>' +
        '</div>';
    }
    return '<div class="fixture-row">' +
      '<div><div class="fixture-date">' + dateStr + '</div><div class="fixture-time">' + (g.zeit || '–') + ' Uhr</div></div>' +
      '<div class="fixture-mid"><div class="matchup">' + matchup + '</div><div class="venue">' + venue + '</div></div>' +
      actionsHTML +
      '</div>';
  }

  function renderTeam(listElId, emptyElId, games, emptyHinweis) {
    var listEl = document.getElementById(listElId);
    var emptyEl = document.getElementById(emptyElId);
    if (!listEl) return;
    if (!games.length) {
      listEl.style.display = 'none';
      if (emptyEl) { emptyEl.textContent = emptyHinweis; emptyEl.style.display = 'block'; }
      return;
    }
    var first = games.slice(0, 3);
    var rest = games.slice(3);
    var html = first.map(rowHTML).join('');
    if (rest.length) {
      html += '<details class="accordion" style="margin-top:8px">' +
        '<summary><span>Alle Spiele anzeigen (' + games.length + ')</span><i data-lucide="chevron-down" class="accordion-icon" style="width:20px;height:20px"></i></summary>' +
        '<div class="accordion-body">' + rest.map(rowHTML).join('') + '</div>' +
        '</details>';
    }
    listEl.innerHTML = html;
    if (window.lucide) lucide.createIcons();
  }

  var today = new Date();
  today.setHours(0, 0, 0, 0);
  window.__spielplanToday = today;

  Promise.all([
    fetch('/data/heimspiele.json?v=1784486098').then(function (r) { return r.json(); }),
    fetch('/data/spielplan-saison.json?v=1784486098').then(function (r) { return r.json(); })
  ]).then(function (results) {
    var heim = results[0], saison = results[1];

    function toGame(s, heimBool, teamLabel) {
      var g = Object.assign({}, s);
      g.date = parseDMY(s.datum);
      g.heim = heimBool;
      g.teamLabel = teamLabel;
      return g;
    }

    var profisGames = heim.spiele.map(function (s) { return toGame(s, true, 'Löwen Erfurt'); })
      .concat(saison.profisAuswaerts.map(function (s) { return toGame(s, false, 'Löwen Erfurt'); }))
      .sort(function (a, b) { return a.date - b.date; });

    var damenGames = (saison.damen.spiele || []).map(function (s) { return toGame(s, s.heim, 'Löwinnen Erfurt'); })
      .sort(function (a, b) { return a.date - b.date; });

    var nbblGames = (saison.nbbl.spiele || []).map(function (s) { return toGame(s, s.heim, 'U19'); })
      .sort(function (a, b) { return a.date - b.date; });

    renderTeam('spielplan-profis-liste', 'spielplan-profis-hinweis', profisGames, null);
    renderTeam('spielplan-damen-liste', 'spielplan-damen-hinweis', damenGames, saison.damen.hinweis);
    renderTeam('spielplan-nbbl-liste', 'spielplan-nbbl-hinweis', nbblGames, saison.nbbl.hinweis);
  });
})();
