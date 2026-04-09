# 原野 NomadWild · 本地搭建指南（Trae AI Agent 专用）

> 本文件描述了小红书、豆包、Deepseek 全自动发布系统的本地部署步骤。
> 由 Trae AI Agent 执行，无需人工干预。

---

## 系统架构

```
AI Agent（Trae / 本地 Node.js）
    │
    ├── localhost:3003  →  xhs_api.js    →  Playwright  →  Chrome  →  小红书创作者中心
    │
    ├── localhost:3004  →  doubao_api.js   →  Playwright  →  Chrome  →  豆包网页
    │
    └── localhost:5173  →  Vite 前端（React 网站）
                              │
                              ├── 🖼️ 豆包生图（调用 3004）
                              ├── ✍️ Deepseek 文案（直接 API）
                              └── 📤 小红书发布（调用 3003）
```

---

## 环境要求

- **操作系统**：Windows / macOS / Linux
- **Node.js**：≥ 18（运行 `node --version` 检查）
- **npm**：≥ 9（运行 `npm --version` 检查）
- **Chrome 浏览器**：任意版本（用于手动扫码登录，不需要特殊配置）

---

## 依赖安装

### 第一步：安装 Node.js

访问 https://nodejs.org 下载 **LTS 版本**（长期支持版）

安装完成后验证：
```bash
node --version    # 应显示 v18.x.x 或更高
npm --version     # 应显示 9.x.x 或更高
```

### 第二步：安装 Playwright（浏览器自动化工具）

```bash
npm install playwright
npx playwright install chromium --with-deps
```

> `--with-deps` 会自动安装 Chrome 依赖。如果在 Windows 上失败，单独运行：
> ```bash
> npx playwright install chromium
> ```

验证安装：
```bash
npx playwright --version    # 应显示版本号
```

---

## 启动步骤

### 方式一：一键启动（推荐）

在项目根目录创建并运行启动脚本：

**macOS / Linux 创建脚本：**
```bash
cat > start.sh << 'EOF'
#!/bin/bash
echo "========================================"
echo "  原野 NomadWild 内容工厂启动器"
echo "========================================"

# 启动小红书 API（端口 3003）
echo "[1/3] 启动小红书 API 服务..."
node xhs_api.js &
sleep 2

# 启动豆包 API（端口 3004）
echo "[2/3] 启动豆包 API 服务..."
node doubao_api.js &
sleep 2

# 启动前端（端口 5173）
echo "[3/3] 启动前端网站..."
npm run dev

echo "========================================"
echo "  全部启动完成！"
echo "  前端地址：http://localhost:5173"
echo "  小红书 API：http://localhost:3003"
echo "  豆包 API：http://localhost:3004"
echo "========================================"
EOF
chmod +x start.sh
./start.sh
```

**Windows (PowerShell) 创建脚本：**
```powershell
# 用记事本创建 start.bat，内容如下：
# 实际使用时直接运行下面的命令，不用脚本
```

**Windows 直接运行命令（管理员 PowerShell）：**
```powershell
# 终端1：小红书 API
Start-Process powershell -ArgumentList "-Command", "cd nomad-content-hub; node xhs_api.js"

# 终端2：豆包 API
Start-Process powershell -ArgumentList "-Command", "cd nomad-content-hub; node doubao_api.js"

# 终端3：前端
Start-Process powershell -ArgumentList "-Command", "cd nomad-content-hub; npm run dev"
```

---

### 方式二：逐步启动（每个命令单独一个终端）

#### 终端 1 — 小红书 API
```bash
cd nomad-content-hub
node xhs_api.js
```

预期输出：
```
[2026-04-09Txx:xx:xx.xxxZ] HTTP API: http://0.0.0.0:3003
[2026-04-09Txx:xx:xx.xxxZ] XHS API started
```

#### 终端 2 — 豆包 API
```bash
cd nomad-content-hub
node doubao_api.js
```

预期输出：
```
[2026-04-09Txx:xx:xx.xxxZ] Doubao API started on port 3004
```

#### 终端 3 — 前端网站
```bash
cd nomad-content-hub
npm run dev
```

预期输出：
```
  VITE v5.x.x  ready in xxx ms

  ➜  Local:   http://localhost:5173/
  ➜  Network: http://192.168.x.x:5173/
```

---

## 登录配置（首次使用只需一次）

### 小红书扫码登录

**操作位置：**
1. 打开浏览器访问 `http://localhost:5173`
2. 点击右上角 **小红书状态灯**（显示「未登录」）
3. 点击弹出框里的 **「🔑 扫码登录小红书」**

**扫码步骤：**
1. 打开小红书 App → 「我」→「扫一扫」
2. 扫描网页上的二维码
3. 手机上确认登录

**登录成功后：**
- 状态灯变为绿色「✅ 小红书已登录」
- 有效期 **7 天**，期间无需再次登录

**手动触发登录（备用方式）：**
如果网页端扫码失败，在终端 1 中可以看到日志输出，二维码保存在：
```
xhs_login_qr.png   # 小红书登录二维码
doubao_qr.png      # 豆包登录二维码
```

### 豆包扫码登录

同上，在网站的「🤖 AI 工具」标签页中点击「🔑 扫码登录豆包」

---

## 功能使用流程

### 完整发布流程

