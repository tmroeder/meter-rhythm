import { test, expect, Box } from "./harness";

/**
 * Geometric tests on the rendered drawing, measured with the browser's own
 * getBBox(). These describe what the picture has to look like for it to read
 * correctly as Hasty's notation, independent of the exact path arithmetic.
 */

// The frame is sized by the drawing layout; tests read it rather than
// assuming the template's old fixed 120.
let VIEWBOX_W = 400;
let VIEWBOX_H = 120;

// Arcs carry duration, so a projected potential may legitimately extend
// past the right-hand edge of the displayed time span and be clipped.
// Everything else has to stay inside the frame.
const MAY_OVERRUN_RIGHT = new Set(["dashed-arc", "projection-arc", "growing-arc"]);

function overlaps(a: Box, b: Box): boolean {
    return a.x < b.right && b.x < a.right && a.y < b.bottom && b.y < a.bottom;
}

/** Build the full picture for an acceleration, which draws the most at once. */
async function accelerationScene(app: any) {
    await app.twoSounds(60, 96, 150);
    await app.click(175);
}

test.describe("the drawing stays inside the frame", () => {
    const scenes: [string, (app: any) => Promise<void>][] = [
        ["opening", async () => {}],
        ["first sound growing", async (a) => { await a.click(0); await a.move(60); }],
        ["first silence", async (a) => { await a.firstSound(60); await a.move(90); }],
        ["second sound growing", async (a) => { await a.firstSound(60); await a.click(96); await a.move(150); }],
        ["projection denied (X)", async (a) => { await a.firstSound(60); await a.click(96); await a.move(210); }],
        ["two sounds", async (a) => { await a.twoSounds(60, 96, 150); }],
        ["acceleration", accelerationScene],
        ["exact realization", async (a) => { await a.twoSounds(60, 96, 150); await a.click(192); }],
        ["deceleration", async (a) => { await a.twoSounds(60, 96, 150); await a.click(210); }],
        ["hiatus", async (a) => { await a.twoSounds(60, 96, 150); await a.click(250); }],
        ["parenthesized alternative", async (a) => { await a.twoSounds(60, 96, 150); await a.click(160); }],
        ["alternative view", async (a) => { await a.twoSounds(60, 96, 150); await a.click(160); await a.click(300); }],
    ];

    for (const [name, build] of scenes) {
        test(name, async ({ app }) => {
            const c = await app.constants();
            VIEWBOX_W = c.VIEWBOX_W;
            VIEWBOX_H = c.VIEWBOX_H;

            await build(app);
            const boxes = await app.roleBoxes();
            for (const [role, list] of Object.entries(boxes)) {
                for (const b of list as Box[]) {
                    expect(b.bottom, `${role} runs below the frame`).toBeLessThanOrEqual(VIEWBOX_H);
                    expect(b.y, `${role} runs above the frame`).toBeGreaterThanOrEqual(0);
                    if (!MAY_OVERRUN_RIGHT.has(role)) {
                        expect(b.right, `${role} runs past the right edge`)
                            .toBeLessThanOrEqual(VIEWBOX_W + 0.5);
                    }
                }
            }
            await app.assertNoErrors();
        });
    }
});

test("each tick label is centred on its tick, inside the frame", async ({ app }) => {
    const boxes = (await app.roleBoxes())["axis-label"] as Box[];
    expect(boxes).toHaveLength(4);
    expect(boxes[0].x).toBeGreaterThanOrEqual(0);
    for (const [i, tick] of [[1, 133], [2, 266]]) {
        const b = boxes[i];
        expect(Math.abs(b.x + b.width / 2 - tick), `label ${i}`).toBeLessThan(1);
    }
    expect(boxes[3].right).toBeLessThanOrEqual(400);
});

test("an arrowhead sits at the end of the arc it terminates", async ({ app }) => {
    await app.twoSounds(60, 96, 150);
    const boxes = await app.roleBoxes();

    const arcs = boxes["projection-arc"] as Box[];
    const heads = boxes["arrowhead"] as Box[];
    expect(arcs.length).toBeGreaterThan(0);
    expect(heads.length).toBe(arcs.length);

    for (let i = 0; i < arcs.length; i++) {
        const arc = arcs[i], head = heads[i];
        // The arrowhead marks the arc's right-hand end, so it must be
        // horizontally aligned with it...
        expect(Math.abs(head.right - arc.right)).toBeLessThanOrEqual(6);
        // ...and touch it vertically, rather than float above it.
        const gap = arc.y - head.bottom;
        expect(gap, "arrowhead is detached from its arc").toBeLessThanOrEqual(1);
    }
});

test("the tempo label does not collide with the arc it describes", async ({ app }) => {
    await accelerationScene(app);
    const boxes = await app.roleBoxes();

    const label = (boxes["tempo-label"] as Box[])[0];
    expect(label).toBeDefined();
    expect(label.text).toMatch(/accel\.|rall\./);

    for (const arc of (boxes["projection-arc"] as Box[])) {
        expect(overlaps(label, arc), "tempo label overlaps a projection arc").toBe(false);
    }
    for (const arc of (boxes["dashed-arc"] as Box[])) {
        expect(overlaps(label, arc), "tempo label overlaps a dashed arc").toBe(false);
    }
});

