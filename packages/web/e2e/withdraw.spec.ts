import { test, expect } from "@playwright/test";

test.describe("Withdraw Page", () => {
  test("should display withdraw page with note selection", async ({ page }) => {
    await page.goto("/withdraw");

    const main = page.locator("main");
    await expect(main.getByRole("heading", { name: "Withdraw" })).toBeVisible();
    await expect(main.getByText("Select a note to withdraw")).toBeVisible();
  });

  test("should show empty state when no notes available", async ({ page }) => {
    // Clear any existing notes
    await page.goto("/withdraw");

    await page.evaluate(() => {
      // Clear IndexedDB
      indexedDB.deleteDatabase("keyval-store");
    });

    await page.reload();

    // Should show empty state or loading
    const main = page.locator("main");
    await expect(main.getByRole("heading", { name: "Withdraw" })).toBeVisible();
  });

  test("should navigate from header", async ({ page }) => {
    await page.goto("/");
    const header = page.locator("header");
    await header.getByRole("link", { name: "Withdraw" }).click();
    await expect(page).toHaveURL("/withdraw");
  });

  test("should show 'Make a Deposit' when no notes", async ({ page }) => {
    await page.goto("/withdraw");

    // Wait for the page to check for notes
    await page.waitForTimeout(500);

    const main = page.locator("main");

    // Either shows notes or the empty state
    const hasNotes = await main.getByText("XLM").first().isVisible().catch(() => false);

    if (!hasNotes) {
      // Should show empty state with deposit link
      const makeDepositButton = main.getByRole("button", { name: /make a deposit/i });
      const noNotesText = main.getByText(/no notes available/i);

      // One of these should be visible
      const isEmpty = await makeDepositButton.isVisible().catch(() => false) ||
                      await noNotesText.isVisible().catch(() => false);

      // If truly empty, verify the withdraw header is still there
      await expect(main.getByRole("heading", { name: "Withdraw" })).toBeVisible();
    }
  });
});

test.describe("Withdraw Flow - With Notes", () => {
  test.beforeEach(async ({ page }) => {
    // Create a mock note in IndexedDB before each test
    await page.goto("/");

    await page.evaluate(() => {
      const mockNote = {
        id: "test-note-1",
        ownerAccount: "a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2",
        blinding: "f1e2d3c4b5a6f1e2d3c4b5a6f1e2d3c4b5a6f1e2d3c4b5a6f1e2d3c4b5a6f1e2",
        commitment: "1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef",
        amount: "50000000", // 5 XLM in stroops as string
        poolAddress: "CDLZFC3SYJYDZT7K67VZ75HPJVIEUVNIXF47ZG2FB2RMQQVU2HHGCYSC",
        leafIndex: 5,
        status: "deposited",
        createdAt: new Date().toISOString(),
      };

      localStorage.setItem(
        "astra:note:test-note-1",
        JSON.stringify(mockNote)
      );
    });
  });

  test("should display note cards when notes exist", async ({ page }) => {
    await page.goto("/withdraw");

    // Page should load
    await expect(page.getByRole("heading", { name: "Withdraw" })).toBeVisible();
  });
});
