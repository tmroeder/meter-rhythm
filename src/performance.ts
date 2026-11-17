// The performance: up to three sounds on the timeline, and how a listener
// hears them. A pure state machine, without the page; the page draws it
// (drawing.ts) and feeds it the pointer.
//
// The pointer draws one stretch of time at a time: the first sound, the
// silence after it, the second sound, the silence before the third. Moving
// the pointer draws the stretch without committing it; a click commits the
// point where it ends, so ending a silence begins the next sound.

import type { MessageKey } from "./messages";
import { accelerationStart, decelerationEnd, limFrom, projectedEnd } from "./theory";

/** Where the performance is. Each of the first five is drawing a stretch;
 *  the rest are finished and take no more points, only Back or Restart. */
export type Phase =
    | "ready"               // before the first sound, which begins at 0
    | "firstSound"
    | "firstSilence"
    | "secondSound"
    | "secondSilence"
    | "thirdOnset"          // complete: `thirdOnset` says how it is heard
    | "firstSoundTooLong"   // the first sound ended past Lim
    | "secondOnsetTooLate"  // the second onset came past Lim: no projection
    | "secondSoundTooLong"; // the second sound ended past Lim from its onset

/** Which duration's projective potential the growing arc shows: from 0 (the
 *  first sound, then the silence after it) or from the second onset. */
export type GrowingArc = "first" | "second";

/** How the third onset is heard. */
export type ThirdOnset =
    | "acceleration"        // early, by less than a quarter of the projection
    | "shorterProjection"   // earlier still: a shorter projection may emerge
    | "alternativeView"     // the shorter projection, reinterpreted on a click
    | "exact"               // exactly where the projection ends
    | "deceleration"        // late, by less than half the projection
    | "rejection"           // later still: the first projection is rejected
    | "hiatus";             // past Lim from the second onset

export class Performance {
    /** The committed points in order: each sound's onset, then its end. */
    times: number[] = [];
    phase: Phase = "ready";
    arc: GrowingArc | null = null;
    /** How far the growing arc reaches: the pointer, when it last followed
     *  it. Back leaves it, so a click that no move follows keeps it. */
    arcReach: number | null = null;
    /** Where the first and second sounds' lines end while they are drawn
     *  (null when the pointer is behind the onset), then their ends. */
    drawnEnds: [number | null, number | null] = [null, null];
    /** The second onset whose projection is struck through with an X, as
     *  not clearly realized. */
    crossedOut: number | null = null;
    thirdOnset: ThirdOnset | null = null;
    message: MessageKey = "intro";
    /** The last click was not after the last point. The page says so until
     *  the next message. */
    refused = false;

    /** Sound n's onset or end (n = 1, 2, 3), if committed. */
    onset(n: number): number | undefined { return this.times[2 * n - 2]; }
    end(n: number): number | undefined { return this.times[2 * n - 1]; }

    get finished(): boolean { return STRETCHES[this.phase].end === undefined; }

    /** The pointer is at x. */
    move(x: number): void {
        STRETCHES[this.phase].move?.(this, x);
    }

    /** A click at x: commits the end of the stretch being drawn. */
    click(x: number): void {
        if (this.thirdOnset === "shorterProjection") {
            this.thirdOnset = "alternativeView";
            this.show("alternativeView");
            return;
        }
        const end = STRETCHES[this.phase].end;
        if (!end) return;
        const last = this.times[this.times.length - 1];
        if (last !== undefined && x <= last) {
            this.resume();
            this.refused = true;
            return;
        }
        end(this, x);
    }

    /** Take back the last point (the third sound's onset and end together)
     *  and draw that stretch again. */
    back(): void {
        if (this.times.length === 0) return;
        this.times.length -= this.times.length === 6 ? 2 : 1;
        this.resume();
    }

    restart(): void {
        Object.assign(this, new Performance());
    }

    show(message: MessageKey): void {
        this.message = message;
        this.refused = false;
    }

