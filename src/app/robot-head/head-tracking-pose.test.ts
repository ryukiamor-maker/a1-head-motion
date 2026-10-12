import { describe, expect, it } from "vitest";
import * as THREE from "three";
import { poseFromCameraMatrix } from "./head-tracking-pose";
import { ROBOT_MODEL_PROFILES } from "./model-profiles";

const radians = (degrees: number) => degrees * Math.PI / 180;

describe("camera Roll follows the mirrored preview", () => {
  it.each([-25, 25])("matches the visible tilt for a %s degree input across every robot", (degrees) => {
    const rotation = new THREE.Matrix4().makeRotationZ(radians(degrees));
    const pose = poseFromCameraMatrix(rotation.elements);
    // Reflect the raw image's head-up vector horizontally, as the preview does.
    const previewTop = new THREE.Vector3(0, 1, 0).applyMatrix4(rotation);
    previewTop.x *= -1;
    for (const profile of Object.values(ROBOT_MODEL_PROFILES)) {
      // All five rigs roll around the model's forward +X axis in Z-up space.
      // From the front, world +Y is screen right and world +Z is screen up.
      const modelTop = new THREE.Vector3(0, 0, 1).applyAxisAngle(
        new THREE.Vector3(1, 0, 0), radians(pose.roll) * profile.axisSigns[1],
      );
      expect(modelTop.y, profile.id).toBeCloseTo(previewTop.x, 8);
      expect(modelTop.z, profile.id).toBeCloseTo(previewTop.y, 8);
    }
  });

  it("keeps relative Roll direction correct after calibration at a tilted starting pose", () => {
    const base = poseFromCameraMatrix(new THREE.Matrix4().makeRotationZ(radians(10)).elements);
    const raw = poseFromCameraMatrix(new THREE.Matrix4().makeRotationZ(radians(25)).elements);
    expect(raw.roll - base.roll).toBeCloseTo(-15, 8);
  });

  it("preserves existing Pitch and Yaw conversion", () => {
    const pitch = poseFromCameraMatrix(new THREE.Matrix4().makeRotationX(radians(18)).elements);
    const yaw = poseFromCameraMatrix(new THREE.Matrix4().makeRotationY(radians(22)).elements);
    expect(pitch.pitch).toBeCloseTo(-18, 8);
    expect(pitch.roll).toBeCloseTo(0, 8);
    expect(yaw.yaw).toBeCloseTo(-22, 8);
    expect(yaw.roll).toBeCloseTo(0, 8);
  });

  it("ignores uniform scale and translation in the camera matrix", () => {
    const matrix = new THREE.Matrix4().makeRotationZ(radians(-20));
    matrix.scale(new THREE.Vector3(2, 2, 2));
    matrix.setPosition(4, -3, 8);
    expect(poseFromCameraMatrix(matrix.elements).roll).toBeCloseTo(20, 8);
  });
});
