import { describe, expect, it } from "vitest";
import { createToolcraftState, toolcraftReducer } from "@/toolcraft/runtime";

import { appSchema } from "../app-schema";
import {
  createMotionPackageImportCommands,
  MOTION_PACKAGE_IMPORT_TARGET,
  type MotionPackage,
} from "./motion-package";

const action: MotionPackage = {
  actionName: "Roll comparison",
  durationSeconds: 2,
  tracks: {
    pitch: [[0, 0], [1, 4], [2, 0]],
    roll: [[0, 0], [1, 16], [2, 0]],
    yaw: [[0, 0], [1, -8], [2, 0]],
  },
  version: 1,
};

describe("importable motion packages", () => {
  it("restores all three authored axes and clears the one-shot import target", () => {
    const initial = createToolcraftState(appSchema, {
      values: { "motion.dofMode": "2dof" },
    });
    const result = createMotionPackageImportCommands(action).reduce(toolcraftReducer, initial);

    expect(result.timeline.durationSeconds).toBe(2);
    expect(result.timeline.currentTimeSeconds).toBe(0);
    expect(result.timeline.isPlaying).toBe(false);
    expect(result.timeline.keyframeGroups.map((group) => group.controlId)).toEqual([
      "motion.pitch",
      "motion.roll",
      "motion.yaw",
    ]);
    expect(result.timeline.keyframeGroups[1].keyframes[1].value).toBeCloseTo(16 * Math.PI / 180);
    expect(result.timeline.keyframeGroups.every((group) =>
      group.keyframes.every((keyframe) => keyframe.easing?.type === "bezier"),
    )).toBe(true);
    expect(result.values[MOTION_PACKAGE_IMPORT_TARGET]).toBeNull();
  });

  it("rejects malformed or non-neutral-ended tracks without changing the timeline", () => {
    const initial = createToolcraftState(appSchema);
    const invalid = {
      ...action,
      tracks: { ...action.tracks, roll: [[0, 0], [1, 16]] },
    };
    const result = createMotionPackageImportCommands(invalid).reduce(toolcraftReducer, initial);

    expect(result.timeline.durationSeconds).toBe(initial.timeline.durationSeconds);
    expect(result.timeline.keyframeGroups).toEqual(initial.timeline.keyframeGroups);
    expect(result.values[MOTION_PACKAGE_IMPORT_TARGET]).toBeNull();
  });
});
