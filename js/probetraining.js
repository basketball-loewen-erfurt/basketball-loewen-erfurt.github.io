/* Probetraining-Formular: Geburtsjahr -> passende Trainingsgruppen (aus /data/training-times.json).
   Kein Backend — Anfrage wird als vorausgefüllte E-Mail an die Vereinsadresse übergeben. */
document.addEventListener('DOMContentLoaded', function () {
  var yearSelect = document.getElementById('geburtsjahr');
  var resultBox = document.getElementById('training-result');
  var form = document.getElementById('probetraining-form');
  var statusBox = document.getElementById('probetraining-status');
  if (!yearSelect || !form) return;

  var currentYear = new Date().getFullYear();
  for (var y = currentYear - 3; y >= currentYear - 20; y--) {
    var opt = document.createElement('option');
    opt.value = y;
    opt.textContent = y;
    yearSelect.appendChild(opt);
  }

  var trainingData = null;
  fetch('/data/training-times.json')
    .then(function (res) { return res.json(); })
    .then(function (data) { trainingData = data; });

  function renderMatches(year) {
    if (!trainingData) return;
    var matches = trainingData.gruppen.filter(function (g) {
      return g.jahrgaenge && g.jahrgaenge.indexOf(year) !== -1;
    });
    resultBox.innerHTML = '';
    if (!matches.length) {
      resultBox.innerHTML =
        '<div class="label">Keine feste Gruppe gefunden</div>' +
        '<p class="value" style="font-weight:400;font-size:14px">Für den Jahrgang ' + year + ' haben wir aktuell keine fest gelistete Trainingsgruppe. ' +
        'Schreib uns kurz — wir finden gemeinsam die passende Zeit: <a href="mailto:' + trainingData.kontakt.email + '">' + trainingData.kontakt.email + '</a> · ' + trainingData.kontakt.telefon + '</p>';
      resultBox.classList.add('visible');
      return;
    }
    matches.forEach(function (g) {
      var termine = g.termine.map(function (t) { return t.tag + ' ' + t.zeit + ' · ' + t.ort; }).join('<br>');
      resultBox.innerHTML +=
        '<div class="label">' + g.name + '</div>' +
        '<p class="value" style="margin-bottom:4px">' + g.beschreibung + '</p>' +
        '<p style="font-size:14px;color:var(--text-secondary)">' + termine + '</p>';
    });
    resultBox.classList.add('visible');
  }

  yearSelect.addEventListener('change', function () {
    if (yearSelect.value) renderMatches(parseInt(yearSelect.value, 10));
  });

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    var vorname = form.vorname.value.trim();
    var nachname = form.nachname.value.trim();
    var email = form.email.value.trim();
    var jahr = yearSelect.value;
    var telefon = form.telefon.value.trim();
    var nachricht = form.nachricht.value.trim();

    if (!vorname || !nachname || !email || !jahr) {
      statusBox.textContent = 'Bitte fülle Vorname, Nachname, E-Mail und Geburtsjahr aus.';
      statusBox.className = 'form-status error visible';
      return;
    }

    var kEmail = (trainingData && trainingData.kontakt.email) || 'info@basketball-loewen.com';
    var subject = 'Probetraining-Anfrage: ' + vorname + ' ' + nachname + ' (Jg. ' + jahr + ')';
    var body = 'Name: ' + vorname + ' ' + nachname + '\nGeburtsjahr: ' + jahr +
      '\nE-Mail: ' + email + (telefon ? '\nTelefon: ' + telefon : '') +
      (nachricht ? '\nNachricht: ' + nachricht : '');
    var mailtoLink = 'mailto:' + kEmail + '?subject=' + encodeURIComponent(subject) + '&body=' + encodeURIComponent(body);

    statusBox.innerHTML = 'Danke, ' + vorname + '! Klicke jetzt auf den Button, um deine Anfrage per E-Mail an uns abzuschicken: ' +
      '<a class="btn btn-primary" style="margin-top:10px" href="' + mailtoLink + '">E-Mail jetzt senden</a>';
    statusBox.className = 'form-status success visible';
    form.querySelector('button[type="submit"]').style.display = 'none';
  });
});
