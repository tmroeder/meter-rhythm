import { test, expect, LIM } from "./harness";

test("page boots into the introductory state", async ({ app }) => {
    const s = await app.state();
    expect(s.times).toEqual([]);
    expect(s.phase).toBe("ready");
    expect(s.message).toBe("intro");
    expect(s.commentary).toContain("Meter as Rhythm");
    await app.assertNoErrors();
});

test("Lim is a third of the timeline", async ({ app }) => {
    expect((await app.constants()).LIM).toBe(LIM);   // 400/3 integer-divided
});

test.describe("the error box", () => {
    test("collects errors but stays hidden from readers", async ({ app }) => {
        await app.page.evaluate(() => (window as any).__mr.showError("test", new Error("boom")));
        const box = app.page.locator("#errorDisplay");
        await expect(box).toContainText("boom");
        await expect(box).toBeHidden();
    });

    test("is shown with ?debug", async ({ app }) => {
        await app.page.goto(app.page.url() + "?debug");
        await app.page.evaluate(() => (window as any).__mr.showError("test", new Error("boom")));
        await expect(app.page.locator("#errorDisplay")).toBeVisible();
    });
});
