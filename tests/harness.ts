import { test as base, expect, CDPSession, Page } from "@playwright/test";
import * as path from "node:path";
import { pathToFileURL } from "node:url";

export const PAGE_URL = pathToFileURL(
    path.resolve(__dirname, "..", "build", "meter-rhythm.html")
).href;

export interface Box {
    x: number; y: number; width: number; height: number;
    right: number; bottom: number; text?: string;
}

/** The state of the performance, from window.__mr.snapshot() (src/debug.ts). */
export interface Snapshot {
    /** The committed points: each sound's onset, then its end. */
    times: number[];
    phase: string;
    arc: "first" | "second" | null;
    arcReach: number | null;
    drawnEnds: (number | null)[];
    crossedOut: number | null;
    thirdOnset: string | null;
    message: string;
    refused: boolean;
    instructions: string;
    commentary: string;
}

/** The interonset limit "Lim": 400/3, integer-divided. */
export const LIM = 133;

export class App {
    constructor(readonly page: Page) {}

    /** Click at an exact viewBox x, bypassing pixel rounding. */
    async click(x: number): Promise<void> {
        await this.page.evaluate((v) => (window as any).__mr.click(v), x);
    }

    /** Move to an exact viewBox x. */
    async move(x: number): Promise<void> {
        await this.page.evaluate((v) => (window as any).__mr.move(v), x);
    }

    /** Move through a sequence of positions, as a real drag would. */
    async moveThrough(...xs: number[]): Promise<void> {
        for (const x of xs) await this.move(x);
    }

    async back(): Promise<void> {
        await this.page.evaluate(() => (window as any).__mr.back());
    }

    async restart(): Promise<void> {
        await this.page.evaluate(() => (window as any).__mr.restart());
    }

    async state(): Promise<Snapshot> {
        return this.page.evaluate(() => (window as any).__mr.snapshot());
    }

    async svg(): Promise<string> {
        return this.page.evaluate(() => (window as any).__mr.svg());
    }

    /**
     * Sample a path's real rendered geometry using the browser's own SVG
     * engine. This is the point of testing in a real browser: it checks
     * where the curve actually goes, not what the `d` string says.
     */
    async samplePath(d: string, t: number): Promise<{ x: number; y: number; len: number }> {
        return this.page.evaluate((a) => {
            const [dStr, frac] = a as [string, number];
            const ns = "http://www.w3.org/2000/svg";
            const svg = document.getElementById("mainSvg")!;
            const p = document.createElementNS(ns, "path") as SVGPathElement;
            p.setAttribute("d", dStr);
            svg.appendChild(p);
            const len = p.getTotalLength();
            const pt = p.getPointAtLength(len * frac);
            svg.removeChild(p);
            return { x: pt.x, y: pt.y, len };
        }, [d, t] as any);
    }

    async constants(): Promise<{ LIM: number; ARC_H: number; VIEWBOX_W: number; VIEWBOX_H: number }> {
        return this.page.evaluate(() => (window as any).__mr.constants);
    }

    // ---- Real input: actual mouse events through the page's listeners ----

    /** Convert a viewBox x (and the fixed y = 50) to client coordinates. */
    private async clientPos(x: number): Promise<{ cx: number; cy: number }> {
        return this.page.evaluate((vx) => {
            const svg = document.getElementById("mainSvg")!;
            const r = svg.getBoundingClientRect();
            return {
                cx: r.left + (vx * r.width) / 400,
                cy: r.top + (50 * r.height) / 120,
            };
        }, x);
    }

    /** Move the real mouse to a viewBox x. */
    async realMove(x: number): Promise<void> {
        const { cx, cy } = await this.clientPos(x);
        await this.page.mouse.move(cx, cy);
    }

    /** Click the real mouse at a viewBox x. */
    async realClick(x: number): Promise<void> {
        const { cx, cy } = await this.clientPos(x);
        await this.page.mouse.move(cx, cy);
        await this.page.mouse.click(cx, cy);
    }

    // ---- Real touch: raw touch events through the browser's input pipeline,
    // so pointer events, touch-action and emulated-mouse suppression are the
    // browser's own. Needs a context with hasTouch.

    // The browser tracks the touch per DevTools session, so keep one open.
    private cdp?: CDPSession;

