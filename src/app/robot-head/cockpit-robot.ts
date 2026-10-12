import * as THREE from "three";
import type { URDFJoint, URDFRobot } from "urdf-loader";

// The neck joins the authored head (Y >= .23946) and cockpit support
// (Y <= .26735). Coordinates here are metres in the app's Z-up frame.
export const COCKPIT_NECK_CENTER = [0, 0, 0.255] as const;
export const COCKPIT_CENTER_PREFIXES = [
  "geometry.cockpitPitchCenter",
  "geometry.cockpitRollCenter",
  "geometry.cockpitYawCenter",
] as const;

function createJoint(name: string, axis: THREE.Vector3, position: THREE.Vector3): URDFJoint {
  const joint = new THREE.Object3D() as URDFJoint;
  joint.name = name;
  joint.axis = axis;
  joint.position.copy(position);
  joint.origPosition = position.clone();
  joint.origQuaternion = joint.quaternion.clone();
  joint.ignoreLimits = false;
  joint.limit = { effort: 0, lower: -Math.PI, upper: Math.PI, velocity: 0 };
  joint.setJointValue = (angle: number) => {
    joint.quaternion.setFromAxisAngle(axis, angle);
    return true;
  };
  return joint;
}

/** Reparent the original meshes without changing geometry, UVs or materials. */
export function bindCockpitRobot(source: THREE.Object3D): URDFRobot {
  const head = source.getObjectByName("tripo_part_3");
  const screen = source.getObjectByName("tripo_part_6");
  const base = source.getObjectByName("tripo_part_9");
  if (!head || !screen || !base) throw new Error("驾驶舱 GLB 缺少头部、屏幕或底座部件。");

  // Some exported accessor bounds incorrectly include Y=0 on the head/screen.
  // Recompute bounds from vertices so fit and culling use the actual geometry.
  source.traverse((object) => {
    if (object instanceof THREE.Mesh) {
      object.geometry.computeBoundingBox();
      object.geometry.computeBoundingSphere();
    }
  });
  source.rotation.x += Math.PI / 2;
  source.updateMatrixWorld(true);

  const robot = new THREE.Object3D() as URDFRobot;
  robot.name = robot.robotName = "cockpitRobot";
  const pitch = createJoint("pitch", new THREE.Vector3(0, 1, 0), new THREE.Vector3(...COCKPIT_NECK_CENTER));
  const roll = createJoint("roll", new THREE.Vector3(1, 0, 0), new THREE.Vector3());
  const yaw = createJoint("yaw", new THREE.Vector3(0, 0, 1), new THREE.Vector3());
  const pitchLink = new THREE.Group();
  const rollLink = new THREE.Group();
  const headLink = new THREE.Group();
  headLink.name = "cockpit-head";
  robot.add(pitch);
  pitch.add(pitchLink); pitchLink.add(roll); roll.add(rollLink);
  rollLink.add(yaw); yaw.add(headLink);
  robot.updateMatrixWorld(true);
  headLink.attach(head);
  headLink.attach(screen);
  // Keep all remaining parts, including the interior pilot/support, stationary.
  robot.attach(source);
  robot.joints = { pitch, roll, yaw };
  robot.setJointValue = (name, angle) => robot.joints[name]?.setJointValue(angle) ?? false;
  screen.visible = true;
  robot.userData.videoScreen = screen;
  robot.updateMatrixWorld(true);
  return robot;
}
