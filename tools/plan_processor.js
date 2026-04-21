/**
 * plan_processor.js (v3 — SEQUENTIAL + NO OVERLAP)
 * 
 * Reads VTT/SRT → Assigns subtitle entries to scenes SEQUENTIALLY.
 * Each subtitle entry is only used ONCE. Scenes never overlap.
 * 
 * Strategy: Since Director creates scenes in chronological order matching
 * the script text, we assign subtitle entries in order too.
 * 
 * Usage: node tools/plan_processor.js
 */

const fs = require('fs');
const path = require('path');

const FPS = 30;
const SRT_PATH = path.join(__dirname, '../public/vo_full.srt');
const VTT_PATH = path.join(__dirname, '../public/vo_full.vtt');
const PLAN_PATH = path.join(__dirname, '../src/AutoVideo/video_plan.json');

function parseSrtTime(srtTime) {
    const cleaned = srtTime.replace(',', '.');
    const parts = cleaned.split(':');
    if (parts.length === 3) {
        const [h, m, rest] = parts;
        const [s, ms] = rest.split('.');
        return Number(h) * 3600 + Number(m) * 60 + Number(s) + Number(ms || 0) / 1000;
    }
    return 0;
}

function parseSubtitleFile() {
    let filePath, content;
    
    if (fs.existsSync(VTT_PATH) && fs.statSync(VTT_PATH).size > 10) {
        filePath = VTT_PATH;
        content = fs.readFileSync(VTT_PATH, 'utf-8');
        content = content.replace(/^WEBVTT\s*\n/, '');
    } else if (fs.existsSync(SRT_PATH) && fs.statSync(SRT_PATH).size > 10) {
        filePath = SRT_PATH;
        content = fs.readFileSync(SRT_PATH, 'utf-8');
    } else {
        console.error('No subtitle file found!');
        process.exit(1);
    }

    console.log(`Reading: ${filePath}`);

    const blocks = content.trim().split(/\n\s*\n/);
    const entries = [];

    blocks.forEach(block => {
        const lines = block.trim().split('\n');
        const timeLineIdx = lines.findIndex(l => l.includes('-->'));
        if (timeLineIdx === -1) return;

        const timeRange = lines[timeLineIdx];
        const text = lines.slice(timeLineIdx + 1).join(' ').trim();
        if (!text) return;

        const [start, end] = timeRange.split('-->').map(s => s.trim());
        entries.push({
            startSec: parseSrtTime(start),
            endSec: parseSrtTime(end),
            text,
        });
    });

    // Sort by start time
    entries.sort((a, b) => a.startSec - b.startSec);
    return entries;
}

/**
 * Sequential assignment: For each scene, find how many subtitle entries
 * belong to it by checking word overlap. Entries are consumed in order
 * and never reused.
 */
function assignTimingsSequentially(scenes, entries) {
    console.log(`Assigning ${entries.length} subtitle entries to ${scenes.length} scenes...`);

    let entryIdx = 0;
    const results = [];

    for (let sceneIdx = 0; sceneIdx < scenes.length; sceneIdx++) {
        const scene = scenes[sceneIdx];
        const sceneText = (scene.text || '').toLowerCase();
        const sceneWords = sceneText.split(/\s+/).filter(w => w.length > 3);

        // Find how many consecutive entries belong to this scene
        let matchStart = entryIdx;
        let matchEnd = entryIdx;
        let bestScore = 0;

        // Try to greedily consume entries while they match this scene's text
        for (let tryEnd = entryIdx; tryEnd < entries.length; tryEnd++) {
            const entryText = entries[tryEnd].text.toLowerCase();
            const entryWords = entryText.split(/\s+/).filter(w => w.length > 3);
            const overlap = entryWords.filter(w => sceneWords.some(sw => sw.includes(w) || w.includes(sw))).length;

            if (overlap > 0 || tryEnd === entryIdx) {
                matchEnd = tryEnd + 1;
                bestScore += overlap;
            } else {
                break; // No more matching entries
            }
        }

        // Ensure at least 1 entry per scene
        if (matchEnd <= matchStart && entryIdx < entries.length) {
            matchEnd = matchStart + 1;
        }

        const matchedEntries = entries.slice(matchStart, matchEnd);

        if (matchedEntries.length > 0) {
            const startSec = matchedEntries[0].startSec;
            const endSec = matchedEntries[matchedEntries.length - 1].endSec;
            results.push({
                ...scene,
                startFrame: Math.round(startSec * FPS),
                endFrame: Math.round(endSec * FPS),
                duration: Math.round((endSec - startSec) * FPS),
            });
            entryIdx = matchEnd;
            console.log(`  ${scene.id}: ${matchedEntries.length} entries -> ${startSec.toFixed(1)}s-${endSec.toFixed(1)}s`);
        } else {
            console.warn(`  ${scene.id}: No entries left!`);
            results.push(scene);
        }
    }

    return results;
}

