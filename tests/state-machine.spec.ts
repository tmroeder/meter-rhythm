import { test, expect, LIM } from "./harness";

/**
 * The performance's state machine: transitions, messages, points and what
 * is drawn. The behaviour was characterized against the 1998 Java
 * (Rhythm.java and CoordinateArea.java), which java-oracle.spec.ts still
 * compares step by step. Where the Java itself is wrong, a test marked PINS
 * BUG keeps its behaviour on purpose, so that changing it is a deliberate,
 * visible decision; a test marked REGRESSION covers one fixed since.
 *
 * Coordinates are viewBox units; LIM (= 400/3 = 133) is Hasty's limit of
 * mensural determinacy.
 */

// ------------------------------------------------------------------
// The first sound
// ------------------------------------------------------------------

test.describe("first sound", () => {
    test("clicking anywhere places the onset at time 0", async ({ app }) => {
        await app.click(37); // not at the left edge
        const s = await app.state();
        expect(s.times).toEqual([0]); // forced to 0
        expect(s.arc).toBe("first");
        expect(s.phase).toBe("firstSound");
        expect(s.message).toBe("firstSoundBegins");
    });

    test("moving right within Lim accumulates projective potential", async ({ app }) => {
        await app.click(0);
        await app.move(60);
        const s = await app.state();
        expect(s.message).toBe("firstSoundGrowing");
        expect(s.arc).toBe("first");
        expect(s.drawnEnds[0]).toBe(60);
        expect(s.arcReach).toBe(60);
        expect(s.commentary).toContain("Projective potential");
    });

    test("moving past Lim makes the sound mensurally indeterminate", async ({ app }) => {
        await app.click(0);
        await app.move(60);
        await app.move(200);
        const s = await app.state();
        expect(s.message).toBe("firstSoundTooLong");
        expect(s.arc).toBeNull();
        expect(s.commentary).toContain("mensurally indeterminate");
        // REGRESSION: the Java kept the arc's last position once it stopped
        // growing, so the arc could come back frozen there.
        expect(s.arcReach).toBeNull();
        expect((await app.roleBoxes())["growing-arc"] ?? []).toEqual([]);
    });

    /**
     * REGRESSION: a click past Lim with no move there first (the test hook
     * allows it; a mouse always moves first) left the Java's arc growing,
     * and it was drawn over the whole over-long sound.
     */
    test("ending beyond Lim without moving there draws no growing arc", async ({ app }) => {
        await app.click(0);
        await app.move(38);
        await app.click(374);
        const s = await app.state();
        expect(s.message).toBe("firstSoundEndsTooLong");
        expect(s.arc).toBeNull();
        expect((await app.roleBoxes())["growing-arc"] ?? []).toEqual([]);
    });

    test("moving back inside Lim restores determinacy", async ({ app }) => {
        await app.click(0);
        await app.move(200);
        await app.move(60);
        const s = await app.state();
        expect(s.message).toBe("firstSoundGrowing");
        expect(s.arc).toBe("first");
    });

    test("returning exactly to 0 returns to the opening message", async ({ app }) => {
        await app.click(0);
        await app.move(60);
        await app.move(0);
        expect((await app.state()).message).toBe("firstSoundBegins");
    });

    test("ending within Lim gives a determinate first sound", async ({ app }) => {
        await app.firstSound(60);
        const s = await app.state();
        expect(s.times).toEqual([0, 60]);
        expect(s.phase).toBe("firstSilence");
        expect(s.message).toBe("firstSoundEnds");
        expect(s.commentary).toContain("mensurally");
    });

    test("ending exactly at Lim is still determinate", async ({ app }) => {
        await app.firstSound(LIM);
        expect((await app.state()).message).toBe("firstSoundEnds");
    });

    test("ending beyond Lim is a dead end requiring Restart", async ({ app }) => {
        await app.firstSound(LIM + 1);
        const s = await app.state();
        expect(s.message).toBe("firstSoundEndsTooLong");
        expect(s.phase).toBe("firstSoundTooLong");
        expect(s.instructions).toContain("Restart");

        // Further clicks do nothing at all.
        await app.click(300);
        expect((await app.state()).times).toEqual([0, LIM + 1]);
    });
});

