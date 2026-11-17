// The marks of Hasty's notation as SVG, and the vertical layout they share.

export const SVG_NS = "http://www.w3.org/2000/svg";

// ---- Vertical layout ----
//
// Everything is derived from ARC_H, the depth of a projection arc, so that
// changing it cannot silently break the picture. A projection arc is the
// lower half of an ellipse whose ends sit on its row's centre line,
// ARC_H / 2 below the row's top, and whose lowest point is ARC_H below it.

export const ARC_H = 30;

export const VIEWBOX_W = 400;
export const EVENT_Y = 50;                                // the line of sounding events
export const ARC_ROW_1_Y = 55;                            // the first interonset projection
const ARC_ROW_GAP = 10;                                   // clear space between the rows
export const ARC_ROW_2_Y = ARC_ROW_1_Y + ARC_H / 2 + ARC_ROW_GAP;  // the second
// Tempo labels go below every arc.
export const TEMPO_LABEL_Y = arcBottomY(ARC_ROW_2_Y) + 9;
export const VIEWBOX_H = TEMPO_LABEL_Y + 4;               // room for descenders

/** Where a row's arcs end. */
export function arcEndY(row: number): number { return row + ARC_H / 2; }

/** A row's lowest point. */
export function arcBottomY(row: number): number { return row + ARC_H; }

// The hiatus indicator is a small decorative arrow, not a projection arc,
// so it keeps its own size rather than scaling with ARC_H.
const HIATUS_ARROW_W = 30;
const HIATUS_ARROW_H = 15;

export function svgElem(tag: string, attrs: Record<string, string | number>): SVGElement {
    const el = document.createElementNS(SVG_NS, tag);
    for (const [k, v] of Object.entries(attrs)) {
        el.setAttribute(k, String(v));
    }
    return el;
}

// Groups and marks carry a data-role so that tests (and anyone reading the
// saved SVG) can identify what each shape means without counting indices.
export function svgGroup(role?: string): SVGGElement {
    const g = document.createElementNS(SVG_NS, "g") as SVGGElement;
    if (role) g.setAttribute("data-role", role);
    return g;
}

function line(x1: number, y1: number, x2: number, y2: number): SVGElement {
    return svgElem("line", { x1, y1, x2, y2, stroke: "black", "stroke-width": 1 });
}

function path(d: string, role?: string): SVGElement {
    const attrs: Record<string, string | number> = { d, fill: "none", stroke: "black", "stroke-width": 1 };
    if (role) attrs["data-role"] = role;
    return svgElem("path", attrs);
}

// ---- Arcs ----
//
// Every arc lies on the lower half of an ellipse. An angle along it is in
// degrees clockwise on screen from the ellipse's right-hand end (0) through
// its lowest point (90) to its left-hand end (180).

interface Ellipse { cx: number; cy: number; rx: number; ry: number; }

/** The ellipse of a projection from x1 to x2 in an arc row. */
function rowEllipse(x1: number, x2: number, row: number): Ellipse {
    return { cx: (x1 + x2) / 2, cy: arcEndY(row), rx: (x2 - x1) / 2, ry: ARC_H / 2 };
}

function pointAt(e: Ellipse, deg: number): string {
    const t = deg * Math.PI / 180;
    return `${e.cx + e.rx * Math.cos(t)} ${e.cy + e.ry * Math.sin(t)}`;
}

/** The arc from angle `from` to angle `to`, or null when the ellipse is too
 *  narrow to draw. */
function arcPath(e: Ellipse, from: number, to: number): string | null {
    if (e.rx < 0.5 || e.ry < 0.5) return null;
    return `M ${pointAt(e, from)} A ${e.rx} ${e.ry} 0 0 1 ${pointAt(e, to)}`;
}

/** A projection's arrow: the half-ellipse from x1 to x2 in an arc row. */
export function projectionArcPath(x1: number, x2: number, row: number): string | null {
    return arcPath(rowEllipse(x1, x2, row), 0, 180);
}

/** Projective potential accumulating since `onset`: the quarter-ellipse from
 *  `reach`, at the bottom of the arc row, up to the onset. It is the first
 *  half of the arc that the duration from `onset` to `reach` would draw,
 *  projected: an arc from the onset to as far again past `reach`. */
export function growingArcPath(onset: number, reach: number, row: number): string | null {
    return arcPath(rowEllipse(onset, 2 * reach - onset, row), 90, 180);
}

