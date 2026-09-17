import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import * as THREE from "three";
import { createHead3Robot, readHead3CompletionInfo } from "./model3-loader";
import { ROBOT_MODEL_PROFILES } from "./model-profiles";
import { applyRobotHeadValues } from "./robot-head-renderer";

const bytes = readFileSync(new URL("../../../public/head3/model3-geometry.bin", import.meta.url));
const binary = bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength) as ArrayBuffer;
const completionBytes = readFileSync(new URL("../../../public/head3/model3-completion.bin", import.meta.url));
const completion = completionBytes.buffer.slice(completionBytes.byteOffset, completionBytes.byteOffset + completionBytes.byteLength) as ArrayBuffer;
function fixture() {
  const robot = createHead3Robot(binary, new THREE.MeshStandardMaterial(), completion);
  robot.updateMatrixWorld(true);
  const head = robot.getObjectByName("head3-rigid-head") as THREE.Mesh;
  const lowerHead = robot.getObjectByName("head3-rigid-lower-face") as THREE.Mesh;
  const body = robot.getObjectByName("head3-body-scarf") as THREE.Mesh;
  const completionMesh = robot.getObjectByName("head3-inner-neck") as THREE.Mesh;
  return { robot, head, lowerHead, body, completionMesh, camera: new THREE.PerspectiveCamera() };
}
function points(mesh: THREE.Mesh) {
  const p = mesh.geometry.getAttribute("position");
  return [0, Math.floor(p.count / 3), Math.floor(p.count / 2), p.count - 1].map(i =>
    mesh.localToWorld(new THREE.Vector3().fromBufferAttribute(p, i)));
}

describe("Head3 rigid head and fixed scarf", () => {
  it("shares Head2's complete kinematic defaults", () => {
    const { id: _id, packagePath: _path, ...third } = ROBOT_MODEL_PROFILES.head3;
    const { id: _id2, packagePath: _path2, ...second } = ROBOT_MODEL_PROFILES.head2;
    expect(third).toEqual(second);
  });
  it("keeps the head rigid, the entire scarf/body fixed, and each requested pose stable across frames", () => {
    const { robot, head, lowerHead, body, camera } = fixture();
    const neutralHead = points(head), neutralLowerHead = points(lowerHead), neutralBody = points(body);
    const bodyMatrix = body.matrixWorld.clone();
    for (const pose of [{ "motion.pitch": 0.61 }, { "motion.roll": -0.52 }, { "motion.yaw": 1.65 },
      { "motion.pitch": -0.6, "motion.roll": 0.5, "motion.yaw": -1.6 }]) {
      const values = { "model.variant": "head3", ...pose };
      applyRobotHeadValues(robot, camera, values);
      const moved = points(head);
      const movedLowerHead = points(lowerHead);
      expect(moved[0].distanceTo(neutralHead[0])).toBeGreaterThan(0.001);
      moved.forEach((p, i) => expect(p.distanceTo(moved[0])).toBeCloseTo(neutralHead[i].distanceTo(neutralHead[0]), 10));
      movedLowerHead.forEach((p, i) =>
        expect(p.distanceTo(movedLowerHead[0])).toBeCloseTo(neutralLowerHead[i].distanceTo(neutralLowerHead[0]), 10));
      expect(body.matrixWorld.elements).toEqual(bodyMatrix.elements);
      points(body).forEach((p, i) => expect(p.distanceTo(neutralBody[i])).toBeLessThan(1e-12));
      const expected = head.matrixWorld.clone();
      for (let i = 0; i < 120; i++) applyRobotHeadValues(robot, camera, values);
      expect(head.matrixWorld.elements).toEqual(expected.elements);
    }
  });
  it("edits every XYZ pivot without moving neutral geometry and rotates around the edited center", () => {
    const { robot, head, camera } = fixture();
    const neutral = points(head);
    for (const name of ["Pitch", "Roll", "Yaw"]) {
      for (const axis of ["X", "Y", "Z"]) {
        const target = `geometry.head2${name}Center${axis}`;
        const values = { "model.variant": "head3", [target]: 0.025 };
        applyRobotHeadValues(robot, camera, values);
        points(head).forEach((p, i) => expect(p.distanceTo(neutral[i])).toBeLessThan(1e-10));
        const joint = robot.joints[name.toLowerCase()];
        const center = joint.getWorldPosition(new THREE.Vector3());
        const distance = points(head)[0].distanceTo(center);
        applyRobotHeadValues(robot, camera, { ...values, [`motion.${name.toLowerCase()}`]: 0.4 });
        expect(points(head)[0].distanceTo(center)).toBeCloseTo(distance, 10);
      }
    }
  });
  it("preserves the full source surface area and authored UVs while separating the curved seam", () => {
    const { head, lowerHead, body } = fixture();
    const area = (p: THREE.BufferAttribute, index?: Uint16Array) => {
      let sum = 0;
      for (let i = 0; i < (index?.length ?? p.count); i += 3) {
        const a = new THREE.Vector3().fromBufferAttribute(p, index?.[i] ?? i);
        const b = new THREE.Vector3().fromBufferAttribute(p, index?.[i + 1] ?? i + 1);
        const c = new THREE.Vector3().fromBufferAttribute(p, index?.[i + 2] ?? i + 2);
        sum += b.sub(a).cross(c.sub(a)).length() / 2;
      }
      return sum;
    };
    const sourceArea = area(new THREE.BufferAttribute(new Float32Array(binary, 0, 52173), 3), new Uint16Array(binary, 556512, 64017));
    const resultArea = [head, lowerHead, body].reduce((sum, mesh) =>
      sum + area(mesh.geometry.getAttribute("position") as THREE.BufferAttribute), 0);
    expect(resultArea).toBeCloseTo(sourceArea * 0.35 ** 2, 7);
    for (const mesh of [head, lowerHead, body]) {
      expect(mesh.geometry.getAttribute("uv").count).toBe(mesh.geometry.getAttribute("position").count);
    }
  });
  it("loads the versioned completion as a real UV-textured fur surface while retaining the source smooth face", () => {
    const info = readHead3CompletionInfo(completion);
    const { completionMesh } = fixture();
    const geometry = completionMesh.geometry;
    expect(info.stride).toBe(11);
    expect(info.furVertexCount).toBeGreaterThan(0);
    expect(info.faceVertexCount).toBe(0);
    expect(info.furVertexCount + info.faceVertexCount).toBe(info.vertexCount);
    expect(geometry.getAttribute("position").count).toBe(info.vertexCount);
    expect(geometry.getAttribute("normal").count).toBe(info.vertexCount);
    expect(geometry.getAttribute("uv").count).toBe(info.vertexCount);
    expect(geometry.getAttribute("color").count).toBe(info.vertexCount);
    expect(geometry.groups).toEqual([{ start: 0, count: info.furVertexCount, materialIndex: 0 }]);
    expect(Array.isArray(completionMesh.material)).toBe(true);
    expect((completionMesh.material as THREE.Material[])).toHaveLength(2);
    const uv = geometry.getAttribute("uv");
    const distinctUvs = new Set(Array.from({ length: Math.min(uv.count, 600) }, (_, index) =>
      `${uv.getX(index).toFixed(4)},${uv.getY(index).toFixed(4)}`));
    expect(distinctUvs.size).toBeGreaterThan(100);
  });
});
