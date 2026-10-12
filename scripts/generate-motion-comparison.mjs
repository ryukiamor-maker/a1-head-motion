import { createRequire } from "node:module";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { execFileSync } from "node:child_process";

const root = path.dirname(fileURLToPath(import.meta.url));
const project = path.resolve(root, "..");
const outputRoot = path.resolve(project, "..", "motion-comparison-delivery");
const require = createRequire(path.join(project, "package.json"));
const { chromium } = require("@playwright/test");
const appUrl = process.env.HEAD_APP_URL || "http://127.0.0.1:3004/";
const executablePath = "C:/Program Files/Google/Chrome/Application/chrome.exe";

const actions = [
  {
    actionName: "唤醒后转向用户", slug: "wake-turn", durationSeconds: 8,
    tracks: {
      pitch: [[0, 0], [1.2, 5], [2.4, 4], [3.7, 0], [5.3, 5], [6.5, 4], [7.7, 0], [8, 0]],
      roll: [[0, 0], [1.3, 2], [2.5, 1], [3.6, 0], [5.4, -2], [6.6, -1], [7.8, 0], [8, 0]],
      yaw: [[0, 0], [1.25, 50], [2.55, 50], [3.65, 0], [5.15, -50], [6.55, -50], [7.7, 0], [8, 0]],
    },
  },
  {
    actionName: "点头确认", slug: "nod-confirm", durationSeconds: 6,
    tracks: {
      pitch: [[0, 0], [1.05, 4], [1.5, -9], [2.1, 2], [3.1, 7], [3.7, -18], [4.1, -16], [4.95, 1], [5.6, 0], [6, 0]],
      roll: [[0, 0], [6, 0]], yaw: [[0, 0], [6, 0]],
    },
  },
  {
    actionName: "摇头否定", slug: "shake-no", durationSeconds: 7,
    tracks: {
      pitch: [[0, 0], [1.1, 2], [5.7, 2], [6.5, 0], [7, 0]],
      roll: [[0, 0], [7, 0]], yaw: [[0, 0], [1.2, 23], [2.35, -23], [3.6, 35], [4.95, -35], [6.4, 0], [7, 0]],
    },
  },
  {
    actionName: "歪头倾听", slug: "tilt-listen", durationSeconds: 8,
    tracks: {
      pitch: [[0, 0], [1.4, -2], [2.8, -2], [3.9, 0], [5.2, -2], [6.5, -2], [7.7, 0], [8, 0]],
      roll: [[0, 0], [1.65, 14], [2.85, 14], [3.8, 0], [5.4, -14], [6.5, -14], [7.65, 0], [8, 0]],
      yaw: [[0, 0], [1.5, 3], [2.8, 3], [3.9, 0], [5.25, -3], [6.5, -3], [7.7, 0], [8, 0]],
    },
  },
  {
    actionName: "歪头疑惑", slug: "tilt-confused", durationSeconds: 7,
    tracks: {
      pitch: [[0, 0], [1.5, 5], [3.2, 4], [4.6, 2], [6.5, 0], [7, 0]],
      roll: [[0, 0], [2, 16], [3.5, 16], [4.7, 11], [5.3, 11], [6.5, 0], [7, 0]],
      yaw: [[0, 0], [1.8, -4], [3.8, -4], [4.8, 2], [6.5, 0], [7, 0]],
    },
  },
];

const valuesFor = (action) => ({
  "model.variant": "cuteRobot",
  "motion.dofMode": "3dof",
  "motion.pitch": 0,
  "motion.roll": 0,
  "motion.yaw": 0,
  "motion.comparisonName": action.actionName,
  "motion.importPackage": { ...action, version: 1 },
  "geometry.axis1OriginZ": 0.028,
  "geometry.axis2OriginZ": 0.048,
  "geometry.axis3OriginZ": 0.082,
  "geometry.head2PitchCenterX": 0,
  "geometry.head2PitchCenterY": 0,
  "geometry.head2PitchCenterZ": 0.081,
  "geometry.head2RollCenterX": 0,
  "geometry.head2RollCenterY": 0,
  "geometry.head2RollCenterZ": 0.081,
  "geometry.head2YawCenterX": 0,
  "geometry.head2YawCenterY": 0,
  "geometry.head2YawCenterZ": 0.0565,
  "limits.axis1": [-0.61, 0.61],
  "limits.axis2": [-0.52, 0.52],
  "limits.axis3": [-1.65, 1.65],
  "camera.distance": 4.5,
  "camera.fov": 36,
  "camera.targetZ": 0,
  "robot.scale": 1,
  "robot.positionX": 0,
  "robot.positionY": 0,
  "robot.positionZ": 0,
  "robot.rotationX": 0,
  "robot.rotationY": 0,
  "robot.rotationZ": 0,
  "view.orbit": { position: [3.4, 2.4, 1.8], up: [0, 0, 1] },
  "export.video.format": "mp4",
  "export.video.resolution": "current",
  "export.video.includeRotationCenters": false,
  "export.video.comparisonMode": true,
});

