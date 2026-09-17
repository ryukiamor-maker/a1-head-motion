import * as THREE from "three";
import type { URDFJoint, URDFRobot } from "urdf-loader";
import { splitHead3Geometry } from "./model3-geometry";

const COMPLETION_HEADER_BYTES = 24;
const COMPLETION_MAGIC = "H3UV";
const COMPLETION_VERSION = 2;
const COMPLETION_STRIDE = 11;

export type Head3CompletionInfo = {
  faceVertexCount: number;
  furVertexCount: number;
  stride: number;
  vertexCount: number;
};

export function readHead3CompletionInfo(completion: ArrayBuffer): Head3CompletionInfo {
  if (completion.byteLength < COMPLETION_HEADER_BYTES) throw new Error("Head3 补全模型资源不完整。");
  const magic = String.fromCharCode(...new Uint8Array(completion, 0, 4));
  const view = new DataView(completion);
  const version = view.getUint32(4, true);
  const stride = view.getUint32(8, true);
  const vertexCount = view.getUint32(12, true);
  const furVertexCount = view.getUint32(16, true);
  const faceVertexCount = view.getUint32(20, true);
  const expectedBytes = COMPLETION_HEADER_BYTES + vertexCount * stride * Float32Array.BYTES_PER_ELEMENT;
  if (
    magic !== COMPLETION_MAGIC || version !== COMPLETION_VERSION || stride !== COMPLETION_STRIDE
    || furVertexCount + faceVertexCount !== vertexCount || expectedBytes !== completion.byteLength
    || vertexCount % 3 !== 0 || furVertexCount % 3 !== 0 || faceVertexCount % 3 !== 0
  ) throw new Error("Head3 补全模型资源格式不受支持或已损坏。");
  return { faceVertexCount, furVertexCount, stride, vertexCount };
}

function createJoint(name: string, axis: THREE.Vector3, z: number): URDFJoint {
  const value = new THREE.Object3D() as URDFJoint;
  value.name = name;
  value.position.z = z;
  value.axis = axis;
  value.ignoreLimits = false;
  value.limit = { effort: 0, lower: -Math.PI, upper: Math.PI, velocity: 0 };
  value.origPosition = value.position.clone();
  value.origQuaternion = value.quaternion.clone();
  value.setJointValue = (angle: number) => {
    value.quaternion.setFromAxisAngle(axis, angle);
    return true;
  };
  return value;
}

/** Rigid head on the same joint/link hierarchy as Head2; no animated bind matrices. */
export function createHead3Robot(
  binary: ArrayBuffer,
  material: THREE.Material,
  completion: ArrayBuffer,
  completionMaterials?: readonly [THREE.Material, THREE.Material],
): URDFRobot {
  const { body, head, lowerHead, neck } = splitHead3Geometry(binary);
  {
    const info = readHead3CompletionInfo(completion);
    const buffer = new THREE.InterleavedBuffer(
      new Float32Array(completion, COMPLETION_HEADER_BYTES, info.vertexCount * info.stride),
      info.stride,
    );
    neck.setAttribute("position", new THREE.InterleavedBufferAttribute(buffer, 3, 0));
    neck.setAttribute("normal", new THREE.InterleavedBufferAttribute(buffer, 3, 3));
    neck.setAttribute("uv", new THREE.InterleavedBufferAttribute(buffer, 2, 6));
    neck.setAttribute("color", new THREE.InterleavedBufferAttribute(buffer, 3, 8));
    neck.clearGroups();
    neck.addGroup(0, info.furVertexCount, 0);
    if (info.faceVertexCount > 0) neck.addGroup(info.furVertexCount, info.faceVertexCount, 1);
    neck.computeBoundingSphere();
  }
  const robot = new THREE.Object3D() as URDFRobot;
  robot.name = robot.robotName = "head3";
  const bodyMesh = new THREE.Mesh(body, material);
  bodyMesh.name = "head3-body-scarf";
  const headMesh = new THREE.Mesh(head, material);
  headMesh.name = "head3-rigid-head";
  const lowerHeadMesh = new THREE.Mesh(lowerHead, material);
  lowerHeadMesh.name = "head3-rigid-lower-face";
  const materials = completionMaterials ?? [
    new THREE.MeshStandardMaterial({ color: 0xffffff, vertexColors: true, roughness: 0.92, metalness: 0, side: THREE.DoubleSide }),
    new THREE.MeshStandardMaterial({ color: 0xffffff, vertexColors: true, roughness: 0.82, metalness: 0, side: THREE.DoubleSide }),
  ];
  const neckMesh = new THREE.Mesh(neck, [...materials]);
  neckMesh.name = "head3-inner-neck";
  const pitch = createJoint("pitch", new THREE.Vector3(0, 1, 0), 0.081);
  const roll = createJoint("roll", new THREE.Vector3(1, 0, 0), 0);
  const yaw = createJoint("yaw", new THREE.Vector3(0, 0, 1), 0.0565);
  // Link frames absorb pivot changes, exactly like the URDF chain. Child joints
  // are never also used as compensation frames.
  const pitchLink = new THREE.Group();
  const rollLink = new THREE.Group();
  const headLink = new THREE.Group();
  pitch.add(pitchLink); pitchLink.add(roll);
  roll.add(rollLink); rollLink.add(yaw);
  yaw.add(headLink);
  headMesh.position.z = lowerHeadMesh.position.z = neckMesh.position.z = -0.1375;
  headLink.add(headMesh, lowerHeadMesh, neckMesh);
  robot.add(bodyMesh, pitch);
  robot.joints = { pitch, roll, yaw };
  robot.setJointValue = (name, angle) => robot.joints[name]?.setJointValue(angle) ?? false;
  robot.userData.fitCenter = new THREE.Vector3();
  return robot;
}

export async function loadHead3Robot(baseUrl: URL): Promise<URDFRobot> {
  const response = await fetch(new URL("head3/model3-geometry.bin", baseUrl));
  if (!response.ok) throw new Error("Head3 几何资源请求失败。");
  const binary = await response.arrayBuffer();
  const texture = await new THREE.TextureLoader().loadAsync(new URL("head3/model3-texture.jpg", baseUrl).href);
  texture.flipY = false;
  texture.colorSpace = THREE.SRGBColorSpace;
  const material = new THREE.MeshStandardMaterial({ map: texture, roughness: 0.9, metalness: 0, side: THREE.DoubleSide });
  const completionResponse = await fetch(new URL("head3/model3-completion.bin", baseUrl));
  if (!completionResponse.ok) throw new Error("Head3 补全模型资源请求失败。");
  const completionTexture = await new THREE.TextureLoader().loadAsync(new URL("head3/model3-completion-fur.png", baseUrl).href);
  completionTexture.flipY = false;
  completionTexture.colorSpace = THREE.SRGBColorSpace;
  completionTexture.wrapS = THREE.RepeatWrapping;
  completionTexture.wrapT = THREE.RepeatWrapping;
  const furMaterial = new THREE.MeshStandardMaterial({
    map: completionTexture,
    color: 0xffffff,
    vertexColors: true,
    roughness: 0.92,
    metalness: 0,
    side: THREE.DoubleSide,
  });
  const smoothFaceMaterial = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    vertexColors: true,
    roughness: 0.82,
    metalness: 0,
    side: THREE.DoubleSide,
  });
  return createHead3Robot(
    binary,
    material,
    await completionResponse.arrayBuffer(),
    [furMaterial, smoothFaceMaterial],
  );
}