    /** Send a raw touch event at client coordinates (none for touchEnd). */
    async touchAt(type: string, point?: { x: number; y: number }): Promise<void> {
        this.cdp ??= await this.page.context().newCDPSession(this.page);
        await this.cdp.send("Input.dispatchTouchEvent", {
            type, touchPoints: point ? [point] : [],
        });
        // Touch pointermoves are delivered with the next animation frame.
        await this.page.evaluate(() => new Promise((r) =>
            requestAnimationFrame(() => requestAnimationFrame(r))));
    }

    private async touchEvent(type: string, x?: number): Promise<void> {
        if (x === undefined) return this.touchAt(type);
        const { cx, cy } = await this.clientPos(x);
        await this.touchAt(type, { x: cx, y: cy });
    }

    /** Put a finger down at viewBox x and drag it through the rest. */
    async touchDrag(...xs: number[]): Promise<void> {
        await this.touchEvent("touchStart", xs[0]);
        for (const x of xs.slice(1)) await this.touchEvent("touchMove", x);
    }

    /** Lift the finger (it lifts where it last was). */
    async touchLift(): Promise<void> {
        await this.touchEvent("touchEnd");
    }

    /** A whole gesture: down at xs[0], drag through the rest, lift. */
    async touchGesture(...xs: number[]): Promise<void> {
        await this.touchDrag(...xs);
        await this.touchLift();
    }

    async clickBack(): Promise<void> {
        await this.page.click("#backBtn");
    }

    async clickRestart(): Promise<void> {
        await this.page.click("#restartBtn");
    }

    /**
     * Bounding boxes of every marked shape, in viewBox units, measured by the
     * browser's own layout engine via getBBox(). Keyed by data-role.
     */
    async roleBoxes(): Promise<Record<string, Box[]>> {
        return this.page.evaluate(() => {
            const out: Record<string, any[]> = {};
            document.querySelectorAll("#mainSvg [data-role]").forEach((el) => {
                const role = el.getAttribute("data-role")!;
                const b = (el as SVGGraphicsElement).getBBox();
                (out[role] ||= []).push({
                    x: b.x, y: b.y, width: b.width, height: b.height,
                    right: b.x + b.width, bottom: b.y + b.height,
                    text: el.textContent || undefined,
                });
            });
            return out;
        });
    }

    /** Fails the test if the page logged an error to the debug error div. */
    async assertNoErrors(): Promise<void> {
        const errText = await this.page.evaluate(() => {
            const el = document.getElementById("errorDisplay");
            return el ? el.textContent : null;
        });
        expect(errText, "page reported a runtime error").toBeNull();
    }

    // ---- Common openings, so specs read as musical scenarios ----

    /** First sound: onset at 0, ends at `end`. Leaves two points. */
    async firstSound(end: number): Promise<void> {
        await this.click(0);
        await this.move(end);
        await this.click(end);
    }

    /** Second sound: onset at `start`, ends at `end`. Leaves four. */
    async secondSound(start: number, end: number): Promise<void> {
        await this.move(start);
        await this.click(start);
        await this.move(end);
        await this.click(end);
    }

    /** The standard two-sound opening used by most third-onset scenarios. */
    async twoSounds(end1: number, start2: number, end2: number): Promise<void> {
        await this.firstSound(end1);
        await this.secondSound(start2, end2);
    }
}

export const test = base.extend<{ app: App }>({
    app: async ({ page }, use) => {
        // Keep rendering independent of the network: the template @imports
        // Google Fonts, which would make screenshots flaky.
        await page.route(/fonts\.(googleapis|gstatic)\.com/, (r) => r.abort());

        const errors: string[] = [];
        page.on("pageerror", (e) => errors.push(String(e)));

        await page.goto(PAGE_URL);
        await page.waitForFunction(() => (window as any).__mr !== undefined);

        await use(new App(page));

        expect(errors, "uncaught page errors").toEqual([]);
    },
});

export { expect };

/**
 * Make serialized SVG stable and readable in a diff: one element per line,
 * floats clamped to 2dp so that irrelevant last-bit noise never fails a test.
 */
export function normalizeSvg(svg: string): string {
    return svg
        .replace(/-?\d+\.\d{3,}/g, (m) => String(Number(Number(m).toFixed(2))))
        .replace(/></g, ">\n<")
        .trim() + "\n";
}