// ------------------------------------------------------------------
// The silence between the first and second sounds
// ------------------------------------------------------------------

test.describe("first silence", () => {
    test("moving left of the first sound's end asks the user to go forward", async ({ app }) => {
        await app.firstSound(60);
        await app.move(50);
        const s = await app.state();
        expect(s.message).toBe("beforeFirstSoundEnd");
        expect(s.instructions).toContain("end of the first sound or later");
    });

    test("moving right of it grows the arc over sound plus silence", async ({ app }) => {
        await app.firstSound(60);
        await app.move(90);
        const s = await app.state();
        expect(s.message).toBe("firstSilence");
        expect(s.arc).toBe("first");
        expect(s.arcReach).toBe(90);
    });

    test("passing Lim from the onset stops the arc growing, and says why", async ({ app }) => {
        await app.firstSound(60);
        await app.move(90);
        await app.move(LIM + 10);
        const s = await app.state();
        expect(s.arc).toBeNull();
        // REGRESSION: the Java had no message for this, so the commentary
        // still said the arc was growing.
        expect(s.message).toBe("firstSilenceTooLong");
        expect(s.commentary).toContain("mensurally indeterminate");
    });

    test("coming back within Lim grows the arc again", async ({ app }) => {
        await app.firstSound(60);
        await app.move(LIM + 10);
        await app.move(60); // exactly the first sound's end
        const s = await app.state();
        expect(s.arc).toBe("first");
        expect(s.message).toBe("firstSilence");
    });
});

// ------------------------------------------------------------------
// The second sound
// ------------------------------------------------------------------

