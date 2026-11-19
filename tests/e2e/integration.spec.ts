import type { Browser, Page } from "@playwright/test";
import { expect, onboard, test } from "./fixtures";

/**
 * The app and the backend working together: these tests sign in for real,
 * then check both the screens and what the API has stored.
 */

const PASSWORD = "correct horse battery";
const newEmail = (tag: string) => `${tag}-${Date.now().toString(36)}-${Math.floor(Math.random() * 1e6)}@example.com`;

async function signUp(page: Page, email: string, name = "Swali") {
  await page.goto("/account");
  await page.getByLabel("Name").fill(name);
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password, at least 8 characters").fill(PASSWORD);
  await page.getByRole("button", { name: "Create account" }).click();
  await expect(page).toHaveURL(/\/profile$/);
  await expect(page.getByText("Synced to your account")).toBeVisible();
}

async function signIn(page: Page, email: string) {
  await page.goto("/account");
  await page.getByRole("button", { name: "Already have an account? Sign in" }).click();
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password", { exact: true }).fill(PASSWORD);
  await page.getByRole("button", { name: "Sign in", exact: true }).click();
  await expect(page).toHaveURL(/\/profile$/);
  await expect(page.getByText("Synced to your account")).toBeVisible();
}

/** A second device: a separate browser with its own storage and cookies. */
async function otherDevice(browser: Browser) {
  const context = await browser.newContext({ timezoneId: "Asia/Dubai", locale: "en-GB" });
  const page = await context.newPage();
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await onboard(page);
  return { page, errors, close: () => context.close() };
}

type ServerGroup = { id: string; title: string; plan: { id: string; title: string; votes: number; votedByMe: boolean }[] };
type ServerState = { matches: string[]; chats: Record<string, { from: string; text: string }[]>; groups: ServerGroup[] };
const serverState = async (page: Page) => {
  const res = await page.request.get("/api/v1/together");
  expect(res.status()).toBe(200);
  return (await res.json()) as ServerState;
};

test("the API turns away requests without a session", async ({ request }) => {
  expect((await request.get("/api/v1/health")).status()).toBe(200);
  for (const path of ["/me", "/together", "/bookings", "/visa-applications"]) {
    expect((await request.get(`/api/v1${path}`)).status(), path).toBe(401);
  }
});

test("sign-up form shows the server's validation errors", async ({ page }) => {
  await onboard(page);
  const email = newEmail("dupe");
  await signUp(page, email);
  await page.getByRole("link", { name: /Synced to your account/ }).click();
  await page.getByRole("button", { name: /sign out/i }).click();
  await expect(page.getByText("Create an account")).toBeVisible();

  // The same email can't be used twice.
  await page.goto("/account");
  await page.getByLabel("Name").fill("Someone");
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password, at least 8 characters").fill(PASSWORD);
  await page.getByRole("button", { name: "Create account" }).click();
  await expect(page).toHaveURL(/\/account$/);
  await expect(page.getByRole("alert").filter({ hasText: "There's already an account with that email." })).toBeVisible();

  // A wrong password doesn't sign in.
  await page.getByRole("button", { name: "Already have an account? Sign in" }).click();
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password", { exact: true }).fill("not the password");
  await page.getByRole("button", { name: "Sign in", exact: true }).click();
  await expect(page).toHaveURL(/\/account$/);
  await expect(page.getByRole("alert")).toBeVisible();
  expect((await page.request.get("/api/v1/me")).status()).toBe(401);
});

