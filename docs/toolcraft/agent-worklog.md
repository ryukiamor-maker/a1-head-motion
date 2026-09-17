# Implementation Worklog

This file records product decisions and the evidence behind them. Keep it short, factual, and current. Update it after schema, renderer, timeline, layer, export, performance, or acceptance decisions.

## Status

Mode: product

Robot Head Motion Studio is implemented with a Toolcraft shell, a retained Three.js URDF renderer, complete-folder loading, editable kinematics, and a keyframe timeline.

## Automatic Delivery Lifecycle

Keep this worklog human-shaped. For the first product delivery, record the request, decisions, state/output mapping, reference evidence, rejected alternatives, and known risks; one bare `pnpm verify:delivery` derives complete contract proof, one build, full functional acceptance, and no measured performance. For later ordinary edits, record new intent and material decisions, the exact unit/component test, and acceptance IDs passed to `pnpm test:feature`; selector expansion is automatic, while explicit `--all` records why the edit could not be bounded. Do not claim or run another aggregate functional delivery.

Classifier output establishes complaint authority only and never path localization. A localized performance complaint adds the domain authority below, then one bare `pnpm verify:delivery` runs one targeted iteration. If localization remains unresolved regardless of classifier result, ask one user-facing question naming visible operations and offering targeted diagnosis or a complete review; record neither `performance-iteration` intent nor canonical path authority until the answer supplies exact localization evidence. Never ask the user to choose internal path IDs. A broad or honestly unlocalizable problem may present that single choice with a recommendation for complete review, but the user still chooses. A direct complete-review request needs no further clarification. The full audit remains separate and requires an explicit operator request or accepted offer before `pnpm verify:perf` may run. Protected receipts own changed files, plans, checks, reports, measurements, and pass/fail evidence.

When `canvas.renderScale` is enabled, record the renderer decision to preserve selected backing quality and map it to functional `renderScaleCoverage` for interaction and steady state, plus playback when timeline is enabled. The worklog may name the protected `canvas-render-scale-backing` recipe, but it cannot claim its evidence or turn a quality failure into performance authority.

## Performance Iteration Entry Contract

For high-confidence ordinary work, record `Performance intent: ordinary-product-work`. For unresolved localization, whether classification returned high-confidence `performance-iteration` or `needs-agent-judgment`, record the unresolved visible operation but no `Performance intent: performance-iteration` field or `Performance paths` until the user's one clarification provides exact localization. For a localized performance complaint or post-clarification targeted choice, record exactly these domain fields in the latest iteration:

```md
- Performance intent: performance-iteration
- Performance request evidence: "<verbatim exact Request quote>"
- Performance paths: ["performance-path:%5B...%5D"]
- Verification: One bare `pnpm verify:delivery` will derive and run the protected proof.
```

The quoted evidence must be an exact nontrivial raw substring of `Request` with identical whitespace and Unicode code units. `Performance paths` must be a non-empty unique JSON array of canonical path IDs. Do not record command arguments, changed-file inventory, executed checks, reports, or measurements; the protected planner and receipt own that machine evidence. Each localized complaint or post-clarification targeted choice authorizes one bounded iteration; after it passes, return the app and wait for user evaluation. Classifier output or complaint evidence alone never supplies path localization or authorizes full certification. The separate operator command is permitted only after the user explicitly requests a complete audit or explicitly accepts the agent's offer; the user does not need to name the command.

## Decision Trail

### Iteration 7 — Head1 center annotations, lighter markers, and export visibility

- Request: 为 Head1 增加三轴旋转中心标注；缩小 Head2 的旋转中心标注；增加导出视频时是否显示旋转中心的选项。
- Task type: Later focused renderer, schema-control, and raster-export refinement (Tier 3).
- User-visible result: Head1 now shows red/green/blue Pitch/Roll/Yaw center annotations using its `axis1`/`axis2`/`axis3` joints. All three models use shorter, thinner, partially transparent center markers. Video Export adds a built-in `显示旋转中心` switch for MP4/WebM/GIF output; its default is off, and still-image export remains clean at the standard image sizes.
- Source/reference checked: Current Head1 and Head2 URDF joint names/axes, the retained Three.js marker implementation, the shared Toolcraft image/video export callback, and the live in-app browser rendering for Head1 and Head3.
- Reference inputs: None; this is a direct refinement of the existing product renderer.
- Docs/contracts read: `workflow.md`, `core/runtime-boundary.md`, `core/performance.md`, `decision-contract.md`, `core/control-selection.md`, `core/layout.md`, `core/setup-export.md`, `core/media-upload.md`, `renderer-technique.md`, `performance.md`, `component-rules.md`, and `acceptance-testing.md`.
- Contract rules applied: Keep marker geometry in `canvasContent`, preserve the retained Three.js surface, use the built-in Switch for a boolean export option, keep Video Export directly above the sticky actions, and use later-feature focused functional/browser checks without measured performance.
- View interaction intent: Existing `orbit` ownership and `view.orbit` orientation gizmo remain unchanged; center markers are non-interactive spatial feedback.
- Interaction ownership: The panel owns the video-overlay boolean and exact joint-center values. The retained canvas/export renderer owns marker visibility and geometry; no duplicate canvas toggle is added.
- Decision: Create markers from the active model profile and each loaded joint's real axis. Use sphere radius `0.003`, ring tube/axis radius `0.00065`, axis length `0.032`, and opacity `0.86`. Reuse the same marker visibility switch for MP4/WebM/GIF; image exports remain marker-free for the standard fixed image sizes.
- Alternatives rejected: Separate Head1-only marker code, DOM labels that drift from the Three.js scene, retaining the original oversized geometry, or a custom export action that bypasses Toolcraft's typed video pipeline.
- State/output mapping: `model.variant` selects the profile/joint names; existing Head1 origin-Z or Head2/3 XYZ center state positions each marker; `export.video.includeRotationCenters` controls marker visibility during runtime video/GIF frame rendering only.
- Performance intent: ordinary-product-work. Marker meshes remain retained and the option only changes visibility during export; no measured performance run is authorized.
- Verification: Focused marker/renderer tests cover Head1 marker creation, the slimmer style, video-sized inclusion, image-sized exclusion, and disabled behavior. TypeScript passes. Manual browser inspection confirms Head1's three markers, the lighter marker treatment, the visible Video Export switch, and its off/on/off state transition.
- Risks: Toolcraft currently supplies one shared image/video product-frame callback without an artifact-kind field, so typed video detection uses the resolved output size; a custom canvas size exactly matching a fixed image export size can be ambiguous until the runtime exposes artifact kind directly.

### Iteration 6 — Head3 full-body GLB with head-only motion

- Request: 现在需要导入并适配模型3，即上传文件；要求加载渲染整个模型，但只有头部能动，头部的参数和head2保持一致，要有三轴、要能调整三轴旋转中心；其他功能也一并保持。
- Task type: Later focused product feature, bundled GLB adaptation, retained Three.js renderer, schema branching, and model-specific kinematics.
- User-visible result: The built-in model selector gains Head 3. Its complete textured GLB remains visible while only the head follows the existing Pitch, Roll, and Yaw motion, tracking, timeline, and export values. Head 3 shares Head2's limits, axis signs, and nine editable XYZ rotation-center controls with the same red, green, and blue markers.
- Source/reference checked: `C:/Users/geneliu/Downloads/tripo_convert_981cb370-d46a-4c67-978b-5a4b36140263.glb`, its Tripo glTF node/primitive/accessor structure, the existing Head2 URDF hierarchy and profile, and the retained preview/export surface.
- Docs/contracts read: `workflow.md`, `core/control-selection.md`, `core/layout.md`, `core/runtime-boundary.md`, `core/performance.md`, `schema-reference.md`, `component-rules.md`, `renderer-technique.md`, and `performance.md`.
- View interaction intent: The existing `orbit` mode and `view.orbit` orientation gizmo remain the view owner. The colored axes are spatial feedback for the panel-authored joint centers.
- Interaction ownership: The panel owns exact model selection and center values; the retained canvas owns model rendering, head motion, markers, and orbit. The timeline and webcam capture continue to write the existing motion targets.
- Decision: Preserve original PBR texture and all original triangle area. Separate along a sampled curved scarf lip. Blender 4.5 reconstructs a rounded lower cranium with boundary-matched normals and a pale chin continuing the face mask. Store the editable packed Blender project and bake its completion mesh for the retained editor. Pitch→Roll→Yaw uses compensating link frames and rigid head geometry; no mixed face weights or animated bind inverses.
- Alternatives rejected: Moving the complete GLB, discarding the body, requiring an unavailable authored skeleton, flattening the texture into fallback material, or creating a second set of Head3 motion parameters.
- State/output mapping: `model.variant=head3` selects the bundled GLB; `motion.*`, `limits.*`, and `geometry.head2*Center{X,Y,Z}` drive the synthetic head joints; root transform, camera, tracking, timeline, still/video/GIF export, theme, and grid continue through the existing shared renderer.
- Performance intent: ordinary-product-work. The model is decoded once per selection and motion/center edits update retained transforms without reloading geometry.
- Verification: Focused profile/rig tests will prove shared defaults, static body transforms, head-only rotation, and center updates. A production build checks the new native buffer loader and bundled reconstructed mesh assets. Browser checks will inspect full textured rendering, axis markers, body stability, head motion, and control applicability.
- Risks: The supplied Tripo file contains one unrigged mesh, so the neck boundary is inferred from inspected geometry and explicitly excludes the scarf. Future replacement files with a different pose or topology need their own explicit partition metadata.