test.describe("second sound", () => {
    test("beginning within Lim realizes the first projection", async ({ app }) => {
        await app.firstSound(60);
        await app.move(96);
        await app.click(96);
        const s = await app.state();
        expect(s.times).toEqual([0, 60, 96]);
        expect(s.message).toBe("secondOnsetRealizes");
        expect(s.arc).toBe("second");
        expect(s.phase).toBe("secondSound");
        expect(s.commentary).toContain("realizes");
    });

    /**
     * REGRESSION: the Java measured the limit for the second onset from the
     * END of the first sound, so an interonset duration of up to Lim plus
     * the first sound's duration was accepted as a projection. Hasty's Lim
     * is an interonset limit; it is measured from the onset.
     */
    test("the second onset's limit is measured from the first sound's onset", async ({ app }) => {
        await app.firstSound(60);
        // 190 from the onset is well past Lim = 133, though 190 < 60 + 133.
        await app.click(190);
        let s = await app.state();
        expect(s.message).toBe("secondOnsetTooLate");
        expect(s.phase).toBe("secondOnsetTooLate");

        await app.restart();
        await app.firstSound(60);
        await app.click(LIM); // exactly Lim is still determinate
        s = await app.state();
        expect(s.message).toBe("secondOnsetRealizes");
        expect(s.phase).toBe("secondSound");
    });

    test("beginning too late leaves no projection at all", async ({ app }) => {
        await app.firstSound(60);
        await app.click(LIM + 1); // x > Lim
        const s = await app.state();
        expect(s.message).toBe("secondOnsetTooLate");
        expect(s.phase).toBe("secondOnsetTooLate");
        expect(s.commentary).toContain("no potential to be reproduced");
    });

    test("while shorter than the projection, it is realizing it", async ({ app }) => {
        await app.firstSound(60);
        await app.click(96);
        await app.move(150); // < 2b = 192
        const s = await app.state();
        expect(s.message).toBe("secondSoundRealizing");
        expect(s.crossedOut).toBeNull();
        expect(s.drawnEnds[1]).toBe(150);
    });

    test("exceeding the projection draws an X through the dashed arc", async ({ app }) => {
        await app.firstSound(60);
        await app.click(96);
        await app.move(210); // 2b = 192 < 210 < b + Lim = 229
        const s = await app.state();
        expect(s.message).toBe("secondSoundPastProjection");
        expect(s.crossedOut).toBe(96);
        expect(s.arc).toBe("second");
        expect(s.commentary).toContain("X through the dashed arc");
    });

    test("moving back under the projection clears the X", async ({ app }) => {
        await app.firstSound(60);
        await app.click(96);
        await app.move(210);
        await app.move(150);
        const s = await app.state();
        expect(s.crossedOut).toBeNull();
        expect(s.message).toBe("secondSoundRealizing");
    });

    test("growing past Lim makes the second sound indeterminate", async ({ app }) => {
        await app.firstSound(60);
        await app.click(96);
        await app.move(240); // > b + Lim = 229
        const s = await app.state();
        expect(s.message).toBe("secondSoundTooLong");
        expect(s.arc).toBeNull();
    });

    /**
     * REGRESSION: the Java only cleared the X on the way back below the
     * projected end, so once the sound was long enough to be indeterminate
     * the X stayed drawn, contradicting secondSoundTooLong, which says the
     * projection is simply not realized, and secondSoundEndsTooLong, which
     * says there is no projection at all.
     */
    test("the X goes once the sound becomes indeterminate", async ({ app }) => {
        await app.firstSound(60);
        await app.click(96);
        await app.move(210); // the X
        expect((await app.state()).crossedOut).toBe(96);
        expect((await app.roleBoxes())["x-mark"]).toHaveLength(1);

        await app.move(240); // past b + Lim
        expect((await app.state()).crossedOut).toBeNull();
        expect((await app.roleBoxes())["x-mark"] ?? []).toEqual([]);

        await app.click(240); // no projection at all
        expect((await app.state()).message).toBe("secondSoundEndsTooLong");
        expect((await app.roleBoxes())["x-mark"] ?? []).toEqual([]);

        await app.back();
        await app.move(210); // back within Lim: the X returns
        expect((await app.state()).crossedOut).toBe(96);
    });

    /**
     * REGRESSION: the click took whatever X the last move left. After a
     * move past Lim cleared it, a click back inside the window ended the
     * sound under secondSoundEndsPastProjection ("as indicated by the X")
     * with no X drawn. Real input always moves before it clicks; the test
     * hook need not.
     */
    test("ending past the projection draws the X even without a move there", async ({ app }) => {
        await app.firstSound(60);
        await app.click(96);
        await app.move(240); // past b + Lim: the X goes
        await app.click(210); // no move back first
        const s = await app.state();
        expect(s.message).toBe("secondSoundEndsPastProjection");
        expect(s.crossedOut).toBe(96);
        expect((await app.roleBoxes())["x-mark"]).toHaveLength(1);
    });

    test("ending before the projection completes keeps the projection", async ({ app }) => {
        await app.twoSounds(60, 96, 150);
        const s = await app.state();
        expect(s.times).toEqual([0, 60, 96, 150]);
        expect(s.phase).toBe("secondSilence");
        expect(s.message).toBe("secondSoundEnds");
        // REGRESSION: the Java's instruction here said to step back.
        expect(s.instructions).toContain("begin the third sound");
    });

    /**
     * REGRESSION: the Java made secondSoundEndsPastProjection a dead end,
     * although its commentary says the second duration's potential
     * continues to accumulate and its instruction says to begin the third
     * sound.
     */
    test("ending past the projection but within Lim lets a third sound follow", async ({ app }) => {
        await app.twoSounds(60, 96, 210);
        let s = await app.state();
        expect(s.message).toBe("secondSoundEndsPastProjection");
        expect(s.phase).toBe("secondSilence");
        expect(s.crossedOut).toBe(96);
        expect(s.instructions).toContain("begin the third sound");

        await app.move(220);
        expect((await app.state()).message).toBe("secondSilence"); // the arc grows on

        // The third onset is heard by the usual rules, which replace the X.
        await app.click(220); // 2w = 192 < 220 < 2.5w = 240, <= w + Lim = 229
        s = await app.state();
        expect(s.message).toBe("thirdOnsetDecelerates");
        expect(s.phase).toBe("thirdOnset");
        expect(s.crossedOut).toBeNull();

        await app.back(); // back to the second silence, X and all
        s = await app.state();
        expect(s.message).toBe("secondSoundEndsPastProjection");
        expect(s.crossedOut).toBe(96);
        expect(s.phase).toBe("secondSilence");

        await app.click(235); // > w + Lim
        expect((await app.state()).message).toBe("thirdOnsetHiatus");
    });

    /**
     * REGRESSION: the Java's second sound ending exactly at b + Lim matched
     * no branch, of the move or the click: the demo went on to the second
     * silence, not finished, still showing secondSoundPastProjection with
     * the X drawn. A duration of exactly Lim is determinate, so this ends
     * past the projection.
     */
    test("ending exactly at Lim is past the projection, not past Lim", async ({ app }) => {
        await app.firstSound(60);
        await app.click(96);
        await app.move(229); // = b + Lim
        let s = await app.state();
        expect(s.message).toBe("secondSoundPastProjection");
        expect(s.crossedOut).toBe(96);
        await app.click(229);
        s = await app.state();
        expect(s.message).toBe("secondSoundEndsPastProjection");
        expect(s.phase).toBe("secondSilence");
        expect(s.crossedOut).toBe(96);
    });

    test("ending past Lim denies the projection entirely", async ({ app }) => {
        await app.twoSounds(60, 96, 240);
        const s = await app.state();
        expect(s.message).toBe("secondSoundEndsTooLong");
        expect(s.phase).toBe("secondSoundTooLong");
    });

    test("ending exactly at twice the onset is an exact realization", async ({ app }) => {
        await app.twoSounds(60, 96, 192); // exactly 2b
        const s = await app.state();
        expect(s.message).toBe("thirdOnsetExact");
        // ...and unlike ending past Lim, this is not a dead end.
        expect(s.phase).toBe("secondSilence");
    });
});

