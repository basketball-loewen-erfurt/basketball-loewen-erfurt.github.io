// Generische Detailseite für einen einzelnen Instagram-Post (news/insta-post.html?feed=...&id=...).
// Lädt den passenden Feed (data/instagram-<feed>.json), sucht den Post per id und zeigt
// Bild, Text und einen Link zum Original-Post. Läuft der Post aus dem Feed (Behold hält nur
// die letzten ~6 Beiträge vor), gibt es einen Hinweis samt Link zum Profil als Fallback.
document.addEventListener('DOMContentLoaded', function () {
  var FEEDS = {
    loewenpark: { url: '/data/instagram-loewenpark.json', badge: 'LÖWENPARK', profile: 'https://www.instagram.com/loewenpark.hallenmeister/' },
    loewen: { url: '/data/instagram-loewen.json', badge: 'Löwen', profile: 'https://www.instagram.com/basketball.loewen/' }
  };

  var params = new URLSearchParams(window.location.search);
  var feedKey = params.get('feed');
  var postId = params.get('id');
  var feedConfig = FEEDS[feedKey];

  var heroEl = document.getElementById('insta-hero');
  var eyebrowEl = document.getElementById('insta-eyebrow');
  var titleEl = document.getElementById('insta-title');
  var contentEl = document.getElementById('insta-content');

  function escapeHtml(str) {
    return (str || '').replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }

  function firstLine(text, maxLen) {
    var line = (text || '').split('\n')[0].trim();
    if (line.length > maxLen) line = line.slice(0, maxLen - 1).trim() + '…';
    return line || 'Instagram-Beitrag';
  }

  function formatDate(iso) {
    var d = new Date(iso);
    if (isNaN(d)) return '';
    return d.toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' }) +
      ', ' + d.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' }) + ' Uhr';
  }

  function articleFooterHtml() {
    return '<div style="margin-top:32px;padding-top:24px;border-top:1px solid var(--border);display:flex;align-items:center;justify-content:space-between;gap:16px;flex-wrap:wrap">' +
      '<a class="article-back-link" href="/news/aktuelles.html">← Alle News</a>' +
      '<a class="btn btn-outline-orange btn-sm" href="/news/newsletter.html">Newsletter abonnieren</a>' +
      '</div>';
  }

  function showNotFound() {
    titleEl.textContent = 'Beitrag nicht mehr verfügbar';
    eyebrowEl.textContent = 'Aktuelles · ' + (feedConfig ? feedConfig.badge + ' · Instagram' : 'Instagram');
    var profileUrl = feedConfig ? feedConfig.profile : 'https://www.instagram.com/basketball.loewen/';
    contentEl.innerHTML =
      '<p class="t-body">Dieser Beitrag ist im aktuellen Instagram-Feed nicht mehr enthalten — Instagram zeigt uns hier immer nur die letzten Beiträge.</p>' +
      '<a class="btn btn-primary" style="margin-top:16px" href="' + profileUrl + '" target="_blank" rel="noopener">Zum Instagram-Profil <i data-lucide="arrow-up-right" style="width:16px;height:16px"></i></a>' +
      articleFooterHtml();
    if (window.lucide) { lucide.createIcons(); }
  }

  if (!feedConfig || !postId) {
    showNotFound();
    return;
  }

  fetch(feedConfig.url, { cache: 'no-cache' })
    .then(function (r) { return r.ok ? r.json() : null; })
    .then(function (data) {
      var post = data && (data.posts || []).find(function (p) { return p.id === postId; });
      if (!post) { showNotFound(); return; }

      heroEl.style.backgroundImage =
        "linear-gradient(90deg, rgba(253,246,238,.92) 0%, rgba(253,246,238,.55) 38%, rgba(253,246,238,0) 62%), url('" + post.image + "')";
      heroEl.style.backgroundSize = 'cover';
      heroEl.style.backgroundPosition = 'center top';

      eyebrowEl.textContent = 'Aktuelles · ' + feedConfig.badge + ' · Instagram';
      titleEl.textContent = firstLine(post.caption, 90);

      var likesLine = (post.likeCount || post.commentsCount)
        ? '<p class="t-caption" style="color:var(--text-muted);margin-bottom:16px">' +
          formatDate(post.timestamp) +
          (post.likeCount ? ' · ' + post.likeCount + ' Likes' : '') +
          (post.commentsCount ? ' · ' + post.commentsCount + ' Kommentare' : '') +
          '</p>'
        : '<p class="t-caption" style="color:var(--text-muted);margin-bottom:16px">' + formatDate(post.timestamp) + '</p>';

      contentEl.innerHTML =
        '<div class="insta-detail-grid">' +
          '<div class="insta-detail-media"><img src="' + post.image + '" alt="" /></div>' +
          '<div>' +
            likesLine +
            '<p class="t-body" style="white-space:pre-line">' + escapeHtml(post.caption || '') + '</p>' +
            '<a class="btn btn-primary" style="margin-top:20px" href="' + post.permalink + '" target="_blank" rel="noopener">Original auf Instagram ansehen <i data-lucide="arrow-up-right" style="width:16px;height:16px"></i></a>' +
          '</div>' +
        '</div>' +
        articleFooterHtml();

      if (window.lucide) { lucide.createIcons(); }
    })
    .catch(showNotFound);
});
