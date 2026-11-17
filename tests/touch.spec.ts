import { test, expect } from "./harness";

/**
 * Touch input. Each drag draws the next stretch of time, sound and silence
 * in turn: the first sound, the silence after it, the second sound, the
 * silence before the third. Lifting the finger ends the stretch, so ending
 * a silence begins the next sound. The first sound always begins at 0, so
 * the first touch begins it there and it reaches to the finger.
 *
 * In mouse terms a drag is moves and a lift is the click, as in the 1998
 * program; the first touch also clicks at 0.
 */

test.use({ hasTouch: true, isMobile: true, viewport: { width: 390, height: 664 } });

const steps = (app: any) => app.page.evaluate(() =>
    Array.from(document.querySelectorAll("#steps figure")).map((f) => (f as HTMLElement).className));

const fingerTag = (app: any) => app.page.evaluate(() => {
    const t = document.getElementById("fingerTag")!;
    return t.hidden ? null : t.textContent;
});

test("a full performance: sound, silence, sound, silence", async ({ app }) => {
    await app.touchGesture(5, 30, 60);      // first sound, 0 to 60
    await app.touchGesture(60, 80, 96);     // silence; lifting begins the second sound at 96
    await app.touchGesture(96, 120, 150);   // second sound, to 150
    await app.touchGesture(150, 190, 210);  // silence; lifting begins the third at 210
    const byTouch = await app.state();
    expect(byTouch.times).toEqual([0, 60, 96, 150, 210, 230]);
    expect(byTouch.message).toBe("thirdOnsetDecelerates");
    await app.assertNoErrors();

    // The same as the mouse: a click at 0, then moves and a click to end
    // each stretch.
    await app.restart();
    await app.click(0);
    for (const g of [[5, 30, 60], [60, 80, 96], [96, 120, 150], [150, 190, 210]]) {
        await app.moveThrough(...g);
        await app.click(g[g.length - 1]);
    }
    expect(await app.state()).toEqual(byTouch);
});

test("the first sound begins at 0 and reaches to the finger", async ({ app }) => {
    await app.touchDrag(80);
    let s = await app.state();
    expect(s.times).toEqual([0]);
    expect(s.drawnEnds[0]).toBe(80);
    expect(s.message).toBe("firstSoundGrowing");

    await app.touchLift();
    s = await app.state();
    expect(s.times).toEqual([0, 80]);
});

test("dragging through the silence shows the projection before the lift commits", async ({ app }) => {
    await app.touchGesture(5, 60);
    await app.touchDrag(60, 80, 100);
    let s = await app.state();
    expect(s.times).toEqual([0, 60]);       // the second onset is not yet placed
    expect(s.message).toBe("firstSilence"); // the silence's growing projection
    expect(s.arcReach).toBe(100);
    expect(s.instructions).toBe("Lift your finger where the second sound should begin.");

    await app.touchLift();
    s = await app.state();
    expect(s.times).toEqual([0, 60, 100]);
});

test("dragging back before the first sound's end warns before the lift", async ({ app }) => {
    await app.touchGesture(5, 60);
    await app.touchDrag(60, 40);
    expect((await app.state()).message).toBe("beforeFirstSoundEnd");
    await app.touchLift();
    const s = await app.state();
    expect(s.times).toEqual([0, 60]);
    expect(s.instructions).toContain("Not a well-defined event");
});

test("a tap commits once, not again through the emulated click", async ({ app }) => {
    await app.touchGesture(5, 60);
    await app.touchGesture(60, 96);
    await app.touchGesture(96, 150);
    await app.touchGesture(150, 160);       // a shorter projection
    // An emulated click would already have switched to the alternative view.
    expect((await app.state()).message).toBe("thirdOnsetShorterProjection");
    await app.touchGesture(300);            // "Tap anywhere"
    expect((await app.state()).message).toBe("alternativeView");
});

test("after Back, the next drag draws the stretch again", async ({ app }) => {
    await app.touchGesture(5, 60);
    await app.clickBack();
    expect((await app.state()).times).toEqual([0]);
    await app.touchGesture(90);
    expect((await app.state()).times).toEqual([0, 90]);
});

test("a finger dragged past the right edge ends the stretch at the edge", async ({ app }) => {
    await app.touchDrag(5, 60);
    const box = await app.page.locator("#mainSvg").boundingBox();
    await app.touchAt("touchMove", { x: box!.x + box!.width + 15, y: box!.y + 45 });
    await app.touchLift();
    const s = await app.state();
    expect(s.times).toEqual([0, 400]);
});

test("dragging on the drawing does not pan or zoom the page", async ({ app }) => {
    const touchAction = await app.page.locator("#svgContainer")
        .evaluate((el) => getComputedStyle(el).touchAction);
    expect(touchAction).toBe("none");
});

