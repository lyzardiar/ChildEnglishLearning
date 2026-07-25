"""
批量生成单词配图 - DashScope API (通义万相 wanx2.1-t2i-turbo)
2024新版沪教牛津版（深圳用）一年级上册 - 6单元36词
用法: python generate_images.py
支持断点续跑：已存在的图片自动跳过
"""
import requests
import os
import time

# === 配置 ===
API_BASE = "https://ws-kqo9v7po1ltm5rmp.cn-beijing.maas.aliyuncs.com/api/v1"
API_KEY = "sk-ws-H.EIMYHXL.6wvp.MEUCIQCLmbE0Fx6PGULNn1STsXlaHQGfKzmE5NNd_LNg2TrG4QIgS-aDzvFubLXIQ7ranD5GSmGRV7krcC4V3-535HoCxO4"
MODEL = "wanx2.1-t2i-turbo"
OUTPUT_DIR = r"G:\work\git\ChildEnglishLearning\miniprogram\images\words\flat"

# === 2024新版 一年级上册 单词数据 ===
UNITS = [
    ("unit-01", "#FFF3E0", [
        ("grandma", "a cute cartoon grandmother with a bun hairstyle and glasses smiling warmly"),
        ("grandpa", "a cute cartoon grandfather with white hair and glasses smiling kindly"),
        ("dad", "a cute cartoon father with short hair smiling warmly"),
        ("mum", "a cute cartoon mother with long hair smiling gently"),
        ("brother", "a cute cartoon little boy with a cap grinning playfully"),
        ("sister", "a cute cartoon little girl with a hair bow smiling sweetly"),
    ]),
    ("unit-02", "#E3F2FD", [
        ("cold", "a cute cartoon child shivering in winter clothes with snowflakes around"),
        ("hot", "a cute cartoon child fanning themselves with sweat drops under a sun"),
        ("thirsty", "a cute cartoon child drinking water from a glass eagerly"),
        ("hungry", "a cute cartoon child holding an empty plate looking at food"),
        ("happy", "a cute cartoon child jumping with joy and a big smile"),
        ("tired", "a cute cartoon child yawning and rubbing eyes sleepily"),
    ]),
    ("unit-03", "#E8F5E9", [
        ("pencil case", "a cute cartoon pencil case with a zipper and a happy face"),
        ("pencil", "a cute cartoon yellow pencil with a smiling face"),
        ("eraser", "a cute cartoon pink eraser with a happy face"),
        ("ruler", "a cute cartoon ruler with measurement marks and a smiling face"),
        ("pen", "a cute cartoon blue pen with a happy face"),
        ("crayon", "a cute cartoon red crayon with a smiling face"),
    ]),
    ("unit-04", "#F3E5F5", [
        ("read", "a cute cartoon child sitting and reading a book happily"),
        ("draw", "a cute cartoon child drawing with colored pencils at a desk"),
        ("sing", "a cute cartoon child singing into a microphone with music notes"),
        ("write", "a cute cartoon child writing with a pencil at a desk"),
        ("dance", "a cute cartoon child dancing happily with arms up"),
        ("swim", "a cute cartoon child swimming in water with splashes"),
    ]),
    ("unit-05", "#DCEDC8", [
        ("dog", "a cute round puppy with floppy ears wagging tail happily"),
        ("cat", "a cute round orange cat with big eyes sitting and smiling"),
        ("fish", "a cute round orange goldfish swimming with bubbles"),
        ("bird", "a cute small round blue bird with wings spread singing"),
        ("hamster", "a cute round hamster with puffy cheeks holding a seed"),
        ("tortoise", "a cute round green tortoise with a shell smiling slowly"),
    ]),
    ("unit-06", "#FCE4EC", [
        ("red", "a cute round red apple with a happy face"),
        ("white", "a cute round white snowman with a happy face"),
        ("yellow", "a cute smiling yellow sun with rays"),
        ("green", "a cute round green frog sitting and smiling"),
        ("blue", "a cute round blue whale smiling and spouting water"),
        ("black", "a cute round black cat with bright eyes smiling"),
    ]),
]

