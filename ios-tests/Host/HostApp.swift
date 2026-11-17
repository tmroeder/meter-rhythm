// An empty app: XCUITest needs a host, but the tests drive Safari.
import SwiftUI

@main
struct HostApp: App {
    var body: some Scene { WindowGroup { Text("Meter as Rhythm UI tests") } }
}
