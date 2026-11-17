// What the page says in each situation: the commentary on what a listener
// hears, the instruction for the mouse, and the instruction for touch. On a
// touch screen each drag draws the next stretch of time, sound and silence
// in turn, and lifting the finger ends it (see touch.ts).

export interface Message {
    commentary: string;
    instruction: string;
    touch: string;
}

const backOrRestart = `Click on "Back one step" to define a different third sound or "Restart" to begin again.`;
const tapBackOrRestart = `Tap "Back one step" to define a different third sound or "Restart" to begin again.`;
const beginThirdSound = "Click the mouse to begin the third sound.";
const touchThirdOnset = "Now touch where the third sound should begin. The silence reaches to your finger; slide to adjust it, and lift.";

export const MESSAGES = {
    // The first sound
    intro: {
        commentary: `This applet demonstrates the concepts in Chapter 7 of Christopher Hasty's "Meter as Rhythm". Imagine time 0 as an instant that is a potential beginning of a sound, yet prior to and independent of it.`,
        instruction: `You may perform graphically up to three successive sounds by clicking and moving the mouse. First, click the mouse at time 0, the leftmost point, but don't move it.`,
        touch: `Each touch draws the next stretch of time: the first sound, the silence after it, the second sound, then the silence before the third. Touch where the stretch should end; it reaches to your finger. Slide to adjust it, and lift to end it. The first sound begins at 0.`,
    },
    firstSoundBegins: {
        commentary: `The first sound begins, but time 0 will not be a beginning until it is past.`,
        instruction: "Perform the first sound by moving the mouse to the right.",
        touch: "Slide to the right to draw the first sound, and lift your finger where it should end.",
    },
    firstSoundGrowing: {
        commentary: `The first sound is becoming. Time 0 becomes its beginning. "Projective potential"--the potential of a duration to be reproduced by a successive duration--accumulates, as indicated by the solid arc.`,
        instruction: "End the first sound by clicking the mouse.",
        touch: "Lift your finger where the first sound should end.",
    },
    firstSoundTooLong: {
        commentary: `The first sound's duration is so long that it is "mensurally indeterminate"--it has lost its projective potential to be reproduced.`,
        instruction: `To make the first sound's duration determinate, move the mouse back to the left. Or click to end the sound.`,
        touch: `To make the first sound's duration determinate, slide back to the left. Or lift your finger to end it here.`,
    },
    firstSoundEnds: {
        commentary: `The first sound ends. Its duration is "mensurally determinate" because it has the potential for being precisely reproduced.`,
        instruction: "To begin the second sound, click the mouse.",
        touch: "Now touch where the second sound should begin. The silence reaches to your finger; slide to adjust it, and lift.",
    },
    firstSoundEndsTooLong: {
        commentary: `The first sound ends; it is too long to have projective potential.`,
        instruction: "Click on the Restart button to try again.",
        touch: `Tap the "Restart" button to try again.`,
    },

    // The silence after it, and the second onset
    beforeFirstSoundEnd: {
        commentary: "",
        instruction: "Click the mouse at the end of the first sound or later.",
        touch: "Slide past the end of the first sound, and lift your finger where the second sound should begin.",
    },
    firstSilence: {
        commentary: `There is a pause between the first two sounds. Its duration is relatively indeterminate, if our attention is focused on the beginning of sounds. The growing arc indicates that the duration of the first sound *plus* the following silence itself has the "projective potential" to be reproduced.`,
        instruction: "Click the mouse to begin the second sound.",
        touch: "Lift your finger where the second sound should begin.",
    },
    firstSilenceTooLong: {
        commentary: `The time since the beginning of the first sound is mensurally indeterminate, having no projective potential to be reproduced.`,
        instruction: "Click the mouse to begin the second sound (earlier if you want a projection).",
        touch: "Lift your finger where the second sound should begin (earlier if you want a projection).",
    },
    secondOnsetRealizes: {
        commentary: `This beginning of the second sound "realizes" the projective potential of the duration begun by the first event's attack. The solid arrow represents this projective potential. The event now beginning has the potential to reproduce this past duration. The dotted arc, extending for this duration into the future, symbolizes this "projected potential".`,
        instruction: "Perform the second sound by moving the mouse to the right.",
        touch: "Now touch where the second sound should end. It reaches to your finger; slide to adjust it, and lift.",
    },
    secondOnsetTooLate: {
        commentary: `The second sound begins. It is so long since the beginning of the first event that the interonset duration is mensurally indeterminate--it has no potential to be reproduced--so there is no projection.`,
        instruction: `Click on the "Back one step" button to select an earlier beginning for the second sound, or click "Restart".`,
        touch: `Tap "Back one step" to select an earlier beginning for the second sound, or tap "Restart".`,
    },

    // The second sound
    secondSoundRealizing: {
        commentary: `The accumulating duration of the second sound is realizing the projected potential (symbolized by the dashed arc) of the first interonset duration. Simultaneously the present event accumulates its own projective potential (represented by the growing solid arc) to be reproduced by a successive, third event.`,
        instruction: "Click the mouse to end the second sound.",
        touch: "Lift your finger where the second sound should end.",
    },
    secondSoundPastProjection: {
        commentary: `The second sound exceeds the duration projected at its onset; the projection is not clearly realized, as indicated by the X through the dashed arc.`,
        instruction: "Click the mouse to end the second sound.",
        touch: "Lift your finger where the second sound should end.",
    },
    secondSoundTooLong: {
        commentary: `The second sound is so long that it is mensurally indeterminate. (The projection of the first interonset duration is not realized.)`,
        instruction: `Move the mouse to the left to shorten the second sound, or click the mouse to end it.`,
        touch: `Slide back to the left to shorten the second sound, or lift your finger to end it here.`,
    },
    secondSoundEnds: {
        commentary: `The second sound ends. Its duration is "mensurally determinate" because it has the potential for being precisely reproduced. But it does not affect the projection of the first interonset duration, shown by the arrow and dashed arc`,
        instruction: beginThirdSound,
        touch: touchThirdOnset,
    },
    secondSoundEndsPastProjection: {
        commentary: `The second sound exceeds the duration projected at its onset. The projection is not clearly realized, as indicated by the X through the dashed arc. The projective potential of the duration initiated by the second sound's beginning continues to accumulate.`,
        instruction: beginThirdSound,
        touch: touchThirdOnset,
    },
    secondSoundEndsTooLong: {
        commentary: `The second sound is so long that it is mensurally indeterminate. Since the projected potential of the first interonset duration is denied there is no projection at all.`,
        instruction: `Click on the "Back one step" button to define a different second sound or "Restart" to start all over.`,
        touch: `Tap "Back one step" to define a different second sound or "Restart" to start all over.`,
    },

    // The silence after it
    beforeSecondSoundEnd: {
        commentary: "",
        instruction: "Click the mouse at the end of the second sound or later.",
        touch: "Slide past the end of the second sound, and lift your finger where the third sound should begin.",
    },
    secondSilence: {
        commentary: `The silence between the second and third sounds is relatively indeterminate if our attention is focused on the sounds' beginnings. The growing arc indicates that the duration from the beginning of the second sound up to now, including the silence, has "projective potential" to be reproduced.`,
        instruction: "Click the mouse button to begin the third sound.",
        touch: "Lift your finger where the third sound should begin.",
    },
    secondSilenceTooLong: {
        commentary: `The time since the beginning of the second sound is mensurally indeterminate, having no projective potential to be reproduced.`,
        instruction: `Click the mouse button to begin the third sound (earlier if you want a projection).`,
        touch: `Lift your finger where the third sound should begin (earlier if you want a projection).`,
    },

    // The third onset
    thirdOnsetAccelerates: {
        commentary: `The beginning of the third sound is earlier than projected. The second interonset duration is shorter than, but at least three-fourths of the first interonset duration. We feel an *acceleration* because we sense the realization of the first projected duration even as we also perceive the difference between the two durations.`,
        instruction: backOrRestart,
        touch: tapBackOrRestart,
    },
    thirdOnsetExact: {
        commentary: `Since the third sound begins exactly at the end of the projected duration (the upper dashed arc), the projected duration is "realized". A new projection is created, conditioned by the first, in which the second interonset duration has the projective potential (the lower arrow) to be reproduced.`,
        instruction: backOrRestart,
        touch: tapBackOrRestart,
    },
    thirdOnsetHiatus: {
        commentary: `The projective potential of the first interonset duration (the dashed arc) is realized, but the projective potential of the second interonset duration is not, since it is mensurally indeterminate. Because the third sound begins much later than projected, we may come to feel "hiatus" (symbolized by the double bar)--a break between the realization of projected potential and a new beginning. A new and relatively unconditioned potential emerges from the beginning of the third sound.`,
        instruction: backOrRestart,
        touch: tapBackOrRestart,
    },
    thirdOnsetShorterProjection: {
        commentary: `The projection of the first interonset duration is realized. Another projection (the rightmost arrow and dashed arc) can be completed within the promised duration, so may enhance its mensural determinacy. The emergence of a new beginning, shown in parentheses, would clarify this.`,
        instruction: "Click anywhere to see an alternate interpretation.",
        touch: "Tap anywhere to see an alternate interpretation.",
    },
    alternativeView: {
        commentary: `In this interpretation the accent symbolizes an unequivocal second beginning that denies the projection of the first interonset duration in order to realize a larger projective potential, symbolized by the large arrow.`,
        instruction: backOrRestart,
        touch: tapBackOrRestart,
    },
    thirdOnsetDecelerates: {
        commentary: `The beginning of the third sound is slightly later than projected. We hear a *deceleration* because we sense the realization of the first projected duration even as we also perceive the difference between the two durations.`,
        instruction: backOrRestart,
        touch: tapBackOrRestart,
    },
    thirdOnsetRejectsProjection: {
        commentary: `The third sound begins somewhat later than projected. A new projection, indicated by the lowest arrow and dashed arc, emerges, breaking off from the emerging first projection. We reject the relevance of the first projection to the mensural determinacy of the second interonset duration.`,
        instruction: backOrRestart,
        touch: tapBackOrRestart,
    },
} satisfies Record<string, Message>;

export type MessageKey = keyof typeof MESSAGES;

/** Shown in place of the instruction when a click is not after the last
 *  point, until the next message. */
export const REFUSED = "Not a well-defined event. Try again";

// Messages mark emphasis with *asterisks*. Split a message into runs so the
// page and the saved SVG can both set the emphasized words in bold.
export interface TextRun { text: string; bold: boolean; }

export function emphasisRuns(message: string): TextRun[] {
    return message.split("*")
        .map((text, i) => ({ text, bold: i % 2 === 1 }))
        .filter(r => r.text !== "");
}