- Steering: User rejected the stretched skin, exposed flat cap, and gray chin band. Removed skinning and replaced the cap in Blender with a curved, closed lower head; shortened the jaw and continued face color around the underside.
- Focused verification: Eight rig/camera tests cover shared defaults, rigid geometry, body/scarf invariance, 120 identical pose updates, nine editable pivot coordinates, and preserved source surface area. Browser inspection covers neutral, pitch, yaw, roll and raised chin.

### Iteration 5 — Tracking gain, output limits, and continuous recording

- Request: 增加手动调整映射的选项以及最大限度，能够自由设置，手动调整效果；修复追踪只有第一下有关键帧的问题。
- Task type: Later focused product feature and timeline recording bug fix.
- User-visible result: 新增“捕捉映射” section with overall sensitivity plus independent Pitch / Roll / Yaw maximum angle sliders. Values persist in runtime state and take effect on the live model without restarting the camera. Recording now uses the current sample elapsed time for every upsert, so each sample creates/updates its own timeline position instead of overwriting the first frame.
- Decision: Keep camera capture transient, read mapping controls through `ToolcraftState.values`, apply exponential smoothing without attenuating the eventual angle, scale each neutral-relative Euler delta before per-axis clamping, and pass elapsed seconds directly to `timeline.upsertControlKeyframe`.
- Verification: TypeScript and production Vite build passed. Browser verification showed adjustable mapping controls, `停止录制` while active, and all three motion controls displaying enabled keyframe toggles after a multi-sample recording.
- Performance intent: ordinary-product-work.

### Iteration 4 — Camera stream lifecycle fix

- Request: 修复启动摄像头后没有内容并立即自动关闭的问题。
- Task type: Later focused bug fix in the camera custom control.
- User-visible result: Camera resources are now released only when the control unmounts or the user presses 停止. Runtime value updates such as smoothing changes no longer stop an active stream.
- Root cause: The cleanup effect depended on the `stop` callback, whose identity changed whenever the persisted tracking value changed; React therefore ran cleanup during normal re-renders.
- Decision: Use a stable unmount-only cleanup effect and keep the explicit `stop` callback for the user action.
- Verification: TypeScript check and production Vite build passed. In the local browser, clicking 启动 now remains at `追踪中 · 请正对摄像头` and updates YAW/PITCH/ROLL readouts after several seconds.
- Performance intent: ordinary-product-work.

### Iteration 3 — Camera head-pose capture

- Request: Add webcam-based human head pose capture to the existing a1-head-motion editor, with live control and recorded animation output.
- Task type: Later product feature, custom control, renderer input, timeline keyframes, and browser media permission.
- User-visible result: The 三自由度动作 section now exposes 人头姿态捕捉. It loads MediaPipe Face Landmarker on demand, previews the camera, calibrates the neutral pose, maps roll/pitch/yaw to the existing URDF joints, applies smoothing, and records samples into the existing Toolcraft keyframe timeline. Existing image, video, and GIF export paths remain the output owners.
- Source/reference checked: The a1-head-motion Toolcraft app, `src/app/robot-head/robot-head-canvas.tsx`, `robot-head-renderer.ts`, the runtime timeline command union, and the official MediaPipe Face Landmarker web API.
- Docs/contracts read: `workflow.md`, `core/runtime-boundary.md`, `core/control-selection.md`, `core/layout.md`, `core/timeline-animation.md`, `core/performance.md`, and the custom-control/component contracts.
- View interaction intent: Existing `orbit` view and `view.orbit` orientation gizmo remain the camera inspection owner; webcam pose is a complementary input for robot joint motion.
- Interaction ownership: The panel owns camera permission, calibration, smoothing, start/stop, and recording. The timeline owns playback and keyframe editing. The canvas remains the product output and orbit surface.
- Decision: Use the supported `controlRenderers` extension with `@mediapipe/tasks-vision` and runtime commands. Keep camera streams and detector instances transient; persist only the serializable enabled/smoothing settings. Use `timeline.upsertControlKeyframe` for the three existing motion targets and runtime timeline duration/current-time commands during recording.
- Alternatives rejected: A second hand-built timeline, product-owned download/export code, server-side video upload, and a custom Three.js pose pipeline.
- State/output mapping: MediaPipe facial transformation matrices become radians in `motion.pitch`, `motion.roll`, and `motion.yaw`; runtime evaluated values continue to drive the retained URDF scene and all existing export paths.
- Performance intent: ordinary-product-work.
- Verification: `pnpm exec tsc --noEmit` and `pnpm build` passed. Camera permission, model download, and live pose quality require browser verification with an available webcam.
- Risks: MediaPipe WASM and model files are fetched from jsDelivr/Google Storage on first use; long offline video ingestion should move detection to a Web Worker before adding file-based batch processing.

### Product iteration — Robot head URDF motion authoring

- Request: Replace DialKit UI with Toolcraft, use `gkjohnson/urdf-loaders`, load the supplied `head` folder by default, accept folders rather than one GLB, and expose the link lengths and lower/upper joint limits shown in the supplied image.
- Task type: New Toolcraft product, custom WebGL renderer, custom directory interaction, schema controls, persistence, and timeline.
- User-visible result: The default ROS package renders immediately; a complete URDF directory can replace it; pitch, roll, yaw, the three joint-origin Z lengths, and three paired joint ranges are directly editable; Toolcraft keyframes preview and persist motion.
- Source/reference checked: `C:/Users/geneliu/Desktop/head`, its `urdf/head.urdf`, `urdf/head.csv`, four STL meshes, the supplied parameter screenshot, official Toolcraft starter, and official `gkjohnson/urdf-loaders` API.
- Reference inputs: The screenshot is engineering guidance for editable link-length and angle-limit fields, not a motion reference; no video/GIF reference was supplied.
- Docs/contracts read: `workflow.md`; runtime boundary, control selection, layout, performance, timeline, export, and media plan docs; decision, schema, component, renderer, performance, custom-control implementation docs; `acceptance-testing.md`.
- Contract rules applied: Toolcraft shell ownership, schema-first controls, runtime evaluated keyframe values, public kit primitives, transient binary state, local persistence, and retained WebGL scene ownership.
- View interaction intent: Orbit through the built-in Toolcraft `orientationGizmo` target `view.orbit`.
- Interaction ownership: The panel owns directory selection and exact kinematic values; the canvas owns spatial orbit; the timeline owns motion transport and keyframes.
- Decision: Use `URDFLoader` for parsing and `URDFRobot.setJointValue` for motion. Apply origin-Z and limit edits directly to retained joint objects before every evaluated pose update. Use the File System Access directory picker because Toolcraft's built-in single-source file drop cannot recursively enumerate a ROS package.
- Alternatives rejected: Single GLB upload, DialKit controls, parsing only the spreadsheet, keeping a separate animation loop outside Toolcraft, and storing File or Three.js objects in persistent runtime state.
- State/output mapping: `motion.*` evaluated timeline values drive `axis1..3`; `geometry.*OriginZ` drives joint positions; `limits.*` drives URDF limit clamps; `view.orbit` drives the camera; `source.urdfFolder` stores only a serializable manifest while selected bytes remain session-local.
- Performance intent: ordinary-product-work
- Verification: Verification tier Tier 4. Run AI boundary check, typecheck, production build, local browser load, default URDF pixel inspection, joint motion, length, limit, timeline, and folder control checks.
- Risks: Browser folder selection requires a Chromium browser supporting `showDirectoryPicker`; selected folder bytes are intentionally not restored after a browser restart, so reload falls back to the bundled default package while editable numeric state and keyframes persist.

