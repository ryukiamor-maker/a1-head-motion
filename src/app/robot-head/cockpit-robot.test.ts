import { readFileSync } from "node:fs";
import { afterEach, describe, expect, it, vi } from "vitest";
import * as THREE from "three";

import { bindCockpitRobot, COCKPIT_NECK_CENTER } from "./cockpit-robot";
import { attachFaceScreenVideo, createFaceScreenVideoUvs } from "./face-screen-video";
import { applyRobotHeadValues } from "./robot-head-renderer";

// Use the actual supplied textured GLB arrays; no approximation of the mesh.
const file = readFileSync(new URL("../../../public/cockpit-robot.glb", import.meta.url));
const jsonLength = file.readUInt32LE(12);
const gltf = JSON.parse(file.subarray(20, 20 + jsonLength).toString());
const binaryOffset = 28 + jsonLength;
function readArray(index: number): Float32Array | Uint32Array | Uint16Array {
  const a = gltf.accessors[index], view = gltf.bufferViews[a.bufferView];
  const offset = file.byteOffset + binaryOffset + (view.byteOffset ?? 0) + (a.byteOffset ?? 0);
  const length = a.count * (a.type === "VEC3" ? 3 : a.type === "VEC2" ? 2 : 1);
  if (a.componentType === 5126) return new Float32Array(file.buffer, offset, length);
  if (a.componentType === 5125) return new Uint32Array(file.buffer, offset, length);
  return new Uint16Array(file.buffer, offset, length);
}
function createSource(): THREE.Group {
  const source = new THREE.Group();
  for (const node of gltf.nodes) {
    if (node.mesh === undefined) continue;
    const primitive = gltf.meshes[node.mesh].primitives[0];
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute("position", new THREE.BufferAttribute(readArray(primitive.attributes.POSITION), 3));
    geometry.setAttribute("normal", new THREE.BufferAttribute(readArray(primitive.attributes.NORMAL), 3));
    geometry.setAttribute("uv", new THREE.BufferAttribute(readArray(primitive.attributes.TEXCOORD_0), 2));
    geometry.setIndex(new THREE.BufferAttribute(readArray(primitive.indices), 1));
    const texture = new THREE.Texture();
    texture.name = gltf.images[gltf.textures[gltf.materials[primitive.material].pbrMetallicRoughness.baseColorTexture.index].source].name;
    const mesh = new THREE.Mesh(geometry, new THREE.MeshStandardMaterial({ map: texture }));
    mesh.name = node.name;
    source.add(mesh);
  }
  return source;
}
const values = { "model.variant": "cockpitRobot", "motion.dofMode": "3dof" };
function sample(mesh: THREE.Object3D): THREE.Vector3 {
  const position = (mesh as THREE.Mesh).geometry.getAttribute("position");
  return mesh.localToWorld(new THREE.Vector3(position.getX(0), position.getY(0), position.getZ(0)));
}
afterEach(() => vi.unstubAllGlobals());

