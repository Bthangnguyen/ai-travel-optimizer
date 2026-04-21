/**
 * step4_aggregate.js
 * 
 * Đọc TẤT CẢ file JSON từ research/results/ → Tổng hợp thành:
 * 1. Bảng tần suất (frequency table) cho mỗi yếu tố
 * 2. Phân loại 20% Core Patterns (xuất hiện > 70% videos) vs 80% Variety
 * 3. Xuất ra design_system_final.json
 * 
 * Cách chạy: node research/step4_aggregate.js
 */

const fs = require('fs');
const path = require('path');

const RESULTS_DIR = path.join(__dirname, 'results');
const OUTPUT_PATH = path.join(__dirname, 'design_system_final.json');
const REPORT_PATH = path.join(__dirname, 'analysis_report.md');

// ── Bộ đếm tần suất ─────────────────────────────────────────────────────────
class FrequencyCounter {
  constructor() {
    this.counts = {};
    this.totalVideos = 0;
  }

  add(category, item) {
    if (!this.counts[category]) this.counts[category] = {};
    if (!this.counts[category][item]) this.counts[category][item] = { count: 0, videoIds: new Set() };
    this.counts[category][item].count++;
  }

  addPerVideo(category, item, videoId) {
    if (!this.counts[category]) this.counts[category] = {};
    if (!this.counts[category][item]) this.counts[category][item] = { count: 0, videoIds: new Set() };
    this.counts[category][item].count++;
    this.counts[category][item].videoIds.add(videoId);
  }

  getResults(category) {
    if (!this.counts[category]) return [];
    return Object.entries(this.counts[category])
      .map(([name, data]) => ({
        name,
        totalOccurrences: data.count,
        appearsInVideos: data.videoIds.size,
        percentOfVideos: Math.round((data.videoIds.size / this.totalVideos) * 100),
      }))
      .sort((a, b) => b.appearsInVideos - a.appearsInVideos);
  }

  classifyPattern(category) {
    const results = this.getResults(category);
    const coreThreshold = 70; // Xuất hiện trong > 70% video = CORE
    const commonThreshold = 30; // 30-70% = COMMON
    // < 30% = RARE

    return {
      core: results.filter(r => r.percentOfVideos >= coreThreshold),
      common: results.filter(r => r.percentOfVideos >= commonThreshold && r.percentOfVideos < coreThreshold),
      rare: results.filter(r => r.percentOfVideos < commonThreshold),
    };
  }
}

