import { execFileSync, spawnSync } from "node:child_process";
import * as path from "node:path";
import { test, expect, App, LIM } from "./harness";
import { javaView, MESSAGE_ORDER } from "./java-view";

/**
 * Differential tests against the 1998 Java original.
 *
 * tests/java/original/ holds Rhythm.java and CoordinateArea.java from
 * github.com/tmroeder/meter-rhythm (21660f0). tests/java/Oracle.java drives
 * them headlessly: it calls CoordinateArea.handleMouseDown/handleMouseMove
 * and the button handlers directly, and prints the state after each action.
 * The same actions go through window.__mr here, java-view.ts restates the
 * port's state in the Java's fields, and every step must agree.
 *
 * Needs a JDK (javac/java on the PATH); skipped otherwise.
 */

const JAVA_DIR = path.resolve(__dirname, "java");
// Compiled by global-setup.ts.
const CLASSES = path.resolve(__dirname, "..", "build", "java-oracle-classes");

const hasJava = spawnSync("javac", ["-version"]).status === 0;

type Action = string;   // "m x" | "c x" | "b" | "r"

const FIELDS = [
    "wherein", "points", "line1", "line2", "line3",
    "arcing1", "arcing2", "in1", "in2", "done",
    "clickToChange", "inAlternativeView", "addParenthShort",
    "redrawDashedArc1", "drawTracksFlag", "X1", "moveArcPos", "msgIndex",
] as const;

function runJava(actions: Action[]): any[] {
    // The applet's AWT is created but never shown. On macOS each run would
    // still appear in the Dock and take the focus; UIElement stops that.
    const out = execFileSync("java", ["-Dapple.awt.UIElement=true", "-cp", CLASSES, "Oracle"], {
        input: actions.join("\n") + "\n",
    }).toString();
    return out.trim().split("\n").map((l) => JSON.parse(l));
}

async function runJs(app: App, actions: Action[]): Promise<any[]> {
    return app.page.evaluate((acts) => {
        const mr = (window as any).__mr;
        return acts.map((a: string) => {
            const [op, x] = a.split(" ");
            let error: string | null = null;
            try {
                if (op === "m") mr.move(+x);
                else if (op === "c") mr.click(+x);
                else if (op === "b") mr.back();
                else if (op === "r") mr.restart();
            } catch (e) {
                error = String(e);
            }
            return { action: a, error, snapshot: mr.snapshot() };
        });
    }, actions).then((steps) => steps.map((s: any) => ({ error: s.error, ...javaView(s.snapshot) })));
}

function pick(s: any): any {
    const o: any = {};
    for (const f of FIELDS) o[f] = s[f];
    // Java keeps a sixth point that is never drawn; the port may leave it null.
    o.points = s.points.slice(0, 5);
    return o;
}

