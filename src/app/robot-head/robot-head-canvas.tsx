"use client";

import * as React from "react";
import * as THREE from "three";
import URDFLoader, { type URDFRobot } from "urdf-loader";

import {
  useToolcraftDispatch,
  useToolcraftEvaluatedValues,
  useToolcraftProductSceneFrame,
  useToolcraftTheme,
} from "@/toolcraft/runtime/react";

import styles from "./robot-head-canvas.module.css";
import {
  applyRobotHeadValues,
  getRobotHeadJointCenters,
  registerRobotHeadSurface,
  updateRobotHeadLiveValues,
} from "./robot-head-renderer";
import { getRobotModelProfile } from "./model-profiles";
import {
  getUrdfSource,
  resolveUploadedUrdfUrl,
  subscribeUrdfSource,
} from "./urdf-source-store";

function disposeObject(root: THREE.Object3D): void {
  root.traverse((object) => {
    const mesh = object as THREE.Mesh;
    mesh.geometry?.dispose?.();
    const materials = Array.isArray(mesh.material) ? mesh.material : mesh.material ? [mesh.material] : [];
    materials.forEach((material) => material.dispose());
  });
}

type RotationCenterMarker = {
  centerIndex: number;
  group: THREE.Group;
  jointName: string;
};

const markerAxes = [
  new THREE.Vector3(0, 1, 0),
  new THREE.Vector3(1, 0, 0),
  new THREE.Vector3(0, 0, 1),
] as const;
const markerColors = [0xef4444, 0x22c55e, 0x3b82f6] as const;

function createRotationCenterMarker(
  color: number,
  axis: THREE.Vector3,
  centerIndex: number,
  jointName: string,
): RotationCenterMarker {
  const group = new THREE.Group();
  group.name = `rotation-center-${jointName}`;
  group.userData.rotationCenterMarker = true;

  const material = new THREE.MeshBasicMaterial({
    color,
    depthTest: false,
    depthWrite: false,
    toneMapped: false,
  });
  const center = new THREE.Mesh(new THREE.SphereGeometry(0.005, 18, 12), material);
  const ring = new THREE.Mesh(new THREE.TorusGeometry(0.014, 0.0015, 8, 32), material);
  const axisLine = new THREE.Mesh(new THREE.CylinderGeometry(0.0015, 0.0015, 0.045, 10), material);
  const zAxis = new THREE.Vector3(0, 0, 1);
  const yAxis = new THREE.Vector3(0, 1, 0);
  ring.quaternion.setFromUnitVectors(zAxis, axis);
  axisLine.quaternion.setFromUnitVectors(yAxis, axis);
  [center, ring, axisLine].forEach((mesh) => {
    mesh.renderOrder = 20;
    group.add(mesh);
  });
  return { centerIndex, group, jointName };
}

function createRotationCenterMarkers(robot: URDFRobot): RotationCenterMarker[] {
  const profile = getRobotModelProfile("head2");
  return profile.jointNames.flatMap((jointName, index) => {
    const joint = robot.joints[jointName];
    if (!joint?.parent) return [];
    const marker = createRotationCenterMarker(
      markerColors[index],
      markerAxes[index],
      index,
      jointName,
    );
    joint.parent.add(marker.group);
    return [marker];
  });
}

function updateRotationCenterMarkers(
  robot: URDFRobot | null,
  markers: RotationCenterMarker[],
  values: Record<string, unknown>,
  visible: boolean,
): void {
  const profile = getRobotModelProfile(values["model.variant"]);
  const centers = getRobotHeadJointCenters(values);
  markers.forEach((marker) => {
    const joint = robot?.joints[marker.jointName];
    marker.group.visible = visible && profile.id === "head2" && Boolean(joint);
    if (joint) marker.group.position.copy(centers[marker.centerIndex]);
  });
}

