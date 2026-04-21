const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const PLAN_PATH = path.join(ROOT, 'src', 'AutoVideo', 'video_plan.json');
const ROOT_TSX_PATH = path.join(ROOT, 'src', 'Root.tsx');

function run() {
    console.log('🏗️  Structure Agent: Registering AutoVideo in Root.tsx...');
    
    if (!fs.existsSync(PLAN_PATH)) {
        console.error('❌ video_plan.json not found!');
        process.exit(1);
    }
    
    const plan = JSON.parse(fs.readFileSync(PLAN_PATH, 'utf-8'));
    const totalFrames = plan.totalFrames || 900;
    
    const rootCode = `import "./index.css";
import { Composition } from "remotion";
import { AutoVideo } from "./AutoVideo";

export const RemotionRoot: React.FC = () => {
  return (
    <>
      <Composition
        id="AutoVideo"
        component={AutoVideo}
        durationInFrames={${totalFrames}}
        fps={30}
        width={1920}
        height={1080}
      />
    </>
  );
};
`;

    fs.writeFileSync(ROOT_TSX_PATH, rootCode);
    console.log(`✅ Registered AutoVideo (${totalFrames} frames) in Root.tsx`);
}

run();
