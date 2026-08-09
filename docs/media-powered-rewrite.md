# 音视频驱动版小程序

## 数据来源

- `docs/wechat-course-sources/migration/media-manifest.json` 是云端媒体事实清单。
- `docs/wechat-course-sources/catalog/knowledge-by-unit.json` 提供 Unit、页码和公开栏目标题。
- `scripts/build-miniprogram-catalog.mjs` 生成小程序内的精简目录 `miniprogram/data/media-catalog.js`。
- 生成目录只收录 `upload.status = verified` 且具有 fileID 的媒体。

当前生成结果：104 个 Unit、268 段视频、79 条音频。

## 中文内容边界

- 一年级上册继续使用项目中已经核对的双语单词、句型、故事和拓展阅读。
- 其他年级展示来源页公开的课本页码、Story、Extend、Explore 等栏目，并补充栏目名和可识别标题的中文翻译。
- 来源没有完整文字稿的内容不生成或猜测课文台词。

## 播放方式

小程序包仅保存云存储 fileID。播放前由 `miniprogram/utils/media.js` 调用 `wx.cloud.getTempFileURL` 换取临时 HTTPS 地址，避免依赖公众号原始签名地址，也不占用 2MB 代码包。

## 双语字幕样板

一年级下册 Unit 1 的 6 段视频已完成 70 条人工校对双语字幕：视频播放时由 `timeupdate` 驱动中英文覆盖层，进入全屏后字幕仍随视频显示。音频播放器已支持歌词式当前句高亮、自动滚动和点击跳转；该 Unit 的音频轨待 Browser 插件恢复后补入。

运行时字幕使用静态数据入口 `miniprogram/data/subtitle-catalog.js`，当前只挂载样板 Unit，不影响其他课程。开发期原始识别结果与缓存说明位于 `docs/wechat-course-sources/subtitles/raw/`。

## Image2 视觉资产

首页图路径：

```text
cloud://cloud1-d8g5ssn6n94472f8a.636c-cloud1-d8g5ssn6n94472f8a-1458315262/images/ui/home-learning-hero.png
```

本次新的首页场景图请求因 Image2 上游网络超时未完成，当前使用同一 Image2 接口此前成功生成的绿色梨子插画，压缩为 512x512、128 色、134494 字节后上传。生成提示词保存在 `docs/image2-home-hero-prompt.txt`，接口恢复后覆盖同一云路径即可，无需修改前端。

## 更新与校验

```powershell
npm run build:catalog
npm test
```

修改孩子年级和媒体学习记录后，需要重新部署以下云函数：

- `login`
- `saveProgress`
