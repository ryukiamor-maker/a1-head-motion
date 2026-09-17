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
  await slider.press("Home");
  for (let i = 0; i < seconds * 4; i++) await slider.press("ArrowRight");
  await expect(slider).toHaveAttribute("aria-valuenow", String(seconds));
}

test("browser: complete interaction demo generates and animates all three axes", async ({ page }) => {
  await page.goto("/");
  await expect(page.locator(canvas)).toBeVisible();
  await pause(page);
  const session = await createToolcraftBrowserProofSession(page);
  await expectToolcraftProductObservableToChange(session, session.controlAction("motion.demo", async (control) => {
    await control.getByRole("button", { name: "生成完整演示" }).click();
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
  await expectToolcraftProductObservableToChange(session, session.controlAction("motion.demoIntensity", async (control) => {
    await control.getByRole("slider").press("Home");
    await page.getByRole("button", { name: "生成完整演示" }).click();
    await pause(page);
    await scrub(page, 6);
  }), { requirementId: "motion.demoIntensity", selector: canvas });
  await expect(page.getByRole("slider", { name: "表现幅度", exact: true })).toHaveAttribute("aria-valuenow", "0.5");
});
