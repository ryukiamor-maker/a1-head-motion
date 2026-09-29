export type CustomSource = {
  kind: "bundled" | "uploaded";
  name: string;
  url: string;
  revision: number;
};

const bundledModel: CustomSource = {
  kind: "bundled",
  name: "可爱机器人_面部平滑屏幕.glb",
  url: `${import.meta.env.BASE_URL}cute-robot.glb`,
  revision: 0,
};

const bundledVideo: CustomSource = {
  kind: "bundled",
  name: "未上传视频",
  url: "",
  revision: 0,
};

let modelSource = bundledModel;
let videoSource = bundledVideo;
const modelListeners = new Set<() => void>();
const videoListeners = new Set<() => void>();

export function getCustomModelSource(): CustomSource { return modelSource; }
export function subscribeCustomModelSource(listener: () => void): () => void {
  modelListeners.add(listener);
  return () => modelListeners.delete(listener);
}
export function getFaceVideoSource(): CustomSource { return videoSource; }
export function subscribeFaceVideoSource(listener: () => void): () => void {
  videoListeners.add(listener);
  return () => videoListeners.delete(listener);
}

export function installCustomModel(file: File): CustomSource {
  if (!file.name.toLowerCase().endsWith(".glb") && !file.name.toLowerCase().endsWith(".gltf")) {
    throw new Error("请选择 GLB 或 glTF 模型文件。");
  }
  if (modelSource.kind === "uploaded") URL.revokeObjectURL(modelSource.url);
  modelSource = { kind: "uploaded", name: file.name, url: URL.createObjectURL(file), revision: modelSource.revision + 1 };
  modelListeners.forEach((listener) => listener());
  return modelSource;
}

export function installFaceVideo(file: File): CustomSource {
  if (!file.type.startsWith("video/") && !/\.(mp4|webm|mov|m4v|ogv)$/i.test(file.name)) {
    throw new Error("请选择 MP4、WebM、MOV 或其他浏览器支持的视频文件。");
  }
  if (videoSource.kind === "uploaded") URL.revokeObjectURL(videoSource.url);
  videoSource = { kind: "uploaded", name: file.name, url: URL.createObjectURL(file), revision: videoSource.revision + 1 };
  videoListeners.forEach((listener) => listener());
  return videoSource;
}

export function clearFaceVideo(): CustomSource {
  if (videoSource.kind === "uploaded") URL.revokeObjectURL(videoSource.url);
  videoSource = { ...bundledVideo, revision: videoSource.revision + 1 };
  videoListeners.forEach((listener) => listener());
  return videoSource;
}
