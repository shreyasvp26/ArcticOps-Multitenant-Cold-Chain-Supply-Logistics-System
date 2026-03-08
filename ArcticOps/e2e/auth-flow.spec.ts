import { test, expect } from "@playwright/test"

test.describe("Authentication Flow", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/login")
    await page.waitForLoadState("networkidle")
  })

  test("login page renders with form elements", async ({ page }) => {
    await expect(page.locator("#email")).toBeVisible()
    await expect(page.locator("#password")).toBeVisible()
    await expect(page.getByRole("button", { name: /sign in/i })).toBeVisible()
  })

  test("rejects invalid credentials with error message", async ({ page }) => {
    await page.locator("#email").fill("wrong@email.com")
    await page.locator("#password").fill("wrongpass")
    await page.getByRole("button", { name: /sign in/i }).click()
    await expect(page.getByRole("alert")).toBeVisible({ timeout: 10_000 })
  })

  test("ops manager login redirects to /dashboard", async ({ page }) => {
    await page.locator("#email").fill("ops@arcticops.io")
    await page.locator("#password").fill("demo123")
    await page.getByRole("button", { name: /sign in/i }).click()
    await page.waitForURL("**/dashboard", { timeout: 15_000 })
    expect(page.url()).toContain("/dashboard")
  })

  test("client admin login redirects to /home", async ({ page }) => {
    await page.locator("#email").fill("admin@pharmaalpha.com")
    await page.locator("#password").fill("demo123")
    await page.getByRole("button", { name: /sign in/i }).click()
    await page.waitForURL("**/home", { timeout: 15_000 })
    expect(page.url()).toContain("/home")
  })

  test("driver login redirects to /assignment", async ({ page }) => {
    await page.locator("#email").fill("driver@arcticops.io")
    await page.locator("#password").fill("demo123")
    await page.getByRole("button", { name: /sign in/i }).click()
    await page.waitForURL("**/assignment", { timeout: 15_000 })
    expect(page.url()).toContain("/assignment")
  })

  test("quick-login demo buttons are displayed", async ({ page }) => {
    await expect(page.getByRole("button", { name: /login as ops manager/i })).toBeVisible()
    await expect(page.getByRole("button", { name: /login as client admin/i })).toBeVisible()
    await expect(page.getByRole("button", { name: /login as driver/i })).toBeVisible()
  })

  test("signup page has activation code inputs", async ({ page }) => {
    await page.goto("/signup")
    await page.waitForLoadState("networkidle")
    const codeInputs = page.locator("input[aria-label*='Activation code digit']")
    await expect(codeInputs.first()).toBeVisible({ timeout: 10_000 })
    expect(await codeInputs.count()).toBe(6)
  })
})
