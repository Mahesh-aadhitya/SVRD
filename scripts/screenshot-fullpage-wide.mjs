import { chromium } from "playwright";

const browser = await chromium.launch();
const context = await browser.newContext({ viewport: { width: 1920, height: 1000 } });
const page = await context.newPage();
await page.goto("http://localhost:3000/", { waitUntil: "networkidle" });
await page.waitForTimeout(300);
await page.screenshot({ path: "/tmp/temple-screens/home-fullpage-wide.png", fullPage: true });
await browser.close();
console.log("done");
