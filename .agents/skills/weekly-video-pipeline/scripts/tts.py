#!/usr/bin/env python3
"""
TTS 语音合成脚本 — 基于阿里云百炼 qwen3-tts-flash

单文件模式:
  python tts.py "要合成的文本" --output out.wav
  python tts.py narration/00-title.txt --output audio/00-title.wav

批量模式:
  python tts.py --batch narration/ --output-dir audio/

环境变量:
  DASHSCOPE_API_KEY  阿里云百炼 API Key（必须）
"""

import argparse
import os
import sys
import time
import urllib.request
from pathlib import Path

MAX_RETRIES = 3
RETRY_DELAY_SECONDS = 5

ENV_FILE_SEARCH_PATHS = [
    ".baoyu-skills/.env",
    "../.baoyu-skills/.env",
    "../../.baoyu-skills/.env",
]


def load_env_file() -> None:
    """从 .baoyu-skills/.env 加载环境变量（如果 DASHSCOPE_API_KEY 未设置）。"""
    if os.getenv("DASHSCOPE_API_KEY"):
        return

    for relative_path in ENV_FILE_SEARCH_PATHS:
        env_path = Path(relative_path).resolve()
        if env_path.exists():
            for line in env_path.read_text(encoding="utf-8").splitlines():
                line = line.strip()
                if line and not line.startswith("#") and "=" in line:
                    key, _, value = line.partition("=")
                    os.environ.setdefault(key.strip(), value.strip())
            print(f"已从 {env_path} 加载环境变量")
            return


def synthesize(text: str, voice: str, lang: str) -> str:
    """调用 qwen3-tts-flash 合成语音，返回音频下载 URL。支持自动重试。"""
    try:
        import dashscope
    except ImportError:
        print("错误: 请先安装 dashscope SDK: pip install dashscope", file=sys.stderr)
        sys.exit(1)

    dashscope.base_http_api_url = "https://dashscope.aliyuncs.com/api/v1"

    api_key = os.getenv("DASHSCOPE_API_KEY")
    if not api_key:
        print("错误: 未设置 DASHSCOPE_API_KEY 环境变量，也未在 .baoyu-skills/.env 中找到", file=sys.stderr)
        sys.exit(1)

    last_error = None
    for attempt in range(1, MAX_RETRIES + 1):
        try:
            response = dashscope.MultiModalConversation.call(
                model="qwen3-tts-flash",
                api_key=api_key,
                text=text,
                voice=voice,
                language_type=lang,
                stream=False,
            )

            if response.status_code != 200:
                raise RuntimeError(
                    f"TTS 调用失败 (status={response.status_code}): {response.message}"
                )

            audio_url = response.output.get("audio", {}).get("url")
            if not audio_url:
                raise RuntimeError(f"TTS 返回无音频 URL: {response.output}")

            return audio_url

        except Exception as exc:
            last_error = exc
            if attempt < MAX_RETRIES:
                print(f"  重试 {attempt}/{MAX_RETRIES}: {exc}", file=sys.stderr)
                time.sleep(RETRY_DELAY_SECONDS * attempt)

    raise RuntimeError(f"TTS 调用失败（已重试 {MAX_RETRIES} 次）: {last_error}")

    return audio_url


def download_audio(url: str, output_path: Path) -> None:
    """下载音频文件到本地。"""
    output_path.parent.mkdir(parents=True, exist_ok=True)
    urllib.request.urlretrieve(url, str(output_path))


def read_text(source: str) -> str:
    """从文件路径或直接字符串读取文本。"""
    source_path = Path(source)
    if source_path.exists() and source_path.is_file():
        return source_path.read_text(encoding="utf-8").strip()
    return source.strip()


def process_single(source: str, output: str, voice: str, lang: str) -> None:
    """处理单个文本 → 音频。"""
    text = read_text(source)
    if not text:
        print(f"警告: 输入文本为空，跳过", file=sys.stderr)
        return

    print(f"合成中: {text[:40]}{'...' if len(text) > 40 else ''}")
    audio_url = synthesize(text, voice, lang)
    output_path = Path(output)
    print(f"下载音频: {output_path}")
    download_audio(audio_url, output_path)
    print(f"完成: {output_path} ({output_path.stat().st_size / 1024:.1f} KB)")


def process_batch(input_dir: str, output_dir: str, voice: str, lang: str) -> None:
    """批量处理目录下所有 .txt 文件。"""
    input_path = Path(input_dir)
    output_path = Path(output_dir)

    txt_files = sorted(input_path.glob("*.txt"))
    if not txt_files:
        print(f"错误: {input_dir} 下没有 .txt 文件", file=sys.stderr)
        sys.exit(1)

    print(f"找到 {len(txt_files)} 个文本文件，开始批量合成...")
    succeeded = 0
    failed = []

    for txt_file in txt_files:
        wav_name = txt_file.stem + ".wav"
        wav_path = output_path / wav_name

        try:
            process_single(str(txt_file), str(wav_path), voice, lang)
            succeeded += 1
            time.sleep(0.5)  # 避免 API 限流
        except Exception as exc:
            print(f"失败: {txt_file.name} — {exc}", file=sys.stderr)
            failed.append(txt_file.name)

    print(f"\n批量合成完成: {succeeded}/{len(txt_files)} 成功")
    if failed:
        print(f"失败文件: {', '.join(failed)}", file=sys.stderr)


def main() -> None:
    load_env_file()
    parser = argparse.ArgumentParser(description="阿里云 qwen3-tts-flash 语音合成")
    parser.add_argument("source", nargs="?", help="文本文件路径或直接文本内容")
    parser.add_argument("--output", "-o", help="输出音频文件路径")
    parser.add_argument("--batch", help="批量模式: 输入目录路径")
    parser.add_argument("--output-dir", help="批量模式: 输出目录路径")
    parser.add_argument("--voice", default="Cherry", help="音色 (默认: Cherry/芊悦)")
    parser.add_argument("--lang", default="Chinese", help="语种 (默认: Chinese)")
    args = parser.parse_args()

    if args.batch:
        if not args.output_dir:
            print("错误: 批量模式需要指定 --output-dir", file=sys.stderr)
            sys.exit(1)
        process_batch(args.batch, args.output_dir, args.voice, args.lang)
    elif args.source:
        if not args.output:
            print("错误: 单文件模式需要指定 --output", file=sys.stderr)
            sys.exit(1)
        process_single(args.source, args.output, args.voice, args.lang)
    else:
        parser.print_help()
        sys.exit(1)


if __name__ == "__main__":
    main()
