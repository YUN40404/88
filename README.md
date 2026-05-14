# ZERO STUDIO · 摄影预约网站

摄影展示与自助预约网站，包含首页、作品页、客户预约入口和后台管理系统。

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