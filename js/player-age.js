// Berechnet das Alter aus Geburtsjahr + -monat (kein Tag gespeichert, siehe data-birth-year/-month).
document.addEventListener('DOMContentLoaded', function () {
  document.querySelectorAll('.panini-age[data-birth-year]').forEach(function (el) {
    var year = parseInt(el.dataset.birthYear, 10);
    var month = parseInt(el.dataset.birthMonth, 10);
    if (!year || !month) return;
    var now = new Date();
    var age = now.getFullYear() - year;
    if (now.getMonth() + 1 < month) age--;
    el.textContent = age;
  });
});
