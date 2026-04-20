/**
 * qa_validator.js (FIXED for Remotion v4)
 * 
 * Renders still frames at key moments for quality checking.
 * FIX: Uses correct Remotion v4 CLI syntax (no entryPoint argument).
 * 
 * Usage: node tools/qa_validator.js
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const PLAN_PATH = path.join(__dirname, '../src/AutoVideo/video_plan.json');
const QA_DIR = path.join(__dirname, '../qa_output');
const PROJECT_ROOT = path.join(__dirname, '..');

function runQA() {
    console.log('📸 QA Validator (v2): Starting quality checks...');
    
    if (!fs.existsSync(PLAN_PATH)) {
        console.error('❌ video_plan.json not found. Run plan_processor.js first!');
        process.exit(1);
    }

    if (!fs.existsSync(QA_DIR)) {
        fs.mkdirSync(QA_DIR, { recursive: true });
    }

    const plan = JSON.parse(fs.readFileSync(PLAN_PATH, 'utf-8'));
    const compositionId = plan.compositionId || 'AutoVideo';

    // Select important frames: midpoint of each scene + any marked "impact" scenes
    const framesToCheck = [];
    plan.scenes.forEach(scene => {
        if (!scene.startFrame && scene.startFrame !== 0) return;
        const midFrame = Math.round(scene.startFrame + (scene.duration || 60) / 2);
        framesToCheck.push({
            frame: midFrame,
            name: `qa_${scene.id}_mid.png`,
            sceneId: scene.id,
        });
    });

    console.log(`🚀 Will render ${framesToCheck.length} still frames for QA...`);

    const results = [];
    framesToCheck.forEach(f => {
        const outputPath = path.join(QA_DIR, f.name);
        console.log(`🖼️  Rendering frame ${f.frame} → ${f.name}`);
        try {
            // FIXED: Remotion v4 syntax - no entryPoint, just compositionId
            execSync(
                `npx remotion still ${compositionId} "${outputPath}" --frame=${f.frame} --overwrite`,
                { cwd: PROJECT_ROOT, stdio: 'pipe' }
            );
            results.push({ ...f, status: 'OK', filePath: outputPath });
            console.log(`   ✅ OK`);
        } catch (e) {
            results.push({ ...f, status: 'FAILED', error: e.stderr?.toString() || e.message });
            console.error(`   ❌ Failed: ${e.message}`);
        }
    });

    // Write QA report
    const report = {
        timestamp: new Date().toISOString(),
        totalChecks: framesToCheck.length,
        passed: results.filter(r => r.status === 'OK').length,
        failed: results.filter(r => r.status === 'FAILED').length,
        results,
    };

    const reportPath = path.join(QA_DIR, 'qa_report.json');
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
    console.log(`\n📊 QA Report saved: ${reportPath}`);
    console.log(`   Passed: ${report.passed}/${report.totalChecks}`);

    if (report.failed > 0) {
        console.log('   ❌ REJECTED — Fix issues and re-run.');
        process.exit(1);
    } else {
        console.log('   ✅ APPROVED — Ready for full render.');
    }
}

runQA();
