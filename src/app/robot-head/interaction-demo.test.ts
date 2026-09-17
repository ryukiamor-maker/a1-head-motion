import { describe, expect, it } from "vitest";
import { createToolcraftState, evaluateToolcraftTimelineValue, toolcraftReducer } from "@/toolcraft/runtime";
import { appSchema } from "../app-schema";
import { createInteractionDemoCommands, interactionDemoChapters } from "./interaction-demo";

function makeDemo(intensity = 1) {
  const initial = createToolcraftState(appSchema, { values: {
    "model.variant": "head2", "geometry.head2PitchCenterZ": 0.046,
    "motion.demoIntensity": intensity,
  } });
  const stale = toolcraftReducer(initial, {
    type: "timeline.upsertControlKeyframe", controlId: "motion.roll", controlLabel: "Roll",
    timeSeconds: 2, value: 0.5, valueLabel: "0.5 rad",
  });
  return { initial, result: createInteractionDemoCommands(stale).reduce(toolcraftReducer, stale) };
}

describe("continuous interaction demo", () => {
  it("replaces a stale single-axis timeline with a complete playing three-axis take", () => {
    const { initial, result } = makeDemo();
    expect(result.timeline.durationSeconds).toBe(60);
    expect(result.timeline.currentTimeSeconds).toBe(0);
    expect(result.timeline.isPlaying).toBe(true);
    expect(result.timeline.isLooping).toBe(false);
    expect(result.timeline.keyframeGroups.map(g => g.controlId)).toEqual(["motion.pitch", "motion.roll", "motion.yaw"]);
    expect(result.values["geometry.head2PitchCenterZ"]).toBe(initial.values["geometry.head2PitchCenterZ"]);
    for (const group of result.timeline.keyframeGroups) {
      expect(group.keyframes.length).toBeGreaterThan(40);
      expect(new Set(group.keyframes.map(k => k.value)).size).toBeGreaterThan(10);
      expect(evaluateToolcraftTimelineValue(result, group.controlId, 60)).toBe(0);
      expect(group.keyframes.at(0)?.timeSeconds).toBe(0);
      expect(group.keyframes.at(-1)?.timeSeconds).toBe(60);
      expect(group.keyframes.every(k => k.easing?.type === "bezier")).toBe(true);
    }
    const second = createInteractionDemoCommands(result).reduce(toolcraftReducer, result);
    expect(second.timeline.keyframeGroups).toEqual(result.timeline.keyframeGroups);
  });

  it("scales the complete take without changing its timing or fixed model parameters", () => {
    const full = makeDemo(1).result;
    const half = makeDemo(0.5).result;
    for (const group of full.timeline.keyframeGroups) {
      for (const time of [5.4, 11.1, 23.1, 36.2, 47.3, 55.3]) {
        const a = Number(evaluateToolcraftTimelineValue(full, group.controlId, time));
        const b = Number(evaluateToolcraftTimelineValue(half, group.controlId, time));
        expect(b).toBeCloseTo(a * 0.5, 5);
      }
    }
    expect(half.values["model.variant"]).toBe("head2");
    expect(half.values["geometry.head2PitchCenterZ"]).toBe(full.values["geometry.head2PitchCenterZ"]);
    expect(half.timeline.durationSeconds).toBe(full.timeline.durationSeconds);
  });

  it("keeps every gesture active, bounded and continuous with a neutral finish", () => {
    const result = makeDemo(1.2).result;
    const targets = ["motion.pitch", "motion.roll", "motion.yaw"];
    const bounds = [0.61, 0.52, 1.65];
    targets.forEach((target, index) => {
      let previous = 0;
      for (let frame = 0; frame <= 3600; frame++) {
        const value = Number(evaluateToolcraftTimelineValue(result, target, frame / 60));
        expect(Math.abs(value)).toBeLessThanOrEqual(bounds[index]);
        expect(Math.abs(value - previous)).toBeLessThan(0.05);
        previous = value;
      }
    });
    interactionDemoChapters.forEach(([start], index) => {
      const end = interactionDemoChapters[index + 1]?.[0] ?? 60;
      const excursion = targets.map(target => {
        const samples = Array.from({length: 20}, (_, i) => Number(evaluateToolcraftTimelineValue(result, target, start + (end - start) * i / 20)));
        return Math.max(...samples) - Math.min(...samples);
      });
      expect(Math.max(...excursion)).toBeGreaterThan(0.02);
    });
  });
});