function getAudioDuration() {
    const mp3Path = path.join(__dirname, '../public/vo_full.mp3');
    if (!fs.existsSync(mp3Path)) return 60;
    try {
        const { execSync } = require('child_process');
        const output = execSync(`ffprobe -v quiet -show_entries format=duration -of csv=p=0 "${mp3Path}"`, { encoding: 'utf-8' });
        return parseFloat(output.trim()) || 60;
    } catch {
        return 60;
    }
}

function evenSplitFallback(scenes, totalDurationSec) {
    console.log(`Using even-split fallback (${totalDurationSec.toFixed(1)}s audio)`);
    const totalFrames = Math.round(totalDurationSec * FPS);
    const framesPerScene = Math.floor(totalFrames / scenes.length);

    return scenes.map((scene, i) => ({
        ...scene,
        startFrame: i * framesPerScene,
        endFrame: (i + 1) * framesPerScene,
        duration: framesPerScene,
    }));
}

function processPlan() {
    console.log('Plan Processor (v3): Starting...');

    if (!fs.existsSync(PLAN_PATH)) {
        console.error('video_plan.json not found!');
        process.exit(1);
    }

    const entries = parseSubtitleFile();
    const planData = JSON.parse(fs.readFileSync(PLAN_PATH, 'utf-8'));

    let updatedScenes;

    if (entries.length > 0) {
        updatedScenes = assignTimingsSequentially(planData.scenes, entries);
    } else {
        updatedScenes = planData.scenes;
    }

    // Validate: check that scenes have timing
    const scenesWithTiming = updatedScenes.filter(s => s.startFrame !== undefined && s.endFrame !== undefined);
    if (scenesWithTiming.length < updatedScenes.length / 2) {
        const audioDuration = getAudioDuration();
        updatedScenes = evenSplitFallback(updatedScenes, audioDuration);
    }

    // Patch: fill in any remaining scenes that still lack timing
    for (let i = 0; i < updatedScenes.length; i++) {
        if (updatedScenes[i].startFrame === undefined || updatedScenes[i].endFrame === undefined) {
            const prevEnd = i > 0 && updatedScenes[i - 1].endFrame ? updatedScenes[i - 1].endFrame : 0;
            updatedScenes[i].startFrame = prevEnd;
            updatedScenes[i].endFrame = prevEnd + 150; // default 5 seconds at 30fps
            updatedScenes[i].duration = 150;
            console.log(`  [PATCH] ${updatedScenes[i].id}: assigned frames ${prevEnd}-${prevEnd + 150}`);
        }
    }

    const lastScene = updatedScenes[updatedScenes.length - 1];
    const totalFrames = lastScene && lastScene.endFrame ? lastScene.endFrame + 30 : 900;

    const finalPlan = {
        ...planData,
        totalFrames,
        scenes: updatedScenes,
    };

    fs.writeFileSync(PLAN_PATH, JSON.stringify(finalPlan, null, 2));
    console.log(`Updated video_plan.json!`);
    console.log(`Total: ${(totalFrames / FPS).toFixed(1)}s (${totalFrames} frames)`);

    // Print scene summary
    updatedScenes.forEach(s => {
        console.log(`  ${s.id} [${s.template}]: frame ${s.startFrame}-${s.endFrame}`);
    });
}

processPlan();
