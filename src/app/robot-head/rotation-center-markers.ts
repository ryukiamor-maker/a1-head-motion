import * as THREE from "three";
import type { URDFRobot } from "urdf-loader";

import { getRobotModelProfile } from "./model-profiles";
import { getRobotHeadJointCenters } from "./robot-head-renderer";

export type RotationCenterMarker = {
  centerIndex: number;
  group: THREE.Group;
  jointName: string;
};

const fallbackAxes = [
  new THREE.Vector3(0, 1, 0),
  new THREE.Vector3(1, 0, 0),
  new THREE.Vector3(0, 0, 1),
] as const;

const markerColors = [0xef4444, 0x22c55e, 0x3b82f6] as const;

export const ROTATION_CENTER_MARKER_STYLE = Object.freeze({
  axisLength: 0.032,
  axisRadius: 0.00065,
  centerRadius: 0.003,
  opacity: 0.86,
  ringRadius: 0.0105,
  ringTube: 0.00065,
});

function createRotationCenterMarker(
  color: number,
  axis: THREE.Vector3,
  centerIndex: number,
  jointName: string,
): RotationCenterMarker {
  const group = new THREE.Group();
  group.name = `rotation-center-${jointName}`;
  group.userData.rotationCenterMarker = true;
  group.userData.rotationCenterAxis = centerIndex;

  const material = new THREE.MeshBasicMaterial({
    color,
    depthTest: false,
    depthWrite: false,
    opacity: ROTATION_CENTER_MARKER_STYLE.opacity,
    toneMapped: false,
    transparent: true,
  });
  const center = new THREE.Mesh(
    new THREE.SphereGeometry(ROTATION_CENTER_MARKER_STYLE.centerRadius, 14, 10),
    material,
  );
  const ring = new THREE.Mesh(
    new THREE.TorusGeometry(
      ROTATION_CENTER_MARKER_STYLE.ringRadius,
      ROTATION_CENTER_MARKER_STYLE.ringTube,
      6,
      36,
    ),
    material,
  );
  const axisLine = new THREE.Mesh(
    new THREE.CylinderGeometry(
      ROTATION_CENTER_MARKER_STYLE.axisRadius,
      ROTATION_CENTER_MARKER_STYLE.axisRadius,
      ROTATION_CENTER_MARKER_STYLE.axisLength,
      8,
    ),
    material,
  );
  const normalizedAxis = axis.lengthSq() > 0 ? axis.clone().normalize() : fallbackAxes[centerIndex];
  ring.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), normalizedAxis);
  axisLine.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), normalizedAxis);
  [center, ring, axisLine].forEach((mesh) => {
    mesh.renderOrder = 20;
    group.add(mesh);
  });
  return { centerIndex, group, jointName };
}

export function createRotationCenterMarkers(
  robot: URDFRobot,
  modelVariant: unknown,
): RotationCenterMarker[] {
  const profile = getRobotModelProfile(modelVariant);
  return profile.jointNames.flatMap((jointName, index) => {
    const joint = robot.joints[jointName];
    if (!joint?.parent) return [];
    const marker = createRotationCenterMarker(
      markerColors[index],
      joint.axis ?? fallbackAxes[index],
      index,
      jointName,
    );
    joint.parent.add(marker.group);
    return [marker];
  });
}

export function updateRotationCenterMarkers(
  robot: URDFRobot | null,
  markers: RotationCenterMarker[],
  values: Record<string, unknown>,
  visible: boolean,
): void {
  const centers = getRobotHeadJointCenters(values);
  markers.forEach((marker) => {
    const joint = robot?.joints[marker.jointName];
    marker.group.visible = visible && Boolean(joint);
    if (joint) marker.group.position.copy(centers[marker.centerIndex]);
  });
}
