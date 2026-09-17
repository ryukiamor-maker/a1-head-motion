import type { Page } from "@playwright/test";
import { expect, test } from "./toolcraft-product-test";
import { createToolcraftBrowserProofSession } from "./browser-proof-session";
import { expectToolcraftProductObservableToChange, getToolcraftProductObservableSnapshot } from "./product-observable-helpers";

const canvas = '[data-slot="robot-head-webgl-canvas"]';

async function pause(page: Page) {
  const button = page.getByRole("button", { name: "Pause playback", exact: true });
  if (await button.isVisible()) await button.click();
}

async function scrub(page: Page, seconds: number) {
  const slider = page.getByRole("slider", { name: "Playback position" });
  await slider.press("Escape");
  await slider.press("Home");
  const bounds = await slider.boundingBox();
  if (!bounds) throw new Error("Timeline scrubber is not visible");
  const start = Number(await slider.getAttribute("data-timeline-track-start"));
  const end = Number(await slider.getAttribute("data-timeline-track-end"));
  await page.mouse.move(bounds.x + start, bounds.y + 1);
  await page.mouse.down();
  await page.mouse.move(bounds.x + start + (bounds.width - start - end) * seconds / 60, bounds.y + 1);
  await page.mouse.up();
  await expect.poll(async () => Math.abs(Number(await slider.getAttribute("aria-valuenow")) - seconds)).toBeLessThan(0.15);
}

test("browser: complete interaction demo generates and animates all three axes", async ({ page }) => {
  await page.goto("/");
  await expect(page.locator(canvas)).toBeVisible();
  await pause(page);
  const session = await createToolcraftBrowserProofSession(page);
  await expectToolcraftProductObservableToChange(session, session.targetAction("motion.demo", async () => {
    await page.getByRole("button", { name: "生成完整演示" }).click();
    await expect(page.getByRole("button", { name: "Pause playback", exact: true })).toBeVisible();
    await pause(page);
    await scrub(page, 6);
  }), { requirementId: "motion.demo", selector: canvas });
  for (const axis of ["Pitch", "Roll", "Yaw"]) {
    await expect(page.locator('[data-slot="timeline-keyframe-row"]').filter({ hasText: axis })).toHaveCount(1);
  }
  const poseAtSix = await getToolcraftProductObservableSnapshot(page, { selector: canvas });
  await page.getByRole("button", { name: "Play playback", exact: true }).click();
  await expect.poll(async () => Number(await page.getByRole("slider", { name: "Playback position" }).getAttribute("aria-valuenow"))).toBeGreaterThan(6.7);
  expect(await getToolcraftProductObservableSnapshot(page, { selector: canvas })).not.toBe(poseAtSix);
  await pause(page);
  const slider = page.getByRole("slider", { name: "Playback position" });
  await slider.press("End");
  await slider.press("ArrowLeft");
  await page.getByRole("button", { name: "Play playback", exact: true }).click();
  await expect(page.getByRole("button", { name: "Play playback", exact: true })).toBeVisible();
  await expect(slider).toHaveAttribute("aria-valuenow", "60");
  await page.reload();
  await expect(page.locator('[data-slot="timeline-keyframe-row"]')).toHaveCount(3);
  await page.getByRole("button", { name: "Play playback", exact: true }).click();
  await expect.poll(async () => Number(await slider.getAttribute("aria-valuenow"))).toBeLessThan(5);
});

test("browser: interaction amplitude changes the generated pose", async ({ page }) => {
  await page.goto("/");
  await expect(page.locator(canvas)).toBeVisible();
  await page.getByRole("button", { name: "生成完整演示" }).click();
  await pause(page);
  await scrub(page, 6);
  const session = await createToolcraftBrowserProofSession(page);
  await expectToolcraftProductObservableToChange(session, session.targetAction("motion.demoIntensity", async () => {
    await page.getByRole("slider", { name: "表现幅度", exact: true }).press("Home");
    await page.getByRole("button", { name: "生成完整演示" }).click();
    await pause(page);
    await scrub(page, 6);
  }), { requirementId: "motion.demoIntensity", selector: canvas });
  await expect(page.getByRole("slider", { name: "表现幅度", exact: true })).toHaveAttribute("aria-valuenow", "0.5");
});
