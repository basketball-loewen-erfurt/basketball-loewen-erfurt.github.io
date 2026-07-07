/* Wiederverwendbare Sitzplatzwahl für Einzelticket- und Dauerkarten-Detailseite.
   Lädt den echten, pretix-schema-konformen Saalplan aus assets/seating/ und rendert
   ihn als Block-Grid mit einzeln klickbaren Sitzen. Verfügbarkeit ist bis zur echten
   pretix-Anbindung ein deterministischer Zufalls-Mock (siehe seededRandom).
   Kein Limit an wählbaren Plätzen pro Bestellung. */
(function () {
  'use strict';

  function seededRandom(seed) {
    var x = Math.sin(seed) * 10000;
    return x - Math.floor(x);
  }

  function SeatPicker(root, opts) {
    this.root = root;
    this.planUrl = opts.planUrl;
    this.prices = opts.prices; // { "Kategorie I": {normal: 19, ermaessigt: 12}, "Kategorie II": {...} }
    this.northZones = opts.northZones; // z.B. ["D", "E", "F"]
    this.southZones = opts.southZones; // z.B. ["A", "B", "C"]
    this.cartEl = opts.cartEl;
    this.totalEl = opts.totalEl;
    this.ctaEl = opts.ctaEl;
    this.onContinue = opts.onContinue || function () {};
    this.selected = {}; // seat_guid -> { zoneLabel, rowLabel, seatNumber, category, tarif, price }
    this._load();
  }

  SeatPicker.prototype._load = function () {
    var self = this;
    fetch(this.planUrl).then(function (r) { return r.json(); }).then(function (plan) {
      self.plan = plan;
      self._render();
    }).catch(function (err) {
      self.root.innerHTML = '<p class="t-body-sm" style="color:#b3392c">Sitzplan konnte nicht geladen werden.</p>';
      console.error('Sitzplan-Fehler', err);
    });
  };

  SeatPicker.prototype._zoneById = function (id) {
    return this.plan.zones.filter(function (z) { return z.zone_id === id; })[0];
  };

  SeatPicker.prototype._render = function () {
    var self = this;
    var northRow = document.createElement('div');
    northRow.className = 'seatplan-row';
    var southRow = document.createElement('div');
    southRow.className = 'seatplan-row';

    this.northZones.forEach(function (id) { northRow.appendChild(self._renderZone(self._zoneById(id))); });
    this.southZones.forEach(function (id) { southRow.appendChild(self._renderZone(self._zoneById(id))); });

    this.root.innerHTML =
      '<div class="seatplan-strip">Nordtribüne</div>' +
      '<div id="seatplan-north"></div>' +
      '<div class="seatplan-court-area">' +
        '<div class="seatplan-side-strip">Haupteingang &amp; Foyer</div>' +
        '<div class="seatplan-court">Spielfeld</div>' +
        '<div class="seatplan-side-strip">VIP-Bereich</div>' +
      '</div>' +
      '<div id="seatplan-south" style="margin-top:14px"></div>' +
      '<div class="seatplan-strip seatplan-strip-south">Südtribüne</div>' +
      '<div class="seatplan-legend">' +
        '<span class="free"><i></i> frei</span>' +
        '<span class="taken"><i></i> vergeben</span>' +
        '<span class="sel"><i></i> deine Auswahl</span>' +
      '</div>';

    document.getElementById('seatplan-north').appendChild(northRow);
    document.getElementById('seatplan-south').appendChild(southRow);
    this._renderCart();
  };

  SeatPicker.prototype._renderZone = function (zone) {
    var self = this;
    var category = zone.rows[0].seats[0].category;
    var isCat1 = category === 'Kategorie I';
    var priceInfo = this.prices[category] || { normal: 0 };

    var wrap = document.createElement('div');
    wrap.className = 'seatplan-block' + (isCat1 ? ' cat1' : '');

    var label = document.createElement('div');
    label.className = 'seatplan-block-label';
    label.textContent = zone.name;
    wrap.appendChild(label);

    var catEl = document.createElement('div');
    catEl.className = 'seatplan-block-cat';
    catEl.textContent = category + ' · ab ' + priceInfo.normal + ' €';
    wrap.appendChild(catEl);

    var cols = zone.rows[0].seats.length;
    var grid = document.createElement('div');
    grid.className = 'seatplan-grid';
    grid.style.gridTemplateColumns = 'repeat(' + cols + ', 12px)';

    var seedBase = zone.zone_id.charCodeAt(0) * 97;
    zone.rows.forEach(function (row, rIdx) {
      row.seats.forEach(function (seat, cIdx) {
        var taken = seededRandom(seedBase + rIdx * cols + cIdx) < 0.28;
        var btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'seatplan-seat';
        btn.dataset.seatGuid = seat.seat_guid;
        var label = zone.name + ', Reihe ' + row.row_label + ', Platz ' + seat.seat_number;
        btn.setAttribute('aria-label', label + (taken ? ' (vergeben)' : ' (frei)'));
        if (taken) {
          btn.disabled = true;
        } else if (self.prices[category]) {
          btn.addEventListener('click', function () {
            self._toggleSeat(seat.seat_guid, zone.name, row.row_label, seat.seat_number, category, priceInfo);
          });
        }
        grid.appendChild(btn);
      });
    });
    wrap.appendChild(grid);
    return wrap;
  };

  SeatPicker.prototype._toggleSeat = function (guid, zoneLabel, rowLabel, seatNumber, category, priceInfo) {
    var btn = this.root.querySelector('.seatplan-seat[data-seat-guid="' + guid + '"]');
    if (this.selected[guid]) {
      delete this.selected[guid];
      btn.classList.remove('selected');
    } else {
      this.selected[guid] = {
        zoneLabel: zoneLabel, rowLabel: rowLabel, seatNumber: seatNumber,
        category: category, tarif: 'normal', price: priceInfo.normal, priceInfo: priceInfo
      };
      btn.classList.add('selected');
    }
    this._renderCart();
  };

  SeatPicker.prototype._renderCart = function () {
    var self = this;
    var guids = Object.keys(this.selected);
    if (guids.length === 0) {
      this.cartEl.innerHTML = '<div class="seatplan-cart-empty">Noch keine Plätze ausgewählt.</div>';
      this.ctaEl.disabled = true;
    } else {
      this.cartEl.innerHTML = '';
      guids.forEach(function (guid) {
        var s = self.selected[guid];
        var row = document.createElement('div');
        row.className = 'seatplan-cart-item';
        var hasErmaessigt = s.priceInfo.ermaessigt !== undefined;
        row.innerHTML =
          '<div>' + s.zoneLabel + ' · Reihe ' + s.rowLabel + ', Platz ' + s.seatNumber +
          (hasErmaessigt ? '<br><select data-tarif="' + guid + '" class="seatplan-tarif-select">' +
            '<option value="normal"' + (s.tarif === 'normal' ? ' selected' : '') + '>Normalpreis</option>' +
            '<option value="ermaessigt"' + (s.tarif === 'ermaessigt' ? ' selected' : '') + '>Ermäßigt</option>' +
            '</select>' : '') +
          '</div>' +
          '<div class="seatplan-cart-item-right"><span>' + s.price + ' €</span>' +
          '<button type="button" data-remove="' + guid + '">entfernen</button></div>';
        self.cartEl.appendChild(row);
      });
      this.ctaEl.disabled = false;

      this.cartEl.querySelectorAll('[data-tarif]').forEach(function (sel) {
        sel.addEventListener('change', function () {
          var guid = this.dataset.tarif;
          var s = self.selected[guid];
          s.tarif = this.value;
          s.price = this.value === 'ermaessigt' ? s.priceInfo.ermaessigt : s.priceInfo.normal;
          self._renderCart();
        });
      });
      this.cartEl.querySelectorAll('[data-remove]').forEach(function (b) {
        b.addEventListener('click', function () {
          var guid = this.dataset.remove;
          var seatBtn = self.root.querySelector('.seatplan-seat[data-seat-guid="' + guid + '"]');
          if (seatBtn) seatBtn.classList.remove('selected');
          delete self.selected[guid];
          self._renderCart();
        });
      });
    }

    var total = guids.reduce(function (sum, guid) { return sum + self.selected[guid].price; }, 0);
    this.totalEl.textContent = total + ' €';
  };

  SeatPicker.prototype.getSelection = function () {
    var self = this;
    return Object.keys(this.selected).map(function (guid) {
      var s = self.selected[guid];
      return { seat_guid: guid, zoneLabel: s.zoneLabel, rowLabel: s.rowLabel, seatNumber: s.seatNumber, tarif: s.tarif, price: s.price };
    });
  };

  window.SeatPicker = SeatPicker;
})();
