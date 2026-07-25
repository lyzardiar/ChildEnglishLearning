# AGENTS.md - 小一伊英语练习册 工作手册

## 项目概况

深圳一年级英语学习微信小程序，面向 6 岁小朋友，辅助沪教牛津版（上海教育出版社）教材的课后练习。

- 项目名称：小一伊英语练习册
- AppID：wx1fc5bf0ae64dddff（正式个人主体号）
- GitHub：https://github.com/lyzardiar/ChildEnglishLearning.git
- 云开发环境ID：cloud1-d8g5ssn6n94472f8a

相关控制台：
- TTS: https://console.cloud.tencent.com/tts
- 腾讯云密钥: https://console.cloud.tencent.com/cam/capi
- 图片生成(DashScope): https://bailian.console.aliyun.com/cn-beijing?tab=costing-balance#/costing-balance/free-quota

## 技术方案

- 前端：微信小程序原生（WXML/WXSS/JS）
- 后端：微信云开发（云数据库 + 云存储 + 云函数）
- 语音识别(ASR)：RecorderManager 录音 + 云函数 speechRecognize 调腾讯云 ASR（16k_en）
- 语音合成(TTS)：云函数 tts 调腾讯云 TextToVoice（VoiceType 1050 英语女声，Speed 0.8），md5 缓存到云存储 tts-cache/
- 图片：存储在云存储，前端通过 fileID 直接加载（不占包体）
- UI：图标交互引导，低文字依赖，适合不识字的一年级小朋友
- 账号体系：家长微信登录 + 多孩子档案（进度独立）
- 图片风格：3 种可切换（flat 扁平卡通 / watercolor 手绘水彩 / pixel 像素风）

## 重要约束

- 个人主体号无法使用微信同声传译插件（需企业主体），已改用录音+云函数方案
- 小程序不支持动态 require（模板字符串路径），用 data/index.js 的 getBook(semester) 静态分发
- navigator 跳转 tabBar 页面必须用 open-type="switchTab"
- 小程序类目已设：教育服务 > 教育信息展示
- 小程序包体限制 2MB，图片资源必须放云存储，不能打包进代码
- learn/listen 是子页面（非 tabBar），通过 navigateTo 带参数进入
- tabBar 页面：index / game / checkin / profile（共 4 个）

## 项目结构

```
ChildEnglishLearning/
├── project.config.json
├── miniprogram/
│   ├── app.js / app.json / app.wxss
│   ├── custom-tab-bar/          # 自定义底部导航（emoji图标，4个tab）
│   ├── pages/
│   │   ├── index/               # 首页（孩子选择 + 单元列表）
│   │   ├── learn/               # 单词学习 + 跟读（子页面，接收 semester/unit 参数）
│   │   ├── listen/              # 课文听力（子页面，接收 semester/unit 参数）
│   │   ├── game/                # 小游戏（听音选词，内置单元选择器）
│   │   ├── checkin/             # 打卡（周视图 + 月历）
│   │   └── profile/             # 孩子档案 + 图片风格切换
│   ├── utils/
│   │   ├── speech.js            # 语音（TTS云函数播放 + ASR录音识别 + 宽松匹配）
│   │   ├── cloud.js             # 云开发工具
│   │   └── imageStyle.js        # 图片风格管理（fileID 前缀拼接）
│   └── data/
│       ├── index.js             # 数据入口（静态require分发）
│       ├── grade1-upper.js      # 上册12单元完整数据
│       └── grade1-lower.js      # 下册（前3单元，待补充）
├── cloudfunctions/
│   ├── login/                   # 登录 + 孩子档案CRUD
│   ├── saveProgress/            # 学习进度
│   ├── dailyCheckin/            # 打卡 + 连续天数
│   ├── speechRecognize/         # 腾讯云ASR语音识别
│   └── tts/                     # 腾讯云TTS语音合成（带缓存）
├── scripts/
│   ├── upload-images.js         # 批量上传图片到云存储（CloudBase SDK）
│   └── config.js                # 腾讯云密钥（已 gitignore）
└── docs/
    ├── image-generation-guide.md  # 图片生成规范
    ├── flat-prompts.md            # flat 风格生图 prompt 清单
    └── generate_images.py         # DashScope API 批量生图脚本
```

## 云数据库集合

- parents：家长 openid、孩子列表
- children：孩子昵称、头像、当前学期/单元
- learning_records：学习记录（孩子ID、单元、类型、分数）
- checkins：打卡记录（孩子ID、日期、连续天数）

## 图片资源管理

图片存储在微信云存储中，不打包进小程序代码（包体限制 2MB）。

### fileID 格式

```
cloud://cloud1-d8g5ssn6n94472f8a.images/words/{style}/{unitId}/{word}.png
```

前端 `imageStyle.js` 通过前缀拼接生成 fileID，`<image>` 组件直接使用 fileID 加载。

### 新增图片流程

1. 用 DashScope API 生成图片：`python docs/generate_images.py`（需配置 API Key）
2. 压缩图片：256x256 + 128色量化（控制体积）
3. 上传到云存储：`node scripts/upload-images.js`（需创建 scripts/config.js 填入密钥）
4. 前端自动通过 fileID 拼接访问，无需额外配置

### 密钥配置

`scripts/config.js`（已 gitignore）：
```js
module.exports = {
  SECRET_ID: '你的腾讯云 SECRET_ID',
  SECRET_KEY: '你的腾讯云 SECRET_KEY'
}
```

`cloudfunctions/tts/config.js`（已 gitignore）：同上格式。

## 当前进度（2026-07-25）

已完成：
- [x] 项目骨架搭建（6页面 + 5云函数 + 教材数据）
- [x] 云开发环境配置 + 数据库集合创建
- [x] 云函数全部部署（login / saveProgress / dailyCheckin / speechRecognize / tts）
- [x] TTS 语音合成（腾讯云 TextToVoice + 云存储缓存）
- [x] 孩子档案 CRUD 持久化到云数据库
- [x] 打卡功能持久化（周视图 + 月历 + 连续天数）
- [x] 学习进度 + 游戏分数保存到云数据库
- [x] 上册 76 张 flat 风格配图（已上传云存储）
- [x] 图片改为云存储加载，包体瘦身
- [x] 代码推送到 GitHub

待办（按优先级）：
- [ ] ① 补充下册剩余单元数据（unit-04 到 unit-12）
- [ ] ② 生成 watercolor / pixel 两种风格配图
- [ ] ③ 完善"图片配对"和"打地鼠"游戏逻辑
- [ ] ④ 真机测试全流程（TTS发音、ASR跟读、打卡、游戏）

## 开发约定

- 新增单元时同步生成配图并上传云存储（流程见上方"新增图片流程"）
- 图片规格：生成 1024x1024，压缩为 256x256 + 128色后上传
- 云函数修改后需重新上传部署（右键→上传并部署：云端安装依赖）
- 密钥文件（config.js）不提交 git，通过 .gitignore 排除
- git push 如遇 HTTP/2 stream error，用 `git -c http.version=HTTP/1.1 push`
