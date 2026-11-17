// Play each scenario in Chromium through the test hook's touch entry points
// (the ones the pointer listeners call) and record the text shown after
// every gesture, in touch wording. The iOS tests replay the same gestures
// with real touches and must see the same text.
// Usage: node expected.mjs <repo> <out.json>
import { createRequire } from "node:module";
import { writeFileSync } from "node:fs";
import { pathToFileURL } from "node:url";
import * as path from "node:path";

const [repo, out] = process.argv.slice(2);
const { chromium } = createRequire(path.join(repo, "package.json"))("@playwright/test");

// The scenarios: name -> list of gestures (viewBox x positions). "back" and
// "restart" are button taps. A number past 400 means past the right edge.
const scenarios = {
    fullPerformance: [[5, 30, 60], [60, 80, 96], [96, 120, 150], [150, 190, 210]],
    alternativeView: [[5, 60], [60, 96], [96, 150], [150, 160], [300]],
    hiatus: [[5, 60], [60, 96], [96, 150], [150, 250]],
    firstSoundTooLong: [[5, 90, 180]],
    firstSoundReachesFinger: [[80]],
    pastRightEdge: [[5, 200, 440]],
    refusedOnset: [[5, 60], [60, 40]],
    backAndRestart: [[5, 60], [60, 96], [96, 150], "back", "back", "restart"],
};

const browser = await chromium.launch();
const page = await browser.newPage({ hasTouch: true, isMobile: true, viewport: { width: 402, height: 874 } });
await page.route(/fonts\.(googleapis|gstatic)\.com/, (r) => r.abort());
await page.goto(pathToFileURL(path.join(repo, "build", "meter-rhythm.html")).href);
await page.waitForFunction(() => window.__mr !== undefined);

const result = {};
for (const [name, gestures] of Object.entries(scenarios)) {
    const steps = await page.evaluate((gs) => {
        const mr = window.__mr;
        mr.restart();
        const texts = () => {
            const s = mr.snapshot();
            return { commentary: s.commentary, instructions: s.instructions, message: s.message };
        };
        const out = [{ gesture: "start", ...texts() }];
        for (const g of gs) {
            if (g === "back") mr.back();
            else if (g === "restart") mr.restart();
            else {
                // A gesture: finger down at the first x, drag through the
                // rest, lift at the last. The page clamps past the edge.
                const xs = g.map((x) => Math.min(400, x));
                mr.touchDown(xs[0]);
                for (const x of xs.slice(1)) mr.touchMove(x);
                mr.touchUp(xs[xs.length - 1]);
            }
            out.push({ gesture: g, ...texts() });
        }
        return out;
    }, gestures);
    result[name] = steps;
}
await browser.close();
writeFileSync(out, JSON.stringify(result, null, 2));
for (const [n, s] of Object.entries(result)) console.log(n, s.map((x) => x.message).join(" "));
