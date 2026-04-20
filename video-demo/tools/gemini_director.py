import os
import json
import google.generativeai as genai
import sys

# Validate API Key
api_key = os.environ.get("GEMINI_API_KEY", "AIzaSyC2LYe7COJX2E3q4OFuXZ1WoRludiuHOEc")
genai.configure(api_key=api_key)

# Configure paths
ROOT_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SCRIPT_PATH = os.path.join(ROOT_DIR, 'script.txt')
OUTPUT_DIR = os.path.join(ROOT_DIR, 'src', 'AutoVideo')
OUTPUT_PATH = os.path.join(OUTPUT_DIR, 'video_plan.json')

def run():
    print("[Director Agent] Khoi dong...")
    
    # 1. Read script.txt
    if not os.path.exists(SCRIPT_PATH):
        print(f"[ERROR] Khong tim thay file {SCRIPT_PATH}")
        sys.exit(1)
        
    with open(SCRIPT_PATH, 'r', encoding='utf-8') as f:
        script_text = f.read()

    if not script_text.strip():
        print("[ERROR] File script.txt trong rong!")
        sys.exit(1)
        
    print("[Director Agent] Dang phan tich kich ban...")
    
    # 2. Call Gemini
    prompt = f"""Bạn là Đạo diễn Video kỳ cựu theo phong cách "Dark Needle" (phong cách Minimalist, Cinematic mạnh mẽ). Dưới đây là nội dung kịch bản:

{script_text}

Nhiệm vụ của bạn:
1. Chia kịch bản thành các cảnh (scenes) logic.
2. Chọn template phù hợp cho mỗi cảnh. Các template hiện có:
   - DarkBeat (Template chính! Dành cho mọi phân cảnh giải thích ý tưởng. Bao gồm hình nhân vật Stick Figure bên phải và Text bên trái)
   - BigTextReveal (Dùng cho thông điệp cực lớn, chốt hạ câu nói)

Lưu ý quan trọng về thiết kế "Dark Needle":
- Style màu: Bắt buộc dùng palette Đen (#000000), Trắng (#FFFFFF), Vàng Accent (#F5E500), Đỏ (#CC0000).
- KHÔNG dùng EMOJI. Style này hoàn toàn tối giản.
- Với template `DarkBeat`, bạn phải cấu hình:
  + `conceptWord`: 1-2 từ khóa QUAN TRỌNG NHẤT của cảnh (Sẽ hiển thị to, màu vàng). CHỮ PHẢI MANG Ý NGHĨA CONCEPT CHIẾN LƯỢC.
  + `supportText`: Câu phụ trợ làm rõ nghĩa (Màu trắng). 
  + `headType`: Chọn đầu cho nhân vật: "circle" (bình thường), "wrench" (Sửa chữa/Vấn đề), "syringe" (Tiêm nhiễm/Ám ảnh), "gear" (Suy nghĩ máy móc), "crown" (Quyền lực), "mask" (Giả tạo), "cracked" (Đổ vỡ).
  + `posture`: "upright" (Đứng thẳng tự tin) hoặc "slouched" (Cúi đầu, mệt mỏi, thất bại).

Đầu ra BẮT BUỘC phải là chuỗi JSON hợp lệ không có markdown block. Xem định dạng mẫu sau:
{{
  "compositionId": "AutoVideo",
  "palette": {{ "bg": "#000000", "text": "#FFFFFF", "accent": "#F5E500", "label": "#CC0000" }},
  "scenes": [
    {{
      "id": "S1",
      "template": "DarkBeat",
      "text": "[Nội dung kịch bản của cảnh này. Phải đầy đủ để TTS đọc]",
      "params": {{
        "conceptWord": "QUÁ TẢI",
        "supportText": "BẠN ĐANG CẢM THẤY",
        "conceptColor": "#F5E500",
        "headType": "gear",
        "posture": "slouched"
      }}
    }},
    {{
      "id": "S2",
      "template": "BigTextReveal",
      "text": "[Nội dung kịch bản]",
      "params": {{
        "subtitle": "KẾT QUẢ LÀ",
        "mainText": "SỤP ĐỔ",
        "accentColor": "#CC0000"
      }}
    }}
  ]
}}

Lưu ý: Trường "text" của mỗi cảnh sẽ được dùng để tổng hợp âm thanh chuyển ngữ (TTS), nên bạn PHẢI ghép chúng lại thành đúng 100% nội dung kịch bản đầu vào, không được bớt từ nào của tác giả.
KHÔNG sử dụng ký tự ```json ở đầu và cuối."""

    try:
        model = genai.GenerativeModel('gemini-2.5-flash')
        response = model.generate_content(prompt)
        
        raw_json = response.text.replace("```json", "").replace("```", "").strip()
        
        # Validate valid JSON
        plan_data = json.loads(raw_json)
        
        # Write to video_plan.json
        os.makedirs(OUTPUT_DIR, exist_ok=True)
        with open(OUTPUT_PATH, 'w', encoding='utf-8') as f:
            json.dump(plan_data, f, ensure_ascii=False, indent=2)
            
        print(f"[OK] Da luu ban dao dien vao {OUTPUT_PATH}")
        print(f"[INFO] Tong so canh: {len(plan_data.get('scenes', []))} canh")
        
    except Exception as e:
        print(f"[ERROR] Mat ket noi API hoac Loi dinh dang JSON")
        print(e)
        sys.exit(1)

if __name__ == "__main__":
    run()
