import { chromium } from "playwright";

const browser = await chromium.launch();
const context = await browser.newContext({ viewport: { width: 420, height: 900 } });
const page = await context.newPage();

await page.goto("http://localhost:3000/", { waitUntil: "networkidle" });
await page.screenshot({ path: "/tmp/temple-screens/home-viewport-top.png" });
await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
await page.waitForTimeout(200);
await page.screenshot({ path: "/tmp/temple-screens/home-viewport-bottom.png" });

await browser.close();
console.log("done");
