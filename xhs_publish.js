/**
 * 小红书发布脚本 - 本地化版本
 * 自动检测操作系统，使用本地 Chrome
 * 支持远程图片URL自动下载
 * 
 * Usage: node xhs_publish.js "标题" "正文" "图片URL,图片URL" "话题"
 */
const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');
const http = require('http');
const https = require('https');
const os = require('os');

// ── 平台检测 ─────────────────────────────────────────
function getChromePath() {
  const platform = process.platform;
  const home = os.homedir();
  
  if (platform === 'win32') {
    const paths = [
      'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
      'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
      path.join(home, 'AppData', 'Local', 'Google', 'Chrome', 'Application', 'chrome.exe'),
      path.join(home, 'AppData', 'Local', 'Google', 'Chrome', 'Application', 'chrome.exe'),
    ];
    for (const p of paths) {
      if (fs.existsSync(p)) return { exe: p, type: 'win32' };
    }
    return { exe: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe', type: 'win32' };
  }
  
  if (platform === 'darwin') {
    const p = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
    if (fs.existsSync(p)) return { exe: p, type: 'darwin' };
  }
  
  // Linux cloud
  if (fs.existsSync('/workspace/browsers/chromium-1217/chrome-linux64/chrome')) {
    return { exe: '/workspace/browsers/chromium-1217/chrome-linux64/chrome', type: 'linux' };
  }
  
  // Linux defaults
  const linuxPaths = ['/usr/bin/chromium', '/usr/bin/chromium-browser', '/usr/bin/google-chrome'];
  for (const p of linuxPaths) {
    if (fs.existsSync(p)) return { exe: p, type: 'linux' };
  }
  
  return { exe: '', type: platform };
}

function getSessionFile() {
  const platform = process.platform;
  if (platform === 'win32') {
    const dir = path.join(os.homedir(), 'nomad-data');
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    return path.join(dir, 'xhs_session.json');
  }
  if (process.env.USER === 'root' || platform === 'linux') {
    return '/workspace/pw/xhs_session.json';
  }
  return path.join(os.homedir(), 'nomad-data', 'xhs_session.json');
}

function getTmpDir() {
  const d = path.join(os.tmpdir(), 'nomad-xhs');
  if (!fs.existsSync(d)) fs.mkdirSync(d, { recursive: true });
  return d;
}

// ── 下载图片 ──────────────────────────────────────────
function downloadImage(url, destPath) {
  return new Promise((resolve, reject) => {
    if (!url || url.length < 10) { resolve(false); return; }
    
    const proto = url.startsWith('https') ? https : http;
    const file = fs.createWriteStream(destPath);
    
    proto.get(url, (res) => {
      if (res.statusCode === 301 || res.statusCode === 302) {
        file.close();
        downloadImage(res.headers.location, destPath).then(resolve).catch(reject);
        return;
      }
      res.pipe(file);
      file.on('finish', () => { file.close(); resolve(true); });
    }).on('error', (err) => {
      file.close();
      fs.unlink(destPath, () => {});
      reject(err);
    });
  });
}

async function ensureImageFile(imgUrl, index, tmpDir) {
  if (!imgUrl || imgUrl.length < 10) return null;
  
  const ext = path.extname(new URL(imgUrl).pathname) || '.png';
  const localPath = path.join(tmpDir, `upload_${index}${ext}`);
  
  try {
    await downloadImage(imgUrl, localPath);
    const stat = fs.statSync(localPath);
    if (stat.size > 1000) return localPath;
  } catch(e) {
    console.log(`Download failed for ${imgUrl}: ${e.message}`);
  }
  return null;
}

// ── 主要发布函数 ─────────────────────────────────────
async function publishToXHS({ title, content, images, topics }) {
  const chrome = getChromePath();
  const sessionFile = getSessionFile();
  const tmpDir = getTmpDir();
  
  console.log(`[发布] Chrome: ${chrome.exe} (${chrome.type})`);
  console.log(`[发布] Session: ${sessionFile}`);
  console.log(`[发布] Session exists: ${fs.existsSync(sessionFile)}`);
  console.log(`[发布] 标题: ${title}`);
  console.log(`[发布] 图片数: ${(images || []).length}`);
  
  // 准备图片文件
  const imageFiles = [];
  for (let i = 0; i < (images || []).length; i++) {
    const img = images[i];
    if (img) {
      // 如果是本地文件直接使用
      if (fs.existsSync(img)) {
        imageFiles.push(img);
        console.log(`[发布] 使用本地图片: ${img}`);
      } else {
        // 下载远程图片
        const local = await ensureImageFile(img, i, tmpDir);
        if (local) {
          imageFiles.push(local);
          console.log(`[发布] 已下载远程图片: ${local}`);
        } else {
          console.log(`[发布] 跳过无效图片: ${img}`);
        }
      }
    }
  }
  
  const browserArgs = [
    '--no-sandbox',
    '--disable-setuid-sandbox',
    '--disable-dev-shm-usage',
    '--disable-gpu',
  ];
  
  if (chrome.type === 'win32') {
    // Windows: 使用用户自己的 Chrome（已登录状态）
    browserArgs.push(
      `--user-data-dir=${path.join(os.homedir(), 'AppData', 'Local', 'Google', 'Chrome', 'User Data')}`,
      '--profile-directory=Default'
    );
  } else if (chrome.type === 'darwin') {
    browserArgs.push(
      `--user-data-dir=${path.join(os.homedir(), 'Library', 'Application Support', 'Google', 'Chrome')}`,
      '--profile-directory=Default'
    );
  }
  
  console.log(`[发布] 启动浏览器: ${chrome.exe}`);
  
  const browser = await chromium.launch({
    executablePath: fs.existsSync(chrome.exe) ? chrome.exe : undefined,
    headless: false,  // 有头模式，可以看到浏览器自动操作
    args: browserArgs,
    timeout: 30000,
  });

  let context;
  try {
    // 尝试使用 session（如果存在且有效）
    if (fs.existsSync(sessionFile)) {
      try {
        context = await browser.newContext({
          storageState: sessionFile,
          viewport: { width: 1280, height: 900 },
          userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        });
        console.log('[发布] 使用已保存的登录session');
      } catch(e) {
        console.log('[发布] Session无效，创建新context:', e.message);
        context = await browser.newContext({
          viewport: { width: 1280, height: 900 },
          userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        });
      }
    } else {
      context = await browser.newContext({
        viewport: { width: 1280, height: 900 },
        userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      });
      console.log('[发布] 无session，使用新context（需要手动登录）');
    }
  } catch(e) {
    console.log('[发布] 创建context失败:', e.message);
    context = await browser.newContext({
      viewport: { width: 1280, height: 900 },
    });
  }

  const page = await context.newPage();
  page.setDefaultTimeout(60000);

  try {
    // 1. 打开发布页
    console.log('[发布] 打开小红书创作者中心...');
    await page.goto('https://creator.xiaohongshu.com/publish/publish', { timeout: 30000, waitUntil: 'networkidle' });
    await page.waitForTimeout(5000);
    
    const url = page.url();
    console.log('[发布] 当前URL:', url);
    
    // 检测是否需要登录
    if (url.includes('login') || url.includes('account')) {
      console.log('[发布] 需要登录！请手动扫码登录...');
      
      // 点击二维码登录
      try {
        await page.mouse.click(640, 450); // 尝试点击二维码区域中心
        await page.waitForTimeout(2000);
      } catch(e) {}
      
      await page.screenshot({ path: path.join(tmpDir, 'need_login.png'), fullPage: false });
      console.log('[发布] 截图已保存到:', path.join(tmpDir, 'need_login.png'));
      console.log('[发布] 请用小红书App扫码登录，然后手动发布');
      
      // 保存session供下次使用
      await context.storageState({ path: sessionFile }).catch(() => {});
      console.log('[发布] Session已保存:', sessionFile);
      
      await browser.close();
      return { success: false, reason: 'need_login', hint: '请手动扫码登录后重试' };
    }

    // 2. 截图确认页面
    await page.screenshot({ path: path.join(tmpDir, 'step1_publish_page.png'), fullPage: false });
    console.log('[发布] 发布页已加载，截图保存');

    // 3. 填写标题
    const titleSet = await page.evaluate((t) => {
      const inputs = document.querySelectorAll('input');
      for (const el of inputs) {
        const r = el.getBoundingClientRect();
        if (r.width > 200 && el.type !== 'file' && el.type !== 'checkbox') {
          el.focus();
          el.value = '';
          el.value = t;
          el.dispatchEvent(new Event('input', { bubbles: true }));
          el.dispatchEvent(new Event('change', { bubbles: true }));
          return 'done:' + el.className.substring(0, 30);
        }
      }
      return 'not_found';
    }, title);
    console.log('[发布] 标题填写:', titleSet);
    await page.waitForTimeout(1000);

    // 4. 填写正文（contenteditable）
    const contentSet = await page.evaluate((c) => {
      const editors = document.querySelectorAll('[contenteditable="true"]');
      for (const el of editors) {
        const r = el.getBoundingClientRect();
        if (r.width > 300 && r.y > 100) {
          el.focus();
          el.innerHTML = '';
          el.innerText = c;
          el.dispatchEvent(new Event('input', { bubbles: true }));
          el.dispatchEvent(new Event('change', { bubbles: true }));
          return 'done:' + el.className.substring(0, 30);
        }
      }
      return 'not_found';
    }, content + '\n\n' + (topics || ''));
    console.log('[发布] 正文填写:', contentSet);
    await page.waitForTimeout(2000);
    await page.screenshot({ path: path.join(tmpDir, 'step2_content_filled.png'), fullPage: true });

    // 5. 上传图片
    if (imageFiles.length > 0) {
      console.log('[发布] 上传图片...');
      try {
        const fileInput = await page.locator('input[type="file"]').first();
        await fileInput.setInputFiles(imageFiles);
        console.log(`[发布] 已选择 ${imageFiles.length} 张图片`);
        await page.waitForTimeout(4000); // 等待图片上传
        await page.screenshot({ path: path.join(tmpDir, 'step3_images_uploaded.png'), fullPage: true });
      } catch(e) {
        console.log('[发布] 图片上传失败:', e.message);
      }
    }

    await page.waitForTimeout(3000);
    
    // 6. 点击发布按钮（多种策略）
    let published = false;
    
    // 策略1：找包含"发布"的button
    try {
      const publishBtn = page.locator('button').filter({ hasText: '发布' }).first();
      if (await publishBtn.isVisible({ timeout: 3000 })) {
        await publishBtn.click();
        published = true;
        console.log('[发布] 点击了「发布」按钮（策略1）');
      }
    } catch(e) {}
    
    // 策略2：找主要操作按钮
    if (!published) {
      try {
        const mainBtn = await page.evaluate(() => {
          const btns = Array.from(document.querySelectorAll('button'));
          // 找最大/最显眼的按钮
          let best = null;
          for (const b of btns) {
            const r = b.getBoundingClientRect();
            const text = b.innerText?.trim();
            if (r.width > 60 && r.height > 30 && r.y > 0 && (text === '发布' || text.includes('发布'))) {
              if (!best || r.width > best.r.width) best = { b, r, text };
            }
          }
          if (best) { best.b.click(); return 'clicked:' + best.text; }
          return 'not_found';
        });
        if (mainBtn.startsWith('clicked')) {
          published = true;
          console.log('[发布] 点击了发布按钮（策略2）:', mainBtn);
        }
      } catch(e) {}
    }
    
    // 策略3：按回车键提交
    if (!published) {
      await page.keyboard.press('Enter');
      published = true;
      console.log('[发布] 按下回车键提交');
    }
    
    await page.waitForTimeout(5000);
    await page.screenshot({ path: path.join(tmpDir, 'step4_final.png'), fullPage: true });
    
    // 7. 判断发布结果
    const finalText = await page.evaluate(() => document.body.innerText);
    const finalUrl = page.url();
    
    let result = 'unknown';
    if (finalUrl.includes('success') || finalUrl.includes('published')) result = 'url_success';
    else if (finalText.includes('发布成功') || finalText.includes('已发布') || finalText.includes('发布成功')) result = 'text_success';
    else if (finalUrl.includes('creator') && !finalUrl.includes('publish')) result = 'redirected';
    
    console.log('[发布] 最终URL:', finalUrl);
    console.log('[发布] 结果判断:', result);
    
    // 保存session
    await context.storageState({ path: sessionFile }).catch(() => {});
    console.log('[发布] Session已更新');
    
    await page.screenshot({ path: path.join(tmpDir, 'publish_result.png'), fullPage: true });
    console.log('[发布] 最终截图已保存');
    
    await browser.close();
    
    return {
      success: result !== 'unknown',
      result,
      url: finalUrl,
      screenshot: path.join(tmpDir, 'publish_result.png'),
      message: result !== 'unknown' ? '🎉 发布成功！' : '⚠️ 发布完成，请手动确认'
    };

  } catch(e) {
    console.error('[发布] 错误:', e.message);
    try {
      await page.screenshot({ path: path.join(tmpDir, 'error.png'), fullPage: true }).catch(() => {});
    } catch {}
    await browser.close();
    return { success: false, reason: e.message };
  }
}

// ── 入口 ─────────────────────────────────────────────
const title = process.argv[2] || '默认标题';
const content = process.argv[3] || '';
const imagesArg = process.argv[4] || '';
const topics = process.argv[5] || '';

// 解析图片参数（逗号分隔的URL或本地路径）
const images = imagesArg.split(',').filter(s => s.trim().length > 5);

(async () => {
  console.log('═'.repeat(50));
  console.log('  小红书自动发布 v3.0（本地化版）');
  console.log('═'.repeat(50));
  
  const result = await publishToXHS({ title, content, images, topics });
  
  console.log('═'.repeat(50));
  console.log('发布结果:', JSON.stringify(result, null, 2));
  console.log('═'.repeat(50));
  
  process.exit(result.success ? 0 : 1);
})().catch(e => {
  console.error('FATAL:', e);
  process.exit(1);
});
