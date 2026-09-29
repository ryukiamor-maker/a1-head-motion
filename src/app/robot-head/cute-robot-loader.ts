import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import type { URDFJoint, URDFRobot } from "urdf-loader";

function createJoint(name: string, axis: THREE.Vector3, position: THREE.Vector3): URDFJoint {
  const joint = new THREE.Object3D() as URDFJoint;
  joint.name = name;
  joint.axis = axis;
  joint.position.copy(position);
  joint.ignoreLimits = false;
  joint.limit = { effort: 0, lower: -Math.PI, upper: Math.PI, velocity: 0 };
  joint.origPosition = joint.position.clone();
  joint.origQuaternion = joint.quaternion.clone();
  joint.setJointValue = (angle: number) => {
    joint.quaternion.setFromAxisAngle(axis, angle);
    return true;
  };
  return joint;
}

/** Loads the supplied Y-up GLB and binds its separated head to a head2-style 3-axis rig. */
export async function loadCuteRobot(url: string): Promise<URDFRobot> {
  const gltf = await new GLTFLoader().loadAsync(url);
  const source = gltf.scene;
  const base = source.getObjectByName("tripo_part_0");
  const screenShell = source.getObjectByName("tripo_part_2");
  const head = source.getObjectByName("tripo_part_3");
  if (!base || !screenShell || !head) throw new Error("GLB 中缺少可绑定的头部或底座部件。");

  const robot = new THREE.Object3D() as URDFRobot;
  robot.name = robot.robotName = "cuteRobot";
  robot.rotation.x = Math.PI / 2;
  robot.userData.baseRotation = [Math.PI / 2, 0, 0] as const;
  source.remove(base, screenShell, head);
  base.name = "cute-robot-base";
  robot.add(base);

  const pivotY = 0.35;
  const pitch = createJoint("pitch", new THREE.Vector3(0, 0, -1), new THREE.Vector3(0, pivotY, 0));
  const roll = createJoint("roll", new THREE.Vector3(1, 0, 0), new THREE.Vector3());
  const yaw = createJoint("yaw", new THREE.Vector3(0, 1, 0), new THREE.Vector3());
  const pitchLink = new THREE.Group();
  const rollLink = new THREE.Group();
  const headLink = new THREE.Group();
  pitch.add(pitchLink); pitchLink.add(roll); roll.add(rollLink); rollLink.add(yaw); yaw.add(headLink);

  for (const part of [screenShell, head]) {
    part.position.y -= pivotY;
    headLink.add(part);
  }
  robot.add(pitch);
  robot.joints = { pitch, roll, yaw };
  robot.setJointValue = (name, angle) => robot.joints[name]?.setJointValue(angle) ?? false;
  robot.userData.fitCenter = new THREE.Vector3();
  // Video is injected into the authored rounded screen shell itself. The
  // renderer replaces only the inner front-facing pixels, leaving the bezel
  // and curved shell geometry intact.
  screenShell.name = "cute-robot-face-video-screen";
  screenShell.visible = true;
  robot.userData.videoScreen = screenShell;
  return robot;
}

export function getCuteRobotVideoScreen(robot: URDFRobot | null): THREE.Mesh | null {
  return (robot?.userData.videoScreen as THREE.Mesh | undefined) ?? null;
}
