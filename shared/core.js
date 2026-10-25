/* Shared trust boundary: every imported or stored book is untrusted. */
(() => {
  "use strict";
  const MAX_BACKUP = 8 * 1024 * 1024;
  const MAX_HTML = 1500000;
  const DEFAULTS = Object.freeze({
    lang: "fa",
    font: "vazir",
    size: 19,
    lh: 2,
    theme: "light",
    paged: false,
    sidebar: false,
    width: 700,
  });
  const isRecord = (value) =>
    value !== null && typeof value === "object" && !Array.isArray(value);
  const str = (value, limit = 1000) =>
    typeof value === "string" ? value.slice(0, limit) : "";
  const num = (value, min, max, fallback = min) =>
    Number.isFinite(value) ? Math.max(min, Math.min(max, value)) : fallback;
  function safeUrl(value, base) {
    if (typeof value !== "string" || !value.trim() || value.length > 10000)
      return null;
    try {
      const url = new URL(value, base);
      if (!["https:", "http:"].includes(url.protocol)) return null;
      url.username = "";
      url.password = "";
      url.hash = "";
      for (const key of [...url.searchParams.keys()]) {
        if (
          /token|secret|password|passwd|auth|session|credential|api.?key|email|code|signature/i.test(
            key,
          )
        )
          url.searchParams.delete(key);
      }
      return url.href;
    } catch {
      return null;
    }
  }
  function sanitizeHtml(html, base) {
    if (typeof html !== "string" || html.length > MAX_HTML)
      throw new Error("Invalid article size");
    const fragment = globalThis.DOMPurify.sanitize(html, {
      ALLOWED_TAGS: [
        "p",
        "h1",
        "h2",
        "h3",
        "h4",
        "h5",
        "h6",
        "ul",
        "ol",
        "li",
        "blockquote",
        "pre",
        "code",
        "em",
        "strong",
        "b",
        "i",
        "u",
        "s",
        "a",
        "figure",
        "figcaption",
        "table",
        "thead",
        "tbody",
        "tfoot",
        "tr",
        "td",
        "th",
        "br",
        "hr",
        "mark",
        "sup",
        "sub",
        "time",
        "abbr",
        "dl",
        "dt",
        "dd",
      ],
      ALLOWED_ATTR: ["href", "colspan", "rowspan", "title"],
      ALLOW_DATA_ATTR: false,
      ALLOW_ARIA_ATTR: false,
      RETURN_DOM_FRAGMENT: true,
    });
    fragment.querySelectorAll("a").forEach((a) => {
      const url = safeUrl(a.getAttribute("href"), base);
      if (url) {
        a.href = url;
        a.target = "_blank";
        a.rel = "noopener noreferrer";
      } else a.removeAttribute("href");
    });
    fragment.querySelectorAll("td,th").forEach((cell) => {
      for (const key of ["colspan", "rowspan"]) {
        if (cell.hasAttribute(key))
          cell.setAttribute(
            key,
            String(num(Number(cell.getAttribute(key)), 1, 100)),
          );
      }
    });
    const wrapper = document.createElement("div");
    wrapper.append(fragment);
    return wrapper.innerHTML;
  }
  function settings(value) {
    const v = isRecord(value) ? value : {};
    return {
      lang: v.lang === "en" ? "en" : "fa",
      font: ["vazir", "serif", "system"].includes(v.font) ? v.font : "vazir",
      size: num(v.size, 14, 28, 19),
      lh: [1.8, 2, 2.3].includes(v.lh) ? v.lh : 2,
      theme: ["light", "sepia", "dark"].includes(v.theme) ? v.theme : "light",
      paged: v.paged === true,
      sidebar: v.sidebar === true,
      width: num(v.width, 480, 960, 700),
    };
  }
  function tags(value) {
    return [
      ...new Set(
        (Array.isArray(value) ? value : [])
          .filter((x) => typeof x === "string")
          .map((x) => x.trim().slice(0, 50))
          .filter(Boolean),
      ),
    ].slice(0, 30);
  }
  function normalizeBook(value) {
    if (
      !isRecord(value) ||
      !safeUrl(value.url) ||
      typeof value.html !== "string"
    )
      throw new Error("Invalid book");
    const url = safeUrl(value.url);
    const html = sanitizeHtml(value.html, url);
    const doc = new DOMParser().parseFromString(html, "text/html");
    const text = doc.body.textContent;
    if (!text.trim()) throw new Error("No readable text");
    if (value.annotations !== undefined && !Array.isArray(value.annotations))
      throw new Error("Invalid notes");
    if ((value.annotations || []).length > 2000)
      throw new Error("Too many notes");
    const ids = new Set();
    const annotations = (value.annotations || []).map((a, index) => {
      if (
        !isRecord(a) ||
        !["highlight", "note", "question"].includes(a.type) ||
        !str(a.quote, 20000)
      )
        throw new Error("Invalid annotation");
      let id = /^[a-zA-Z0-9_-]{1,80}$/.test(a.id) ? a.id : "import-" + index;
      while (ids.has(id)) id = "import-" + index + "-" + ids.size + "-" + id;
      ids.add(id);
      const quote = str(a.quote, 20000);
      let start = Number.isInteger(a.start) ? a.start : -1;
      if (text.slice(start, start + quote.length) !== quote)
        start = text.indexOf(quote);
      return {
        id,
        type: a.type,
        color: ["yellow", "green", "blue", "pink"].includes(a.color)
          ? a.color
          : "yellow",
        start,
        end: start < 0 ? -1 : start + quote.length,
        quote,
        note: str(a.note, 20000),
        answer: str(a.answer, 20000),
        createdAt: num(a.createdAt, 0, 8640000000000000),
      };
    });
    return {
      v: 2,
      url,
      title: str(value.title, 500) || new URL(url).hostname,
      byline: str(value.byline, 300),
      dir: value.dir === "rtl" ? "rtl" : "ltr",
      html,
      text: text.replace(/\s+/g, " ").trim(),
      words: text.trim().split(/\s+/u).length,
      annotations,
      tags: tags(value.tags),
      progress: num(value.progress, 0, 100),
      scrollTop: num(value.scrollTop, 0, 100000000),
      pageIndex: Math.floor(num(value.pageIndex, 0, 100000)),
      createdAt: num(value.createdAt, 0, 8640000000000000),
      savedAt: num(value.savedAt, 0, 8640000000000000),
      updatedAt: num(value.updatedAt, 0, 8640000000000000),
    };
  }
  const bookKey = (url) => "book:" + safeUrl(url);
  function parseBackup(parsed) {
    if (!isRecord(parsed)) throw new Error("Invalid backup");
    if (
      "app" in parsed &&
      (!["bookit", "ketabkhan"].includes(parsed.app) ||
        ![1, 2].includes(parsed.version))
    )
      throw new Error("Unsupported backup");
    const data = "app" in parsed ? parsed.data : parsed;
    if (!isRecord(data) || Object.keys(data).length > 1002)
      throw new Error("Invalid backup data");
    const clean = Object.create(null);
    for (const [key, value] of Object.entries(data)) {
      if (key.startsWith("book:")) {
        const b = normalizeBook(value);
        clean[bookKey(b.url)] = b;
      } else if (key === "kk:settings") clean[key] = settings(value);
      else if (key === "kk:popupPrefs" && isRecord(value))
        clean[key] = {
          theme: value.theme === "dark" ? "dark" : "light",
          big: value.big === true,
        };
      else throw new Error("Unknown backup entry");
    }
    if (new TextEncoder().encode(JSON.stringify(clean)).length > MAX_BACKUP)
      throw new Error("Backup too large");
    return clean;
  }
  globalThis.BookitCore = Object.freeze({
    MAX_BACKUP,
    DEFAULTS,
    isRecord,
    safeUrl,
    sanitizeHtml,
    settings,
    tags,
    normalizeBook,
    bookKey,
    parseBackup,
  });
})();
