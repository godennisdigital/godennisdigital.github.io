import { mkdir, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { launch } from "chrome-launcher";
import { chromium } from "playwright";
import lighthouse from "lighthouse";
import { startSiteServer } from "./static-server.mjs";

const reportDirectory = resolve("lighthouse-reports");
const categories = ["performance", "accessibility", "best-practices", "seo"];
const scoreThresholds = {
  performance: { desktop: 0.65, mobile: 0.45 },
  accessibility: { desktop: 0.9, mobile: 0.9 },
  "best-practices": { desktop: 0.9, mobile: 0.9 },
  seo: { desktop: 0.9, mobile: 0.9 }
};

await mkdir(reportDirectory, { recursive: true });
const server = await startSiteServer(0);
const { port: serverPort } = server.address();
let failed = false;
let chrome;

try {
  chrome = await launch({
    chromePath: chromium.executablePath(),
    chromeFlags: ["--headless", "--no-sandbox", "--disable-dev-shm-usage"],
    port: 0
  });

  for (const formFactor of ["desktop", "mobile"]) {
    const config = {
      extends: "lighthouse:default",
      settings: {
        formFactor,
        onlyCategories: categories,
        screenEmulation: formFactor === "desktop"
          ? { mobile: false, width: 1350, height: 940, deviceScaleFactor: 1, disabled: false }
          : { mobile: true, width: 390, height: 844, deviceScaleFactor: 2, disabled: false }
      }
    };
    const result = await lighthouse(`http://127.0.0.1:${serverPort}/`, {
      port: chrome.port,
      output: "json",
      logLevel: "error",
    }, config);

    const reportPath = resolve(reportDirectory, `lighthouse-${formFactor}.json`);
    await writeFile(reportPath, result.report, "utf8");

    const scores = Object.fromEntries(categories.map((category) => [category, result.lhr.categories[category].score]));
    console.log(`${formFactor}: ${Object.entries(scores).map(([category, score]) => `${category}=${score === null ? "n/a" : Math.round(score * 100)}`).join(" ")}`);
    console.log(`Report: ${reportPath}`);

    for (const [category, score] of Object.entries(scores)) {
      if (score === null || score < scoreThresholds[category][formFactor]) {
        console.error(`${formFactor} ${category} score is below the ${scoreThresholds[category][formFactor] * 100} threshold.`);
        failed = true;
      }
    }
  }
} finally {
  await chrome?.kill();
  await new Promise((resolveClose, rejectClose) => server.close((error) => error ? rejectClose(error) : resolveClose()));
}

if (failed) process.exitCode = 1;