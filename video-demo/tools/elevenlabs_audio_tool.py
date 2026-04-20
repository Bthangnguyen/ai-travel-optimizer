import requests
import base64
import json
import sys
import os

ELEVENLABS_API_KEY = "sk_f6d7232c53ecbd9bba5b921bcc6cf41fd10edec1b3927dd3"
VOICE_ID = "pNInz6obpgDQGcFmaJcg" # Adam (người thật, rất ngầu cho Dark theme)

OUTPUT_DIR = "public"
TEXT_FILE = "script.txt"
OUTPUT_MP3 = os.path.join(OUTPUT_DIR, "vo_full.mp3")
OUTPUT_VTT = os.path.join(OUTPUT_DIR, "vo_full.vtt")

def format_vtt_time(seconds):
    """Chuyển đổi giây sang định dạng VTT time: HH:MM:SS.mmm"""
    ms = int((seconds % 1) * 1000)
    s = int(seconds) % 60
    m = int(seconds / 60) % 60
    h = int(seconds / 3600)
    return f"{h:02d}:{m:02d}:{s:02d}.{ms:03d}"

def generate_speech(text):
    print("[TTS] Đang gọi ElevenLabs API (với Timestamps)...")
    
    url = f"https://api.elevenlabs.io/v1/text-to-speech/{VOICE_ID}/with-timestamps"
    
    headers = {
        "xi-api-key": ELEVENLABS_API_KEY,
        "Content-Type": "application/json"
    }
    
    data = {
        "text": text,
        "model_id": "eleven_monolingual_v1", # Model chuẩn nhanh
        "voice_settings": {
            "stability": 0.5,
            "similarity_boost": 0.75
        }
    }
    
    response = requests.post(url, json=data, headers=headers)
    
    if response.status_code != 200:
        print(f"[ERROR] ElevenLabs trả về lỗi: {response.text}")
        sys.exit(1)
        
    result = response.json()
    
    # 1. Lưu Audio
    audio_bytes = base64.b64decode(result["audio_base64"])
    os.makedirs(OUTPUT_DIR, exist_ok=True)
    with open(OUTPUT_MP3, "wb") as f:
        f.write(audio_bytes)
        
    print(f"[OK] Đã lưu Audio: {OUTPUT_MP3} ({len(audio_bytes)/1024:.1f} KB)")
    
    # 2. Xử lý Alignment Array thành VTT chuẩn (gom từng câu)
    alignment = result.get("alignment", {})
    chars = alignment.get("characters", [])
    starts = alignment.get("character_start_times_seconds", [])
    ends = alignment.get("character_end_times_seconds", [])
    
    vtt_content = "WEBVTT\n\n"
    
    if chars:
        # Gom ký tự thành từng câu dựa trên dấu chấm/phẩy/xuống dòng
        sentences = []
        current_sentence = ""
        sent_start = starts[0]
        sent_end = ends[0]
        
        for i in range(len(chars)):
            c = chars[i]
            current_sentence += c
            sent_end = ends[i]
            
            # Kết thúc câu khi gặp dấu chấm kết thúc hoặc newline
            if c in ['.', '!', '?'] or (c == '\n') or (i == len(chars) - 1):
                text_clean = current_sentence.strip()
                if text_clean:
                    vtt_content += f"{format_vtt_time(sent_start)} --> {format_vtt_time(sent_end)}\n"
                    vtt_content += f"{text_clean}\n\n"
                
                current_sentence = ""
                if i + 1 < len(chars):
                    sent_start = starts[i + 1]

        with open(OUTPUT_VTT, "w", encoding="utf-8") as f:
            f.write(vtt_content)
        print(f"[OK] Đã tạo phụ đề đồng bộ: {OUTPUT_VTT}")
    else:
        print("[WARN] API không trả về thông tin Timestamps.")

if __name__ == "__main__":
    text_input = ""
    if len(sys.argv) > 1:
        text_input = sys.argv[1]
    elif os.path.exists(TEXT_FILE):
        with open(TEXT_FILE, "r", encoding="utf-8") as f:
            text_input = f.read().strip()
            
    if not text_input:
        print("[ERROR] Không có nội dung để đọc!")
        sys.exit(1)
        
    generate_speech(text_input)
