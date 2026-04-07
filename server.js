#!/usr/bin/env node
/**
 * Nomad Content Hub - Image Generation Server
 * Calls image_synthesize tool via OpenClaw gateway and saves result
 * 
 * Usage: node server.js
 * Runs on port 3001
 */

const http = require('http');
const url = require('url');
const path = require('path');
const fs = require('fs');
const { spawn } = require('child_process');

const PORT = 3001;
const DIST_DIR = path.join(__dirname, 'dist');
const COVERS_DIR = path.join(__dirname, 'public', 'covers');

// Ensure directories exist
[COVERS_DIR, DIST_DIR].forEach(d => { if (!fs.existsSync(d)) fs.mkdirSync(d, { recursive: true }); }

// ─── Call image_synthesize via OpenClaw gateway ────────────────
// The gateway exposes tool calls via HTTP POST to the relay endpoint
async function callImageSynthesize(prompt, outputPath) {
  return new Promise((resolve, reject) => {
    // Try gateway relay HTTP endpoint
    const postData = JSON.stringify({
      method: 'tools/call',
      params: {
        name: 'image_synthesize',
        arguments: {
          requests: [{
            prompt,
            output_file: outputPath,
            aspect_ratio: '9:16',
            resolution: '2K'
          }]
        }
      }
    });

    const options = {
      hostname: '127.0.0.1',
      port: 18792,
      path: '/',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer minimax-agent',
        'Content-Length': Buffer.byteLength(postData)
      },
      timeout: 90000
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          resolve(parsed);
        } catch(e) {
          reject(new Error('Failed to parse response: ' + data));
        }
      });
    });

    req.on('error', (e) => reject(e));
    req.on('timeout', () => { req.destroy(); reject(new Error('Request timeout')); });
    req.write(postData);
    req.end();
  });
}

// ─── Call image_synthesize via openclaw CLI ───────────────────
async function callViaCli(prompt, outputPath) {
  return new Promise((resolve, reject) => {
    const args = [
      'invoke', 'image_synthesize',
      '--prompt', prompt,
      '--output', outputPath,
      '--aspect_ratio', '9:16',
      '--resolution', '2K'
    ];
    const child = spawn('openclaw', args, { timeout: 90000 });
    let out = '', err = '';
    child.stdout.on('data', d => out += d);
    child.stderr.on('data', d => err += d);
    child.on('close', code => {
      if (code === 0) resolve({ ok: true, out });
      else reject(new Error('CLI error: ' + err));
    });
    child.on('error', e => reject(e));
  });
}

// ─── HTTP Server ───────────────────────────────────────────────
const server = http.createServer(async (req, res) => {
  const parsed = url.parse(req.url, true);
  const pathname = parsed.pathname;
  const method = req.method;

  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (method === 'OPTIONS') { res.writeHead(204); res.end(); return; }

  // Health check
  if (pathname === '/api/health') {
    const covers = fs.readdirSync(COVERS_DIR).filter(f => f.endsWith('.png') || f.endsWith('.jpg'));
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ ok: true, covers: covers.length }));
    return;
  }

  // Generate image
  if (pathname === '/api/generate' && method === 'POST') {
    let body = '';
    req.on('data', c => body += c);
    req.on('end', async () => {
      try {
        const { prompt, topicId, index } = JSON.parse(body || '{}');
        if (!prompt) { res.writeHead(400); res.end('{"error":"prompt required"}'); return; }

        const filename = `topic_${topicId || 'gen'}_${index || 0}_${Date.now()}.png`;
        const outputPath = path.join(COVERS_DIR, filename);

        // Try gateway relay first, then CLI
        let result = null;
        let success = false;

        try {
          result = await Promise.race([
            callImageSynthesize(prompt, outputPath),
            new Promise((_, rej) => setTimeout(() => rej(new Error('timeout')), 5000))
          ]);
          success = fs.existsSync(outputPath);
        } catch(e) {
          console.log('Gateway relay failed:', e.message);
        }

        // If file not created, try CLI
        if (!success) {
          try {
            await callViaCli(prompt, outputPath);
            success = fs.existsSync(outputPath);
          } catch(e2) {
            console.log('CLI also failed:', e2.message);
          }
        }

        if (success) {
          const stat = fs.statSync(outputPath);
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({
            ok: true,
            file: `/covers/${filename}`,
            filename,
            size: stat.size
          }));
        } else {
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ ok: false, error: 'Image generation failed. Please try again.' }));
        }
      } catch(e) {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: e.message }));
      }
    });
    return;
  }

  // Serve covers (local generated images)
  if (pathname.startsWith('/covers/')) {
    const filename = path.basename(pathname);
    const filePath = path.join(COVERS_DIR, filename);
    if (fs.existsSync(filePath)) {
      res.writeHead(200, { 'Content-Type': 'image/png', 'Cache-Control': 'public, max-age=86400' });
      fs.createReadStream(filePath).pipe(res);
    } else {
      res.writeHead(404); res.end('Not found');
    }
    return;
  }

  // Serve React build assets
  if (pathname.startsWith('/assets/')) {
    const filePath = path.join(DIST_DIR, pathname);
    const ext = path.extname(filePath);
    const ct = { '.js': 'application/javascript', '.css': 'text/css', '.html': 'text/html', '.png': 'image/png', '.svg': 'image/svg+xml', '.ico': 'image/x-icon' }[ext] || 'application/octet-stream';
    if (fs.existsSync(filePath)) {
      res.writeHead(200, { 'Content-Type': ct });
      fs.createReadStream(filePath).pipe(res);
    } else {
      res.writeHead(404); res.end('Not found');
    }
    return;
  }

  // SPA fallback
  const indexPath = path.join(DIST_DIR, 'index.html');
  if (fs.existsSync(indexPath)) {
    res.writeHead(200, { 'Content-Type': 'text/html' });
    fs.createReadStream(indexPath).pipe(res);
  } else {
    res.writeHead(200, { 'Content-Type': 'text/plain' });
    res.end('Nomad Content Hub - run `npm run build` first');
  }
});

server.listen(PORT, '0.0.0.0', () => {
  const covers = fs.readdirSync(COVERS_DIR).filter(f => f.endsWith('.png') || f.endsWith('.jpg'));
  console.log(`🚀 Nomad Content Hub: http://localhost:${PORT}`);
  console.log(`📁 Covers: ${COVERS_DIR} (${covers.length} images)`);
  console.log(`🎨 Image generation: ${covers.length} pre-generated covers available`);
});
