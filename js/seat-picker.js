/* Wiederverwendbare Sitzplatzwahl für Einzelticket- und Dauerkarten-Detailseite.
   Lädt den echten, pretix-schema-konformen Saalplan aus assets/seating/ und rendert
   ihn als Block-Grid. Verfügbarkeit ist bis zur echten pretix-Anbindung ein
   deterministischer Zufalls-Mock (siehe seededRandom). Kein Limit an wählbaren
   Plätzen pro Bestellung.

   Zwei Modi:
   - "seats" (Dauerkarte): einzelne Sitze sind klickbar, fester Platz für die Saison.
   - "blocks" (Einzelticket): nur der Block ist wählbar (Anzahl je Tarif), die Sitze
     im Block sind rein dekorativ (First-Come-First-Serve-Platzwahl vor Ort). */
(function () {
  'use strict';

  function seededRandom(seed) {
    var x = Math.sin(seed) * 10000;
    return x - Math.floor(x);
  }

  function SeatPicker(root, opts) {
    this.root = root;
    this.mode = opts.mode || 'seats';
    this.planUrl = opts.planUrl;
    this.prices = opts.prices; // { "Kategorie I": {normal: 19, ermaessigt: 12}, "Kategorie II": {...} }
    this.northZones = opts.northZones; // z.B. ["D", "E", "F"]
    this.southZones = opts.southZones; // z.B. ["A", "B", "C"]
    this.cartEl = opts.cartEl;
    this.totalEl = opts.totalEl;
    this.ctaEl = opts.ctaEl;
    this.onContinue = opts.onContinue || function () {};
    this.nachwuchsBeitrag = !!opts.nachwuchsBeitrag; // Pauschale pro Bestellung, standardmäßig an, unabhängig von Anzahl Plätze/Tickets
    this.nachwuchsAmount = opts.nachwuchsAmount || 2;
    this.nachwuchsChecked = true;
    this.selected = {}; // seat_guid -> {...} (Modus "seats")
    this.blockCounts = {}; // zone_id -> { normal: n, ermaessigt: n } (Modus "blocks")
    this._load();
  }

  SeatPicker.prototype._load = function () {
    var self = this;
    fetch(this.planUrl).then(function (r) { return r.json(); }).then(function (plan) {
      self.plan = plan;
      self.blocks = self._deriveBlocks(plan);
      self._render();
    }).catch(function (err) {
      self.root.innerHTML = '<p class="t-body-sm" style="color:#b3392c">Sitzplan konnte nicht geladen werden.</p>';
      console.error('Sitzplan-Fehler', err);
    });
  };

  /* Der echte, aus dem pretix-Sitzplan-Editor exportierte Plan legt alle Reihen in
     eine einzige Zone (keine Block-Namen wie "A"–"F"). Blöcke werden deshalb anhand
     der Reihen-Position gruppiert: gleiche x-Spalte + zusammenhängende y-Werte
     (Lücke < 100px) bilden einen Block. Ergebnis wird links-nach-rechts, oben-vor-unten
     als D/E/F (Nordtribüne) und A/B/C (Südtribüne) benannt — passend zum Blockplan-Bild. */
  SeatPicker.prototype._deriveBlocks = function (plan) {
    var allRows = [];
    plan.zones.forEach(function (zone) { zone.rows.forEach(function (row) { allRows.push(row); }); });

    var byX = {};
    allRows.forEach(function (row) {
      var x = row.position.x;
      (byX[x] = byX[x] || []).push(row);
    });

    var clusters = [];
    Object.keys(byX).forEach(function (x) {
      var rows = byX[x].slice().sort(function (a, b) { return a.position.y - b.position.y; });
      var current = [rows[0]];
      for (var i = 1; i < rows.length; i++) {
        if (rows[i].position.y - rows[i - 1].position.y > 100) {
          clusters.push(current);
          current = [];
        }
        current.push(rows[i]);
      }
      if (current.length) clusters.push(current);
    });

    clusters.forEach(function (rows) {
      rows.avgY = rows.reduce(function (s, r) { return s + r.position.y; }, 0) / rows.length;
      rows.x = rows[0].position.x;
    });
    var midY = (Math.min.apply(null, clusters.map(function (c) { return c.avgY; })) +
                Math.max.apply(null, clusters.map(function (c) { return c.avgY; }))) / 2;
    var north = clusters.filter(function (c) { return c.avgY < midY; }).sort(function (a, b) { return a.x - b.x; });
    var south = clusters.filter(function (c) { return c.avgY >= midY; }).sort(function (a, b) { return a.x - b.x; });

    var blocks = {};
    var northLabels = ['D', 'E', 'F'], southLabels = ['A', 'B', 'C'];
    north.forEach(function (rows, i) {
      var label = northLabels[i] || ('N' + i);
      blocks[label] = { zone_id: label, name: 'Block ' + label, rows: rows.slice().sort(function (a, b) { return a.position.y - b.position.y; }) };
    });
    south.forEach(function (rows, i) {
      var label = southLabels[i] || ('S' + i);
      blocks[label] = { zone_id: label, name: 'Block ' + label, rows: rows.slice().sort(function (a, b) { return a.position.y - b.position.y; }) };
    });
    return blocks;
  };

  SeatPicker.prototype._zoneById = function (id) {
    return this.blocks[id];
  };

  SeatPicker.prototype._render = function () {
    var self = this;
    var northRow = document.createElement('div');
    northRow.className = 'seatplan-row';
    var southRow = document.createElement('div');
    southRow.className = 'seatplan-row';

    this.northZones.forEach(function (id) { northRow.appendChild(self._renderZone(self._zoneById(id))); });
    this.southZones.forEach(function (id) { southRow.appendChild(self._renderZone(self._zoneById(id))); });

    var legend = this.mode === 'blocks'
      ? '<div class="seatplan-legend">' +
          '<span class="free"><i></i> First come, first serve</span>' +
          '<span class="free"><i></i> Freie Sitzplatzwahl innerhalb des Blocks</span>' +
        '</div>' +
        '<p class="t-caption" style="margin-top:6px;color:var(--text-muted)">Nur mit der Dauerkarte sicherst du dir einen festen Sitzplatz.</p>'
      : '<div class="seatplan-legend">' +
          '<span class="free"><i></i> frei</span>' +
          '<span class="taken"><i></i> vergeben</span>' +
          '<span class="sel"><i></i> deine Auswahl</span>' +
        '</div>';

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
      legend;

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
    var freeCount = 0;
    var blockMode = this.mode === 'blocks';
    zone.rows.forEach(function (row, rIdx) {
      var rowLabel = row.row_label || row.row_number;
      row.seats.forEach(function (seat, cIdx) {
        var taken = seededRandom(seedBase + rIdx * cols + cIdx) < 0.28;
        if (!taken) freeCount++;
        var btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'seatplan-seat';
        if (blockMode) btn.tabIndex = -1;
        btn.dataset.seatGuid = seat.seat_guid;
        var label = zone.name + ', Reihe ' + rowLabel + ', Platz ' + seat.seat_number;
        btn.setAttribute('aria-label', label + (taken ? ' (vergeben)' : ' (frei)'));
        if (taken || blockMode) {
          btn.disabled = true;
        } else if (self.prices[category]) {
          btn.addEventListener('click', function () {
            self._toggleSeat(seat.seat_guid, zone.name, rowLabel, seat.seat_number, category, priceInfo);
          });
        }
        grid.appendChild(btn);
      });
    });
    wrap.appendChild(grid);

    if (blockMode && this.prices[category]) {
      wrap.appendChild(this._renderBlockControls(zone.zone_id, zone.name, category, priceInfo, freeCount));
    }
    return wrap;
  };

  SeatPicker.prototype._renderBlockControls = function (zoneId, zoneLabel, category, priceInfo, freeCount) {
    var self = this;
    var box = document.createElement('div');
    box.className = 'seatplan-block-controls';

    function stepperRow(tarif, tarifLabel, price) {
      var row = document.createElement('div');
      row.className = 'seatplan-stepper-row';
      row.innerHTML =
        '<span>' + tarifLabel + ' <strong>' + price + ' €</strong></span>' +
        '<span class="seatplan-stepper">' +
          '<button type="button" data-step="-1" data-zone="' + zoneId + '" data-tarif="' + tarif + '" aria-label="weniger ' + tarifLabel + '">−</button>' +
          '<span data-count="' + zoneId + '-' + tarif + '">0</span>' +
          '<button type="button" data-step="1" data-zone="' + zoneId + '" data-tarif="' + tarif + '" aria-label="mehr ' + tarifLabel + '">+</button>' +
        '</span>';
      return row;
    }

    box.appendChild(stepperRow('normal', 'Normalpreis', priceInfo.normal));
    if (priceInfo.ermaessigt !== undefined) {
      box.appendChild(stepperRow('ermaessigt', 'Ermäßigt', priceInfo.ermaessigt));
    }

    box.querySelectorAll('[data-step]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var delta = parseInt(this.dataset.step, 10);
        self._stepBlock(zoneId, zoneLabel, category, priceInfo, this.dataset.tarif, delta, freeCount);
      });
    });

    return box;
  };

  SeatPicker.prototype._stepBlock = function (zoneId, zoneLabel, category, priceInfo, tarif, delta, freeCount) {
    var counts = this.blockCounts[zoneId] || { normal: 0, ermaessigt: 0 };
    var totalSelected = counts.normal + counts.ermaessigt;
    var next = counts[tarif] + delta;
    if (next < 0) return;
    if (delta > 0 && totalSelected >= freeCount) return;
    counts[tarif] = next;
    counts.zoneLabel = zoneLabel;
    counts.category = category;
    counts.priceInfo = priceInfo;
    this.blockCounts[zoneId] = counts;

    var span = this.root.querySelector('[data-count="' + zoneId + '-' + tarif + '"]');
    if (span) span.textContent = String(next);
    this._renderCart();
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

  /* Nachwuchsbeitrag ist eine Pauschale pro Bestellung (nicht pro Platz/Ticket),
     standardmäßig aktiviert, mit Opt-out-Checkbox. Wird nur angezeigt, wenn der
     Warenkorb nicht leer ist. Gemeinsam für "seats"- und "blocks"-Modus. */
  SeatPicker.prototype._appendNachwuchsRow = function () {
    var self = this;
    if (!this.nachwuchsBeitrag) return;
    var nwRow = document.createElement('label');
    nwRow.className = 'seatplan-nachwuchs-row';
    nwRow.innerHTML =
      '<input type="checkbox" id="seatplan-nachwuchs-checkbox"' + (this.nachwuchsChecked ? ' checked' : '') + '>' +
      '<span>Unterstützung für den Nachwuchs</span>' +
      '<strong>' + (this.nachwuchsChecked ? this.nachwuchsAmount : 0) + ' €</strong>';
    this.cartEl.appendChild(nwRow);
    nwRow.querySelector('input').addEventListener('change', function () {
      self.nachwuchsChecked = this.checked;
      self._renderCart();
    });
  };

  SeatPicker.prototype._renderCart = function () {
    if (this.mode === 'blocks') { this._renderCartBlocks(); return; }

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

      this._appendNachwuchsRow();
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
    if (this.nachwuchsBeitrag && this.nachwuchsChecked && guids.length > 0) total += this.nachwuchsAmount;
    this.totalEl.textContent = total + ' €';
  };

  SeatPicker.prototype._renderCartBlocks = function () {
    var self = this;
    var lines = [];
    Object.keys(this.blockCounts).forEach(function (zoneId) {
      var c = self.blockCounts[zoneId];
      if (c.normal > 0) lines.push({ zoneId: zoneId, tarif: 'normal', label: 'Normalpreis', count: c.normal, price: c.priceInfo.normal, zoneLabel: c.zoneLabel });
      if (c.ermaessigt > 0) lines.push({ zoneId: zoneId, tarif: 'ermaessigt', label: 'Ermäßigt', count: c.ermaessigt, price: c.priceInfo.ermaessigt, zoneLabel: c.zoneLabel });
    });
    var ticketCount = lines.reduce(function (sum, l) { return sum + l.count; }, 0);

    if (lines.length === 0) {
      this.cartEl.innerHTML = '<div class="seatplan-cart-empty">Noch keine Tickets ausgewählt.</div>';
      this.ctaEl.disabled = true;
    } else {
      this.cartEl.innerHTML = '';
      lines.forEach(function (l) {
        var row = document.createElement('div');
        row.className = 'seatplan-cart-item';
        var hasErmaessigt = l.zoneId && self.blockCounts[l.zoneId].priceInfo.ermaessigt !== undefined;
        row.innerHTML =
          '<div>' + l.count + '× ' + l.zoneLabel +
          (hasErmaessigt ? '<br><select class="seatplan-tarif-select" data-block-tarif-select data-zone="' + l.zoneId + '" data-tarif="' + l.tarif + '">' +
            '<option value="normal"' + (l.tarif === 'normal' ? ' selected' : '') + '>Normalpreis</option>' +
            '<option value="ermaessigt"' + (l.tarif === 'ermaessigt' ? ' selected' : '') + '>Ermäßigt</option>' +
            '</select>' : '<br><span class="t-caption">' + l.label + '</span>') +
          '<br><span class="t-caption">' + l.price + ' € je Ticket</span>' +
          '</div>' +
          '<div class="seatplan-cart-item-right"><span>' + (l.count * l.price) + ' €</span>' +
          '<button type="button" data-block-remove="' + l.zoneId + '" data-block-tarif="' + l.tarif + '">entfernen</button></div>';
        self.cartEl.appendChild(row);
      });

      this._appendNachwuchsRow();
      this.ctaEl.disabled = false;

      this.cartEl.querySelectorAll('[data-block-tarif-select]').forEach(function (sel) {
        sel.addEventListener('change', function () {
          var zoneId = this.dataset.zone;
          var oldTarif = this.dataset.tarif;
          var newTarif = this.value;
          if (newTarif === oldTarif) return;
          var counts = self.blockCounts[zoneId];
          var moved = counts[oldTarif];
          counts[oldTarif] = 0;
          counts[newTarif] = (counts[newTarif] || 0) + moved;
          var oldSpan = self.root.querySelector('[data-count="' + zoneId + '-' + oldTarif + '"]');
          if (oldSpan) oldSpan.textContent = '0';
          var newSpan = self.root.querySelector('[data-count="' + zoneId + '-' + newTarif + '"]');
          if (newSpan) newSpan.textContent = String(counts[newTarif]);
          self._renderCart();
        });
      });
      this.cartEl.querySelectorAll('[data-block-remove]').forEach(function (b) {
        b.addEventListener('click', function () {
          var zoneId = this.dataset.blockRemove;
          var tarif = this.dataset.blockTarif;
          self.blockCounts[zoneId][tarif] = 0;
          var span = self.root.querySelector('[data-count="' + zoneId + '-' + tarif + '"]');
          if (span) span.textContent = '0';
          self._renderCart();
        });
      });
    }

    var total = lines.reduce(function (sum, l) { return sum + l.count * l.price; }, 0);
    if (this.nachwuchsBeitrag && this.nachwuchsChecked && ticketCount > 0) total += this.nachwuchsAmount;
    this.totalEl.textContent = total + ' €';
  };

  SeatPicker.prototype.getSelection = function () {
    var self = this;
    if (this.mode === 'blocks') {
      return Object.keys(this.blockCounts).map(function (zoneId) {
        var c = self.blockCounts[zoneId];
        return { zone_id: zoneId, zoneLabel: c.zoneLabel, normal: c.normal, ermaessigt: c.ermaessigt, priceInfo: c.priceInfo };
      }).filter(function (l) { return l.normal > 0 || l.ermaessigt > 0; });
    }
    return Object.keys(this.selected).map(function (guid) {
      var s = self.selected[guid];
      return { seat_guid: guid, zoneLabel: s.zoneLabel, rowLabel: s.rowLabel, seatNumber: s.seatNumber, tarif: s.tarif, price: s.price };
    });
  };

  /* Einheitliche Zusammenfassung für die Übergabe an die gemeinsame Checkout-Seite
     (Käuferdaten). Gleiche Form für "seats"- und "blocks"-Modus. */
  SeatPicker.prototype.getSummary = function () {
    var self = this;
    var lines = [];
    var total = 0;

    if (this.mode === 'blocks') {
      Object.keys(this.blockCounts).forEach(function (zoneId) {
        var c = self.blockCounts[zoneId];
        ['normal', 'ermaessigt'].forEach(function (tarif) {
          var count = c[tarif];
          if (count > 0) {
            var price = tarif === 'ermaessigt' ? c.priceInfo.ermaessigt : c.priceInfo.normal;
            lines.push({
              label: c.zoneLabel + ' · ' + (tarif === 'ermaessigt' ? 'Ermäßigt' : 'Normalpreis'),
              qty: count, unitPrice: price, lineTotal: count * price
            });
            total += count * price;
          }
        });
      });
      var ticketCount = lines.reduce(function (sum, l) { return sum + l.qty; }, 0);
      var nachwuchsAmount = 0;
      if (this.nachwuchsBeitrag && this.nachwuchsChecked && ticketCount > 0) {
        nachwuchsAmount = this.nachwuchsAmount;
        lines.push({ label: 'Unterstützung für den Nachwuchs', qty: 1, unitPrice: nachwuchsAmount, lineTotal: nachwuchsAmount });
        total += nachwuchsAmount;
      }
      return { lines: lines, total: total, nachwuchsBeitrag: { checked: this.nachwuchsChecked, amount: nachwuchsAmount } };
    }

    Object.keys(this.selected).forEach(function (guid) {
      var s = self.selected[guid];
      lines.push({
        label: s.zoneLabel + ' · Reihe ' + s.rowLabel + ', Platz ' + s.seatNumber + ' · ' + (s.tarif === 'ermaessigt' ? 'Ermäßigt' : 'Normalpreis'),
        qty: 1, unitPrice: s.price, lineTotal: s.price
      });
      total += s.price;
    });
    var nwAmount = 0;
    if (this.nachwuchsBeitrag && this.nachwuchsChecked && lines.length > 0) {
      nwAmount = this.nachwuchsAmount;
      lines.push({ label: 'Unterstützung für den Nachwuchs', qty: 1, unitPrice: nwAmount, lineTotal: nwAmount });
      total += nwAmount;
    }
    return { lines: lines, total: total, nachwuchsBeitrag: { checked: this.nachwuchsChecked, amount: nwAmount } };
  };

  window.SeatPicker = SeatPicker;
})();
