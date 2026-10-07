import json
import os
import sys
import time
import yt_dlp
from kisskh_downloader.kisskh_api import KissKHApi

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
PROJECT_ROOT = os.path.abspath(os.path.join(SCRIPT_DIR, "..", "..", ".."))
CACHE_DIR = os.path.join(PROJECT_ROOT, "temp")
TOKEN_CACHE_FILE = os.path.join(CACHE_DIR, "kisskh_keys_cache.json")

def load_cached_keys():
    if os.path.exists(TOKEN_CACHE_FILE):
        try:
            with open(TOKEN_CACHE_FILE, "r") as f:
                data = json.load(f)
                # Valid for 8 hours (28800 seconds)
                if time.time() - data.get("timestamp", 0) < 28800:
                    return data.get("keys")
        except Exception:
            pass
    return None

def save_cached_keys(keys: dict):
    try:
        os.makedirs(CACHE_DIR, exist_ok=True)
        with open(TOKEN_CACHE_FILE, "w") as f:
            json.dump({"timestamp": time.time(), "keys": keys}, f)
    except Exception:
        pass

def get_drama_info(drama_id: int):
    api = KissKHApi(base_url="https://kisskh.co")
    drama_url = api._drama_api_url(drama_id)
    res = api._request(drama_url)
    drama = res.json()
    episodes = drama.get("episodes", [])
    return {
        "id": drama.get("id"),
        "title": drama.get("title", "KissKH Drama"),
        "thumbnail": drama.get("thumbnail", ""),
        "episodesCount": drama.get("episodesCount", len(episodes)),
        "episodes": [{"id": ep.get("id"), "number": ep.get("number")} for ep in episodes]
    }

def get_stream(drama_id: int, ep_number: int = 1, ep_id: int = None, drama_title: str = "Drama"):
    api = KissKHApi(base_url="https://kisskh.co")
    drama_url = api._drama_api_url(drama_id)
    res = api._request(drama_url)
    drama = res.json()
    episodes = drama.get("episodes", [])
    title = drama.get("title", drama_title)

    target_ep = None
    if ep_id:
        target_ep = next((e for e in episodes if e.get("id") == ep_id), None)
    if not target_ep:
        target_ep = next((e for e in episodes if int(e.get("number", 0)) == ep_number), None)
    if not target_ep and episodes:
        target_ep = episodes[0]

    if not target_ep:
        raise ValueError(f"No episode found for drama {drama_id}")

    actual_ep_id = target_ep.get("id")
    actual_ep_num = int(target_ep.get("number", 1))

    # Fast path: Try using cached token first without launching Playwright (takes ~0.2s)
    cached_keys = load_cached_keys()
    if cached_keys and "stream" in cached_keys:
        try:
            stream_url = api.get_stream_url(actual_ep_id, cached_keys["stream"])
            if stream_url and stream_url.startswith("http"):
                return {
                    "title": f"{title} - Episode {actual_ep_num}",
                    "streamUrl": stream_url,
                    "episodeNumber": actual_ep_num,
                    "episodeId": actual_ep_id
                }
        except Exception:
            pass

    # Slow path: Generate fresh tokens with Playwright and cache for future requests
    keys = api.generate_kkeys(drama_id, actual_ep_id, actual_ep_num, title)
    save_cached_keys(keys)
    stream_url = api.get_stream_url(actual_ep_id, keys.get("stream", ""))

    return {
        "title": f"{title} - Episode {actual_ep_num}",
        "streamUrl": stream_url,
        "episodeNumber": actual_ep_num,
        "episodeId": actual_ep_id
    }

