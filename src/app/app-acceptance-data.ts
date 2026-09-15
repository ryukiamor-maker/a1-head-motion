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
export const appControlSectionInventory = [
  {
    entity: "URDF model package",
    entityId: "robot-model",
    finiteSelectors: [
      {
        affectedTargets: [],
        reason: "Model selection changes the active joint and geometry branch.",
        role: "branch",
        target: "model.variant",
      },
    ],
    groupingReason: "These controls select and source the robot model package.",
    id: "source",
    targets: ["model.variant", "source.urdfFolder"],
    title: "URDF 模型包",
  },
  {
    entity: "Three degree of freedom motion",
    entityId: "head-motion",
    finiteSelectors: [],
    groupingReason: "These controls edit the three mapped head joint angles and capture input.",
    id: "motion",
    targets: ["capture.headTracking", "motion.pitch", "motion.roll", "motion.yaw"],
    title: "三自由度动作",
  },
  {
    entity: "Robot transform",
    entityId: "robot-transform",
    finiteSelectors: [],
    groupingReason: "These controls edit one retained robot root transform.",
    id: "robot",
    targets: [
      "robot.scale",
      "robot.positionX",
      "robot.positionY",
      "robot.positionZ",
      "robot.rotationX",
      "robot.rotationY",
      "robot.rotationZ",
    ],
    title: "机器人参数",
  },
  {
    entity: "Head tracking mapping",
    entityId: "capture-mapping",
    finiteSelectors: [],
    groupingReason: "These controls configure one camera-to-joint capture mapping.",
    id: "capture-mapping",
    targets: ["capture.sensitivity", "capture.maxPitch", "capture.maxRoll", "capture.maxYaw"],
    title: "捕捉映射",
  },
  {
    entity: "Head1 joint geometry",
    entityId: "head1-geometry",
    finiteSelectors: [],
    groupingReason: "These controls edit the three Head1 joint origin distances.",
    id: "geometry",
    targets: ["geometry.axis1OriginZ", "geometry.axis2OriginZ", "geometry.axis3OriginZ"],
    title: "Link 长度 / Joint Origin Z",
  },
  {
    entity: "Head2 rotation centers",
    entityId: "head2-centers",
    finiteSelectors: [],
    groupingReason: "These nine controls edit the three colored Head2 joint center vectors.",
    id: "head2-centers",
    targets: [
      "geometry.head2PitchCenterX",
      "geometry.head2PitchCenterY",
      "geometry.head2PitchCenterZ",
      "geometry.head2RollCenterX",
      "geometry.head2RollCenterY",
      "geometry.head2RollCenterZ",
      "geometry.head2YawCenterX",
      "geometry.head2YawCenterY",
      "geometry.head2YawCenterZ",
    ],
    title: "Head2 旋转中心",
  },
  {
    entity: "Joint angle limits",
    entityId: "joint-limits",
    finiteSelectors: [],
    groupingReason: "These controls bound the same three joint angle outputs.",
    id: "limits",
    targets: ["limits.axis1", "limits.axis2", "limits.axis3"],
    title: "角度限位",
  },
  {
    entity: "Robot camera view",
    entityId: "robot-view",
    finiteSelectors: [],
    groupingReason: "These controls edit one camera view of the robot head.",
    id: "view",
    targets: ["camera.distance", "camera.fov", "camera.targetZ", "view.orbit"],
    title: "视图",
  },
  {
    entity: "Image export settings",
    entityId: "image-export",
    finiteSelectors: [
      {
        reason: "Image format changes only the encoded image container.",
        role: "parameter",
        target: "export.image.format",
      },
      {
        reason: "Image resolution changes only the encoded image dimensions.",
        role: "parameter",
        target: "export.image.resolution",
      },
    ],
    groupingReason: "These controls configure one still image export.",
    id: "image-export",
    targets: ["export.image.format", "export.image.resolution"],
    title: "Image Export",
  },
  {
    entity: "Video export settings",
    entityId: "video-export",
    finiteSelectors: [
      {
        reason: "Video format changes only the encoded video container.",
        role: "parameter",
        target: "export.video.format",
      },
      {
        reason: "Video resolution changes only the encoded video dimensions.",
        role: "parameter",
        target: "export.video.resolution",
      },
    ],
    groupingReason: "These controls configure one video export.",
    id: "video-export",
    targets: ["export.video.format", "export.video.resolution"],
    title: "Video Export",
  },
] as const satisfies readonly ToolcraftControlSectionInventoryEntry[];
