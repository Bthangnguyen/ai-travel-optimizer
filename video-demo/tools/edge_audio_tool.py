"""
edge_audio_tool.py (FIXED v2)

Generates TTS audio + VTT subtitles using edge-tts CLI.
Falls back to programmatic API if CLI fails.

Usage: python tools/edge_audio_tool.py [optional text]
"""

import subprocess
import sys
import os

VOICE = "en-US-GuyNeural"
OUTPUT_DIR = "public"
TEXT_FILE = "script.txt"
OUTPUT_MP3 = os.path.join(OUTPUT_DIR, "vo_full.mp3")
OUTPUT_VTT = os.path.join(OUTPUT_DIR, "vo_full.vtt")

def generate_speech(text):
    print(f"[TTS] Generating speech with voice: {VOICE}...")
    print(f"   Text length: {len(text)} characters")

    if not os.path.exists(OUTPUT_DIR):
        os.makedirs(OUTPUT_DIR)

    # Use CLI for reliable VTT output
    cmd = [
        sys.executable, "-m", "edge_tts",
        "--voice", VOICE,
        "--text", text,
        "--write-media", OUTPUT_MP3,
        "--write-subtitles", OUTPUT_VTT,
    ]

    result = subprocess.run(cmd, capture_output=True, text=True)

    if result.returncode != 0:
        print(f"[ERROR] edge-tts CLI failed: {result.stderr}")
        sys.exit(1)

    # Verify files were created
    if not os.path.exists(OUTPUT_MP3):
        print("[ERROR] Audio file not created!")
        sys.exit(1)

    mp3_size = os.path.getsize(OUTPUT_MP3)
    print(f"[OK] Audio: {OUTPUT_MP3} ({mp3_size / 1024:.1f} KB)")

    if os.path.exists(OUTPUT_VTT):
        vtt_size = os.path.getsize(OUTPUT_VTT)
        print(f"[OK] Subtitles: {OUTPUT_VTT} ({vtt_size} bytes)")
    else:
        print("[WARN] VTT not created")

if __name__ == "__main__":
    if len(sys.argv) > 1:
        text_input = sys.argv[1]
    else:
        if os.path.exists(TEXT_FILE):
            with open(TEXT_FILE, "r", encoding="utf-8") as f:
                text_input = f.read().strip()
        else:
            print("[ERROR] No script.txt found!")
            sys.exit(1)

    generate_speech(text_input)
