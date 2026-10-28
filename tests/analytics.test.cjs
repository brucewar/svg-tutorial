const assert = require('node:assert/strict');
const { readFile } = require('node:fs/promises');
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

test('GA4 measures Docsify chapter visits without sending test data to Google', async (t) => {
  const browser = await chromium.launch({
    headless: true,
    channel: process.env.PLAYWRIGHT_CHANNEL || undefined,
  });
  try {
    const page = await browser.newPage();
    const tagRequests = [];
    const errors = [];
    page.on('pageerror', (error) => errors.push(error.message));
    await page.route('**/*', async (route) => {
      const url = new URL(route.request().url());
      if (url.hostname === 'www.googletagmanager.com') {
        tagRequests.push(url.href);
        // Exercise queueing and navigation even if Google cannot be reached.
        await route.abort();
        return;
      }
      if (!['svg.brucewar.cn', '127.0.0.1', 'localhost'].includes(url.hostname)) {
        await route.abort();
        return;
      }
      const file = path.resolve(root, '.' + (url.pathname === '/' ? '/index.html' : decodeURIComponent(url.pathname)));
      if (!file.startsWith(root + path.sep)) {
        await route.fulfill({ status: 403, body: '' });
        return;
      }
      try {
        const body = await readFile(file);
        await route.fulfill({ body, contentType: (types[path.extname(file)] || 'application/octet-stream') + '; charset=utf-8' });
      } catch {
        await route.fulfill({ status: 404, body: '' });
      }
    });

    async function pageViews() {
      return page.evaluate(() => (window.dataLayer || [])
        .map((args) => Array.from(args))
        .filter((args) => args[0] === 'event' && args[1] === 'page_view')
        .map((args) => args[2]));
    }

    await t.test('first visit and chapter changes include titles, virtual paths and referrers', async () => {
      await page.goto('https://svg.brucewar.cn/#/');
      await page.waitForFunction(() => document.querySelector('.markdown-section h1')?.textContent === 'SVG入门教程');
      assert.deepEqual(tagRequests, ['https://www.googletagmanager.com/gtag/js?id=G-B05S8PK6J6']);
      assert.deepEqual(await page.evaluate(() => Array.from(window.dataLayer[1])), [
        'config', 'G-B05S8PK6J6', { send_page_view: false },
      ]);
      let views = await pageViews();
      assert.equal(views.length, 1);
      assert.equal(views[0].send_to, 'G-B05S8PK6J6');
      assert.equal(views[0].page_title, 'SVG入门教程');
      assert.equal(views[0].page_location, 'https://svg.brucewar.cn/');

      await page.getByRole('link', { name: '9.SVG rect元素', exact: true }).click();
      await page.waitForFunction(() => document.querySelector('.markdown-section h1')?.textContent === 'SVG rect元素');
      views = await pageViews();
      assert.equal(views.length, 2);
      assert.equal(views[1].page_title, 'SVG rect元素');
      assert.equal(decodeURI(views[1].page_location), 'https://svg.brucewar.cn/9.SVG-rect元素');
      assert.equal(views[1].page_referrer, views[0].page_location);

      await page.getByRole('link', { name: '圆角', exact: true }).last().click();
      await page.waitForFunction(() => location.hash.includes('id='));
      assert.equal((await pageViews()).length, 2);

      await page.getByRole('link', { name: '10.SVG circle元素', exact: true }).click();
      await page.waitForFunction(() => document.querySelector('.markdown-section h1')?.textContent === 'SVG circle元素');
      assert.equal((await pageViews()).length, 3);
      await page.goBack();
      await page.waitForFunction(() => document.querySelector('.markdown-section h1')?.textContent === 'SVG rect元素');
      views = await pageViews();
      assert.equal(views.length, 4);
      assert.equal(views[3].page_referrer, views[2].page_location);
      assert.equal(tagRequests.length, 1);
    });

    await t.test('opening a chapter directly records it once and preserves campaign parameters', async () => {
      await page.goto('https://svg.brucewar.cn/?utm_source=test#/36.SVG剪裁路径');
      await page.waitForFunction(() => document.querySelector('.markdown-section h1')?.textContent === 'SVG剪裁路径');
      const views = await pageViews();
      assert.equal(views.length, 1);
      assert.equal(decodeURI(views[0].page_location), 'https://svg.brucewar.cn/36.SVG剪裁路径?utm_source=test');
      assert.equal(await page.locator('.svg-demo > svg').count(), 8);
    });

    await t.test('local preview never loads Google Analytics', async () => {
      const requestsBefore = tagRequests.length;
      await page.goto('http://127.0.0.1:3000/');
      await page.waitForFunction(() => document.querySelector('.markdown-section h1')?.textContent === 'SVG入门教程');
      assert.equal(await page.evaluate(() => window.dataLayer), undefined);
      assert.equal(tagRequests.length, requestsBefore);
    });
    assert.deepEqual(errors, []);
  } finally {
    await browser.close();
  }
});
