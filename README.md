# 原野 NomadWild · 内容工厂

小红书图文内容创作与发布管理系统。基于 Playwright 浏览器自动化实现 AI 生成文案、AI 生成封面图、审核发布全流程。

---

## 📊 项目进度

**当前版本**：v1.3.0  
**最后更新**：2026-04-12  
**系统状态**：✅ 核心功能已完成，Windows 环境适配优化

### 已完成功能
| 模块 | 状态 | 说明 |
|------|------|------|
| 前端界面 | ✅ | React + TypeScript，单页应用 |
| 小红书登录 | ✅ | Playwright 自动化扫码登录 |
| 小红书发布 | ✅ | 自动填写标题/正文/图片/话题 |
| 豆包登录 | ✅ | Playwright 自动化扫码登录 |
| 豆包生图 | ✅ | 自动化对话生成图片 |
| AI 文案 | ✅ | Deepseek API 生成正文 |
| 会话持久化 | ✅ | Cookie 保存，7天有效期 |
| 一键启动 | ✅ | start.bat 自动启动三个服务 |

### 待优化功能
| 模块 | 状态 | 说明 |
|------|------|------|
| MCP 集成 | 🔄 | 已安装 xiaohongshu-mcp-node，待配置 |
| 定时发布 | ⏳ | 可通过 MCP 方案实现 |

---

## 🚀 快速开始

### 环境要求
- **操作系统**：Windows 10/11（已测试）| macOS | Linux
- **Node.js**：≥ 18.0
- **浏览器**：Microsoft Edge 或 Google Chrome（任意版本）
- **网络**：能访问小红书创作者平台 (creator.xiaohongshu.com)

### 安装步骤

**1. 克隆项目**
```bash
git clone https://github.com/CapYue/nomen-conten-hub.git
cd nomen-conten-hub
```

**2. 安装依赖**
```bash
npm install
```

**3. 安装 Playwright**
```bash
npm install playwright
npx playwright install chromium
```

**4. 一键启动**
```powershell
.\start.bat
```

启动脚本会自动打开三个命令行窗口：
- `小红书 API` (端口 3003)
- `豆包 API` (端口 3004)
- `前端网站` (端口 5173)

**5. 访问前端**
```
http://localhost:5173
```

---

## 🔐 账号登录

### 小红书登录
1. 点击网页右上角的 **状态指示灯**
2. 选择 **「🔑 扫码登录小红书」**
3. 等待自动获取二维码（约 10-20 秒）
4. 打开小红书 App 扫描二维码
5. 登录状态保存至 `xhs_session.json`（有效期 7 天）

### 豆包登录
1. 进入「🤖 AI 工具」页面
2. 点击 **「🔑 扫码登录豆包」**
3. 同样扫描二维码登录
4. 登录状态保存至 `doubao_session.json`

### 重新登录
登录过期后，删除项目根目录的会话文件即可重新扫码：
```powershell
rm xhs_session.json
rm doubao_session.json
```

---

## 📝 内容发布流程

### 方式一：使用预置选题
1. 在前端「🏠 内容库」中选择任意选题
2. 点击「🔍 审核发布」进入审核页面
3. 确认标题、正文、封面图片
4. 点击「📤 发布到小红书」

### 方式二：AI 辅助生成
1. 在「🤖 AI 工具」中使用 Deepseek 生成文案
2. 使用豆包生成封面图片
3. 进入审核页面调整内容
4. 发布到小红书

### 发布脚本参数
```
node xhs_publish.js "标题" "内容" "话题1,话题2" "图片路径"
```

---

## 🛠️ 核心文件说明

