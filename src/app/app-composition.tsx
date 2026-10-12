import type { ToolcraftAppComposition } from "@/toolcraft/runtime/react";

import { appSchema } from "./app-schema";
import { RobotHeadCanvas } from "./robot-head/robot-head-canvas";
import { UrdfFolderControl } from "./robot-head/urdf-folder-control";
import { HeadTrackingControl } from "./robot-head/head-tracking-control";
import { CuteRobotFileControl, FaceVideoControl } from "./robot-head/custom-source-controls";
import { createInteractionDemoCommands, INTERACTION_DEMO_ACTION } from "./robot-head/interaction-demo";
import { comparisonActions } from "./robot-head/comparison-actions";
import { MOTION_PACKAGE_IMPORT_TARGET } from "./robot-head/motion-package";
import {
  exportRobotHeadGif,
  robotHeadExportRenderer,
} from "./robot-head/robot-head-renderer";

export const appComposition: ToolcraftAppComposition = {
  canvasContent: <RobotHeadCanvas />,
  controlRenderers: {
    cuteRobotFile: CuteRobotFileControl as typeof UrdfFolderControl,
    faceVideo: FaceVideoControl as typeof UrdfFolderControl,
    headTracking: HeadTrackingControl as typeof UrdfFolderControl,
    urdfFolder: UrdfFolderControl,
  },
  exportRenderer: robotHeadExportRenderer,
  modelPresentation: { mode: "runtime" },
  onPanelAction: async ({ action, dispatch, reportFeedback, reportProgress, state }) => {
    if (action.value === INTERACTION_DEMO_ACTION) {
      createInteractionDemoCommands(state).forEach(dispatch);
      return;
    }
    const comparisonAction = comparisonActions.find(
      (candidate) => action.value === `motion.comparison.${candidate.slug}`,
    );
    if (comparisonAction) {
      dispatch({ target: "motion.comparisonName", type: "controls.setValue", value: comparisonAction.actionName });
      dispatch({ target: "export.video.comparisonMode", type: "controls.setValue", value: true });
      dispatch({ target: MOTION_PACKAGE_IMPORT_TARGET, type: "controls.setValue", value: comparisonAction });
      return;
    }
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
