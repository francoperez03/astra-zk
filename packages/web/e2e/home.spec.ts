import { test, expect } from "@playwright/test";

test.describe("Home Page", () => {
  test("should display ASTRA title and tagline", async ({ page }) => {
    await page.goto("/");

    await expect(page.getByRole("heading", { name: "ASTRA" })).toBeVisible();
    await expect(
      page.getByText("Privacy-preserving transactions on Stellar")
    ).toBeVisible();
  });

  test("should display deposit and withdraw buttons", async ({ page }) => {
    await page.goto("/");

    const main = page.locator("main");
    await expect(main.getByRole("link", { name: /deposit/i })).toBeVisible();
    await expect(main.getByRole("link", { name: /withdraw/i })).toBeVisible();
  });

  test("should display feature cards", async ({ page }) => {
    await page.goto("/");

    const main = page.locator("main");
    await expect(main.getByRole("heading", { name: "Private" })).toBeVisible();
    await expect(main.getByRole("heading", { name: "Fast" })).toBeVisible();
    await expect(main.getByRole("heading", { name: "Secure" })).toBeVisible();
  });

  test("should navigate to deposit page", async ({ page }) => {
    await page.goto("/");

    await page.getByRole("link", { name: /deposit/i }).first().click();
    await expect(page).toHaveURL("/deposit");
  });

  test("should navigate to withdraw page", async ({ page }) => {
    await page.goto("/");

    await page.getByRole("link", { name: /withdraw/i }).first().click();
    await expect(page).toHaveURL("/withdraw");
  });

  test("should have header navigation", async ({ page }) => {
    await page.goto("/");

    const header = page.locator("header");
    await expect(header.getByText("ASTRA")).toBeVisible();
    await expect(header.getByRole("link", { name: "Deposit" })).toBeVisible();
    await expect(header.getByRole("link", { name: "Withdraw" })).toBeVisible();
    await expect(header.getByRole("link", { name: "Notes" })).toBeVisible();
  });
});
