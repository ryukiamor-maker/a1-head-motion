export type UrdfSourceManifest = {
  fileCount: number;
  kind: "bundled" | "uploaded";
  name: string;
};

export type UrdfSource = UrdfSourceManifest & {
  filesByPath?: ReadonlyMap<string, string>;
  revision: number;
  urdfText?: string;
};

const bundledSource: UrdfSource = {
  fileCount: 7,
  kind: "bundled",
  name: "head",
  revision: 0,
};

let currentSource = bundledSource;
const listeners = new Set<() => void>();

function normalizePath(path: string): string {
  return decodeURIComponent(path)
    .replace(/\\/g, "/")
    .replace(/^\.\//, "")
    .replace(/^\/+/, "")
    .toLowerCase();
}

export type UrdfFolderFile = { file: File; path: string };

function resolveUrdfReference(reference: string, urdfPath: string): string {
  if (reference.startsWith("package://")) {
    const afterScheme = reference.slice("package://".length);
    const slash = afterScheme.indexOf("/");
    return normalizePath(slash >= 0 ? afterScheme.slice(slash + 1) : afterScheme);
  }

  const base = urdfPath.split("/").slice(0, -1);
  for (const segment of reference.replace(/\\/g, "/").split("/")) {
    if (!segment || segment === ".") continue;
    if (segment === "..") base.pop();
    else base.push(segment);
  }
  return normalizePath(base.join("/"));
}

export function getUrdfSource(): UrdfSource {
  return currentSource;
}

export function subscribeUrdfSource(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function publish(source: UrdfSource): void {
  currentSource = source;
  listeners.forEach((listener) => listener());
}

export function restoreBundledUrdf(): UrdfSourceManifest {
  publish({ ...bundledSource, revision: currentSource.revision + 1 });
  return bundledSource;
}

function readAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(reader.error ?? new Error(`无法读取 ${file.name}`));
    reader.onload = () => resolve(String(reader.result));
    reader.readAsDataURL(file);
  });
}

export async function installUrdfFolder(entries: UrdfFolderFile[], rootName: string): Promise<UrdfSourceManifest> {
  const usableFiles = entries.filter(({ file }) => file.size > 0);
  const indexedFiles = new Map<string, File>();
  usableFiles.forEach(({ file, path }) => indexedFiles.set(normalizePath(path), file));

  const urdfEntry = [...indexedFiles.entries()]
    .filter(([path]) => path.endsWith(".urdf"))
    .sort(([left], [right]) => {
      const leftPreferred = left.endsWith("urdf/head.urdf") ? -1 : 0;
      const rightPreferred = right.endsWith("urdf/head.urdf") ? -1 : 0;
      return leftPreferred - rightPreferred || left.localeCompare(right);
    })[0];

  if (!urdfEntry) {
    throw new Error("所选文件夹中没有找到 .urdf 文件。请选择完整的机器人模型包。 ");
  }

  const [urdfPath, urdfFile] = urdfEntry;
  const urdfText = await urdfFile.text();
  const references = [...urdfText.matchAll(/filename\s*=\s*["']([^"']+)["']/gi)]
    .map((match) => match[1])
    .filter(Boolean);
  const missing = references
    .map((reference) => resolveUrdfReference(reference, urdfPath))
    .filter((path) => !indexedFiles.has(path));

  if (missing.length > 0) {
    throw new Error(`URDF 引用的文件缺失：${[...new Set(missing)].join("、")}`);
  }

  const filesByPath = new Map<string, string>();
  await Promise.all([...indexedFiles.entries()].map(async ([path, file]) => {
    filesByPath.set(path, await readAsDataUrl(file));
  }));
  const manifest: UrdfSourceManifest = {
    fileCount: usableFiles.length,
    kind: "uploaded",
    name: rootName,
  };
  publish({
    ...manifest,
    filesByPath,
    revision: currentSource.revision + 1,
    urdfText,
  });
  return manifest;
}

export function resolveUploadedUrdfUrl(url: string, filesByPath: ReadonlyMap<string, string>): string {
  const normalized = normalizePath(url);
  const packageMarker = normalized.indexOf("local://head/");
  const candidate = packageMarker >= 0
    ? normalized.slice(packageMarker + "local://head/".length)
    : normalized;
  return filesByPath.get(candidate) ?? url;
}
