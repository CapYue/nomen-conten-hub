/**
 * 小红书发布脚本
 * Usage: node xhs_publish.js "title" "content" "topics"
 */
const { chromium } = require('/workspace/pw/node_modules/playwright');
const fs = require('fs');

const title = process.argv[2] || '默认标题';
const content = process.argv[3] || '';
const topics = process.argv[4] || '';
const SESSION_FILE = '/workspace/pw/xhs_session.json';

(async () => {
  console.log('Publishing:', title);

  const browser = await chromium.launch({
    executablePath: '/workspace/browsers/chromium-1217/chrome-linux64/chrome',
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage', '--disable-gpu']
  });

  const ctx = await browser.newContext({
    storageState: SESSION_FILE,
    viewport: { width: 1280, height: 900 },
    userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  });
  const page = await ctx.newPage();
  page.setDefaultTimeout(30000);

  try {
    await page.goto('https://creator.xiaohongshu.com/publish/publish', { timeout: 30000 });
    await page.waitForTimeout(5000);
    console.log('URL:', page.url());

    if (page.url().includes('login')) {
      console.log('NOT_LOGGED_IN');
      await browser.close();
      process.exit(1);
    }

    await page.screenshot({ path: '/workspace/pw/pub_step1.png', fullPage: false });

    // 填标题
    await page.evaluate((t) => {
      const inputs = document.querySelectorAll('input');
      for (const el of inputs) {
        const r = el.getBoundingClientRect();
        if (r.width > 200 && el.type !== 'file') {
          el.focus(); el.value = t; el.dispatchEvent(new Event('input', { bubbles: true })); return;
        }
      }
    }, title);
    await page.waitForTimeout(1000);
    console.log('Title filled');

    // 填正文
    await page.evaluate((c) => {
      const els = document.querySelectorAll('[contenteditable="true"], textarea');
      for (const el of els) {
        const r = el.getBoundingClientRect();
        if (r.width > 300) { el.focus(); el.innerHTML = ''; el.innerText = c; el.dispatchEvent(new Event('input', { bubbles: true })); return; }
      }
    }, content + '\n\n' + topics);
    await page.waitForTimeout(1000);
    console.log('Content filled');

    await page.screenshot({ path: '/workspace/pw/pub_step2.png', fullPage: true });

    // 尝试点击发布
    try {
      const btn = await page.locator('button').filter({ hasText: '发布' }).first();
      if (await btn.isVisible({ timeout: 3000 })) {
        await btn.click();
        await page.waitForTimeout(5000);
        console.log('Publish button clicked');
      }
    } catch (e) {
      console.log('Publish btn not found:', e.message);
    }

    await page.screenshot({ path: '/workspace/pw/pub_final.png', fullPage: true });
    const text = await page.evaluate(() => document.body.innerText);
    const success = text.includes('发布成功') || text.includes('已发布') || text.includes('success');
    console.log(success ? 'PUBLISH_SUCCESS' : 'PUBLISH_DONE');

    await browser.close();
    process.exit(0);

  } catch (e) {
    console.error('ERROR:', e.message);
    await page.screenshot({ path: '/workspace/pw/pub_error.png' }).catch(() => {});
    await browser.close();
    process.exit(1);
  }
})();
