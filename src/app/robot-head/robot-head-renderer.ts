import { GIFEncoder, applyPalette, quantize, type GifPalette } from "gifenc";
import * as THREE from "three";
import type { URDFJoint, URDFRobot } from "urdf-loader";

import {
  downloadToolcraftArtifact,
  evaluateToolcraftTimelineValues,
  type ToolcraftProductExportRenderer,
  type ToolcraftState,
} from "@/toolcraft/runtime";
import { readToolcraftOrientationPose } from "@/toolcraft/runtime/react";
import { getRobotModelProfile } from "./model-profiles";

type RobotHeadSurface = {
  camera: THREE.PerspectiveCamera;
  getRobot: () => URDFRobot | null;
  getViewportSize: () => { height: number; width: number };
  renderer: THREE.WebGLRenderer;
  scene: THREE.Scene;
  setRotationCenterMarkersVisible: (visible: boolean) => void;
};

type JointCenterBaseline = {
  childPositions: Map<THREE.Object3D, THREE.Vector3>;
  position: THREE.Vector3;
};

const jointCenterBaselines = new WeakMap<URDFJoint, JointCenterBaseline>();

const centerTargetSets = [
  ["geometry.head2PitchCenterX", "geometry.head2PitchCenterY", "geometry.head2PitchCenterZ"],
  ["geometry.head2RollCenterX", "geometry.head2RollCenterY", "geometry.head2RollCenterZ"],
  ["geometry.head2YawCenterX", "geometry.head2YawCenterY", "geometry.head2YawCenterZ"],
] as const;

let activeSurface: RobotHeadSurface | null = null;
let liveValues: Record<string, unknown> = {};

const asNumber = (value: unknown, fallback: number): number =>
  typeof value === "number" && Number.isFinite(value) ? value : fallback;

function asRange(value: unknown, fallback: readonly [number, number]): [number, number] {
  return Array.isArray(value) && value.length >= 2
    ? [asNumber(value[0], fallback[0]), asNumber(value[1], fallback[1])]
    : [...fallback];
}

function getJointCenterBaseline(joint: URDFJoint): JointCenterBaseline {
  const existing = jointCenterBaselines.get(joint);
  if (existing) return existing;
  const baseline = {
    childPositions: new Map(joint.children.map((child) => [child, child.position.clone()])),
    position: joint.position.clone(),
  };
  jointCenterBaselines.set(joint, baseline);
  return baseline;
}

export function getRobotHeadJointCenters(values: Record<string, unknown>): THREE.Vector3[] {
  const profile = getRobotModelProfile(values["model.variant"]);
  return profile.centerDefaults.map((fallback, index) => {
    if (profile.id === "head1") {
      const originTarget = [
        "geometry.axis1OriginZ",
        "geometry.axis2OriginZ",
        "geometry.axis3OriginZ",
      ][index];
      return new THREE.Vector3(0, 0, asNumber(values[originTarget], fallback[2]));
    }
    const targets = centerTargetSets[index];
    return new THREE.Vector3(
      asNumber(values[targets[0]], fallback[0]),
      asNumber(values[targets[1]], fallback[1]),
      asNumber(values[targets[2]], fallback[2]),
    );
  });
}

function applyHead2JointCenter(joint: URDFJoint, center: THREE.Vector3): void {
  const baseline = getJointCenterBaseline(joint);
  const offset = center.clone().sub(baseline.position);
  joint.position.copy(center);
  if (joint.origPosition) joint.origPosition.copy(center);
  baseline.childPositions.forEach((position, child) => {
    child.position.copy(position).sub(offset);
    child.matrixWorldNeedsUpdate = true;
  });
  joint.matrixWorldNeedsUpdate = true;
}

