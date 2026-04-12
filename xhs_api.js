/**
 * 小红书自动发布 API 服务器 v2 (fixed)
 * HTTP 3002 | HTTPS 1443
 * Playwright + 云端 Chromium
 */
const https = require('https');
const http = require('http');
const fs = require('fs');
const { execSync, spawn } = require('child_process');

const PORT_HTTP = 3003;
const PORT_HTTPS = 1444;
const CHROME = '/workspace/browsers/chromium-1217/chrome-linux64/chrome';
const SESSION_FILE = './xhs_session.json';
const LOGIN_SCRIPT = './xhs_login.js';
const PUBLISH_SCRIPT = './xhs_publish.js';

function log(msg) { console.log(`[${new Date().toISOString()}] ${msg}`); }

function checkLogin() {
    if (!fs.existsSync(SESSION_FILE)) return { loggedIn: false };
    const stat = fs.statSync(SESSION_FILE);
    const ageDays = Math.round((Date.now() - stat.mtimeMs) / 1000 / 60 / 60 / 24);
    return { loggedIn: true, sessionAgeDays: ageDays, expiresIn: Math.max(0, 7 - ageDays) + ' days' };
}

// 后台运行登录（spawn，不阻塞）
function startLogin() {
    const child = spawn('node', [LOGIN_SCRIPT], { detached: true, stdio: 'ignore' });
    child.unref();
    log('Login script started, pid=' + child.pid);
}

// 同步运行发布脚本（带超时）
function runPublish({ title, content, images, topics }) {
    const args = [PUBLISH_SCRIPT, title, content + '\\n\\n' + (topics || '')];
    log('Running publish: ' + title);
    try {
        const result = execSync(`node ${PUBLISH_SCRIPT} "${title.replace(/"/g, '\\"')}" "${content.replace(/"/g, '\\"').substring(0, 200)}" "${(topics || '').replace(/"/g, '\\"')}"`, {
            maxBuffer: 10 * 1024 * 1024,
            timeout: 120000,
            cwd: '.'
        });
        const out = result.toString();
        log('Publish output: ' + out.trim());
        return out;
    } catch (e) {
        const out = (e.stdout || '').toString() + (e.stderr || '').toString();
        log('Publish error: ' + out);
        return out;
    }
}

function handleRequest(req, res) {
    const cors = { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Methods': 'GET, POST, OPTIONS', 'Access-Control-Allow-Headers': 'Content-Type' };
    if (req.method === 'OPTIONS') { res.writeHead(204, cors); res.end(); return; }

    // GET /api/status
    if (req.method === 'GET' && req.url === '/api/status') {
        const login = checkLogin();
        res.writeHead(200, { ...cors, 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ ok: true, version: '2.1', ...login, chromePath: fs.existsSync(CHROME) ? 'found' : 'missing', qrExists: fs.existsSync('./xhs_login_qr.png'), lastCheck: new Date().toISOString() }));
        return;
    }

    // GET /api/qr
    if (req.method === 'GET' && req.url.startsWith('/api/qr')) {
        const qrFile = './xhs_login_qr.png';
        if (fs.existsSync(qrFile)) {
            res.writeHead(200, { ...cors, 'Content-Type': 'image/png' });
            fs.createReadStream(qrFile).pipe(res);
        } else {
            res.writeHead(404, { ...cors, 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ ok: false, reason: 'QR not ready. POST /api/action with action=login first.' }));
        }
        return;
    }

    // POST /api/action
    if (req.method === 'POST' && req.url === '/api/action') {
        let body = '';
        req.on('data', d => body += d);
        req.on('end', () => {
            res.setHeader('Content-Type', 'application/json');
            try {
                const { action } = JSON.parse(body);
                if (action === 'login') {
                    res.writeHead(200, cors);
                    res.end(JSON.stringify({ ok: true, message: 'Login started. Poll /api/status for qrExists. Then wait for loggedIn=true.' }));
                    startLogin();
                    return;
                }
                if (action === 'status' || action === 'ping') {
                    const login = checkLogin();
                    res.writeHead(200, { ...cors, 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ ok: true, ...login, qrExists: fs.existsSync('./xhs_login_qr.png') }));
                    return;
                }
                res.writeHead(400, cors);
                res.end(JSON.stringify({ ok: false, reason: 'unknown action' }));
            } catch (e) { res.writeHead(500, cors); res.end(JSON.stringify({ ok: false, reason: e.message })); }
        });
        return;
    }

    // POST /api/publish
    if (req.method === 'POST' && req.url === '/api/publish') {
        let body = '';
        req.on('data', d => body += d);
        req.on('end', () => {
            res.setHeader('Content-Type', 'application/json');
            try {
                const { title, content, images, topics } = JSON.parse(body);
                if (!title || !content) { res.writeHead(400, cors); res.end(JSON.stringify({ ok: false, reason: 'title+content required' })); return; }

                const login = checkLogin();
                if (!login.loggedIn) {
                    res.writeHead(200, cors);
                    res.end(JSON.stringify({ ok: false, reason: 'not_logged_in', message: 'Call POST /api/action action=login first' }));
                    return;
                }

                log(`Publishing: ${title}`);
                res.writeHead(200, cors);
                res.end(JSON.stringify({ ok: true, status: 'publishing', title }));

                // 后台执行，不阻塞
                const imagePath = images && images.length > 0 ? images[0] : '';
                spawn('node', [PUBLISH_SCRIPT, title, content, topics || '', imagePath], {
                    detached: true, stdio: 'ignore', cwd: '.'
                }).unref();

            } catch (e) { res.writeHead(500, cors); res.end(JSON.stringify({ ok: false, reason: e.message })); }
        });
        return;
    }

    res.writeHead(404, cors);
    res.end(JSON.stringify({ ok: false, endpoints: ['/api/status', '/api/qr', '/api/action', '/api/publish'] }));
}

// 启动
const httpServer = http.createServer(handleRequest);
httpServer.listen(PORT_HTTP, '0.0.0.0', () => log(`HTTP API: http://0.0.0.0:${PORT_HTTP}`));

if (fs.existsSync('./cert.pem') && fs.existsSync('./key.pem')) {
    https.createServer({ cert: fs.readFileSync('./cert.pem'), key: fs.readFileSync('./key.pem') }, handleRequest)
        .listen(PORT_HTTPS, '0.0.0.0', () => log(`HTTPS API: https://0.0.0.0:${PORT_HTTPS}`));
}

log('XHS API v2.1 started');
log('Scripts: login=' + LOGIN_SCRIPT + ' publish=' + PUBLISH_SCRIPT);
