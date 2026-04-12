/**
 * 豆包 AI 生图 API 服务器
 * 使用 Playwright 控制豆包网页版生成图片
 * POST /api/generate  {"prompt": "描述词"}  → 返回图片URL
 * GET  /api/status  → 登录状态
 * POST /api/login   → 触发扫码登录
 * GET  /api/qr      → 返回登录二维码
 */
const http = require('http');
const fs = require('fs');
const { spawn } = require('child_process');

const PORT = 3004;
const DOUBAO_URL = 'https://www.doubao.com/chat/';
const SESSION_FILE = './doubao_session.json';
const QR_FILE = './doubao_qr.png';
const LOG_FILE = './doubao.log';

const CHROME = '/workspace/browsers/chromium-1217/chrome-linux64/chrome';

function log(msg) {
    console.log(`[${new Date().toISOString()}] ${msg}`);
    fs.appendFileSync(LOG_FILE, `[${new Date().toISOString()}] ${msg}\n`);
}

function checkLogin() {
    if (!fs.existsSync(SESSION_FILE)) return { loggedIn: false, reason: 'no_session' };
    const stat = fs.statSync(SESSION_FILE);
    const ageDays = Math.round((Date.now() - stat.mtimeMs) / 1000 / 60 / 60 / 24);
    return { loggedIn: true, sessionAgeDays: ageDays, expiresIn: Math.max(0, 7 - ageDays) + ' days' };
}

// 执行豆包生图（写入临时脚本文件，避免shell转义）
async function generateImage(prompt) {
    const scriptFile = './doubao_gen_tmp.js';
    const script = `
const { chromium } = require('playwright');
const fs = require('fs');

(async () => {
  const prompt = ${JSON.stringify(prompt)};
  const imgOut = './doubao_output.png';
  
  const browser = await chromium.launch({
    channel: 'msedge',
    headless: true,
    args: ['--no-sandbox','--disable-setuid-sandbox','--disable-dev-shm-usage','--disable-gpu']
  });
  
  const ctx = await browser.newContext({
    storageState: '${SESSION_FILE}',
    viewport: { width: 1280, height: 900 },
    userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
  });
  
  const page = await ctx.newPage();
  page.setDefaultTimeout(60000);
  
  try {
    // 1. 打开豆包聊天页
    await page.goto('${DOUBAL_URL}', { timeout: 30000 });
    await page.waitForTimeout(3000);
    
    if (page.url().includes('login')) {
      console.log('NOT_LOGGED_IN');
      await browser.close(); return;
    }
    
    // 2. 点击"图像生成"工具条
    await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const imgBtn = btns.find(b => b.innerText && b.innerText.includes('图像生成'));
      if (imgBtn) imgBtn.click();
    });
    await page.waitForTimeout(2000);
    await page.screenshot({ path: './doubao_step1.png', fullPage: false });
    
    // 3. 找到输入框并填写prompt
    // 尝试多种选择器
    const filled = await page.evaluate((p) => {
      // 方法1: contenteditable div
      const editors = document.querySelectorAll('[contenteditable="true"]');
      for (const el of editors) {
        const r = el.getBoundingClientRect();
        if (r.width > 300 && r.y > 600) {
          el.focus();
          el.innerHTML = '';
          el.innerText = p;
          el.dispatchEvent(new Event('input', { bubbles: true }));
          el.dispatchEvent(new Event('change', { bubbles: true }));
          return 'filled:' + el.className.substring(0, 30);
        }
      }
      // 方法2: 查找含"发消息"的placeholder
      const textareas = document.querySelectorAll('textarea, input');
      for (const el of textareas) {
        const r = el.getBoundingClientRect();
        if (r.width > 300 && r.y > 600) {
          el.focus();
          el.value = p;
          el.dispatchEvent(new Event('input', { bubbles: true }));
          return 'filled_input:' + el.className.substring(0, 30);
        }
      }
      return 'not_found';
    }, prompt);
    
    console.log('Fill result:', filled);
    await page.waitForTimeout(1000);
    await page.screenshot({ path: './doubao_step2.png', fullPage: false });
    
    // 4. 发送：点击左下角发送按钮 (392, 834)
    const sent = await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      // 找最小的那个（发送按钮通常36x36）
      let sendBtn = btns.find(b => {
        const r = b.getBoundingClientRect();
        return r.width >= 30 && r.width <= 45 && r.y > 800 && r.y < 880 && r.x < 400;
      });
      if (sendBtn) { sendBtn.click(); return 'sent:' + sendBtn.className.substring(0, 30); }
      return 'send_btn_not_found';
    });
    console.log('Send:', sent);
    await page.waitForTimeout(500);
    
    // 5. 按回车键作为备用发送
    await page.keyboard.press('Enter');
    await page.waitForTimeout(3000);
    await page.screenshot({ path: './doubao_step3.png', fullPage: false });
    
    // 6. 等待图片结果出现（最多60秒）
    console.log('Waiting for image result...');
    let imgUrl = null;
    for (let i = 0; i < 30; i++) {
      await page.waitForTimeout(2000);
      const imgs = await page.evaluate(() => {
        return Array.from(document.querySelectorAll('img')).filter(i => {
          const r = i.getBoundingClientRect();
          return i.width > 200 && i.height > 200 && r.y > 100 && r.y < 700;
        }).map(i => ({ src: i.src, w: i.width, h: i.height }));
      });
      
      // 找最新的/最大的图片
      if (imgs.length > 0) {
        // 优先选宽度>=高度（横向图）或最右侧的图片（最新生成的）
        const target = imgs.sort((a, b) => b.w - a.w)[0];
        if (target && target.src && !target.src.includes('data:') && target.src.length > 100) {
          imgUrl = target.src;
          console.log('Found image:', imgUrl.substring(0, 80));
          break;
        }
      }
      console.log('Attempt ' + (i+1) + ': ' + imgs.length + ' images found, waiting...');
    }
    
    await page.screenshot({ path: './doubao_step4.png', fullPage: true });
    
    if (imgUrl) {
      // 下载图片
      try {
        const imgResp = await page.evaluate(async (src) => {
          const r = await fetch(src);
          const buf = await r.arrayBuffer();
          require('fs').writeFileSync('./doubao_output.png', Buffer.from(buf));
          return 'saved';
        }, imgUrl);
        console.log('IMG_URL:' + imgUrl);
        console.log('RESULT:SUCCESS');
      } catch(e) {
        console.log('IMG_URL:' + imgUrl);
        console.log('DOWNLOAD_ERROR:' + e.message);
        console.log('RESULT:PARTIAL');
      }
    } else {
      console.log('RESULT:NO_IMAGE');
    }
    
    await browser.close();
    process.exit(0);
    
  } catch(e) {
    console.log('ERROR:' + e.message);
    await page.screenshot({ path: './doubao_error.png' }).catch(()=>{});
    await browser.close();
    process.exit(1);
  }
})();
`;

    fs.writeFileSync(scriptFile, script);

    return new Promise((resolve) => {
        const child = spawn('node', [scriptFile], {
            cwd: '.',
            timeout: 120000,
        });

        let out = '';
        child.stdout.on('data', d => { out += d.toString(); process.stdout.write(d); });
        child.stderr.on('data', d => process.stderr.write(d));

        child.on('close', (code) => {
            out = out.toString();
            log('generateImage output: ' + out.substring(0, 300));

            // 下载到了图片
            if (fs.existsSync('./doubao_output.png')) {
                const stat = fs.statSync('./doubao_output.png');
                if (stat.size > 5000) {
                    // 上传到CDN
                    const { execSync } = require('child_process');
                    try {
                        execSync('cp ./doubao_output.png ./public/covers/doubao_latest.png');
                    } catch (e) { }
                    resolve({ success: true, file: './doubao_output.png', local: './public/covers/doubao_latest.png', detail: 'generated_by_doubao' });
                    return;
                }
            }

            if (out.includes('NOT_LOGGED_IN')) { resolve({ success: false, reason: 'not_logged_in' }); return; }
            if (out.includes('RESULT:NO_IMAGE')) { resolve({ success: false, reason: 'no_image_generated' }); return; }
            if (out.includes('ERROR:')) { resolve({ success: false, reason: 'execution_error', detail: out.substring(0, 200) }); return; }
            resolve({ success: false, reason: 'unknown', detail: out.substring(0, 200) });
        });
    });
}