const payloadFor = (action) => ({
  appId: "robot-head-studio",
  version: 2,
  source: "toolcraft-settings",
  exportedAt: new Date().toISOString(),
  canvas: { mode: "finite", size: { width: 1400, height: 900, unit: "px" } },
  values: valuesFor(action),
  timeline: {
    currentTimeSeconds: 0,
    durationSeconds: action.durationSeconds,
    expanded: true,
    isLooping: false,
    isPlaying: false,
  },
  motionPackage: {
    version: 1,
    actionName: action.actionName,
    tracks: action.tracks,
    comparison: { labels: ["2自由度", "3自由度"], rollNeutralIn: "2dof" },
  },
});

function writeJson(file, value) {
  fs.writeFileSync(file, `${JSON.stringify(value, null, 2)}\n`, "utf8");
}

function waitForModel(page) {
  return page.waitForFunction(() => {
    const canvas = document.querySelector('canvas[data-slot="robot-head-webgl-canvas"]');
    return Boolean(canvas && canvas.width > 0 && canvas.height > 0);
  }, undefined, { timeout: 60000 });
}

async function importSettings(page, file) {
  const chooser = page.waitForEvent("filechooser");
  await page.getByRole("button", { name: "Import Settings", exact: true }).click();
  await (await chooser).setFiles(file);
  await page.waitForFunction(() => document.querySelectorAll('[data-slot="timeline-keyframe-row"]').length === 3, undefined, { timeout: 30000 });
  await page.waitForTimeout(1000);
}

async function renderAction(browser, action, jsonFile, videoFile) {
  const context = await browser.newContext({ viewport: { width: 1600, height: 1100 }, acceptDownloads: true });
  const page = await context.newPage();
  const errors = [];
  page.on("pageerror", (error) => errors.push(String(error)));
  await page.goto(appUrl, { waitUntil: "networkidle" });
  await waitForModel(page);
  await importSettings(page, jsonFile);
  if (errors.length) throw new Error(`${action.actionName}: ${errors.join("; ")}`);
  const download = page.waitForEvent("download", { timeout: 300000 });
  await page.getByRole("button", { name: "Export Video", exact: true }).click();
  await (await download).saveAs(videoFile);
  await context.close();
}

fs.mkdirSync(outputRoot, { recursive: true });
const browser = await chromium.launch({ executablePath, headless: true });
const report = [];
try {
  for (const action of actions) {
    const directory = path.join(outputRoot, action.slug);
    fs.mkdirSync(directory, { recursive: true });
    const jsonFile = path.join(directory, `${action.slug}.json`);
    const videoFile = path.join(directory, `${action.slug}__2自由度-3自由度对比.mp4`);
    writeJson(jsonFile, payloadFor(action));
    await renderAction(browser, action, jsonFile, videoFile);
    const probe = JSON.parse(execFileSync("ffprobe", ["-v", "error", "-select_streams", "v:0", "-show_entries", "stream=codec_name,width,height,r_frame_rate,duration,nb_frames", "-of", "json", videoFile], { encoding: "utf8" })).streams[0];
    execFileSync("ffmpeg", ["-hide_banner", "-v", "error", "-i", videoFile, "-f", "null", "-"], { stdio: "pipe" });
    report.push({ action: action.actionName, json: jsonFile, video: videoFile, probe });
    console.log(`DONE ${action.actionName}`);
  }
} finally {
  await browser.close();
}
writeJson(path.join(outputRoot, "验证报告.json"), {
  labels: ["2自由度", "3自由度"],
  actions: report,
  checks: ["JSON standard settings payload", "three timeline tracks restored after Import Settings", "MP4 decodes with ffmpeg", "runtime video export dimensions and cadence"],
});
