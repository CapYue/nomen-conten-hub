# 原野.NomadWild 内容工厂

小红书图文内容创作与发布管理系统，支持 AI 生成文案、AI 生成封面图、审核发布全流程。

**[在线访问](https://vc47499yvvic.space.minimaxi.com)**

---

## 功能概览

| 模块 | 功能 |
|------|------|
| 📝 内容管理 | 14篇预写游牧文化选题，支持双模式发布 |
| 🖼️ AI 封面图 | 14张专属 AI 封面图（CDN 托管） |
| ✍️ AI 文案生成 | Deepseek API 生成笔记正文 |
| 🔄 人工审核 | 4图选封面 + 编辑文案 + 一键发布 |
| 📅 内容日历 | 按月规划发布节奏 |
| 🔔 飞书通知 | 审核通过后自动推送通知 |
| 🌐 小红书自动发布 | 云端 Chromium + Playwright 自动化发布 |

---

## 项目结构

```
nomad-content-hub/
├── src/
│   ├── data/contentPool.ts    # 14篇选题数据（含封面 CDN URL）
│   └── App.tsx                # 主应用（审核 + 发布流程）
├── public/covers/             # AI 封面图（topic_1_0.png ~ topic_14_0.png）
├── server.js                  # Express API 服务器
├── SKILL.md                   # 小红书自动化发布 Skill
└── docs/
    └── XHS-INTEGRATION.md     # 小红书打通方案详解
```

---

## 小红书自动发布方案

### 架构说明

```
┌─────────────────────────────────────────────────────────┐
│                     云端服务器                            │
│  ┌──────────────┐    ┌─────────────────────────────┐   │
│  │ Playwright   │───▶│ Chromium Browser (无头)      │   │
│  │ (Node.js)   │    │ 自动化控制 Chrome             │   │
│  └──────────────┘    └─────────────────────────────┘   │
│         │                       │                      │
│         │  CDP (Chrome DevTools Protocol)              │
│         ▼                       ▼                      │
│  ┌──────────────┐    ┌─────────────────────────────┐   │
│  │  发布脚本     │    │ 小红书创作者中心              │   │
│  │ xhs_publisher│───▶│ creator.xiaohongshu.com    │   │
│  │ .js          │    │ (登录 → 填内容 → 上图 → 发布)│   │
│  └──────────────┘    └─────────────────────────────────┘   │
└─────────────────────────────────────────────────────────┘
```

### 打通步骤

#### 第一步：安装云端浏览器依赖

在服务器上已预装：
- Chromium (`/workspace/browsers/chromium-1217/chrome-linux64/chrome`)
- Playwright (`/workspace/pw/node_modules/playwright`)
- xvfb-run（虚拟显示器，用于无头模式运行 Chrome）

如需重新安装：
```bash
# 安装 Playwright
cd /workspace/pw
npm init -y && npm install playwright
PLAYWRIGHT_BROWSERS_PATH=/workspace/browsers npx playwright install chromium --with-deps

# 安装 xauth（用于虚拟显示）
apt-get install -y xvfb xauth
```

#### 第二步：运行发布脚本

```bash
# 启动 Chromium 并打开发布页面
cd /workspace/pw
xvfb-run -a node xhs_publisher.js \
  --title="蒙古包：游牧民族的天空" \
  --content="草原上的家，折叠的美学..." \
  --images="/workspace/nomad-content-hub/public/covers/topic_1_0.png"
```

#### 第三步：扫码登录（首次）

脚本会自动打开云端 Chrome，访问小红书创作者中心登录页。

**获取登录二维码：**
```bash
cd /workspace/pw
xvfb-run -a node -e "
const { chromium } = require('./node_modules/playwright');
(async () => {
  const browser = await chromium.launch({ executablePath: '/workspace/browsers/chromium-1217/chrome-linux64/chrome', args: ['--no-sandbox','--disable-setuid-sandbox','--disable-dev-shm-usage'] });
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
  await page.goto('https://creator.xiaohongshu.com/login');
  await page.waitForTimeout(5000);
  await page.mouse.click(1140, 290);  // 点击右上角二维码图标
  await page.waitForTimeout(3000);
  const qrData = await page.evaluate(() => {
    const imgs = Array.from(document.querySelectorAll('img'));
    const qrImg = imgs.find(i => i.width === 160 && i.height === 160);
    return qrImg ? qrImg.src : null;
  });
  if (qrData) {
    const base64 = qrData.replace(/^data:image\/\\w+;base64,/, '');
    require('fs').writeFileSync('/workspace/pw/xhs_qrcode.png', Buffer.from(base64, 'base64'));
    console.log('QR saved to /workspace/pw/xhs_qrcode.png');
  }
  await browser.close();
})().catch(e => console.error(e.message));
"
```

将生成的 `xhs_qrcode.png` 通过 CDN 分发，用户扫码登录。

**会话持久化：**
登录后保存 Cookie，下次无需重新扫码：
```javascript
// 保存登录状态
await context.storageState({ path: './xhs_state.json' });

// 下次使用保存的登录状态
const context = await browser.newContext({ storageState: './xhs_state.json' });
```

#### 第四步：自动发布

```bash
# 完整发布流程
xvfb-run -a node /workspace/pw/xhs_publisher.js \
  --title="蒙古包：游牧民族的天空" \
  --content="在内蒙古大草原上，蒙古包像一朵朵白色的云..." \
  --images="/workspace/nomad-content-hub/public/covers/topic_1_0.png,/workspace/nomad-content-hub/public/covers/topic_1_1.png"
```

---

## 核心文件说明

### xhs_publisher.js
自动化发布脚本，完整流程：
1. 启动 Chromium（云端 + xvfb 虚拟显示）
2. 加载登录状态（Cookie）
3. 打开发布页 `creator.xiaohongshu.com/publish/publish`
4. 填写标题 + 正文
5. 上传封面图和正文图片
6. 点击发布按钮
7. 截图确认最终状态

### contentPool.ts
选题数据，包含每篇笔记的：
- `title` / `content` / `tags`
- `coverImageUrl`：AI 封面图 CDN 地址
- `coverPrompt`：封面图生成描述词

---

## 快速命令汇总

```bash
# 重构部署
cd /workspace/nomad-content-hub && npm run build

# 获取登录二维码
cd /workspace/pw && xvfb-run -a node get_qr.js

# 正式发布（需先登录）
xvfb-run -a node xhs_publisher.js \
  --title="标题" \
  --content="正文" \
  --images="/path/to/cover.png"

# 推送到 GitHub
cd /workspace/nomad-content-hub
git add -A && git commit -m "update: desc" && git push
```

---

## 待接入功能

- [ ] 豆包网页版 AI 生图（Browser Relay 方案）
- [ ] 小红书官方 API（需申请创作者权限）
- [ ] 多账号管理
- [ ] 定时自动发布（Cron 调度）
