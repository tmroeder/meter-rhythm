import XCTest

/// Real touches in Mobile Safari on the iOS Simulator.
///
/// Each drag draws the next stretch of time, sound and silence in turn, and
/// lifting the finger ends it. Each scenario replays gestures (finger down at the
/// first x, drag to the last, lift) and after every one checks the commentary and instruction
/// against expected.json, which expected.mjs records from the same gestures
/// in Chromium through the test hook. A gesture of one x is a tap. "back"
/// and "restart" tap the buttons.
final class TouchTests: XCTestCase {
    struct Step: Decodable {
        let commentary: String
        let instructions: String
        let message: String
        let gesture: Gesture
    }

    enum Gesture: Decodable {
        case start, back, restart, xs([Double])
        init(from decoder: Decoder) throws {
            let c = try decoder.singleValueContainer()
            if let s = try? c.decode(String.self) {
                switch s {
                case "back": self = .back
                case "restart": self = .restart
                default: self = .start
                }
            } else {
                self = .xs(try c.decode([Double].self))
            }
        }
    }

    static let expected: [String: [Step]] = {
        let url = Bundle(for: TouchTests.self).url(forResource: "expected", withExtension: "json")!
        return try! JSONDecoder().decode([String: [Step]].self, from: Data(contentsOf: url))
    }()

    let safari = XCUIApplication(bundleIdentifier: "com.apple.mobilesafari")
    var web: XCUIElement { safari.webViews.firstMatch }

    override func setUpWithError() throws {
        continueAfterFailure = false
        let page = ProcessInfo.processInfo.environment["PAGE_URL"]
            ?? "http://127.0.0.1:8765/meter-rhythm.html"
        XCUIDevice.shared.system.open(URL(string: page)!)
        XCTAssertTrue(safari.wait(for: .runningForeground, timeout: 30))
        XCTAssertTrue(web.staticTexts["Lim"].waitForExistence(timeout: 30), "page did not load")
        // A fresh start whatever an earlier test left behind.
        web.buttons["Restart"].tap()
    }

    // MARK: - Mapping the drawing to the screen

    /// Screen point for viewBox x, calibrated on the tick labels, which the
    /// page centres on their ticks ("Lim" at Lim = 133, "2*Lim" at 266).
    func point(_ x: Double) -> XCUICoordinate {
        let lim = web.staticTexts["Lim"].frame
        let lim2 = web.staticTexts["2*Lim"].frame
        let scale = (lim2.midX - lim.midX) / 133
        let originX = lim.midX - 133 * scale
        // On the line of events (y = 50), below the labels (baseline 25).
        let y = lim.maxY + 25 * scale
        return safari.coordinate(withNormalizedOffset: .zero)
            .withOffset(CGVector(dx: originX + x * scale, dy: y))
    }

    func perform(_ g: Gesture) {
        switch g {
        case .start: break
        case .back: web.buttons["Back one step"].tap()
        case .restart: web.buttons["Restart"].tap()
        case .xs(let xs):
            let a = point(xs.first!)
            if xs.count == 1 {
                a.tap()
            } else {
                a.press(forDuration: 0.1, thenDragTo: point(xs.last!),
                        withVelocity: XCUIGestureVelocity(300), thenHoldForDuration: 0.1)
            }
        }
    }

    // MARK: - Reading the panels

    /// The text of the panel after the one labelled `label`, joined.
    func panelText(after label: String) throws -> String {
        let root = try web.snapshot()
        func texts(_ s: XCUIElementSnapshot) -> [String] {
            (s.elementType == .staticText ? [s.label] : []) + s.children.flatMap(texts)
        }
        func find(_ s: XCUIElementSnapshot) -> String? {
            let kids = s.children
            for (i, k) in kids.enumerated() where texts(k) == [label] && i + 1 < kids.count {
                return texts(kids[i + 1]).joined(separator: " ")
            }
            for k in kids { if let t = find(k) { return t } }
            return nil
        }
        return try XCTUnwrap(find(root), "no panel after \(label)")
    }

    /// Emphasis and line breaks split the text differently in the
    /// accessibility tree, so compare without whitespace.
    func squash(_ s: String) -> String {
        s.filter { !$0.isWhitespace }
    }

    func waitForText(_ step: Step, _ name: String, _ i: Int) throws {
        let deadline = Date().addingTimeInterval(5)
        var commentary = "", instructions = ""
        repeat {
            commentary = try panelText(after: "COMMENTARY")
            instructions = try panelText(after: "INSTRUCTIONS")
            if squash(commentary) == squash(step.commentary)
                && squash(instructions) == squash(step.instructions) { return }
            usleep(200_000)
        } while Date() < deadline
        XCTAssertEqual(squash(commentary), squash(step.commentary),
                       "\(name) step \(i) (\(step.message)): commentary")
        XCTAssertEqual(squash(instructions), squash(step.instructions),
                       "\(name) step \(i) (\(step.message)): instructions")
    }

    func attachScreenshot(_ name: String) {
        let a = XCTAttachment(screenshot: XCUIScreen.main.screenshot())
        a.name = name
        a.lifetime = .keepAlways
        add(a)
    }

    func play(_ name: String) throws {
        let steps = try XCTUnwrap(Self.expected[name])
        for (i, step) in steps.enumerated() {
            perform(step.gesture)
            try waitForText(step, name, i)
            attachScreenshot("\(name)-\(i)-\(step.message)")
        }
    }

    // MARK: - Scenarios

    func testFullPerformance() throws { try play("fullPerformance") }
    /// Also shows a short drag commits once: an emulated click after the
    /// third onset's short drag would switch to the alternative view.
    func testAlternativeView() throws { try play("alternativeView") }
    func testHiatus() throws { try play("hiatus") }
    func testFirstSoundTooLong() throws { try play("firstSoundTooLong") }
    func testFirstSoundReachesFinger() throws { try play("firstSoundReachesFinger") }
    func testRefusedOnset() throws { try play("refusedOnset") }
    func testPastRightEdge() throws { try play("pastRightEdge") }
    func testBackAndRestart() throws { try play("backAndRestart") }

    /// A vertical drag on the drawing must not scroll the page; the same
    /// drag on the commentary does, which shows the check can see a scroll.
    func testDragOnDrawingDoesNotScroll() throws {
        let title = web.staticTexts["Meter as Rhythm"]
        let top = title.frame.minY
        let a = point(200)
        a.press(forDuration: 0.1, thenDragTo: a.withOffset(CGVector(dx: 0, dy: -200)),
                withVelocity: XCUIGestureVelocity(600), thenHoldForDuration: 0.1)
        sleep(1)
        XCTAssertEqual(title.frame.minY, top, accuracy: 0.5, "the page scrolled under a drag on the drawing")

        let p = web.staticTexts["COMMENTARY"].coordinate(withNormalizedOffset: CGVector(dx: 0.5, dy: 0.5))
        p.press(forDuration: 0.1, thenDragTo: p.withOffset(CGVector(dx: 0, dy: -200)),
                withVelocity: XCUIGestureVelocity(600), thenHoldForDuration: 0.1)
        sleep(1)
        XCTAssertNotEqual(title.frame.minY, top, accuracy: 5, "control: the page should scroll here")
    }
}