def download_drama(drama_id: int, ep_number: int, output_base: str, quality: str = "720p", is_audio: bool = False, ffmpeg_path: str = None, ep_id: int = None):
    stream = get_stream(drama_id, ep_number, ep_id)
    stream_url = stream["streamUrl"]
    title = stream["title"]

    height = "720"
    if "1080" in quality:
        height = "1080"
    elif "480" in quality:
        height = "480"
    elif "360" in quality:
        height = "360"
    elif quality == "best":
        height = "1080"

    progress_file = f"{output_base}.progress.json"

    def progress_hook(d):
        if d.get("status") == "downloading":
            frag_index = d.get("fragment_index") or 0
            frag_count = d.get("fragment_count") or 1
            downloaded = d.get("downloaded_bytes") or 0
            total = d.get("total_bytes") or d.get("total_bytes_estimate") or 0
            speed = d.get("speed") or 0

            percent = 0
            if frag_count > 0:
                percent = min(98, round((frag_index / frag_count) * 100))
            elif total > 0:
                percent = min(98, round((downloaded / total) * 100))

            speed_str = ""
            if speed:
                speed_mb = speed / (1024 * 1024)
                speed_str = f" ({speed_mb:.1f} MB/s)"

            try:
                with open(progress_file, "w") as pf:
                    json.dump({"progress": percent, "speed": speed_str, "status": "downloading"}, pf)
            except Exception:
                pass

    ydl_opts = {
        "concurrent_fragment_downloads": 24,  # High parallel connection for max bandwidth
        "buffersize": 16 * 1024 * 1024,      # 16MB socket buffer
        "http_chunk_size": 10485760,         # 10MB chunk size
        "outtmpl": f"{output_base}.%(ext)s",
        "http_headers": {
            "Referer": "https://kisskh.co/",
            "User-Agent": (
                "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
                "AppleWebKit/537.36 (KHTML, like Gecko) "
                "Chrome/147.0.0.0 Safari/537.36"
            ),
        },
        "retries": 10,
        "fragment_retries": 10,
        "quiet": True,
        "no_warnings": True,
        "noprogress": True,
        "progress_hooks": [progress_hook],
    }

    if ffmpeg_path and os.path.exists(ffmpeg_path):
        ydl_opts["ffmpeg_location"] = ffmpeg_path
        ydl_opts["postprocessor_args"] = {"ffmpeg": ["-threads", "0"]}

    if is_audio:
        ydl_opts["format"] = "bestaudio/best"
        ydl_opts["postprocessors"] = [{
            "key": "FFmpegExtractAudio",
            "preferredcodec": "mp3",
            "preferredquality": "320",
        }]
    else:
        ydl_opts["format"] = f"bestvideo[height<={height}]+bestaudio/best[height<={height}]/best"
        ydl_opts["merge_output_format"] = "mp4"

    try:
        with yt_dlp.YoutubeDL(ydl_opts) as ydl:
            ydl.download([stream_url])
    finally:
        try:
            if os.path.exists(progress_file):
                os.remove(progress_file)
        except Exception:
            pass

    target_ext = "mp3" if is_audio else "mp4"
    expected = f"{output_base}.{target_ext}"
    if not os.path.exists(expected):
        base_dir = os.path.dirname(output_base)
        prefix = os.path.basename(output_base)
        if os.path.exists(base_dir):
            for f in os.listdir(base_dir):
                if f.startswith(prefix) and not f.endswith('.part') and not f.endswith('.ytdl') and not f.endswith('.progress.json'):
                    expected = os.path.join(base_dir, f)
                    break

    return {
        "success": True,
        "title": title,
        "filePath": expected,
        "extension": os.path.splitext(expected)[1].replace('.', '')
    }

if __name__ == "__main__":
    if len(sys.argv) < 3:
        print(json.dumps({"error": "Invalid arguments"}))
        sys.exit(1)

    cmd = sys.argv[1]
    drama_id = int(sys.argv[2])

    try:
        if cmd == "info":
            data = get_drama_info(drama_id)
            print(json.dumps(data))
        elif cmd == "stream":
            ep_num = int(sys.argv[3]) if len(sys.argv) > 3 else 1
            ep_id = int(sys.argv[4]) if len(sys.argv) > 4 else None
            data = get_stream(drama_id, ep_num, ep_id)
            print(json.dumps(data))
        elif cmd == "download":
            ep_num = int(sys.argv[3]) if len(sys.argv) > 3 else 1
            output_base = sys.argv[4]
            quality = sys.argv[5] if len(sys.argv) > 5 else "720p"
            is_audio = (sys.argv[6].lower() == "true") if len(sys.argv) > 6 else False
            ffmpeg_path = sys.argv[7] if len(sys.argv) > 7 and sys.argv[7] != "none" else None
            ep_id = int(sys.argv[8]) if len(sys.argv) > 8 and sys.argv[8] != "none" else None
            
            data = download_drama(drama_id, ep_num, output_base, quality, is_audio, ffmpeg_path, ep_id)
            print(json.dumps(data))
        else:
            print(json.dumps({"error": f"Unknown command {cmd}"}))
            sys.exit(1)
    except Exception as e:
        print(json.dumps({"error": str(e)}))
        sys.exit(1)