### Iteration 1 — Model appearance and presentation runtime contract

- Request: Preserve authored model materials and textures from folders or ZIP packages, use a Blender-like fallback only when authored appearance is absent, render the result on the canvas, and keep direct orbit synchronized with the orientation gizmo.
- Task type: Runtime, starter, contract, CLI, and generated-app delivery.
- User-visible result: GLB/glTF/OBJ/FBX/PLY/STL imports now retain the supported authored appearance subset, folder and ZIP resources remain durable, missing appearance resources surface typed warnings, and materialless geometry uses the canonical fallback. Runtime preview keeps one presentation lease and one camera pose for canvas rendering, direct model drag, gizmo snap, history, reset, and export.
- Source/reference checked: `/Users/kusnizza/Projects/toolcraft-apps/rain-drops`, the production model adapters, canonical document codecs, binary repository reachability, runtime canvas/model presentation, and generated-app browser evidence.
- Reference inputs: The user selected preservation for both folder and ZIP imports, fallback only when authored material is absent, and the current Toolcraft application contract as the source of truth.
- Docs/contracts read: `core/runtime-boundary.md`, `core/media-upload.md`, `core/performance.md`, `renderer-technique.md`, `acceptance-testing.md`, and the runtime decision/component contracts.
- Contract rules applied: `canvas-surface-preserved`, `interaction-surface-ownership`, `renderer-view-interaction`, `renderer-technique-inventory`, `acceptance-product-observable`, `performance-coverage-levels`, and `persistence-policy-explicit`.
- View interaction intent: A visible editable model uses `orbit`; runtime canvas drag and `orientationGizmo` consume the same orientation target without mutating canonical source data.
- Interaction ownership: Canvas owns direct spatial orbit and gizmo snap. The panel owns source package selection, status, warning, repair, and removal actions.
- Decision: Preserve immutable source packages and canonical appearance data; build a disposable Three.js projection with bounded batching/deduplication only for pixel-equivalent opaque geometry. Retain the renderer prewarm resource across remove/reimport and dispose it with the owning presentation host.
- Alternatives rejected: Product-owned model loaders, remote texture fallback, storing Three.js objects in state, appearance-driven topology repair, duplicate standard/custom presentation owners, and metadata-only browser evidence.
- State/output mapping: Durable package refs and canonical document refs live in runtime media state; resolved appearance resources feed a shared presentation lease; evaluated orientation state feeds preview, hit testing, gizmo, history/reset, and export.
- Performance intent: ordinary-product-work
- Verification: One bare `pnpm verify:delivery` will derive and run the protected proof.
- Risks: The canonical contract intentionally covers static geometry and the documented PBR subset; unsupported skins, morph targets, animation clips, texture transforms, or missing resources remain nonfatal diagnostics when possible. Synthetic browser fixtures prove contract behavior but cannot guarantee every malformed third-party exporter file.

### Iteration 2 — Infinity canvas runtime and scene-cropped export

- Request: Add an `Infinity canvas` toggle to the first Project Settings section; when enabled, remove canvas size controls and artboard limits, use the whole workspace, and export a crop around scene elements.
- Task type: Runtime, canvas, export, acceptance, starter contract, documentation, CLI, and generated-app delivery.
- User-visible result: Project Settings now starts with `Infinity canvas`. Enabling it removes aspect ratio, width, and height controls plus the finite artboard boundary; disabling it restores the exact previous finite dimensions. Image export remains full-artboard in finite mode and crops to visible scene bounds in infinite mode.
- Source/reference checked: Current Toolcraft canvas state, canvas viewport, image/model presentation, panel action boundary, generated product fixture, export pipeline, and the user-approved crop behavior.
- Reference inputs: The user explicitly selected an unrestricted infinite workspace, preservation of the current finite size, and export by the outer scene-element bounds.
- Docs/contracts read: `core/setup-export.md`, `core/runtime-boundary.md`, `acceptance-testing.md`, `schema-reference.md`, and the runtime decision/component contracts.
- Contract rules applied: `canvas-surface-preserved`, `controls-product-coverage`, `output-export-required`, `acceptance-product-observable`, and `infinity-canvas-scene-bounds`.
- View interaction intent: Infinity mode changes the canvas extent only; existing product `viewInteraction` and model orbit/gizmo ownership remain unchanged.
- Interaction ownership: Project Settings owns the finite/infinite mode. The canvas owns navigation across the unbounded workspace. Export actions consume canonical scene bounds without adding a second editing surface.
- Decision: Store the mode in canonical runtime state and history; retain finite dimensions while infinite; give runtime images and models explicit world frames; accept product bounds through the signed composition boundary; union only visible exportable entities; and reject empty, unavailable, or oversized scene exports with typed visible feedback.
- Alternatives rejected: Encoding Infinity as a sentinel width/height, deriving bounds from DOM pixels, always calling product bounds in finite mode, exporting the current viewport, retaining hidden/editor-only entities, and an implicit global bounds registry.
- State/output mapping: `canvas.setMode` drives settings visibility and artboard layout. Runtime image/model frames and `sceneBoundsProvider` feed one canonical resolver. Image and model compositors render the resolved scene frame at export scale; video exporters must resolve a bound over their explicit time range.
- Performance intent: ordinary-product-work
- Verification: One bare `pnpm verify:delivery` will derive and run the protected proof.
- Risks: Product-owned visual entities must provide truthful bounds through `sceneBoundsProvider`; the runtime fails closed with `scene-bounds-unavailable` instead of silently cropping them out.

### Iteration 3 — Grass controls-panel section navigation parity

- Request: "возьми механику навигации по секциям панели из этого проекта. перенеси полностью дизайн и поведение в стартер. панель появляется когда секции не влезают в высоту одного экрана"
- Task type: Shared runtime, controls-panel interaction, generated browser evidence, starter documentation, and standalone generation.
- User-visible result: Generated Toolcraft apps use the Grass section-navigation popup only while the controls body overflows its available viewport. A fitting panel cannot reveal the popup; losing overflow clears pending hover intent, and restoring overflow requires a fresh 300ms dwell.
- Source/reference checked: `/Users/kusnizza/Projects/toolcraft-apps/grass`, its generated runtime copy, the live app at `http://127.0.0.1:3003/`, canonical runtime/UI sources, and computed popup geometry and typography.
- Reference inputs: The user selected full Grass design and behavior, with navigation eligibility determined by sections not fitting within one screen height.
- Docs/contracts read: `component-rules.md`, `workflow.md`, `acceptance-testing.md`, and the runtime panel component contract.
- Contract rules applied: `panel-host-behavior`, `controls-component-layout-invariants`, `controls-layout-heuristics`, and `acceptance-product-observable`.
- Interaction ownership: The runtime controls panel owns overflow measurement, hover intent, section scroll-spy, and popup navigation. Product code supplies sections only and cannot render a duplicate navigation surface.
- Decision: Keep one runtime implementation, retain the complete Grass surface, spacing, type, scrolling, pointer corridor, timing, click, and keyboard behavior, and reset every pending popup timer when overflow disappears.
- Alternatives rejected: Copying the component into starter product code, retaining navigation state after overflow disappears, showing navigation persistently, and editing the exported Grass folder instead of the source runtime.
- State/output mapping: `scrollHeight > clientHeight + 1` makes navigation eligible; a 300ms dwell in the inner-left 12px strip mounts the runtime popup; its items map visible non-sticky sections to immediate viewport scroll positions.
- Performance intent: ordinary-product-work
- Verification: One bare `pnpm verify:delivery` will derive and run the protected proof.
- Risks: Already-exported applications retain their copied runtime until regenerated; the Grass reference remains unchanged.

