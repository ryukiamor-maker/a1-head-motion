import { describe, expect, it } from "vitest";
import * as THREE from "three";
import type { URDFJoint, URDFRobot } from "urdf-loader";

import {
  applyRobotHeadValues,
  getRobotHeadJointCenters,
  shouldIncludeRotationCenterMarkers,
} from "./robot-head-renderer";
import type { ToolcraftState } from "@/toolcraft/runtime";

function createHead2JointFixture(): {
  child: THREE.Object3D;
  joint: URDFJoint;
  robot: URDFRobot;
} {
  const robot = new THREE.Object3D() as URDFRobot;
  const parent = new THREE.Object3D();
  const joint = new THREE.Object3D() as URDFJoint;
  const child = new THREE.Object3D();
  joint.axis = new THREE.Vector3(0, 1, 0);
  joint.ignoreLimits = false;
  joint.limit = { effort: 0, lower: -0.61, upper: 0.61, velocity: 0 };
  joint.origPosition = null;
  joint.origQuaternion = null;
  joint.position.set(0, 0, 0.081);
  joint.setJointValue = (value: number) => {
    joint.origPosition ??= joint.position.clone();
    joint.origQuaternion ??= joint.quaternion.clone();
    joint.quaternion.setFromAxisAngle(joint.axis, value).premultiply(joint.origQuaternion);
    return true;
  };
  parent.add(joint);
  joint.add(child);
  robot.add(parent);
  robot.joints = { pitch: joint };
  robot.setJointValue = (name: string, value: number) =>
    robot.joints[name]?.setJointValue(value) ?? false;
  return { child, joint, robot };
}

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

describe("head2 custom rotation centers", () => {
  it("reads independent XYZ centers for all three axes", () => {
    const centers = getRobotHeadJointCenters({
      "geometry.head2PitchCenterX": 0.02,
      "geometry.head2PitchCenterY": -0.03,
      "geometry.head2PitchCenterZ": 0.09,
      "geometry.head2RollCenterX": 0.04,
      "geometry.head2RollCenterY": 0.05,
      "geometry.head2RollCenterZ": 0.06,
      "geometry.head2YawCenterX": -0.07,
      "geometry.head2YawCenterY": 0.08,
      "geometry.head2YawCenterZ": 0.1,
      "model.variant": "head2",
    });

    expect(centers.map((center) => center.toArray())).toEqual([
      [0.02, -0.03, 0.09],
      [0.04, 0.05, 0.06],
      [-0.07, 0.08, 0.1],
    ]);
  });

  it("keeps the neutral assembly fixed and rotates the child around the moved center", () => {
    const camera = new THREE.PerspectiveCamera();
    const { child, joint, robot } = createHead2JointFixture();
    robot.updateMatrixWorld(true);
    const neutralPosition = child.getWorldPosition(new THREE.Vector3()).clone();
    const values = {
      "geometry.head2PitchCenterX": 0.05,
      "geometry.head2PitchCenterY": 0,
      "geometry.head2PitchCenterZ": 0.081,
      "model.variant": "head2",
      "motion.pitch": 0,
    };

    applyRobotHeadValues(robot, camera, values);
    expect(child.getWorldPosition(new THREE.Vector3()).distanceTo(neutralPosition)).toBeLessThan(1e-8);

    applyRobotHeadValues(robot, camera, { ...values, "motion.pitch": 0.5 });
    const centerWorld = joint.parent!.localToWorld(joint.position.clone());
    const childWorld = child.getWorldPosition(new THREE.Vector3());
    expect(childWorld.distanceTo(centerWorld)).toBeCloseTo(0.05, 8);
    expect(childWorld.distanceTo(neutralPosition)).toBeGreaterThan(0.01);
  });
});

describe("rotation center export visibility", () => {
  const state = {
    values: {
      "export.video.includeRotationCenters": true,
      "export.video.resolution": "current",
    },
  } as unknown as ToolcraftState;

  it("includes markers for video-sized frames when enabled", () => {
    expect(shouldIncludeRotationCenterMarkers({ height: 900, width: 1400 }, 1, state)).toBe(true);
  });

  it("keeps image-sized frames clean", () => {
    expect(shouldIncludeRotationCenterMarkers({ height: 900, width: 1400 }, 4096 / 1400, state)).toBe(false);
  });

  it("omits markers when the export option is disabled", () => {
    const disabled = {
      ...state,
      values: { ...state.values, "export.video.includeRotationCenters": false },
    } as ToolcraftState;
    expect(shouldIncludeRotationCenterMarkers({ height: 900, width: 1400 }, 1, disabled)).toBe(false);
  });
});