STYLE_PREFIX = "Flat design cartoon illustration for children's English learning app:"
STYLE_SUFFIX = ", simple clean shapes, bold colors, kawaii style, no text, no letters, suitable for 6-year-old kids, centered subject"


def build_prompt(desc, bg_color):
    return f"{STYLE_PREFIX} {desc}, {bg_color} background{STYLE_SUFFIX}"


def submit_task(prompt):
    url = f"{API_BASE}/services/aigc/text2image/image-synthesis"
    headers = {
        "Authorization": f"Bearer {API_KEY}",
        "Content-Type": "application/json",
        "X-DashScope-Async": "enable",
    }
    payload = {
        "model": MODEL,
        "input": {"prompt": prompt},
        "parameters": {"size": "1024*1024", "n": 1},
    }
    resp = requests.post(url, headers=headers, json=payload, timeout=60)
    if resp.status_code != 200:
        raise Exception(f"提交失败 HTTP {resp.status_code}: {resp.text[:200]}")
    data = resp.json()
    task_id = data.get("output", {}).get("task_id")
    if not task_id:
        raise Exception(f"无 task_id: {data}")
    return task_id


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
            time.sleep(3)
        else:
            raise Exception(f"未知状态: {status}")

    raise Exception(f"超时({max_wait}s)")


def download_image(img_url, save_path):
    resp = requests.get(img_url, timeout=60)
    if resp.status_code != 200:
        raise Exception(f"下载失败 HTTP {resp.status_code}")
    with open(save_path, "wb") as f:
        f.write(resp.content)
    return len(resp.content)


def compress_image(path):
    """压缩为 256x256 + 128色"""
    from PIL import Image
    img = Image.open(path).convert("RGBA")
    img = img.resize((256, 256), Image.LANCZOS)
    img = img.quantize(colors=128, method=2).convert("RGBA")
    img.save(path, "PNG", optimize=True)
    return os.path.getsize(path)


def main():
    total = sum(len(words) for _, _, words in UNITS)
    done = 0
    skipped = 0
    failed = 0
    failed_list = []

    print(f"=== 批量生成 flat 风格单词配图（2024新版一上） ===")
    print(f"总计: {total} 张 | 模型: {MODEL}")
    print(f"输出: {OUTPUT_DIR}")
    print()

    for unit_id, bg_color, words in UNITS:
        unit_dir = os.path.join(OUTPUT_DIR, unit_id)
        os.makedirs(unit_dir, exist_ok=True)
        print(f"[{unit_id}]")

        for word, desc in words:
            done += 1
            # 文件名：多词用下划线连接
            filename = word.replace(" ", "_") + ".png"
            save_path = os.path.join(unit_dir, filename)

            if os.path.exists(save_path) and os.path.getsize(save_path) > 1000:
                print(f"  [{done}/{total}] {filename} - 已存在，跳过")
                skipped += 1
                continue

            prompt = build_prompt(desc, bg_color)
            print(f"  [{done}/{total}] {filename} ...", end="", flush=True)

            try:
                task_id = submit_task(prompt)
                img_url = poll_task(task_id)
                size = download_image(img_url, save_path)
                # 压缩
                final_size = compress_image(save_path)
                print(f" OK ({final_size // 1024}KB)")
            except Exception as e:
                failed += 1
                failed_list.append(f"{unit_id}/{word}")
                print(f" FAILED: {e}")

            time.sleep(1)

        print()

    print(f"=== 完成 ===")
    print(f"成功: {total - skipped - failed} | 跳过: {skipped} | 失败: {failed}")
    if failed_list:
        print(f"失败列表: {failed_list}")
        print("重新运行脚本即可补生成（已有的自动跳过）")


if __name__ == "__main__":
    main()
