import { chromium } from "playwright";
import { mkdirSync } from "node:fs";

const outDir = "/tmp/temple-screens";
mkdirSync(outDir, { recursive: true });

const pages = [
  { path: "/", name: "home" },
  { path: "/poojas", name: "poojas" },
  { path: "/gallery", name: "gallery" },
  { path: "/booking", name: "booking" },
  { path: "/admin", name: "admin" },
  { path: "/kn", name: "home-kn" },
];

const browser = await chromium.launch();
const context = await browser.newContext({ viewport: { width: 420, height: 900 } });
const page = await context.newPage();

const errors = [];
page.on("console", (msg) => {
  if (msg.type() === "error") errors.push(`[${page.url()}] ${msg.text()}`);
});
page.on("pageerror", (err) => {
  errors.push(`[${page.url()}] pageerror: ${err.message}`);
});

for (const { path, name } of pages) {
  const res = await page.goto(`http://localhost:3000${path}`, { waitUntil: "networkidle" });
  await page.waitForTimeout(300);
  await page.screenshot({ path: `${outDir}/${name}.png`, fullPage: true });
  console.log(`${path} -> status ${res.status()} -> ${outDir}/${name}.png`);
}

await browser.close();

if (errors.length) {
  console.log("\nConsole errors:");
  for (const e of errors) console.log(" -", e);
} else {
  console.log("\nNo console errors.");
}
