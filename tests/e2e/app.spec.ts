import { expect, onboard, test } from "./fixtures";

const ROUTES = [
  "/", "/chat", "/explore", "/plan", "/profile", "/trips", "/wallet",
  "/flights", "/flights/results?from=DXB&to=DPS&date=2026-12-04&pax=1&cabin=Economy",
  "/flights/details", "/flights/seats", "/flights/passengers", "/flights/checkout",
  "/hotels", "/hotels/results?city=Bali", "/hotels/detail", "/hotels/checkout",
  "/visa", "/visa/apply", "/visa/status",
  "/together", "/together/setup", "/together/chats", "/together/chat", "/together/profile", "/together/trip",
];

test("first visit goes through the welcome screens", async ({ page }) => {
  await page.goto("/");
  await expect(page).toHaveURL(/\/welcome$/);
  await page.getByRole("button", { name: "Next" }).click();
  await page.getByRole("button", { name: "Next" }).click();
  await page.getByRole("button", { name: "Sign in" }).click();
  await page.getByLabel("Your first name").fill("Swali");
  await page.getByRole("button", { name: "Get started" }).click();
  await expect(page).toHaveURL(/\/$/);
  await expect(page.getByText(/Swali/).first()).toBeVisible();
  // Once onboarded, home stays home.
  await page.reload();
  await expect(page).toHaveURL(/\/$/);
});

test("every screen loads without errors and fits the screen width", async ({ page }) => {
  test.setTimeout(90_000);
  await onboard(page);
  for (const route of ROUTES) {
    const res = await page.goto(route);
    expect(res?.status(), route).toBe(200);
    await expect(page.locator("body"), route).not.toBeEmpty();
    await expect(page.locator("h1, h2, p").first(), route).toBeVisible();
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
    expect(overflow, `${route} scrolls sideways`).toBeLessThanOrEqual(0);
  }
});

test("the assistant answers a flight question with flight cards", async ({ page }) => {
  await onboard(page);
  await page.goto(`/chat?q=${encodeURIComponent("Flights from Dubai to Bali next month")}`);
  await expect(page.getByText(/DXB|Dubai/).first()).toBeVisible();
  await expect(page.getByText(/\$\d/).first()).toBeVisible({ timeout: 15_000 });
});

test("the assistant answers a visa question", async ({ page }) => {
  await onboard(page);
  await page.goto("/chat");
  await page.getByRole("button", { name: "Do I need a visa for Japan?" }).click();
  await expect(page.getByText(/eVisa|visa/i).nth(1)).toBeVisible({ timeout: 15_000 });
  await expect(page.getByText(/Japan/).nth(1)).toBeVisible();
});

test("tab bar moves between the main sections", async ({ page }) => {
  await onboard(page);
  await page.goto("/trips");
  for (const [tab, url] of [["Explore", /\/explore/], ["Wallet", /\/wallet/], ["Profile", /\/profile/], ["Trips", /\/trips/], ["Home", /\/$/]] as const) {
    await page.getByRole("link", { name: tab, exact: true }).click();
    await expect(page).toHaveURL(url);
  }
});
