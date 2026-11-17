import { test, expect, normalizeSvg } from "./harness";
import * as fs from "node:fs";
import * as path from "node:path";

/**
 * Golden snapshots of the drawing, plus PNG artifacts for human review.
 *
 * The assertion is on the serialized SVG, not on pixels: it is deterministic
 * across machines and a reviewer can read a changed `d` attribute and judge
 * whether it is right. The PNGs under screenshots/ are for eyeballing the
 * whole scenario space against Hasty's figures; they are not asserted on.
 */

const SHOTS = path.resolve(__dirname, "..", "screenshots");

type Scene = [slug: string, title: string, build: (app: any) => Promise<void>];

export const SCENES: Scene[] = [
    ["01-opening", "Opening: an empty timeline",
        async () => {}],
    ["02-first-sound-growing", "The first sound accumulates projective potential",
        async (a) => { await a.click(0); await a.move(60); }],
    ["03-first-sound-indeterminate", "The first sound passes Lim and loses it",
        async (a) => { await a.click(0); await a.move(200); }],
    ["04-first-sound-ended", "The first sound ends, mensurally determinate",
        async (a) => { await a.firstSound(60); }],
    ["05-first-silence", "The silence carries the arc onward",
        async (a) => { await a.firstSound(60); await a.move(90); }],
    ["06-second-onset", "The second sound realizes the first projection",
        async (a) => { await a.firstSound(60); await a.move(96); await a.click(96); }],
    ["07-projection-denied", "The second sound exceeds the projection: X",
        async (a) => { await a.firstSound(60); await a.click(96); await a.move(210); }],
    ["08-two-sounds", "Two sounds, the projection intact",
        async (a) => { await a.twoSounds(60, 96, 150); }],
    ["09-second-silence", "The second arc grows through the silence",
        async (a) => { await a.twoSounds(60, 96, 150); await a.move(180); }],
    ["10-acceleration", "Third sound earlier than projected: accelerando",
        async (a) => { await a.twoSounds(60, 96, 150); await a.click(175); }],
    ["11-exact-realization", "Third sound exactly as projected",
        async (a) => { await a.twoSounds(60, 96, 150); await a.click(192); }],
    ["12-deceleration", "Third sound slightly later: rallentando",
        async (a) => { await a.twoSounds(60, 96, 150); await a.click(210); }],
    ["13-new-projection", "Third sound somewhat later: a new projection",
        async (a) => { await a.twoSounds(60, 80, 130); await a.click(205); }],
    ["14-hiatus", "Third sound much later: hiatus",
        async (a) => { await a.twoSounds(60, 96, 150); await a.click(250); }],
    ["15-parenthesized", "A hypothetical beginning, in parentheses",
        async (a) => { await a.twoSounds(60, 96, 150); await a.click(160); }],
    ["16-alternative-view", "The alternative reading, with an accent",
        async (a) => { await a.twoSounds(60, 96, 150); await a.click(160); await a.click(300); }],
];

test.beforeAll(() => fs.mkdirSync(SHOTS, { recursive: true }));

for (const [slug, title, build] of SCENES) {
    test(`${slug}: ${title}`, async ({ app }) => {
        await build(app);
        await app.assertNoErrors();

        expect(normalizeSvg(await app.svg())).toMatchSnapshot(`${slug}.svg`);

        await app.page.locator("#svgContainer").screenshot({
            path: path.join(SHOTS, `${slug}.png`),
        });
    });
}

test("contact sheet", async ({ app }) => {
    // A single page showing every scenario, for comparing against the book.
    const rows = SCENES.map(
        ([slug, title]) =>
            `<figure><img src="${slug}.png" alt="${title}">` +
            `<figcaption>${slug.replace(/^\d+-/, "")} — ${title}</figcaption></figure>`
    ).join("\n");

    fs.writeFileSync(
        path.join(SHOTS, "index.html"),
        `<!doctype html><meta charset="utf-8"><title>Meter as Rhythm — scenarios</title>
<style>
 body{font:14px/1.5 Georgia,serif;background:#f5f0e8;color:#2a2520;margin:0;padding:2rem}
 h1{font-size:1.3rem;color:#8b4513}
 figure{margin:0 0 1.5rem;background:#faf8f4;border:1px solid #c8bfb0;border-radius:4px;padding:.5rem}
 img{display:block;width:100%;height:auto}
 figcaption{font-size:.85rem;font-style:italic;color:#6b5e50;padding-top:.4rem}
 .grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(420px,1fr));gap:1rem}
</style>
<h1>Meter as Rhythm — rendered scenarios</h1>
<div class="grid">${rows}</div>`
    );
    expect(fs.existsSync(path.join(SHOTS, "index.html"))).toBe(true);
});
