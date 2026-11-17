// The picture of a performance: the timeline, the sounds, and the arcs of
// projection between them. Drawn afresh from the state after every change.

import type { Performance } from "./performance";
import {
    accent, arcPathElement, arrowhead, crossOut, dashedArc, growingArcPath,
    hiatusArrow, hiatusTracks, HIATUS_HALF_GAP, parenthesizedSound, projectionArcPath, svgElem,
    tempoLabel, ARC_ROW_1_Y, ARC_ROW_2_Y, EVENT_Y, VIEWBOX_W,
} from "./shapes";
import { LIM, limFrom, projectedEnd } from "./theory";

/** Small ticks per Lim on the timeline. */
const TICKS_PER_LIM = 5;

/** How far before Lim from the second onset a hiatus bar is centred. */
const HIATUS_BEFORE_LIM = 6.5;

export function drawPerformance(svg: SVGSVGElement, p: Performance): void {
    svg.replaceChildren(
        ...timeline(),
        ...pointMarks(p),
        ...soundsInProgress(p),
        ...soundsPerformed(p),
        ...(p.thirdOnset === "alternativeView" ? alternativeView(p) : [
            ...growingArc(p),
            ...hiatus(p),
            ...crossedOut(p),
            ...parenthesized(p),
            ...projections(p),
        ]),
    );
}

/** The time axis, three Lim long, with a labelled tick at each Lim. */
function timeline(): SVGElement[] {
    const tick = LIM / TICKS_PER_LIM;
    const out = [svgElem("line", { x1: 0, y1: 10, x2: 3 * LIM, y2: 10, stroke: "black", "stroke-width": 1 })];
    for (let n = 0; n < 3 * TICKS_PER_LIM; n++) {
        out.push(svgElem("line", { x1: n * tick, y1: 8, x2: n * tick, y2: 12, stroke: "black", "stroke-width": 0.5 }));
    }
    // Each label is centred on its tick, except at the edges, so it stays
    // put when phones set it larger (template.html).
    const labels = [
        { text: "0", x: 3, anchor: "start" },
        { text: "Lim", x: LIM, anchor: "middle" },
        { text: "2*Lim", x: 2 * LIM, anchor: "middle" },
        { text: "3*Lim", x: VIEWBOX_W - 2, anchor: "end" },
    ];
    labels.forEach((label, k) => {
        const x = k * tick * TICKS_PER_LIM;
        out.push(svgElem("line", { x1: x, y1: 5, x2: x, y2: 15, stroke: "black", "stroke-width": 1 }));
        const t = svgElem("text", { x: label.x, y: 25, "font-size": 9, "font-family": "serif",
                                    "text-anchor": label.anchor, "data-role": "axis-label" });
        t.textContent = label.text;
        out.push(t);
    });
    return out;
}

function pointMarks(p: Performance): SVGElement[] {
    return p.times.map(x => svgElem("rect", {
        x: x - 1, y: EVENT_Y - 1, width: 2, height: 2, fill: "black", "data-role": "point",
    }));
}

function soundLine(from: number, to: number): SVGElement {
    return svgElem("line", { x1: from, y1: EVENT_Y, x2: to, y2: EVENT_Y,
                             stroke: "black", "stroke-width": 2, "data-role": "event-line" });
}

/** The first or second sound, while the pointer draws it. */
function soundsInProgress(p: Performance): SVGElement[] {
    return [1, 2].flatMap(n => {
        const onset = p.onset(n), drawn = p.drawnEnds[n - 1];
        return onset !== undefined && drawn !== null && p.end(n) === undefined
            ? [soundLine(onset, drawn)] : [];
    });
}

function soundsPerformed(p: Performance): SVGElement[] {
    return [1, 2, 3].flatMap(n => {
        const onset = p.onset(n), end = p.end(n);
        return onset !== undefined && end !== undefined ? [soundLine(onset, end)] : [];
    });
}

/** The projective potential of the duration in progress, reaching to the
 *  pointer or, in a silence, at least to the end of the sound before it. */
