import { chromium } from "playwright";

const browser = await chromium.launch();
const context = await browser.newContext({ viewport: { width: 1000, height: 500 } });
const page = await context.newPage();
await page.goto("http://localhost:3000/", { waitUntil: "networkidle" });
await page.waitForTimeout(200);
await page.screenshot({ path: "/tmp/temple-screens/border-t0.png", clip: { x: 0, y: 190, width: 1000, height: 60 } });
await page.waitForTimeout(1500);
await page.screenshot({ path: "/tmp/temple-screens/border-t1.png", clip: { x: 0, y: 190, width: 1000, height: 60 } });
await browser.close();
console.log("done");
