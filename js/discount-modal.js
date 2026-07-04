/* Rabatt-Ecke: Ribbon-Klick öffnet ein Modal mit dem Fanmitglieds-Rabatt. */
(function () {
  function injectModal() {
    if (document.getElementById('discount-modal-backdrop')) return;
    var el = document.createElement('div');
    el.id = 'discount-modal-backdrop';
    el.className = 'modal-backdrop';
    el.innerHTML =
      '<div class="modal-box" role="dialog" aria-modal="true" aria-labelledby="discount-modal-title">' +
        '<button class="modal-close" aria-label="Schließen" id="discount-modal-close"><i data-lucide="x"></i></button>' +
        '<div class="modal-icon"><i data-lucide="percent"></i></div>' +
        '<span class="eyebrow" id="discount-modal-title">10% Rabatt</span>' +
        '<h3 class="t-h3" style="margin:8px 0 12px">Für Fanmitglieder.</h3>' +
        '<p class="t-body-sm">Werde Fanmitglied ab 6&nbsp;€/Monat und spare 10&nbsp;% auf deinen Ticketkauf — dazu Dauerkarten-Rabatt, Meet&nbsp;&amp;&nbsp;Greets und mehr.</p>' +
        '<a class="btn btn-primary btn-block" style="margin-top:20px" href="/mitglied-werden.html">Jetzt Fanmitglied werden</a>' +
      '</div>';
    document.body.appendChild(el);
    el.addEventListener('click', function (e) { if (e.target === el) closeModal(); });
    document.getElementById('discount-modal-close').addEventListener('click', closeModal);
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape') closeModal(); });
    if (window.lucide) window.lucide.createIcons();
  }

  function openModal() {
    injectModal();
    document.getElementById('discount-modal-backdrop').classList.add('open');
  }
  function closeModal() {
    var el = document.getElementById('discount-modal-backdrop');
    if (el) el.classList.remove('open');
  }

  document.addEventListener('DOMContentLoaded', function () {
    document.querySelectorAll('[data-discount-ribbon]').forEach(function (btn) {
      btn.addEventListener('click', openModal);
    });
  });

  window.openDiscountModal = openModal;
})();
