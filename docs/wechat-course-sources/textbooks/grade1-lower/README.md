# 一年级下册教材扫描校订记录

本目录记录沪教牛津版（深圳用）2024 新版一年级下册教材的本地扫描来源。扫描照片仅用于逐页校订课程数据，不打包进小程序，也不提交到 Git。

## 来源

- 原压缩包：`C:\Users\柏云\xwechat_files\lyzardiar_82f6\msg\file\2026-08\scan_20260809_144952.zip`
- SHA256：`002AAE2B3418D999E20A8858A3391E4667447857F97A6628D9BCCF4DAADDE9A6`
- 照片数量：64
- 本地照片缓存：`scans/`
- 本地联系表缓存：`processed/contact-sheets/`
- 校订日期：2026-08-09

## 页面映射

| 内容 | 扫描照片 | 课本页码 |
| --- | --- | --- |
| Unit 1 | 0003-0010 | 2-9 |
| Unit 2 | 0011-0018 | 10-17 |
| Unit 3 | 0019-0026 | 18-25 |
| Unit 4 | 0027-0034 | 26-33 |
| Unit 5 | 0035-0042 | 34-41 |
| Unit 6 | 0043-0050 | 42-49 |
| Project | 0051-0054 | 50-53 |
| Word list | 0055-0057 | 54-56 |
| Picture dictionary | 0058-0060 | 57-59 |
| Chants | 0061-0064 | 60-63 |

## 音频复核

六个单元正文同时使用已归档的完整课本音频复核：

| 单元 | 主音轨 ID |
| --- | --- |
| Unit 1 | `MzI2MTIxOTUxMl8yNjUwNTA0Nzgy` |
| Unit 2 | `MzI2MTIxOTUxMl8yNjUwNTA0Nzkw` |
| Unit 3 | `MzI2MTIxOTUxMl8yNjUwNTA0Nzk5` |
| Unit 4 | `MzI2MTIxOTUxMl8yNjUwNTA0ODA4` |
| Unit 5 | `MzI2MTIxOTUxMl8yNjUwNTA0ODE3` |
| Unit 6 | `MzI2MTIxOTUxMl8yNjUwNTA0ODI4` |

对应双语字幕位于 `docs/wechat-course-sources/subtitles/units/grade1-lower-unit-0N.json`。

## 校订规则

- 只录入教材印刷文字，忽略学生手写答案、批注、涂画和临时标记。
- 印刷气泡中的强调文字属于教材正文，例如 Unit 5 的 `They're so HEAVY!`，应保留。
- Word list 以教材原形和顺序为准，不用语音识别结果替换拼写。
- 英式拼写按教材保留，例如 `favourite`。
- Chants 以课本第 60-63 页印刷文字为准，用于纠正音频识别中的同音词和漏词。
- 当前结构化正文位于 `miniprogram/data/grade1-lower.js`，云端音视频和字幕仍通过媒体目录接入。
