import { test, expect } from "@playwright/test";
const base = "http://127.0.0.1:4187";
test.beforeEach(async ({ page }) => {
  await page.goto(base + "/tests/article.html");
  await page.addScriptTag({ url: base + "/vendor/purify.min.js" });
  await page.addScriptTag({ url: base + "/shared/core.js" });
});
test("rejects active HTML, unsafe URLs, remote images and clobbering attributes", async ({
  page,
}) => {
  const result = await page.evaluate(() =>
    BookitCore.sanitizeHtml(
      '<p id="constructor" onclick="alert(1)">safe</p><img src="https://tracker.invalid/pixel"><svg onload="alert(1)"></svg><a href="java\nscript:alert(1)">bad</a><a href="/essay?token=secret&topic=history">good</a><iframe srcdoc="x"></iframe>',
      "https://example.org",
    ),
  );
  expect(result).not.toMatch(
    /onclick|<img|<svg|<iframe|javascript|token|secret|id=/i,
  );
  expect(result).toContain("https://example.org/essay?topic=history");
  expect(result).toContain("noopener noreferrer");
});
test("bounds preferences and removes credentials from source addresses", async ({
  page,
}) => {
  const result = await page.evaluate(() => ({
    url: BookitCore.safeUrl(
      "https://user:password@example.org/a?access_token=private&topic=art#secret",
    ),
    settings: BookitCore.settings({
      size: 999,
      width: -7,
      lang: "bad",
      font: '"><img>',
      theme: '" onload=x',
    }),
  }));
  expect(result.url).toBe("https://example.org/a?topic=art");
  expect(result.settings.size).toBe(28);
  expect(result.settings.width).toBe(480);
  expect(result.settings.theme).toBe("light");
});
test("legacy backup migrates, sanitizes and reconstructs search text", async ({
  page,
}) => {
  const data = await page.evaluate(() =>
    BookitCore.parseBackup({
      app: "ketabkhan",
      version: 1,
      data: {
        "book:old": {
          url: "https://example.org/story",
          html: '<p>یک کتاب خوب</p><img src=x onerror="alert(1)">',
          text: "forged",
          title: "کتاب",
          annotations: [],
          tags: ["علم", "علم"],
        },
      },
    }),
  );
  expect(data["book:https://example.org/story"].text).toBe("یک کتاب خوب");
  expect(data["book:https://example.org/story"].tags).toEqual(["علم"]);
});
test("rejects malformed, future and prototype-shaped backups before writing", async ({
  page,
}) => {
  const result = await page.evaluate(() =>
    [
      { app: "bookit", version: 999, data: {} },
      JSON.parse('{"__proto__":{"polluted":true}}'),
      { "book:x": { url: "javascript:alert(1)", html: "<p>hello</p>" } },
      {
        "book:x": {
          url: "https://example.org",
          html: "<p>x</p>",
          annotations: {},
        },
      },
    ].map((value) => {
      try {
        BookitCore.parseBackup(value);
        return false;
      } catch {
        return true;
      }
    }),
  );
  expect(result).toEqual([true, true, true, true]);
});