    /** The growing arc follows the pointer while it grows. */
    follow(x: number): void {
        this.arcReach = this.arc ? x : null;
    }

    /** Draw again the stretch that follows the committed points. */
    private resume(): void {
        STRETCHES[RESUMED[this.times.length]].resume?.(this);
    }
}

/** The stretch being drawn, by the number of points committed. */
const RESUMED: Phase[] = ["ready", "firstSound", "firstSilence", "secondSound", "secondSilence"];

interface Stretch {
    /** The pointer is at x. */
    move?(p: Performance, x: number): void;
    /** A click at x, after the last point, ends the stretch. A finished
     *  phase has none. */
    end?(p: Performance, x: number): void;
    /** Draw the stretch again, after Back or a refused click. */
    resume?(p: Performance): void;
}

const STRETCHES: Record<Phase, Stretch> = {
    ready: {
        end(p) {
            // A click anywhere: the first sound always begins at 0.
            p.times.push(0);
            p.arc = "first";
            p.phase = "firstSound";
            p.show("firstSoundBegins");
        },
        resume(p) { p.restart(); },
    },

    firstSound: {
        move(p, x) {
            p.drawnEnds[0] = x;
            if (x === 0) {
                p.show("firstSoundBegins");
            } else if (x <= limFrom(0)) {
                p.arc = "first";
                p.show("firstSoundGrowing");
            } else {
                p.arc = null;
                p.show("firstSoundTooLong");
            }
            p.follow(x);
        },
        end(p, x) {
            p.times.push(x);
            p.drawnEnds[0] = x;
            if (x <= limFrom(0)) {
                p.phase = "firstSilence";
                p.show("firstSoundEnds");
            } else {
                // Too long to project: no arc, even when no move past Lim
                // came first.
                p.arc = null;
                p.arcReach = null;
                p.phase = "firstSoundTooLong";
                p.show("firstSoundEndsTooLong");
            }
        },
        resume(p) {
            p.phase = "firstSound";
            p.drawnEnds[0] = null;
            p.crossedOut = null;
            p.arc = "first";
            p.show("firstSoundGrowing");
        },
    },

    firstSilence: {
        move(p, x) {
            // The first interonset duration grows; past Lim it can no longer
            // be projected, and the arc stops.
            if (x > limFrom(0)) {
                p.arc = null;
                p.show("firstSilenceTooLong");
            } else {
                p.arc = "first";
                const end = p.end(1)!;
                if (x < end) p.show("beforeFirstSoundEnd");
                else if (x > end || p.message === "firstSilenceTooLong") p.show("firstSilence");
            }
            p.follow(x);
        },
        end(p, x) {
            p.times.push(x);
            p.arc = "second";
            // Lim bounds the interonset duration, measured from the onset.
            if (x <= limFrom(0)) {
                p.phase = "secondSound";
                p.show("secondOnsetRealizes");
            } else {
                p.phase = "secondOnsetTooLate";
                p.show("secondOnsetTooLate");
            }
        },
        resume(p) {
            p.phase = "firstSilence";
            p.drawnEnds[1] = null;
            p.crossedOut = null;
            p.arc = "first";
            p.show("firstSilence");
        },
    },

    secondSound: {
        move(p, x) {
            const onset = p.onset(2)!;
            p.drawnEnds[1] = x >= onset ? x : null;
            if (x <= projectedEnd(onset)) {
                p.crossedOut = null;
                if (x < projectedEnd(onset)) p.show("secondSoundRealizing");
            } else if (x <= limFrom(onset)) {
                // Outlasting the duration projected at its onset, the sound
                // does not clearly realize the projection: the X.
                p.crossedOut = onset;
                p.arc = "second";
                p.show("secondSoundPastProjection");
            } else {
                // Mensurally indeterminate: no projection left to mark.
                p.crossedOut = null;
                p.arc = null;
                p.show("secondSoundTooLong");
            }
            p.follow(x);
        },
        end(p, x) {
            p.times.push(x);
            p.drawnEnds[1] = x;
            const onset = p.onset(2)!;
            if (x > limFrom(onset)) {
                p.crossedOut = null;
                p.phase = "secondSoundTooLong";
                p.show("secondSoundEndsTooLong");
                return;
            }
            p.phase = "secondSilence";
            if (x < projectedEnd(onset)) {
                p.show("secondSoundEnds");
            } else if (x === projectedEnd(onset)) {
                p.show("thirdOnsetExact");
            } else {
                // The commentary points to the X. A move here has drawn it
                // already, but a click need not follow a move.
                p.show("secondSoundEndsPastProjection");
                p.crossedOut = onset;
            }
        },
        resume(p) {
            p.phase = "secondSound";
            p.drawnEnds[1] = null;
            p.crossedOut = null;
            p.arc = "second";
            p.show("secondSoundRealizing");
        },
    },

    secondSilence: {
        move(p, x) {
            // The second interonset duration grows, until it passes Lim.
            if (x > limFrom(p.onset(2)!)) {
                p.arc = null;
                p.show("secondSilenceTooLong");
            } else {
                p.arc = "second";
                const end = p.end(2)!;
                if (x < end) p.show("beforeSecondSoundEnd");
                else if (x > end) p.show("secondSilence");
            }
            p.follow(x);
        },
        end(p, x) {
            const onset = p.onset(2)!;
            p.arc = null;
            // The X marked a second sound that outlasted its projection;
            // how the third onset is heard now decides what is drawn.
            if (p.end(2)! > projectedEnd(onset)) p.crossedOut = null;
            const heard = hearThirdOnset(onset, x);
            p.times.push(x, THIRD_ONSETS[heard].end(onset, x));
            p.thirdOnset = heard;
            p.phase = "thirdOnset";
            p.show(THIRD_ONSETS[heard].message);
        },
        resume(p) {
            const onset = p.onset(2)!;
            p.phase = "secondSilence";
            p.arc = "second";
            p.thirdOnset = null;
            if (p.end(2)! > projectedEnd(onset)) {
                p.crossedOut = onset;
                p.show("secondSoundEndsPastProjection");
            } else {
                p.show("secondSoundEnds");
            }
        },
    },

    thirdOnset: {},
    firstSoundTooLong: {},
    secondOnsetTooLate: {},
    secondSoundTooLong: {},
};

