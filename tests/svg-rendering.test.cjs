const assert = require('node:assert/strict');
const { readFile } = require('node:fs/promises');
const http = require('node:http');
const path = require('node:path');
const { test } = require('node:test');
const { chromium } = require('playwright');

const root = path.resolve(__dirname, '..');
const types = {
  '.html': 'text/html',
  '.js': 'application/javascript',
  '.css': 'text/css',
  '.md': 'text/plain',
  '.svg': 'image/svg+xml',
};

test('SVG rendering through the actual Docsify site', async (t) => {
  const server = http.createServer(async (req, res) => {
    const pathname = decodeURIComponent(new URL(req.url, 'http://localhost').pathname);
    const file = path.resolve(root, '.' + (pathname === '/' ? '/index.html' : pathname));
    if (!file.startsWith(root + path.sep)) {
      res.writeHead(403).end();
      return;
    }
    try {
      const data = await readFile(file);
      res.setHeader('Content-Type', (types[path.extname(file)] || 'application/octet-stream') + '; charset=utf-8');
      res.end(data);
    } catch {
      res.writeHead(404).end();
    }
  });
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  let browser;
  try {
    browser = await chromium.launch({
      headless: true,
      channel: process.env.PLAYWRIGHT_CHANNEL || undefined,
    });
    const page = await browser.newPage();
    const errors = [];
    page.on('pageerror', (error) => errors.push(error.message));
    // Remote videos must not affect this local rendering test.
    await page.route('**/*', (route) =>
      new URL(route.request().url()).hostname === '127.0.0.1'
        ? route.continue()
        : route.abort(),
    );
    const base = `http://127.0.0.1:${server.address().port}/`;
    await page.goto(base + '#/36.SVG剪裁路径');
    await page.waitForFunction(() =>
      document.querySelector('.markdown-section h1')?.textContent === 'SVG剪裁路径',
    );

    await t.test('all eight clipping examples contain their actual graphics', async () => {
      const shapes = await page.locator('.svg-demo > svg').evaluateAll((svgs) =>
        svgs.map((svg) => svg.querySelectorAll(':is(rect,circle,path,text):not(defs *)').length),
      );
      assert.deepEqual(shapes, [1, 2, 1, 1, 2, 2, 2, 2]);
      assert.equal(await page.locator('.svg-demo pre').count(), 0);
      assert.equal(await page.locator('.markdown-section pre').count(), 4);
    });

    await t.test('blank lines and nested SVGs survive while fenced SVG stays code', async () => {
      const result = await page.evaluate(() => {
        const svg = '<svg width="200" height="100">\n\n    <rect width="100" height="50"></rect>\n\n    <svg x="10" y="10"><circle r="5"></circle></svg>\n\n</svg>';
        const markdown = svg + '\n\n```xml\n' + svg + '\n```';
        const html = window.__current_docsify_compiler__.compile(markdown);
        const container = document.createElement('div');
        container.innerHTML = html;
        return {
          svgs: container.querySelectorAll('svg').length,
          shapes: container.querySelectorAll('svg rect, svg circle').length,
          codeBlocks: container.querySelectorAll('pre').length,
          code: container.querySelector('pre code')?.textContent.trim(),
          source: svg,
        };
      });
      assert.equal(result.svgs, 2);
      assert.equal(result.shapes, 2);
      assert.equal(result.codeBlocks, 1);
      assert.equal(result.code, result.source);
    });

    assert.deepEqual(errors, []);
  } finally {
    if (browser) await browser.close();
    await new Promise((resolve) => server.close(resolve));
  }
});