```
nomen-conten-hub/
├── src/
│   ├── App.tsx              # 前端主组件，审核发布界面
│   ├── main.tsx             # React 入口
│   └── data/contentPool.ts  # 14篇预置选题数据
│
├── public/
│   └── covers/              # AI 封面图（14张）
│       ├── topic_1_0.png
│       └── ...
│
├── xhs_api.js              # 小红书 API 服务（端口 3003）
│   ├── /api/status         # 查询登录状态
│   ├── /api/qr            # 获取登录二维码
│   ├── /api/action        # 执行登录动作
│   └── /api/publish       # 执行发布
│
├── doubao_api.js           # 豆包 API 服务（端口 3004）
│   ├── /api/status        # 查询登录状态
│   └── /api/gen           # 生图请求
│
├── xhs_login.js           # 小红书登录脚本
├── xhs_publish.js         # 小红书发布脚本
├── doubao_login.js        # 豆包登录脚本
├── doubao_gen.js          # 豆包生图脚本
│
├── start.bat              # Windows 一键启动脚本
├── LOCAL_SETUP.md         # 详细本地搭建指南
├── CHANGELOG.md           # 版本更新日志
└── package.json          # 项目依赖配置
```

---

## ⚙️ 技术架构

### 服务端口
| 服务 | 端口 | 说明 |
|------|------|------|
| 前端 | 5173 | React 开发服务器 |
| 小红书 API | 3003 | 发布相关 API |
| 豆包 API | 3004 | 生图相关 API |

### 浏览器自动化
- **引擎**：Playwright
- **浏览器**：本地 Edge (channel: msedge)
- **Viewport**：1280 x 800（桌面端）
- **用户代理**：Windows Chrome 122

### 会话管理
- **存储**：JSON 文件（xhs_session.json / doubao_session.json）
- **有效期**：7 天（自动清理过期会话）
- **加密**：无（会话文件已加入 .gitignore）

---

## 🔧 常见问题

### 发布失败
**可能原因**：
1. 登录已过期 → 删除会话文件重新扫码
2. 页面结构变化 → 更新 xhs_publish.js 选择器
3. 网络问题 → 检查能否访问 creator.xiaohongshu.com

**排查方法**：
1. 查看 xhs_api.js 窗口的错误日志
2. 运行 `node xhs_publish.js "测试" "测试内容" "测试"` 手动测试
3. 观察浏览器行为，截图分析

### 二维码不显示
**原因**：首次获取二维码需要等待 10-20 秒

**解决**：
1. 耐心等待
2. 检查 xhs_login.js 是否正常运行
3. 查看项目根目录是否有 xhs_login_qr.png 生成

### 端口被占用
**原因**：之前的进程未完全退出

**解决**：
```powershell
# 查看端口占用
netstat -ano | findstr :3003
netstat -ano | findstr :3004

# 终止进程（替换 PID 为实际值）
taskkill /F /PID <PID>
```

### 前端无法连接 API
**原因**：API 服务未启动

**解决**：
1. 运行 `.\start.bat` 重新启动
2. 检查 3003、3004 端口是否正常监听

---

## 📦 依赖说明

| 依赖 | 版本 | 用途 |
|------|------|------|
| react | ^18.2.0 | 前端框架 |
| react-dom | ^18.2.0 | React DOM |
| playwright | ^1.59.1 | 浏览器自动化 |
| typescript | ^5.3.3 | 类型检查 |
| vite | ^5.0.0 | 前端构建工具 |

---

## 🔄 版本历史

### v1.3.0 (2026-04-12)
- Windows 环境完整适配
- 修复登录状态灯可见性问题
- 优化发布按钮查找逻辑（支持 span 元素）
- 添加图片路径转换（Linux/Windows）
- 增加话题标签自动填写
- 优化界面显示（桌面端 viewport）

### v1.2.0 (2026-04-09)
- 新增 LOCAL_SETUP.md 本地搭建指南
- 新增豆包 AI 工具集成

### v1.1.0 (2026-04-08)
- 小红书自动发布功能
- 扫码登录持久化

### v1.0.0 (2026-04-07)
- 初始版本
- 14篇预置选题
- AI 文案生成

---

## 📄 许可证

MIT License

---

## 🤝 贡献

欢迎提交 Issue 和 Pull Request！

---

**项目地址**：https://github.com/CapYue/nomen-conten-hub