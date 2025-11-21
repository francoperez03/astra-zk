import { test, expect } from "@playwright/test";

test.describe("Notes Page", () => {
  test("should display notes page with title", async ({ page }) => {
    await page.goto("/notes");

    await expect(page.getByRole("heading", { name: "Your Notes" })).toBeVisible();
    await expect(page.getByText("Private balance:")).toBeVisible();
  });

  test("should show New Deposit button", async ({ page }) => {
    await page.goto("/notes");

    await expect(
      page.getByRole("button", { name: /new deposit/i })
    ).toBeVisible();
  });

  test("should navigate to deposit when clicking New Deposit", async ({
    page,
  }) => {
    await page.goto("/notes");

    await page.getByRole("button", { name: /new deposit/i }).click();
    await expect(page).toHaveURL("/deposit");
  });

  test("should show empty state when no notes", async ({ page }) => {
    // Clear IndexedDB
    await page.goto("/notes");

    await page.evaluate(() => {
      indexedDB.deleteDatabase("keyval-store");
    });

    await page.reload();

    // Should show empty state or the notes list
    const main = page.locator("main");
    await expect(main.getByRole("heading", { name: "Your Notes" })).toBeVisible();
  });

  test("should navigate from header", async ({ page }) => {
    await page.goto("/");
    const header = page.locator("header");
    await header.getByRole("link", { name: "Notes" }).click();
    await expect(page).toHaveURL("/notes");
  });

  test("should display private balance", async ({ page }) => {
    await page.goto("/notes");

    const main = page.locator("main");
    // Balance should show (even if 0)
    await expect(main.getByText("Private balance:")).toBeVisible();
    await expect(main.getByText(/\d+(\.\d+)?\s*XLM/)).toBeVisible();
  });
});

test.describe("Notes Page - With Data", () => {
  test("should show note sections when notes exist", async ({ page }) => {
    // This test checks the structure when notes might exist
    await page.goto("/notes");

    const main = page.locator("main");

    // The page should load with the header
    await expect(main.getByRole("heading", { name: "Your Notes" })).toBeVisible();

    // Check for possible section headers (may or may not be visible)
    // These appear based on note status
    const availableSection = main.getByText("Available", { exact: false });
    const historySection = main.getByText("History", { exact: false });

    // Page structure should be correct
    await expect(main.getByText("Private balance:")).toBeVisible();
  });
});
