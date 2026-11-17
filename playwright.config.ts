import { defineConfig } from "@playwright/test";

export default defineConfig({
    testDir: "./tests",
    globalSetup: "./tests/global-setup.ts",
    fullyParallel: true,
    reporter: process.env.CI ? "list" : [["list"], ["html", { open: "never" }]],
    use: {
        // The built page loads app.js from beside it, so file:// is enough;
        // no server needed. Viewport is pinned so the real-input tests get a
        // deterministic CSS-pixel -> viewBox mapping.
        viewport: { width: 900, height: 900 },
        deviceScaleFactor: 1,
    },
    projects: [{ name: "chromium", use: { browserName: "chromium" } }],
    expect: { toMatchSnapshot: { maxDiffPixels: 0 } },
});