### Iteration 4 — Runtime history keyboard shortcuts from focused controls

- Request: Make Undo and Redo work through standard keyboard shortcuts in generated apps.
- Task type: Shared runtime, generated keyboard interaction, contract, and standalone browser evidence.
- User-visible result: Cmd/Ctrl+Z, Cmd/Ctrl+Shift+Z, and Ctrl+Y operate Toolcraft history while focus remains on sliders, switches, checkboxes, and other non-text controls; active text editors keep native text undo.
- Source/reference checked: The runtime ToolcraftRoot shortcut listener, its unit tests, and a built standalone app where the focused Blur slider input reproduced the failure.
- Contract rules applied: `runtime-shell-required`, `interaction-surface-ownership`, `acceptance-product-observable`, and `workflow-required`.
- Interaction ownership: ToolcraftRoot owns one document-level history shortcut listener; product apps do not register duplicates.
- Decision: Classify input targets by native text-editing capability instead of treating every input as a text editor.
- Alternatives rejected: Always stealing text undo, per-control marker attributes, and app-local shortcut listeners.
- State/output mapping: Recognized shortcuts dispatch `history.undo`/`history.redo` through the runtime command bus; native text editors return before dispatch.
- Performance intent: ordinary-product-work
- Verification: One bare `pnpm verify:delivery` will derive and run the protected proof.
- Risks: Previously exported apps retain their copied runtime until regenerated; newly generated apps receive the fix through the CLI copy path.

### Iteration 5 — Blender-compatible orientation gizmo interaction

- Request: Make the orientation gizmo behave "все как в блендере": click signed points to return to axes and drag the gizmo with Blender-equivalent rotation.
- Task type: Shared runtime interaction, generated browser evidence, starter contract, and website documentation.
- User-visible result: The existing 70px Toolcraft gizmo keeps its size, colors, hover treatment, and 16px placement. Users can now drag anywhere inside its circular surface; gizmo and direct model drag share Blender factory Turntable sensitivity and pole recovery; signed-axis clicks use Blender Smooth View timing.
- Source/reference checked: Blender 4.5.2 LTS factory preferences plus the official navigation gizmo, view rotate, axis view, and smooth-view source. Factory Turntable sensitivity is 0.4 degrees per CSS pixel and Smooth View is 200ms maximum, scaled by quaternion angle.
- Contract rules applied: `canvas-handle-placement`, `interaction-surface-ownership`, `renderer-view-interaction`, `acceptance-product-observable`, `performance-coverage-levels`, and `workflow-required`.
- View interaction intent: A visible editable spatial model remains `orbit`; the runtime gizmo and visible-model hit surface consume one canonical `{ position, up }` target.
- Interaction ownership: An unmodified primary press inside the gizmo circle owns Turntable drag; a signed endpoint also owns click-to-axis; blank click is inert; outside-circle and model-miss presses remain canvas pan.
- Decision: Map Blender Z-up behavior to Toolcraft Y-up, use fixed world-up yaw plus screen-horizontal pitch with Blender's pole horizon blend, keep a 3px click/drag threshold, and use cubic smoothstep quaternion slerp with `200ms * angle / pi` duration.
- Alternatives rejected: Keeping endpoint-only sphere projection, changing only gizmo math while direct model drag remains viewport-scaled, and adopting a Three.js helper that owns a separate camera/controller.
- Licensing: This is an independent behavioral and mathematical reimplementation from documented behavior and observed source structure; no Blender GPL source code is copied.
- State/output mapping: Every drag or snap writes the canonical runtime pose under one history group and target-scoped interaction lease. Preview, hit testing, gizmo projection, reset/undo/redo, persistence, and export continue to consume that pose; stale gestures cannot write after a newer owner.
- Performance intent: ordinary-product-work
- Verification: One bare `pnpm verify:delivery` will derive and run the protected proof.
- Risks: Already-exported applications retain their copied runtime until regenerated. Browser proof relies on the runtime gizmo's canonical pose/target attributes and intentionally fails closed if the real handle is absent or ambiguous.

### Iteration 6 — Executable product-control applicability

- Request: Fix starter contracts so generated products show only settings that apply to the selected type and cannot pass delivery with a visible control that the renderer ignores.
- Task type: Shared runtime schema, controls-panel visibility, starter acceptance, protected browser evidence, generated fixtures, CLI, and documentation.
- User-visible result: Every generated product control explicitly declares `always` or `conditional` applicability. Non-matching controls disappear without losing their values, while every visible finite sibling branch must prove the control's real accepted product outcome.
- Source/reference checked: Badge behavior was used only as failure evidence; implementation scope remained the Toolcraft runtime and starter contracts. The legacy `visibleWhen` runtime path, control-section inventory, acceptance requirement derivation, reporter, and generated image/video/material fixtures were inspected.
- Contract rules applied: `controls-product-coverage`, `controls-section-inventory-required`, `controls-component-layout-invariants`, `acceptance-product-observable`, and `workflow-required`.
- Interaction ownership: The runtime owns applicability normalization and panel presence. Product schemas own explicit applicability claims. Existing product acceptance owns actions and outcomes; the applicability layer only derives the branch cases in which those outcomes must be reproved.
- Decision: Normalize explicit applicability, legacy `visibleWhen`, and omitted low-level input into one resolved model with origin metadata; reject legacy/implicit origins for product controls; combine conditional predicates with AND; derive pairwise cases from semantic section peers; preserve the authored `Background` inventory ownership after runtime relocates its product controls into `Setup`; attach case-scoped evidence only after exact presence/absence and real outcome assertions pass.
- Alternatives rejected: Extending optional `visibleWhen`, selector-owned target lists, renderer dependency inference, acceptance prose heuristics, Cartesian branch enumeration, and Badge-specific logic.
- State/output mapping: Applicability reads canonical runtime target values and changes only panel presence. Hidden values remain in runtime state, persistence, transfer, and history. Matching cases reuse the control's existing preview, rendered-pixel, artifact, command, or semantic proof.
- Performance intent: ordinary-product-work
- Verification: One bare `pnpm verify:delivery` remains the generated-app delivery authority; this runtime/template contract delivery also runs the monorepo checks required by the repository entry contract.
- Risks: Pairwise proof depends on truthful Control Section Inventory grouping; unsupported selector domains fail acceptance instead of silently skipping cases. Legacy low-level consumers remain readable but cannot satisfy generated product acceptance.

### Iteration 7 — Evidence-backed adaptive motion reference study

