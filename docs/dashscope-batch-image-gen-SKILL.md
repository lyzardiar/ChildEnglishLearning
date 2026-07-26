---
name: dashscope-batch-image-gen
description: DashScope wanx 批量生图完整流水线。当用户需要通过阿里云 DashScope API（通义万相）批量生成图片时使用——涵盖端点探测、异步任务提交、轮询、下载、Pillow 压缩（resize+quantize）、断点续跑和错误处理。适用于批量生成插画、配图、素材等场景。
version: 1.0.0
---

# DashScope 批量生图流水线

## 适用场景

- 需要批量生成数十到数百张 AI 图片（插画、配图、图标、素材）
- 使用阿里云 DashScope（通义万相 wanx 系列模型）
- 需要异步提交 + 轮询的生产级流水线
- 需要断点续跑（中断后重跑自动跳过已完成项）
- 需要生成后自动压缩以满足包体/带宽限制

## 前置条件

1. Python 3.8+
2. `pip install requests Pillow`
3. DashScope API Key（从 https://bailian.console.aliyun.com/ 获取）
4. 确认 endpoint（见 Step 1）

## Steps

### Step 1: 端点探测

DashScope 有两种 API 格式，**必须用原生异步格式**：

| 格式 | 路径 | 说明 |
|------|------|------|
| OpenAI 兼容 | `/images/generations` | 同步，部分 workspace 不支持，常返回 404 |
| **DashScope 原生（推荐）** | `/services/aigc/text2image/image-synthesis` | 异步，稳定，所有 workspace 支持 |

探测方法：

```python
import requests

API_BASE = "https://dashscope.aliyuncs.com/api/v1"  # 或 workspace 专属域名
API_KEY = "sk-xxx"
headers = {"Authorization": f"Bearer {API_KEY}", "Content-Type": "application/json"}

# 探测原生端点（返回 400 说明路径正确，只是缺参数）
resp = requests.post(f"{API_BASE}/services/aigc/text2image/image-synthesis",
                     headers=headers, json={}, timeout=15)
print(resp.status_code, resp.text[:200])
# 期望: 400 + "model is required" 之类的错误 → 端点可用
```

如果是 workspace 专属域名（形如 `https://ws-xxx.cn-beijing.maas.aliyuncs.com/api/v1`），同样适用。

### Step 2: 异步提交任务

```python
def submit_task(prompt, model="wanx2.1-t2i-turbo", size="1024*1024"):
    url = f"{API_BASE}/services/aigc/text2image/image-synthesis"
    headers = {
        "Authorization": f"Bearer {API_KEY}",
        "Content-Type": "application/json",
        "X-DashScope-Async": "enable",  # 必须！否则变成同步阻塞
    }
    payload = {
        "model": model,
        "input": {"prompt": prompt},
        "parameters": {"size": size, "n": 1},
    }
    resp = requests.post(url, headers=headers, json=payload, timeout=60)
    if resp.status_code != 200:
        raise Exception(f"提交失败 HTTP {resp.status_code}: {resp.text[:200]}")
    data = resp.json()
    task_id = data.get("output", {}).get("task_id")
    if not task_id:
        raise Exception(f"无 task_id: {data}")
    return task_id
```

可用模型：`wanx2.1-t2i-turbo`（快速）、`wanx2.1-t2i-plus`（高质量）、`wanx-v1`（旧版）。

### Step 3: 轮询任务状态

```python
import time

def poll_task(task_id, max_wait=120):
    url = f"{API_BASE}/tasks/{task_id}"
    headers = {"Authorization": f"Bearer {API_KEY}"}
    start = time.time()

    while time.time() - start < max_wait:
        resp = requests.get(url, headers=headers, timeout=30)
        data = resp.json()
        status = data.get("output", {}).get("task_status", "")

        if status == "SUCCEEDED":
            results = data["output"].get("results", [])
            if results and results[0].get("url"):
                return results[0]["url"]
            raise Exception(f"任务成功但无图片URL: {data}")
        elif status == "FAILED":
            msg = data.get("output", {}).get("message", "未知错误")
            raise Exception(f"任务失败: {msg}")
        elif status in ("PENDING", "RUNNING"):
            time.sleep(3)  # 轮询间隔 3s
        else:
            raise Exception(f"未知状态: {status}")

    raise Exception(f"轮询超时({max_wait}s)")
```

