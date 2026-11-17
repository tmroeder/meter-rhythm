import { test, expect, LIM } from "./harness";

/**
 * These drive the page through real mouse events and real button clicks,
 * so they exercise mouseToSvg and the event wiring that the direct-call
 * tests deliberately bypass. Kept deliberately small: this layer proves the
 * plumbing, the state-machine suite proves the logic.
 */

test("a real click maps CSS pixels to viewBox coordinates", async ({ app }) => {
    await app.realClick(0);
    await app.realMove(96);
    await app.realClick(96);

    const s = await app.state();
    expect(s.times).toEqual([0, 96]);
});

test("a full three-sound performance works through real input", async ({ app }) => {
    await app.realClick(0);
    for (const x of [20, 40, 60]) await app.realMove(x);
    await app.realClick(60);

    for (const x of [70, 80, 96]) await app.realMove(x);
    await app.realClick(96);

    for (const x of [120, 140, 150]) await app.realMove(x);
    await app.realClick(150);

    for (const x of [160, 170, 175]) await app.realMove(x);
    await app.realClick(175);

    const s = await app.state();
    expect(s.times).toHaveLength(6);
    expect(s.message).toBe("thirdOnsetAccelerates");
    expect(s.phase).toBe("thirdOnset");
    await app.assertNoErrors();
});

test("the y coordinate of a click is ignored", async ({ app }) => {
    // Every event is pinned to y = 50 regardless of where the user clicks.
    const box = await app.page.locator("#mainSvg").boundingBox();
    await app.page.mouse.click(box!.x + box!.width * 0.25, box!.y + 5);
    const s = await app.state();
    expect(s.times).toEqual([0]);
});

test("the Back button steps back", async ({ app }) => {
    await app.realClick(0);
    await app.realMove(60);
    await app.realClick(60);
    expect((await app.state()).times).toEqual([0, 60]);

    await app.clickBack();
    const s = await app.state();
    expect(s.times).toEqual([0]);
    expect(s.phase).toBe("firstSound");
});

test("the Restart button clears a completed performance", async ({ app }) => {
    await app.realClick(0);
    await app.realMove(60);
    await app.realClick(60);
    await app.realClick(96);
    await app.realMove(150);
    await app.realClick(150);
    await app.realClick(250); // hiatus: railroad tracks on screen

    await app.clickRestart();
    const s = await app.state();
    expect(s.times).toEqual([]);
    expect(s.thirdOnset).toBeNull();
    expect(s.message).toBe("intro");
    await app.assertNoErrors();
});

test("moving the mouse without clicking never defines an event", async ({ app }) => {
    for (const x of [10, 50, 100, 200, 300]) await app.realMove(x);
    const s = await app.state();
    expect(s.times).toEqual([]);
});

test("the commentary and instruction panels both update on screen", async ({ app }) => {
    await app.realClick(0);
    await app.realMove(60);
    await expect(app.page.locator("#instructions")).toHaveText(/End the first sound/);
    await expect(app.page.locator("#commentary")).toHaveText(/Projective potential/);
});

test("the timeline is drawn with Lim at a third of the width", async ({ app }) => {
    // Three Lim units span the 400-unit viewBox.
    const labels = await app.page.locator("#mainSvg text").allTextContents();
    expect(labels.slice(0, 4)).toEqual(["0", "Lim", "2*Lim", "3*Lim"]);
    expect(LIM * 3).toBeLessThanOrEqual(400);
});