- Request: Make video-reference analysis detailed enough to retain brief behavior changes, choose review density from the source instead of a small fixed frame count, and keep first delivery plus later app refinement fast and contract-correct.
- Task type: Cross-cutting runtime, starter, protected delivery, CLI packaging, documentation, and generated-app lifecycle architecture.
- User-visible result: An explicitly registered motion reference is scanned across every decoded frame, reviewed through dense 12 FPS overview evidence plus retained event/focus windows, and automatically split into complete studies of at most 120 reviewed frames. Typed behavior mappings require exact automated evidence and browser `reference-parity`; a product with no registered reference performs no FFmpeg work.
- Source/reference checked: `docs/superpowers/specs/2026-08-11-video-reference-evidence-design.md`, `docs/superpowers/plans/2026-08-11-video-reference-evidence.md`, runtime decision/component contracts, `core/reference-study.md`, protected delivery planning/reporting, CLI prepack generation, proof-process execution, atomic publication leases/journals, and fresh generated standalone applications.
- Reference inputs: The neutral starter remains `referenceInputs: []` and contains no invented reference asset. Reproducible analysis begins only after a source is explicitly registered and materialized at a repository-accessible path.
- Contract rules applied: `video-reference-analysis`, `reference-clone-source-of-truth`, `acceptance-product-observable`, `performance-coverage-levels`, and `workflow-required`.
- Decision: Use one typed `referenceInputs` boundary with nested partition studies. Separate source inspection, full-frame change scanning, adaptive selection, reviewed-frame materialization, canonical evidence validation, contact-sheet creation, semantic classification, and atomic group publication. Keep focus refinements on the same study identity when segment bounds stay stable; retire the complete previous group in one source-scoped journal transaction when partition identities change.
- Publication decision: Resolve artifact, staging, and transaction roots before mutation; bind staging children to canonical study IDs; keep journal residue outside the committed artifact root; renew token-owned leases; restore the complete old group on failure; and isolate concurrent sources while serializing one source identity.
- Alternatives rejected: Fixed 13-frame sampling, single-screenshot or prose-only storyboard authority, app-local/manual evidence artifacts, partial per-study publication, implicit preprocessing during generation or delivery, legacy `videoReferenceStudy` compatibility, product-authored test selection, measured performance triggered by functional work, and a second hand-maintained framework inventory.
- State/output mapping: Registered source bytes produce canonical source/reference identity, machine evidence JSON, and a contact sheet. Typed studies classify detected events and phases; behavior mappings name `acceptanceId` plus `motionReferenceCoverage`; protected automated evidence and browser `reference-parity` prove the resulting product behavior. Exact study resource paths remain functional verification owners.
- Validation fixtures: A packaged no-reference app completed initial delivery with 435/435 Vitest tests, build, 14/14 browser scenarios, zero FFmpeg/ffprobe calls, and null performance state. A 12.000333-second, 30 FPS, 360-frame FFV1 source retained one-frame events near frames 91 and 271, produced two bounded studies with 109 and 40 reviewed frames and a 149-frame unique reviewed union, and used one full scan plus one union extraction.
- Lifecycle evidence: Reference initial delivery completed 435/435 tests, build, and 14/14 browser scenarios including real reference parity. The unchanged gate completed in 0.4 seconds without build, tests, browser, FFmpeg, or performance. A focus refinement atomically changed evidence under the same study IDs with no staging, transaction, journal, or backup residue; later delivery selected 7 affected files, 33/33 tests, build, one browser scenario, and `animation.speed` only. A separate boundary-changing fixture proved two old partition IDs are retired when two new IDs replace them.
- Verification: `pnpm starter:docs-check`, `pnpm starter:test`, `pnpm starter:typecheck`, `pnpm cli:test`, `pnpm cli:typecheck`, runtime tests/typecheck, website typecheck/docs sync, `pnpm ai:check`, `pnpm build`, packaged fallback execution, 199/199 motion-reference tests, root/staging/crash/isolation regressions, and repeated fresh packaged no-reference/reference lifecycles. Sandbox-only localhost bind failures were repeated with the exact commands outside the sandbox and passed.
- Performance intent: ordinary functional contract work. Measured performance was intentionally not run; every generated receipt kept current performance and performance baseline null.
- Risks: FFmpeg and ffprobe are required only for the explicit `reference:study` command. An undeclared chat attachment is not reproducible repository evidence and must be registered before implementation. Previously generated apps retain their copied framework until regenerated. Supported evidence is limited to the documented source/timing formats and fails closed on ambiguous timing, malformed groups, unsafe paths, or incomplete artifacts.

### Iteration 8 — Initial-only aggregate verification lifecycle

- Request: Keep complete checks after the first product build, but make every later ordinary edit use only the tests for the functionality being changed instead of rerunning delivery, export, browser, or performance matrices.
- Task type: Starter lifecycle, protected receipts, CLI generation, runtime policy, contract documentation, and generated-app workflow.
- User-visible result: A generated app still receives one complete functional proof before its first delivery. After that receipt exists, ordinary edits finish with directly relevant unit/component and browser checks; a repeated bare delivery command exits before inventory, integrity, planning, build, tests, export, browser, or checkpoint writes.
- Source/reference checked: The previous functional-targeted delivery implementation, protected lifecycle/plan/receipt/checkpoint modules, CLI generated-product fixtures, documentation mirrors, and a freshly generated standalone product exercised through its initial build and one later material edit.
- Reference inputs: None. This is a workflow contract change derived from the user's explicit development-lifecycle requirements.
- Docs/contracts read: `workflow.md`, `acceptance-testing.md`, `core/performance.md`, `performance.md`, the root and generated `AGENTS.md`, and runtime performance verification policy.
- Contract rules applied: `workflow-required`, `acceptance-product-observable`, and `performance-coverage-levels`.
- View interaction intent: Unchanged. Verification phase selection does not alter a product's typed `viewInteraction` or renderer behavior.
- Interaction ownership: Unchanged. Product surfaces retain their existing owners; focused checks observe the edited product behavior without creating a second interaction surface.
- Decision: Treat the immutable initial delivery receipt as the phase boundary. Keep only two executable protected delivery plans: complete initial functional proof and exact request-authorized targeted performance. Delete later-functional semantic diff, verification-impact inventory, changed-file ownership resolution, and browser-impact selection instead of retaining dormant compatibility paths.
- Alternatives rejected: Repeating full delivery after every edit, an automatic later-functional aggregate gate, a new `verify:change` command, filename-based test inference, measured performance inferred from touched renderer files, and legacy receipt/impact compatibility branches.
- State/output mapping: Initial proof writes the durable delivery receipt once. Targeted performance updates only targeted performance history; full audit updates only the independent baseline. Ordinary later edits do not read current source inventory or mutate any checkpoint.
- Performance intent: ordinary-product-work
- Verification: The real generated-app lifecycle completed one full initial proof, then one exact material test and a byte-for-byte checkpoint-preserving delivery no-op. Starter tests passed 686/686 script tests and 420/420 Vitest tests; CLI passed 93 tests with three Windows-only skips; starter, CLI, runtime, website, docs, code health, and production build checks passed.
- Risks: Previously generated apps keep their copied version-1 lifecycle until regenerated or migrated. Focused later checks are intentionally selected by the agent from the edited behavior and do not mint aggregate functional evidence.

### Iteration 9 — Semantic focused feature verification

- Request: Keep later app edits fast while verifying that a change did not break semantically related behavior, and measure the effect on a real generated app.
- Task type: Starter/CLI workflow command, acceptance selection, Playwright orchestration, generated-app fixture, documentation, and verification.
- User-visible result: Later edits now run one exact unit/component test plus `pnpm test:feature -- <acceptance-id>`. A leaf behavior stays one browser scenario; a finite selector automatically expands to the acceptance peers required by current applicability semantics. Explicit `--all` remains product-only. No build, delivery, export matrix, framework self-test, or measured performance is added.
- Source/reference checked: Current acceptance applicability derivation, runtime evidence reporter, exact Playwright title resolver, protected delivery process, generated material fixture, and a fresh standalone lifecycle with a selector edit after initial delivery.
- Reference inputs: None. This is workflow behavior derived from the user's explicit later-edit speed and safety requirements.
- Docs/contracts read: `workflow.md`, `acceptance-testing.md`, `agent-worklog.md`, root/generated `AGENTS.md`, and the semantic focused verification design and implementation plan.
- Contract rules applied: `workflow-required`, `acceptance-product-observable`, `controls-component-layout-invariants`, and `performance-coverage-levels`.
- View interaction intent: Unchanged. The command selects product acceptance and does not alter renderer view ownership.
- Interaction ownership: Unchanged. Existing product controls and canvas operations remain their own interaction authorities.
- Decision: Start from explicit agent-authored acceptance IDs and compute a fixed-point closure through the canonical control applicability cases. Load current TypeScript app semantics through a strict Playwright reporter, validate a versioned JSON plan, resolve exact test titles, and run one worker against the current-source development server. Keep the existing runtime evidence reporter as the only outcome authority. Reuse a previous targeted-performance report only when its source hash equals the current source hash, so ordinary edits cannot create a false consecutive-performance comparison.
- Alternatives rejected: Repeating complete delivery, restoring changed-file impact inference, selecting tests from filenames, using stale production preview without rebuilding, adding a build to each later edit, silently falling back to all browser tests, and weakening branch/layout evidence.
- State/output mapping: The command reads current acceptance/schema/inventory, prints the selected IDs and browser scenarios, and produces ordinary test output only. It removes inherited delivery/performance authority and never reads or writes the protected checkpoint. The real lifecycle proved the initial checkpoint remained byte-for-byte unchanged.
- Performance intent: ordinary-product-work. No measured performance path or full audit was authorized or executed.
- Verification: Selector 6/6, plan codec 4/4, reporter 6/6, runner 5/5, starter scripts 697/697, starter Vitest 427/427, CLI 94 passed with three Windows-only skips, runtime 2144/2144, typechecks, docs sync, and the production build passed. The real fresh generated lifecycle selected six material control scenarios from `material.layer`, excluded material export and unrelated domains, used no later build, and preserved the initial checkpoint byte-for-byte. A direct one-scenario focused run took 21.08 s while installing the missing Playwright browser once, then 7.80 s warm; the browser phase itself reported 6.1 s on the warm run. No measured performance ran. The final thermo-nuclear pass also proved that same-source performance reports remain comparable while a changed source resets comparison to `none`.
- Risks: Previously generated apps keep their copied workflow until regenerated or deliberately migrated. A selector may legitimately select several browser scenarios when its entity contract declares multiple controls as semantic peers; this bounded cost is visible in command output.

