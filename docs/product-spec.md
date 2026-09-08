# Robot Head Motion Studio — Product Spec

## Goal

Create a Toolcraft-based editor for a three-degree-of-freedom robot head. The product loads the supplied ROS `head` package by default, accepts a complete URDF folder (not a single GLB), previews pitch/roll/yaw motion, and uses Toolcraft keyframes for motion authoring, playback, persistence, settings transfer, and media export.

## Inputs

- Default source: the user-provided `head` package copied under `public/head`.
- Imported source: one browser-selected folder containing one `.urdf` document and all referenced mesh files.
- Required mesh references: relative paths and `package://` URLs must resolve inside the selected folder.

## Controls

- Source package: custom `urdfFolder` control rendered with Toolcraft's public `Button`, backed by the browser directory picker and recursive package validation.
- Pitch (`axis1`): -35° to 35°.
- Roll (`axis2`): -30° to 30°.
- Yaw (`axis3`): -95° to 95°.
- View orbit: azimuth/elevation control for inspecting the robot head.
- Camera: distance, field of view, and target height.
- Whole-model transform: X/Y/Z translation, X/Y/Z Euler rotation in degrees, and uniform scale. These values are keyframeable independently of the three URDF joints.
- Link lengths: direct controls for the Z component of the three movable joint origins (`0.028`, `0.048`, and `0.082` m by default).
- Joint limits: paired lower/upper controls for pitch, roll, and yaw in radians. Editing a range updates the live URDF joint limits and clamps the previewed pose.

## Animation intent inventory

- Authoring mode: Toolcraft keyframe timeline.
- Animated values: pitch, roll, yaw, model translation, model rotation, and uniform scale.
- Default duration: 4 seconds.
- Preview: timeline playback evaluates keyframes continuously and applies them through `URDFRobot.setJointValue`.
- Save: Toolcraft local persistence and settings transfer retain joint values, keyframes, canvas, and panel workspace.

## Export

- Still images: PNG and JPEG at 2K, 4K, or 8K via Toolcraft's typed image exporter.
- Video: MP4 or WebM at the current viewport size or 4K via Toolcraft's typed timeline video exporter.
- GIF: animated GIF at 480-pixel width and 8 fps via the product renderer, covering the current timeline duration. This keeps browser-only encoding responsive while preserving a shareable preview.
- Exported frames use the same evaluated keyframes, robot transform, joint limits, link lengths, and camera values as the live preview.

## Renderer

- `gkjohnson/urdf-loaders` parses the URDF and Three.js renders the retained scene.
- The renderer fits arbitrary valid packages to the viewport and keeps a stable WebGL renderer while controls and timeline update joint transforms.
- The selected folder's bytes remain transient browser-session data; persisted state stores only its serializable manifest. The bundled default is restored after a page reload unless the folder is selected again.

## Error handling

- Reject folders without a `.urdf` file.
- Report unresolved mesh paths and parser/network failures in the canvas.
- Revoke object URLs whenever a different folder replaces the active package.

## Verification tier

Tier 4 first delivery: typecheck, production build, Toolcraft delivery verification, and browser verification of default loading, folder selection, all three joints, timeline playback, and persistence.