// 豆包登录流程
async function runLogin() {
    const scriptFile = './doubao_login_tmp.js';
    const script = `
const { chromium } = require('playwright');
const fs = require('fs');

(async () => {
  const browser = await chromium.launch({
    channel: 'msedge',
    headless: true,
    args: ['--no-sandbox','--disable-setuid-sandbox','--disable-dev-shm-usage','--disable-gpu']
  });
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 } });
  const page = await ctx.newPage();
  
  await page.goto('${DOUBAL_URL}', { timeout: 30000 });
  await page.waitForTimeout(5000);
  await page.screenshot({ path: './doubao_login_page.png', fullPage: false });
  
  // 点击登录按钮
  const loginClicked = await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    const loginBtn = btns.find(b => b.innerText && b.innerText.trim() === '登录');
    if (loginBtn) { loginBtn.click(); return 'clicked'; }
    return 'not_found';
  });
  console.log('Login btn:', loginClicked);
  await page.waitForTimeout(5000);
  
  // 截取登录页/二维码
  await page.screenshot({ path: './doubao_login_after.png', fullPage: false });
  
  // 找二维码图片
  const qrData = await page.evaluate(() => {
    const imgs = Array.from(document.querySelectorAll('img'));
    console.log('All imgs count:', imgs.length);
    // 找大尺寸二维码图
    const qr = imgs.find(i => (i.width === 160 || i.width === 200 || i.width === 180) && i.height === i.width);
    if (qr) return qr.src;
    // 找包含qr/登录/qrcode的图
    const qr2 = imgs.find(i => i.src.includes('qr') || i.alt?.includes('qr') || i.alt?.includes('QR'));
    if (qr2) return qr2.src;
    return null;
  });
  
  if (qrData) {
    const base64 = qrData.replace(/^data:image\\/png;base64,/, '').replace(/^data:image\\/jpeg;base64,/, '');
    if (base64.length > 500) {
      fs.writeFileSync('${QR_FILE}', Buffer.from(base64, 'base64'));
      console.log('QR_SAVED');
    }
  }
  
  // 等待登录完成
  let attempts = 0;
  while (attempts < 60) {
    await page.waitForTimeout(5000);
    const url = page.url();
    if (!url.includes('login') && !url.includes('/account/')) {
      console.log('LOGIN_SUCCESS at', url);
      await ctx.storageState({ path: '${SESSION_FILE}' });
      await browser.close();
      process.exit(0);
    }
    attempts++;
    console.log('Waiting for login... attempt', attempts);
  }
  
  console.log('LOGIN_TIMEOUT');
  await browser.close();
  process.exit(0);
})().catch(e => { console.log('FATAL:', e.message); process.exit(1); });
`;

    fs.writeFileSync(scriptFile, script);

    return new Promise((resolve) => {
        const child = spawn('node', [scriptFile], {
            cwd: '.',
            timeout: 180000,
        });
        let out = '';
        child.stdout.on('data', d => { out += d.toString(); process.stdout.write(d); });
        child.stderr.on('data', d => process.stderr.write(d));
        child.on('close', (code) => {
            const loggedIn = fs.existsSync(SESSION_FILE);
            resolve({ done: true, success: loggedIn, qrReady: fs.existsSync(QR_FILE), output: out.substring(0, 300) });
        });
    });
}

