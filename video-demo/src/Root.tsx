/**
 * ROOT.TSX — Khóa cứng
 * Chỉ đăng ký Composition. Không chứa logic.
 */
import "./index.css";
import { Composition } from "remotion";
import { IconDemo } from "./IconDemo";
import { TheHook } from "./TheHook";
import { Part1Redefine } from "./Part1Redefine";
import { ComponentLibrary } from "./ComponentLibrary";
import { LineTemplate } from "./LineTemplate";
import { Part2Priorities } from "./Part2Priorities";

export const RemotionRoot: React.FC = () => {
  return (
    <>
      <Composition
        id="IconDemo"
        component={IconDemo}
        durationInFrames={450}
        fps={30}
        width={1920}
        height={1080}
      />
      <Composition
        id="TheHook"
        component={TheHook}
        durationInFrames={960}
        fps={30}
        width={1920}
        height={1080}
      />
      <Composition
        id="Part1Redefine"
        component={Part1Redefine}
        durationInFrames={1830}
        fps={30}
        width={1920}
        height={1080}
      />
      <Composition
        id="ComponentLibrary"
        component={ComponentLibrary}
        durationInFrames={1410}
        fps={30}
        width={1920}
        height={1080}
      />
      <Composition
        id="LineTemplate"
        component={LineTemplate}
        durationInFrames={1200}
        fps={30}
        width={1920}
        height={1080}
      />
      <Composition
        id="Part2Priorities"
        component={Part2Priorities}
        durationInFrames={2190}
        fps={30}
        width={1920}
        height={1080}
      />
    </>
  );
};
