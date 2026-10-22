// Docsify replaces the article on navigation. Bind demonstrations after rendering
// and release the animation timer before leaving the page.
window.$docsify.plugins = [
  function (hook) {
    let animationTimer = null;

    function stopAnimation() {
      window.clearInterval(animationTimer);
      animationTimer = null;
    }

    hook.beforeEach(function (content) {
      stopAnimation();
      return content;
    });

    hook.doneEach(function () {
      const article = document.querySelector('.markdown-section');

      article.querySelectorAll('svg').forEach(function (svg) {
        // Wrap only outer SVGs: nested SVG viewports are part of the examples.
        if (svg.parentElement.closest('svg')) return;
        const wrapper = document.createElement('div');
        wrapper.className = 'svg-demo';
        svg.before(wrapper);
        wrapper.append(svg);
      });

      const resize = article.querySelector('[data-demo="resize"]');
      if (resize) {
        resize.addEventListener('click', function () {
          article.querySelector('#rect1').setAttribute('width', '100');
        });
      }

      const start = article.querySelector('[data-demo="start"]');
      const stop = article.querySelector('[data-demo="stop"]');
      if (start && stop) {
        start.addEventListener('click', function () {
          if (animationTimer !== null) return;
          const circle = article.querySelector('#circle1');
          animationTimer = window.setInterval(function () {
            const nextX = Number(circle.getAttribute('cx')) + 2;
            circle.setAttribute('cx', nextX > 500 ? 20 : nextX);
          }, 20);
        });
        stop.addEventListener('click', stopAnimation);
      }
    });
  },
];
