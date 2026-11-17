// The page: feeds mouse, touch and button input to the performance, and
// shows its drawing and messages after every change.

import { captionedSvg } from "./caption";
import { installDebugHook } from "./debug";
import { drawPerformance } from "./drawing";
import { emphasisRuns, MESSAGES, REFUSED } from "./messages";
import { Performance } from "./performance";
import { VIEWBOX_H, VIEWBOX_W } from "./shapes";
import { renderTouchIndicator, TouchDrawing } from "./touch";

const commentaryEl = document.getElementById("commentary")!;
const instructionsEl = document.getElementById("instructions")!;
const svgEl = document.getElementById("mainSvg") as unknown as SVGSVGElement;
const svgContainer = document.getElementById("svgContainer")!;

const perf = new Performance();
const touch = new TouchDrawing(perf);

// Whether the instructions speak of touch rather than the mouse. Guessed
// from the device until the first input, then follows the last input used,
// so a tablet with a trackpad reads correctly either way.
let usingTouch = window.matchMedia("(hover: none)").matches;

function setInputMode(touchInput: boolean): void {
    if (touchInput === usingTouch) return;
    usingTouch = touchInput;
    update();
}

function showText(el: HTMLElement, message: string): void {
    el.replaceChildren(...emphasisRuns(message).map(r => {
        if (!r.bold) return document.createTextNode(r.text);
        const strong = document.createElement("strong");
        strong.textContent = r.text;
        return strong;
    }));
}

/** Show the performance as it now stands. */
function update(): void {
    const message = MESSAGES[perf.message];
    showText(commentaryEl, message.commentary);
    showText(instructionsEl, perf.refused ? REFUSED
        : usingTouch ? message.touch : message.instruction);
    drawPerformance(svgEl, perf);
    renderTouchIndicator(usingTouch, touch, perf.phase);
}

function back(): void {
    perf.back();
    if (perf.phase === "ready") touch.cancel();
    update();
}

function restart(): void {
    perf.restart();
    touch.cancel();
    update();
}

// Errors are collected in #errorDisplay, where the tests look for them. It
// is shown only when the page is opened with ?debug, so errors can be read
// without dev tools (on a phone, say) but readers never see the red box.
const showErrors = new URLSearchParams(location.search).has("debug");

function showError(context: string, err: unknown): void {
    const msg = err instanceof Error ? err.message + "\n" + err.stack : String(err);
    console.error(`[${context}]`, err);
    let errDiv = document.getElementById("errorDisplay");
    if (!errDiv) {
        errDiv = document.createElement("div");
        errDiv.id = "errorDisplay";
        errDiv.hidden = !showErrors;
        errDiv.style.cssText = "background:#fee;border:2px solid #c00;color:#800;padding:8px;margin:8px 0;font-family:monospace;font-size:12px;white-space:pre-wrap;max-height:200px;overflow:auto;";
        document.querySelector(".container")!.prepend(errDiv);
    }
    errDiv.textContent += `[${context}] ${msg}\n\n`;
}

/** Run an input handler, collecting what it throws. */
function guard<E extends Event>(context: string, handler: (e: E) => void): (e: E) => void {
    return (e) => {
        try { handler(e); } catch (err) { showError(context, err); }
    };
}

/** The pointer's viewBox x. Every event is on the event line, whatever its y. */
function pointerX(e: MouseEvent): number {
    const rect = svgEl.getBoundingClientRect();
    return Math.round((e.clientX - rect.left) / rect.width * VIEWBOX_W);
}

// ---- Mouse ----

// Browsers follow a short touch with emulated mouse events, and a short
// drag through a silence looks like a tap. Cancelling the touch events
// does not stop them everywhere (Chromium sends pointer events only), so
// mouse events from a touch, or just after one, are ignored here.
let lastTouchUp = -Infinity;

function fromTouch(e: MouseEvent): boolean {
    const type = (e as PointerEvent).pointerType;
    return type === "touch" || type === "pen" || e.timeStamp - lastTouchUp < 800;
}

svgContainer.addEventListener("click", guard("click", (e: MouseEvent) => {
    if (fromTouch(e)) return;
    setInputMode(false);
    perf.click(pointerX(e));
    update();
}));

svgContainer.addEventListener("mousemove", guard("mousemove", (e: MouseEvent) => {
    if (fromTouch(e)) return;
    setInputMode(false);
    perf.move(pointerX(e));
    update();
}));

// ---- Touch and pen ----

let touchPointer: number | null = null;

/** The finger is captured, so it can stray past the ends of the drawing. */
function fingerX(e: PointerEvent): number {
    return Math.min(VIEWBOX_W, Math.max(0, pointerX(e)));
}

function touchDown(x: number): void {
    setInputMode(true);
    touch.down(x);
    update();
}

function touchMove(x: number): void {
    touch.move(x);
    update();
}

function touchUp(x: number): void {
    touch.up(x);
    update();
}

svgContainer.addEventListener("pointerdown", guard("pointerdown", (e: PointerEvent) => {
    if (e.pointerType === "mouse" || !e.isPrimary) return;
    touchPointer = e.pointerId;
    svgContainer.setPointerCapture(e.pointerId);
    touchDown(fingerX(e));
}));

svgContainer.addEventListener("pointermove", guard("pointermove", (e: PointerEvent) => {
    if (e.pointerId !== touchPointer) return;
    touchMove(fingerX(e));
}));

svgContainer.addEventListener("pointerup", guard("pointerup", (e: PointerEvent) => {
    if (e.pointerId !== touchPointer) return;
    touchPointer = null;
    lastTouchUp = e.timeStamp;
    touchUp(fingerX(e));
}));

// The browser took the gesture over (or the app lost focus). The sound
// stays sounding; the next press carries it on.
svgContainer.addEventListener("pointercancel", (e: PointerEvent) => {
    if (e.pointerId !== touchPointer) return;
    touchPointer = null;
    touch.cancel();
    update();
});

// Cancelling the touch events stops the page scrolling or zooming under
// the finger and stops the browser following up with emulated mousemove
// and click events, which would commit the gesture a second time.
for (const type of ["touchstart", "touchmove", "touchend"]) {
    svgContainer.addEventListener(type, (e) => e.preventDefault(), { passive: false });
}

// ---- Buttons ----

document.getElementById("backBtn")!.addEventListener("click", guard("back", back));
document.getElementById("restartBtn")!.addEventListener("click", guard("restart", restart));

function exportSvg(): string {
    // From the message table, not the page, which has lost the asterisks.
    const caption = captionedSvg(svgEl, MESSAGES[perf.message].commentary);
    return new XMLSerializer().serializeToString(caption);
}

document.getElementById("saveBtn")!.addEventListener("click", guard("save", () => {
    const url = URL.createObjectURL(new Blob([exportSvg()], { type: "image/svg+xml" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = "meter-as-rhythm.svg";
    a.click();
    // Safari cancels the download if the URL is revoked synchronously.
    setTimeout(() => URL.revokeObjectURL(url), 1000);
}));

installDebugHook({
    performance: perf, touch, svgEl, commentaryEl, instructionsEl,
    update, back, restart, touchDown, touchMove, touchUp, showError, exportSvg,
});

try {
    // The frame is sized by the layout, not fixed in the template, so that
    // changing ARC_H cannot push the lowest arc row out of view.
    svgEl.setAttribute("viewBox", `0 0 ${VIEWBOX_W} ${VIEWBOX_H}`);
    update();
} catch (err) {
    showError("init", err);
}
