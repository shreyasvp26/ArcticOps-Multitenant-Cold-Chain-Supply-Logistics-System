import { test, expect } from "@playwright/test"

async function loginAsDriver(page: import("@playwright/test").Page) {
  await page.goto("/login")
  await page.waitForLoadState("networkidle")
  await page.locator("#email").fill("driver@arcticops.io")
  await page.locator("#password").fill("demo123")
  await page.getByRole("button", { name: /sign in/i }).click()
  await page.waitForURL("**/assignment", { timeout: 15_000 })
}

test.describe("Driver Interface", () => {
  test.beforeEach(async ({ page }) => {
    await loginAsDriver(page)
  })

  test("assignment page loads with current assignment", async ({ page }) => {
    await expect(page.locator("body")).toContainText(/assignment|shipment|delivery|in transit/i, { timeout: 15_000 })
  })

  test("navigate tab loads", async ({ page }) => {
    await page.goto("/navigate")
    await page.waitForLoadState("networkidle")
    await expect(page.locator("body")).toContainText(/navigate|route|checkpoint|map/i, { timeout: 15_000 })
  })

  test("monitor tab loads", async ({ page }) => {
    await page.goto("/monitor")
    await page.waitForLoadState("networkidle")
    await expect(page.locator("body")).toContainText(/temperature|monitor|°C|temp/i, { timeout: 15_000 })
  })

  test("documents tab loads", async ({ page }) => {
    await page.goto("/driver/documents")
    await page.waitForLoadState("networkidle")
    await expect(page.locator("body")).toContainText(/document|checklist/i, { timeout: 15_000 })
  })

  test("deliver tab loads", async ({ page }) => {
    await page.goto("/deliver")
    await page.waitForLoadState("networkidle")
    await expect(page.locator("body")).toContainText(/deliver|confirm|arrival|proof/i, { timeout: 15_000 })
  })

  test("bottom navigation is visible on mobile viewport", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 })
    await page.goto("/assignment")
    await page.waitForLoadState("networkidle")
    const nav = page.locator("nav").first()
    await expect(nav).toBeVisible({ timeout: 15_000 })
  })

  test.skip("driver cannot access ops routes (requires middleware)", async ({ page }) => {
    await page.goto("/dashboard")
    await page.waitForTimeout(2000)
    expect(page.url()).not.toContain("/dashboard")
  })
})