export function RobotHeadCanvas(): React.JSX.Element | null {
  const frame = useToolcraftProductSceneFrame();
  const dispatch = useToolcraftDispatch();
  const { resolvedTheme } = useToolcraftTheme();
  const values = useToolcraftEvaluatedValues();
  const source = React.useSyncExternalStore(subscribeUrdfSource, getUrdfSource, getUrdfSource);
  const hostRef = React.useRef<HTMLDivElement>(null);
  const robotRef = React.useRef<URDFRobot | null>(null);
  const sceneRef = React.useRef<THREE.Scene | null>(null);
  const cameraRef = React.useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = React.useRef<THREE.WebGLRenderer | null>(null);
  const gridRef = React.useRef<THREE.GridHelper | null>(null);
  const rotationCenterMarkersRef = React.useRef<RotationCenterMarker[]>([]);
  const rotationCenterMarkersEnabledRef = React.useRef(false);
  const [status, setStatus] = React.useState("正在载入默认 head URDF…");
  const [error, setError] = React.useState(false);

  React.useEffect(() => {
    dispatch({ target: "panels.timeline.visible", type: "controls.setValue", value: true });
    dispatch({ target: "panels.timeline.extended", type: "controls.setValue", value: true });
    dispatch({ expanded: true, type: "timeline.setExpanded" });
    dispatch({ panelId: "timeline", type: "panels.resetOffset" });
  }, [dispatch]);

  React.useEffect(() => {
    const host = hostRef.current;
    if (!host) return;

    const scene = new THREE.Scene();
    scene.fog = new THREE.Fog(0x080b12, 5.5, 10);
    const camera = new THREE.PerspectiveCamera(36, 1, 0.01, 100);
    camera.up.set(0, 0, 1);
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.15;
    renderer.domElement.className = styles.canvas;
    renderer.domElement.dataset.slot = "robot-head-webgl-canvas";
    host.appendChild(renderer.domElement);

    scene.add(new THREE.HemisphereLight(0xdbeafe, 0x111827, 2.25));
    const key = new THREE.DirectionalLight(0xffffff, 4.25);
    key.position.set(3, -4, 6);
    scene.add(key);
    const rim = new THREE.DirectionalLight(0x60a5fa, 3);
    rim.position.set(-4, 3, 2);
    scene.add(rim);
    const grid = new THREE.GridHelper(5, 20, 0x334155, 0x1e293b);
    grid.rotation.x = Math.PI / 2;
    grid.position.z = -1.15;
    scene.add(grid);
    gridRef.current = grid;

    sceneRef.current = scene;
    cameraRef.current = camera;
    rendererRef.current = renderer;
    const unregisterSurface = registerRobotHeadSurface({
      camera,
      getRobot: () => robotRef.current,
      getViewportSize: () => ({ height: host.clientHeight, width: host.clientWidth }),
      renderer,
      scene,
      setRotationCenterMarkersVisible: (visible) => {
        rotationCenterMarkersRef.current.forEach((marker) => {
          marker.group.visible = visible && rotationCenterMarkersEnabledRef.current;
        });
      },
    });

    const resize = () => {
      const width = Math.max(1, host.clientWidth);
      const height = Math.max(1, host.clientHeight);
      renderer.setSize(width, height, false);
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
    };
    const observer = new ResizeObserver(resize);
    observer.observe(host);
    resize();
    let animationFrame = 0;
    const render = () => {
      renderer.render(scene, camera);
      animationFrame = requestAnimationFrame(render);
    };
    render();

    return () => {
      cancelAnimationFrame(animationFrame);
      unregisterSurface();
      observer.disconnect();
      if (robotRef.current) disposeObject(robotRef.current);
      if (gridRef.current) disposeObject(gridRef.current);
      robotRef.current = null;
      gridRef.current = null;
      rotationCenterMarkersRef.current = [];
      renderer.dispose();
      renderer.domElement.remove();
      rendererRef.current = null;
      cameraRef.current = null;
      sceneRef.current = null;
    };
  }, []);

  React.useEffect(() => {
    const scene = sceneRef.current;
    if (!scene) return;

    const isLight = resolvedTheme === "light";
    scene.fog = new THREE.Fog(isLight ? 0xaeb9c7 : 0x080b12, 5.5, 10);

    const previousGrid = gridRef.current;
    if (previousGrid) {
      scene.remove(previousGrid);
      disposeObject(previousGrid);
    }
    const grid = new THREE.GridHelper(
      5,
      20,
      isLight ? 0x64748b : 0x334155,
      isLight ? 0x94a3b8 : 0x1e293b,
    );
    grid.rotation.x = Math.PI / 2;
    grid.position.z = -1.15;
    scene.add(grid);
    gridRef.current = grid;
  }, [resolvedTheme]);

  React.useEffect(() => {
    const scene = sceneRef.current;
    if (!scene) return;
    let cancelled = false;
    const previous = robotRef.current;
    if (previous) {
      scene.remove(previous);
      disposeObject(previous);
      robotRef.current = null;
      rotationCenterMarkersRef.current = [];
    }
    setError(false);
    setStatus(`正在载入 ${source.name}…`);

    const load = async () => {
      try {
        const appBaseUrl = new URL(import.meta.env.BASE_URL, window.location.href);
        const modelDir = values["model.variant"] === "head2" ? "head2" : "head";
        const bundledHeadUrl = new URL(`${modelDir}/`, appBaseUrl);
        const bundledUrdfUrl = new URL(`${modelDir}/urdf/head.urdf`, appBaseUrl);
        const bundledUrdfDirectoryUrl = new URL(`${modelDir}/urdf/`, appBaseUrl);
        const manager = new THREE.LoadingManager();
        if (source.kind === "uploaded" && source.filesByPath) {
          manager.setURLModifier((url) => resolveUploadedUrdfUrl(url, source.filesByPath!));
        }
        const loader = new URDFLoader(manager);
        loader.packages = source.kind === "bundled"
          ? { head: bundledHeadUrl.href.replace(/\/$/, "") }
          : { head: "local://head" };
        const text = source.urdfText ?? await fetch(bundledUrdfUrl).then((response) => {
          if (!response.ok) throw new Error(`默认 URDF 请求失败 (${response.status})`);
          return response.text();
        });
        if (!text) throw new Error("URDF 文件内容为空。");
        if (cancelled) return;
        const robot = loader.parse(
          text,
          source.kind === "bundled" ? bundledUrdfDirectoryUrl.href : "",
        );
        robot.rotation.set(0, 0, 0);
        scene.add(robot);
        robotRef.current = robot;

        let fitted = false;
        const fit = () => {
          if (cancelled || fitted || robotRef.current !== robot) return;
          const box = new THREE.Box3().setFromObject(robot);
          if (!box.isEmpty()) {
            fitted = true;
            const center = box.getCenter(new THREE.Vector3());
            const size = box.getSize(new THREE.Vector3());
            const scale = 1.6 / Math.max(size.x, size.y, size.z, 0.001);
            robot.userData.fitCenter = center.clone();
            robot.userData.fitScale = scale;
            rotationCenterMarkersRef.current = createRotationCenterMarkers(robot);
            const camera = cameraRef.current;
            if (camera) {
              applyRobotHeadValues(robot, camera, values);
              rotationCenterMarkersEnabledRef.current = values["model.variant"] === "head2";
              updateRotationCenterMarkers(
                robot,
                rotationCenterMarkersRef.current,
                values,
                true,
              );
            }
          }
          setStatus(`${source.name} · ${Object.keys(robot.joints).length} 个关节 · 文件夹模型已载入`);
        };
        manager.onLoad = fit;
        window.setTimeout(fit, 80);
      } catch (reason) {
        if (cancelled) return;
        setError(true);
        setStatus(reason instanceof Error ? reason.message : "URDF 模型载入失败。");
      }
    };
    void load();
    return () => { cancelled = true; };
  }, [source, values["model.variant"]]);

  React.useEffect(() => {
    updateRobotHeadLiveValues(values);
    const camera = cameraRef.current;
    if (!camera) return;
    applyRobotHeadValues(robotRef.current, camera, values);
    rotationCenterMarkersEnabledRef.current = values["model.variant"] === "head2";
    updateRotationCenterMarkers(
      robotRef.current,
      rotationCenterMarkersRef.current,
      values,
      true,
    );
  }, [values]);

  if (frame.kind !== "ready") return null;
  return (
    <div className={styles.surface} ref={hostRef}>
      {error ? <p className={`${styles.status} ${styles.error}`} role="alert">{status}</p> : null}
    </div>
  );
}
