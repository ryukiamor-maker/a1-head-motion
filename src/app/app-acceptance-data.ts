import type {
  ToolcraftComponentAcceptance,
  ToolcraftControlSectionInventoryEntry,
  ToolcraftProductReadiness,
  ToolcraftTransferMode,
} from "./acceptance/types";
import { appSchema } from "./app-schema";

const starterPersistenceSlices =
  appSchema.persistence.storage === "localStorage"
    ? appSchema.persistence.include
    : [];

export const appTransferMode: ToolcraftTransferMode = {
  animationIntent: {
    loopDuration: {
      evidence: "A four-second default gives the three head joints enough room for readable keyframe poses and remains editable in the Toolcraft timeline.",
      seconds: 4,
      source: "product-derived",
    },
    mode: "timeline-keyframes",
  },
  mode: "new-toolcraft-app",
  referenceInputs: [],
};

export const appProductReadiness: ToolcraftProductReadiness = {
  exportIntent: {
    image: { mode: "toolcraft-default" },
    svg: { mode: "not-requested" },
    video: { evidence: "The user explicitly requested common video and GIF export formats for authored robot-head animation.", mode: "user-requested" },
  },
  interactionOwnership: [
    {
      alternative: { reason: "The canvas cannot request and validate a complete ROS directory without obscuring the model.", surface: "canvas" },
      capability: "structured-selection",
      evidence: { detail: "The user explicitly requires uploading a folder rather than one GLB file.", source: "user-request" },
      id: "urdf-folder-selection",
      reason: "Source-package selection belongs beside its validation status in the controls panel.",
      surface: "panel",
      target: "source.urdfFolder",
    },
    {
      alternative: { reason: "Dragging model geometry cannot provide exact origin-Z or lower/upper radian values.", surface: "canvas" },
      capability: "precise-value-entry",
      evidence: { detail: "The supplied image asks for direct adjustment of link lengths and angular limits in the control panel.", source: "user-request" },
      id: "kinematic-parameter-editing",
      reason: "Exact kinematic values belong to Toolcraft sliders and range sliders.",
      selectionScope: { mode: "global" },
      surface: "panel",
      target: "geometry.axis1OriginZ",
    },
    {
      alternative: { reason: "Panel pose inputs would duplicate the spatial orbit interaction.", surface: "panel" },
      capability: "direct-spatial-edit",
      evidence: { detail: "A visible three-dimensional robot needs spatial inspection while authoring joint motion.", source: "usability-analysis" },
      id: "robot-view-orbit",
      reason: "The Toolcraft orientation gizmo owns camera orbit on the canvas.",
      surface: "canvas",
      target: "view.orbit",
    },
  ],
  mode: "product",
  productName: "Robot Head Motion Studio",
  productSummary: "A Toolcraft editor for loading complete ROS URDF packages, posing the whole model, and composing pitch, roll, and yaw animation with still, video, and GIF export.",
  requestedBehavior: "Load the supplied head folder by default, accept complete URDF folders, expose joint, camera, model-transform, link-length, and limit parameters, author animation on a keyframe timeline, and export common media formats.",
  viewInteraction: { mode: "orbit", orientationTargets: ["view.orbit"] },
};

export const appAcceptance: readonly ToolcraftComponentAcceptance[] = [
  {
    automated: true,
    automatedTestName:
      "declares production reload coverage for the starter schema",
    browser: {
      budget: "extended-io",
      file: "e2e/app-persistence.spec.ts",
      testName: "browser: app restores exact canvas, values, and panel workspace slices after reload",
    },
    componentType: "persistence",
    evidence: "persistence-state",
    expectedObservable:
      "Canvas size and zoom, their runtime values, and the moved and collapsed Controls workspace remain visibly restored after a real browser reload.",
    fixture: "starter runtime persisted workspace",
    id: "persistence.reload",
    kind: "runtime",
    persistenceCoverage: "reload",
    persistenceSlices: starterPersistenceSlices,
    target: "canvas.size.width",
    userAction: "Edit Canvas width and zoom, move and collapse Controls, wait for persistence, and reload the page.",
  },
];

// Product entries use the same explicit stable section IDs as appSchema.
export const appControlSectionInventory: readonly ToolcraftControlSectionInventoryEntry[] = [];
