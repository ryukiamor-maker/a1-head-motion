declare module "urdf-loader" {
  import type { LoadingManager, Object3D, Quaternion, Vector3 } from "three";

  export type URDFJoint = Object3D & {
    axis: Vector3;
    ignoreLimits: boolean;
    limit: { effort: number; lower: number; upper: number; velocity: number };
    origPosition: Vector3 | null;
    origQuaternion: Quaternion | null;
    setJointValue(value: number): boolean;
  };

  export type URDFRobot = Object3D & {
    joints: Record<string, URDFJoint>;
    robotName: string;
    setJointValue(name: string, value: number): boolean;
  };

  export default class URDFLoader {
    constructor(manager?: LoadingManager);
    packages: string | Record<string, string> | ((name: string) => string);
    parse(content: string, workingPath?: string): URDFRobot;
  }
}