```
1. 打开 http://localhost:5173
         │
         ▼
2. 进入「🏠 内容库」标签
         │
         ▼
3. 选择一篇选题，点击「🔍 审核发布」
         │
         ▼
4. 在审核页面：
   - 选择封面图（点击选中）
   - 编辑正文内容
   - （可选）用「🤖 AI 工具」生成新封面图
         │
         ▼
5. 点击「📤 发布到小红书」
         │
         ▼
6. Playwright 自动完成：
   ✅ 打开小红书创作者中心
   ✅ 填入标题
   ✅ 填入正文
   ✅ 上传封面图
   ✅ 点击发布按钮
         │
         ▼
7. 完成！浏览器自动显示发布结果
```

### AI 工具使用

**豆包生成封面图：**
1. 点击「🤖 AI 工具」标签
2. 输入图片描述，例如：`蒙古包大草原，清晨阳光，9:16竖版，高清摄影风格`
3. 点击「🎨 用豆包生成图片」
4. 等待 30-60 秒，图片自动显示
5. 点击「💾 保存到封面库」

**Deepseek 生成文案：**
1. 在「🤖 AI 工具」标签页
2. 输入选题描述
3. 点击「🚀 生成文案」
4. 文案生成后可复制或直接「✨ 加入内容库」

---

## 端口说明

| 端口 | 服务 | 文件 | 用途 |
|------|------|------|------|
| 3003 | 小红书 API | `xhs_api.js` | 自动化发布小红书 |
| 3004 | 豆包 API | `doubao_api.js` | 调用豆包网页生图 |
| 5173 | 前端网站 | React/Vite | 内容工厂网站 |

---

## 常见问题排查

### 问题 1：提示「无法连接 API」

**原因：** API 服务器未启动

**解决：**
```bash
# 确认进程是否在运行
ps aux | grep node | grep -v grep

# 手动启动
node xhs_api.js &
node doubao_api.js &
```

### 问题 2：豆包/小红书扫码后仍然显示未登录

**原因：** 扫码后 Session 文件未正确保存

**解决：**
```bash
# 删除旧的 Session，重新扫码
rm -f xhs_session.json doubao_session.json
# 然后在网页上重新扫码登录
```

### 问题 3：Playwright 找不到 Chrome

**解决：**
```bash
# 重新安装 Chromium
npx playwright install chromium
```

### 问题 4：发布时提示「NOT_LOGGED_IN」

**原因：** 小红书 Session 过期（通常 7 天）

**解决：**
```bash
# 删除旧 Session，重新登录
rm -f xhs_session.json
# 在网页上重新扫码
```

### 问题 5：图片上传失败

**原因：** 图片路径问题或上传超时

**解决：**
1. 确认封面图保存在 `public/covers/` 目录
2. 重试发布，Playwright 会自动重试上传

---

## 技术细节

### API 端点

**小红书 API（端口 3003）：**
```
GET  /api/status           → 查看登录状态
GET  /api/qr              → 获取登录二维码 PNG
POST /api/action          → {"action":"login"} 触发扫码登录
POST /api/publish         → {"title":"", "content":"", "images":[], "topics":""} 发布笔记
GET  /api/result          → 获取上次发布结果
```

**豆包 API（端口 3004）：**
```
GET  /api/status           → 查看登录状态
GET  /api/qr              → 获取登录二维码 PNG
POST /api/login           → 触发扫码登录
POST /api/generate        → {"prompt":""} 生成图片
GET  /api/result          → 获取生成结果
GET  /api/image.png       → 获取生成的图片文件
```

### Playwright 关键坐标

豆包页面交互坐标（1280×900 分辨率）：
```
图像生成按钮：  (543, 852)
Prompt 输入框：(400, 768)
发送按钮：      (392, 834)
```

小红书创作者中心：
```
标题输入框：    通过 DOM 查询选择器定位
正文输入框：   通过 contentEditable 属性定位
发布按钮：      包含"发布"文字的 button 元素
```

### Session 有效期

| 平台 | 文件 | 有效期 | 续期方式 |
|------|------|--------|---------|
| 小红书 | `xhs_session.json` | 7 天 | 重新扫码 |
| 豆包 | `doubao_session.json` | 7 天 | 重新扫码 |

---

## 文件清单

```
nomad-content-hub/
├── xhs_api.js          ← 小红书 API 服务器
├── doubao_api.js       ← 豆包 API 服务器
├── xhs_login.js        ← 小红书登录脚本
├── xhs_publish.js      ← 小红书发布脚本
├── doubao_login.js     ← 豆包登录脚本
├── doubao_gen.js       ← 豆包生图脚本
├── src/
│   └── App.tsx        ← 前端（已配置 localhost:3003 和 localhost:3004）
├── public/covers/      ← 封面图目录（14张预生成 + 用户生成）
└── package.json
```

---

## 快速命令汇总

```bash
# 首次安装依赖
npm install
npm install playwright
npx playwright install chromium

# 启动
node xhs_api.js       # 终端1：小红书 API
node doubao_api.js    # 终端2：豆包 API
npm run dev           # 终端3：前端

# 查看日志/状态
curl http://localhost:3003/api/status   # 小红书登录状态
curl http://localhost:3004/api/status   # 豆包登录状态

# 重新登录（清除旧 Session）
rm -f xhs_session.json doubao_session.json
# 然后在网页上重新扫码
```
