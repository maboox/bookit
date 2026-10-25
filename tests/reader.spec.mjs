import { test, expect } from "@playwright/test";
const base = "http://127.0.0.1:4187";
test.beforeEach(async ({ page }) => {
  await page.goto(base + "/tests/article.html");
  for (const file of [
    "vendor/purify.min.js",
    "vendor/Readability.js",
    "shared/core.js",
    "shared/icons.js",
  ])
    await page.addScriptTag({ url: base + "/" + file });
  await page.evaluate(async (base) => {
    window.__kkCssText = await (
      await fetch(base + "/content/reader.css")
    ).text();
  }, base);
  await page.addScriptTag({ url: base + "/content/reader.js" });
  await page.evaluate(() => window.__kk.open());
});
test("extracts article and opens the correct annotation dialog", async ({
  page,
}) => {
  await expect(page.locator(".kk-h-title")).toHaveText(
    "A little room for reading",
  );
  await expect(page.locator(".kk-article")).not.toContainText("Subscribe now");
  await page.evaluate(() =>
    window.__kk.annotateByQuote(
      "A library is a conversation",
      "question",
      "blue",
      "Why remember?",
      "To revisit ideas.",
    ),
  );
  await page.locator(".kk-ann").first().click();
  await expect(page.locator(".kk-dlg-backdrop")).toHaveAttribute(
    "data-open",
    "1",
  );
  await expect(page.locator(".kk-dlg-backdrop .kk-dlg-title")).toContainText(
    "پرسش",
  );
  await page.locator("[data-f=note]").fill("A revised question");
  await page.locator("[data-dlg=save]").click();
  expect(
    await page.evaluate(() => window.__kk.getBook().annotations[0].note),
  ).toBe("A revised question");
});
test("cancelled annotation edits do not change color", async ({ page }) => {
  await page.evaluate(() =>
    window.__kk.annotateByQuote(
      "Reading is a small act",
      "note",
      "yellow",
      "original",
    ),
  );
  await page.locator(".kk-ann").first().click();
  await page.locator(".kk-dlg-backdrop [data-color=pink]").click();
  await page.locator("[data-dlg=cancel]").click();
  expect(
    await page.evaluate(() => window.__kk.getBook().annotations[0].color),
  ).toBe("yellow");
});
test("page mode supports navigation and does not steal keys from note inputs", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1000, height: 500 });
  await page.locator("[data-act=paged]").click();
  await expect(page.locator(".kk-root")).toHaveAttribute("data-paged", "1");
  await expect(page.locator(".kk-pagelabel")).not.toBeEmpty();
  await page.evaluate(() =>
    window.__kk.annotateByQuote(
      "Reading is a small act",
      "note",
      "yellow",
      "original",
    ),
  );
  await page.locator(".kk-ann").first().click();
  await page.locator("[data-f=note]").fill("hello world");
  await page.locator("[data-f=note]").press("ArrowLeft");
  await expect(page.locator("[data-f=note]")).toHaveValue("hello world");
});
test("reader respects direction, themes and closes without changing the article", async ({
  page,
}) => {
  await expect(page.locator(".kk-flow")).toHaveAttribute("dir", "ltr");
  await page.locator("[data-theme-btn=dark]").click();
  await expect(page.locator(".kk-root")).toHaveAttribute("data-theme", "dark");
  await page.locator("[data-act=close]").click();
  await expect(page.locator("#kk-host")).toHaveCount(0);
  await expect(page.locator("article")).toBeVisible();
});
