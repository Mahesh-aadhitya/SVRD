import { chromium } from "playwright";

const widths = [1280, 1536, 1920];
const browser = await chromium.launch();
for (const width of widths) {
  const context = await browser.newContext({ viewport: { width, height: 900 } });
  const page = await context.newPage();
  await page.goto("http://localhost:3000/", { waitUntil: "networkidle" });
  await page.waitForTimeout(250);
  await page.screenshot({ path: `/tmp/temple-screens/bp-${width}.png` });
  await context.close();
  console.log(`captured ${width}`);
}
await browser.close();
