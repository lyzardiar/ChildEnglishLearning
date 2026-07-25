# AGENTS.md - 小一伊英语练习册 工作手册

## 项目概况

深圳一年级英语学习微信小程序，面向 6 岁小朋友，辅助沪教牛津版（上海教育出版社）教材的课后练习。

- 项目名称：小一伊英语练习册
- AppID：wx1fc5bf0ae64dddff（正式个人主体号）
- GitHub：https://github.com/lyzardiar/ChildEnglishLearning.git
- 本地路径：C:\Users\23314\Documents\work\wx

## 技术方案

- 前端：微信小程序原生（WXML/WXSS/JS）
- 后端：微信云开发（云数据库 + 云存储 + 云函数）
- 语音：RecorderManager 录音 + 云函数 speechRecognize 调腾讯云 ASR（16k_en）；TTS 用云存储预录音频
- UI：图标交互引导，低文字依赖，适合不识字的一年级小朋友
- 账号体系：家长微信登录 + 多孩子档案（进度独立）
- 图片风格：3 种可切换（flat 扁平卡通 / watercolor 手绘水彩 / pixel 像素风）

## 重要约束

- 个人主体号无法使用微信同声传译插件（需企业主体），已改用录音+云函数方案
- 小程序不支持动态 require（模板字符串路径），用 data/index.js 的 getBook(semester) 静态分发
- navigator 跳转 tabBar 页面必须用 open-type="switchTab"
- 小程序类目已设：教育服务 > 教育信息展示

## 项目结构

```
wx/
├── project.config.json
├── miniprogram/
│   ├── app.js / app.json / app.wxss
│   ├── custom-tab-bar/          # 自定义底部导航（emoji图标）
│   ├── pages/
│   │   ├── index/               # 首页（孩子选择 + 单元列表）
│   │   ├── learn/               # 单词学习 + 跟读
│   │   ├── listen/              # 课文听力
│   │   ├── game/                # 小游戏（听音选图/配对/打地鼠）
│   │   ├── checkin/             # 打卡（周视图 + 月历）
│   │   └── profile/             # 孩子档案 + 图片风格切换
│   ├── utils/
│   │   ├── speech.js            # 语音（TTS播放 + ASR录音识别 + 宽松匹配）
│   │   ├── cloud.js             # 云开发工具
│   │   └── imageStyle.js        # 图片风格管理
│   ├── data/
│   │   ├── index.js             # 数据入口（静态require分发）
│   │   ├── grade1-upper.js      # 上册12单元完整数据
│   │   └── grade1-lower.js      # 下册（前3单元，待补充）
│   └── images/words/{style}/{unitId}/{word}.png
├── cloudfunctions/
│   ├── login/                   # 登录 + 孩子档案CRUD
│   ├── saveProgress/            # 学习进度
│   ├── dailyCheckin/            # 打卡 + 连续天数
│   └── speechRecognize/         # 腾讯云ASR语音识别
└── docs/
    └── image-generation-guide.md  # 图片生成规范
```

## 云数据库集合

- parents：家长 openid、孩子列表
- children：孩子昵称、头像、当前学期/单元
- learning_records：学习记录（孩子ID、单元、类型、分数）
- checkins：打卡记录（孩子ID、日期、连续天数）

## 当前进度（2026-07-25）

已完成：
- [x] 项目骨架搭建（6页面 + 4云函数 + 教材数据）
- [x] 编译运行正常（仅剩图片缺失提示）
- [x] 图片风格切换功能
- [x] 代码推送到 GitHub

待办（按优先级）：
- [ ] ① 开通云开发环境（工具→云开发），拿到环境ID写入 app.js 的 `env: 'your-env-id'`
- [ ] ② 在云开发控制台创建 4 个数据库集合：parents / children / learning_records / checkins
- [ ] ③ 部署云函数（右键每个云函数目录→上传并部署）
- [ ] ④ 配置腾讯云 ASR 密钥（cloudfunctions/speechRecognize/index.js 中的 SECRET_ID / SECRET_KEY）
- [ ] ⑤ 生成单词配图（3种风格，规范见 docs/image-generation-guide.md）
- [ ] ⑥ 补充下册剩余单元数据（unit-04 到 unit-12）
- [ ] ⑦ 完善"图片配对"和"打地鼠"游戏逻辑

## 开发约定

- 新增单元时同步生成 3 种风格配图，路径：/images/words/{style}/{unitId}/{word}.png
- 图片规格：1024×1024 PNG，主体居中，无文字，适合儿童
- 云函数修改后需重新上传部署
- app.js 中的 env 值 = 云开发环境ID（开通后填入）
