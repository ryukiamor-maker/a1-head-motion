import { expect, test } from "./toolcraft-product-test";
import { createToolcraftBrowserProofSession } from "./browser-proof-session";
import { expectToolcraftAcceptanceOutcome } from "./browser-acceptance-outcome-helpers";
import { expectToolcraftSegmentedControlCellsPreservePadding } from "./performance-control-layout-helpers";

const canvas = '[data-slot="robot-head-webgl-canvas"]';

test("browser: head degree-of-freedom mode hides roll controls and fixes roll output", async ({ page }) => {
  await page.goto("/");
  await expect(page.locator(canvas)).toBeVisible();
  const pause = page.getByRole("button", { name: "Pause playback", exact: true });
  if (await pause.isVisible()) await pause.click();

  const roll = page.getByRole("slider", { name: "Roll / axis2", exact: true });
  await roll.press("End");
  await expect.poll(async () => Number(await roll.getAttribute("aria-valuenow"))).toBeGreaterThan(0.4);
  await page.waitForTimeout(400);
  await expectToolcraftSegmentedControlCellsPreservePadding(page, "头部自由度", {
    requirementId: "motion.dofMode",
    target: "motion.dofMode",
  });
  const session = await createToolcraftBrowserProofSession(page);
  await expectToolcraftAcceptanceOutcome(
    async () => JSON.stringify({
      rollSlider: await page.getByRole("slider", { name: "Roll / axis2", exact: true }).count(),
      rollLimit: await page.getByText("Roll 下限 / 上限", { exact: true }).count(),
    }),
    session.targetAction("motion.dofMode", async () => {
      await page.getByRole("button", { name: "2自由度", exact: true }).click();
      await expect(page.getByRole("slider", { name: "Roll / axis2", exact: true })).toHaveCount(0);
      await expect(page.getByText("Roll 最大角度", { exact: true })).toHaveCount(0);
      await expect(page.getByText("Roll 中心 X", { exact: true })).toHaveCount(0);
    }),
    { evidenceType: "command-side-effect", requirementId: "motion.dofMode" },
  );

  await page.getByRole("button", { name: "3自由度", exact: true }).click();
  await expect(page.getByRole("slider", { name: "Roll / axis2", exact: true })).toBeVisible();
});
