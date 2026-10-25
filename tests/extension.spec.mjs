import { test, expect, chromium } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { mkdir, mkdtemp } from "node:fs/promises";
import { resolve } from "node:path";
const base = "http://127.0.0.1:4187";
let context, worker, id;
async function screenshot(page, options) {
  if (process.env.UPDATE_SCREENSHOTS) await page.screenshot(options);
}
const paragraph =
  "A library is a conversation with your future self. Notes and highlights help you remember why an idea mattered. Reading at your own pace leaves room for curiosity, a new question, and another perspective.";
const fa =
  "مطالعه فرصتی برای مکث و فکر کردن است. وقتی مقاله‌ای را برای بعد نگه می‌داریم، در واقع پرسشی را زنده نگه داشته‌ایم. یادداشت‌های کوچک کمک می‌کنند مسیر فکر خود را دوباره پیدا کنیم.";
function book(url, title, text, dir, tags, progress = 0) {
  return {
    v: 2,
    url,
    title,
    byline: "Bookit demo",
    dir,
    html:
      "<h2>" +
      (dir === "rtl" ? "فرصتی برای فکر کردن" : "Room for an idea") +
      "</h2>" +
      Array.from({ length: 24 }, () => "<p>" + text + "</p>").join(""),
    annotations: [],
    tags,
    progress,
    savedAt: 1792886400000,
    createdAt: 1792886400000,
  };
}
const books = {
  "book:https://example.org/reading": book(
    "https://example.org/reading",
    "A little room for reading",
    paragraph,
    "ltr",
    ["Essays", "Reading"],
    42,
  ),
  "book:https://example.org/curiosity": book(
    "https://example.org/curiosity",
    "The art of staying curious",
    paragraph,
    "ltr",
    ["Ideas"],
    18,
  ),
  "book:https://example.org/notes": book(
    "https://example.org/notes",
    "جایی برای خواندن و فکر کردن",
    fa,
    "rtl",
    ["مطالعه", "یادداشت"],
    67,
  ),
  "kk:settings": { lang: "fa", theme: "light", font: "vazir" },
  "kk:popupPrefs": { theme: "light" },
};
test.beforeAll(async () => {
  test.setTimeout(60000);
  await mkdir("artifacts", { recursive: true });
  const profile = await mkdtemp(resolve("artifacts", "test-profile-"));
  const extensionPath = resolve(process.env.BOOKIT_EXTENSION_DIR || ".");
  context = await chromium.launchPersistentContext(profile, {
    channel: process.env.EXTENSION_CHANNEL || "chromium",
    headless: true,
    viewport: { width: 1360, height: 1050 },
    args: [
      "--disable-extensions-except=" + extensionPath,
      "--load-extension=" + extensionPath,
    ],
  });
  worker =
    context.serviceWorkers()[0] ||
    (await context.waitForEvent("serviceworker"));
  id = new URL(worker.url()).host;
});
test.afterAll(async () => {
  test.setTimeout(60000);
  await context?.close();
});
test.beforeEach(async () => {
  await worker.evaluate(async (data) => {
    await chrome.storage.local.clear();
    await chrome.storage.local.set(data);
  }, books);
});
test("library shortcut is registered in the installed browser", async () => {
  const commands = await worker.evaluate(() => chrome.commands.getAll());
  expect(
    commands.find((command) => command.name === "open-library")?.shortcut,
  ).toBeTruthy();
});
test("installed extension has no automatic page access; saved library works offline", async () => {
  const article = await context.newPage();
  await article.goto(base + "/tests/article.html");
  expect(await article.locator("#kk-host").count()).toBe(0);
  const page = await context.newPage();
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto("chrome-extension://" + id + "/popup/popup.html?tab=1");
  await expect(page.locator(".book")).toHaveCount(3);
  await expect(page.locator("#toggle")).toBeDisabled();
  await screenshot(page, {
    path: "docs/assets/library-fa.png",
    fullPage: true,
  });
  await page.locator("#langBtn").click();
  await expect(page.locator("html")).toHaveAttribute("dir", "ltr");
  await screenshot(page, {
    path: "docs/assets/library-en.png",
    fullPage: true,
  });
  await page.locator("#themeBtn").click();
  await screenshot(page, {
    path: "docs/assets/library-dark.png",
    fullPage: true,
  });
  await page.locator("#themeBtn").click();
  await page.locator("#search").fill("library, future");
  await expect(page.locator(".book")).toHaveCount(2);
  await page.locator("#search").fill("");
  const popupPromise = context.waitForEvent("page");
  await page.locator(".btitle").filter({ hasText: "A little room" }).click();
  const reader = await popupPromise;
  await expect(reader.locator(".kk-h-title")).toHaveText(
    "A little room for reading",
  );
  await reader.locator("[data-act=sidebar]").click();
  await screenshot(reader, {
    path: "docs/assets/reader-en.png",
    fullPage: true,
  });
  const network = [];
  reader.on("request", (r) => {
    if (/^https?:/.test(r.url())) network.push(r.url());
  });
  await reader.reload();
  await expect(reader.locator(".kk-article")).toContainText("future self");
  expect(network).toEqual([]);
  expect(errors).toEqual([]);
  await article.close();
  await reader.close();
  await page.close();
});
test("backup rejection is atomic; valid legacy restore is sanitized and persists", async () => {
  const page = await context.newPage();
  await page.goto("chrome-extension://" + id + "/popup/popup.html?tab=1");
  await expect(page.locator(".book")).toHaveCount(3);
  await page.locator("#importFile").setInputFiles({
    name: "bad.json",
    mimeType: "application/json",
    buffer: Buffer.from('{"book:broken":{"html":"<p>incomplete</p>"}}'),
  });
  await expect(page.locator("#message")).toHaveAttribute("data-kind", "err");
  await expect(page.locator(".book")).toHaveCount(3);
  page.on("dialog", (dialog) => dialog.accept());
  const backup = {
    app: "bookit",
    version: 1,
    data: {
      "book:new": book(
        "https://example.org/new?token=private",
        "Restored safely",
        '<strong>Safe text</strong><img src="https://tracker.invalid/x" onerror="alert(1)">',
        "ltr",
        ["Test"],
      ),
    },
  };
  await page.locator("#importFile").setInputFiles({
    name: "legacy.json",
    mimeType: "application/json",
    buffer: Buffer.from(JSON.stringify(backup)),
  });
  await expect(page.locator(".book")).toHaveCount(4);
  await expect(page.locator("#message")).toHaveAttribute("data-kind", "ok");
  const restored = await worker.evaluate(
    async () =>
      (await chrome.storage.local.get("book:https://example.org/new"))[
        "book:https://example.org/new"
      ],
  );
  expect(restored.url).toBe("https://example.org/new");
  expect(restored.html).not.toContain("<img");
  const downloadPromise = page.waitForEvent("download");
  await page.locator("#export").click();
  const download = await downloadPromise;
  expect(download.suggestedFilename()).toMatch(/^bookit-backup-.*\.json$/);
  await page.close();
});
test("offline notes, pagination and progress survive reload", async () => {
  const page = await context.newPage();
  await page.goto(
    "chrome-extension://" +
      id +
      "/reader/reader.html?key=" +
      encodeURIComponent("book:https://example.org/reading"),
  );
  await expect(page.locator(".kk-article")).toBeVisible();
  await page
    .locator(".kk-article p")
    .first()
    .evaluate((p) => {
      const range = document.createRange();
      range.setStart(p.firstChild, 0);
      range.setEnd(p.firstChild, 9);
      const selection = p.getRootNode().getSelection();
      selection.removeAllRanges();
      selection.addRange(range);
    });
  await page.locator(".kk-article").dispatchEvent("mouseup");
  await expect(page.locator(".kk-pop")).toHaveAttribute("data-open", "1");
  await page.locator("[data-pop=note]").click();
  await page.locator("[data-f=note]").fill("A useful thought");
  await page.locator("[data-dlg=save]").click();
  await expect
    .poll(async () =>
      worker.evaluate(
        async () =>
          (await chrome.storage.local.get("book:https://example.org/reading"))[
            "book:https://example.org/reading"
          ].annotations.length,
      ),
    )
    .toBe(1);
  await page.locator("[data-act=paged]").click();
  await page.locator("[data-act=next]").click();
  const label = await page.locator(".kk-pagelabel").textContent();
  await expect
    .poll(async () =>
      worker.evaluate(
        async () =>
          (await chrome.storage.local.get("book:https://example.org/reading"))[
            "book:https://example.org/reading"
          ].pageIndex,
      ),
    )
    .toBe(1);
  await page.reload();
  await expect(page.locator(".kk-pagelabel")).toHaveText(label);
  await expect(page.locator(".kk-ann")).toContainText("A library");
  await page.locator("[data-act=sidebar]").click();
  await expect(page.locator(".kk-sb-note")).toContainText("A useful thought");
  await page.close();
});
test("dashboard has no serious accessibility violations in both languages", async () => {
  test.setTimeout(60000);
  const page = await context.newPage();
  await page.goto("chrome-extension://" + id + "/popup/popup.html?tab=1");
  await expect(page.locator(".book")).toHaveCount(3);
  for (let n = 0; n < 2; n++) {
    const result = await new AxeBuilder({ page }).analyze();
    expect(
      result.violations.filter((v) =>
        ["serious", "critical"].includes(v.impact),
      ),
    ).toEqual([]);
    await page.locator("#langBtn").click();
  }
  await page.close();
});

test("storage failure keeps the reader open and reports an unsaved change", async () => {
  const page = await context.newPage();
  await page.goto(
    "chrome-extension://" +
      id +
      "/reader/reader.html?key=" +
      encodeURIComponent("book:https://example.org/reading"),
  );
  await expect(page.locator(".kk-article")).toBeVisible();
  await page.evaluate(() => {
    chrome.storage.local.set = async () => {
      throw new Error("QUOTA_BYTES quota exceeded");
    };
  });
  await page.locator("[data-act=close]").click();
  await expect(page.locator(".kk-saved")).toHaveAttribute("role", "alert");
  await expect(page.locator(".kk-root")).toBeVisible();
  expect(page.url()).toContain("reader/reader.html");
  await page.close();
});
