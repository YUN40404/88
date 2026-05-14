# ZERO STUDIO · 摄影预约网站

> 专注二次元漫展场照、专属棚拍与绝美外景的摄影预约平台

本项目是一个集作品展示与自助预约于一体的摄影工作室网站，访客可以浏览服务与作品、在网页端自主锁定拍摄档期，管理员通过后台管理首页文案、价格、预约活动、客户记录和作品图库。适用于漫展跟拍、私棚约拍等个人摄影业务。

**主要功能：**
- 作品图库：展示摄影作品，支持管理员上传
- 自助预约：客户选择活动、日期、时段填写信息完成锁档，后台自动记录
- 留言反馈：访客提交咨询，后台查看，配置 PushPlus Token 可推送至微信
- 后台管理：统一管理价格、公告、活动、预约、口令，防止刷单

**适合场景：** 个人摄影师 / 小型工作室 / 漫展约拍

---

## 页面说明

| 页面 | 地址 | 说明 |
|------|------|------|
| 首页 | `/index.html` | 服务介绍、价格展示、公告、作品入口、联系方式 |
| 作品图库 | `/portfolio.html` | 展示摄影作品 |
| 自助预约 | `/portal.html` | 客户选择活动、日期和时间段锁定档期 |
| 后台管理 | `/admin.html` | 修改首页配置、活动管理、预约记录、留言查看 |
| 使用教程 | `/tutorial.html` | 完整使用指南 |

---

## 快速启动

### 1. 安装依赖

```bash
npm install
```

### 2. 设置环境变量（重要）

不要把密码或通知 Token 写死在代码里。启动前设置以下环境变量：

```bash
export ADMIN_USER="admin"                # 后台账号，默认 admin
export ADMIN_PASSWORD="你的后台密码"     # 后台密码，必填
export PUSHPLUS_TOKEN="你的 Token"       # 可选，用于留言/预约通知
export PORT=3000                         # 可选，默认 3000
```

### 3. 启动服务

```bash
node server.js
```

然后打开 http://localhost:3000

---

## 后台管理

打开 http://localhost:3000/admin.html，输入配置的后台账号和密码。

可管理内容：

- 首页公告和地区价格
- 预约页公告、活动、日期、时间段
- 每时段容量（同时接受几人预约）
- 防刷预约口令
- 客户预约记录（查看/修改/删除）
- 作品图片上传与管理
- 客户留言查看

---

## 技术栈

- **前端**：HTML + Tailwind CSS + 原生 JavaScript
- **后端**：Node.js + Express
- **数据库**：SQLite
- **认证**：HTTP Basic Auth（express-basic-auth）
- **文件上传**：Multer
- **消息推送**：PushPlus（可选）

---

## 目录结构

```
.
├── index.html        # 网站首页
├── portal.html       # 自助预约页
├── admin.html        # 后台管理页
├── portfolio.html    # 作品图库
├── server.js         # Node.js 后端服务
├── tutorial.html     # 使用教程
├── package.json      # 依赖配置
└── uploads/          # 上传文件目录
```

---

## 部署建议

- 选择支持 **Node.js** 和 **SQLite 持久化存储** 的平台
- 务必配置 `ADMIN_USER`、`ADMIN_PASSWORD`、`PUSHPLUS_TOKEN` 环境变量
- 数据库 `data.db` 和 `uploads/` 目录需要持久化存储
- 上传 GitHub 前建议忽略本地数据库和上传文件（已配置 `.gitignore`）