function growingArc(p: Performance): SVGElement[] {
    if (p.arc === null || p.arcReach === null) return [];
    const n = p.arc === "first" ? 1 : 2;
    const onset = p.onset(n), soundEnd = p.drawnEnds[n - 1];
    if (onset === undefined || soundEnd === null) return [];
    const row = n === 1 ? ARC_ROW_1_Y : ARC_ROW_2_Y;
    return arcPathElement(growingArcPath(onset, Math.max(soundEnd, p.arcReach), row), "growing-arc");
}

/** A third onset past Lim from the second: the double bar just before
 *  where the second interonset duration became indeterminate, and the arrow
 *  to the new beginning. The bar stays in the silence between the second
 *  and third sounds, clear of both. */
function hiatus(p: Performance): SVGElement[] {
    if (p.thirdOnset !== "hiatus") return [];
    const [from, to] = [p.end(2)!, p.onset(3)!];
    // How far the bar's centre keeps from each sound.
    const clear = HIATUS_HALF_GAP + 2.5;
    const x = to - from < 2 * clear
        ? (from + to) / 2
        : Math.min(Math.max(limFrom(p.onset(2)!) - HIATUS_BEFORE_LIM, from + clear), to - clear);
    return [hiatusTracks(x), hiatusArrow(to)];
}

/** The X halfway along the projection from the crossed-out second onset. */
function crossedOut(p: Performance): SVGElement[] {
    if (p.crossedOut === null) return [];
    return [crossOut((p.crossedOut + projectedEnd(p.crossedOut)) / 2)];
}

/** A sound that would begin where the first projection ends, which would
 *  clarify a shorter projection. */
function parenthesized(p: Performance): SVGElement[] {
    if (p.thirdOnset !== "shorterProjection") return [];
    return [parenthesizedSound(projectedEnd(p.onset(2)!))];
}

/** A realized projection from x1 to x2, and its projected potential. */
function projection(x1: number, x2: number, row: number): SVGElement[] {
    return [...arcPathElement(projectionArcPath(x1, x2, row), "projection-arc"), arrowhead(x2, row)];
}

/** Each interonset duration within Lim projects itself, from the onset that
 *  ends it. */
function projections(p: Performance): SVGElement[] {
    const out: SVGElement[] = [];
    const first = p.onset(1), second = p.onset(2), third = p.onset(3);
    if (first === undefined || second === undefined) return out;

    if (second <= limFrom(first)) {
        out.push(...projection(first, second, ARC_ROW_1_Y));
        if (third !== undefined && (p.thirdOnset === "acceleration" || p.thirdOnset === "deceleration")) {
            // Realized, though early or late: the projected potential ends
            // at the third onset.
            out.push(tempoLabel(third, third > projectedEnd(second) ? "rall." : "accel."));
            out.push(dashedArc(second, third, ARC_ROW_1_Y));
        } else {
            out.push(dashedArc(second, projectedEnd(second), ARC_ROW_1_Y));
        }
    }
    // Under a hiatus the second interonset duration is indeterminate: it has
    // no projective potential.
    if (third !== undefined && third <= limFrom(second)) {
        out.push(...projection(second, third, ARC_ROW_2_Y));
        out.push(dashedArc(third, third + (third - second), ARC_ROW_2_Y));
    }
    return out;
}

/** The shorter projection reinterpreted: an accented second beginning at the
 *  third onset denies the first projection to realize a larger one. */
function alternativeView(p: Performance): SVGElement[] {
    const first = p.onset(1)!, second = p.onset(2)!, third = p.onset(3)!;
    return [
        ...projection(first, second, ARC_ROW_1_Y),
        dashedArc(second, third, ARC_ROW_1_Y, 4),
        crossOut((second + third) / 2),
        accent(third, EVENT_Y - 5),
        ...projection(first, third, ARC_ROW_2_Y),
        dashedArc(third, third + (third - first), ARC_ROW_2_Y),
    ];
}