// ── Main ─────────────────────────────────────────────────────────────────────
function main() {
  console.log('=== STEP 4: Aggregation & Pattern Extraction ===\n');

  // Đọc tất cả file kết quả
  if (!fs.existsSync(RESULTS_DIR)) {
    console.log('ERROR: Thu muc results/ khong ton tai. Chay step3 truoc.');
    process.exit(1);
  }

  const files = fs.readdirSync(RESULTS_DIR).filter(f => f.endsWith('.json'));
  console.log(`Tim thay ${files.length} file ket qua.\n`);

  if (files.length === 0) {
    console.log('Khong co du lieu de tong hop.');
    process.exit(1);
  }

  const counter = new FrequencyCounter();
  counter.totalVideos = files.length;

  // ── Đọc và đếm ────────────────────────────────────────────────────────────
  for (const file of files) {
    const filePath = path.join(RESULTS_DIR, file);
    let data;
    try {
      data = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
    } catch (err) {
      console.log(`WARN: JSON loi o file ${file}, bo qua.`);
      continue;
    }

    const videoId = data.videoId || file.replace('.json', '');
    const scenes = data.scenes || [];

    // Global effects
    if (data.globalEffects) {
      const ge = data.globalEffects;
      if (ge.filmGrain) counter.addPerVideo('globalEffects', 'filmGrain', videoId);
      if (ge.glowBloom) counter.addPerVideo('globalEffects', 'glowBloom', videoId);
      if (ge.vignette) counter.addPerVideo('globalEffects', 'vignette', videoId);
      if (ge.dominantCameraMove) counter.addPerVideo('globalEffects', `camera_${ge.dominantCameraMove}`, videoId);
    }

    for (const scene of scenes) {
      // A. Poses
      if (scene.characters) {
        for (const char of scene.characters) {
          if (char.pose) counter.addPerVideo('poses', char.pose, videoId);
          if (char.gender) counter.addPerVideo('genders', char.gender, videoId);
          if (char.emotion) counter.addPerVideo('emotions', char.emotion, videoId);
          if (char.relativeSize) counter.addPerVideo('characterSizes', char.relativeSize, videoId);
        }
        // Số lượng nhân vật trong scene
        const charCount = scene.characters.length;
        counter.addPerVideo('characterCount', `${charCount}_characters`, videoId);
      }

      // B. Props
      if (scene.props) {
        for (const prop of scene.props) {
          if (prop.name) counter.addPerVideo('props', prop.name, videoId);
        }
      }

      // C. Text
      if (scene.texts) {
        for (const text of scene.texts) {
          if (text.color) counter.addPerVideo('textColors', text.color, videoId);
          if (text.size) counter.addPerVideo('textSizes', text.size, videoId);
          if (text.style) counter.addPerVideo('textStyles', text.style, videoId);
          if (text.animation) counter.addPerVideo('textAnimations', text.animation, videoId);
          if (text.position) counter.addPerVideo('textPositions', text.position, videoId);
        }
      }

      // D. Layouts
      if (scene.layout) {
        if (scene.layout.type) counter.addPerVideo('layouts', scene.layout.type, videoId);
        if (scene.layout.focalZone) counter.addPerVideo('focalZones', scene.layout.focalZone, videoId);
      }

      // E. Connecting elements
      if (scene.connectingElements) {
        if (scene.connectingElements.arrows && scene.connectingElements.arrows.length > 0) {
          counter.addPerVideo('connectors', 'arrows', videoId);
          for (const arrow of scene.connectingElements.arrows) {
            if (arrow.color) counter.addPerVideo('arrowColors', arrow.color, videoId);
            if (arrow.style) counter.addPerVideo('arrowStyles', arrow.style, videoId);
          }
        }
        if (scene.connectingElements.lines && scene.connectingElements.lines.length > 0) {
          counter.addPerVideo('connectors', 'lines', videoId);
        }
        if (scene.connectingElements.circles && scene.connectingElements.circles.length > 0) {
          counter.addPerVideo('connectors', 'circles', videoId);
        }
      }

      // G. Transitions
      if (scene.transition) counter.addPerVideo('transitions', scene.transition, videoId);
    }
  }

  // ── Phân loại 20/80 ───────────────────────────────────────────────────────
  const categories = [
    'poses', 'props', 'layouts', 'textColors', 'textSizes', 'textStyles',
    'textAnimations', 'transitions', 'globalEffects', 'emotions',
    'characterSizes', 'characterCount', 'connectors', 'genders', 'focalZones'
  ];

  const designSystem = {
    metadata: {
      totalVideosAnalyzed: files.length,
      generatedAt: new Date().toISOString(),
    },
    patterns: {},
  };

  for (const cat of categories) {
    designSystem.patterns[cat] = counter.classifyPattern(cat);
  }

  // ── Lưu JSON ──────────────────────────────────────────────────────────────
  // Chuyển Set thành Array cho JSON
  const jsonStr = JSON.stringify(designSystem, (key, val) => val instanceof Set ? [...val] : val, 2);
  fs.writeFileSync(OUTPUT_PATH, jsonStr);
  console.log(`Da luu Design System JSON: ${OUTPUT_PATH}\n`);

  // ── Tạo báo cáo Markdown ──────────────────────────────────────────────────
  let md = `# The Dark Needle — Design System Analysis Report\n\n`;
  md += `> Analyzed **${files.length}** videos on ${new Date().toLocaleDateString()}\n\n`;

  for (const cat of categories) {
    const classified = counter.classifyPattern(cat);
    md += `## ${cat.toUpperCase()}\n\n`;

    if (classified.core.length > 0) {
      md += `### CORE (>70% videos — Có trong MỌI video)\n`;
      md += `| Pattern | Xuất hiện trong | % Videos |\n|---|---|---|\n`;
      for (const p of classified.core) {
        md += `| **${p.name}** | ${p.appearsInVideos}/${files.length} videos | ${p.percentOfVideos}% |\n`;
      }
      md += `\n`;
    }

    if (classified.common.length > 0) {
      md += `### COMMON (30-70% — Dùng thường xuyên)\n`;
      md += `| Pattern | Xuất hiện trong | % Videos |\n|---|---|---|\n`;
      for (const p of classified.common) {
        md += `| ${p.name} | ${p.appearsInVideos}/${files.length} videos | ${p.percentOfVideos}% |\n`;
      }
      md += `\n`;
    }

    if (classified.rare.length > 0) {
      md += `### RARE (<30% — Dùng đa dạng hóa)\n`;
      md += `| Pattern | Xuất hiện trong | % Videos |\n|---|---|---|\n`;
      for (const p of classified.rare) {
        md += `| ${p.name} | ${p.appearsInVideos}/${files.length} videos | ${p.percentOfVideos}% |\n`;
      }
      md += `\n`;
    }

    md += `---\n\n`;
  }

  fs.writeFileSync(REPORT_PATH, md);
  console.log(`Da luu bao cao Markdown: ${REPORT_PATH}`);

  // ── In tóm tắt ────────────────────────────────────────────────────────────
  console.log(`\n=== TOM TAT NHANH ===\n`);
  for (const cat of categories) {
    const classified = counter.classifyPattern(cat);
    console.log(`${cat}: ${classified.core.length} core | ${classified.common.length} common | ${classified.rare.length} rare`);
  }
}

main();
