// @ts-check
const { test, expect } = require("@playwright/test");

const BASE_URL = "http://localhost:8000";

test.describe("Phone Number Pre-fill", () => {
  test("phone input is pre-filled with 9971313547 on page load", async ({ page }) => {
    await page.goto(BASE_URL);

    const phoneInput = page.locator("#phone-input");

    // 1. Verify the input exists and is visible
    await expect(phoneInput).toBeVisible();

    // 2. Verify the pre-filled value is exactly 9971313547
    await expect(phoneInput).toHaveValue("9971313547");
  });

  test("phone input has autofocus on page load", async ({ page }) => {
    await page.goto(BASE_URL);

    const phoneInput = page.locator("#phone-input");

    // The phone input should have the autofocus attribute
    await expect(phoneInput).toHaveAttribute("autofocus", "");
  });

  test("pressing Enter on pre-filled phone moves focus to item number input", async ({ page }) => {
    await page.goto(BASE_URL);

    const phoneInput = page.locator("#phone-input");
    const itemNumberInput = page.locator("#new-item-number");

    // Focus the phone field and press Enter
    await phoneInput.focus();
    await phoneInput.press("Enter");

    // Focus should have moved to the item number input
    await expect(itemNumberInput).toBeFocused();
  });

  test("pre-filled phone does NOT trigger validation alert on Enter", async ({ page }) => {
    await page.goto(BASE_URL);

    const phoneInput = page.locator("#phone-input");

    // Listen for dialog (alert) events — should NOT fire
    let alertFired = false;
    page.on("dialog", async (dialog) => {
      alertFired = true;
      await dialog.accept();
    });

    await phoneInput.focus();
    await phoneInput.press("Enter");

    // Give a moment for any alert to fire
    await page.waitForTimeout(500);

    expect(alertFired).toBe(false);
  });

  test("user can overwrite pre-filled phone with a different number", async ({ page }) => {
    await page.goto(BASE_URL);

    const phoneInput = page.locator("#phone-input");

    // Clear and type a different number
    await phoneInput.fill("");
    await phoneInput.fill("9876543210");

    // Verify the new value is set
    await expect(phoneInput).toHaveValue("9876543210");

    // Press Enter — should move to item number without alert
    let alertFired = false;
    page.on("dialog", async (dialog) => {
      alertFired = true;
      await dialog.accept();
    });

    await phoneInput.press("Enter");
    await page.waitForTimeout(500);

    expect(alertFired).toBe(false);
    await expect(page.locator("#new-item-number")).toBeFocused();
  });

  test("clearing phone and pressing Enter triggers validation alert", async ({ page }) => {
    await page.goto(BASE_URL);

    const phoneInput = page.locator("#phone-input");

    // Clear the pre-filled phone number
    await phoneInput.fill("");

    // Listen for the validation alert
    let alertMessage = "";
    page.on("dialog", async (dialog) => {
      alertMessage = dialog.message();
      await dialog.accept();
    });

    await phoneInput.press("Enter");
    await page.waitForTimeout(500);

    // Validation alert should have fired
    expect(alertMessage).toContain("10-digit phone number");
  });

  test("phone input maxlength is 10 and only accepts digits", async ({ page }) => {
    await page.goto(BASE_URL);

    const phoneInput = page.locator("#phone-input");

    // Verify maxlength attribute
    await expect(phoneInput).toHaveAttribute("maxlength", "10");

    // Clear and type letters mixed with digits — sanitizer should strip non-digits
    await phoneInput.fill("");
    await phoneInput.pressSequentially("99abc71313", { delay: 50 });

    // After the input event sanitizer runs, only digits should remain
    const value = await phoneInput.inputValue();
    expect(value).toMatch(/^\d+$/);
  });
});
