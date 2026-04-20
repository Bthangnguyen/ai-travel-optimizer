/**
 * step3_run_batch.js
 * 
 * Tự động gửi từng video URL tới Gemini Flash 3 API để phân tích.
 * Đọc video_urls.json → Gửi API → Lưu kết quả JSON vào research/results/
 * 
 * Cách chạy: node research/step3_run_batch.js
 * 
 * Yêu cầu:
 * - GEMINI_API_KEY trong biến môi trường hoặc file .env
 * - File research/video_urls.json đã có sẵn (từ step1)
 */

const fs = require('fs');
const path = require('path');

// ── Cấu hình ────────────────────────────────────────────────────────────────
const API_KEY = process.env.GEMINI_API_KEY || 'AIzaSyC2LYe7COJX2E3q4OFuXZ1WoRludiuHOEc';
const MODEL = 'gemini-2.5-flash'; // Flash 3 — rẻ, nhanh, hỗ trợ video
const URLS_PATH = path.join(__dirname, 'video_urls.json');
const RESULTS_DIR = path.join(__dirname, 'results');
const PROMPT_PATH = path.join(__dirname, 'step2_analysis_prompt.md');

// Đọc system prompt từ file
const SYSTEM_PROMPT_RAW = fs.readFileSync(PROMPT_PATH, 'utf-8');
// Trích xuất phần trong ```...``` đầu tiên (SYSTEM PROMPT)
const systemMatch = SYSTEM_PROMPT_RAW.match(/## SYSTEM PROMPT[^`]*```\n([\s\S]*?)```/);
const SYSTEM_PROMPT = systemMatch ? systemMatch[1].trim() : '';

// ── Tốc độ & Retry ──────────────────────────────────────────────────────────
const DELAY_BETWEEN_CALLS_MS = 5000; // 5 giây giữa mỗi call (tránh rate limit)
const MAX_RETRIES = 3;

// ── Helper: Delay ────────────────────────────────────────────────────────────
function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// ── Helper: Gọi Gemini API ───────────────────────────────────────────────────
async function analyzeVideo(videoUrl, videoTitle) {
  const requestBody = {
    system_instruction: {
      parts: [{ text: SYSTEM_PROMPT }]
    },
    contents: [
      {
        parts: [
          {
            fileData: {
              mimeType: "video/*", 
              fileUri: videoUrl
            }
          },
          {
            text: `Phân tích video YouTube sau đây theo chỉ dẫn trong system prompt.\nTrả về JSON hợp lệ duy nhất, KHÔNG kèm markdown.\n\nVideo Title: ${videoTitle}\nVideo URL: ${videoUrl}`
          }
        ]
      }
    ],
    generationConfig: {
      temperature: 0.1,
      maxOutputTokens: 65536,
      responseMimeType: "application/json"
    }
  };

  const url = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${API_KEY}`;
  
  // 5 phút timeout cho video dài
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 10 * 60 * 1000);

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(requestBody),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`API ${response.status}: ${errText.substring(0, 300)}`);
    }

    const data = await response.json();
    
    // Trích xuất text từ response
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!text) {
      const reason = data.candidates?.[0]?.finishReason || 'unknown';
      throw new Error(`No content. Finish reason: ${reason}`);
    }

    // Parse JSON
    const cleaned = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    return JSON.parse(cleaned);
  } catch (err) {
    clearTimeout(timeoutId);
    if (err.name === 'AbortError') {
      throw new Error('Timeout (5 min) — video qua dai hoac API cham');
    }
    throw err;
  }
}

// ── Main ─────────────────────────────────────────────────────────────────────
async function main() {
  console.log('=== STEP 3: Batch Analysis via Gemini Flash 3 ===\n');

  // Kiểm tra API key
  if (API_KEY === 'YOUR_GEMINI_API_KEY') {
    console.log('ERROR: Chua cau hinh GEMINI_API_KEY');
    console.log('Dat bien moi truong: set GEMINI_API_KEY=your_key');
    process.exit(1);
  }

  // Đọc danh sách URL
  if (!fs.existsSync(URLS_PATH)) {
    console.log('ERROR: Chua co file video_urls.json. Chay step1 truoc.');
    process.exit(1);
  }
  const videos = JSON.parse(fs.readFileSync(URLS_PATH, 'utf-8'));
  console.log(`Tim thay ${videos.length} video can phan tich.\n`);

  // Tạo thư mục results
  if (!fs.existsSync(RESULTS_DIR)) fs.mkdirSync(RESULTS_DIR, { recursive: true });

  // Xử lý từng video
  let successCount = 0;
  let failCount = 0;

  for (let i = 0; i < videos.length; i++) {
    const video = videos[i];
    const outputFile = path.join(RESULTS_DIR, `${video.videoId}.json`);

    // Bỏ qua nếu đã phân tích rồi (resume capability)
    if (fs.existsSync(outputFile)) {
      console.log(`[${i+1}/${videos.length}] SKIP (da co): ${video.title}`);
      successCount++;
      continue;
    }

    console.log(`[${i+1}/${videos.length}] Dang phan tich: ${video.title}`);

    let success = false;
    for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
      try {
        const result = await analyzeVideo(video.url, video.title);
        
        // Ghi kết quả
        fs.writeFileSync(outputFile, JSON.stringify(result, null, 2));
        console.log(`   => OK (${result.totalScenes || '?'} scenes)\n`);
        successCount++;
        success = true;
        break;
      } catch (err) {
        console.log(`   => LOI (lan ${attempt}/${MAX_RETRIES}): ${err.message}`);
        if (attempt < MAX_RETRIES) {
          console.log(`   => Thu lai sau ${DELAY_BETWEEN_CALLS_MS * 2}ms...`);
          await delay(DELAY_BETWEEN_CALLS_MS * 2);
        }
      }
    }

    if (!success) {
      failCount++;
      console.log(`   => THAT BAI HOAN TOAN. Bo qua video nay.\n`);
    }

    // Rate limiting delay
    if (i < videos.length - 1) {
      await delay(DELAY_BETWEEN_CALLS_MS);
    }
  }

  console.log(`\n=== KET QUA ===`);
  console.log(`Thanh cong: ${successCount}/${videos.length}`);
  console.log(`That bai: ${failCount}/${videos.length}`);
  console.log(`Ket qua luu tai: ${RESULTS_DIR}/`);
}

main().catch(console.error);
