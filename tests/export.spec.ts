import { test, expect } from "./harness";

/**
 * The commentary's *emphasis* markers, and the "Save SVG" output: the
 * drawing with the commentary set as a caption below it.
 */

// Onset 0, first sound to 60, second 96-150, third at 210: a deceleration.
const decelerate = async (app: any) => {
    await app.twoSounds(60, 96, 150);
    await app.click(210);
};

test("emphasized words are bold on the page, without asterisks", async ({ app }) => {
    await decelerate(app);
    const commentary = app.page.locator("#commentary");
    await expect(commentary.locator("strong")).toHaveText("deceleration");
    await expect(commentary).not.toContainText("*");
});

test.describe("saved SVG", () => {
    /** Load the exported SVG into the page so the browser can measure it. */
    const loadExport = async (app: any) => {
        return app.page.evaluate(() => {
            const src: string = (window as any).__mr.exportSvg();
            const host = document.createElement("div");
            host.innerHTML = src;
            document.body.appendChild(host);
            const svg = host.querySelector("svg")!;
            const caption = svg.querySelector('[data-role="caption"]') as SVGGraphicsElement;
            const b = caption.getBBox();
            const box = { x: b.x, y: b.y, width: b.width, height: b.height };
            const viewBox = svg.getAttribute("viewBox")!.split(" ").map(Number);
            const bold = [...caption.querySelectorAll('tspan[font-weight="bold"]')]
                .map((t) => t.textContent);
            const text = [...caption.querySelectorAll("text")]
                .map((t) => t.textContent).join(" ");
            host.remove();
            return { box, viewBox, bold, text };
        });
    };

    test("carries the commentary as a caption, with emphasis in bold", async ({ app }) => {
        await decelerate(app);
        const s = await app.state();
        const out = await loadExport(app);
        expect(out.text).toBe(s.commentary.replace(/\s+/g, " "));
        expect(out.bold).toEqual(["deceleration"]);
        expect(out.text).not.toContain("*");
    });

    test("the caption wraps inside the frame, below the drawing", async ({ app }) => {
        await decelerate(app);
        const { VIEWBOX_W, VIEWBOX_H } = await app.page.evaluate(
            () => (window as any).__mr.constants);
        const { box, viewBox } = await loadExport(app);
        expect(box.x).toBeGreaterThanOrEqual(0);
        expect(box.x + box.width).toBeLessThanOrEqual(VIEWBOX_W);
        expect(box.y).toBeGreaterThanOrEqual(VIEWBOX_H);
        expect(box.y + box.height).toBeLessThanOrEqual(viewBox[3]);
        expect(box.height).toBeGreaterThan(20); // more than one line
    });

    test("does not change the drawing on screen", async ({ app }) => {
        await decelerate(app);
        const before = await app.svg();
        await app.page.evaluate(() => (window as any).__mr.exportSvg());
        expect(await app.svg()).toBe(before);
    });
});
