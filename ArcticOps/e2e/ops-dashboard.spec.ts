import { test, expect } from "@playwright/test"

async function loginAsOps(page: import("@playwright/test").Page) {
  await page.goto("/login")
  await page.waitForLoadState("networkidle")
  await page.locator("#email").fill("ops@arcticops.io")
  await page.locator("#password").fill("demo123")
  await page.getByRole("button", { name: /sign in/i }).click()
  await page.waitForURL("**/dashboard", { timeout: 15_000 })
}

test.describe("Operations Dashboard", () => {
  test.beforeEach(async ({ page }) => {
    await loginAsOps(page)
  })

  test("command center displays KPI cards", async ({ page }) => {
    await expect(page.getByText(/Active Shipments/i)).toBeVisible({ timeout: 15_000 })
    await expect(page.getByText(/On-Time Delivery/i)).toBeVisible()
  })

  test("sidebar navigation works", async ({ page }) => {
    const shipmentsLink = page.getByRole("link", { name: /shipments/i }).first()
    await expect(shipmentsLink).toBeVisible({ timeout: 10_000 })
    await shipmentsLink.click()
    await page.waitForURL("**/shipments", { timeout: 15_000 })
    expect(page.url()).toContain("/shipments")
  })

  test("shipment list page loads", async ({ page }) => {
    await page.goto("/shipments")
    await page.waitForLoadState("networkidle")
    await expect(page.locator("body")).toContainText(/shipment/i, { timeout: 15_000 })
  })

  test("inventory page loads", async ({ page }) => {
    await page.goto("/inventory")
    await page.waitForLoadState("networkidle")
    await expect(page.locator("body")).toContainText(/inventory|material|stock/i, { timeout: 15_000 })
  })

  test("route planner page loads", async ({ page }) => {
    await page.goto("/route-planner")
    await page.waitForLoadState("networkidle")
    await expect(page.locator("body")).toContainText(/route|origin|destination|planner/i, { timeout: 15_000 })
  })

  test("analytics page loads", async ({ page }) => {
    await page.goto("/analytics")
    await page.waitForLoadState("networkidle")
    await expect(page.locator("body")).toContainText(/analytics|prediction|cost|insight/i, { timeout: 15_000 })
  })

  test("compliance page loads", async ({ page }) => {
    await page.goto("/compliance")
    await page.waitForLoadState("networkidle")
    await expect(page.locator("body")).toContainText(/compliance|document|audit/i, { timeout: 15_000 })
  })
})
