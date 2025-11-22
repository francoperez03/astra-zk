import { test, expect } from "@playwright/test";

test.describe("Regulator Page", () => {
  test("should navigate from header", async ({ page }) => {
    await page.goto("/");

    const header = page.locator("header");
    await header.getByRole("link", { name: "Regulador" }).click();
    await expect(page).toHaveURL("/regulator");
  });

  test("should display regulator dashboard with title", async ({ page }) => {
    await page.goto("/regulator");

    await expect(
      page.getByRole("heading", { name: "Panel Regulador" })
    ).toBeVisible({ timeout: 15000 });
    await expect(
      page.getByText("Solicita viewing keys para auditar clientes")
    ).toBeVisible();
  });

  test("should display stats cards after loading", async ({ page }) => {
    await page.goto("/regulator");

    await expect(page.getByText("Total Solicitudes")).toBeVisible({
      timeout: 15000,
    });
    await expect(page.getByText("Pendientes", { exact: true })).toBeVisible();
    await expect(page.getByText("Aprobadas", { exact: true })).toBeVisible();
    await expect(page.getByText("Rechazadas", { exact: true })).toBeVisible();
  });

  test("should display request cards", async ({ page }) => {
    await page.goto("/regulator");

    // Wait for requests to load
    await expect(page.getByText("Juan Pérez")).toBeVisible({ timeout: 15000 });
    await expect(page.getByText("María García")).toBeVisible();
  });

  test("should show search input and be functional", async ({ page }) => {
    await page.goto("/regulator");

    const searchInput = page.getByPlaceholder(
      "Buscar por cliente o justificación..."
    );
    await expect(searchInput).toBeVisible({ timeout: 15000 });

    // Wait for data to load
    await expect(page.getByText("Juan Pérez")).toBeVisible({ timeout: 15000 });

    // Type in search
    await searchInput.fill("Juan");

    // Should filter results
    await expect(page.getByText("Juan Pérez")).toBeVisible();
    await expect(page.getByText("María García")).not.toBeVisible();
  });

  test("should show Nueva Solicitud button", async ({ page }) => {
    await page.goto("/regulator");

    await expect(
      page.getByRole("button", { name: /Nueva Solicitud/i })
    ).toBeVisible({ timeout: 15000 });
  });

  test("should open request modal when clicking Nueva Solicitud", async ({
    page,
  }) => {
    await page.goto("/regulator");

    // Wait for page to load
    await expect(page.getByText("Total Solicitudes")).toBeVisible({
      timeout: 15000,
    });

    // Click Nueva Solicitud button
    await page.getByRole("button", { name: /Nueva Solicitud/i }).click();

    // Modal should appear
    await expect(
      page.getByRole("heading", { name: "Nueva Solicitud" })
    ).toBeVisible({ timeout: 5000 });
    await expect(
      page.getByText("Solicitar viewing key de un cliente")
    ).toBeVisible();
  });

  test("should show client selector in modal", async ({ page }) => {
    await page.goto("/regulator");

    await expect(page.getByText("Total Solicitudes")).toBeVisible({
      timeout: 15000,
    });

    await page.getByRole("button", { name: /Nueva Solicitud/i }).click();

    // Client selector should be visible
    await expect(page.getByText("Cliente *")).toBeVisible({ timeout: 5000 });
    await expect(page.getByText("Seleccionar cliente")).toBeVisible();
  });

  test("should show justification field in modal", async ({ page }) => {
    await page.goto("/regulator");

    await expect(page.getByText("Total Solicitudes")).toBeVisible({
      timeout: 15000,
    });

    await page.getByRole("button", { name: /Nueva Solicitud/i }).click();

    // Justification field should be visible
    await expect(page.getByText("Justificación *")).toBeVisible({
      timeout: 5000,
    });
    await expect(
      page.getByPlaceholder("Motivo de la solicitud de viewing key...")
    ).toBeVisible();
  });

  test("should close modal when clicking Cancelar", async ({ page }) => {
    await page.goto("/regulator");

    await expect(page.getByText("Total Solicitudes")).toBeVisible({
      timeout: 15000,
    });

    await page.getByRole("button", { name: /Nueva Solicitud/i }).click();

    // Wait for modal
    await expect(
      page.getByRole("heading", { name: "Nueva Solicitud" })
    ).toBeVisible({ timeout: 5000 });

    // Click Cancelar
    await page.getByRole("button", { name: "Cancelar" }).click();

    // Modal should close
    await expect(
      page.getByRole("heading", { name: "Nueva Solicitud" })
    ).not.toBeVisible();
  });

  test("should show block range inputs in modal", async ({ page }) => {
    await page.goto("/regulator");

    await expect(page.getByText("Total Solicitudes")).toBeVisible({
      timeout: 15000,
    });

    await page.getByRole("button", { name: /Nueva Solicitud/i }).click();

    // Block range inputs should be visible
    await expect(page.getByText("Desde bloque (opcional)")).toBeVisible({
      timeout: 5000,
    });
    await expect(page.getByText("Hasta bloque (opcional)")).toBeVisible();
  });
});

test.describe("Regulator Request Status", () => {
  test("should display approved request with viewing key", async ({ page }) => {
    await page.goto("/regulator");

    // Wait for requests to load
    await expect(page.getByText("Juan Pérez")).toBeVisible({ timeout: 15000 });

    // Should show approved status and viewing key for Juan Pérez
    await expect(page.getByText("Aprobada", { exact: true }).first()).toBeVisible();
    await expect(page.getByText("Viewing Key", { exact: true })).toBeVisible();
  });

  test("should display pending request", async ({ page }) => {
    await page.goto("/regulator");

    // Wait for requests to load
    await expect(page.getByText("María García")).toBeVisible({
      timeout: 15000,
    });

    // Should show pending status
    await expect(page.getByText("Pendiente", { exact: true })).toBeVisible();
  });

  test("should display rejected request", async ({ page }) => {
    await page.goto("/regulator");

    // Wait for requests to load
    await expect(page.getByText("Carlos López")).toBeVisible({
      timeout: 15000,
    });

    // Should show rejected status
    await expect(page.getByText("Rechazada", { exact: true })).toBeVisible();
  });
});
