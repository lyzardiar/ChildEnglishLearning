# 图片资源生成规范

## 概述

本小程序支持三种图片风格，用户可在"我的"页面自由切换。新增课程内容时，必须同步生成三种风格的配图。

## 三种风格定义

| 风格 key | 名称 | 描述 | 生成 prompt 关键词 |
|----------|------|------|-------------------|
| `flat` | 扁平卡通 | 色彩明快、线条简洁 | Flat design cartoon illustration, simple clean shapes, bold colors, kawaii style |
| `watercolor` | 手绘水彩 | 柔和温暖、艺术感 | Soft watercolor illustration, gentle pastel colors, hand-painted texture, warm |
| `pixel` | 像素风 | 游戏感强、复古可爱 | Pixel art style, 16-bit retro game aesthetic, cute sprite, vibrant colors |

## 文件路径约定

```
miniprogram/images/
├── words/
│   ├── flat/
│   │   ├── unit-01/
│   │   │   ├── hello.png
│   │   │   ├── hi.png
│   │   │   └── ...
│   │   ├── unit-02/
│   │   └── ...
│   ├── watercolor/
│   │   ├── unit-01/
│   │   └── ...
│   └── pixel/
│       ├── unit-01/
│       └── ...
├── welcome-flat.png
├── welcome-watercolor.png
└── welcome-pixel.png
```

路径规则：`/images/words/{风格key}/{单元id}/{单词英文}.png`

## 图片规格

- 尺寸：1024×1024 px（正方形）
- 格式：PNG（透明背景或纯色背景）
- 风格要求：
  - 画面主体居中，占画面 60%-80%
  - 背景使用纯色或简单渐变（避免复杂场景干扰文字识别）
  - 不包含任何文字、字母、数字
  - 适合 6 岁儿童审美：圆润、可爱、色彩饱和
  - 形象正面朝向观者，表情友好

## 生成 Prompt 模板

### 单词配图

```
{风格关键词}, for children's English learning app: {单词描述}, 
{背景色} background, simple clean composition, no text, no letters, 
suitable for 6-year-old kids, centered subject
```

示例（flat 风格，单词 cat）：
```
Flat design cartoon illustration for children's English learning app: 
a cute round orange cat with big eyes sitting and smiling, 
bright yellow background, simple clean shapes, bold colors, 
no text, no letters, kawaii style, suitable for 6-year-old kids, centered
```

### 欢迎图/吉祥物

```
{风格关键词}, a cute friendly cartoon mascot character for children's 
English learning app, waving hello, cheerful expression, 
colorful gradient background, no text, suitable for young children
```

## 新增课程时的执行清单

每新增一个单元，按以下步骤生成配图：

1. 确认单元所有单词列表
2. 为每个单词编写三种风格的 prompt（参考模板）
3. 生成图片（尺寸 1024×1024）
4. 按路径约定保存到对应目录
5. 验证小程序内切换三种风格均能正确显示

## 背景色参考（按单元主题）

| 主题 | 建议背景色 |
|------|-----------|
| 问候/社交 | 蓝色 #E3F2FD |
| 家庭 | 暖橙 #FFF3E0 |
| 身体 | 浅绿 #E8F5E9 |
| 数字 | 紫色 #F3E5F5 |
| 颜色 | 彩虹渐变 |
| 动物 | 草绿 #DCEDC8 |
| 水果 | 粉色 #FCE4EC |
| 食物 | 米黄 #FFFDE7 |
| 玩具 | 天蓝 #E1F5FE |
| 天气 | 浅蓝渐变 |
| 节日 | 红色 #FFEBEE |
| 学校 | 灰蓝 #ECEFF1 |
