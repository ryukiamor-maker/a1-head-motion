export function isTwoDegreeOfFreedom(values: Record<string, unknown>): boolean {
  return values["motion.dofMode"] === "2dof";
}

export function getActiveHeadAxes(values: Record<string, unknown>): readonly ("pitch" | "roll" | "yaw")[] {
  return isTwoDegreeOfFreedom(values) ? ["pitch", "yaw"] : ["pitch", "roll", "yaw"];
}
