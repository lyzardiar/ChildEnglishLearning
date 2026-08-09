# 原始文章快照

浏览器每成功读取一篇文章，就在此目录写入一个 UTF-8 JSON 快照。总目录文件使用来源 ID，例如 `upper-audio.json`；展开后的媒体子页按年级和学期保存在 `pages/`。

快照至少包含 `sourceId`、`capturedAt`、`url`、`title`、`account`、`publishedAt`、`bodyText`、`links`、`audioItems`、`videoItems` 和 `validationNotes`。
