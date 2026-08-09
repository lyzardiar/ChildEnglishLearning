# 图片资源生成规范

## 当前生成接口

新增或替换视觉资产统一使用 `codex-image2` 技能和 `gpt-image-2`。旧的 DashScope 脚本仅作历史保留，不再作为默认入口。

环境变量由本机配置：

- `CODEX_API_KEY`
- `CODEX_API_URL`（未设置时使用技能默认地址）

密钥不得写入仓库、提示词或日志。

## 图片规格

- 接口生成：`1024x1024`，`quality=low` 或按实际需要提高。
- 上传版本：缩放到 `256x256` 或 `512x512`，PNG 128 色量化。
- 画面不含文字、字母、数字、水印和边框。
- 主体清楚，缩到手机尺寸后仍能一眼识别。
- 使用森林绿、珊瑚红、金黄、天蓝和白色等平衡配色，避免单一蓝紫色主题。
- 词卡主体占画面约 60%-80%；横幅需为界面文字保留明确空白区。

## Prompt 模板

```text
Asset type: WeChat mini program vocabulary card
Primary request: A child-friendly illustration of <word>
Subject: <precise subject description>
Style/medium: Polished flat editorial cartoon, crisp shapes, subtle paper texture
Composition/framing: Centered single subject, fully visible, readable at small mobile size
Color palette: Forest green, coral, golden yellow, sky blue and white
Constraints: No text, no letters, no numbers, no watermark, no border
Avoid: Purple gradients, glossy 3D, photorealism, clutter, oversized eyes
```

## 文件与云路径

生成原图保存在：

```text
output/imagegen/
```

压缩后上传微信云存储，不进入小程序包：

```text
images/words/{style}/{unitId}/{word}.png
images/ui/{assetName}.png
```

前端只保存完整 cloud fileID。当前首页视觉路径为：

```text
cloud://cloud1-d8g5ssn6n94472f8a.636c-cloud1-d8g5ssn6n94472f8a-1458315262/images/ui/home-learning-hero.png
```

## 执行清单

1. 核对要表达的单词或界面用途。
2. 保存 prompt，运行 `codex-image2`。
3. 检查主体、构图、文字伪影和多余元素。
4. 缩放并量化，确认移动端仍清晰。
5. 上传云存储，对临时 URL 做 Range 抽检。
6. 前端写入完整 fileID，运行 `npm test` 检查包体和引用。
