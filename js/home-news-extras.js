/* Optionale Zusatzinhalte im News-Bereich der Startseite: Video-Highlight (falls
   vorhanden) und Instagram-Feed (falls aktiviert). Siehe data/home-media.json —
   beide Slots bleiben unsichtbar, solange dort nichts hinterlegt ist. */
fetch('/data/home-media.json').then(function (r) { return r.json(); }).then(function (cfg) {
  if (cfg.video) {
    var videoSlot = document.getElementById('home-video-slot');
    if (videoSlot) {
      videoSlot.innerHTML =
        '<video controls style="width:100%;border-radius:var(--radius-lg)"' +
        (cfg.videoPoster ? ' poster="' + cfg.videoPoster + '"' : '') + '>' +
        '<source src="' + cfg.video + '" type="video/mp4"></video>';
      videoSlot.style.display = 'block';
    }
  }

  if (cfg.showInstagramFeed) {
    fetch('/data/instagram.json').then(function (r) { return r.json(); }).then(function (ig) {
      var posts = ig.posts || [];
      if (!posts.length) return;
      var slot = document.getElementById('home-insta-slot');
      if (!slot) return;
      slot.innerHTML = '<div class="grid-4">' + posts.slice(0, 4).map(function (p) {
        return '<a class="card hoverable" href="' + p.permalink + '" target="_blank" rel="noopener" style="overflow:hidden">' +
          '<img src="' + p.imageUrl + '" alt="" style="width:100%;aspect-ratio:1;object-fit:cover" />' +
        '</a>';
      }).join('') + '</div>';
      slot.style.display = 'block';
    });
  }
});
