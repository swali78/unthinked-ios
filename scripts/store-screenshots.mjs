// Captures App Store / Play Store screenshots from a running build.
//   npm run build && npm start   (in another terminal)
//   npx -y playwright@1 install chromium   (first time only)
//   node scripts/store-screenshots.mjs [http://localhost:3000]
// Writes 1320x2868 PNGs (iPhone 6.9", also accepted by Google Play) to store/screenshots/ios-6.9/.
import { mkdir } from "node:fs/promises";
import { chromium } from "playwright";

const base = process.argv[2] ?? "http://localhost:3000";
const shots = [
  ["01-welcome", "/welcome"],
  ["02-chat", "/chat"],
  ["03-flights", "/flights"],
  ["04-hotels", "/hotels"],
  ["05-visa", "/visa"],
  ["06-together", "/together"],
];

const dir = new URL("../store/screenshots/ios-6.9/", import.meta.url);
await mkdir(dir, { recursive: true });
const browser = await chromium.launch();
const page = await browser.newPage({
  viewport: { width: 440, height: 956 },
  deviceScaleFactor: 3,
  isMobile: true,
  hasTouch: true,
  userAgent: "Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148",
});
for (const [name, path] of shots) {
  await page.goto(base + path, { waitUntil: "networkidle" });
  await page.waitForTimeout(1500);
  await page.screenshot({ path: new URL(name + ".png", dir).pathname });
  console.log("wrote", name);
}
await browser.close();
