# 🎠 室内亲子淘气堡乐园全栈系统

基于 Vue 3 + Node.js + SQLite 的室内亲子淘气堡乐园管理系统。

## 系统架构

```
├── backend/          # 后端服务 (Node.js + Express + SQLite)
├── frontend/         # 前台收银&管理后台 (Vue 3 + Element Plus)
└── h5/               # 家长H5端 (Vue 3 + Vant)
```

## 核心功能

### 前台收银&管理后台
- ✅ 会员管理 - 会员注册、信息编辑、会员查询
- ✅ 会员卡管理 - 卡种配置、办卡、核销
- ✅ 场次管控 - 三场时段、客流统计、满场预警
- ✅ 收银台 - 会员核销、散客购票、二次消费
- ✅ 商品管理 - DIY手工、电玩代币管理
- ✅ 员工管理 - 员工信息、岗位配置
- ✅ 提成管理 - 导购办卡提成、技师手工项目提成
- ✅ 薪资核算 - 自动计算薪资、锁定归档
- ✅ 数据统计 - 客流统计、销售统计、卡种分析
- ✅ 优惠活动 - 活动配置、限时推送

### 家长H5端
- ✅ 会员卡查询 - 查看卡种、剩余次数、有效期
- ✅ 消费记录 - 游玩记录、消费明细
- ✅ 个人中心 - 基本信息、优惠活动

## 快速开始

### 1. 安装依赖

```bash
# 方式一：一键安装所有依赖
npm run install:all

# 方式二：分别安装
cd backend && npm install
cd ../frontend && npm install
cd ../h5 && npm install
```

### 2. 初始化数据库

```bash
cd backend
npm run init-db
```

初始化后默认账号：
- 用户名: `admin`
- 密码: `123456`

### 3. 启动服务

```bash
# 启动后端服务 (端口 3000)
cd backend && npm run dev

# 启动前台收银&管理后台 (端口 5173)
cd frontend && npm run dev

# 启动家长H5端 (端口 5174)
cd h5 && npm run dev
```

## 访问地址

- 收银&管理后台: http://localhost:5173
- 家长H5端: http://localhost:5174

## 数据库表结构

### 核心表
- `members` - 会员表
- `card_types` - 卡种表（单次散票、10次卡、月卡、年卡）
- `member_cards` - 会员卡卡表
- `play_sessions` - 场次表（上午场、下午场、夜场）
- `consumption_records` - 消费记录表
- `products` - 商品表（DIY手工、电玩代币）
- `employees` - 员工表
- `commission_settings` - 提成配置表
- `salary_records` - 薪资记录表
- `users` - 系统用户表
- `promotions` - 优惠活动表

## 业务流程

### 会员核销流程
1. 收银员扫描会员二维码或输入会员号
2. 系统显示会员信息及可用会员卡
3. 选择会员卡和游玩场次
4. 确认核销，系统自动扣次并统计场次人数

### 散客购票流程
1. 选择游玩场次
2. 选择票种
3. 确认购票，系统统计场次人数
4. 场次临近上限时弹窗预警

### 二次消费流程
1. 选择商品（DIY手工/电玩代币）
2. 选择技师（手工项目）
3. 确认消费，系统自动扣减库存
4. 自动计算技师提成

### 薪资核算流程
1. 选择月份，系统自动汇总导购办卡金额和技师手工营收
2. 根据提成配置自动计算提成
3. 管理员微调特殊薪资（奖罚）
4. 一键锁定归档

## 技术栈

### 后端
- Node.js + Express
- SQLite (better-sqlite3)
- JWT 身份认证
- bcryptjs 密码加密

### 前台&管理后台
- Vue 3 + Vite
- Element Plus UI 组件库
- Pinia 状态管理
- Vue Router 路由
- Axios HTTP 客户端

### 家长H5端
- Vue 3 + Vite
- Vant UI 组件库
- Vue Router 路由

## 项目结构

```
backend/
├── src/
│   ├── app.js              # 应用入口
│   ├── database/           # 数据库
│   │   ├── index.js        # 数据库连接
│   │   └── init.js         # 初始化脚本
│   └── routes/             # API 路由
│       ├── auth.js         # 认证
│       ├── members.js      # 会员
│       ├── cards.js        # 会员卡
│       ├── sessions.js     # 场次
│       ├── consumptions.js # 消费记录
│       ├── products.js     # 商品
│       ├── employees.js    # 员工
│       ├── commissions.js  # 提成&薪资
│       └── statistics.js   # 统计
└── data/                   # 数据库文件

frontend/
├── src/
│   ├── main.js             # 应用入口
│   ├── App.vue
│   ├── router/             # 路由
│   ├── stores/             # Pinia 状态
│   ├── utils/              # 工具函数
│   ├── api/                # API 接口
│   ├── layouts/            # 布局组件
│   └── views/              # 页面组件

h5/
├── src/
│   ├── main.js             # 应用入口
│   ├── App.vue
│   ├── router/             # 路由
│   ├── utils/              # 工具函数
│   ├── api/                # API 接口
│   ├── layouts/            # 布局组件
│   └── views/              # 页面组件
```

## 默认配置

### 卡种配置
- 单次散票: ¥68，1次，1天有效
- 10次卡: ¥500，10次，180天有效
- 月卡: ¥800，不限次数，30天有效
- 年卡: ¥3600，不限次数，365天有效

### 场次配置
- 上午场: 09:00 - 12:00
- 下午场: 14:00 - 18:00
- 夜场: 19:00 - 21:30
- 单场最大承载: 50人

### 提成配置
- 导购办卡提成: 销售额的 5%
- 技师手工项目提成: 每件固定 10元

## 注意事项

1. 首次运行请先执行数据库初始化
2. 生产环境请修改 JWT_SECRET
3. 数据库文件位于 `backend/data/playground.db`
4. 建议定期备份数据库文件

## License

MIT
