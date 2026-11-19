import { expect, onboard, test } from "./fixtures";

test("book a stay from search to confirmation", async ({ page }) => {
  await onboard(page);
  await page.goto("/hotels");
  await page.getByRole("button", { name: "Bali", exact: true }).click();
  await page.getByRole("button", { name: "Search stays" }).click();

  await expect(page).toHaveURL(/\/hotels\/results\?.*city=Bali/);
  await expect(page.getByText(/\d+ stays in Bali/)).toBeVisible();
  await page.locator("main article").first().getByRole("button").first().click();

  await expect(page).toHaveURL(/\/hotels\/detail\?.*id=/);
  await page.getByRole("radiogroup", { name: "Room" }).getByRole("radio").nth(1).click();
  await page.getByRole("button", { name: "Reserve" }).click();

  await expect(page).toHaveURL(/\/hotels\/checkout/);
  await page.getByLabel("Full name").fill("Khalid Rahman");
  await page.getByLabel("Email for confirmation").fill("khalid@example.com");
  await page.getByRole("button", { name: /^Pay \$/ }).click();
  await expect(page.getByText(/Reserved\. Confirmation \w+ is on its way to khalid@example\.com/)).toBeVisible({ timeout: 10_000 });

  await page.goto("/trips");
  await expect(page.getByText("Nothing booked yet")).toHaveCount(0);
  await expect(page.getByText(/Bali/).first()).toBeVisible();
});

test("checkout asks for a full name and a valid email", async ({ page }) => {
  await onboard(page);
  await page.goto("/hotels/results?city=Bali");
  await page.locator("main article").first().getByRole("button").first().click();
  await page.getByRole("button", { name: "Reserve" }).click();
  await page.getByLabel("Full name").fill("Khalid");
  await page.getByLabel("Email for confirmation").fill("not-an-email");
  await page.getByRole("button", { name: /^Pay \$/ }).click();
  await expect(page.getByText("Enter a first and last name.")).toBeVisible();
  await expect(page.getByText("Enter a valid email for the confirmation.")).toBeVisible();
  await expect(page.getByText(/Reserved\. Confirmation/)).toHaveCount(0);
});