// ------------------------------------------------------------------
// The silence between the second and third sounds
// ------------------------------------------------------------------

test.describe("second silence", () => {
    test("moving left of the second sound's end asks the user to go forward", async ({ app }) => {
        await app.twoSounds(60, 96, 150);
        await app.move(140);
        const s = await app.state();
        expect(s.message).toBe("beforeSecondSoundEnd");
        expect(s.arc).toBe("second");
    });

    test("moving right of it grows the second arc", async ({ app }) => {
        await app.twoSounds(60, 96, 150);
        await app.move(180);
        const s = await app.state();
        expect(s.message).toBe("secondSilence");
        expect(s.arc).toBe("second");
        expect(s.commentary).toContain("projective potential");
    });

    /**
     * REGRESSION: secondSilenceTooLong was unreachable in the Java. It
     * needed the pointer past Lim from the second sound's END, but the arc
     * stopped growing past Lim from its onset, which always comes first,
     * and the message was only set while the arc grew. The commentary froze
     * on secondSilence. The message says the time since the second sound
     * BEGAN is mensurally indeterminate, so it now shows past Lim from the
     * second onset.
     */
    test("past Lim from the second onset, the time is indeterminate", async ({ app }) => {
        await app.twoSounds(60, 96, 150);
        await app.move(229); // = second onset + Lim: still determinate
        let s = await app.state();
        expect(s.message).toBe("secondSilence");
        expect(s.arc).toBe("second");

        for (const x of [230, 250, 284, 399]) {
            await app.move(x);
            s = await app.state();
            expect(s.message, `at x=${x}`).toBe("secondSilenceTooLong");
            expect(s.arc, `at x=${x}`).toBeNull();
            expect(s.commentary).toContain("mensurally indeterminate");
        }

        await app.move(180); // back within Lim: the arc grows again
        s = await app.state();
        expect(s.message).toBe("secondSilence");
        expect(s.arc).toBe("second");
    });
});

