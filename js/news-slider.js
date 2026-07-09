/* Top-News-Slider im Homepage-Hero: wechselt alle 7 Sekunden zur nächsten News,
   neue Meldung scrollt von unten nach oben rein; Dots erlauben Direktsprung.
   initNewsSlider wird explizit aufgerufen, nachdem die Slides aus
   /data/news.json nachgeladen wurden (siehe Inline-Script in index.html). */
function initNewsSlider(slider) {
  var slides = slider.querySelectorAll('.news-slide');
  var dots = slider.querySelectorAll('.news-dot');
  if (slides.length < 2) return;
  var current = 0;
  var timer;

  function goTo(index) {
    var old = slides[current];
    old.classList.remove('is-active');
    old.classList.add('is-leaving');
    setTimeout(function () {
      old.classList.add('no-anim');
      old.classList.remove('is-leaving');
      old.offsetHeight; /* Reflow erzwingen, damit der Reset nicht animiert wird */
      old.classList.remove('no-anim');
    }, 500);

    current = index;
    slides[current].classList.add('is-active');
    dots.forEach(function (dot, i) { dot.classList.toggle('is-active', i === current); });
  }

  var prefersReducedMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function restart() {
    clearInterval(timer);
    if (prefersReducedMotion) return; /* A11y: kein Auto-Advance, manuelle Punkte bleiben nutzbar */
    timer = setInterval(function () { goTo((current + 1) % slides.length); }, 7000);
  }

  dots.forEach(function (dot, i) {
    dot.addEventListener('click', function () {
      if (i === current) return;
      goTo(i);
      restart();
    });
  });

  restart();
}
