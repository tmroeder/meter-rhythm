import { test, expect } from "./harness";

/**
 * The arcs of the notation, as SVG paths (src/shapes.ts). Each is checked
 * against the shape it must have, measured by the browser's own SVG engine,
 * and against the Graphics.drawArc call that drew it in the 1998 Java.
 */

const ARC_H = 30;
const ROW = 55;              // an arc row's top
const END_Y = ROW + ARC_H / 2;
const BOTTOM_Y = ROW + ARC_H;

function parse(d: string) {
    const m = d.match(
        /^M (-?[\d.e-]+) (-?[\d.e-]+) A ([\d.]+) ([\d.]+) 0 ([01]) ([01]) (-?[\d.e-]+) (-?[\d.e-]+)$/
    );
    if (!m) throw new Error(`unparseable path: ${d}`);
    return {
        x1: +m[1], y1: +m[2], rx: +m[3], ry: +m[4],
        largeArc: +m[5], sweep: +m[6], x2: +m[7], y2: +m[8],
    };
}

/**
 * Java's Graphics.drawArc(x, y, w, h, startAngle, arcAngle): an arc of the
 * ellipse inscribed in the box, angle 0 at 3 o'clock and 90 at 12 o'clock,
 * positive arcAngle counter-clockwise. Its two ends and radii.
 */
function javaDrawArc(x: number, y: number, w: number, h: number, start: number, arc: number) {
    const cx = x + w / 2, cy = y + h / 2, rx = w / 2, ry = h / 2;
    const at = (deg: number) => {
        const t = (deg * Math.PI) / 180;
        return { x: cx + rx * Math.cos(t), y: cy - ry * Math.sin(t) };
    };
    const a = at(start), b = at(start + arc);
    return { x1: a.x, y1: a.y, x2: b.x, y2: b.y, rx, ry, sweep: arc < 0 ? 1 : 0 };
}

function expectSameArc(d: string, java: ReturnType<typeof javaDrawArc>) {
    const p = parse(d);
    for (const k of ["x1", "y1", "x2", "y2", "rx", "ry"] as const)
        expect(p[k], k).toBeCloseTo(java[k], 9);
    expect(p.sweep).toBe(java.sweep);
    expect(p.largeArc).toBe(0);
}

const shapes = (app: any) => ({
    projection: (x1: number, x2: number): Promise<string | null> =>
        app.page.evaluate((a: number[]) => (window as any).__mr.shapes.projectionArcPath(a[0], a[1], a[2]), [x1, x2, ROW]),
    growing: (onset: number, reach: number): Promise<string | null> =>
        app.page.evaluate((a: number[]) => (window as any).__mr.shapes.growingArcPath(a[0], a[1], a[2]), [onset, reach, ROW]),
    dashes: (x1: number, x2: number): Promise<string[]> =>
        app.page.evaluate((a: number[]) => (window as any).__mr.shapes.dashPaths(a[0], a[1], a[2]), [x1, x2, ROW]),
});

test("a projection arc spans its duration and bulges down to the row's bottom", async ({ app }) => {
    const d = (await shapes(app).projection(0, 100))!;
    const p = parse(d);
    // From the right-hand end back to the left, on the row's centre line.
    expect(p.x1).toBeCloseTo(100, 9);
    expect(p.x2).toBeCloseTo(0, 9);
    expect(p.y1).toBeCloseTo(END_Y, 9);
    expect(p.y2).toBeCloseTo(END_Y, 9);

    const mid = await app.samplePath(d, 0.5);
    expect(mid.x).toBeCloseTo(50, 0);
    expect(mid.y).toBeCloseTo(BOTTOM_Y, 0);
});

test("a growing arc runs from its reach at the bottom up to its onset", async ({ app }) => {
    const p = parse((await shapes(app).growing(40, 100))!);
    expect(p.x1).toBeCloseTo(100, 9);
    expect(p.y1).toBeCloseTo(BOTTOM_Y, 9);
    expect(p.x2).toBeCloseTo(40, 9);
    expect(p.y2).toBeCloseTo(END_Y, 9);
});

test("arcs too narrow to see are not drawn", async ({ app }) => {
    expect(await shapes(app).projection(50, 50)).toBeNull();
    expect(await shapes(app).projection(50, 50.5)).toBeNull();
    expect(await shapes(app).growing(50, 50)).toBeNull();
});

test("a dashed arc tiles the lower half of the ellipse from its right-hand end", async ({ app }) => {
    const ds = await shapes(app).dashes(100, 220);
    expect(ds).toHaveLength(9);
    const ps = ds.map(parse);
    expect(ps[0].x1).toBeCloseTo(220, 9);
    for (const p of ps) {
        expect(p.sweep).toBe(1);
        expect(p.y1).toBeGreaterThanOrEqual(END_Y - 1e-9);
        expect(p.y2).toBeGreaterThanOrEqual(END_Y - 1e-9);
    }
    // Dashes and gaps alternate, leftwards.
    for (let i = 1; i < ps.length; i++) expect(ps[i].x1).toBeLessThan(ps[i - 1].x2);
    expect(Math.max(...ps.flatMap((p) => [p.y1, p.y2]))).toBeCloseTo(BOTTOM_Y, 0);
});

test.describe("each arc is the 1998 drawArc call it replaces", () => {
    test("a projection: drawArc(x1, y, x2 - x1, h, 0, -180)", async ({ app }) => {
        for (const [x1, x2] of [[0, 96], [96, 175], [60, 133]])
            expectSameArc((await shapes(app).projection(x1, x2))!, javaDrawArc(x1, ROW, x2 - x1, ARC_H, 0, -180));
    });

    test("a growing arc: drawArc(onset, y, 2 * (reach - onset), h, -90, -90)", async ({ app }) => {
        for (const [onset, reach] of [[0, 60], [96, 150], [0, 133]])
            expectSameArc((await shapes(app).growing(onset, reach))!,
                javaDrawArc(onset, ROW, 2 * (reach - onset), ARC_H, -90, -90));
    });

    /**
     * PINS A DEVIATION FROM THE JAVA ORIGINAL. The Java's drawDashedArcSpecial
     * drew dash i with a positive sweep, drawArc(x, y, w, h, -(i*10), 10)
     * for i = 0, 2, .. 16, so the first dash poked 10 degrees above the
     * centre line. The port's dashes sweep the other way, from the same
     * starts, and lie wholly below it: a 10-degree phase shift.
     */
    test("a dash: drawArc(x1, y, x2 - x1, h, -(i * 10), -10), not the Java's +10", async ({ app }) => {
        const ds = await shapes(app).dashes(100, 220);
        ds.forEach((d, k) => expectSameArc(d, javaDrawArc(100, ROW, 120, ARC_H, -(20 * k), -10)));
        const java = javaDrawArc(100, ROW, 120, ARC_H, 0, 10);
        expect(java.y2).toBeLessThan(END_Y);           // the Java's first dash rose
        expect(parse(ds[0]).y2).toBeGreaterThan(END_Y); // the port's falls
    });
});