### Iteration 10 — Structural redundant-control-label guards

- Request: Prevent generated applications from shipping useless visible labels, using the Dispersion `Spectrum` section and its `Color 1` through `Color 4` fields as failure evidence; change only the starter contract, not Dispersion.
- Task type: Focused starter acceptance-contract and documentation correction.
- User-visible result: Generated product schemas now fail acceptance when multiple sibling colors use sequential `Color N` labels or when a separately rendered field label repeats its section title. Useful role labels such as `Fill` and `Stroke` remain valid, and tabs retain a matching accessibility name without rendering duplicate text.
- Source/reference checked: The supplied Dispersion screenshot, its schema/worklog/browser receipt as read-only diagnostic evidence, `core/layout.md`, the copied starter acceptance validator, runtime label rendering, and existing control-label regression tests.
- Reference inputs: The screenshot is diagnostic evidence only. `/Users/kusnizza/Projects/toolcraft-apps/dispersion` remains outside the implementation scope and is unchanged.
- Contract rules applied: `controls-component-layout-invariants`, `controls-layout-heuristics`, and `workflow-required`.
- Root cause: Sequential labels were rejected only after vocabulary-based palette detection. `Spectrum` and `dispersion.customColorA` through `customColorD` did not match that vocabulary, so the invariant returned no errors. Duplicate section-title labels were checked only for switch/checkbox controls.
- Decision: Make `Color N` rejection depend only on multiple sibling color controls. Move section-title equality into the canonical general label policy, exclude tabs because their label is accessibility-only, and remove the switch-specific duplicate branch so one invariant owns the behavior.
- Alternatives rejected: Editing Dispersion, adding `Spectrum` or `customColor` to vocabulary lists, silently hiding invalid labels at runtime, introducing `labelIntent`, and retaining duplicate switch/general diagnostics.
- State/output mapping: Acceptance reads resolved app-authored control sections and emits blocking schema diagnostics before product delivery. Runtime state, rendering, controls, and generated applications are not mutated by this correction.
- Performance intent: ordinary-product-work. This validation-only edit adds no runtime workload and authorizes no measurement.
- Verification: The two focused label suites passed 13/13 tests; the complete starter app slice passed 430/430 tests; starter typecheck and local docs check passed.
- Risks: Previously generated applications retain their copied validator until regenerated or deliberately migrated.

### Iteration 11 — Canonical control values and selected-entity isolation

- Request: Prevent the Logos Grid class of failure where a color edit does not reach the selected object; strengthen only the Toolcraft runtime/starter contract and leave Logos Grid unchanged.
- Task type: Shared runtime value lifecycle, starter acceptance, protected browser evidence, contracts, docs, and generated propagation. No measured performance.
- User-visible result: Built-in controls now commit one canonical value representation at every state ingress. Selected-object property controls cannot pass acceptance unless two real product entities prove bidirectional pixel isolation and correct control rebinding.
- Source/reference checked: `/Users/kusnizza/Projects/toolcraft-apps/logos-grid` logs and source as read-only diagnostic evidence; runtime Color adapter, reducers, state creation, persistence/settings restoration, timeline keyframes, interaction ownership, Layers coverage, browser proof sessions, and generated-app integrity boundaries.
- Reference inputs: Logos Grid supplied diagnostic context only; no motion reference. Logos Grid and other generated application snapshots remain unchanged.
- Docs/contracts read: Runtime component and decision contracts; `schema-reference.md`; `component-rules.md`; `acceptance-testing.md`; root and generated `AGENTS.md`.
- Contract rules applied: `controls-product-coverage`, `interaction-surface-ownership`, `layers-enabled-behavior`, `acceptance-product-observable`, `persistence-policy-explicit`, and `workflow-required`.
- Root cause: Color UI emits `{ hex }`, while the old normalizer accepted both that payload and a string without canonicalizing them; initial/live/timeline paths did not share one schema codec. Existing whole-output selection evidence could also pass when a global or wrong entity changed.
- Decision: Use one exhaustive built-in codec registry and one schema-aware ingress policy for defaults, seeds, live commands, persistence, settings, and keyframes. Make property scope explicitly global or selected-entity and reuse one protected two-entity raster recipe for app-owned and `selectedLayer.*` properties.
- Alternatives rejected: Product-specific Color parsing, editing Logos Grid, a Color-only reducer branch, whole-canvas/signature evidence, one-direction selection tests, and separate layer/app selection algorithms.
- State/output mapping: Canonical decoded values enter runtime state/history/persistence/timeline before product consumers read them. Selected-entity ownership links the property target to its selection operation; protected actions select A/B on the declared surface and bounded pixel probes prove only the selected entity changes.
- Performance intent: ordinary-product-work. The request concerns functional integrity and supplies no performance authority.
- Verification: Focused runtime codec/state/Color/timeline tests, starter selection validator tests, protected Canvas/Panel provenance tests, bidirectional isolation, and adversarial cross-entity mutation rejection are required before the combined functional checks and thermo-nuclear review.
- Risks: Existing generated apps receive the corrected runtime and signed acceptance helpers only after regeneration or deliberate framework refresh. Custom product renderers must consume the canonical model and provide stable, non-overlapping entity probes for selected-entity proof.

### Iteration 12 — Infinity canvas scene continuity verification

- User-visible result: Finite → Infinity → finite now removes and restores only the artboard boundary; world position, camera offset/zoom, product/media/model nodes, custom-renderer CSS/backing, provider resources, and visible pixels do not jump or reset.
- Root-cause evidence: Finite and Infinity previously used different child-box origins, scene subtree shapes, product/media frames, and camera restoration behavior. Final VGPU diagnosis also found a background-only selector scheduling one paused frame and presentation-local frame counters resetting after resource retirement; those seams now preserve exact transition and teardown evidence.
- Decisions: Keep one centered zero-area world origin and one stable scene/product subtree. `sceneBoundsProvider` supplies the same live product rect in both modes, VGPU remains the single pinned preview/export provider, and canvas mode cannot fork renderer geometry or ownership.
- Image/export geometry: Decoded source pixels live in `sourceSize`, world presentation lives in the canonical scene-element frame, and every ingress normalizes once. Finite export clips that unchanged scene through the artboard; Infinity export outward-rounds the visible product/image/model contributor union while custom raster export presents through the same provider frame.
- Alternatives rejected: Renderer or scene remounts, camera-offset compensation, a dormant finite backing used as Infinity geometry, mode-specific image/model placement, DOM-derived bounds, and a second provider/export path.
- Evidence: Focused runtime/image/model/export suites, generated compile and VGPU lifecycle tests, and protected browser observations proved stable DOM identity, camera, rects, backing, allocations, operations, pixels, finite restoration, Infinity progress, and resource teardown. The required monorepo checks passed; website typecheck also passed from clean committed HEAD while unrelated local docs drift remained untouched.
- Generated proof record: The canonical compatibility runner enabled exact `vgpu@0.3.1` and `@vgpu/wgsl@0.3.1`, validated both WGSL shaders, and validated a version-8 protected initial-delivery checkpoint containing build, all required product tests, and all seven required VGPU scenarios; its complete browser run passed 15/15, including `browser vgpu: Infinity scene bounds` and teardown.
- Risks: Previously generated apps require regeneration to receive the canonical scene and image model. Future provider releases must pass the same pinned compatibility promotion path; custom renderers remain responsible for truthful mode-invariant scene bounds.