// ------------------------------------------------------------------
// The third sound: the heart of the demonstration
// ------------------------------------------------------------------

test.describe("third sound", () => {
    // The second onset w = 96, so 1.75w = 168, 2w = 192, 2.5w = 240,
    // w + Lim = 229, and the second sound ends at 150.
    const open = async (app: any) => app.twoSounds(60, 96, 150);

    test("earlier than projected but at least 3/4 is an acceleration", async ({ app }) => {
        await open(app);
        await app.click(175); // 168 <= x < 192
        const s = await app.state();
        expect(s.message).toBe("thirdOnsetAccelerates");
        expect(s.thirdOnset).toBe("acceleration");
        expect(s.phase).toBe("thirdOnset");
        expect(s.times).toEqual([0, 60, 96, 150, 175, 2 * 96 - 5]); // the end is placed
        expect(s.commentary).toContain("acceleration");
    });

    test("exactly at the projected end realizes the projection", async ({ app }) => {
        await open(app);
        await app.click(192); // exactly 2w
        const s = await app.state();
        expect(s.message).toBe("thirdOnsetExact");
        expect(s.times[5]).toBe(212);
        expect(s.commentary).toContain("realized");
    });

    test("slightly later than projected is a deceleration", async ({ app }) => {
        await open(app);
        await app.click(210); // 2w < x < 2.5w
        const s = await app.state();
        expect(s.message).toBe("thirdOnsetDecelerates");
        expect(s.thirdOnset).toBe("deceleration");
        expect(s.commentary).toContain("deceleration");
    });

    test("much later than projected produces hiatus and railroad tracks", async ({ app }) => {
        await open(app);
        await app.click(250); // > w + Lim = 229
        const s = await app.state();
        expect(s.message).toBe("thirdOnsetHiatus");
        expect(s.thirdOnset).toBe("hiatus");
        expect(s.commentary).toContain("hiatus");
        expect((await app.roleBoxes())["hiatus-tracks"]).toHaveLength(1);
    });

    test("well before the projection offers an alternative reading", async ({ app }) => {
        await open(app);
        await app.click(160); // second sound's end <= x < 1.75w
        const s = await app.state();
        expect(s.message).toBe("thirdOnsetShorterProjection");
        expect(s.thirdOnset).toBe("shorterProjection");
        expect((await app.roleBoxes())["parenth"]).toHaveLength(1);
        expect(s.instructions).toContain("alternate interpretation");
    });

    test("clicking again switches to the accented alternative view", async ({ app }) => {
        await open(app);
        await app.click(160);
        await app.click(300); // anywhere
        const s = await app.state();
        expect(s.thirdOnset).toBe("alternativeView");
        expect(s.phase).toBe("thirdOnset");
        expect(s.message).toBe("alternativeView");
        expect(s.commentary).toContain("accent");
    });

    test("somewhat later than projected breaks off a new projection", async ({ app }) => {
        // The window is 2.5w <= x <= w + Lim, which is only non-empty when
        // w < 133/1.5, so this needs an early second onset.
        await app.twoSounds(60, 80, 130);
        await app.click(205); // 2.5w = 200 < 205 < w + Lim = 213
        const s = await app.state();
        expect(s.message).toBe("thirdOnsetRejectsProjection");
        expect(s.commentary).toContain("breaking off");
    });

    /**
     * REGRESSION: the Java left a third onset exactly at 2.5w or at w + Lim
     * in no branch: the display stayed on secondSilence and every click was
     * ignored. A duration of exactly Lim is determinate, and one of exactly
     * 1.5 times the projected duration is no longer heard as a deceleration.
     */
    test("a third onset on a boundary is classified", async ({ app }) => {
        // w = 80: 2.5w = 200 <= w + Lim = 213.
        for (const [x, msg] of [[200, "thirdOnsetRejectsProjection"], [213, "thirdOnsetRejectsProjection"],
                                [214, "thirdOnsetHiatus"]] as const) {
            await app.restart();
            await app.twoSounds(60, 80, 130);
            await app.click(x);
            const s = await app.state();
            expect(s.message, `at x=${x}`).toBe(msg);
            expect(s.phase, `at x=${x}`).toBe("thirdOnset");
        }
        // w = 96: w + Lim = 229 < 2.5w = 240.
        for (const [x, msg] of [[229, "thirdOnsetDecelerates"], [240, "thirdOnsetHiatus"]] as const) {
            await app.restart();
            await app.twoSounds(60, 96, 150);
            await app.click(x);
            expect((await app.state()).message, `at x=${x}`).toBe(msg);
        }
    });

    /**
     * Faithful to Java, and correct (decided with John Roeder): the window
     * for rejecting the projection, 2.5w <= x <= w + Lim, is empty whenever
     * the second sound begins at w > 133/1.5 = 88.67. A second interonset
     * duration of 1.5 times the first is then past Lim, so it is mensurally
     * indeterminate and heard as hiatus, not as a breaking-off projection.
     */
    test("a late second onset leaves no third onset rejecting the projection", async ({ app }) => {
        await app.twoSounds(60, 96, 150);
        for (let x = 151; x < 400; x++) {
            await app.click(x);
            expect((await app.state()).message, `at x=${x}`).not.toBe("thirdOnsetRejectsProjection");
            await app.restart();
            await app.twoSounds(60, 96, 150);
        }
    });

    /**
     * REGRESSION: the acceleration used to draw the sound backwards.
     *
     * The third sound's end is placed at 2w - 5. When the onset is in
     * [2w - 5, 2w) that is not after it, and the Java refused the end as a
     * point while drawing the sound to it regardless: an acceleration
     * commentary over a "Not a well-defined event" warning, a missing sixth
     * point, and a backwards segment.
     *
     * The end is now placed 5 after the onset, but only when the Java's end
     * would be at or before it.
     */
    test("clicking just under the projected end still gives a valid sound", async ({ app }) => {
        await open(app); // w = 96, so the old bad window was [187, 192)
        await app.click(190);
        const s = await app.state();

        expect(s.message).toBe("thirdOnsetAccelerates"); // still: the onset IS early
        expect(s.refused).toBe(false);
        expect(s.times.slice(4)).toEqual([190, 195]); // x + 5
        expect(s.phase).toBe("thirdOnset");
        await app.assertNoErrors();
    });

    test("an ordinary acceleration still ends at the projected point", async ({ app }) => {
        await open(app);
        await app.click(175); // room for 2w - 5 = 187
        expect((await app.state()).times[5]).toBe(187);
    });

    test("an end just after the onset keeps the Java's place", async ({ app }) => {
        // 2w - 5 = 187 is after the onset at 184, though by less than 5:
        // the Java's end stands.
        await open(app);
        await app.click(184);
        expect((await app.state()).times[5]).toBe(187);
    });
});

