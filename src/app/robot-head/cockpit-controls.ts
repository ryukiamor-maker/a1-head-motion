import { COCKPIT_CENTER_PREFIXES, COCKPIT_NECK_CENTER } from "./cockpit-robot";

export const cockpitCenterSection = {
  controls: Object.fromEntries(COCKPIT_CENTER_PREFIXES.flatMap((prefix, index) =>
    ["X", "Y", "Z"].map((axis, coordinate) => [
      `${["pitch", "roll", "yaw"][index]}${axis}`,
      {
        applicability: {
          all: [
            { equals: "cockpitRobot", target: "model.variant" },
            ...(index === 1 ? [{ equals: "3dof", target: "motion.dofMode" }] : []),
          ],
          mode: "conditional" as const,
        },
        defaultValue: COCKPIT_NECK_CENTER[coordinate],
        keyframeable: false,
        label: `${["Pitch", "Roll", "Yaw"][index]} 中心 ${axis}`,
        max: coordinate === 2 ? 0.85 : 0.3,
        min: coordinate === 2 ? 0 : -0.3,
        orderRole: "spatial" as const,
        performanceReason: "调整驾驶舱头部关节轴心，仅更新保留的变换。",
        performanceRole: "responsiveness" as const,
        semanticGroup: ["pitch", "roll", "yaw"][index],
        sliderValueKind: "continuous" as const,
        step: 0.001,
        target: `${prefix}${axis}`,
        type: "slider" as const,
        unit: "m",
      },
    ]),
  )),
  id: "cockpit-centers",
  title: "驾驶舱旋转中心",
};