export function applyRobotHeadValues(
  robot: URDFRobot | null,
  camera: THREE.PerspectiveCamera,
  values: Record<string, unknown>,
): void {
  if (robot) {
    const profile = getRobotModelProfile(values["model.variant"]);
    const centers = getRobotHeadJointCenters(values);
    const definitions = profile.jointNames.map((joint, index) => ({
      angle: ["motion.pitch", "motion.roll", "motion.yaw"][index],
      center: centers[index], fallbackLimit: profile.limits[index], joint,
      length: ["geometry.axis1OriginZ", "geometry.axis2OriginZ", "geometry.axis3OriginZ"][index],
      lengthDefault: profile.originZ[index], limit: ["limits.axis1", "limits.axis2", "limits.axis3"][index],
      sign: profile.axisSigns[index],
     }));
    definitions.forEach((definition) => {
      const joint = robot.joints[definition.joint];
      if (!joint) return;
      const [lower, upper] = asRange(values[definition.limit], definition.fallbackLimit);
      joint.limit.lower = Math.min(lower, upper);
      joint.limit.upper = Math.max(lower, upper);
      if (profile.id === "head2") {
        applyHead2JointCenter(joint, definition.center);
      } else {
        const originZ = asNumber(values[definition.length], definition.lengthDefault);
        joint.position.z = originZ;
        if (joint.origPosition) joint.origPosition.z = originZ;
      }
      const requested = asNumber(values[definition.angle], 0);
      robot.setJointValue(definition.joint, Math.min(joint.limit.upper, Math.max(joint.limit.lower, requested * definition.sign)));
    });

    const fitScale = asNumber(robot.userData.fitScale, 1);
    const productScale = asNumber(values["robot.scale"], 1);
    const fitCenter = robot.userData.fitCenter as THREE.Vector3 | undefined;
    robot.scale.setScalar(fitScale * productScale);
    if (fitCenter) robot.position.copy(fitCenter).multiplyScalar(-fitScale * productScale);
    robot.position.add(new THREE.Vector3(
      asNumber(values["robot.positionX"], 0),
      asNumber(values["robot.positionY"], 0),
      asNumber(values["robot.positionZ"], 0),
    ));
    robot.rotation.set(
      THREE.MathUtils.degToRad(asNumber(values["robot.rotationX"], 0)),
      THREE.MathUtils.degToRad(asNumber(values["robot.rotationY"], 0)),
      THREE.MathUtils.degToRad(asNumber(values["robot.rotationZ"], 0)),
      "XYZ",
    );
    robot.updateMatrixWorld(true);
  }

  const pose = readToolcraftOrientationPose(values["view.orbit"]);
  const distance = asNumber(values["camera.distance"], 4.5);
  camera.fov = asNumber(values["camera.fov"], 36);
  const cameraDirection = new THREE.Vector3().fromArray(pose.position).normalize();
  camera.position.copy(cameraDirection).multiplyScalar(distance);
  // The head URDF is Z-up. Keeping a stable product-space up vector prevents
  // axis snaps from introducing a 90°/180° camera roll. Looking straight down
  // the Z axis needs a non-parallel fallback so lookAt can still form a basis.
  camera.up.set(
    0,
    Math.abs(cameraDirection.z) > 0.999 ? 1 : 0,
    Math.abs(cameraDirection.z) > 0.999 ? 0 : 1,
  );
  camera.lookAt(0, 0, asNumber(values["camera.targetZ"], 0));
  camera.updateProjectionMatrix();
}

export function registerRobotHeadSurface(surface: RobotHeadSurface): () => void {
  activeSurface = surface;
  return () => {
    if (activeSurface === surface) activeSurface = null;
  };
}

export function updateRobotHeadLiveValues(values: Record<string, unknown>): void {
  liveValues = values;
}

function requireSurface(): RobotHeadSurface {
  if (!activeSurface || !activeSurface.getRobot()) {
    throw new Error("机器人模型尚未准备好，暂时无法导出。");
  }
  return activeSurface;
}