test.describe("out-of-order clicks", () => {
    /**
     * REGRESSION: a backwards click used to corrupt the state and then throw.
     *
     * The Java's newPoint refused it and then stepped back one state too
     * far (backOne(wherein + 2) where Back used wherein + 1): after the
     * first sound it took the second sound as begun with no onset, and the
     * next mouse move dereferenced it and raised a TypeError. Its
     * handleMouseDown also went on afterwards to re-run the previous step,
     * overwriting both the warning and the previous event's drag line.
     */
    test("clicking backwards after the first sound is refused cleanly", async ({ app }) => {
        await app.firstSound(60);
        await app.click(50); // before the first sound's end
        const s = await app.state();

        // No point is added...
        expect(s.times).toEqual([0, 60]);

        // ...we stay in the silence before the second sound...
        expect(s.phase).toBe("firstSilence");
        expect(s.arc).toBe("first");
        expect(s.message).toBe("firstSilence");

        // ...the warning survives, instead of being overwritten twice...
        expect(s.refused).toBe(true);
        expect(s.instructions).toBe("Not a well-defined event. Try again");

        // ...and the first sound is left alone.
        expect(s.drawnEnds[0]).toBe(60);
    });

    test("...and the next mouse move recovers rather than throwing", async ({ app }) => {
        await app.firstSound(60);
        await app.click(50);
        await app.move(90); // would previously raise a TypeError

        const s = await app.state();
        expect(s.message).toBe("firstSilence"); // back to describing the silence
        expect(s.refused).toBe(false);
        expect(s.arc).toBe("first");
        await app.assertNoErrors();
    });

    test("the user can simply click again, further right", async ({ app }) => {
        await app.firstSound(60);
        await app.click(50);
        await app.click(96); // a valid second onset
        const s = await app.state();
        expect(s.times).toEqual([0, 60, 96]);
        expect(s.message).toBe("secondOnsetRealizes");
    });

    test("clicking at exactly the previous point is also refused", async ({ app }) => {
        await app.firstSound(60);
        await app.click(60); // a point must come after the last
        const s = await app.state();
        expect(s.times).toEqual([0, 60]);
        expect(s.phase).toBe("firstSilence");
        expect(s.instructions).toBe("Not a well-defined event. Try again");
    });

    test("a backwards click during the second silence is refused cleanly", async ({ app }) => {
        await app.twoSounds(60, 96, 150);
        await app.click(120); // before the second sound's end
        const s = await app.state();
        expect(s.times).toEqual([0, 60, 96, 150]);
        expect(s.instructions).toBe("Not a well-defined event. Try again");
        await app.assertNoErrors();
    });
});