test.describe("indicator", () => {
    test("the marks show which stretch the next drag draws", async ({ app }) => {
        expect(await steps(app)).toEqual(["now", "", "", ""]);
        await app.touchGesture(5, 60);
        expect(await steps(app)).toEqual(["done", "now", "", ""]);
        await app.touchGesture(60, 96);
        expect(await steps(app)).toEqual(["done", "done", "now", ""]);
        await app.touchGesture(96, 150);
        expect(await steps(app)).toEqual(["done", "done", "done", "now"]);
        await app.touchGesture(150, 210);
        expect(await steps(app)).toEqual(["done", "done", "done", "done"]);
        await app.clickBack();
        await app.clickBack();
        expect(await steps(app)).toEqual(["done", "done", "now", ""]);
        await app.clickRestart();
        expect(await steps(app)).toEqual(["now", "", "", ""]);
    });

    test("a dead end leaves no stretch to draw", async ({ app }) => {
        await app.touchGesture(5, 200);         // the first sound passes Lim
        expect(await steps(app)).toEqual(["done", "", "", ""]);
    });

    test("the tag names the stretch under the finger, and goes on lifting", async ({ app }) => {
        expect(await fingerTag(app)).toBeNull();
        await app.touchDrag(5, 60);
        expect(await fingerTag(app)).toBe("sound");
        await app.touchLift();
        expect(await fingerTag(app)).toBeNull();
        await app.touchDrag(60, 100);
        expect(await fingerTag(app)).toBe("silence");

        // It rides above the drawing at the finger.
        const [tag, svg] = await Promise.all(["#fingerTag", "#mainSvg"].map((sel) =>
            app.page.locator(sel).boundingBox()));
        expect(tag!.y + tag!.height).toBeLessThanOrEqual(svg!.y);
        expect(tag!.x + tag!.width / 2).toBeCloseTo(svg!.x + (100 / 400) * svg!.width, 0);
        await app.touchLift();
        expect(await fingerTag(app)).toBeNull();
    });

    test("stays on screen at either end of the drawing", async ({ app }) => {
        const box = await app.page.locator("#svgContainer").boundingBox();
        for (const x of [0, 400]) {
            await app.restart();
            await app.touchDrag(x);
            const tag = (await app.page.locator("#fingerTag").boundingBox())!;
            expect(tag.x).toBeGreaterThanOrEqual(box!.x - 0.5);
            expect(tag.x + tag.width).toBeLessThanOrEqual(box!.x + box!.width + 0.5);
            // The pointer still marks the finger.
            const pointer = await app.page.locator("#fingerTag").evaluate((el) =>
                parseFloat(getComputedStyle(el, "::after").left));
            expect(tag.x + pointer).toBeCloseTo(box!.x + 1 + (x / 400) * (box!.width - 2), 0);
            await app.touchLift();
        }
    });

    test("is hidden for the mouse", async ({ app }) => {
        await app.realMove(50);
        expect(await app.page.locator("#steps").isHidden()).toBe(true);
        await app.realClick(0);
        await app.realMove(60);
        expect(await fingerTag(app)).toBeNull();
    });
});

test.describe("instructions", () => {
    test("speak of touch, and say the first sound begins at 0", async ({ app }) => {
        const s = await app.state();
        expect(s.instructions).toContain("Each touch draws the next stretch");
        expect(s.instructions).toContain("first sound begins at 0");
        expect(s.instructions).not.toContain("mouse");
    });

    test("follow the input last used", async ({ app }) => {
        await app.touchDrag(5, 60);
        expect((await app.state()).instructions).toBe("Lift your finger where the first sound should end.");

        await app.touchLift();
        // A trackpad on the same tablet. Mouse events just after a touch
        // are taken for the browser's emulated ones and ignored.
        await app.page.waitForTimeout(900);
        await app.page.mouse.move(100, 330);
        const s = await app.state();
        expect(s.instructions).toMatch(/click/i);
        expect(s.instructions).not.toContain("finger");
    });

    test("have a touch wording for every message", async ({ app }) => {
        const missing = await app.page.evaluate(() => {
            const mr = (window as any).__mr;
            return Object.keys(mr.messages).filter((k) => !mr.messages[k].touch);
        });
        expect(missing).toEqual([]);
    });
});

test("no commentary or instruction is clipped on a phone, except the hiatus", async ({ app }) => {
    const clipped = await app.page.evaluate(() => {
        const out: string[] = [];
        const mr = (window as any).__mr;
        for (const key of Object.keys(mr.messages)) {
            mr.showMessage(key);
            for (const id of ["commentary", "instructions"]) {
                const el = document.getElementById(id)!;
                if (el.scrollHeight > el.clientHeight) out.push(`${key}:${id}`);
            }
        }
        return out;
    });
    // The hiatus commentary is too long for any sensible fixed height; it
    // scrolls within its panel.
    expect(clipped).toEqual(["thirdOnsetHiatus:commentary"]);
});

test("labels are larger on a phone, and stay inside the drawing", async ({ app }) => {
    // Decided with John Roeder: the drawing scales down on a phone, which
    // left its labels at about 8px.
    await app.firstSound(60);
    await app.click(96);
    await app.click(150);
    await app.click(210); // a deceleration, for the "rall." label
    const sizes = await app.page.evaluate(() => {
        const px = (sel: string) => getComputedStyle(document.querySelector(sel)!).fontSize;
        return { axis: px("[data-role=axis-label]"), tempo: px("[data-role=tempo-label]") };
    });
    expect(sizes).toEqual({ axis: "13.5px", tempo: "12.5px" });
    const c = await app.constants();
    for (const b of (await app.roleBoxes())["axis-label"]) {
        expect(b.x).toBeGreaterThanOrEqual(0);
        expect(b.right).toBeLessThanOrEqual(c.VIEWBOX_W + 0.5);
    }
});
