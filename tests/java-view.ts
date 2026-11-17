/**
 * The state of the port in the terms of the 1998 Java: its fields, flags
 * and message numbers, so the oracle can compare the two step by step.
 */

import type { Snapshot } from "./harness";

/** MESSAGE_ORDER[n] is the key of Rhythm.java's message n. */
export const MESSAGE_ORDER = [
    "intro",                         // 0
    "firstSoundBegins",              // 1
    "firstSoundGrowing",             // 2
    "firstSoundTooLong",             // 3
    "firstSoundEnds",                // 4
    "firstSoundEndsTooLong",         // 5
    "beforeFirstSoundEnd",           // 6
    "firstSilence",                  // 7
    "secondOnsetRealizes",           // 8
    "secondOnsetTooLate",            // 9
    "secondSoundRealizing",          // 10
    "secondSoundPastProjection",     // 11
    "secondSoundTooLong",            // 12
    "secondSoundEnds",               // 13
    "secondSoundEndsPastProjection", // 14
    "secondSoundEndsTooLong",        // 15
    "beforeSecondSoundEnd",          // 16
    "secondSilence",                 // 17
    "secondSilenceTooLong",          // 18
    "thirdOnsetAccelerates",         // 19
    "thirdOnsetExact",               // 20
    "thirdOnsetHiatus",              // 21
    "thirdOnsetShorterProjection",   // 22
    "alternativeView",               // 23
    "thirdOnsetDecelerates",         // 24
    "thirdOnsetRejectsProjection",   // 25
];

type JPoint = { x: number; y: number } | null;

/** The fields of Rhythm and CoordinateArea that the oracle prints. */
export interface JavaState {
    wherein: number;
    points: JPoint[];
    line1: JPoint[];
    line2: JPoint[];
    line3: JPoint[];
    arcing1: boolean;
    arcing2: boolean;
    in1: boolean;
    in2: boolean;
    done: boolean;
    clickToChange: boolean;
    inAlternativeView: boolean;
    addParenthShort: boolean;
    redrawDashedArc1: boolean;
    drawTracksFlag: boolean;
    X1: number;
    moveArcPos: JPoint;
    msgIndex: number;
}

const point = (x: number | null | undefined): JPoint =>
    x === undefined || x === null ? null : { x, y: 50 };

const FINISHED = ["firstSoundTooLong", "secondOnsetTooLate", "secondSoundTooLong", "thirdOnset"];

export function javaView(s: Snapshot): JavaState {
    const t = s.times;
    return {
        wherein: t.length - 1,
        points: [0, 1, 2, 3, 4, 5].map((i) => point(t[i])),
        // Each sound's line: its onset, and its end as drawn.
        line1: [t.length > 0 ? point(0) : null, point(s.drawnEnds[0])],
        line2: [point(t[2]), point(s.drawnEnds[1])],
        line3: [point(t[4]), point(t[5])],
        arcing1: s.arc === "first",
        arcing2: s.arc === "second",
        in1: s.phase === "firstSound",
        // The Java left in2 on after a too-late second onset.
        in2: s.phase === "secondSound" || s.phase === "secondOnsetTooLate",
        done: FINISHED.includes(s.phase),
        clickToChange: s.thirdOnset === "shorterProjection",
        inAlternativeView: s.thirdOnset === "alternativeView",
        // The Java never cleared it on the click to the alternative.
        addParenthShort: s.thirdOnset === "shorterProjection" || s.thirdOnset === "alternativeView",
        redrawDashedArc1: s.thirdOnset === "acceleration" || s.thirdOnset === "deceleration",
        drawTracksFlag: s.thirdOnset === "hiatus",
        X1: s.crossedOut ?? -1,
        moveArcPos: point(s.arcReach),
        msgIndex: MESSAGE_ORDER.indexOf(s.message),
    };
}