/** Deterministic PRNG (mulberry32), so a failing seed can be replayed. */
function rng(seed: number): () => number {
    return () => {
        seed |= 0; seed = (seed + 0x6d2b79f5) | 0;
        let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
        t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
}

/**
 * A plausible performance: from the last committed point, move forward
 * through a few positions and click at the last. Moving forward only keeps
 * clear of the backwards-click bugs the port has fixed.
 */
function forwardPerformance(seed: number): Action[] {
    const r = rng(seed);
    const acts: Action[] = ["c 0"];
    let last = 0;
    for (let step = 0; step < 5 && last < 400; step++) {
        const span = Math.floor(r() * (step % 2 === 0 ? 120 : 220)) + 1;
        const target = Math.min(400, last + span);
        const n = 1 + Math.floor(r() * 4);
        for (let i = 1; i <= n; i++) acts.push(`m ${Math.round(last + (target - last) * i / n)}`);
        acts.push(`c ${target}`);
        last = target;
    }
    // Then wander over the finished display, which drives the alternative views.
    for (let i = 0; i < 4; i++) {
        const x = Math.floor(r() * 401);
        acts.push(`m ${x}`);
        if (r() < 0.4) acts.push(`c ${x}`);
    }
    return acts;
}

/**
 * Anything goes: moves and clicks anywhere, including backwards, and the
 * Back and Restart buttons.
 */
function wildPerformance(seed: number): Action[] {
    const r = rng(seed + 100000);
    const acts: Action[] = [];
    for (let i = 0; i < 30; i++) {
        const u = r();
        const x = Math.floor(r() * 401);
        if (u < 0.05) acts.push("r");
        else if (u < 0.15) acts.push("b");
        else if (u < 0.45) acts.push(`c ${x}`);
        else acts.push(`m ${x}`);
    }
    return acts;
}

/**
 * Where the port deliberately departs from the 1998 original (see
 * README.md, "Fixed since the port"). Given the action and the state before
 * and after it in Java, return why the port differs, or null. Once a
 * sequence reaches one of these the states may legitimately differ for the
 * rest of it, so the comparison stops there.
 */
function knownDivergence(action: Action, before: any, after: any): string | null {
    const [op, xs] = action.split(" ");
    const x = +xs;
    // A click at or before an earlier point: Java's newPoint stepped back
    // one state too far (backOne(wherein + 2)).
    if (op === "c" && before.wherein >= 0
        && before.points.slice(0, before.wherein + 1).some((p: any) => p && p.x >= x)) {
        return "backwards click";
    }
    // The third onset within 5 of the projected point: Java put the end of
    // the third sound at or before its onset and the point was rejected.
    if (op === "c" && before.wherein === 3 && after.line3[0]
        && after.line3[1] && after.line3[1].x <= after.line3[0].x) {
        return "backwards third sound";
    }
    // A click past Lim during the first sound with no move there first:
    // Java left arcing1 on and drew the growing arc over the whole sound.
    if (op === "c" && before.wherein === 0 && before.in1 && x > LIM) {
        return "click past Lim without a move";
    }
    // A second onset at or past Lim but within Lim of the first sound's end:
    // Java measured the limit from the end, the port from the onset.
    if (op === "c" && before.wherein === 1 && !before.done && !before.in1
        && x > LIM && x < before.points[1].x + LIM) {
        return "second onset's Lim from the onset";
    }
    // Back from a too-late second onset (Java's message 9,
    // secondOnsetTooLate): Java left `done` set.
    if (op === "b" && before.msgIndex === 9 && before.done && before.wherein === 2) {
        return "back from a too-late second onset";
    }
    // A move in the second silence past Lim from the second onset: the port
    // shows secondSilenceTooLong (Java's message 18), which Java never
    // reached.
    if (op === "m" && before.wherein === 3 && !before.done
        && x > before.points[2].x + LIM) {
        return "secondSilenceTooLong";
    }
    // The second sound ending past its projection (Java's message 14,
    // secondSoundEndsPastProjection): Java made it a dead end; the port goes
    // on to the second silence.
    if (op === "c" && before.in2 && !before.done
        && x > 2 * before.points[2].x && x <= before.points[2].x + LIM) {
        return "secondSoundEndsPastProjection is not a dead end";
    }
    // A second sound of exactly Lim, or a third onset at exactly 2.5 times
    // the second onset or Lim after it: boundaries Java left in no branch.
    const p = before.points;
    if ((op === "c" || op === "m") && before.in2 && !before.done && x === p[2].x + LIM) {
        return "boundary: second sound of Lim";
    }
    if (op === "c" && before.wherein === 3 && !before.done
        && (x === p[2].x + LIM || x === 2.5 * p[2].x)) {
        return "boundary: third onset";
    }
    if (after.error) return `Java threw ${after.error}`;
    return null;
}

/**
 * Field-level fixes that don't change the course of the performance, so the
 * comparison goes on: the port clears values Java left stale.
 */
function sameP(a: any, b: any): boolean {
    return !!a && !!b && a.x === b.x && a.y === b.y;
}

function forgive(js: any, java: any, javaBefore: any, lastMoveX: number | null): any {
    const j = { ...java };
    // Java stops updating moveArcPos once the duration passes Lim and keeps
    // the last position; the port clears it.
    if (js.moveArcPos === null && java.moveArcPos
        && (java.moveArcPos.x !== lastMoveX || sameP(java.moveArcPos, javaBefore.moveArcPos))) {
        j.moveArcPos = null;
    }
    // Java never cleared the X once the second sound passed Lim.
    if (js.X1 === -1 && java.X1 !== -1 && java.points[2] && lastMoveX !== null
        && lastMoveX > java.points[2].x + LIM) {
        j.X1 = -1;
    }
    // Ending the second sound past its projection draws the X that the
    // commentary of Java's message 14 points to, even with no move there
    // first; it stays while the message does.
    if (java.msgIndex === 14 && java.X1 === -1 && java.points[2] && js.X1 === java.points[2].x) {
        j.X1 = js.X1;
    }
    // Back to the first silence: Java kept the abandoned second sound's
    // drawn end until the next move in a second sound; the port clears it.
    if (js.line2[1] === null && java.line2[1] && java.wherein <= 2
        && sameP(java.line2[1], javaBefore.line2?.[1])) {
        j.line2 = [java.line2[0], null];
    }
    // The first silence past Lim shows firstSilenceTooLong, which the Java
    // did not have (msgIndex -1); back at the first sound's end exactly, it
    // shows firstSilence, where the Java kept its earlier message.
    if (java.wherein === 1 && !java.done && !java.in1 && lastMoveX !== null) {
        if (js.msgIndex === -1 && lastMoveX > LIM) j.msgIndex = -1;
        if (js.msgIndex === MESSAGE_ORDER.indexOf("firstSilence") && lastMoveX === java.points[1].x) {
            j.msgIndex = js.msgIndex;
        }
    }
    return j;
}

async function compare(app: App, acts: Action[], label: string, seen: Map<string, number>) {
    const java = runJava(acts);
    await app.restart();
    const js = await runJs(app, acts);
    let before: any = { wherein: -1, points: [] };
    let lastMoveX: number | null = null;
    for (let i = 0; i < acts.length; i++) {
        if (acts[i].startsWith("m ")) lastMoveX = +acts[i].slice(2);
        const where = `${label}, step ${i} (${acts[i]})\n${acts.slice(0, i + 1).join("; ")}`;
        expect(js[i].error, `${where}\nJS threw`).toBeNull();
        const why = knownDivergence(acts[i], before, java[i]);
        if (why) {
            seen.set(why, (seen.get(why) ?? 0) + 1);
            return;
        }
        expect(pick(js[i]), where).toEqual(pick(forgive(js[i], java[i], before, lastMoveX)));
        before = java[i];
    }
}

test.describe("agrees with the Java original", () => {
    test.skip(!hasJava, "needs a JDK");
    // Each batch runs Java 50 times; on a busy machine that outlasts 30 s.
    test.describe.configure({ timeout: 120_000 });

    test("the touch-spec performance", async ({ app }) => {
        const acts = ["c 0", "m 30", "m 60", "c 60", "m 96", "c 96", "m 150", "c 150", "m 210", "c 210"];
        const java = runJava(acts).map(pick);
        const js = (await runJs(app, acts)).map(pick);
        expect(js).toEqual(java);
    });

    for (let batch = 0; batch < 10; batch++) {
        const lo = batch * 50, hi = lo + 50;
        test(`forward performances, seeds ${lo}..${hi - 1}`, async ({ app }) => {
            const seen = new Map<string, number>();
            for (let seed = lo; seed < hi; seed++) {
                await compare(app, forwardPerformance(seed), `forward seed ${seed}`, seen);
            }
        });
        test(`wild performances, seeds ${lo}..${hi - 1}`, async ({ app }) => {
            const seen = new Map<string, number>();
            for (let seed = lo; seed < hi; seed++) {
                await compare(app, wildPerformance(seed), `wild seed ${seed}`, seen);
            }
        });
    }
});
