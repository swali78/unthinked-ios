import { expect, onboard, test } from "./fixtures";

test("set up matchmaking, connect with a traveler and chat", async ({ page }) => {
  await onboard(page);
  await page.goto("/together");
  await page.getByText("Get matched on your trip").click();

  await expect(page).toHaveURL(/\/together\/setup/);
  await page.getByRole("button", { name: "Show my matches" }).click();
  await expect(page).toHaveURL(/\/together$/);

  // Aisha is the best fit for the default Bali dates and likes you back.
  await page.getByText(/Aisha, 27/).first().click();
  await expect(page).toHaveURL(/\/together\/profile\?id=t1/);
  await expect(page.getByText("Why you match")).toBeVisible();
  await page.getByRole("button", { name: "Connect" }).click();

  const dialog = page.getByRole("dialog", { name: "You matched with Aisha" });
  await expect(dialog).toBeVisible();
  await dialog.getByRole("button", { name: /message/i }).click();

  await expect(page).toHaveURL(/\/together\/chat\?id=t1/);
  await expect(page.getByText(/Saw you're heading to Bali too/)).toBeVisible();
  await page.getByLabel("Message Aisha").fill("Hi! Want to share a villa?");
  await page.getByRole("button", { name: "Send" }).click();
  await expect(page.getByText("Hi! Want to share a villa?")).toBeVisible();
  await expect(page.getByText(/Let's start a group trip/)).toBeVisible({ timeout: 5_000 });

  // The match is listed under chats.
  await page.goto("/together/chats");
  await expect(page.getByRole("link", { name: /Aisha · Bali/ })).toBeVisible();
});

test("start a group trip, plan it and split costs", async ({ page }) => {
  await onboard(page);
  await page.goto("/together/trip?id=g1");
  await expect(page.getByText("Bali villa crew").first()).toBeVisible();

  await page.getByPlaceholder("Suggest something to do").fill("Snorkel at Nusa Penida");
  await page.getByRole("button", { name: "Add idea" }).click();
  await expect(page.getByText("Snorkel at Nusa Penida")).toBeVisible();
  // Your own idea starts with your vote. One vote per person: tapping again takes it back.
  const snorkel = page.getByRole("button", { name: /^Vote for Snorkel at Nusa Penida/ });
  await expect(snorkel).toHaveAttribute("aria-pressed", "true");
  await expect(snorkel).toHaveText("1");
  await snorkel.click();
  await expect(snorkel).toHaveAttribute("aria-pressed", "false");
  await expect(snorkel).toHaveText("0");
  // Someone else's idea: repeated taps never add more than your one vote.
  const trek = page.getByRole("button", { name: /^Vote for Sunrise trek/ });
  await expect(trek).toHaveText("2");
  for (let i = 0; i < 3; i++) await trek.click();
  await expect(trek).toHaveText("3");
  await trek.click();
  await expect(trek).toHaveText("2");

  await page.getByRole("button", { name: "Split costs" }).click();
  // Seed: you paid $900 villa, Aisha paid $45 transfer, split three ways.
  await expect(page.getByText(/Aisha\s*owes\s*You/)).toBeVisible();
  await expect(page.getByText("$270", { exact: true })).toBeVisible();
  await expect(page.getByText("$315", { exact: true })).toBeVisible();

  await page.getByRole("button", { name: /Add (an )?expense/ }).first().click();
  await page.getByPlaceholder(/What was it/).fill("Dinner in Seminyak");
  await page.getByPlaceholder("Amount (USD)").fill("90");
  await expect(page.getByText(/\$30(\.00)? each/)).toBeVisible();
  await page.getByRole("button", { name: "Add expense" }).last().click();
  await expect(page.getByText("Dinner in Seminyak")).toBeVisible();
  // You paid, so each of the others owes $30 more.
  await expect(page.getByText("$300", { exact: true })).toBeVisible();
  await expect(page.getByText("$345", { exact: true })).toBeVisible();

  // Settle Rahul's debt.
  const rahul = page.locator("li").filter({ hasText: /Rahul\s*owes/ });
  await rahul.getByRole("button", { name: "Paid" }).click();
  await expect(page.locator("li").filter({ hasText: /Rahul\s*owes/ })).toHaveCount(0);
});

test("pass on the top card in the discover deck", async ({ page }) => {
  await onboard(page);
  await page.goto("/together");
  // The deck shows two cards; the top one is last in the page.
  const name = page.locator("main").getByText(/^\w+, \d+$/);
  const top = await name.last().textContent();
  await page.getByRole("button", { name: "Pass", exact: true }).click();
  await expect(name.filter({ hasText: top! })).toHaveCount(0);
  await expect(name.last()).not.toHaveText(top!);
});

test("links to missing travelers, chats and trips show a message instead of a blank screen", async ({ page }) => {
  await onboard(page);
  await page.goto("/together/profile?id=nobody");
  await expect(page.getByText("This traveler isn't available any more.")).toBeVisible();
  await page.goto("/together/chat?id=nobody");
  await expect(page.getByText("This conversation isn't available any more.")).toBeVisible();
  await page.goto("/together/trip?id=nope");
  await expect(page.getByText("This trip isn't available any more.")).toBeVisible();
});
