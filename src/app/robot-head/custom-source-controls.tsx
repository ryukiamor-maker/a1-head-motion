"use client";

import * as React from "react";
import type { ToolcraftCustomControlRendererProps } from "@/toolcraft/runtime/react";
import { Button } from "@/toolcraft/ui";
import styles from "./custom-source-control.module.css";
import {
  clearFaceVideo,
  getCustomModelSource,
  getFaceVideoSource,
  installCustomModel,
  installFaceVideo,
  subscribeCustomModelSource,
  subscribeFaceVideoSource,
} from "./custom-source-store";

export function CuteRobotFileControl({ setValue }: ToolcraftCustomControlRendererProps): React.JSX.Element {
  const source = React.useSyncExternalStore(subscribeCustomModelSource, getCustomModelSource, getCustomModelSource);
  const inputRef = React.useRef<HTMLInputElement>(null);
  const [message, setMessage] = React.useState<string | null>(null);
  return <div className={styles.control} data-slot="cute-robot-file-control">
    <p className={styles.summary}>{source.name}{source.kind === "bundled" ? " · 内置" : " · 已上传"}</p>
    <div className={styles.actions}>
      <Button size="sm" type="button" onClick={() => inputRef.current?.click()}>上传模型</Button>
      <input ref={inputRef} className={styles.input} type="file" accept=".glb,.gltf,model/gltf-binary,model/gltf+json" onChange={(event) => {
        const file = event.currentTarget.files?.[0];
        event.currentTarget.value = "";
        if (!file) return;
        try { const next = installCustomModel(file); setValue({ kind: next.kind, name: next.name }, { history: "record" }); setMessage("模型已载入。"); }
        catch (reason) { setMessage(reason instanceof Error ? reason.message : "模型载入失败。"); }
      }} />
    </div>
    {message ? <p className={styles.message} role="status">{message}</p> : null}
  </div>;
}

export function FaceVideoControl({ setValue }: ToolcraftCustomControlRendererProps): React.JSX.Element {
  const source = React.useSyncExternalStore(subscribeFaceVideoSource, getFaceVideoSource, getFaceVideoSource);
  const inputRef = React.useRef<HTMLInputElement>(null);
  const [message, setMessage] = React.useState<string | null>(null);
  return <div className={styles.control} data-slot="face-video-control">
    <p className={styles.summary}>{source.url ? `${source.name} · 自动循环播放` : "未上传视频 · 面部屏幕保持原材质"}</p>
    <div className={styles.actions}>
      <Button size="sm" type="button" onClick={() => inputRef.current?.click()}>上传视频</Button>
      {source.url ? <Button size="sm" type="button" variant="outline" onClick={() => { clearFaceVideo(); setValue(null, { history: "record" }); setMessage("已清除视频。"); }}>清除</Button> : null}
      <input ref={inputRef} className={styles.input} type="file" accept="video/*,.mp4,.webm,.mov,.m4v,.ogv" onChange={(event) => {
        const file = event.currentTarget.files?.[0];
        event.currentTarget.value = "";
        if (!file) return;
        try { const next = installFaceVideo(file); setValue({ kind: next.kind, name: next.name }, { history: "record" }); setMessage("视频已载入，面部屏幕将自动播放。"); }
        catch (reason) { setMessage(reason instanceof Error ? reason.message : "视频载入失败。"); }
      }} />
    </div>
    {message ? <p className={styles.message} role="status">{message}</p> : null}
  </div>;
}
