"use client";

import * as React from "react";

import type { ToolcraftCustomControlRendererProps } from "@/toolcraft/runtime/react";
import { Button } from "@/toolcraft/ui";

import styles from "./urdf-folder-control.module.css";
import {
  getUrdfSource,
  installUrdfFolder,
  restoreBundledUrdf,
  subscribeUrdfSource,
  type UrdfFolderFile,
} from "./urdf-source-store";

type DirectoryEntryHandle = {
  kind: "directory" | "file";
  name: string;
};
type FileEntryHandle = DirectoryEntryHandle & {
  kind: "file";
  getFile(): Promise<File>;
};
type DirectoryHandle = DirectoryEntryHandle & {
  kind: "directory";
  values(): AsyncIterable<DirectoryEntryHandle>;
};

async function collectDirectoryFiles(directory: DirectoryHandle, prefix = ""): Promise<UrdfFolderFile[]> {
  const files: UrdfFolderFile[] = [];
  for await (const entry of directory.values()) {
    const path = prefix ? `${prefix}/${entry.name}` : entry.name;
    if (entry.kind === "file") {
      files.push({ file: await (entry as FileEntryHandle).getFile(), path });
    } else {
      files.push(...await collectDirectoryFiles(entry as DirectoryHandle, path));
    }
  }
  return files;
}

export function UrdfFolderControl({ setValue }: ToolcraftCustomControlRendererProps): React.JSX.Element {
  const source = React.useSyncExternalStore(subscribeUrdfSource, getUrdfSource, getUrdfSource);
  const [message, setMessage] = React.useState<string | null>(null);
  const [busy, setBusy] = React.useState(false);

  const chooseFolder = React.useCallback(async () => {
    const picker = (window as Window & {
      showDirectoryPicker?: (options?: { mode?: "read" }) => Promise<DirectoryHandle>;
    }).showDirectoryPicker;
    if (!picker) {
      setMessage("当前浏览器不支持文件夹选择，请使用最新版 Chrome 或 Edge。");
      return;
    }

    setBusy(true);
    setMessage(null);
    try {
      const directory = await picker({ mode: "read" });
      const files = await collectDirectoryFiles(directory);
      const manifest = await installUrdfFolder(files, directory.name);
      setValue(manifest, { history: "record" });
      setMessage(`已载入 ${manifest.fileCount} 个文件。`);
    } catch (reason) {
      if (reason instanceof DOMException && reason.name === "AbortError") return;
      setMessage(reason instanceof Error ? reason.message : "无法载入该 URDF 文件夹。");
    } finally {
      setBusy(false);
    }
  }, [setValue]);

  return (
    <div className={styles.control} data-slot="urdf-folder-control">
      <p className={styles.summary}>{source.name} · {source.fileCount} 个文件{source.kind === "bundled" ? " · 默认" : ""}</p>
      <div className={styles.actions}>
        <Button disabled={busy} onClick={() => void chooseFolder()} size="sm" type="button">
          {busy ? "正在载入…" : "选择文件夹"}
        </Button>
        {source.kind === "uploaded" ? (
          <Button
            onClick={() => {
              setMessage(null);
              setValue(restoreBundledUrdf(), { history: "record" });
            }}
            size="sm"
            type="button"
            variant="outline"
          >
            恢复默认
          </Button>
        ) : null}
      </div>
      {message ? <p className={styles.message} role="status">{message}</p> : null}
    </div>
  );
}
