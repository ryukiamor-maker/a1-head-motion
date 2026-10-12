import type { MotionPackage } from "./motion-package";

export type ComparisonAction = MotionPackage & { slug: string };

export const comparisonActions: readonly ComparisonAction[] = [
  {
    actionName: "唤醒后转向用户",
    durationSeconds: 8,
    slug: "wake-turn",
    tracks: {
      pitch: [[0, 0], [1.2, 5], [2.4, 4], [3.7, 0], [5.3, 5], [6.5, 4], [7.7, 0], [8, 0]],
      roll: [[0, 0], [1.3, 2], [2.5, 1], [3.6, 0], [5.4, -2], [6.6, -1], [7.8, 0], [8, 0]],
      yaw: [[0, 0], [1.25, 50], [2.55, 50], [3.65, 0], [5.15, -50], [6.55, -50], [7.7, 0], [8, 0]],
    },
    version: 1,
  },
  {
    actionName: "点头确认",
    durationSeconds: 6,
    slug: "nod-confirm",
    tracks: {
      pitch: [[0, 0], [1.05, 4], [1.5, -9], [2.1, 2], [3.1, 7], [3.7, -18], [4.1, -16], [4.95, 1], [5.6, 0], [6, 0]],
      roll: [[0, 0], [6, 0]],
      yaw: [[0, 0], [6, 0]],
    },
    version: 1,
  },
  {
    actionName: "摇头否定",
    durationSeconds: 7,
    slug: "shake-no",
    tracks: {
      pitch: [[0, 0], [1.1, 2], [5.7, 2], [6.5, 0], [7, 0]],
      roll: [[0, 0], [7, 0]],
      yaw: [[0, 0], [1.2, 23], [2.35, -23], [3.6, 35], [4.95, -35], [6.4, 0], [7, 0]],
    },
    version: 1,
  },
  {
    actionName: "歪头倾听",
    durationSeconds: 8,
    slug: "tilt-listen",
    tracks: {
      pitch: [[0, 0], [1.4, -2], [2.8, -2], [3.9, 0], [5.2, -2], [6.5, -2], [7.7, 0], [8, 0]],
      roll: [[0, 0], [1.65, 14], [2.85, 14], [3.8, 0], [5.4, -14], [6.5, -14], [7.65, 0], [8, 0]],
      yaw: [[0, 0], [1.5, 3], [2.8, 3], [3.9, 0], [5.25, -3], [6.5, -3], [7.7, 0], [8, 0]],
    },
    version: 1,
  },
  {
    actionName: "歪头疑惑",
    durationSeconds: 7,
    slug: "tilt-confused",
    tracks: {
      pitch: [[0, 0], [1.5, 5], [3.2, 4], [4.6, 2], [6.5, 0], [7, 0]],
      roll: [[0, 0], [2, 16], [3.5, 16], [4.7, 11], [5.3, 11], [6.5, 0], [7, 0]],
      yaw: [[0, 0], [1.8, -4], [3.8, -4], [4.8, 2], [6.5, 0], [7, 0]],
    },
    version: 1,
  },
];

export function getComparisonAction(actionName: string): ComparisonAction | undefined {
  return comparisonActions.find((action) => action.actionName === actionName);
}
