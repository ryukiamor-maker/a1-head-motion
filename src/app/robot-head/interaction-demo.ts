import {
  getToolcraftTimelineKeyframeId,
  type ToolcraftCommand,
  type ToolcraftState,
} from "@/toolcraft/runtime";

export const INTERACTION_DEMO_DURATION = 60;
export const INTERACTION_DEMO_ACTION = "motion.generateInteractionDemo";

export const interactionDemoChapters = [
  [0, "注意到你 · 轻点头招呼"],
  [4, "抬头与低头观察"],
  [10, "左右查看"],
  [16, "视线跟随"],
  [21, "好奇 · 侧头观察"],
  [26, "疑惑 · 犹豫"],
  [30, "侧耳聆听"],
  [35, "点头确认"],
  [38, "轻轻摇头"],
  [41, "说话时的微动作"],
  [45, "委屈 · 低头停留"],
  [50, "恢复 · 鼓励回应"],
  [54, "开心 · 活泼招呼"],
  [58, "放松回正"],
] as const;

type Axis = "pitch" | "roll" | "yaw";
type Knot = readonly [seconds: number, degrees: number];

// Independent timing avoids mechanically synchronized three-axis reversals.
// These are authored interaction gestures, not estimated motion capture.
const poses: Record<Axis, readonly Knot[]> = {
  pitch: [
    [0,0],[0.7,3],[1.35,1],[2.1,-8],[2.65,2],[3.4,0],
    [4.3,1],[5.4,22],[6.25,21],[7.65,-21],[8.45,-20],[9.65,0],
    [10.7,2],[12.1,1],[13.7,-2],[15.35,1],
    [16.4,3],[17.5,10],[18.6,5],[19.65,-7],[20.8,-2],
    [21.6,4],[22.7,8],[24.05,6],[25.4,3],
    [26.3,6],[27.4,2],[28.15,4],[29.45,0],
    [30.4,-2],[31.6,-3],[32.3,-7],[32.85,-2],[34.5,-2],
    [35.2,1],[35.7,-14],[36.25,3],[36.8,-9],[37.35,1],[37.85,0],
    [38.6,-2],[39.55,-1],[40.7,0],
    [41.3,3],[41.9,-4],[42.55,2],[43.3,-5],[43.95,1],[44.65,-2],
    [45.55,-8],[46.8,-19],[48.4,-18],[49.6,-15],
    [50.75,-4],[51.5,4],[52.25,-7],[52.85,2],[53.55,4],
    [54.25,8],[54.85,-6],[55.45,5],[56.1,-4],[56.7,7],[57.5,3],
    [58.25,1],[59.3,0],[60,0],
  ],
  roll: [
    [0,0],[0.9,-3],[1.8,-2],[2.8,1],[3.9,0],
    [5.1,2],[6.8,1],[8.1,-2],[9.8,0],
    [11.35,-4],[12.45,-3],[14.3,4],[15.8,2],
    [16.7,-2],[17.9,-5],[19.05,2],[20.5,4],
    [21.85,7],[23.1,15],[24.4,14],[25.7,6],
    [26.8,-9],[27.85,-10],[28.65,-6],[29.7,-3],
    [30.9,-12],[31.9,-11],[33.3,-13],[34.7,-8],
    [35.5,-3],[36.4,-2],[37.7,1],
    [38.45,2],[39.15,-2],[39.95,1],[40.9,0],
    [41.6,3],[42.4,1],[43.1,-3],[44.1,-1],[44.8,2],
    [46.1,7],[47.35,9],[48.9,8],[50.1,6],
    [51.3,2],[52.5,-3],[53.6,-1],
    [54.6,-8],[55.35,7],[56.15,-6],[57.0,4],[57.8,2],
    [58.8,-1],[59.65,0],[60,0],
  ],
  yaw: [
    [0,0],[0.65,13],[1.5,11],[2.6,3],[3.8,0],
    [5.7,-2],[7.9,2],[9.7,0],
    [11.1,36],[12.25,34],[13.95,-33],[15.2,-31],[16.05,-19],
    [17.35,-27],[18.35,-8],[19.55,25],[20.65,18],
    [21.65,23],[23.6,21],[25.25,12],
    [26.5,6],[27.55,10],[28.45,4],[29.8,7],
    [30.7,20],[32.0,19],[33.7,21],[34.8,8],
    [35.65,3],[37.45,1],
    [38.3,16],[38.95,-14],[39.6,10],[40.2,-6],[40.9,0],
    [41.7,-6],[42.8,4],[43.75,8],[44.7,3],
    [46.3,-9],[47.8,-10],[49.3,-7],
    [50.85,-3],[51.9,1],[53.35,4],
    [54.45,10],[55.25,-8],[56.05,7],[56.9,-4],[57.7,2],
    [58.65,0],[59.6,0],[60,0],
  ],
};

export function createInteractionDemoCommands(state: ToolcraftState): ToolcraftCommand[] {
  const requested = Number(state.values["motion.demoIntensity"] ?? 1);
  const intensity = Number.isFinite(requested) ? Math.max(0.5, Math.min(1.2, requested)) : 1;
  const commands: ToolcraftCommand[] = [{ type: "timeline.setPlaying", isPlaying: false }];
  // A complete take owns its timeline. Keep current model/centers/view as static settings.
  for (const group of state.timeline.keyframeGroups) {
    commands.push({ type: "timeline.deleteControlKeyframes", controlId: group.controlId });
  }
  commands.push(
    { type: "timeline.setDuration", durationSeconds: INTERACTION_DEMO_DURATION },
    { type: "timeline.setCurrentTime", currentTimeSeconds: 0 },
    { type: "timeline.setExpanded", expanded: true },
  );
  if (state.timeline.isLooping) commands.push({ type: "timeline.toggleLoop" });
  for (const axis of ["pitch", "roll", "yaw"] as const) {
    const controlId = `motion.${axis}`;
    const controlLabel = `${axis[0].toUpperCase()}${axis.slice(1)}`;
    commands.push({ type: "controls.setValue", target: controlId, value: 0 });
    for (const [timeSeconds, degrees] of poses[axis]) {
      const value = degrees * Math.PI / 180 * intensity;
      commands.push({ type: "timeline.upsertControlKeyframe", controlId, controlLabel, timeSeconds, value, valueLabel: `${value.toFixed(3)} rad` });
      commands.push({
        type: "timeline.changeKeyframeEasing",
        keyframeId: getToolcraftTimelineKeyframeId(controlId, timeSeconds),
        easing: { type: "bezier", controlPoints: [0.42, 0, 0.58, 1] },
      });
    }
  }
  commands.push({ type: "timeline.setPlaying", isPlaying: true });
  return commands;
}
