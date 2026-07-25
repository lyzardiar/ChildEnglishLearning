"""
批量生成单词配图 - DashScope API (通义万相 wanx2.1-t2i-turbo)
用法: python generate_images.py
支持断点续跑：已存在的图片自动跳过
"""
import requests
import os
import time
import sys

# === 配置 ===
API_BASE = "https://ws-kqo9v7po1ltm5rmp.cn-beijing.maas.aliyuncs.com/api/v1"
API_KEY = "sk-ws-H.EIMYHXL.6wvp.MEUCIQCLmbE0Fx6PGULNn1STsXlaHQGfKzmE5NNd_LNg2TrG4QIgS-aDzvFubLXIQ7ranD5GSmGRV7krcC4V3-535HoCxO4"
MODEL = "wanx2.1-t2i-turbo"
OUTPUT_DIR = r"G:\work\git\ChildEnglishLearning\miniprogram\images\words\flat"

# === 单词数据 ===
UNITS = [
    ("unit-01", "#E3F2FD", [
        ("hello", "a cute cartoon child waving hand happily with a big smile"),
        ("hi", "a cheerful cartoon kid raising one hand in a friendly greeting gesture"),
        ("goodbye", "a cute cartoon child waving goodbye with a gentle smile"),
        ("bye", "a small cute cartoon bear waving paw saying bye-bye"),
        ("morning", "a bright smiling sun rising over simple hills with a rooster"),
        ("afternoon", "a happy sun high in the sky with fluffy clouds below"),
    ]),
    ("unit-02", "#E3F2FD", [
        ("name", "a cute cartoon name tag badge with a smiling face on it"),
        ("boy", "a cute cartoon boy with short hair smiling and standing"),
        ("girl", "a cute cartoon girl with pigtails smiling and standing"),
        ("teacher", "a friendly cartoon female teacher with glasses smiling"),
        ("friend", "two cute cartoon kids holding hands and smiling at each other"),
        ("nice", "a cute cartoon thumbs up hand with sparkles around it"),
    ]),
    ("unit-03", "#FFF3E0", [
        ("father", "a cute cartoon dad with short hair smiling warmly"),
        ("mother", "a cute cartoon mom with long hair smiling gently"),
        ("brother", "a cute cartoon little boy with a cap grinning playfully"),
        ("sister", "a cute cartoon little girl with a hair bow smiling sweetly"),
        ("grandpa", "a cute cartoon grandfather with white hair and glasses smiling kindly"),
        ("grandma", "a cute cartoon grandmother with a bun hairstyle and glasses smiling warmly"),
    ]),
    ("unit-04", "#E8F5E9", [
        ("eye", "a pair of big cute cartoon eyes with long eyelashes"),
        ("ear", "a cute cartoon ear with sound waves coming in"),
        ("nose", "a cute round cartoon nose on a simple face"),
        ("mouth", "a cute cartoon smiling mouth with rosy lips"),
        ("hand", "a cute cartoon open hand with five fingers spread out"),
        ("foot", "a cute cartoon bare foot with tiny toes"),
    ]),
    ("unit-05", "#F3E5F5", [
        ("one", "one cute round red apple"),
        ("two", "two cute round oranges side by side"),
        ("three", "three cute colorful balloons floating together"),
        ("four", "four cute little stars in a row smiling"),
        ("five", "five cute little fingers on one hand waving"),
        ("six", "six cute colorful candies in a group"),
        ("seven", "seven cute little flowers in a bunch"),
        ("eight", "eight cute little butterflies flying together"),
        ("nine", "nine cute little birds sitting on a branch"),
        ("ten", "ten cute little toes on two feet wiggling"),
    ]),
    ("unit-06", "soft rainbow gradient", [
        ("red", "a cute round red strawberry with a happy face"),
        ("blue", "a cute round blue whale smiling and spouting water"),
        ("yellow", "a cute smiling yellow sun with rays"),
        ("green", "a cute round green frog sitting and smiling"),
        ("orange", "a cute round orange fruit with a happy face"),
        ("purple", "a cute bunch of purple grapes with a smiling face"),
    ]),
    ("unit-07", "#DCEDC8", [
        ("cat", "a cute round orange cat with big eyes sitting and smiling"),
        ("dog", "a cute round puppy with floppy ears wagging tail happily"),
        ("bird", "a cute small round blue bird with wings spread singing"),
        ("fish", "a cute round orange goldfish swimming with bubbles"),
        ("rabbit", "a cute round white rabbit with long ears holding a carrot"),
        ("monkey", "a cute cartoon monkey with a long tail hanging and smiling"),
    ]),
    ("unit-08", "#FCE4EC", [
        ("apple", "a cute round red apple with a leaf and a happy face"),
        ("banana", "a cute yellow banana with a smiling face"),
        ("orange", "a cute round orange citrus fruit with a happy face and a leaf"),
        ("pear", "a cute green pear with a smiling face and a small leaf"),
        ("peach", "a cute round pink peach with a happy face and a leaf"),
        ("grape", "a cute bunch of purple grapes with a smiling face"),
    ]),
    ("unit-09", "#FFFDE7", [
        ("rice", "a cute bowl of white steamed rice with chopsticks and a happy face"),
        ("egg", "a cute fried egg with a smiling yolk face"),
        ("milk", "a cute carton of milk with a happy face and a straw"),
        ("bread", "a cute slice of bread with a smiling face and rosy cheeks"),
        ("cake", "a cute round birthday cake with cream and a cherry on top smiling"),
        ("water", "a cute glass of water with a happy face and water drops around"),
    ]),
    ("unit-10", "#E1F5FE", [
        ("ball", "a cute colorful bouncy ball with a happy face"),
        ("doll", "a cute round rag doll with pigtails and a dress smiling"),
        ("car", "a cute round red toy car with big eyes on the windshield"),
        ("kite", "a cute colorful diamond kite with a happy face flying with a tail"),
        ("robot", "a cute small round robot with antenna waving hello"),
        ("bear", "a cute round brown teddy bear sitting and hugging itself"),
    ]),
    ("unit-11", "light blue gradient", [
        ("sun", "a cute big smiling sun with rays spreading out"),
        ("rain", "a cute smiling cloud with raindrops falling from it"),
        ("wind", "a cute cartoon wind swirl with leaves blowing"),
        ("cloud", "a cute fluffy white cloud with a happy sleeping face"),
        ("hot", "a cute cartoon sun with sweat drops and a thermometer looking hot"),
        ("cold", "a cute cartoon snowman shivering with a scarf looking cold"),
    ]),
    ("unit-12", "#FFEBEE", [
        ("new", "a cute sparkling new star with shine effects around it"),
        ("year", "a cute cartoon calendar with a happy face and a ribbon"),
        ("happy", "a cute cartoon child jumping with joy and confetti around"),
        ("party", "a cute party hat with balloons and confetti"),
        ("sing", "a cute cartoon child singing into a microphone with music notes around"),
        ("dance", "a cute cartoon child dancing happily with arms up and music notes"),
    ]),
]

