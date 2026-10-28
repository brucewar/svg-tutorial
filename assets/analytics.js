(function () {
  // Only the published tutorial sends analytics; local previews stay untracked.
  if (window.location.hostname !== 'svg.brucewar.cn') return;

  const measurementId = 'G-B05S8PK6J6';
  window.dataLayer = window.dataLayer || [];
  window.gtag = function () {
    window.dataLayer.push(arguments);
  };
  window.gtag('js', new Date());
  window.gtag('config', measurementId, { send_page_view: false });

  const script = document.createElement('script');
  script.async = true;
  script.src = 'https://www.googletagmanager.com/gtag/js?id=' + measurementId;
  document.head.appendChild(script);

  window.$docsify.plugins = (window.$docsify.plugins || []).concat(function (hook, vm) {
    let previousChapter = null;
    let previousLocation = document.referrer;

    hook.doneEach(function () {
      let chapter = decodeURIComponent(vm.route.path).replace(/\.md$/, '');
      if (chapter === '/README') chapter = '/';
      // Heading anchors and repeated rendering are not new chapter visits.
      if (chapter === previousChapter) return;

      // GA4 derives its page-path dimension from page_location without the hash.
      // Represent Docsify's hash routes as virtual paths to distinguish chapters.
      const page = new URL(chapter.replace(/^\//, ''), new URL('./', window.location.href));
      page.search = window.location.search;
      const heading = document.querySelector('.markdown-section h1');

      window.gtag('event', 'page_view', {
        send_to: measurementId,
        page_title: heading ? heading.textContent.trim() : document.title,
        page_location: page.href,
        page_referrer: previousLocation,
      });
      previousChapter = chapter;
      previousLocation = page.href;
    });
  });
})();
