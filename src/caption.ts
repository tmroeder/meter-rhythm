// The saved SVG: the drawing with the commentary set as a caption below it.
// SVG text does not wrap, so the caption is broken into lines here,
// measuring each word in the live SVG.

import { emphasisRuns } from "./messages";
import { svgElem, svgGroup, SVG_NS, VIEWBOX_H, VIEWBOX_W } from "./shapes";

const CAPTION_MARGIN = 10;
const CAPTION_FONT_SIZE = 8;
const CAPTION_LINE_H = 11;
const CAPTION_FONT = "Georgia, 'Times New Roman', serif";

interface CaptionWord { text: string; bold: boolean; width: number; }

function measure(svg: SVGSVGElement, text: string, bold: boolean): number {
    const t = svgElem("text", {
        "font-size": CAPTION_FONT_SIZE, "font-family": CAPTION_FONT,
        "font-weight": bold ? "bold" : "normal", visibility: "hidden",
    }) as SVGTextElement;
    t.textContent = text;
    svg.appendChild(t);
    const w = t.getComputedTextLength();
    t.remove();
    return w;
}

function wrapCaption(svg: SVGSVGElement, message: string, maxWidth: number): CaptionWord[][] {
    const spaceW = measure(svg, "a a", false) - measure(svg, "aa", false);
    const lines: CaptionWord[][] = [];
    let line: CaptionWord[] = [];
    let lineW = 0;
    for (const run of emphasisRuns(message)) {
        for (const text of run.text.split(/\s+/).filter(w => w !== "")) {
            const width = measure(svg, text, run.bold);
            const needed = line.length ? lineW + spaceW + width : width;
            if (line.length && needed > maxWidth) {
                lines.push(line);
                line = [];
                lineW = width;
            } else {
                lineW = needed;
            }
            line.push({ text, bold: run.bold, width });
        }
    }
    if (line.length) lines.push(line);
    return lines;
}

/** A copy of the drawing in `svg`, captioned with `commentary` (with its
 *  *emphasis* in bold) on a white ground. */
export function captionedSvg(svg: SVGSVGElement, commentary: string): SVGSVGElement {
    const copy = svg.cloneNode(true) as SVGSVGElement;
    copy.setAttribute("xmlns", SVG_NS);

    const caption = svgGroup("caption");
    const lines = wrapCaption(svg, commentary, VIEWBOX_W - 2 * CAPTION_MARGIN);
    lines.forEach((words, i) => {
        const t = svgElem("text", {
            x: CAPTION_MARGIN,
            y: VIEWBOX_H + CAPTION_MARGIN + CAPTION_FONT_SIZE + i * CAPTION_LINE_H,
            "font-size": CAPTION_FONT_SIZE, "font-family": CAPTION_FONT,
        });
        // One tspan per run of same-weight words, with the spaces inside it
        // or between tspans, so viewers keep them.
        let prevBold: boolean | null = null;
        let tspan: SVGElement | null = null;
        words.forEach((w, j) => {
            const sep = j === 0 ? "" : " ";
            if (w.bold !== prevBold) {
                if (sep) t.appendChild(document.createTextNode(sep));
                tspan = svgElem("tspan", w.bold ? { "font-weight": "bold" } : {});
                tspan.textContent = w.text;
                t.appendChild(tspan);
                prevBold = w.bold;
            } else {
                tspan!.textContent += sep + w.text;
            }
        });
        caption.appendChild(t);
    });
    copy.appendChild(caption);

    const height = lines.length
        ? VIEWBOX_H + 2 * CAPTION_MARGIN + CAPTION_FONT_SIZE + (lines.length - 1) * CAPTION_LINE_H
        : VIEWBOX_H;
    copy.setAttribute("viewBox", `0 0 ${VIEWBOX_W} ${height}`);
    const bg = svgElem("rect", { width: VIEWBOX_W, height, fill: "white" });
    copy.insertBefore(bg, copy.firstChild);
    return copy;
}
