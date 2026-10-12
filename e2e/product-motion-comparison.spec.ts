import type { Page } from "@playwright/test";
import { expect, test } from "./toolcraft-product-test";
import { createToolcraftBrowserProofSession } from "./browser-proof-session";
import {
  expectToolcraftProductObservableToChange,
  getToolcraftProductObservableSnapshot,
} from "./product-observable-helpers";

const canvas = '[data-slot="robot-head-webgl-canvas"]';

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
  await page.mouse.move(bounds.x + start + (bounds.width - start - end) * seconds / 8, bounds.y + 1);
  await page.mouse.up();
  await expect.poll(async () => Number(await slider.getAttribute("aria-valuenow"))).toBeGreaterThan(seconds - 0.2);
}

test("browser: loads a comparison action into the three-axis timeline", async ({ page }) => {
  await page.goto("/");
  await expect(page.locator(canvas)).toBeVisible();
  const pause = page.getByRole("button", { name: "Pause playback", exact: true });
  if (await pause.isVisible()) await pause.click();
  const session = await createToolcraftBrowserProofSession(page);

  await expectToolcraftProductObservableToChange(
    session,
    session.targetAction("motion.comparison", async () => {
      await page.getByRole("button", { name: "歪头倾听", exact: true }).click();
      for (const axis of ["Pitch", "Roll", "Yaw"]) {
        await expect(page.locator('[data-slot="timeline-keyframe-row"]').filter({ hasText: axis })).toHaveCount(1);
      }
      await scrub(page, 2.3);
    }),
    { requirementId: "motion.comparison", selector: canvas },
  );

  const pose = await getToolcraftProductObservableSnapshot(page, { selector: canvas });
  await page.getByRole("button", { name: "2自由度", exact: true }).click();
  await page.waitForTimeout(250);
  expect(await getToolcraftProductObservableSnapshot(page, { selector: canvas })).not.toBe(pose);
});