// ------------------------------------------------------------------
// Back and Restart
// ------------------------------------------------------------------

test.describe("back one step", () => {
    test("is a no-op before anything is defined", async ({ app }) => {
        await app.back();
        const s = await app.state();
        expect(s.times).toEqual([]);
        expect(s.message).toBe("intro");
    });

    test("from the first onset resets everything", async ({ app }) => {
        await app.click(0);
        await app.back();
        const s = await app.state();
        expect(s.times).toEqual([]);
        expect(s.phase).toBe("ready");
        expect(s.arc).toBeNull();
        expect(s.message).toBe("intro");
    });

    test("from the end of the first sound re-enters it", async ({ app }) => {
        await app.firstSound(60);
        await app.back();
        const s = await app.state();
        expect(s.times).toEqual([0]);
        expect(s.phase).toBe("firstSound");
        expect(s.drawnEnds[0]).toBeNull();
        expect(s.arc).toBe("first");
        expect(s.message).toBe("firstSoundGrowing");
    });

    /**
     * REGRESSION: secondOnsetTooLate says to click "Back one step" to choose
     * an earlier second onset. The Java's Back did not leave the dead end,
     * so it showed firstSilence ("click to begin the second sound") and
     * ignored every click and move until Back or Restart was pressed again.
     */
    test("from a too-late second onset lets an earlier one be chosen", async ({ app }) => {
        await app.firstSound(60);
        await app.move(300);
        await app.click(300); // > Lim
        expect((await app.state()).message).toBe("secondOnsetTooLate");

        await app.back();
        let s = await app.state();
        expect(s.times).toEqual([0, 60]);
        expect(s.message).toBe("firstSilence");
        expect(s.phase).toBe("firstSilence");

        await app.move(100);
        await app.click(100);
        s = await app.state();
        expect(s.times).toEqual([0, 60, 100]);
        expect(s.message).toBe("secondOnsetRealizes");
        expect(s.phase).toBe("secondSound");
    });

    test("from the second onset returns to the first silence", async ({ app }) => {
        await app.firstSound(60);
        await app.click(96);
        await app.back();
        const s = await app.state();
        expect(s.times).toEqual([0, 60]);
        expect(s.phase).toBe("firstSilence");
        expect(s.arc).toBe("first");
        expect(s.crossedOut).toBeNull();
        expect(s.message).toBe("firstSilence");
    });

    /**
     * REGRESSION: the Java kept the abandoned second sound's drawn end, so
     * the next second onset drew a line from itself to where the old sound
     * had reached (until the pointer moved again).
     */
    test("from the second sound forgets how far it was drawn", async ({ app }) => {
        await app.firstSound(60);
        await app.click(96);
        await app.move(150);
        await app.back();
        await app.click(110); // a new second onset, no move yet
        const s = await app.state();
        expect(s.times[2]).toBe(110);
        expect(s.drawnEnds[1]).toBeNull();
        // Only the first sound is drawn.
        expect((await app.roleBoxes())["event-line"]).toHaveLength(1);
    });

    test("from the end of the second sound re-enters it", async ({ app }) => {
        await app.twoSounds(60, 96, 150);
        await app.back();
        const s = await app.state();
        expect(s.times).toEqual([0, 60, 96]);
        expect(s.phase).toBe("secondSound");
        expect(s.drawnEnds[1]).toBeNull();
        expect(s.arc).toBe("second");
        expect(s.message).toBe("secondSoundRealizing");
    });

    test("from the third sound removes both of its points at once", async ({ app }) => {
        await app.twoSounds(60, 96, 150);
        await app.click(175); // its onset and end
        expect((await app.state()).times).toHaveLength(6);

        await app.back();
        const s = await app.state();
        expect(s.times).toEqual([0, 60, 96, 150]);
        expect(s.arc).toBe("second");
        expect(s.phase).toBe("secondSilence");
        expect(s.thirdOnset).toBeNull();
        expect(s.message).toBe("secondSoundEnds");
    });

    test("clears the alternative view", async ({ app }) => {
        await app.twoSounds(60, 96, 150);
        await app.click(160);
        await app.click(300); // into the alternative view
        await app.back();
        const s = await app.state();
        expect(s.thirdOnset).toBeNull();
        expect(s.message).toBe("secondSoundEnds");
    });

    test("stepping all the way back reaches the opening state", async ({ app }) => {
        await app.twoSounds(60, 96, 150);
        for (let i = 0; i < 6; i++) await app.back();
        const s = await app.state();
        expect(s.times).toEqual([]);
        expect(s.message).toBe("intro");
    });
});