test("the two arc rows do not overlap each other", async ({ app }) => {
    // The upper row carries the first interonset projection, the lower the
    // second. They must read as two separate levels.
    await app.twoSounds(60, 96, 150);
    await app.click(210);
    const boxes = await app.roleBoxes();

    const arcs = (boxes["projection-arc"] as Box[]).slice().sort((a, b) => a.y - b.y);
    expect(arcs.length).toBe(2);
    expect(arcs[0].bottom, "the upper arc row runs into the lower one")
        .toBeLessThanOrEqual(arcs[1].y);
});

test("the X marking a denied projection lands on the dashed arc", async ({ app }) => {
    await app.firstSound(60);
    await app.click(96);
    await app.move(210); // the X, at 1.5 * 96
    const boxes = await app.roleBoxes();

    const x = (boxes["x-mark"] as Box[])[0];
    expect(x).toBeDefined();
    const dashed = (boxes["dashed-arc"] as Box[]) || [];
    const growing = (boxes["growing-arc"] as Box[]) || [];
    const targets = [...dashed, ...growing];
    expect(targets.length).toBeGreaterThan(0);
    expect(
        targets.some((t) => overlaps(x, t)),
        "the X does not touch any arc, so it denies nothing"
    ).toBe(true);
});

test("the railroad tracks straddle the event line at the projected limit", async ({ app }) => {
    await app.twoSounds(60, 96, 150);
    await app.click(250);
    const boxes = await app.roleBoxes();

    const tracks = (boxes["hiatus-tracks"] as Box[])[0];
    expect(tracks).toBeDefined();
    // They mark where the projection ran out: the second onset + Lim = 229.
    expect(tracks.right).toBeGreaterThan(215);
    expect(tracks.x).toBeLessThan(235);
    // ...and they cross the event line at y = 50.
    expect(tracks.y).toBeLessThan(50);
    expect(tracks.bottom).toBeGreaterThan(50);
});

/**
 * REGRESSION: the Java drew the second interonset duration's arc, arrow and
 * dashed arc under a hiatus, although its commentary says that duration is
 * mensurally indeterminate and has no projective potential.
 */
/**
 * REGRESSION: the Java drew the double bar just before Lim from the second
 * onset even when the second sound reached there, so it sat on the sound.
 */
test("the railroad tracks stay in the silence after a long second sound", async ({ app }) => {
    await app.twoSounds(81, 123, 253); // Lim from the second onset: 256
    await app.click(284);
    const tracks = ((await app.roleBoxes())["hiatus-tracks"] as Box[])[0];
    expect(tracks.x).toBeGreaterThan(253);
    expect(tracks.right).toBeLessThan(284);
});

test("a hiatus draws only the first interonset's projection", async ({ app }) => {
    await app.twoSounds(60, 96, 150);
    await app.click(250);
    const boxes = await app.roleBoxes();
    expect((boxes["projection-arc"] as Box[]).length).toBe(1);
    expect((boxes["arrowhead"] as Box[]).length).toBe(1);
    expect((boxes["dashed-arc"] as Box[]).length).toBe(1);
    // The one there is the first interonset's, 0 to 96.
    expect((boxes["projection-arc"] as Box[])[0].right).toBeLessThan(100);
});

/**
 * REGRESSION: the Java drew the first projection's arc, arrow and dashed
 * arc under secondOnsetTooLate, which says there is no projection.
 */
test("a second onset too late draws no projection", async ({ app }) => {
    await app.firstSound(60);
    await app.click(240); // > Lim
    expect((await app.state()).message).toBe("secondOnsetTooLate");
    const boxes = await app.roleBoxes();
    for (const role of ["projection-arc", "arrowhead", "dashed-arc"])
        expect(boxes[role] ?? [], role).toEqual([]);
});

test("the parenthesized hypothetical event sits on the event line", async ({ app }) => {
    await app.twoSounds(60, 96, 150);
    await app.click(160);
    const boxes = await app.roleBoxes();

    const paren = (boxes["parenth"] as Box[])[0];
    expect(paren).toBeDefined();
    // It stands for a sound that would have begun at 2*where = 192.
    expect(paren.x).toBeGreaterThan(180);
    // It belongs with the events, not down among the arcs.
    expect(paren.y, "the parenthesized event drifted down into the arcs")
        .toBeLessThan(62);
});

test("the accent in the alternative view marks the third onset", async ({ app }) => {
    await app.twoSounds(60, 96, 150);
    await app.click(160);
    await app.click(300);
    const boxes = await app.roleBoxes();

    const accent = (boxes["accent"] as Box[])[0];
    expect(accent).toBeDefined();
    // The third onset is at 160, just above the event line at y = 50.
    expect(Math.abs(accent.x + accent.width / 2 - 160)).toBeLessThan(4);
    expect(accent.bottom).toBeLessThanOrEqual(50);
});
