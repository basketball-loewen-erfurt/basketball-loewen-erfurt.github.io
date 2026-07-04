/* Top-News-Slider im Homepage-Hero: wechselt alle 5 Sekunden zur nächsten News. */
document.querySelectorAll('[data-news-slider]').forEach(function (slider) {
  var slides = slider.querySelectorAll('.news-slide');
  if (slides.length < 2) return;
  var current = 0;
  setInterval(function () {
    slides[current].classList.remove('is-active');
    current = (current + 1) % slides.length;
    slides[current].classList.add('is-active');
  }, 5000);
});