/**
 * REGRESSION: Restart used to throw.
 *
 * The Java's Restart cleared the points, showed the opening message, and
 * only then cleared the drawing flags. That was harmless because repaint()
 * merely schedules a paint, so the flags were clear by the time paint()
 * read them. Drawing synchronously, the port drew the railroad tracks (or
 * the parentheses) with the second onset already gone.
 */
test.describe("restart from a state with marks drawn", () => {
    test("after a hiatus (railroad tracks)", async ({ app }) => {
        await app.twoSounds(60, 96, 150);
        await app.click(250);
        expect((await app.state()).thirdOnset).toBe("hiatus");

        await app.restart();
        expect((await app.state()).times).toEqual([]);
        await app.assertNoErrors();
    });

    test("after the parenthesized alternative", async ({ app }) => {
        await app.twoSounds(60, 96, 150);
        await app.click(160);
        expect((await app.state()).thirdOnset).toBe("shorterProjection");

        await app.restart();
        expect((await app.state()).times).toEqual([]);
        await app.assertNoErrors();
    });

    test("after the alternative view", async ({ app }) => {
        await app.twoSounds(60, 96, 150);
        await app.click(160);
        await app.click(300);
        expect((await app.state()).thirdOnset).toBe("alternativeView");

        await app.restart();
        expect((await app.state()).times).toEqual([]);
        await app.assertNoErrors();
    });
});

test("restart clears every piece of state", async ({ app }) => {
    await app.twoSounds(60, 96, 150);
    await app.click(250); // hiatus
    await app.restart();

    const s = await app.state();
    expect(s).toMatchObject({
        times: [],
        phase: "ready",
        arc: null,
        arcReach: null,
        drawnEnds: [null, null],
        crossedOut: null,
        thirdOnset: null,
        message: "intro",
        refused: false,
    });
});