// HTTP 服务器
function handleRequest(req, res) {
    const cors = { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Methods': 'GET, POST, OPTIONS', 'Access-Control-Allow-Headers': 'Content-Type' };
    if (req.method === 'OPTIONS') { res.writeHead(204, cors); res.end(); return; }

    // GET /api/status
    if (req.method === 'GET' && req.url === '/api/status') {
        const login = checkLogin();
        res.writeHead(200, { ...cors, 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ ok: true, version: '1.0', ...login, chromePath: fs.existsSync(CHROME) ? 'found' : 'missing', qrExists: fs.existsSync(QR_FILE) }));
        return;
    }

    // GET /api/qr → 二维码PNG
    if (req.method === 'GET' && req.url.startsWith('/api/qr')) {
        if (fs.existsSync(QR_FILE)) {
            res.writeHead(200, { ...cors, 'Content-Type': 'image/png' });
            fs.createReadStream(QR_FILE).pipe(res);
        } else {
            res.writeHead(404, { ...cors, 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ ok: false, reason: 'Call POST /api/login first' }));
        }
        return;
    }

    // POST /api/login
    if (req.method === 'POST' && req.url === '/api/login') {
        res.setHeader('Content-Type', 'application/json');
        res.writeHead(200, cors);
        res.end(JSON.stringify({ ok: true, message: 'Login started. Poll /api/status and GET /api/qr in ~20s' }));
        runLogin().then(r => log('Login result: ' + JSON.stringify(r)));
        return;
    }

    // POST /api/generate
    if (req.method === 'POST' && req.url === '/api/generate') {
        let body = '';
        req.on('data', d => body += d);
        req.on('end', async () => {
            res.setHeader('Content-Type', 'application/json');
            try {
                const { prompt } = JSON.parse(body);
                if (!prompt) { res.writeHead(400, cors); res.end(JSON.stringify({ ok: false, reason: 'prompt required' })); return; }

                const login = checkLogin();
                if (!login.loggedIn) {
                    res.writeHead(200, cors);
                    res.end(JSON.stringify({ ok: false, reason: 'not_logged_in' }));
                    return;
                }

                log('Generating image with prompt: ' + prompt.substring(0, 50));
                res.writeHead(200, cors);
                res.end(JSON.stringify({ ok: true, status: 'generating', prompt: prompt.substring(0, 100) }));

                const result = await generateImage(prompt);
                fs.writeFileSync('./last_doubao_result.json', JSON.stringify(result));

            } catch (e) {
                res.writeHead(500, cors);
                res.end(JSON.stringify({ ok: false, reason: e.message }));
            }
        });
        return;
    }

    // GET /api/result
    if (req.method === 'GET' && req.url === '/api/result') {
        res.setHeader('Content-Type', 'application/json');
        if (fs.existsSync('./last_doubao_result.json')) {
            res.writeHead(200, cors);
            res.end(fs.readFileSync('./last_doubao_result.json'));
        } else {
            res.writeHead(200, cors);
            res.end(JSON.stringify({ ok: true, result: null }));
        }
        return;
    }

    res.writeHead(404, cors);
    res.end(JSON.stringify({ ok: false, endpoints: ['GET /api/status', 'GET /api/qr', 'POST /api/login', 'POST /api/generate', 'GET /api/result'] }));
}

const server = http.createServer(handleRequest);
server.listen(PORT, '0.0.0.0', () => {
    log(`Doubao API started on port ${PORT}`);
    log(`Session: ${SESSION_FILE}`);
});

process.on('uncaughtException', e => { console.error('uncaughtException:', e); });