状态机：`PENDING → RUNNING → SUCCEEDED / FAILED`

### Step 4: 下载图片

```python
def download_image(img_url, save_path):
    resp = requests.get(img_url, timeout=60)
    if resp.status_code != 200:
        raise Exception(f"下载失败 HTTP {resp.status_code}")
    os.makedirs(os.path.dirname(save_path), exist_ok=True)
    with open(save_path, "wb") as f:
        f.write(resp.content)
    return len(resp.content)
```

注意：返回的 URL 是临时链接，有效期约 24h，必须立即下载保存。

### Step 5: Pillow 压缩（resize + quantize）

```python
from PIL import Image

def compress_image(path, target_size=256, colors=128):
    """压缩为 target_size x target_size + 颜色量化"""
    img = Image.open(path).convert("RGBA")
    img = img.resize((target_size, target_size), Image.LANCZOS)
    img = img.quantize(colors=colors, method=2).convert("RGBA")
    img.save(path, "PNG", optimize=True)
    return os.path.getsize(path)
```

参数选择建议：
- 手机小卡片展示：256x256 + 128 色（约 10-15KB/张）
- 网页高清展示：512x512 + 256 色
- 需要透明背景时保持 RGBA；不需要可用 RGB 进一步减小

### Step 6: 断点续跑 + 主循环

```python
def main():
    total = len(TASKS)  # TASKS = [(filename, prompt), ...]
    done = skipped = failed = 0
    failed_list = []

    for i, (filename, prompt) in enumerate(TASKS, 1):
        save_path = os.path.join(OUTPUT_DIR, filename)

        # 断点续跑：已存在且 >1KB 的跳过
        if os.path.exists(save_path) and os.path.getsize(save_path) > 1000:
            print(f"  [{i}/{total}] {filename} - 已存在，跳过")
            skipped += 1
            continue

        print(f"  [{i}/{total}] {filename} ...", end="", flush=True)
        try:
            task_id = submit_task(prompt)
            img_url = poll_task(task_id)
            download_image(img_url, save_path)
            final_size = compress_image(save_path)
            print(f" OK ({final_size // 1024}KB)")
        except Exception as e:
            failed += 1
            failed_list.append(filename)
            print(f" FAILED: {e}")

        time.sleep(1)  # 避免触发限流

    print(f"\n=== 完成 === 成功: {total-skipped-failed} | 跳过: {skipped} | 失败: {failed}")
    if failed_list:
        print(f"失败列表: {failed_list}")
        print("重新运行脚本即可补生成（已有的自动跳过）")
```

### Step 7: API Key 安全

不要硬编码 API Key。推荐方式：

```python
# 方式1: 环境变量
import os
API_KEY = os.environ.get("DASHSCOPE_API_KEY", "")

# 方式2: 从 gitignore 的配置文件读取
import re
with open("config.js", "r", encoding="utf-8") as f:
    m = re.search(r"DASHSCOPE_API_KEY:\s*'([^']+)'", f.read())
API_KEY = m.group(1) if m else ""
```

## Pitfalls

- **OpenAI 兼容端点 404**：workspace 专属域名通常不支持 `/images/generations`，必须用 `/services/aigc/text2image/image-synthesis`。先探测再写死。
- **必须带 `X-DashScope-Async: enable` header**：否则 API 会尝试同步返回，超时概率极高。
- **轮询间隔不要太短**：建议 3 秒，过快会触发限流（HTTP 429）。
- **量化压缩用 `method=2`**：Pillow 的 quantize method=2（中位切分）对插画类图片效果最佳，method=0 会出现色带。
- **文件名含空格**：如 "pencil case" 需替换为下划线 `pencil_case.png`，否则路径处理出错。
- **临时 URL 有效期**：DashScope 返回的图片 URL 约 24h 过期，必须在 poll 成功后立即下载。
- **限流**：连续提交过快会 429，每次提交后 sleep(1)；如果批量 >100 张，考虑 sleep(2)。
- **API Key 泄露**：绝不提交到 git，配置文件加入 .gitignore。如果已泄露，去控制台轮换。

## Verification

1. 检查输出目录文件数量是否等于预期总数
2. 检查每张文件大小 >1KB（排除空文件/下载失败）
3. 用 Pillow 打开验证图片完整性：`Image.open(path).verify()`
4. 如有压缩步骤，确认尺寸和色深符合预期
5. 失败列表为空，或重跑后为空
