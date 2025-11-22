import { test, expect } from "@playwright/test";

test.describe("Anchor Page", () => {
  test("should navigate from header", async ({ page }) => {
    await page.goto("/");

    const header = page.locator("header");
    await header.getByRole("link", { name: "Anchor" }).click();
    await expect(page).toHaveURL("/anchor");
  });

  test("should display anchor dashboard with title", async ({ page }) => {
    await page.goto("/anchor");

    // Wait for page and data to load with longer timeout
    await expect(page.getByRole("heading", { name: "Panel Anchor" })).toBeVisible({ timeout: 15000 });
    await expect(
      page.getByText("Gestiona los balances públicos y privados de tus clientes")
    ).toBeVisible();
  });

  test("should display stats and client list after loading", async ({ page }) => {
    await page.goto("/anchor");

    // Wait for loading to complete
    await expect(page.getByText("Total Clientes")).toBeVisible({ timeout: 15000 });
    await expect(page.getByText("Balance Público Total")).toBeVisible();

    // Wait for client list to load
    await expect(page.getByText("Juan Pérez")).toBeVisible({ timeout: 15000 });
  });

  test("should show search input and be functional", async ({ page }) => {
    await page.goto("/anchor");

    // Wait for search input
    const searchInput = page.getByPlaceholder("Buscar por nombre o dirección...");
    await expect(searchInput).toBeVisible({ timeout: 15000 });

    // Wait for client data to load first
    await expect(page.getByText("Juan Pérez")).toBeVisible({ timeout: 15000 });

    // Type in search
    await searchInput.fill("Juan");

    // Should filter results
    await expect(page.getByText("Juan Pérez")).toBeVisible();
    await expect(page.getByText("María García")).not.toBeVisible();
  });

  test("should expand client card to show actions", async ({ page }) => {
    await page.goto("/anchor");

    // Wait for client data
    await expect(page.getByText("Juan Pérez")).toBeVisible({ timeout: 15000 });

    // Click on Juan Pérez card to expand
    await page.getByText("Juan Pérez").click();

    // Should show action buttons (first card)
    await expect(page.getByRole("button", { name: /Transferir Público/i }).first()).toBeVisible({ timeout: 5000 });
    await expect(page.getByRole("button", { name: /^Depositar$/i }).first()).toBeVisible();
  });
});
