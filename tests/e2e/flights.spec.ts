import { expect, onboard, test } from "./fixtures";

test("book a flight from search to confirmation", async ({ page }) => {
  await onboard(page);
  await page.goto("/flights");
  await page.getByRole("button", { name: "Bali" }).click();
  await expect(page.getByRole("button", { name: /^To Bali/ })).toBeVisible();
  await page.getByRole("button", { name: "Search flights" }).click();

  await expect(page).toHaveURL(/\/flights\/results\?.*to=DPS/);
  await expect(page.getByText("DXB → DPS")).toBeVisible();
  await page.locator("main").getByRole("button").filter({ hasText: /\$\d/ }).filter({ hasText: /DPS/ }).first().click();

  await expect(page).toHaveURL(/\/flights\/details/);
  await page.getByRole("radiogroup", { name: "Fare" }).getByRole("radio").nth(1).click();
  await page.getByRole("button", { name: "Choose seats" }).click();

  await expect(page).toHaveURL(/\/flights\/seats/);
  // The classic fare includes standard seats, so a free one is always on offer.
  const seat = page.getByRole("button", { name: /^Seat \d+[A-F], free$/ }).first();
  const seatId = (await seat.getAttribute("aria-label"))!.match(/Seat (\w+)/)![1];
  await seat.click();
  await expect(page.getByText(`1/1 selected · ${seatId}`)).toBeVisible();
  await expect(page.getByText("No seat fees")).toBeVisible();
  await page.getByRole("button", { name: "Continue" }).click();

  await expect(page).toHaveURL(/\/flights\/passengers/);
  // The first passenger is prefilled from the saved profile.
  await page.getByRole("button", { name: "Review and pay" }).click();

  await expect(page).toHaveURL(/\/flights\/checkout/);
  await page.getByRole("button", { name: /^Pay \$/ }).click();
  await expect(page.getByText(/You're booked\. Booking reference \w+/)).toBeVisible({ timeout: 10_000 });

  // The booking shows up in trips and the wallet.
  await page.goto("/trips");
  await expect(page.getByText(/Bali|DPS/).first()).toBeVisible();
  await expect(page.getByText("Nothing booked yet")).toHaveCount(0);
  await page.goto("/wallet");
  await expect(page.getByText("Your wallet is empty")).toHaveCount(0);
});

test("passenger form blocks a passport that expires too soon", async ({ page }) => {
  await onboard(page);
  await page.goto("/flights/results?from=DXB&to=DPS&date=2026-12-04&pax=1&cabin=Economy");
  await page.locator("main").getByRole("button").filter({ hasText: /\$\d/ }).filter({ hasText: /DPS/ }).first().click();
  await page.getByRole("button", { name: "Choose seats" }).click();
  await page.getByRole("button", { name: "Assign at check-in" }).click();
  await expect(page).toHaveURL(/\/flights\/passengers/);
  await page.getByLabel(/expiry/i).first().fill("2027-01-01");
  await page.getByRole("button", { name: "Review and pay" }).click();
  await expect(page.getByText("Must be valid 6 months after travel.")).toBeVisible();
  await expect(page).toHaveURL(/\/flights\/passengers/);
});

test("an unknown route explains what went wrong", async ({ page }) => {
  await onboard(page);
  await page.goto("/flights/results?from=DXB&to=Atlantis&date=2026-12-04&pax=1&cabin=Economy");
  await expect(page.getByText("We couldn't search that route")).toBeVisible();
  await page.getByRole("button", { name: "Change search" }).click();
  await expect(page).toHaveURL(/\/flights$/);
});