STYLE_PREFIX = "Flat design cartoon illustration for children's English learning app:"
STYLE_SUFFIX = ", simple clean shapes, bold colors, kawaii style, no text, no letters, suitable for 6-year-old kids, centered subject"


def build_prompt(desc, bg_color):
    return f"{STYLE_PREFIX} {desc}, {bg_color} background{STYLE_SUFFIX}"


def submit_task(prompt):
    """提交异步生图任务，返回 task_id"""
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
    """轮询任务状态，返回图片 URL"""
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
    """下载图片到本地"""
    resp = requests.get(img_url, timeout=60)
    if resp.status_code != 200:
        raise Exception(f"下载失败 HTTP {resp.status_code}")
    with open(save_path, "wb") as f:
        f.write(resp.content)
    return len(resp.content)


def generate_one(prompt, save_path):
    """完整流程：提交 → 轮询 → 下载"""
    task_id = submit_task(prompt)
    img_url = poll_task(task_id)
    size = download_image(img_url, save_path)
    return size


def main():
    total = sum(len(words) for _, _, words in UNITS)
    done = 0
    skipped = 0
    failed = 0
    failed_list = []

    print(f"=== 批量生成 flat 风格单词配图 ===")
    print(f"总计: {total} 张 | 模型: {MODEL}")
    print(f"输出: {OUTPUT_DIR}")
    print()

    for unit_id, bg_color, words in UNITS:
        unit_dir = os.path.join(OUTPUT_DIR, unit_id)
        os.makedirs(unit_dir, exist_ok=True)
        print(f"[{unit_id}]")

        for word, desc in words:
            done += 1
            save_path = os.path.join(unit_dir, f"{word}.png")

            if os.path.exists(save_path) and os.path.getsize(save_path) > 1000:
                print(f"  [{done}/{total}] {word}.png - 已存在，跳过")
                skipped += 1
                continue

            prompt = build_prompt(desc, bg_color)
            print(f"  [{done}/{total}] {word}.png ...", end="", flush=True)

            try:
                size = generate_one(prompt, save_path)
                print(f" OK ({size // 1024}KB)")
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
