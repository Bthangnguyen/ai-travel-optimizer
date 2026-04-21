const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

const ROOT = path.join(__dirname, '..');

function step(name, command) {
    console.log(`\n=======================================================`);
    console.log(`🚀 BƯỚC: ${name}`);
    console.log(`=======================================================`);
    console.log(`> ${command}`);
    try {
        execSync(command, { cwd: ROOT, stdio: 'inherit', env: { ...process.env, PYTHONIOENCODING: 'utf-8' } });
        console.log(`\n✅ Thành công: ${name}`);
    } catch (err) {
        console.error(`\n❌ THẤT BẠI tại bước: ${name}`);
        process.exit(1);
    }
}

console.log(`
🎬 DARK NEEDLE FACTORY - LOCAL PIPELINE
-------------------------------------------------------
Kịch bản chuẩn bị được xử lý thành Video (MP4)...
`);

step('1/6: Director Agent (Gemini AI)', 'python tools/gemini_director.py');
step('2/6: Audio Agent (Edge TTS)', 'python tools/edge_audio_tool.py');
step('3/6: Sync Agent (Đồng bộ khung hình)', 'node tools/plan_processor.js');
step('4/6: Code Agent (Sinh mã React)', 'node tools/code_generator.js');
step('5/6: Structure Agent (Cập nhật Root)', 'node tools/structure_agent.js');

console.log(`
=======================================================
🚀 BƯỚC 6/6: Render Engine (Remotion)
=======================================================
Quá trình này có thể mất 1-3 phút tùy độ dài video...
`);
try {
    execSync('npx remotion render AutoVideo "final_product.mp4" --overwrite', { cwd: ROOT, stdio: 'inherit' });
    console.log(`\n✅ Thành công: Render Video`);
} catch (err) {
    console.error(`\n❌ THẤT BẠI khi render video!`);
    process.exit(1);
}

console.log(`
=======================================================
🎉 HOÀN THÀNH XUẤT SẮC!
Video đã được lưu thành công tại:
${path.join(ROOT, 'final_product.mp4')}
=======================================================
`);
