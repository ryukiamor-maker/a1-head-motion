import {
  getToolcraftTimelineKeyframeId,
  type ToolcraftCommand,
} from "@/toolcraft/runtime";

export const MOTION_PACKAGE_IMPORT_TARGET = "motion.importPackage";
const axes = ["pitch", "roll", "yaw"] as const;

export type MotionPackage = {
  actionName: string;
  durationSeconds: number;
  tracks: Record<(typeof axes)[number], readonly (readonly [number, number])[]>;
  version: 1;
};

function isMotionPackage(value: unknown): value is MotionPackage {
  if (typeof value !== "object" || value === null) return false;
  const candidate = value as Partial<MotionPackage>;
  if (
    candidate.version !== 1 ||
    typeof candidate.actionName !== "string" ||
    !candidate.actionName.trim() ||
    typeof candidate.durationSeconds !== "number" ||
    !Number.isFinite(candidate.durationSeconds) ||
    candidate.durationSeconds <= 0 ||
    candidate.durationSeconds > 60 ||
    typeof candidate.tracks !== "object" ||
    candidate.tracks === null
  ) {
    return false;
  }

  return axes.every((axis) => {
    const knots = candidate.tracks?.[axis];
    return Array.isArray(knots)
      && knots.length >= 2
      && knots.length <= 120
      && knots.every((knot, index) =>
        Array.isArray(knot)
        && knot.length === 2
        && Number.isFinite(knot[0])
        && knot[0] >= 0
        && knot[0] <= candidate.durationSeconds!
        && Number.isFinite(knot[1])
        && (index === 0 || knot[0] > knots[index - 1][0]))
      && knots[0][0] === 0
      && knots.at(-1)?.[0] === candidate.durationSeconds;
  });
}

export function createMotionPackageImportCommands(value: unknown): ToolcraftCommand[] {
  if (!isMotionPackage(value)) {
    return [{ target: MOTION_PACKAGE_IMPORT_TARGET, type: "controls.setValue", value: null }];
  }

  const commands: ToolcraftCommand[] = [
    { type: "timeline.setPlaying", isPlaying: false },
  ];
  for (const axis of axes) {
    commands.push({ type: "timeline.deleteControlKeyframes", controlId: `motion.${axis}` });
  }
  commands.push(
    { type: "timeline.setDuration", durationSeconds: value.durationSeconds },
    { type: "timeline.setCurrentTime", currentTimeSeconds: 0 },
    { type: "timeline.setExpanded", expanded: true },
  );

  for (const axis of axes) {
    const controlId = `motion.${axis}`;
    const label = axis[0].toUpperCase() + axis.slice(1);
    commands.push({ target: controlId, type: "controls.setValue", value: 0 });
    for (const [timeSeconds, degrees] of value.tracks[axis]) {
      commands.push({
        controlId,
        controlLabel: label,
        timeSeconds,
        type: "timeline.upsertControlKeyframe",
        value: degrees * Math.PI / 180,
        valueLabel: `${degrees}°`,
      });
      commands.push({
        easing: { controlPoints: [0.42, 0, 0.58, 1], type: "bezier" },
        keyframeId: getToolcraftTimelineKeyframeId(controlId, timeSeconds),
        type: "timeline.changeKeyframeEasing",
      });
    }
  }

  commands.push(
    { type: "timeline.selectKeyframe", keyframeId: null },
    { target: MOTION_PACKAGE_IMPORT_TARGET, type: "controls.setValue", value: null },
  );
  return commands;
}
