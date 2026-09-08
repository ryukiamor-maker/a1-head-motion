import { describe, expect, it } from "vitest";
import * as THREE from "three";

import { applyRobotHeadValues } from "./robot-head-renderer";

describe("robot head camera orientation", () => {
  it("keeps the Z-up model upright when snapping to a side axis", () => {
    const camera = new THREE.PerspectiveCamera();

    applyRobotHeadValues(null, camera, {
      "view.orbit": { position: [0, 5, 0], up: [0, 0, -1] },
    });

    expect(camera.up.toArray()).toEqual([0, 0, 1]);
  });

  it("uses a stable fallback up vector for top and bottom views", () => {
    const camera = new THREE.PerspectiveCamera();

    applyRobotHeadValues(null, camera, {
      "view.orbit": { position: [0, 0, -5], up: [0, 1, 0] },
    });

    expect(camera.up.toArray()).toEqual([0, 1, 0]);
  });
});
