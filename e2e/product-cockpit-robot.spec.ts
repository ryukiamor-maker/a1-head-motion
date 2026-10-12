import path from "node:path";
import { expect, test } from "./toolcraft-product-test";
import { createToolcraftBrowserProofSession } from "./browser-proof-session";
import { expectToolcraftProductObservableToChange } from "./product-observable-helpers";

test("browser: textured cockpit robot keeps its native screen and supports two and three head axes", async ({ page }) => {
  await page.goto("/");
  const canvas = page.locator('[data-slot="robot-head-webgl-canvas"]');
  await expect(canvas).toBeVisible();
  const pause = page.getByRole("button", { name: "Pause playback", exact: true });
  if (await pause.isVisible()) await pause.click();
  const session = await createToolcraftBrowserProofSession(page);
  await expectToolcraftProductObservableToChange(session, session.targetAction("model.variant", async () => {
    await page.getByRole("combobox").filter({ hasText: "Head 1" }).click();
    await page.getByRole("option", { name: "驾驶舱 GLB（贴图）", exact: true }).click();
    await expect(page.getByRole("slider", { name: "Pitch 中心 Z", exact: true })).toHaveAttribute("aria-valuenow", "0.255");
  }), { selector: '[data-slot="robot-head-webgl-canvas"]', requirementId: "model.cockpitRobot", timeoutMs: 15000 });

  // At neutral the lower cockpit must stay at the same position across head poses.
  const roll = page.getByRole("slider", { name: "Roll / axis2", exact: true });
  await roll.press("End");
  await page.getByRole("button", { name: "2自由度", exact: true }).click();
  await expect(roll).toHaveCount(0);
  await expect(page.getByRole("slider", { name: "Roll 中心 Z", exact: true })).toHaveCount(0);
  await page.getByRole("button", { name: "3自由度", exact: true }).click();
  await expect(roll).toBeVisible();
  await page.getByRole("button", { name: "Reset 头部动作 section", exact: true }).click();
  await page.getByRole("slider", { name: "Pitch 中心 Z", exact: true }).press("ArrowRight");
  await expect(page.getByRole("slider", { name: "Pitch 中心 Z", exact: true })).toHaveAttribute("aria-valuenow", "0.256");
  await page.getByRole("button", { name: "Reset 驾驶舱旋转中心 section", exact: true }).click();

  const idle = await canvas.screenshot();
  await page.locator('[data-slot="face-video-control"] input[type="file"]').setInputFiles(path.resolve("public/face-screen-test-1024x600.mp4"));
  await expect(page.getByText(/自动循环播放/)).toBeVisible();
  await expect.poll(async () => (await canvas.screenshot()).equals(idle)).toBe(false);
  const videoFrame = await canvas.screenshot();
  await expect.poll(async () => (await canvas.screenshot()).equals(videoFrame)).toBe(false);
  await page.getByRole("button", { name: "清除", exact: true }).click();
  await expect(page.getByText("未上传视频 · 面部屏幕保持原材质", { exact: true })).toBeVisible();
  await expect.poll(async () => (await canvas.screenshot()).equals(idle)).toBe(true);
});
