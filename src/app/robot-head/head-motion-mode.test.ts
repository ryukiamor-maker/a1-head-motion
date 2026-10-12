import { describe, expect, test } from "vitest";

import { getActiveHeadAxes, isTwoDegreeOfFreedom } from "./head-motion-mode";

describe("head motion degree-of-freedom mode", () => {
  test("defaults to all three axes", () => {
    expect(isTwoDegreeOfFreedom({})).toBe(false);
    expect(getActiveHeadAxes({})).toEqual(["pitch", "roll", "yaw"]);
  });

  test("removes roll from the active axis set in two-degree mode", () => {
    const values = { "motion.dofMode": "2dof" };
    expect(isTwoDegreeOfFreedom(values)).toBe(true);
    expect(getActiveHeadAxes(values)).toEqual(["pitch", "yaw"]);
  });
});
