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
    [0,0],[0.7,2.2],[1.35,1],[2.1,-6.5],[2.65,1.4],[3.4,0.5],
    [4.3,1],[5.4,18],[6.25,17.3],[7.65,-17],[8.45,-16.4],[9.65,-0.5],
    [10.7,2],[12.1,1],[13.7,-2],[15.35,1],
    [16.4,3],[17.5,10],[18.6,5],[19.65,-7],[20.8,-2],
    [21.6,4],[22.7,8],[24.05,6],[25.4,3],
    [26.3,6],[27.4,2],[28.15,4],[29.45,0],
    [30.4,-1.5],[31.6,-2.2],[32.3,-5],[32.85,-1.8],[33.7,-1.4],[34.5,-2],
    [35.2,0.6],[35.7,-10],[36.25,1.8],[36.8,-5.5],[37.35,0.7],[37.85,0],
    [38.6,-2],[39.55,-1],[40.7,0],
    [41.3,2],[42.05,-2.7],[42.55,1.3],[43.45,-3.2],[44.15,0.8],[44.65,-1.2],
    [45.55,-5.5],[46.8,-14],[47.75,-14.5],[48.4,-13.8],[49.6,-11.7],
    [50.75,-3],[51.5,3],[52.25,-5],[52.85,1.5],[53.55,3.2],
    [54.25,6],[54.72,1],[55.08,-4.5],[55.55,3.4],[56.22,4.2],[56.8,2.1],[57.5,2.7],
    [58.25,1],[59.3,0],[60,0],
  ],
  roll: [
    [0,0],[0.9,-3],[1.8,-2],[2.8,1],[3.9,0],
    [5.1,2],[6.8,1],[8.1,-2],[9.8,0],
    [11.35,-4],[12.45,-3],[14.3,4],[15.8,2],
    [16.7,-2],[17.9,-5],[19.05,2],[20.5,4],
    [21.85,4],[23.1,9],[23.8,9.4],[24.4,8.8],[25.7,3.5],
    [26.8,-5],[27.85,-6],[28.65,-3.7],[29.7,-2],
    [30.9,-7],[31.9,-6.4],[33.3,-7.5],[34.7,-4.5],
    [35.5,-3],[36.4,-2],[37.7,1],
    [38.45,2],[39.15,-2],[39.95,1],[40.9,0],
    [41.6,1.8],[42.4,0.7],[43.1,-1.7],[44.1,-0.6],[44.8,1.1],
    [46.1,4],[47.35,5.5],[48.9,4.8],[50.1,3.5],
    [51.3,2],[52.5,-3],[53.6,-1],
    [54.6,-3.8],[55.55,2.3],[56.4,1.7],[57.0,-1.5],[57.8,0.8],
    [58.8,-1],[59.65,0],[60,0],
  ],
  yaw: [
    [0,0],[0.65,13],[1.5,11],[2.6,3],[3.8,0],
    [5.7,-2],[7.9,2],[9.7,0],
    [11.1,30],[12.25,28.8],[13.95,-28],[15.2,-26.8],[16.05,-17],
    [17.35,-27],[18.35,-8],[19.55,25],[20.65,18],
    [21.65,23],[23.6,21],[25.25,12],
    [26.5,6],[27.55,10],[28.45,4],[29.8,7],
    [30.7,15],[32.0,14.5],[33.7,15.4],[34.8,6],
    [35.65,3],[37.45,1],
    [38.3,12],[38.95,-10],[39.6,6.5],[40.2,-3],[40.9,0],
    [41.7,-6],[42.8,4],[43.75,8],[44.7,3],
    [46.3,-9],[47.8,-10],[49.3,-7],
    [50.85,-3],[51.9,1],[53.35,4],
    [54.45,6],[55.15,5.2],[56.05,-4],[56.9,-2],[57.7,1],
    [58.65,0],[59.6,0],[60,0],
  ],
};

// A shape-preserving Hermite curve carries velocity through intermediate poses.
// Stop only at an actual direction reversal or a deliberate hold, not every key.
export function gestureTangents(knots: readonly Knot[]): number[] {
  const slopes = knots.slice(1).map(([t, angle], i) => (angle - knots[i][1]) / (t - knots[i][0]));
  return knots.map((_, i) => {
    if (i === 0 || i === knots.length - 1) return 0;
    const before = slopes[i - 1];
    const after = slopes[i];
    if (before * after <= 0) return 0;
    const previousDuration = knots[i][0] - knots[i - 1][0];
    const nextDuration = knots[i + 1][0] - knots[i][0];
    const w1 = 2 * nextDuration + previousDuration;
    const w2 = nextDuration + 2 * previousDuration;
    return (w1 + w2) / (w1 / before + w2 / after);
  });
}

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
    const knots = poses[axis];
    const tangents = gestureTangents(knots);
    for (const [index, [timeSeconds, degrees]] of knots.entries()) {
      const value = degrees * Math.PI / 180 * intensity;
      commands.push({ type: "timeline.upsertControlKeyframe", controlId, controlLabel, timeSeconds, value, valueLabel: `${value.toFixed(3)} rad` });
      const next = knots[index + 1];
      const difference = next ? next[1] - degrees : 0;
      const duration = next ? next[0] - timeSeconds : 0;
      commands.push({
        type: "timeline.changeKeyframeEasing",
        keyframeId: getToolcraftTimelineKeyframeId(controlId, timeSeconds),
        easing: { type: "bezier", controlPoints: [
          1 / 3,
          difference === 0 ? 0 : tangents[index] * duration / (3 * difference),
          2 / 3,
          difference === 0 ? 1 : 1 - tangents[index + 1] * duration / (3 * difference),
        ] },
      });
    }
  }
  commands.push(
    { type: "timeline.selectKeyframe", keyframeId: null },
    { type: "timeline.setPlaying", isPlaying: true },
  );
  return commands;
}