type HeardThirdOnset = Exclude<ThirdOnset, "alternativeView">;

/** How a third onset at x is heard, after a second onset at `onset`. */
function hearThirdOnset(onset: number, x: number): HeardThirdOnset {
    if (x > limFrom(onset)) return "hiatus";
    if (x < accelerationStart(onset)) return "shorterProjection";
    if (x < projectedEnd(onset)) return "acceleration";
    if (x === projectedEnd(onset)) return "exact";
    if (x < decelerationEnd(onset)) return "deceleration";
    return "rejection";
}

/** An early third sound is drawn ending just short of the projected point,
 *  but always after its onset. */
const endsShort = (onset: number, x: number) =>
    projectedEnd(onset) - 5 > x ? projectedEnd(onset) - 5 : x + 5;
const endsAfter = (_onset: number, x: number) => x + 20;

const THIRD_ONSETS: Record<HeardThirdOnset, {
    message: MessageKey;
    /** Where the third sound is drawn ending. */
    end(onset: number, x: number): number;
}> = {
    acceleration: { message: "thirdOnsetAccelerates", end: endsShort },
    shorterProjection: { message: "thirdOnsetShorterProjection", end: endsShort },
    exact: { message: "thirdOnsetExact", end: endsAfter },
    deceleration: { message: "thirdOnsetDecelerates", end: endsAfter },
    rejection: { message: "thirdOnsetRejectsProjection", end: endsAfter },
    hiatus: { message: "thirdOnsetHiatus", end: endsAfter },
};
