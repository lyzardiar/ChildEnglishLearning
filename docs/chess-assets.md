# 国际象棋视觉资产

## 设计基线

- 生成模型：`gpt-image-2`，通过 `codex-image2` 调用。
- 生成日期：2026-09-06。
- 风格参考：用户提供的实体国际象棋照片；银色一方对应规则中的白方，金色一方对应规则中的黑方。
- 棋子源图：`docs/chess-piece-prompts.jsonl`。
- 金银材质二次编辑指令：`docs/chess-piece-metal-edit.txt`。
- 最终规格：每枚 256×256 PNG，透明背景；不进入小程序主包，存放于微信云存储 `images/chess/metal/`。
- 上传与逐项校验：`node scripts/upload-chess-assets.js`。

## 云端映射

运行时映射位于 `miniprogram/data/chess-assets.js`。文件名首字母 `w` 表示白方银色棋子，`b` 表示黑方金色棋子；第二个字母依次为王 `k`、后 `q`、车 `r`、象 `b`、马 `n`、兵 `p`。

| 文件 | 字节 | SHA256 |
| --- | ---: | --- |
| bb.png | 82972 | abb1ff93da61a670edd97a671b4849a6a87e9286edd5061a23446f8ab52be72f |
| bk.png | 77992 | 67056beda0d5300fb014eb9e90dc5597f7bce2fc7ae4504098b11201cea66084 |
| bn.png | 102503 | 25ebfd3edbc4864b240522dc17670647dd837b372a879aecc278c3a0d69e75ff |
| bp.png | 85467 | 837a0686b765b4132e2594250ba809f642f27bace82d36faeb12a55bf2f17bed |
| bq.png | 78728 | 9718a41239c779b6c7e8b790976e9675067e4f364cb37ca46cd9558645a08365 |
| br.png | 95939 | 70e62ac153c888bce50baaf8961491327b5f4ebb664288b7937661051e6e90e7 |
| wb.png | 79362 | bf3c022ad4524b19c68dc3133f20740331be8ebb2ea78da84872f0bdddcbfa9f |
| wk.png | 74568 | 5369c1c70eda81c20b1738f3f85739b31eee6f8bfa1b84e568e2bd30511e25df |
| wn.png | 97382 | f65d55bf00d218f32e04f63ca40546e36e42f3e604f921a04610c7b77c876499 |
| wp.png | 78913 | 583450a85d99b210cd8eda1a3182d63e37d5944f236059f6c799b9464c44c212 |
| wq.png | 74436 | 2e2707efece90a21e1b96ea654d8e309b49597c81e7f3c7996685a8fb977e794 |
| wr.png | 89271 | 666df73d97f4930ce4004442ea2725fc6bcc0023a29b629b793006c314fdc092 |

本地生成原图和裁切结果位于被 `.gitignore` 排除的 `output/imagegen/chess-pieces/`；上表哈希用于确认以后重新生成或重新上传时没有误换资源。
