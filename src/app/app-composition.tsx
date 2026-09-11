import type { ToolcraftAppComposition } from "@/toolcraft/runtime/react";

import { appSchema } from "./app-schema";
import { RobotHeadCanvas } from "./robot-head/robot-head-canvas";
import { UrdfFolderControl } from "./robot-head/urdf-folder-control";
import { HeadTrackingControl } from "./robot-head/head-tracking-control";
import {
  exportRobotHeadGif,
  robotHeadExportRenderer,
} from "./robot-head/robot-head-renderer";

export const appComposition: ToolcraftAppComposition = {
  canvasContent: <RobotHeadCanvas />,
  controlRenderers: { headTracking: HeadTrackingControl as typeof UrdfFolderControl, urdfFolder: UrdfFolderControl },
  exportRenderer: robotHeadExportRenderer,
  modelPresentation: { mode: "runtime" },
  onPanelAction: async ({ action, reportFeedback, reportProgress, state }) => {
    if (action.value !== "export.gif") return;
    try {
      await exportRobotHeadGif(state, reportProgress);
    } catch (reason) {
      reportFeedback({
        code: "gif-export-failed",
        message: reason instanceof Error ? reason.message : "GIF 导出失败。",
      });
    }
  },
  renderDefaultCanvasMedia: false,
  schema: appSchema,
};