### Iteration 13 — Exhaustive finite-selector roles and bounded feature closure

- Request: Keep the fast post-delivery feature loop, but stop ordinary finite parameters from expanding unrelated control proof while preserving complete checks for selectors that genuinely change product branches.
- Task type: Starter acceptance semantics, focused feature selection, runtime contracts, CLI document guards, generated documentation, and worklog authority. No measured performance.
- User-visible result: Every bounded finite product selector now declares one explicit `branch` or `parameter` role. Parameters prove only their own accepted outcome and option coverage; branches re-prove only exact declared always-visible peers plus dependents already named by `applicability` predicates.
- Root cause: The previous contract treated every finite sibling selector as a proof branch. That protected missing predicates but made ordinary choices such as format or character fan out across unrelated controls. The first implementation narrowed the executable graph, while review found stale all-sibling wording in runtime contracts, negative CLI guards, and the Slider website page.
- Source/reference checked: The finite-selector inventory validator and dependency index, applicability-case derivation, version-2 feature selection, runtime decision/component contracts, generated docs assertions, starter/website schema examples, and Slider decision rules. No external reference input applies.
- Contract rules applied: `controls-product-coverage`, `controls-section-inventory-required`, `acceptance-product-observable`, and `workflow-required`.
- Decision: Require exhaustive `finiteSelectors` classification with no default or inference. A `branch` lists only exact always-visible same-entity peers in `affectedTargets`; explicit predicates add their dependents automatically and force their owners to be branches. A `parameter` adds no peer edge. Continuous controls remain outside the inventory, and an empty inventory remains explicit.
- Alternatives rejected: Target-name exceptions, control-type defaults, optional selector roles, duplicating predicate dependents in `affectedTargets`, runtime Setup fallback, and section-wide finite-selector fanout.
- State/output mapping: The inventory validator fails malformed or incomplete role declarations. One canonical dependency index feeds both applicability cases and focused feature closure, so browser selection follows the same branch/predicate graph that acceptance proves.
- Performance intent: ordinary-product-work. The change narrows functional selection and does not authorize benchmarks or measured performance.
- Verification: Runtime contract suites passed 202/202 and runtime/CLI typechecks passed. Starter docs and website component-doc checks passed; the starter/website schema examples are byte-identical. CLI docs-guard tests passed 6/6, and the named generated-app test passed the new selector guards before reaching the unchanged historical `Generated receipt` wording conflict in Iteration 12.
- Risks: Previously generated apps retain copied all-sibling guidance until regenerated or deliberately migrated. A branch can still select multiple scenarios by design, but only through explicit affected peers and predicates visible in the inventory.

### Iteration 14 — Focused browser authority and bounded post-delivery proof

- User-visible result: After the initial delivery, `test:feature` runs one exact selected browser scenario without global catalog work while rejecting timeout, loader, proxy, callback, external-package, config, and reporter paths that could bypass protected evidence.
- Source and contract checked: The version-2 feature plan, product-test facade, Playwright authority inventory, canonical local dependency graph and TypeScript alias resolver, proof-process deadline/cleanup authority, integrity manifest, generated demand-only lifecycle, and the post-first-delivery workflow in `AGENTS.md`.
- Decision: Keep the exact acceptance `{file,testName,budget}` plan as the only focused execution authority. Inspection creates one immutable preflight snapshot containing the signed manifest bytes, digest, parsed authority and domain; present/absent receipts for the runtime/UI domain markers and every Vite/Playwright config candidate; Node search/scope directory membership; package contents, manifests, real paths, and resolution decisions. Seal creation consumes that snapshot and may only compare current filesystem state with it, never establish a later baseline. Revalidate the resulting seal immediately before source loading, after source-plan loading, and again before Playwright spawn; then validate the selected browser closure and revalidate it at the same execution boundary. The signed `starter` and `generated` manifest domains are distinct: starter authority is bound to its exact package and absent copied-runtime markers, while generated authority requires present runtime evidence and the canonical protected trust-root coverage. Presence and absence are both authority, so restoring a hidden runtime, adding a higher-precedence config, or introducing a resolvable package cannot change the domain between stages. Inspect strict Playwright and reporter dependencies through local relays, preserve intrinsic and higher-order provenance through aliases and callback arguments, reject unresolved loading throughout every traversed external executable package, and resolve containment by path segments rather than string prefixes.
- Superseded design: Iteration 9 established the fast-loop intent, but its path-only facade seal and permissive unresolved-module behavior are no longer current. The present runner binds the full inspected execution closure and uses the canonical graph instead of e2e filename or package-name heuristics.
- Alternatives rejected: Playwright title grep, whole-suite collection, arbitrary external modules treated as safe, package allowlists, repo-path heuristics, mutable config trust, unbounded Chromium installation, and separate Proxy/Reflect or callback exception paths.
- State/output mapping: The isolated current-source loader produces the canonical plan; authority validation maps its selected files to one graph, one inspected external boundary, and one byte seal. The protected facade applies plan budgets before fixtures, the reporter accepts only selected plan rows, and the proof process owns wall deadlines and descendant cleanup.
- Verification: Focused Playwright authority, config/preflight authority, runner, resolver, source-loader, and proof-process suites passed 83/83 in 2.7 seconds; the exact three-file CLI gate passed 19/19; CLI and starter typechecks, `pnpm starter:docs-check`, and `pnpm ai:check` passed. `pnpm --dir starter test:feature -- persistence.reload` passed its exact browser scenario 1/1, including mandatory signed preflight and pre-spawn snapshot revalidation, and `node --test cli/src/generate-demand-only-lifecycle.test.mjs` passed 1/1 in 139 seconds. Measured performance was not run because this is a functional post-delivery loop.
- Risks: Third-party runtime helpers must remain statically resolvable and inspectable inside the project dependency boundary. Previously generated apps require regeneration to receive this authority model, and future Playwright config executable fields must be added through the same canonical resolver and signed trust boundary.

## Decisions

### Iteration 15 — Robot transform animation and media export

- User-visible result: The controls panel now keyframes whole-model X/Y/Z translation, X/Y/Z rotation, and uniform scale alongside pitch/roll/yaw. Camera distance, field of view, and target height remain directly editable.
- Export result: PNG/JPEG still output supports 2K/4K/8K, MP4/WebM supports current or 4K output, and the custom GIF action encodes the evaluated timeline at 480 px and 8 fps for responsive browser-only output.
- Renderer decision: Preview, typed Toolcraft export, and GIF export share one retained Three.js surface and one value-application function, so transforms, camera, link origins, limits, and keyframes cannot diverge between preview and output.
- Source package decision: Folder bytes remain transient and are validated recursively; the bundled `public/head` package remains the default after reload.
- Verification intent: Typecheck, Toolcraft code-health check, production build, and browser interaction checks cover the added controls, timeline, and export actions.

### Renderer

- Decision: No product renderer yet.
- Reason: The starter is intentionally neutral.
- Evidence: No `canvasContent` product renderer is declared. The neutral composition still declares `modelPresentation: { mode: "runtime" }` so future model uploads have one standard owner until a product explicitly declares checked custom consumers.

### Timeline

- Decision: No timeline yet.
- Reason: The starter has no product animation behavior.
- Evidence: `panels.timeline` is omitted.

### Layers

- Decision: No layers yet.
- Reason: The starter has no layer workflow.
- Evidence: `panels.layers` is omitted.

### Controls

- Decision: No product controls yet.
- Reason: Controls are added only after the requested product behavior is known.
- Evidence: The starter schema exposes no product control sections.

### View Interaction

- Decision: No spatial product view yet.
- Reason: The neutral starter has no visible three-dimensional scene or model.
- Evidence: Product readiness remains in starter mode; product apps must declare typed `viewInteraction` before controls or renderer code.

### Interaction Ownership

- Decision: No product interaction surfaces yet.
- Reason: The neutral starter has no canvas handles or product controls to compare.
- Evidence: Product apps must declare typed `interactionOwnership` before implementing controls or canvas interactions.

### Export

