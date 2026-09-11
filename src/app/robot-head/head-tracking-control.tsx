"use client";

import * as React from "react";
import { FaceLandmarker, FilesetResolver } from "@mediapipe/tasks-vision";
import type { ToolcraftCustomControlRendererProps } from "@/toolcraft/runtime/react";
import { Button } from "@/toolcraft/ui";
import styles from "./head-tracking-control.module.css";

type TrackingValue = { enabled: boolean; smoothing: number };
type Pose = { yaw: number; pitch: number; roll: number };
const DEG = 180 / Math.PI;
const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

function poseFromMatrix(data: ArrayLike<number>): Pose {
  const r00 = data[0] ?? 1; const r10 = data[1] ?? 0; const r20 = data[2] ?? 0;
  const r21 = data[6] ?? 0; const r22 = data[10] ?? 1;
  return { yaw: Math.atan2(r20, r00) * DEG, pitch: Math.atan2(-r21, r22) * DEG, roll: Math.atan2(r10, r00) * DEG };
}

export function HeadTrackingControl({ dispatch, setValue, state, value }: ToolcraftCustomControlRendererProps<TrackingValue>): React.JSX.Element {
  const videoRef = React.useRef<HTMLVideoElement>(null);
  const streamRef = React.useRef<MediaStream | null>(null);
  const trackerRef = React.useRef<FaceLandmarker | null>(null);
  const rafRef = React.useRef<number>(0);
  const baseRef = React.useRef<Pose | null>(null);
  const lastSampleRef = React.useRef(0);
  const recordingStartRef = React.useRef(0);
  const [status, setStatus] = React.useState("摄像头未连接");
  const [recording, setRecording] = React.useState(false);
  const [pose, setPose] = React.useState<Pose>({ yaw: 0, pitch: 0, roll: 0 });
  const filteredPoseRef = React.useRef<Pose>({ yaw: 0, pitch: 0, roll: 0 });
  const recordingRef = React.useRef(false);
  const smoothingRef = React.useRef(value?.smoothing ?? 0.7);
  smoothingRef.current = value?.smoothing ?? 0.7;
  const mappingRef = React.useRef({ sensitivity: 2, maxPitch: 45, maxRoll: 45, maxYaw: 90 });
  mappingRef.current = {
    sensitivity: Number(state.values["capture.sensitivity"] ?? 2),
    maxPitch: Number(state.values["capture.maxPitch"] ?? 45),
    maxRoll: Number(state.values["capture.maxRoll"] ?? 45),
    maxYaw: Number(state.values["capture.maxYaw"] ?? 90),
  };

  const trackingValue = React.useCallback((enabled: boolean): TrackingValue => ({
    ...(value ?? { smoothing: 0.7 }),
    enabled,
    smoothing: smoothingRef.current,
  }), [value]);

  const setMotion = React.useCallback((next: Pose, record: boolean, timeSeconds: number) => {
    const mapping = mappingRef.current;
    const pitchDegrees = clamp(next.pitch * mapping.sensitivity, -mapping.maxPitch, mapping.maxPitch);
    const rollDegrees = clamp(next.roll * mapping.sensitivity, -mapping.maxRoll, mapping.maxRoll);
    const yawDegrees = clamp(next.yaw * mapping.sensitivity, -mapping.maxYaw, mapping.maxYaw);
    const pitch = pitchDegrees * Math.PI / 180;
    const roll = rollDegrees * Math.PI / 180;
    const yaw = yawDegrees * Math.PI / 180;
    setPose(next);
    for (const [target, angle] of [["motion.pitch", pitch], ["motion.roll", roll], ["motion.yaw", yaw]] as const) {
      dispatch({ target, type: "controls.setValue", value: angle });
      if (record) dispatch({ controlId: target, controlLabel: target.split(".")[1], timeSeconds, type: "timeline.upsertControlKeyframe", value: angle, valueLabel: `${angle.toFixed(3)} rad` });
    }
  }, [dispatch]);

  const stop = React.useCallback(() => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null; trackerRef.current = null; recordingRef.current = false; setRecording(false); baseRef.current = null; setStatus("摄像头已停止");
    setValue(trackingValue(false));
  }, [setValue, trackingValue]);

  const start = React.useCallback(async () => {
    try {
      setStatus("正在加载人脸姿态模型…");
      const fileset = await FilesetResolver.forVisionTasks("https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.21/wasm");
      trackerRef.current = await FaceLandmarker.createFromOptions(fileset, { baseOptions: { modelAssetPath: "https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task", delegate: "GPU" }, runningMode: "VIDEO", numFaces: 1, outputFacialTransformationMatrixes: true });
      streamRef.current = await navigator.mediaDevices.getUserMedia({ video: { width: 640, height: 480, facingMode: "user" }, audio: false });
      if (!videoRef.current) return; videoRef.current.srcObject = streamRef.current; await videoRef.current.play();
      setStatus("追踪中 · 请正对摄像头"); baseRef.current = null; filteredPoseRef.current = { yaw: 0, pitch: 0, roll: 0 }; setValue(trackingValue(true));
      const loop = () => {
        const video = videoRef.current; const tracker = trackerRef.current;
        if (!video || !tracker) return;
        const result = tracker.detectForVideo(video, performance.now()); const matrix = result.facialTransformationMatrixes?.[0]?.data;
        if (matrix) {
          const raw = poseFromMatrix(matrix); const base = baseRef.current ?? (baseRef.current = raw); const smoothing = smoothingRef.current;
          const target = { yaw: raw.yaw - base.yaw, pitch: raw.pitch - base.pitch, roll: raw.roll - base.roll };
          const previous = filteredPoseRef.current;
          const next = {
            yaw: previous.yaw * smoothing + target.yaw * (1 - smoothing),
            pitch: previous.pitch * smoothing + target.pitch * (1 - smoothing),
            roll: previous.roll * smoothing + target.roll * (1 - smoothing),
          };
          filteredPoseRef.current = next;
          const now = performance.now(); const elapsed = (now - recordingStartRef.current) / 1000; const shouldRecord = recordingRef.current && now - lastSampleRef.current > 80;
          if (recordingRef.current) { dispatch({ currentTimeSeconds: elapsed, type: "timeline.setCurrentTime" }); if (elapsed > state.timeline.durationSeconds) dispatch({ durationSeconds: Math.min(60, elapsed + 0.1), type: "timeline.setDuration" }); }
          setMotion(next, shouldRecord, elapsed); if (shouldRecord) lastSampleRef.current = now;
        }
        rafRef.current = requestAnimationFrame(loop);
      }; loop();
    } catch (reason) { setStatus(reason instanceof DOMException && reason.name === "NotAllowedError" ? "摄像头权限被拒绝" : "无法启动摄像头或姿态模型"); }
  }, [setMotion, setValue, trackingValue]);

  React.useEffect(() => () => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    trackerRef.current = null;
  }, []);
  const currentValue = value ?? { enabled: false, smoothing: 0.7 };
  return <div className={styles.control} data-slot="head-tracking-control">
    <video ref={videoRef} className={styles.preview} muted playsInline aria-label="摄像头人脸预览" />
    <div className={styles.row}><p className={`${styles.status} ${trackerRef.current ? styles.live : ""}`}>{status}</p><Button size="sm" onClick={() => (trackerRef.current ? stop() : void start())}>{trackerRef.current ? "停止" : "启动"}</Button><Button size="sm" variant={recording ? "destructive" : "outline"} disabled={!trackerRef.current} onClick={() => { const active = !recordingRef.current; recordingRef.current = active; setRecording(active); const now = performance.now(); recordingStartRef.current = now; lastSampleRef.current = now; }}>{recording ? "停止录制" : "录制追踪"}</Button></div>
    <dl className={styles.readout}>{(["yaw", "pitch", "roll"] as const).map((axis) => <div key={axis}><dt>{axis.toUpperCase()}</dt><dd>{pose[axis].toFixed(1)}°</dd></div>)}</dl>
    <label className={styles.hint}>平滑 <input className={styles.slider} type="range" min="0" max="0.95" step="0.05" value={currentValue.smoothing} onChange={(event) => setValue({ ...currentValue, smoothing: Number(event.target.value) })} /></label>
    <p className={styles.hint}>录制采样会写入现有 Pitch / Roll / Yaw 时间轴，并可继续导出视频或 GIF。</p>
  </div>;
}
