# 原野.NomadWild 内容工厂 — 更新日志

所有版本均基于 Git 管理，可通过 `git log` 或本文件回溯任意版本。

---

## 📌 当前版本：v1.1.0（2026-04-08）

**在线访问：** https://vc47499yvvic.space.minimaxi.com

---

## 📋 版本历史

### v1.1.0 — 2026-04-08

**新增：小红书自动发布功能**

- 云端 Chromium + Playwright 自动化发布方案
- 详见 `README.md` / `docs/XHS-INTEGRATION.md`
- 支持扫码登录持久化（Cookie 保存）
- 自动填写标题、正文、上传图片、点击发布

**技术实现：**
- 云端 Chromium：`/workspace/browsers/chromium-1217/`
- Playwright 独立控制：`/workspace/pw/xhs_publisher.js`
- 虚拟显示器：xvfb-run（无头模式）
- 登录二维码：通过 page.mouse.click 切换后提取 Base64 PNG

---

### v1.0.0 — 2026-04-07

**初始完整版本，包含：**
- 14篇预写游牧文化选题（蒙古包、勒勒车、哈达、马头琴等）
- 14张专属 AI 封面图（已预生成，CDN 托管）
- 双模式发布系统（自动 / 人工审核）
- 人工审核全流程（选图 + 编辑文案 + 发布）
- AI 文案生成（Deepseek API）
- 内容日历（按月规划）
- 飞书审核通知
- 完整配置页面

---

## 📝 如何回溯版本

```bash
# 查看所有版本
git log --oneline

# 回到 v1.0.0
git checkout e476baf

# 基于某个版本创建新分支
git checkout -b new-feature e476baf
```

---

## 🔧 项目文件结构

```
nomad-content-hub/
├── src/
│   ├── App.tsx              # 主应用（含审核页/日历/生成/配置）
│   ├── main.tsx             # React 入口
│   └── data/
│       └── contentPool.ts   # 全部选题数据（含封面图 CDN URL）
├── public/covers/           # AI 封面图（14张）
├── server.js                # Express API 服务器（图片刷新）
├── pw/
│   └── xhs_publisher.js     # 小红书自动化发布脚本
├── docs/
│   └── XHS-INTEGRATION.md   # 小红书打通方案详解
├── README.md                # 项目说明
├── CHANGELOG.md             # 本文件
└── package.json
```

---

## 🚀 未来版本计划

- [ ] 豆包网页版 AI 生图（Browser Relay 方案）
- [ ] 小红书官方 API（需申请创作者权限）
- [ ] 批量生图：选择多篇一起生成封面
- [ ] 数据持久化：选题/发布状态存入数据库
- [ ] 微信公众号 / 微博同步发布
- [ ] 数据分析：阅读量/点赞量追踪
- [ ] 定时自动发布（Cron 调度）

---

_最后更新：2026-04-08 04:00 UTC_
_维护者：OpenClaw AI × MaxClaw_