function renderSurface(
  surface: RobotHeadSurface,
  values: Record<string, unknown>,
  width: number,
  height: number,
): void {
  surface.setRotationCenterMarkersVisible(false);
  surface.renderer.setPixelRatio(1);
  surface.renderer.setSize(width, height, false);
  surface.camera.aspect = width / height;
  applyRobotHeadValues(surface.getRobot(), surface.camera, values);
  surface.renderer.render(surface.scene, surface.camera);
}

function restoreLiveSurface(surface: RobotHeadSurface): void {
  const size = surface.getViewportSize();
  surface.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  surface.renderer.setSize(Math.max(1, size.width), Math.max(1, size.height), false);
  surface.camera.aspect = Math.max(1, size.width) / Math.max(1, size.height);
  applyRobotHeadValues(surface.getRobot(), surface.camera, liveValues);
  surface.setRotationCenterMarkersVisible(true);
}

export const robotHeadExportRenderer: ToolcraftProductExportRenderer = {
  baseFileName: "robot-head-motion",
  renderFrame: ({ context, frame, pixelRatio, state, timeSeconds }) => {
    const surface = requireSurface();
    const width = Math.max(1, Math.round(frame.width * pixelRatio));
    const height = Math.max(1, Math.round(frame.height * pixelRatio));
    try {
      renderSurface(surface, evaluateToolcraftTimelineValues(state, timeSeconds), width, height);
      context.drawImage(surface.renderer.domElement, frame.x, frame.y, frame.width, frame.height);
    } finally {
      restoreLiveSurface(surface);
    }
  },
};

function flipPixelsVertically(pixels: Uint8Array, width: number, height: number): Uint8Array {
  const result = new Uint8Array(pixels.length);
  const rowBytes = width * 4;
  for (let row = 0; row < height; row += 1) {
    result.set(pixels.subarray(row * rowBytes, (row + 1) * rowBytes), (height - row - 1) * rowBytes);
  }
  return result;
}

export async function exportRobotHeadGif(
  state: ToolcraftState,
  reportProgress: (progress: number) => void,
): Promise<{ byteLength: number; frameCount: number; height: number; width: number }> {
  const surface = requireSurface();
  const width = 480;
  const height = Math.max(2, Math.round(width * state.canvas.size.height / state.canvas.size.width / 2) * 2);
  const fps = 8;
  const duration = Math.max(0.1, state.timeline.durationSeconds);
  const frameCount = Math.max(2, Math.ceil(duration * fps));
  const gif = GIFEncoder({ initialCapacity: width * height });
  const gl = surface.renderer.getContext();
  let sharedPalette: GifPalette | null = null;

  try {
    for (let index = 0; index < frameCount; index += 1) {
      const timeSeconds = Math.min(duration, index / fps);
      const values = evaluateToolcraftTimelineValues(state, timeSeconds);
      renderSurface(surface, values, width, height);
      const raw = new Uint8Array(width * height * 4);
      gl.readPixels(0, 0, width, height, gl.RGBA, gl.UNSIGNED_BYTE, raw);
      const pixels = flipPixelsVertically(raw, width, height);
      sharedPalette ??= quantize(pixels, 32, { format: "rgb444" });
      const indexed = applyPalette(pixels, sharedPalette, "rgb444");
      gif.writeFrame(indexed, width, height, {
        delay: Math.round(1000 / fps),
        palette: sharedPalette,
        repeat: 0,
      });
      reportProgress(((index + 1) / frameCount) * 0.9);
      if (index % 4 === 0) await new Promise<void>((resolve) => setTimeout(resolve, 0));
    }
    gif.finish();
    const bytes = gif.bytes();
    downloadToolcraftArtifact({
      blob: new Blob([new Uint8Array(bytes)], { type: "image/gif" }),
      extension: ".gif",
      rawBaseFileName: "robot-head-motion",
    });
    reportProgress(1);
    return { byteLength: bytes.length, frameCount, height, width };
  } finally {
    restoreLiveSurface(surface);
  }
}




