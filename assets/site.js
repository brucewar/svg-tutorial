window.$docsify = {
  name: 'SVG 教程',
  nameLink: '#/',
  repo: 'https://github.com/brucewar/svg-tutorial',
  homepage: 'README.md',
  loadSidebar: 'SUMMARY.md',
  routerMode: 'hash',
  auto2top: true,
  subMaxLevel: 2,
  skipLink: '跳到正文',
  markdown: function (marked, renderer) {
    marked.setOptions({ renderer: renderer });
    marked.use({
      extensions: [
        {
          name: 'svgBlock',
          level: 'block',
          start: function (source) {
            return source.search(/^ {0,3}<svg(?=[\s/>])/im);
          },
          tokenizer: function (source) {
            if (!/^ {0,3}<svg(?=[\s/>])/i.test(source)) return;

            // CommonMark HTML blocks end at blank lines. Consume the complete
            // SVG instead so its indented shapes never become Markdown code.
            // Count nested SVG viewports rather than stopping at the first end tag.
            let depth = 0;
            for (const match of source.matchAll(/<\/?svg(?=[\s/>])[^>]*>/gi)) {
              if (match[0].startsWith('</')) depth -= 1;
              else if (!/\/\s*>$/.test(match[0])) depth += 1;

              if (depth === 0) {
                return {
                  type: 'svgBlock',
                  raw: source.slice(0, match.index + match[0].length),
                };
              }
            }
          },
          renderer: function (token) {
            return token.raw;
          },
        },
      ],
    });
    return marked;
  },
  search: {
    paths: 'auto',
    placeholder: '搜索教程',
    noData: '没有找到相关内容',
    depth: 3,
    namespace: 'svg-tutorial-' + window.location.pathname,
  },
};