/** Projected potential: nine dashes along the half-ellipse from x1 to x2,
 *  from its right-hand end, each 10 degrees with 10 between. `firstDash`
 *  leaves out the dashes before it. */
export function dashedArc(x1: number, x2: number, row: number, firstDash = 0): SVGGElement {
    const g = svgGroup("dashed-arc");
    const e = rowEllipse(x1, x2, row);
    for (let i = firstDash; i < 9; i++) {
        const d = arcPath(e, 20 * i, 20 * i + 10);
        if (d) g.appendChild(path(d));
    }
    return g;
}

// ---- Marks ----

export function arcPathElement(d: string | null, role: string): SVGElement[] {
    return d ? [path(d, role)] : [];
}

/** The arrowhead closing a projection arc at x: its base sits on the arc's
 *  end so the two meet. */
export function arrowhead(x: number, row: number): SVGGElement {
    const base = arcEndY(row);
    const apex = base - 5;
    const g = svgGroup("arrowhead");
    g.appendChild(line(x, apex, x - 5, base));
    g.appendChild(line(x, apex, x + 5, base));
    g.appendChild(line(x - 5, base, x + 5, base));
    return g;
}

/** Half the gap between the two bars of a hiatus. */
export const HIATUS_HALF_GAP = 1.5;

/** The double bar of a hiatus, centred at x on the event line. */
export function hiatusTracks(x: number): SVGGElement {
    const g = svgGroup("hiatus-tracks");
    for (const bar of [x + HIATUS_HALF_GAP, x - HIATUS_HALF_GAP]) {
        g.appendChild(line(bar, EVENT_Y - 5, bar, EVENT_Y + 5));
    }
    return g;
}

/** The small curved arrow under a sound begun after a hiatus, at x. */
export function hiatusArrow(x: number): SVGGElement {
    const g = svgGroup("hiatus-arrow");
    const top = EVENT_Y + 10;
    const e = { cx: x + HIATUS_ARROW_W / 2, cy: top + HIATUS_ARROW_H / 2,
                rx: HIATUS_ARROW_W / 2, ry: HIATUS_ARROW_H / 2 };
    // A quarter-ellipse from its tip, at the bottom, up to x.
    const tipX = x + HIATUS_ARROW_W / 2;
    const tipY = top + HIATUS_ARROW_H;
    g.appendChild(path(arcPath(e, 90, 180)!));
    g.appendChild(line(tipX - 5, tipY - 5, tipX, tipY));
    g.appendChild(line(tipX - 5, tipY + 5, tipX, tipY));
    return g;
}

/** The X through a projection not clearly realized, centred at x on the
 *  deepest point of the upper arc row. */
export function crossOut(x: number): SVGGElement {
    const mid = arcBottomY(ARC_ROW_1_Y);
    const g = svgGroup("x-mark");
    g.appendChild(line(x - 10, mid - 5, x + 10, mid + 5));
    g.appendChild(line(x - 10, mid + 5, x + 10, mid - 5));
    return g;
}

/** "accel." or "rall.", ending near x below the arcs. */
export function tempoLabel(x: number, text: string): SVGElement {
    const t = svgElem("text", { x: x - 20, y: TEMPO_LABEL_Y, "font-size": 10, "font-family": "serif",
                                "data-role": "tempo-label" });
    t.textContent = text;
    return t;
}

/** An accent mark (>), pointing at x at height y. */
export function accent(x: number, y: number): SVGGElement {
    const g = svgGroup("accent");
    g.appendChild(line(x - 2, y - 2, x + 2, y));
    g.appendChild(line(x - 2, y + 2, x + 2, y));
    return g;
}

/** A hypothetical sound beginning at x, in parentheses. */
export function parenthesizedSound(x: number): SVGGElement {
    const g = svgGroup("parenth");
    const open = svgElem("text", { x, y: EVENT_Y + 10, "font-size": 10, "font-family": "serif" });
    open.textContent = "(";
    g.appendChild(open);
    g.appendChild(line(x + 2, EVENT_Y + 5, x + 30, EVENT_Y + 5));
    const close = svgElem("text", { x: x + 32, y: EVENT_Y + 10, "font-size": 10, "font-family": "serif" });
    close.textContent = ")";
    g.appendChild(close);
    return g;
}
