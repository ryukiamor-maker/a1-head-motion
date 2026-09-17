export type RobotModelProfile = {
  id: "head1" | "head2" | "head3";
  packagePath: string;
  jointNames: [string, string, string];
  originZ: [number, number, number];
  limits: [[number, number], [number, number], [number, number]];
  axisSigns: [number, number, number];
  centerDefaults: [
    [number, number, number],
    [number, number, number],
    [number, number, number],
  ];
};

export const ROBOT_MODEL_PROFILES: Record<string, RobotModelProfile> = {
  head1: {
    axisSigns: [1, 1, 1],
    centerDefaults: [[0, 0, 0.028], [0, 0, 0.048], [0, 0, 0.082]],
    id: "head1",
    jointNames: ["axis1", "axis2", "axis3"],
    limits: [[-0.61, 0.61], [-0.52, 0.52], [-1.65, 1.65]],
    originZ: [0.028, 0.048, 0.082],
    packagePath: "head",
  },
  head2: {
    axisSigns: [-1, 1, 1],
    centerDefaults: [[0, 0, 0.081], [0, 0, 0], [0, 0, 0.0565]],
    id: "head2",
    jointNames: ["pitch", "roll", "yaw"],
    limits: [[-0.61, 0.61], [-0.523, 0.523], [-1.657, 1.657]],
    originZ: [0.081, 0, 0.0565],
    packagePath: "head2",
  },
  head3: {
    axisSigns: [-1, 1, 1],
    centerDefaults: [[0, 0, 0.081], [0, 0, 0], [0, 0, 0.0565]],
    id: "head3",
    jointNames: ["pitch", "roll", "yaw"],
    limits: [[-0.61, 0.61], [-0.523, 0.523], [-1.657, 1.657]],
    originZ: [0.081, 0, 0.0565],
    packagePath: "head3",
  },
};

export function getRobotModelProfile(value: unknown): RobotModelProfile {
  return ROBOT_MODEL_PROFILES[value === "head2" ? "head2" : value === "head3" ? "head3" : "head1"];
}
