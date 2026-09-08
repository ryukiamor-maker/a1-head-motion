# Implementation Plan

1. Add the official `urdf-loader` package and copy the supplied ROS package to `public/head`.
2. Declare the Toolcraft schema: source package, three keyframeable joint sliders, whole-model translation/rotation/uniform scale, editable joint-origin Z lengths, editable lower/upper joint limits, camera controls, keyframe timeline, persistence, and settings transfer.
3. Implement a transient URDF source store and a custom Toolcraft `FileDrop` renderer that accepts complete folders.
4. Implement a retained Three.js + `URDFLoader` product canvas using evaluated timeline values.
5. Connect the retained renderer to Toolcraft's frame export contract for PNG/JPEG and MP4/WebM, and add a GIF encoder that evaluates the same timeline state.
6. Declare renderer/performance/readiness metadata and update the Toolcraft worklog.
7. Install once, run Toolcraft checks, typecheck/build, delivery verification, and browser acceptance tests.

## Custom-control visual ownership

The `urdfFolder` control introduces no decorative geometry. Toolcraft's public `Button` primitive owns the folder and restore actions, including focus and disabled states. Product CSS only arranges the two actions and a concise package/status line. The custom interaction is required because the built-in `fileDrop` does not request a directory handle or recursively enumerate a ROS package.

## Fallback note

The installed Toolcraft skill set does not include separate `brainstorming` or `writing-plans` skills. This plan follows the signed local Toolcraft documentation fallback. The published `@pixel-point/toolcraft@0.0.20 create` command was attempted but currently fails because its CLI package omits `cross-spawn`; the official repository starter at the same revision is used as the base.
