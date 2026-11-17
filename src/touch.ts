// Touch input. A finger has no hover, so each drag draws the next stretch of
// time, alternating as the mouse's moves and clicks do: the first sound, the
// silence after it, the second sound, the silence before the third.
// Dragging is moving the pointer and lifting the finger is the click that
// ends the stretch, so ending a silence begins the next sound. Touching down
// jumps the stretch to the finger, as a quick mouse move would.
//
// The first sound always begins at 0, so the first touch begins it there and
// it reaches straight to the finger. Once the performance is finished a
// touch is a click, which is how the alternative view is asked for.

import type { Performance, Phase } from "./performance";
import { VIEWBOX_W } from "./shapes";

export class TouchDrawing {
    /** Whether the finger that is down is drawing a stretch. */
    drawing = false;
    /** Where that finger is (viewBox x), or null when none is down. */
    fingerX: number | null = null;
    private readonly p: Performance;

    constructor(p: Performance) { this.p = p; }

    down(x: number): void {
        this.fingerX = x;
        if (this.p.phase === "ready") {
            this.p.click(0);
        } else if (this.p.finished) {
            this.drawing = false;
            this.p.click(x);
            return;
        }
        this.drawing = true;
        this.p.move(x);
    }

    move(x: number): void {
        this.fingerX = x;
        if (this.drawing) this.p.move(x);
    }

    up(x: number): void {
        this.fingerX = null;
        if (!this.drawing) return;
        this.drawing = false;
        this.p.click(x);
    }

    /** The finger is gone without ending the stretch: the browser took the
     *  gesture over, or the performance started again. The next touch
     *  carries on. */
    cancel(): void {
        this.drawing = false;
        this.fingerX = null;
    }
}

// ---- The indicator ----
//
// Marks beside the Instructions heading, a bar for each sound and a dashed
// arc for each silence, show which stretch the next drag draws; a tag above
// the drawing names the stretch under a drawing finger.

/** For each phase: how many stretches are drawn, and which the next (or
 *  current) drag draws, if any. */
const STEPS: Record<Phase, { done: number; now: number | null }> = {
    ready: { done: 0, now: 0 },
    firstSound: { done: 0, now: 0 },
    firstSoundTooLong: { done: 1, now: null },
    firstSilence: { done: 1, now: 1 },
    secondOnsetTooLate: { done: 2, now: null },
    secondSound: { done: 2, now: 2 },
    secondSoundTooLong: { done: 3, now: null },
    secondSilence: { done: 3, now: 3 },
    thirdOnset: { done: 4, now: null },
};

const isSilence = (step: number) => step % 2 === 1;

export function renderTouchIndicator(usingTouch: boolean, touch: TouchDrawing, phase: Phase): void {
    const stepsEl = document.getElementById("steps")!;
    const tagEl = document.getElementById("fingerTag")!;
    stepsEl.hidden = !usingTouch;
    const { done, now } = STEPS[phase];
    for (const fig of Array.from(stepsEl.children)) {
        const step = Number((fig as HTMLElement).dataset.step);
        fig.className = step === now ? "now" : step < done ? "done" : "";
    }
    const fingerX = touch.fingerX;
    const drawing = usingTouch && touch.drawing && fingerX !== null && now !== null;
    tagEl.hidden = !drawing;
    if (drawing) {
        tagEl.textContent = isSilence(now) ? "silence" : "sound";
        // Keep the tag within the drawing's width; its pointer stays on the
        // finger.
        const width = document.getElementById("svgContainer")!.clientWidth;
        const finger = (fingerX / VIEWBOX_W) * width;
        const half = tagEl.offsetWidth / 2;
        const left = Math.min(Math.max(finger, half), width - half);
        tagEl.style.left = `${left}px`;
        tagEl.style.setProperty("--pointer", `${finger - left + half}px`);
    }
}
