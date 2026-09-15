export type RobotModelProfile = {
  id: "head1" | "head2";
  packagePath: string;
  jointNames: [string,string,string];
  originZ: [number,number,number];
  limits: [[number,number],[number,number],[number,number]];
  axisSigns: [number,number,number];
};

export const ROBOT_MODEL_PROFILES: Record<string, RobotModelProfile> = {
  head1: { id: "head1", packagePath: "head", jointNames: ["axis1","axis2","axis3"], originZ: [0.028,0.048,0.082], limits: [[-0.61,0.61],[-0.52,0.52],[-1.65,1.65]], axisSigns: [1,1,1] },
  head2: { id: "head2", packagePath: "head2", jointNames: ["pitch","roll","yaw"], originZ: [0.081,0,0.0565], limits: [[-0.61,0.61],[-0.523,0.523],[-1.657,1.657]], axisSigns: [-1,1,1] },
};

export function getRobotModelProfile(value: unknown): RobotModelProfile {
  return ROBOT_MODEL_PROFILES[value === "head2" ? "head2" : "head1"];
}
