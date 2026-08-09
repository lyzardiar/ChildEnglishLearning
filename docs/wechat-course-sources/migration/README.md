# 微信教材媒体迁移

目标云环境：`cloud1-d8g5ssn6n94472f8a`

媒体上传到 `course-media/grade{1-6}/{upper|lower}/{unit|extras}/`，不进入小程序包。迁移状态保存在 `media-manifest.json`，每个文件记录微信媒体 ID、源文章、SHA-256、字节数、云端路径和 CloudBase `fileID`。

本地二进制缓存默认位于仓库外：

```text
G:\work\cache\ChildEnglishLearning-course-media
```

上传并抽检成功后会立即删除本地二进制。失败文件保留以便续传；重复运行会跳过 `upload.status = verified` 的文件。

常用命令：

```powershell
node scripts/migrate-course-media.mjs init
node scripts/migrate-course-media.mjs status
node scripts/migrate-course-media.mjs download-audio --all-local
node scripts/migrate-course-media.mjs upload-staged-audio
node scripts/migrate-course-media.mjs transfer-audio --limit 1
node scripts/migrate-course-media.mjs transfer --id audio-MzI2MTIxOTUxMl8yNjUwNDk4MzY1
```

视频地址含短期签名，必须由 Chrome 打开原文章刷新后立即传给迁移脚本。音频媒体 ID 提取完成后使用微信稳定音频地址下载。

音频完整迁移优先使用两阶段命令：先通过 Chrome 提取音频 ID 并执行 `download-audio`，确认全部文件已落入仓库外缓存后，再单独执行 `upload-staged-audio`。上传命令默认保留本地文件，完成转写、翻译和字幕校验后才可显式传入 `--cleanup-local`。不要在抓取阶段使用 `transfer-audio`，该旧命令会连续执行下载和上传。
