/**
 * 小红书登录脚本 - 写入临时文件执行，避免 shell 转义问题
 */
const { chromium } = require('playwright');
const fs = require('fs');

(async () => {
  const SESSION_FILE = './xhs_session.json';
  const QR_FILE = './xhs_login_qr.png';

  console.log('Starting login...');
  const browser = await chromium.launch({
    channel: 'msedge',
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage', '--disable-gpu']
  });

  const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 } });
  const page = await ctx.newPage();

  try {
    await page.goto('https://creator.xiaohongshu.com/login', { timeout: 30000 });
    console.log('Login page loaded');
    await page.waitForTimeout(6000);

    // 点击右上角切换到二维码
    await page.mouse.click(1140, 290);
    await page.waitForTimeout(4000);

    // 截图登录页
    await page.screenshot({ path: './login_page_full.png', fullPage: false });
    console.log('Screenshot saved');

    // 提取二维码
    const qrData = await page.evaluate(() => {
      const imgs = Array.from(document.querySelectorAll('img'));
      console.log('All images:', imgs.map(i => ({ w: i.width, h: i.height, src: i.src.substring(0, 30) })));
      // 找160x160或200x200的二维码图
      const qr = imgs.find(i => (i.width === 160 || i.width === 200) && i.height === i.width);
      return qr ? qr.src : null;
    });

    if (qrData) {
      const base64 = qrData.replace(/^data:image\/png;base64,/, '');
      fs.writeFileSync(QR_FILE, Buffer.from(base64, 'base64'));
      console.log('QR saved: ' + QR_FILE);
    } else {
      console.log('QR not found on page');
      await page.screenshot({ path: './login_noqr.png', fullPage: false });
    }

    // 等待登录完成
    console.log('Waiting for login (max 5 minutes)...');
    let attempts = 0;
    while (attempts < 60) {
      await page.waitForTimeout(5000);
      const url = page.url();
      console.log('Current URL:', url);
      if (!url.includes('login')) {
        console.log('Login detected!');
        await ctx.storageState({ path: SESSION_FILE });
        console.log('Session saved. LOGIN_SUCCESS');
        await browser.close();
        process.exit(0);
      }
      attempts++;
    }

    console.log('Timeout. LOGIN_TIMEOUT');
    await browser.close();
    process.exit(0);

  } catch (e) {
    console.error('Error:', e.message);
    await page.screenshot({ path: './login_error.png' }).catch(() => {});
    await browser.close();
    process.exit(1);
  }
})();
