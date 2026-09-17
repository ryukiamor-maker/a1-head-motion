import { describe, expect, it } from "vitest";
import * as THREE from "three";
import type { URDFJoint, URDFRobot } from "urdf-loader";

import {
  createRotationCenterMarkers,
  ROTATION_CENTER_MARKER_STYLE,
  updateRotationCenterMarkers,
} from "./rotation-center-markers";

function createRobot(jointNames: readonly string[]): URDFRobot {
  const robot = new THREE.Group() as unknown as URDFRobot;
  robot.joints = {};
  jointNames.forEach((jointName, index) => {
    const parent = new THREE.Group();
    const joint = new THREE.Group() as unknown as URDFJoint;
    joint.axis = [
      new THREE.Vector3(0, -1, 0),
      new THREE.Vector3(1, 0, 0),
      new THREE.Vector3(0, 0, 1),
    ][index];
    parent.add(joint);
    robot.add(parent);
    robot.joints[jointName] = joint;
  });
  return robot;
}

describe("rotation center annotations", () => {
  it("creates three markers for Head1 using its axis joint names", () => {
    const robot = createRobot(["axis1", "axis2", "axis3"]);
    const markers = createRotationCenterMarkers(robot, "head1");

    expect(markers.map((marker) => marker.jointName)).toEqual(["axis1", "axis2", "axis3"]);
    expect(markers.every((marker) => marker.group.children.length === 3)).toBe(true);

    updateRotationCenterMarkers(robot, markers, {
      "geometry.axis1OriginZ": 0.028,
      "geometry.axis2OriginZ": 0.048,
      "geometry.axis3OriginZ": 0.082,
      "model.variant": "head1",
    }, true);

    expect(markers.map((marker) => marker.group.visible)).toEqual([true, true, true]);
    expect(markers.map((marker) => marker.group.position.z)).toEqual([0.028, 0.048, 0.082]);
  });

  it("uses a slimmer marker style for Head2 and Head3", () => {
    expect(ROTATION_CENTER_MARKER_STYLE.centerRadius).toBeLessThan(0.005);
    expect(ROTATION_CENTER_MARKER_STYLE.ringTube).toBeLessThan(0.0015);
    expect(ROTATION_CENTER_MARKER_STYLE.axisRadius).toBeLessThan(0.0015);
    expect(ROTATION_CENTER_MARKER_STYLE.axisLength).toBeLessThan(0.045);
    expect(ROTATION_CENTER_MARKER_STYLE.opacity).toBeLessThan(1);
  });
});
