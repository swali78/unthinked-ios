import { expect, onboard, test } from "./fixtures";
import { whitePng } from "./png";

const inDays = (n: number) => {
  const d = new Date();
  d.setDate(d.getDate() + n);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};

test("check visa rules and apply for an eVisa", async ({ page }) => {
  await onboard(page);
  await page.goto("/visa?country=Egypt");
  await page.getByRole("link", { name: /Apply online/ }).click();
  await expect(page).toHaveURL(/\/visa\/apply\?.*country=Egypt/);
  const next = page.getByRole("button", { name: "Continue" });

  // 1. Personal details
  await page.getByLabel("First name").fill("Khalid");
  await page.getByLabel("Last name").fill("Rahman");
  await page.getByLabel("Date of birth").fill("1994-03-18");
  await page.getByLabel("Email for your e-visa").fill("khalid@example.com");
  await next.click();

  // 2. Passport: the scan fills the number and expiry.
  await page.locator('input[type="file"]').first().setInputFiles({ name: "passport.png", mimeType: "image/png", buffer: whitePng(800, 560) });
  await expect(page.getByText("Details read from your passport")).toBeVisible({ timeout: 10_000 });
  await expect(page.getByLabel("Passport number")).toHaveValue("Z1234567");
  await next.click();

  // 3. Photo: too small first, then a good one.
  await page.getByLabel("Upload visa photo").setInputFiles({ name: "small.png", mimeType: "image/png", buffer: whitePng(300, 300) });
  await next.click();
  await expect(page.getByText(/This photo is too small/)).toBeVisible();
  await page.getByLabel("Upload visa photo").setInputFiles({ name: "me.png", mimeType: "image/png", buffer: whitePng(640, 640) });
  await next.click();

  // 4. Travel
  await page.getByLabel("Arrival").fill(inDays(14));
  await page.getByLabel("Departure").fill(inDays(20));
  await page.getByLabel("Address in destination").fill("Cairo Marriott, Zamalek");
  await next.click();

  // 5. Review and pay
  await page.getByRole("checkbox").check();
  await page.getByRole("button", { name: /^Pay \$/ }).click();
  await page.getByRole("button", { name: "Track application" }).click();
  await expect(page).toHaveURL(/\/visa\/status\?id=V\w+/);
  await expect(page.getByText("Submitted").first()).toBeVisible();
});

test("visa application validates each step before moving on", async ({ page }) => {
  await onboard(page);
  await page.goto("/visa/apply?country=Egypt&nationality=India");
  // Details are prefilled from the profile; clear them.
  await page.getByLabel("First name").fill("");
  await page.getByLabel("Email for your e-visa").fill("");
  await page.getByRole("button", { name: "Continue" }).click();
  await expect(page.getByText("Enter your first name.")).toBeVisible();
  await expect(page.getByText("Enter an email for your e-visa.")).toBeVisible();
  await expect(page.getByText(/Step 1 of 5/)).toBeVisible();
});

test("UK passports see visa-free entry to Japan", async ({ page }) => {
  await onboard(page);
  await page.goto("/visa");
  await page.getByLabel("My passport").selectOption("United Kingdom");
  await page.getByLabel("Travelling to").selectOption("Japan");
  await expect(page.getByText("United Kingdom passport → Japan")).toBeVisible();
  await expect(page.getByText(/Visa-free/).first()).toBeVisible();
});