- Decision: No product export yet.
- Reason: Export actions are added when the app has product output.
- Evidence: No sticky product `panelActions` are declared.

### Performance

- Decision: No product performance workload yet.
- Reason: Performance scenarios depend on renderer and control workload.
- Evidence: The starter performance matrix is a neutral baseline.

## Evidence

- Source reviewed: neutral starter schema and local Toolcraft docs.
- Contract applied: starter baseline remains neutral until product behavior exists; `model-appearance-presentation` keeps package import, appearance leases, model canvas output, gizmo pose, and export ownership explicit.

## Verification

Protected receipts own changed files, the derived plan, commands, selectors, reports, measurements, and pass/fail evidence. Decision Trail iterations record only one bare `pnpm verify:delivery` narrative.

## Risks

- Risk: This template must be replaced with product-specific decisions before final delivery.
- Risk: A product that selects custom model presentation must mount every declared checked consumer; otherwise runtime reports typed retryable presentation feedback and suppresses only that declared target.

### Iteration — Head2 三轴旋转中心
- Request: 在 Head2 控制面板中为 Pitch、Roll、Yaw 分别增加可自定义的三维旋转中心，并用不同颜色标注。
- Task type: Product renderer adaptation, schema controls, model-specific kinematics, and focused verification.
- User-visible result: 选择 Head2 后显示九个 X/Y/Z 中心滑块；红、绿、蓝辅助标记分别跟随 Pitch、Roll、Yaw，修改中心后关节围绕新中心旋转，Head1 保持原有参数区。
- Source/reference checked: `public/head2/urdf/head.urdf`、Head2 mesh package、现有 model profile、URDF loader joint hierarchy，以及 Toolcraft section-inventory and applicability contracts。
- Docs/contracts read: `docs/toolcraft/schema-reference.md`、`docs/toolcraft/core/control-selection.md`、acceptance section-inventory and selector validators。
- Contract rules applied: Head2 controls are conditional on `model.variant`; each product section has a stable inventory entry and explicit finite-selector role; markers are preview-only and hidden during export.
- View interaction intent: Colored center markers provide direct spatial feedback while the existing orientation gizmo remains the camera interaction owner.
- Interaction ownership: Numeric center values belong to the controls panel; marker rendering and joint motion belong to the retained Three.js canvas.
- Decision: Keep the URDF hierarchy intact, move each Head2 joint to the requested center, compensate its direct child link at zero pose, then apply the joint angle so geometry does not jump when centers change.
- Alternatives rejected: Rebuilding the URDF for every slider update, changing mesh vertices, or using DOM overlays that would drift from the rendered model and export surface.
- State/output mapping: `geometry.head2*Center{X,Y,Z}` values flow through canonical Toolcraft state into joint transforms and marker positions; export evaluates the same values and suppresses markers.
- Performance intent: ordinary-product-work; center edits update retained transforms and do not reload meshes.
- Verification: Head2 renderer unit tests cover independent center reads, zero-pose continuity, and rotation around a custom center; TypeScript check passes. Browser smoke verification was limited by the local Playwright/Chromium setup and remains a residual risk.
- Risks: Uploaded custom URDF packages still need the profile's `pitch`/`roll`/`yaw` joint names for Head2 center editing; unusual joint hierarchies may require an explicit child-link mapping.

### Iteration — 内嵌 head1/head2 机械结构适配
- Request: 直接内嵌 head1 和 head2，在控制面板切换，并让三轴参数按各自机械结构生效。
- User-visible result: 新增 Head 1 / Head 2 内置模型选择；head2 资源完整内嵌到 `public/head2`。渲染器通过模型配置档绑定 `pitch/roll/yaw` 关节、head2 原点 Z 与限位，并修正 pitch 轴方向；切换模型会重新载入对应 URDF。
- Decision: 保留 Pitch/Roll/Yaw 的统一动作目标与时间轴，使用 profile 映射解决不同 URDF 关节命名和机械轴向差异。
- Verification: `node_modules/.bin/tsc --noEmit --pretty false` 通过。Vite/pnpm 构建受环境的 pnpm ignored build scripts（esbuild）阻塞，未修改应用逻辑。
- Risks: 上传自定义 URDF 仍需使用 axis1/axis2/axis3 命名才能沿用 head1 参数档；后续可增加上传包自动识别与参数档编辑。

### Iteration — 60 秒连续交互与自然动作修正
- Request: “目前只有roll且静止不动”；“太机械化了，能不能再灵动一点，像真人一些”。延续单参数生成、三轴联动、参考常见测试动作并连续播放的要求。
- Task type: Existing product behavior and timeline authoring; focused functional checks only.
- User-visible result: 三自由度动作内增加表现幅度和生成完整演示；一键替换时间轴、生成三条轨道并播放 60 秒，结束回正。摄像头关闭时姿态读数显示当前动画角度。
- Source/reference checked: 原参考视频与已提取画面/转录、settings-transfer.ts、runtime timeline commands/evaluator、Head1/Head2 model profiles、当前浏览器旧 Roll 轨道。
- Reference inputs: C:/Users/geneliu/Desktop/视频/完整版.mp4；前 5:38 的交互动作分析以及后半段每 20 秒接触表用于动作类别与结构讨论；未声称逐帧复现。额外裁出 02:44–02:51 原视频片段尝试保护的 motion-reference preprocessing。
- Docs/contracts read: workflow; core timeline-animation, reference-study, control-selection, layout, performance; schema-reference; component-rules; decision-contract; acceptance-testing.
- Contract rules applied: app-owned commands, evaluated timeline values, built-in actions/slider, runtime playback/export ownership; no signed runtime edits.
- View interaction intent: 保留当前模型与相机视角，使用现有轨道和画布检查姿态。
- Interaction ownership: 面板生成完整动作；顶部时间轴负责播放、暂停、定位和重播。
- Decision: Settings Import does not restore keyframeGroups. Generate through supported timeline commands instead. Clear stale tracks, keep fixed mechanical settings, write independent Pitch/Roll/Yaw timing, stop at 60s. Clear selected keyframe after generation so arrow keys scrub rather than edit the final key.
- Animation Intent Inventory: Timeline-keyframes; 14 interaction phases across 60 seconds; one-shot playback, optional existing loop; same evaluated values drive preview and existing export.
- Naturalness decision: Shape-preserving Hermite tangents encoded as per-segment Bézier easing carry velocity through intermediate poses. Reduce extreme tilts/shakes, use unequal nods, stagger axes, soften happy greeting and preserve small listening/sadness adjustments. Motion is authored animation, not captured human biomechanics.
- Alternatives rejected: Imported settings pretending to restore animation, renderer-local autoplay, duplicated transport, synchronous sinusoidal axis oscillation, whole-base translation.
- State/output mapping: motion.demoIntensity scales generated radian angles; motion.demo dispatches timeline commands; motion.pitch/roll/yaw are evaluated by the existing renderer. Model, geometry, limits, camera remain fixed during the take.
- Performance intent: ordinary-product-work. Fixed key count, retained renderer unchanged; no measured performance run.
- Verification: Focused sequence tests cover stale-track replacement, three animated axes, limits, every chapter, intensity, neutral finish, idempotence, and velocity continuity. TypeScript passes. In-app browser verified three rows, changed head pixels, playing time, and automatic stop at 60s. Protected feature runner is blocked before execution by pre-existing playwright.config.ts signed-authority mismatch; separate focused Playwright scenarios are being diagnosed without altering protected config.
- Risks: The protected reference-study command fails on this Windows environment: full-video inspection capture limit, seven-second contact sheet ENAMETOOLONG, two-second publication directory rename EPERM. No generated reference evidence or reference-parity claim is fabricated. Settings export still does not include full keyframe tracks; locally persisted timeline and the built-in generator are the replay path. Current joint limits can clamp generated gestures if the user narrows them.
- Final focused verification: 4 sequence unit tests pass; TypeScript passes; in-app browser shows changing three-axis readouts/model output, neutral finish at 60s, and no console errors. Standalone Playwright scenarios still exceed their 30-second budget in browser interactions/raster capture; automated browser acceptance is not claimed as passed. Protected feature runner also remains blocked by its existing signed-config mismatch.
