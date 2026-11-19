import { test as base, expect, type Page } from "@playwright/test";

/** Skip the welcome screens by marking this device as onboarded. */
export async function onboard(page: Page) {
  await page.goto("/welcome");
  await page.getByRole("button", { name: "Skip" }).click();
  await page.getByRole("button", { name: "Continue as Khalid" }).click();
  await expect(page).toHaveURL(/\/$/);
}

/** Fails the test on any uncaught error in the page. */
export const test = base.extend<{ pageErrors: Error[] }>({
  pageErrors: [
    async ({ page }, use) => {
      const errors: Error[] = [];
      page.on("pageerror", (e) => errors.push(e));
      await use(errors);
      expect(errors.map((e) => e.message), "uncaught errors in the page").toEqual([]);
    },
    { auto: true },
  ],
});

export { expect };
