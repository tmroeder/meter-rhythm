# Meter as Rhythm: interactive projection demo

An interactive demonstration of Christopher Hasty's theory of metrical
projection, from chapter 7 of *Meter as Rhythm* (Oxford, 1997). You perform
up to three sounds on a timeline, by mouse or by touch. The demo draws the
projections between them in Hasty's notation (projection arcs, arrows,
dashed arcs, the X of a projection not realized, the double bar of hiatus)
and explains what a listener hears.

It began as a port of a 1998 Java applet. Program design: John Roeder.
Original Java: Tom Roeder, 1998
([tmroeder/meter-rhythm](https://github.com/tmroeder/meter-rhythm)). The
Java is kept in `tests/java/original/`, where the tests compare the two.

## Requirements

| What | Needed for | Notes |
|---|---|---|
| Node.js and npm | everything | Tested with Node 25 and 26. |
| `npm ci` | everything | Installs TypeScript (type checking), esbuild (bundling) and Playwright. Nothing global is needed. npm may warn that it skipped esbuild's install script; esbuild works without it. |
| `npx playwright install chromium` | the browser tests | Downloads Playwright's Chromium, once. |
| A JDK, with `javac` and `java` on the `PATH` | the Java comparison tests | Optional: without it those 21 tests are skipped. Tested with JDK 8 (Zulu 8.0.512, Oracle 1.8.0_201). |
| Xcode, `xcodegen`, `python3` and an iOS simulator | the iOS tests | Optional, macOS only. `brew install xcodegen`. The simulator defaults to "iPhone 17 Pro". |

## Build and run

```bash
npm ci
./build.sh
open build/meter-rhythm.html
```

`build.sh` type-checks `src/` with `tsc` (which emits nothing), bundles
`src/main.ts` and the modules it imports into `build/app.js` with esbuild,
and copies `src/template.html` to `build/meter-rhythm.html`, which loads
`app.js` from the same folder. The page works from `file://` and needs no
server.

The source is plain TypeScript in ES modules, with erasable syntax only (no
enums or namespaces, checked by `erasableSyntaxOnly`), so it does not lean
on compiler features that come and go. TypeScript 7 removed the
`outFile` and `module: "none"` options that an earlier build depended on.

To put it on a web server, copy those two files into one directory. The HTML
file may be renamed (to `index.html`, say); `app.js` may not.

## How it works

```
src/
  theory.ts       Lim and Hasty's thresholds
  performance.ts  the performance as a state machine, without the page
  messages.ts     what the page says in each situation
  drawing.ts      the picture of a performance, layer by layer
  shapes.ts       the notation's marks as SVG, and the vertical layout
  touch.ts        touch input and its indicator
  caption.ts      the saved SVG, captioned with the commentary
  main.ts         the page: input, buttons, error box; the entry point
  debug.ts        window.__mr, the test hook
  template.html   the page's HTML and CSS
tests/            Playwright specs; java/ holds the 1998 Java and its driver
ios-tests/        XCUITest: real touches in Mobile Safari
```

### Hasty's thresholds

`theory.ts`. The timeline is 400 viewBox units, three Lim long:
`LIM` = 400/3, integer-divided, is 133, about 2 seconds. The first sound
always begins at 0, so the second onset's x is also the first interonset
duration.

- `limFrom(t)` = t + Lim: the last moment at which a duration begun at t is
  mensurally determinate. A duration of exactly Lim is determinate.
- `projectedEnd(w)` = 2w: where the first interonset duration, projected
  from the second onset w, ends.
- `accelerationStart(w)` = 1.75w and `decelerationEnd(w)` = 2.5w: a third
  onset in [1.75w, 2w) is an acceleration, in (2w, 2.5w) a deceleration.

### The performance

`performance.ts` holds everything the demo knows, in a `Performance`:

- `times`: the committed points, each sound's onset and then its end;
  `onset(n)` and `end(n)` read them by sound.
- `phase`: the stretch being drawn (`ready`, `firstSound`, `firstSilence`,
  `secondSound`, `secondSilence`), or a finished phase: `thirdOnset`, or the
  dead ends `firstSoundTooLong`, `secondOnsetTooLate` and
  `secondSoundTooLong`. A finished phase takes no more points, only Back or
  Restart.
- `arc` (`first`, `second` or null): whose projective potential the growing
  arc shows, from 0 or from the second onset; `arcReach`: how far it reaches.
- `drawnEnds`: where the first and second sounds' lines end while drawn.
- `crossedOut`: the second onset whose projection carries an X.
- `thirdOnset`: how the third onset is heard: `acceleration`,
  `shorterProjection` (then `alternativeView` on the next click), `exact`,
  `deceleration`, `rejection` or `hiatus`.
- `message`: the key of the message shown; `refused`: the last click was
  not after the last point, and the page says so instead of the instruction.

The pointer draws one stretch at a time. `move(x)` draws it without
committing it, and `click(x)` commits the point where it ends, so ending a
silence begins the next sound. `back()` takes back the last point (the
third sound's onset and end together) and `restart()` starts again. Each
phase's behaviour is an entry in the `STRETCHES` table: its `move`, its
`end` on a click, and how it `resume`s after Back or a refused click. How a
third onset is heard is `hearThirdOnset`, and `THIRD_ONSETS` gives each
hearing its message and where the third sound is drawn ending.

### Messages

`MESSAGES` in `messages.ts` is keyed by the situation each message describes
(`firstSilence`, `thirdOnsetAccelerates`, …). Each has its `commentary`, its
`instruction` for the mouse and its `touch` wording. The touch wording is
used when the last input was touch (initially, when the device has no
hover). Emphasis is marked with `*asterisks*`, set in bold on the page and
in the saved SVG.

### Drawing

`drawPerformance` in `drawing.ts` redraws the SVG from the state after every
change, as layers: the timeline, the points, the sounds, then either the
alternative view or the growing arc, the hiatus marks, the X, the
parenthesized sound and the projections. Each interonset duration within
Lim projects itself from the onset that ends it.

`shapes.ts` draws the marks. Every arc lies on the lower half of an ellipse,
with angles measured clockwise from its right-hand end (0) through its
lowest point (90) to its left-hand end (180). The vertical layout is derived
from `ARC_H`, the arc depth (30). The viewBox is 400 wide; its height (123
at `ARC_H` = 30) is set on the `<svg>` at startup, not in the template.

Drawn shapes carry `data-role` attributes (`projection-arc`, `dashed-arc`,
`arrowhead`, `x-mark`, `hiatus-tracks`, `tempo-label`, …) so tests can
query them by meaning.

### Touch input

`touch.ts`. Touch has no hover, so each drag draws the next stretch of time,
sound and silence in turn: the first sound, the silence after it, the
second sound, the silence before the third. Lifting the finger ends the
stretch, so ending a silence begins the next sound. Dragging is moving the
mouse and lifting is the click. The first touch also clicks at 0, since the
first sound always begins there, and the sound reaches to the finger. Once
the performance is finished a touch is a click (the alternative view).

The indicator (touch only): marks beside the Instructions heading, a bar
for each sound and a dashed arc for each silence, show which stretch the
next drag draws, and a tag above the drawing names the stretch under the
finger while it drags.

The touch events on the drawing are cancelled so the page does not pan,
and mouse events from a touch or within 800 ms of a lift are ignored: a
short drag through a silence looks like a tap, and Chromium follows it
with an emulated click even so.

### Errors

Exceptions in the event handlers are caught and collected in
`#errorDisplay`. The box is hidden unless the page is opened with `?debug`;
the tests read it either way (`app.assertNoErrors()`).

## Tests

One-time setup:

```bash
npm ci
npx playwright install chromium
```

### Browser tests: `npm test`

Runs every Playwright spec in headless Chromium: 161 tests, about a minute
with a JDK, 10 seconds without. The suite rebuilds the page first, so it
never tests a stale build.

```bash
npm test                                  # all specs
npx playwright test tests/touch.spec.ts   # one spec file
npx playwright test -g "hiatus"           # tests whose names match
npm run test:report                       # open the HTML report of the last run
npm run test:ui                           # Playwright's interactive runner
```

| Spec | What it checks |
|---|---|
| `smoke` | The page boots, in its opening state; the error box. |
| `state-machine` | The bulk: every transition, message and point, including boundary cases. |
| `arcs` | The arc paths' geometry, and that each is the 1998 `drawArc` call it replaces. |
| `layout` | The geometry of the drawing, measured in the browser. |
| `render` | Golden SVG snapshots of 16 scenarios, with a PNG of each in `screenshots/`. |
| `real-input` | Real mouse and button events through the page. |
| `touch` | Touch input, its wording, and the phone layout. |
| `export` | The saved SVG and its caption. |
| `java-oracle` | Differential tests against the 1998 Java (below). |

Tests drive the real page over `file://`, in two layers. `app.click(x)` and
`app.move(x)` go through `window.__mr` with exact viewBox integers, so
boundary cases like `x === 2 * onset` are reachable; `app.state()` reads the
state back. `app.realClick(x)`, `app.realMove(x)` and `app.touchGesture(...)`
send real mouse and touch events through the browser.

Tests marked `REGRESSION` in their comments cover a bug fixed since the
port. Tests marked `PINS BUG` keep a quirk of the 1998 original on purpose.

**If a drawing changes on purpose**, the `render` snapshots fail. Look at the
new pictures, then accept them:

```bash
npm run gallery       # rebuild screenshots/ and open the contact sheet
npm run test:update   # accept the changed golden SVGs
```

### Comparison with the 1998 Java

The Java is the oracle for behaviour: `tests/java-oracle.spec.ts` compiles
the original `Rhythm.java` and `CoordinateArea.java` (in
`tests/java/original/`) with a small driver, `tests/java/Oracle.java`. It
then plays the same performances through both the Java and the app and
checks that they agree at every step: one scripted performance and 1,000
random ones, forward-only and "wild" ones with backwards clicks, Back and
Restart. `tests/java-view.ts` restates the app's state in the Java's fields
(`wherein`, `points`, `arcing1`, `in2`, `X1`, …) and message numbers
(`MESSAGE_ORDER[n]` is the key of Java's message n). Where the app
deliberately differs (each entry under "Fixed since the port" below),
`knownDivergence()` and `forgive()` in that spec say exactly how; add to
them when fixing a Java bug, and keep them narrow.

These tests run as part of `npm test` whenever `javac` is on the `PATH`.
Otherwise they are skipped, and Playwright reports them as skipped. To use a
JDK that is not on the `PATH`:

```bash
PATH="/path/to/jdk/bin:$PATH" npm test
```

On macOS a JDK can live anywhere; for example, unpack a Zulu or Temurin
tarball and use its `Contents/Home/bin`. No installer is needed. The Java's
AWT is created but never shown, and `-Dapple.awt.UIElement=true` keeps each
run out of the Dock and from taking the focus.

### iOS tests: `npm run test:ios`

Real touches in Mobile Safari, on an iOS simulator, through XCUITest. The
script builds the page and records, in Chromium, the commentary and
instruction after every gesture of a few scenarios (`ios-tests/expected.mjs`,
through the hook's touch entry points). It then serves `build/` on
`localhost:8765`, generates the Xcode project and runs 9 tests, which replay
the gestures with real touches and check the same text, read from the
accessibility tree. The drawing is located from the tick labels' frames.
One gesture is one straight press-drag-lift, so checks in the middle of a
drag stay in `touch.spec.ts`. They take about a minute once the simulator
has booted.

```bash
npm run test:ios
SIM="iPhone 17 Pro Max" npm run test:ios   # another simulator
```

- **"unable to find utility simctl":** the command-line tools are selected
  instead of Xcode. Run `sudo xcode-select -s /Applications/Xcode.app/Contents/Developer`,
  or prefix the command with
  `DEVELOPER_DIR=/Applications/Xcode.app/Contents/Developer`.
- **Timeouts on the first run:** the first boot of a simulator is slow. Run
  the tests again once it has booted.
- **Screenshots of every step:** `open ios-tests/build/TouchTests.xcresult`.
- The Simulator window comes to the front while the tests run.
- Don't drive touches with safaridriver's W3C actions instead: on the
  iOS 26.3 simulator they lagged, dropped pointerups and reordered taps.
  safaridriver is fine for screenshots and for reading JS state.

### Everything

```bash
npm test && npm run test:ios
```

## Departures from the 1998 Java

### Fixed since the port

The musical ones were decided with John Roeder on 2026-10-24.

- **The second sound ending past its projection, within Lim**
  (`secondSoundEndsPastProjection`) was a dead end, although its commentary
  says the potential "continues to accumulate" and its instruction says to
  begin the third sound. A third sound now follows by the usual rules, which
  replace the X; Back from it restores the message and the X. The
  instruction for `secondSoundEnds` said to step back; it now says to begin
  the third sound too.
- **A second onset too late for a projection** (`secondOnsetTooLate`: "there
  is no projection") still drew the first projection's arc, arrow and
  dashed arc.
- **Boundaries:** a duration of exactly Lim is determinate everywhere, as
  `limFrom` says. The Java left a third onset exactly at 2.5w or w + Lim,
  and a second sound ending exactly at b + Lim, in no branch (the display
  froze), and called a second onset at exactly Lim too late. A third onset
  at exactly 2.5w rejects the projection.
- **The hiatus drawing** drew the second interonset's arc, arrow and dashed
  arc, although the commentary says that duration is mensurally
  indeterminate and has no projective potential.
- **The first silence past Lim** kept the `firstSilence` commentary, which
  says the arc is growing, though it had stopped. It now shows
  `firstSilenceTooLong`, a message the Java did not have, modelled on
  `secondSilenceTooLong`.
- **The hiatus double bar** was drawn just before Lim from the second onset
  even when the second sound reached there, so it sat on the sound. It now
  stays in the silence before the third sound.
- **`secondSilenceTooLong` was unreachable.** The Java needed the pointer past
  Lim from the second sound's end, but the arc stopped growing past Lim from
  its onset, which always comes first, and the message was only set while
  the arc grew. It now shows past Lim from the second onset, as its
  commentary ("the time since the beginning of the second sound") says.
- **Back from a too-late second onset left the demo stuck.** Its message says
  to click "Back one step", but the Java's Back did not leave the dead end:
  the demo showed `firstSilence` and ignored clicks and moves.
- **The second onset's limit** was measured from the end of the first sound
  rather than from its onset. Hasty's Lim is an interonset limit, so the
  window was too generous by the first sound's duration.
- **The X stayed drawn once the second sound passed Lim**, contradicting
  `secondSoundTooLong` and `secondSoundEndsTooLong`. It is now cleared past
  Lim.
- **Ending the second sound past its projection with a click that no move
  preceded** (only the test hook can) drew no X, though the commentary
  points to it. The click now sets the X itself.
- **The growing arc kept its last position** once a duration passed Lim. With
  real input the arc is hidden anyway, but a click past Lim without a move
  there first left the arc on and drew it over the whole sound.
- **Back from the second sound to the silence before it** kept how far the
  abandoned sound had been drawn, and the next second onset drew a line
  from itself to there until the pointer moved.
- **Restart threw** whenever the railroad tracks or the parenthesized
  alternative were on screen (Java's `repaint()` is asynchronous; the port
  draws at once, before the flags had been cleared).
- **A backwards click corrupted the state** and made the next mouse move
  throw: the Java stepped back one state too far, and then re-ran the
  previous step.
- **The acceleration could place the third sound's end before its onset**,
  drawing it backwards under a contradictory commentary.
- **Arrowheads, tempo labels, the X and the hiatus arrow** were positioned
  with the Java's constants for an arc depth of 15 while the port's is 30.
  The vertical layout is now derived from `ARC_H`.
- **Dashed arcs** are drawn 10 degrees later along the ellipse than the
  Java's, so they lie wholly below the arc's ends (pinned in `arcs.spec.ts`).

### Faithful to the Java, and correct

- **`thirdOnsetRejectsProjection` is unreachable for a late second onset.** Its
  window is 2.5w ≤ x ≤ w + Lim, which is empty once w > 133/1.5 ≈ 88.7.
  That is right musically (decided with John Roeder): a second interonset
  duration of 1.5 times the first is then past Lim, so it is indeterminate
  and heard as hiatus.

### Faithful to the Java, and open

Kept as the Java had them; each wants a decision before it changes.

- **A second sound ending exactly at twice its onset** shows
  `thirdOnsetExact`, whose commentary is about the third sound beginning
  exactly as projected and whose instruction says to step back or restart,
  although a third sound may follow.
- **The second sound's growing arc does not come back** after the sound
  passes Lim and returns below twice its onset; it returns only past twice
  its onset, though `secondSoundRealizing` speaks of the growing arc.

### Visual choices (decided with John Roeder, 2026-10-24)

- **`ARC_H` is 30**, twice the Java's 15: the deeper arcs read better.
- **Labels are larger on phones** (under 600px wide): the tick labels, the
  tempo labels and the parenthesized sound, in `template.html`. The tick
  labels are centred on their ticks so they stay in place at either size;
  the iOS tests locate the drawing from their centres.
- **Lim is about 2 seconds.**
