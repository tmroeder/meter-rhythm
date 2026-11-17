// The test hook, window.__mr: the state of the performance, and entry points
// that bypass pixel rounding so that exact thresholds (x === 2 * onset) can
// be reached.

import { MESSAGES, type MessageKey } from "./messages";
import type { Performance } from "./performance";
import * as shapes from "./shapes";
import { LIM } from "./theory";
import type { TouchDrawing } from "./touch";

export interface Page {
    performance: Performance;
    touch: TouchDrawing;
    svgEl: SVGSVGElement;
    commentaryEl: HTMLElement;
    instructionsEl: HTMLElement;
    update(): void;
    back(): void;
    restart(): void;
    touchDown(x: number): void;
    touchMove(x: number): void;
    touchUp(x: number): void;
    showError(context: string, err: unknown): void;
    exportSvg(): string;
}

export function installDebugHook(page: Page): void {
    const p = page.performance;
    (window as any).__mr = {
        snapshot() {
            return {
                times: [...p.times],
                phase: p.phase,
                arc: p.arc,
                arcReach: p.arcReach,
                drawnEnds: [...p.drawnEnds],
                crossedOut: p.crossedOut,
                thirdOnset: p.thirdOnset,
                message: p.message,
                refused: p.refused,
                instructions: page.instructionsEl.textContent ?? "",
                commentary: page.commentaryEl.textContent ?? "",
            };
        },

        click(x: number): void { p.click(x); page.update(); },
        move(x: number): void { p.move(x); page.update(); },
        // Touch, as the pointer listeners call it (finger down, drag, lift).
        touchDown: page.touchDown,
        touchMove: page.touchMove,
        touchUp: page.touchUp,
        back: page.back,
        restart: page.restart,
        /** Show a message, whatever the state. */
        showMessage(key: MessageKey): void { p.show(key); page.update(); },
        messages: MESSAGES,
        showError: page.showError,

        svg(): string { return page.svgEl.innerHTML; },
        exportSvg: page.exportSvg,

        shapes: {
            projectionArcPath: shapes.projectionArcPath,
            growingArcPath: shapes.growingArcPath,
            dashPaths(x1: number, x2: number, row: number): string[] {
                return [...shapes.dashedArc(x1, x2, row).children].map(d => d.getAttribute("d")!);
            },
        },

        constants: {
            LIM,
            ARC_H: shapes.ARC_H,
            EVENT_Y: shapes.EVENT_Y,
            ARC_ROW_1_Y: shapes.ARC_ROW_1_Y,
            ARC_ROW_2_Y: shapes.ARC_ROW_2_Y,
            TEMPO_LABEL_Y: shapes.TEMPO_LABEL_Y,
            VIEWBOX_W: shapes.VIEWBOX_W,
            VIEWBOX_H: shapes.VIEWBOX_H,
        },
    };
}