describe("textured cockpit robot", () => {
  it("preserves the textured cockpit assembly while articulating only the head and native screen", () => {
    const source = createSource();
    source.rotation.x = Math.PI / 2;
    source.updateMatrixWorld(true);
    const meshes = source.children.map((part) => part as THREE.Mesh);
    const originals = meshes.map((mesh) => ({ mesh, point: sample(mesh), material: mesh.material, uv: mesh.geometry.getAttribute("uv") }));
    source.rotation.x = 0;
    const robot = bindCockpitRobot(source);
    applyRobotHeadValues(robot, new THREE.PerspectiveCamera(), values);
    for (const { mesh, point, material, uv } of originals) {
      expect(sample(mesh).distanceTo(point)).toBeLessThan(1e-7);
      expect(mesh.material).toBe(material);
      expect(mesh.geometry.getAttribute("uv")).toBe(uv);
    }
    applyRobotHeadValues(robot, new THREE.PerspectiveCamera(), { ...values, "motion.pitch": 0.35, "motion.roll": 0.2, "motion.yaw": 0.45 });
    for (const { mesh, point } of originals) {
      const moved = mesh.name === "tripo_part_3" || mesh.name === "tripo_part_6";
      expect(sample(mesh).distanceTo(point))[moved ? "toBeGreaterThan" : "toBeLessThan"](moved ? 0.01 : 1e-7);
    }
    expect(robot.userData.videoScreen.name).toBe("tripo_part_6");
  });

  it("places all neutral axes at the neck and preserves neutral assembly when a center moves", () => {
    const robot = bindCockpitRobot(createSource());
    const camera = new THREE.PerspectiveCamera();
    applyRobotHeadValues(robot, camera, values);
    for (const joint of Object.values(robot.joints)) {
      expect(joint.getWorldPosition(new THREE.Vector3()).distanceTo(new THREE.Vector3(...COCKPIT_NECK_CENTER))).toBeLessThan(1e-7);
    }
    const screen = robot.userData.videoScreen as THREE.Mesh;
    const before = sample(screen);
    applyRobotHeadValues(robot, camera, { ...values, "geometry.cockpitPitchCenterX": -0.03, "geometry.cockpitRollCenterZ": 0.28, "geometry.cockpitYawCenterY": 0.04 });
    expect(sample(screen).distanceTo(before)).toBeLessThan(1e-7);
    expect(robot.joints.roll.getWorldPosition(new THREE.Vector3()).z).toBeCloseTo(0.28);
    expect(robot.joints.yaw.getWorldPosition(new THREE.Vector3()).y).toBeCloseTo(0.04);
  });

  it("locks roll in two-axis mode and restores it in three-axis mode", () => {
    const robot = bindCockpitRobot(createSource());
    const camera = new THREE.PerspectiveCamera();
    applyRobotHeadValues(robot, camera, { ...values, "motion.roll": 0.3 });
    const quaternion = robot.joints.roll.quaternion.clone();
    applyRobotHeadValues(robot, camera, { ...values, "motion.roll": 0.3, "motion.dofMode": "2dof" });
    expect(robot.joints.roll.quaternion.angleTo(new THREE.Quaternion())).toBeLessThan(1e-7);
    applyRobotHeadValues(robot, camera, { ...values, "motion.roll": 0.3 });
    expect(robot.joints.roll.quaternion.angleTo(quaternion)).toBeLessThan(1e-7);
  });

  it("projects video continuously left-to-right and top-to-bottom on the native curved screen", () => {
    const source = createSource();
    const screen = source.getObjectByName("tripo_part_6") as THREE.Mesh;
    const position = screen.geometry.getAttribute("position");
    const uv = createFaceScreenVideoUvs(screen.geometry, "cockpitRobot");
    const bounds = screen.geometry.boundingBox!;
    for (let i = 0; i < position.count; i += 1) {
      expect(uv.getX(i)).toBeCloseTo((bounds.max.z - position.getZ(i)) / (bounds.max.z - bounds.min.z), 5);
      expect(uv.getY(i)).toBeCloseTo((bounds.max.y - position.getY(i)) / (bounds.max.y - bounds.min.y), 5);
    }
  });

  it("restores the exact authored screen UVs and texture after video cleanup", () => {
    const robot = bindCockpitRobot(createSource());
    const screen = robot.userData.videoScreen as THREE.Mesh;
    const material = screen.material, uv = screen.geometry.getAttribute("uv");
    const video = { autoplay: false, muted: false, loop: false, playsInline: false, preload: "", src: "", play: vi.fn(async () => undefined), pause: vi.fn(), load: vi.fn(), addEventListener: vi.fn(), removeEventListener: vi.fn(), removeAttribute: vi.fn() };
    vi.stubGlobal("document", { createElement: () => video });
    const release = attachFaceScreenVideo(robot, "blob:test-video", "cockpitRobot");
    expect(screen.material).not.toBe(material);
    expect(video.play).toHaveBeenCalled();
    release(); release();
    expect(screen.visible).toBe(true);
    expect(screen.material).toBe(material);
    expect(screen.geometry.getAttribute("uv")).toBe(uv);
    expect(video.pause).toHaveBeenCalledTimes(1);
  });
});
