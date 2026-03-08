import { test, expect } from "@playwright/test"

async function loginAsClient(page: import("@playwright/test").Page) {
  await page.goto("/login")
  await page.waitForLoadState("networkidle")
  await page.locator("#email").fill("admin@pharmaalpha.com")
  await page.locator("#password").fill("demo123")
  await page.getByRole("button", { name: /sign in/i }).click()
  await page.waitForURL("**/home", { timeout: 15_000 })
}

test.describe("Client Dashboard", () => {
  test.beforeEach(async ({ page }) => {
    await loginAsClient(page)
  })

  test("client home shows order-related content", async ({ page }) => {
    await expect(page.locator("body")).toContainText(/order|shipment|active|transit/i, { timeout: 15_000 })
  })

  test("procurement catalog loads", async ({ page }) => {
    await page.goto("/procurement")
    await page.waitForLoadState("networkidle")
    await expect(page.locator("body")).toContainText(/material|catalog|procurement/i, { timeout: 15_000 })
  })

  test("order history page loads", async ({ page }) => {
    await page.goto("/procurement/history")
    await page.waitForLoadState("networkidle")
    await expect(page.locator("body")).toContainText(/order|history/i, { timeout: 15_000 })
  })

  test("documents page loads", async ({ page }) => {
    await page.goto("/documents")
    await page.waitForLoadState("networkidle")
    await expect(page.locator("body")).toContainText(/document|compliance/i, { timeout: 15_000 })
  })

  test("communications page loads", async ({ page }) => {
    await page.goto("/communications")
    await page.waitForLoadState("networkidle")
    await expect(page.locator("body")).toContainText(/communication|message/i, { timeout: 15_000 })
  })

  test.skip("client cannot access ops routes (requires middleware)", async ({ page }) => {
    await page.goto("/dashboard")
    await page.waitForTimeout(2000)
    expect(page.url()).not.toContain("/dashboard")
  })
})