test("matches, chats and trip votes are saved to the account and show on another device", async ({ page, browser }) => {
  test.setTimeout(60_000);
  await onboard(page);
  const email = newEmail("match");
  await signUp(page, email);

  // Match with Aisha. The server makes the match and sends her greeting.
  await page.goto("/together/setup");
  await page.getByRole("button", { name: "Show my matches" }).click();
  await expect(page).toHaveURL(/\/together$/);
  await page.goto("/together/profile?id=t1");
  await page.getByRole("button", { name: "Connect" }).click();
  const dialog = page.getByRole("dialog", { name: "You matched with Aisha" });
  await expect(dialog).toBeVisible();
  await dialog.getByRole("button", { name: /message/i }).click();
  await expect(page).toHaveURL(/\/together\/chat\?id=t1/);
  await expect(page.getByText(/Saw you're heading to Bali too/)).toBeVisible();

  await page.getByLabel("Message Aisha").fill("Shall we share the villa?");
  await page.getByRole("button", { name: "Send" }).click();
  await expect(page.getByText("Shall we share the villa?")).toBeVisible();
  await expect(page.getByText(/Let's start a group trip/)).toBeVisible({ timeout: 10_000 });

  await expect.poll(async () => (await serverState(page)).matches).toContain("t1");
  const chat = (await serverState(page)).chats.t1.map((m) => `${m.from}: ${m.text}`);
  expect(chat).toEqual(expect.arrayContaining(["me: Shall we share the villa?", expect.stringMatching(/^t1: Love it/)]));

  // The starter group trip: one vote per person, stored on the server.
  const group = (await serverState(page)).groups.find((g) => g.title === "Bali villa crew")!;
  expect(group).toBeTruthy();
  const trek = group.plan.find((p) => p.title === "Sunrise trek on Mount Batur")!;
  expect(trek).toMatchObject({ votes: 2, votedByMe: false });
  await page.goto(`/together/trip?id=${group.id}`);
  const vote = page.getByRole("button", { name: /^Vote for Sunrise trek/ });
  await expect(vote).toHaveText("2");
  for (let i = 0; i < 3; i++) await vote.click();
  await expect(vote).toHaveText("3");
  await expect
    .poll(async () => (await serverState(page)).groups.find((g) => g.id === group.id)!.plan.find((p) => p.id === trek.id))
    .toMatchObject({ votes: 3, votedByMe: true });

  // Add an expense; it survives a reload because it's on the server.
  await page.getByRole("button", { name: "Split costs" }).click();
  await page.getByRole("button", { name: /Add (an )?expense/ }).first().click();
  await page.getByPlaceholder(/What was it/).fill("Scooter rental");
  await page.getByPlaceholder("Amount (USD)").fill("60");
  await page.getByRole("button", { name: "Add expense" }).last().click();
  await expect(page.getByText("Scooter rental")).toBeVisible();
  await page.reload();
  await page.getByRole("button", { name: "Split costs" }).click();
  await expect(page.getByText("Scooter rental")).toBeVisible();

  // Another phone, same account: everything is there.
  const other = await otherDevice(browser);
  await signIn(other.page, email);
  await other.page.goto("/together/chats");
  await expect(other.page.getByRole("link", { name: /Aisha · Bali/ })).toBeVisible();
  await other.page.goto("/together/chat?id=t1");
  await expect(other.page.getByText("Shall we share the villa?")).toBeVisible();
  await other.page.goto(`/together/trip?id=${group.id}`);
  const otherVote = other.page.getByRole("button", { name: /^Vote for Sunrise trek/ });
  await expect(otherVote).toHaveText("3");
  await expect(otherVote).toHaveAttribute("aria-pressed", "true");
  // Taking the vote back on this device updates the server.
  await otherVote.click();
  await expect(otherVote).toHaveText("2");
  await expect
    .poll(async () => (await serverState(other.page)).groups.find((g) => g.id === group.id)!.plan.find((p) => p.id === trek.id)!.votes)
    .toBe(2);
  expect(other.errors).toEqual([]);
  await other.close();
});

test("a stay booked before signing up moves into the new account", async ({ page, browser }) => {
  test.setTimeout(60_000);
  await onboard(page);

  // Book while signed out: saved on this device only.
  await page.goto("/hotels/results?city=Bali");
  await page.locator("main article").first().getByRole("button").first().click();
  await page.getByRole("button", { name: "Reserve" }).click();
  await page.getByLabel("Full name").fill("Swali Hafiz");
  await page.getByLabel("Email for confirmation").fill("swali@example.com");
  await page.getByRole("button", { name: /^Pay \$/ }).click();
  await expect(page.getByText(/Reserved\. Confirmation (\w+)/)).toBeVisible({ timeout: 10_000 });
  const ref = (await page.getByText(/Reserved\. Confirmation \w+/).textContent())!.match(/Confirmation (\w+)/)![1];

  // Sign up: the booking is uploaded.
  const email = newEmail("stay");
  await signUp(page, email);
  await expect
    .poll(async () => ((await (await page.request.get("/api/v1/bookings")).json()) as { bookings: { id: string }[] }).bookings.map((b) => b.id))
    .toContain(ref);

  // And it shows up on another device after signing in.
  const other = await otherDevice(browser);
  await other.page.goto("/trips");
  await expect(other.page.getByText("Nothing booked yet")).toBeVisible();
  await signIn(other.page, email);
  await other.page.goto("/trips");
  await expect(other.page.getByText("Nothing booked yet")).toHaveCount(0);
  await expect(other.page.getByText(/Bali/).first()).toBeVisible();
  expect(other.errors).toEqual([]);
  await other.close();
});

test("signing out goes back to the data on this device", async ({ page }) => {
  await onboard(page);
  await signUp(page, newEmail("signout"));
  await page.goto("/together/profile?id=t4");
  await page.getByRole("button", { name: "Connect" }).click();
  await expect(page.getByRole("dialog", { name: "You matched with Lucas" })).toBeVisible();

  await page.goto("/account");
  await page.getByRole("button", { name: /sign out/i }).click();
  await expect(page.getByText("Create an account")).toBeVisible();
  expect((await page.request.get("/api/v1/me")).status()).toBe(401);

  // The account's match isn't shown once signed out.
  await page.goto("/together/chats");
  await expect(page.getByText("No matches yet")).toBeVisible();
});
