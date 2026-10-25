/* Bookit — content script
   هر صفحهٔ وب را به نمای کتابی زیبا تبدیل می‌کند؛ با هایلایت، یادداشت،
   پرسش، ذخیرهٔ محلی و پشتیبان‌گیری. همهٔ داده‌ها فقط روی دستگاه کاربر می‌ماند. */
(() => {
  "use strict";
  if (window.__kkLoaded) return;
  window.__kkLoaded = true;

  const VERSION = 2;
  const Core = globalThis.BookitCore;
  const offline = location.protocol === "chrome-extension:";
  const offlineKey = offline
    ? new URLSearchParams(location.search).get("key")
    : null;
  const hasChrome =
    typeof chrome !== "undefined" && !!(chrome.storage && chrome.storage.local);
  const memStore = {};
  const storage = {
    get(keys) {
      if (hasChrome) return chrome.storage.local.get(keys);
      const out = {};
      (Array.isArray(keys) ? keys : [keys]).forEach((k) => {
        if (k in memStore) out[k] = memStore[k];
      });
      return Promise.resolve(out);
    },
    set(obj) {
      if (hasChrome) return chrome.storage.local.set(obj);
      Object.assign(memStore, obj);
      return Promise.resolve();
    },
    remove(key) {
      if (hasChrome) return chrome.storage.local.remove(key);
      delete memStore[key];
      return Promise.resolve();
    },
  };

  const PAGE_KEY = offlineKey || Core.bookKey(location.href);
  const SETTINGS_KEY = "kk:settings";

  const FONTS = {
    vazir: {
      label: "وزیرمتن",
      labelEn: "Vazirmatn",
      stack: '"Vazirmatn",system-ui,Tahoma,sans-serif',
    },
    serif: {
      label: "سریف",
      labelEn: "Serif",
      stack: 'Georgia,"Noto Naskh Arabic",serif',
    },
    system: {
      label: "سیستم",
      labelEn: "System",
      stack: "system-ui,Tahoma,sans-serif",
    },
  };
  function registerBundledFonts() {
    if (document.getElementById("kk-fonts")) return;
    const base = hasChrome
      ? chrome.runtime.getURL("fonts/")
      : new URL("../fonts/", location.href).href;
    const st = document.createElement("style");
    st.id = "kk-fonts";
    st.textContent =
      '@font-face{font-family:Vazirmatn;src:url("' +
      base +
      'vazirmatn-arabic.woff2");font-weight:100 900;font-display:swap;unicode-range:U+0600-06FF,U+200C-200E,U+FB50-FDFF,U+FE70-FEFF} @font-face{font-family:Vazirmatn;src:url("' +
      base +
      'vazirmatn-latin.woff2");font-weight:100 900;font-display:swap;unicode-range:U+0000-00FF}';
    document.head.append(st);
  }
  const HL_COLORS = {
    yellow: "#F5E6A8",
    green: "#CDE8D5",
    blue: "#CFE5F7",
    pink: "#F6D6DC",
  };
  const LINE_HEIGHTS = [1.8, 2, 2.3];
  const DEFAULT_SETTINGS = Core.DEFAULTS;

  let settings = Object.assign({}, DEFAULT_SETTINGS);
  let book = null;
  let bookSaved = false;
  let opening = null;
  let host = null;
  let ui = null;
  let cssText = null;
  let chipEl = null;
  let pendingRange = null;
  let saveTimer = null;
  let pageIndex = 0;
  let pageCount = 1;
  let pageStep = 0;
  let prevOverflow = null;

  const faNum = (n) =>
    Number(n).toLocaleString(settings.lang === "en" ? "en-US" : "fa-IR");
  const I18N = {
    close: ["بستن (Esc)", "Close (Esc)"],
    smaller: ["کوچک‌تر", "Smaller"],
    larger: ["بزرگ‌تر", "Larger"],
    lh: ["فاصلهٔ خطوط", "Line spacing"],
    font: ["فونت", "Font"],
    langTitle: ["English | تغییر زبان", "فارسی | Switch language"],
    light: ["روشن", "Light"],
    sepia: ["کاغذی", "Sepia"],
    dark: ["تاریک", "Dark"],
    paged: ["حالت ورق‌زدن", "Page-flip mode"],
    refresh: ["بازخوانی متن از صفحه", "Re-extract page text"],
    notes: ["یادداشت‌ها و هایلایت‌ها", "Notes & highlights"],
    nextP: ["صفحهٔ بعد", "Next page"],
    prevP: ["صفحهٔ قبل", "Previous page"],
    savedChip: ["✓ ذخیره شد", "✓ Saved"],
    noteBtn: ["یادداشت", "Note"],
    questionBtn: ["طرح پرسش", "Ask a question"],
    dictBtn: ["معنی", "Define"],
    closeW: ["بستن", "Close"],
    vajehyab: ["جست‌وجو در واژه‌یاب ↗", "Search Vajehyab ↗"],
    abadis: ["جست‌وجو در آبادیس ↗", "Search Abadis ↗"],
    save: ["ذخیره", "Save"],
    cancel: ["انصراف", "Cancel"],
    del: ["حذف", "Delete"],
    highlight: ["هایلایت", "Highlight"],
    noTitle: ["بدون عنوان", "Untitled"],
    wordsAbout: ["حدود", "About"],
    wordsWord: ["واژه", "words"],
    readPct: ["٪ خوانده شد", "% read"],
    pageOf: ["از", "of"],
    noteWord: ["یادداشت", "Note"],
    questionWord: ["پرسش", "Question"],
    edit: ["ویرایش", "Edit"],
    qPh: ["پرسش خود را بنویسید…", "Write your question…"],
    aLabel: ["پاسخ (اختیاری)", "Answer (optional)"],
    aPh: ["پاسخ یا یافتهٔ بعدی شما…", "Your answer or a later finding…"],
    nPh: ["یادداشت یا کامنت شما…", "Your note or comment…"],
    dictMiss: [
      "معنی به‌صورت مستقیم دریافت نشد. با دکمه‌های زیر، همین واژه در واژه‌یاب یا آبادیس جست‌وجو می‌شود.",
      "Couldn't fetch the meaning directly. Use the buttons below to look this word up on Vajehyab or Abadis.",
    ],
    dictLoading: ["در حال دریافت معنی…", "Fetching meaning…"],
    qPrefix: ["پرسش: ", "Q: "],
    aPrefix: ["پاسخ: ", "A: "],
    orphan: ["در متن فعلی پیدا نشد", "Not found in the current text"],
    sbEmpty: [
      "هنوز چیزی ثبت نشده است. بخشی از متن را انتخاب کنید تا هایلایت، یادداشت یا پرسش بسازید.",
      "Nothing here yet. Select some text to highlight, add a note, or ask a question.",
    ],
    resume: ["📖 ادامهٔ مطالعهٔ کتابی", "📖 Resume book view"],
    hide: ["پنهان کردن", "Hide"],
    saveT: [
      "ذخیره در کتابخانه برای جست‌وجو و مطالعهٔ بعدی",
      "Save to library for search and later reading",
    ],
    saveBook: ["ذخیره در کتابخانه", "Save to library"],
    inLibrary: ["در کتابخانه ✓", "In library ✓"],
    saveDlgTitle: ["ذخیره در کتابخانه", "Save to library"],
    saveDlgHint: [
      "این صفحه برای جست‌وجو و مطالعهٔ بعدی روی دستگاه شما ذخیره می‌شود. تگ یا پوشه اختیاری است.",
      "This page will be stored on your device for search and later reading. Tags/folder are optional.",
    ],
    saveDlgPh: [
      "تگ یا پوشه (اختیاری) — با ویرگول: تاریخ، علم",
      "Tags or folder (optional) — commas: history, science",
    ],
    removeBook: ["حذف از کتابخانه", "Remove from library"],
  };
  const t = (k) => {
    const v = I18N[k];
    return v ? (settings.lang === "en" ? v[1] : v[0]) : k;
  };

  /* ============ استخراج متن اصلی ============ */

  const STRIP_SELECTOR = [
    "script",
    "style",
    "noscript",
    "template",
    "iframe",
    "object",
    "embed",
    "form",
    "button",
    "input",
    "select",
    "textarea",
    "nav",
    "header",
    "footer",
    "aside",
    "svg",
    "canvas",
    "video",
    "audio",
    "dialog",
    '[role="navigation"]',
    '[role="banner"]',
    '[role="complementary"]',
    '[role="contentinfo"]',
    '[role="dialog"]',
    '[role="search"]',
    '[aria-hidden="true"]',
    "[hidden]",
  ].join(",");
  const BAD_PATTERN =
    /(^|[-_ ])(comment|share|social|footer|header|menu|nav|navbar|sidebar|widget|banner|breadcrumb|promo|advert|ads?|sponsor|related|recommend|newsletter|subscribe|cookie|popup|modal|pagination|pager|toolbar|author-box|masthead)([-_ ]|$)/i;

  const KEEP_TAGS = new Set([
    "P",
    "H1",
    "H2",
    "H3",
    "H4",
    "H5",
    "H6",
    "UL",
    "OL",
    "LI",
    "BLOCKQUOTE",
    "PRE",
    "CODE",
    "EM",
    "STRONG",
    "B",
    "I",
    "U",
    "S",
    "A",
    "IMG",
    "FIGURE",
    "FIGCAPTION",
    "TABLE",
    "THEAD",
    "TBODY",
    "TFOOT",
    "TR",
    "TD",
    "TH",
    "BR",
    "HR",
    "MARK",
    "SUP",
    "SUB",
    "TIME",
    "ABBR",
    "DL",
    "DT",
    "DD",
  ]);
  const DROP_TAGS = new Set([
    "SCRIPT",
    "STYLE",
    "NOSCRIPT",
    "TEMPLATE",
    "IFRAME",
    "OBJECT",
    "EMBED",
    "FORM",
    "BUTTON",
    "INPUT",
    "SELECT",
    "TEXTAREA",
    "NAV",
    "HEADER",
    "FOOTER",
    "ASIDE",
    "SVG",
    "CANVAS",
    "VIDEO",
    "AUDIO",
    "DIALOG",
    "LINK",
    "META",
  ]);
  const INLINE_TAGS = new Set([
    "A",
    "EM",
    "STRONG",
    "B",
    "I",
    "U",
    "S",
    "CODE",
    "MARK",
    "SUP",
    "SUB",
    "TIME",
    "ABBR",
    "BR",
    "IMG",
    "SPAN",
  ]);

  function textLen(el) {
    return ((el && el.textContent) || "").trim().length;
  }
  function linkDensity(el) {
    const total = textLen(el) || 1;
    let links = 0;
    el.querySelectorAll("a").forEach((a) => {
      links += textLen(a);
    });
    return links / total;
  }
  function detectDir(text) {
    const fa = (text.match(/[\u0590-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF]/g) || [])
      .length;
    const la = (text.match(/[A-Za-z]/g) || []).length;
    return fa >= la ? "rtl" : "ltr";
  }
  function similarText(a, b) {
    a = (a || "").trim().toLowerCase();
    b = (b || "").trim().toLowerCase();
    return !!a && !!b && (a.includes(b) || b.includes(a));
  }

  function pickCandidate(root) {
    const scores = new Map();
    const addScore = (el, s) => {
      if (!el || el === root) return;
      scores.set(el, (scores.get(el) || 0) + s);
    };
    root.querySelectorAll("p,pre,blockquote,td,li,h2,h3").forEach((p) => {
      const t = (p.textContent || "").trim();
      if (t.length < 25) return;
      const commas = (t.match(/[،,]/g) || []).length;
      const s = 1 + Math.min(Math.floor(t.length / 100), 3) + commas * 0.5;
      addScore(p.parentElement, s);
      if (p.parentElement) addScore(p.parentElement.parentElement, s / 2);
    });
    let best = null;
    let bestScore = 0;
    for (const [el, s0] of scores) {
      const s = s0 * (1 - Math.min(linkDensity(el), 0.9));
      if (s > bestScore) {
        best = el;
        bestScore = s;
      }
    }
    return best;
  }

  function sanitizeChildren(src, out, doc) {
    for (const child of Array.from(src.childNodes)) {
      if (child.nodeType === Node.TEXT_NODE) {
        out.appendChild(doc.createTextNode(child.nodeValue));
        continue;
      }
      if (child.nodeType !== Node.ELEMENT_NODE) continue;
      const tag = child.tagName;
      if (DROP_TAGS.has(tag)) continue;
      if (KEEP_TAGS.has(tag)) {
        const name =
          tag === "B" ? "strong" : tag === "I" ? "em" : tag.toLowerCase();
        const el = doc.createElement(name);
        if (tag === "A") {
          const href = child.getAttribute("href");
          if (href && !/^\s*javascript:/i.test(href)) {
            try {
              el.setAttribute("href", new URL(href, document.baseURI).href);
            } catch (e) {
              /* ignore */
            }
          }
          el.setAttribute("rel", "noopener");
          el.setAttribute("target", "_blank");
        }
        if (tag === "IMG") {
          const srcAttr =
            child.currentSrc ||
            child.getAttribute("src") ||
            child.getAttribute("data-src") ||
            child.getAttribute("data-original") ||
            "";
          if (!srcAttr) continue;
          try {
            el.setAttribute("src", new URL(srcAttr, document.baseURI).href);
          } catch (e) {
            continue;
          }
          const alt = child.getAttribute("alt");
          if (alt) el.setAttribute("alt", alt);
          el.setAttribute("loading", "lazy");
        }
        if (tag === "TD" || tag === "TH") {
          ["colspan", "rowspan"].forEach((a) => {
            const v = child.getAttribute(a);
            if (v) el.setAttribute(a, v);
          });
        }
        sanitizeChildren(child, el, doc);
        if (
          tag === "IMG" ||
          tag === "BR" ||
          tag === "HR" ||
          el.textContent.trim() ||
          el.querySelector("img")
        ) {
          out.appendChild(el);
        }
      } else {
        sanitizeChildren(child, out, doc);
      }
    }
  }

  function normalizeBlocks(out, doc) {
    const blocks = [];
    let para = null;
    for (const node of Array.from(out.childNodes)) {
      const isInline =
        node.nodeType === Node.TEXT_NODE || INLINE_TAGS.has(node.tagName);
      if (isInline) {
        if (node.nodeType === Node.TEXT_NODE && !node.nodeValue.trim() && !para)
          continue;
        if (!para) {
          para = doc.createElement("p");
          blocks.push(para);
        }
        para.appendChild(node);
      } else {
        para = null;
        blocks.push(node);
      }
    }
    out.textContent = "";
    blocks.forEach((b) => out.appendChild(b));
    Array.from(
      out.querySelectorAll("p, li, blockquote, h1, h2, h3, h4, h5, h6"),
    ).forEach((p) => {
      if (!p.textContent.trim() && !p.querySelector("img")) p.remove();
    });
  }

  function extractArticle() {
    if (typeof Readability !== "undefined") {
      try {
        const parsed = new Readability(document.cloneNode(true), {
          charThreshold: 120,
          maxElemsToParse: 50000,
        }).parse();
        if (parsed && parsed.textContent.trim().length >= 80)
          return {
            title: parsed.title || document.title,
            byline: parsed.byline || "",
            dir: detectDir(parsed.textContent),
            html: Core.sanitizeHtml(parsed.content, location.href),
            words: parsed.textContent.trim().split(/\s+/).length,
          };
      } catch {
        /* Fall back for short or unusual pages. */
      }
    }
    const clone = document.body.cloneNode(true);
    clone.querySelectorAll(STRIP_SELECTOR).forEach((e) => e.remove());
    clone.querySelectorAll("*").forEach((e) => {
      if (!clone.contains(e)) return;
      const idc =
        (typeof e.className === "string" ? e.className : "") +
        " " +
        (e.id || "");
      if (BAD_PATTERN.test(idc)) {
        if (textLen(e) < 400 || linkDensity(e) > 0.5) e.remove();
      }
    });
    let candidate = pickCandidate(clone);
    if (!candidate || textLen(candidate) < 250) {
      candidate =
        clone.querySelector("article") ||
        clone.querySelector("main") ||
        candidate ||
        clone;
    }
    const doc = document.implementation.createHTMLDocument("kk");
    const out = doc.createElement("div");
    sanitizeChildren(candidate, out, doc);
    normalizeBlocks(out, doc);
    const metaTitle = document.querySelector('meta[property="og:title"]');
    const title = (
      (metaTitle && metaTitle.getAttribute("content")) ||
      document.title ||
      t("noTitle")
    ).trim();
    const firstH = out.querySelector("h1,h2");
    if (firstH && similarText(firstH.textContent, title)) firstH.remove();
    const metaAuthor = document.querySelector('meta[name="author"]');
    const byline = (
      (metaAuthor && metaAuthor.getAttribute("content")) ||
      ""
    ).trim();
    const text = out.textContent.replace(/\s+/g, " ").trim();
    return {
      title,
      byline,
      dir: detectDir(text || title),
      html: Core.sanitizeHtml(out.innerHTML, location.href),
      words: text ? text.split(" ").length : 0,
    };
  }

  /* ============ ساخت رابط کاربری ============ */

  const ICONS = Object.fromEntries(
    Object.entries({
      bookmark: "bookmark",
      close: "x",
      book: "book-open",
      list: "list",
      refresh: "rotate-cw",
      columns: "columns-2",
    }).map(([key, name]) => [key, globalThis.BookitIcons[name]]),
  );

  async function loadCss() {
    if (cssText) return cssText;
    if (window.__kkCssText) {
      cssText = window.__kkCssText;
      return cssText;
    }
    let url = window.__kkCssUrl || "reader.css";
    if (hasChrome && chrome.runtime && chrome.runtime.getURL)
      url = chrome.runtime.getURL("content/reader.css");
    try {
      const res = await fetch(url);
      cssText = await res.text();
    } catch (e) {
      cssText = "";
    }
    return cssText;
  }

  function el(html) {
    const t = document.createElement("template");
    t.innerHTML = html.trim();
    return t.content.firstChild;
  }

  async function buildUI() {
    await loadCss();
    host = document.createElement("div");
    host.id = "kk-host";
    host.style.cssText =
      "all:initial; position:fixed; inset:0; z-index:2147483647;";
    const shadow = host.attachShadow({
      mode: hasChrome && !offline ? "closed" : "open",
    });
    const style = document.createElement("style");
    style.textContent = cssText;
    shadow.appendChild(style);

    const fontOptions = Object.entries(FONTS)
      .map(
        ([k, f]) =>
          `<option value="${k}">${settings.lang === "en" ? f.labelEn || f.label : f.label}</option>`,
      )
      .join("");
    const swatches = Object.entries(HL_COLORS)
      .map(
        ([k, c]) =>
          `<button class="kk-dot" data-color="${k}" style="background:${c}" title="${t("highlight")}"></button>`,
      )
      .join("");

    const root = el(`
<div class="kk-root" tabindex="-1" role="dialog" aria-modal="true" aria-label="Bookit reader" dir="${settings.lang === "en" ? "ltr" : "rtl"}" data-theme="${settings.theme}" data-paged="${settings.paged ? 1 : 0}" data-sidebar="${settings.sidebar ? 1 : 0}">
  <div class="kk-toolbar">
    <button class="kk-btn" data-act="close" title="${t("close")}">${ICONS.close}</button>
    <span class="kk-sep"></span>
    <button class="kk-btn kk-savebook" data-act="savebook" title="${t("saveT")}">${ICONS.bookmark}<span class="kk-save-txt"></span></button>
    <span class="kk-sep"></span>
    <button class="kk-btn" data-act="size-" title="${t("smaller")}">−</button>
    <span class="kk-size-val"></span>
    <button class="kk-btn" data-act="size+" title="${t("larger")}">+</button>
    <button class="kk-btn" data-act="lh" title="${t("lh")}">≡</button>
    <select class="kk-select" data-act="font" title="${t("font")}">${fontOptions}</select>
    <button class="kk-btn" data-act="lang" title="${t("langTitle")}">${settings.lang === "en" ? "فا" : "EN"}</button>
    <span class="kk-sep"></span>
    <button class="kk-swatch" data-theme-btn="light" title="${t("light")}" style="background:#FFFFFF"></button>
    <button class="kk-swatch" data-theme-btn="sepia" title="${t("sepia")}" style="background:#F4ECDD"></button>
    <button class="kk-swatch" data-theme-btn="dark" title="${t("dark")}" style="background:#191919"></button>
    <span class="kk-sep"></span>
    <button class="kk-btn" data-act="paged" title="${t("paged")}">${ICONS.columns}</button>
    <button class="kk-btn" data-act="refresh" title="${t("refresh")}">${ICONS.refresh}</button>
    <span style="flex:1"></span>
    <button class="kk-btn" data-act="sidebar" title="${t("notes")}">${ICONS.list}<span class="kk-count" hidden></span></button>
  </div>
  <div class="kk-body">
    <div class="kk-stage">
      <div class="kk-scroller">
        <div class="kk-pagewrap">
          <div class="kk-paper">
            <div class="kk-flowclip">
              <div class="kk-flow">
                <header class="kk-article-head">
                  <h1 class="kk-h-title"></h1>
                  <p class="kk-meta"></p>
                </header>
                <div class="kk-article"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div class="kk-status">
        <span class="kk-progress"></span>
        <span class="kk-pagenav">
          <button class="kk-btn" data-act="next" title="${t("nextP")}">❯</button>
          <span class="kk-pagelabel"></span>
          <button class="kk-btn" data-act="prev" title="${t("prevP")}">❮</button>
        </span>
        <span class="kk-saved">${t("savedChip")}</span>
      </div>
    </div>
    <aside class="kk-sidebar">
      <div class="kk-sb-title">${ICONS.book} ${t("notes")}</div>
      <div class="kk-sb-list"></div>
    </aside>
  </div>
  <div class="kk-pop">
    ${swatches}
    <span class="kk-vsep"></span>
    <button class="kk-pop-act" data-pop="note">${t("noteBtn")}</button>
    <button class="kk-pop-act" data-pop="question">${t("questionBtn")}</button>
    <button class="kk-pop-act" data-pop="dict">${t("dictBtn")}</button>
  </div>
  <div class="kk-dict-backdrop">
    <div class="kk-dict">
      <div class="kk-dict-head">
        <span class="kk-dict-word"></span>
        <button class="kk-btn" data-dict="close" title="${t("closeW")}">✕</button>
      </div>
      <div class="kk-dict-body"></div>
      <div class="kk-dict-links">
        <a class="kk-btn-ghost" data-dict-link="vajehyab" target="_blank" rel="noopener">${t("vajehyab")}</a>
        <a class="kk-btn-ghost" data-dict-link="abadis" target="_blank" rel="noopener">${t("abadis")}</a>
      </div>
    </div>
  </div>
  <div class="kk-savedlg-backdrop">
    <div class="kk-dlg kk-savedlg">
      <div class="kk-dlg-title">${t("saveDlgTitle")}</div>
      <p class="kk-savedlg-hint">${t("saveDlgHint")}</p>
      <input class="kk-ta kk-savedlg-tags" type="text" placeholder="${t("saveDlgPh")}">
      <div class="kk-dlg-actions">
        <button class="kk-btn-primary" data-savedlg="save">${t("save")}</button>
        <button class="kk-btn-ghost" data-savedlg="cancel">${t("cancel")}</button>
        <span style="flex:1"></span>
        <button class="kk-btn-danger" data-savedlg="remove" hidden>${t("removeBook")}</button>
      </div>
    </div>
  </div>
  <div class="kk-dlg-backdrop">
    <div class="kk-dlg">
      <div class="kk-dlg-title"></div>
      <blockquote class="kk-quote"></blockquote>
      <div class="kk-dlg-colors">${swatches}</div>
      <div class="kk-dlg-fields"></div>
      <div class="kk-dlg-actions">
        <button class="kk-btn-primary" data-dlg="save">${t("save")}</button>
        <button class="kk-btn-ghost" data-dlg="cancel">${t("cancel")}</button>
        <span style="flex:1"></span>
        <button class="kk-btn-danger" data-dlg="delete">${t("del")}</button>
      </div>
    </div>
  </div>
</div>`);

    shadow.appendChild(root);
    document.documentElement.appendChild(host);

    ui = {
      shadow,
      root,
      toolbar: root.querySelector(".kk-toolbar"),
      scroller: root.querySelector(".kk-scroller"),
      paper: root.querySelector(".kk-paper"),
      flowclip: root.querySelector(".kk-flowclip"),
      flow: root.querySelector(".kk-flow"),
      title: root.querySelector(".kk-h-title"),
      meta: root.querySelector(".kk-meta"),
      article: root.querySelector(".kk-article"),
      progress: root.querySelector(".kk-progress"),
      pagelabel: root.querySelector(".kk-pagelabel"),
      saved: root.querySelector(".kk-saved"),
      sizeVal: root.querySelector(".kk-size-val"),
      fontSel: root.querySelector('select[data-act="font"]'),
      count: root.querySelector(".kk-count"),
      sbList: root.querySelector(".kk-sb-list"),
      pop: root.querySelector(".kk-pop"),
      dlgBackdrop: root.querySelector(".kk-dlg-backdrop"),
      dlg: root.querySelector(".kk-dlg-backdrop .kk-dlg"),
      dlgTitle: root.querySelector(".kk-dlg-backdrop .kk-dlg-title"),
      dlgQuote: root.querySelector(".kk-quote"),
      dlgColors: root.querySelector(".kk-dlg-colors"),
      dlgFields: root.querySelector(".kk-dlg-fields"),
      btnPrev: root.querySelector('[data-act="prev"]'),
      btnNext: root.querySelector('[data-act="next"]'),
      dictBackdrop: root.querySelector(".kk-dict-backdrop"),
      saveBackdrop: root.querySelector(".kk-savedlg-backdrop"),
      saveTags: root.querySelector(".kk-savedlg-tags"),
      dictWord: root.querySelector(".kk-dict-word"),
      dictBody: root.querySelector(".kk-dict-body"),
    };

    root
      .querySelectorAll("button[title],select[title]")
      .forEach((n) => n.setAttribute("aria-label", n.title));
    root.querySelectorAll(".kk-dlg,.kk-dict").forEach((n) => {
      n.setAttribute("role", "dialog");
      n.setAttribute("aria-modal", "true");
      n.setAttribute("aria-label", n.textContent.trim().slice(0, 80));
    });
    root
      .querySelectorAll("a[target]")
      .forEach((a) => (a.rel = "noopener noreferrer"));
    if (offline) root.querySelector("[data-act=refresh]").hidden = true;
    applySettings();
    renderBook();
    wireEvents();
    root.focus();
  }

  function applySettings() {
    if (!ui) return;
    const f = FONTS[settings.font] || FONTS.vazir;
    ui.flow.style.setProperty("--kk-font", f.stack);
    ui.flow.style.setProperty("--kk-size", settings.size + "px");
    ui.flow.style.setProperty("--kk-lh", settings.lh);
    ui.flow.style.setProperty("--kk-width", settings.width + "px");
    ui.root.dataset.theme = settings.theme;
    ui.root.dataset.paged = settings.paged ? "1" : "0";
    ui.root.dataset.sidebar = settings.sidebar ? "1" : "0";
    ui.sizeVal.textContent = faNum(settings.size);
    ui.fontSel.value = settings.font;
    ui.toolbar.querySelectorAll("[data-theme-btn]").forEach((b) => {
      b.dataset.on = b.dataset.themeBtn === settings.theme ? "1" : "0";
      b.setAttribute("aria-pressed", String(b.dataset.on === "1"));
    });
    if (settings.paged) requestAnimationFrame(() => layoutPaged(true));
    else {
      ui.flow.style.transform = "";
      ui.flow.style.columnWidth = "";
      ui.flow.style.height = "";
      updateProgressScroll();
    }
  }

  function saveSettings() {
    storage.set({ [SETTINGS_KEY]: settings }).catch(reportError);
  }

  function renderBook() {
    if (!ui || !book) return;
    ui.title.textContent = book.title;
    const bits = [];
    if (book.byline) bits.push(book.byline);
    bits.push(t("wordsAbout") + " " + faNum(book.words) + " " + t("wordsWord"));
    bits.push(new URL(book.url).hostname.replace(/^www\./, ""));
    ui.meta.textContent = bits.join(" · ");
    ui.flow.dir = book.dir || "rtl";
    applyAnnotations();
    renderSidebar();
    updateCounts();
  }

  /* ============ رویدادها ============ */

  function wireEvents() {
    ui.btnNext.onclick = () => goPage(pageIndex + 1);
    ui.btnPrev.onclick = () => goPage(pageIndex - 1);
    ui.toolbar.addEventListener("click", (e) => {
      const btn = e.target.closest("[data-act],[data-theme-btn]");
      if (!btn) return;
      if (btn.dataset.themeBtn) {
        settings.theme = btn.dataset.themeBtn;
        applySettings();
        saveSettings();
        return;
      }
      const act = btn.dataset.act;
      if (act === "close") {
        close().then((closed) => {
          if (offline && closed) location.href = "../popup/popup.html?tab=1";
        });
      } else if (act === "size+") {
        settings.size = Math.min(28, settings.size + 1);
        applySettings();
        saveSettings();
      } else if (act === "size-") {
        settings.size = Math.max(14, settings.size - 1);
        applySettings();
        saveSettings();
      } else if (act === "lh") {
        const i = LINE_HEIGHTS.indexOf(settings.lh);
        settings.lh = LINE_HEIGHTS[(i + 1) % LINE_HEIGHTS.length];
        applySettings();
        saveSettings();
      } else if (act === "paged") {
        const pct =
          book && book.progress
            ? Math.min(1, Math.max(0, book.progress / 100))
            : 0;
        settings.paged = !settings.paged;
        applySettings();
        saveSettings();
        requestAnimationFrame(() =>
          requestAnimationFrame(() => {
            if (settings.paged) {
              goPage(Math.round(pct * (pageCount - 1)), true);
            } else {
              const sc = ui.scroller;
              sc.scrollTop = pct * (sc.scrollHeight - sc.clientHeight);
              updateProgressScroll();
            }
          }),
        );
      } else if (act === "sidebar") {
        settings.sidebar = !settings.sidebar;
        applySettings();
        saveSettings();
      } else if (act === "refresh") reExtract();
      else if (act === "lang") {
        settings.lang = settings.lang === "en" ? "fa" : "en";
        storage
          .set({ [SETTINGS_KEY]: settings })
          .then(async () => {
            await close();
            await open();
          })
          .catch(reportError);
      } else if (act === "savebook") openSaveDlg();
      else if (act === "next") goPage(pageIndex + 1);
      else if (act === "prev") goPage(pageIndex - 1);
    });
    ui.fontSel.addEventListener("change", () => {
      settings.font = ui.fontSel.value;
      applySettings();
      saveSettings();
    });

    ui.article.addEventListener("mouseup", () =>
      setTimeout(maybeShowPopover, 0),
    );
    ui.article.addEventListener("click", (e) => {
      const span = e.target.closest(".kk-ann");
      if (!span) return;
      const ann = (book.annotations || []).find(
        (a) => a.id === span.dataset.kkId,
      );
      if (ann) openDialog(ann);
    });

    ui.pop.addEventListener("mousedown", (e) => e.preventDefault());
    ui.pop.addEventListener("click", (e) => {
      const dot = e.target.closest(".kk-dot");
      const act = e.target.closest(".kk-pop-act");
      if (dot) createAnnotation("highlight", dot.dataset.color);
      else if (act && act.dataset.pop === "dict") openDictFromSelection();
      else if (act) createAnnotation(act.dataset.pop, "yellow");
    });

    ui.dlgBackdrop.addEventListener("click", (e) => {
      if (e.target === ui.dlgBackdrop) closeDialog();
    });
    ui.dictBackdrop.addEventListener("click", (e) => {
      if (
        e.target === ui.dictBackdrop ||
        e.target.closest('[data-dict="close"]')
      )
        closeDict();
    });
    ui.saveBackdrop.addEventListener("click", (e) => {
      if (e.target === ui.saveBackdrop) closeSaveDlg();
    });
    ui.saveBackdrop.querySelector('[data-savedlg="save"]').onclick = () => {
      saveToLibrary(ui.saveTags.value).then(closeSaveDlg).catch(reportError);
    };
    ui.saveBackdrop.querySelector('[data-savedlg="cancel"]').onclick =
      closeSaveDlg;
    ui.saveBackdrop.querySelector('[data-savedlg="remove"]').onclick =
      async () => {
        closeSaveDlg();
        try {
          await storage.remove(PAGE_KEY);
          bookSaved = false;
        } catch (err) {
          reportError(err);
        }
        updateSaveBtn();
      };

    ui.keydown = (e) => {
      if (e.key === "Tab") {
        const modal = [ui.saveBackdrop, ui.dictBackdrop, ui.dlgBackdrop].find(
          (n) => n.dataset.open === "1",
        );
        const nodes = [
          ...(modal || ui.root).querySelectorAll(
            "button:not(:disabled),a[href],input,textarea,select",
          ),
        ].filter((n) => n.getClientRects().length);
        const active = ui.shadow.activeElement;
        if (
          nodes.length &&
          (e.shiftKey
            ? active === nodes[0] || !nodes.includes(active)
            : active === nodes.at(-1) || !nodes.includes(active))
        ) {
          e.preventDefault();
          (e.shiftKey ? nodes.at(-1) : nodes[0]).focus();
        }
      }
      if (
        e.key !== "Escape" &&
        (ui.saveBackdrop.dataset.open === "1" ||
          ui.dictBackdrop.dataset.open === "1" ||
          /^(INPUT|TEXTAREA|SELECT)$/.test(ui.shadow.activeElement?.tagName))
      )
        return;
      if (e.key === "Escape") {
        if (ui.saveBackdrop.dataset.open === "1") closeSaveDlg();
        else if (ui.dictBackdrop.dataset.open === "1") closeDict();
        else if (ui.dlgBackdrop.dataset.open === "1") closeDialog();
        else if (ui.pop.dataset.open === "1") hidePopover();
        else {
          close().then((closed) => {
            if (offline && closed) location.href = "../popup/popup.html?tab=1";
          });
        }
        e.stopPropagation();
        return;
      }
      if (settings.paged && ui.dlgBackdrop.dataset.open !== "1") {
        if (
          ["ArrowLeft", "ArrowRight", "PageDown", "PageUp", " "].includes(e.key)
        )
          e.preventDefault();
        const rtl = (book.dir || "rtl") === "rtl";
        if (e.key === "ArrowLeft") goPage(pageIndex + (rtl ? 1 : -1));
        if (e.key === "ArrowRight") goPage(pageIndex + (rtl ? -1 : 1));
        if (e.key === "PageDown" || e.key === " ") goPage(pageIndex + 1);
        if (e.key === "PageUp") goPage(pageIndex - 1);
      }
    };
    window.addEventListener("keydown", ui.keydown, true);

    ui.scroller.addEventListener("scroll", () => {
      if (settings.paged) return;
      updateProgressScroll();
      scheduleSave();
    });

    ui.resize = () => {
      if (settings.paged) layoutPaged(true);
    };
    window.addEventListener("resize", ui.resize);
  }

  function updateProgressScroll() {
    if (!ui) return;
    const s = ui.scroller;
    const max = s.scrollHeight - s.clientHeight;
    const pct = max > 0 ? Math.round((s.scrollTop / max) * 100) : 100;
    ui.progress.textContent = faNum(pct) + t("readPct");
    if (book) {
      book.progress = pct;
      book.scrollTop = s.scrollTop;
    }
  }

  /* ============ حالت ورق‌زدن ============ */

  function layoutPaged(keepPage) {
    if (!ui) return;
    ui.scroller.scrollTop = 0;
    ui.scroller.scrollLeft = 0;
    const w = ui.flowclip.clientWidth;
    const h = ui.flowclip.clientHeight;
    if (!w || !h) return;
    ui.flow.style.height = h + "px";
    const gap = 64;
    ui.flow.style.columnWidth = w + "px";
    ui.flow.style.columnGap = gap + "px";
    pageStep = w + gap;
    const total = ui.flow.scrollWidth;
    pageCount = Math.max(1, Math.round((total + gap) / pageStep));
    const target = keepPage ? Math.min(pageIndex, pageCount - 1) : 0;
    goPage(target, true);
  }

  function goPage(i, instant) {
    if (!settings.paged || !ui) return;
    pageIndex = Math.max(0, Math.min(pageCount - 1, i));
    const rtl = (book.dir || "rtl") === "rtl";
    const x = pageIndex * pageStep * (rtl ? 1 : -1);
    if (instant) ui.flow.style.transition = "none";
    ui.flow.style.transform = "translateX(" + x + "px)";
    if (instant)
      requestAnimationFrame(() => {
        ui.flow.style.transition = "";
      });
    ui.pagelabel.textContent =
      faNum(pageIndex + 1) + " " + t("pageOf") + " " + faNum(pageCount);
    ui.btnNext.disabled = pageIndex >= pageCount - 1;
    ui.btnPrev.disabled = pageIndex <= 0;
    const pct =
      pageCount > 1 ? Math.round((pageIndex / (pageCount - 1)) * 100) : 100;
    ui.progress.textContent = faNum(pct) + t("readPct");
    if (book) {
      book.pageIndex = pageIndex;
      book.progress = pct;
      scheduleSave();
    }
  }

  /* ============ هایلایت، یادداشت، پرسش ============ */

  function getSel() {
    if (ui.shadow.getSelection) return ui.shadow.getSelection();
    return window.getSelection();
  }

  function pointToOffset(node, offset) {
    const r = document.createRange();
    r.setStart(ui.article, 0);
    r.setEnd(node, offset);
    return r.toString().length;
  }

  function maybeShowPopover() {
    const sel = getSel();
    if (!sel || sel.isCollapsed || !sel.rangeCount) {
      hidePopover();
      return;
    }
    const range = sel.getRangeAt(0);
    if (!ui.article.contains(range.commonAncestorContainer)) {
      hidePopover();
      return;
    }
    const text = range.toString().trim();
    if (text.length < 2) {
      hidePopover();
      return;
    }
    pendingRange = {
      start: pointToOffset(range.startContainer, range.startOffset),
      end: pointToOffset(range.endContainer, range.endOffset),
    };
    const rect = range.getBoundingClientRect();
    ui.pop.dataset.open = "1";
    const pw = ui.pop.offsetWidth || 260;
    let left = rect.left + rect.width / 2 - pw / 2;
    left = Math.max(8, Math.min(window.innerWidth - pw - 8, left));
    let top = rect.top - 44;
    if (top < 52) top = rect.bottom + 8;
    ui.pop.style.left = left + "px";
    ui.pop.style.top = top + "px";
  }

  function hidePopover() {
    if (ui) ui.pop.dataset.open = "0";
  }

  function createAnnotation(type, color) {
    if (!pendingRange || !book) return;
    const full = ui.article.textContent;
    const { start, end } = pendingRange;
    if (end <= start) return;
    const ann = {
      id:
        "a" + Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
      type,
      color,
      start,
      end,
      quote: full.slice(start, end),
      note: "",
      answer: "",
      createdAt: Date.now(),
    };
    book.annotations = book.annotations || [];
    book.annotations.push(ann);
    hidePopover();
    getSel().removeAllRanges();
    applyAnnotations();
    renderSidebar();
    updateCounts();
    markSaved();
    scheduleSave();
    if (type !== "highlight") openDialog(ann);
  }

  function removeAnnotation(id) {
    book.annotations = (book.annotations || []).filter((a) => a.id !== id);
    applyAnnotations();
    renderSidebar();
    updateCounts();
    scheduleSave();
  }

  function wrapOffsets(ann) {
    const walker = document.createTreeWalker(ui.article, NodeFilter.SHOW_TEXT);
    let pos = 0;
    const targets = [];
    while (walker.nextNode()) {
      const node = walker.currentNode;
      const len = node.nodeValue.length;
      const nStart = pos;
      const nEnd = pos + len;
      pos = nEnd;
      if (nEnd <= ann.start) continue;
      if (nStart >= ann.end) break;
      targets.push({
        node,
        from: Math.max(0, ann.start - nStart),
        to: Math.min(len, ann.end - nStart),
      });
    }
    let last = null;
    for (const t of targets) {
      if (t.from >= t.to) continue;
      const r = document.createRange();
      r.setStart(t.node, t.from);
      r.setEnd(t.node, t.to);
      const span = document.createElement("span");
      span.className = "kk-ann kk-ann-" + ann.type;
      span.dataset.kkId = ann.id;
      span.style.setProperty(
        "--kk-hl",
        HL_COLORS[ann.color] || HL_COLORS.yellow,
      );
      try {
        r.surroundContents(span);
        last = span;
      } catch (e) {
        /* skip partial */
      }
    }
    if (last && ann.type !== "highlight") {
      last.classList.add("kk-ann-end");
      last.dataset.kkBadge = ann.type === "question" ? "؟" : "✎";
    }
  }

  function applyAnnotations() {
    book.html = Core.sanitizeHtml(book.html, book.url);
    ui.article.innerHTML = book.html;
    const anns = (book.annotations || [])
      .filter((a) => a.start >= 0)
      .slice()
      .sort((a, b) => b.start - a.start);
    for (const ann of anns) wrapOffsets(ann);
    if (settings.paged) requestAnimationFrame(() => layoutPaged(true));
  }

  function jumpTo(ann) {
    const span = [...ui.article.querySelectorAll("[data-kk-id]")].find(
      (n) => n.dataset.kkId === ann.id,
    );
    if (!span) return;
    if (settings.paged) {
      const rtl = (book.dir || "rtl") === "rtl";
      const clipRect = ui.flowclip.getBoundingClientRect();
      const rect = span.getBoundingClientRect();
      const delta = rtl
        ? clipRect.right - rect.right
        : rect.left - clipRect.left;
      const page = pageIndex + Math.floor(delta / pageStep);
      goPage(page, true);
    } else {
      span.scrollIntoView({ block: "center", behavior: "smooth" });
    }
    span.classList.add("kk-flash");
    setTimeout(() => span.classList.remove("kk-flash"), 1200);
  }

  /* ============ دیالوگ یادداشت/پرسش ============ */

  let dlgAnn = null;
  function openDialog(ann) {
    dlgAnn = ann;
    ann = { ...ann };
    hidePopover();
    const titles = {
      highlight: t("highlight"),
      note: t("noteWord"),
      question: t("questionWord"),
    };
    ui.dlgTitle.textContent = titles[ann.type] || t("edit");
    ui.dlgQuote.textContent =
      ann.quote.length > 220 ? ann.quote.slice(0, 220) + "…" : ann.quote;
    ui.dlgColors.querySelectorAll(".kk-dot").forEach((d) => {
      d.dataset.on = d.dataset.color === ann.color ? "1" : "0";
    });
    let fields;
    if (ann.type === "question") {
      fields =
        "<label>" +
        t("questionWord") +
        '</label><textarea class="kk-ta" data-f="note" rows="2" placeholder="' +
        t("qPh") +
        '"></textarea>' +
        "<label>" +
        t("aLabel") +
        '</label><textarea class="kk-ta" data-f="answer" rows="2" placeholder="' +
        t("aPh") +
        '"></textarea>';
    } else {
      fields =
        "<label>" +
        t("noteWord") +
        '</label><textarea class="kk-ta" data-f="note" rows="3" placeholder="' +
        t("nPh") +
        '"></textarea>';
    }
    ui.dlgFields.innerHTML = fields;
    const noteTa = ui.dlgFields.querySelector('[data-f="note"]');
    if (noteTa) {
      noteTa.setAttribute(
        "aria-label",
        t(ann.type === "question" ? "questionWord" : "noteWord"),
      );
      noteTa.maxLength = 20000;
    }
    if (noteTa) noteTa.value = ann.note || "";
    const ansTa = ui.dlgFields.querySelector('[data-f="answer"]');
    if (ansTa) {
      ansTa.setAttribute("aria-label", t("aLabel"));
      ansTa.maxLength = 20000;
    }
    if (ansTa) ansTa.value = ann.answer || "";
    ui.dlgBackdrop.dataset.open = "1";
    if (noteTa) setTimeout(() => noteTa.focus(), 50);

    ui.dlgColors.onclick = (e) => {
      const d = e.target.closest(".kk-dot");
      if (!d) return;
      ann.color = d.dataset.color;
      ui.dlgColors.querySelectorAll(".kk-dot").forEach((x) => {
        x.dataset.on = x === d ? "1" : "0";
      });
    };
    ui.dlg.querySelector('[data-dlg="save"]').onclick = () => {
      if (noteTa) ann.note = noteTa.value.trim();
      if (ansTa) ann.answer = ansTa.value.trim();
      Object.assign(dlgAnn, ann);
      closeDialog();
      applyAnnotations();
      renderSidebar();
      markSaved();
      scheduleSave();
    };
    ui.dlg.querySelector('[data-dlg="cancel"]').onclick = closeDialog;
    ui.dlg.querySelector('[data-dlg="delete"]').onclick = () => {
      closeDialog();
      removeAnnotation(ann.id);
    };
  }
  function closeDialog() {
    ui.dlgBackdrop.dataset.open = "0";
    dlgAnn = null;
  }

  /* ============ معنی واژه ============ */

  function openDictFromSelection() {
    if (!pendingRange) return;
    const text = ui.article.textContent
      .slice(pendingRange.start, pendingRange.end)
      .trim();
    openDict(text);
  }

  function renderDictResult(res) {
    ui.dictBody.textContent = "";
    const meanings =
      res && res.ok && Array.isArray(res.meanings)
        ? res.meanings.filter((m) => m && m.text)
        : [];
    if (!meanings.length) {
      const p = document.createElement("p");
      p.className = "kk-dict-miss";
      p.textContent = t("dictMiss");
      ui.dictBody.appendChild(p);
      return;
    }
    for (const m of meanings.slice(0, 6)) {
      const item = document.createElement("div");
      item.className = "kk-dict-item";
      if (m.source) {
        const srcEl = document.createElement("div");
        srcEl.className = "kk-dict-src";
        srcEl.textContent = m.source;
        item.appendChild(srcEl);
      }
      const txt = document.createElement("p");
      txt.className = "kk-dict-text";
      txt.textContent = m.text;
      item.appendChild(txt);
      ui.dictBody.appendChild(item);
    }
  }

  function openDict(word) {
    word = (word || "").replace(/\s+/g, " ").trim();
    if (!word) return;
    if (word.length > 60) word = word.slice(0, 60);
    hidePopover();
    try {
      getSel().removeAllRanges();
    } catch (e) {
      /* ignore */
    }
    const enc = encodeURIComponent(word);
    ui.dictWord.textContent = word;
    ui.root.querySelector('[data-dict-link="vajehyab"]').href =
      "https://vajehyab.com/?q=" + enc;
    ui.root.querySelector('[data-dict-link="abadis"]').href =
      "https://abadis.ir/fatofa/" + enc + "/";
    ui.dictBody.innerHTML =
      '<p class="kk-dict-loading">' + t("dictLoading") + "</p>";
    ui.dictBackdrop.dataset.open = "1";
    renderDictResult({ ok: false });
    ui.dictBody.firstChild.textContent =
      settings.lang === "en"
        ? "Choose a dictionary below. Only the selected word is sent when you open its website."
        : "یک واژه‌نامه را انتخاب کنید. تنها پس از باز کردن سایت آن، واژهٔ انتخابی ارسال می‌شود.";
  }

  function closeDict() {
    if (ui) ui.dictBackdrop.dataset.open = "0";
  }

  /* ============ نوار کناری ============ */

  function renderSidebar() {
    const anns = book.annotations || [];
    const groups = [
      { type: "highlight", label: t("highlight") },
      { type: "note", label: t("noteWord") },
      { type: "question", label: t("questionWord") },
    ];
    ui.sbList.textContent = "";
    let any = false;
    for (const g of groups) {
      const items = anns
        .filter((a) => a.type === g.type)
        .sort((a, b) => a.start - b.start);
      if (!items.length) continue;
      any = true;
      const h = document.createElement("div");
      h.className = "kk-sb-h";
      h.textContent = g.label + " (" + faNum(items.length) + ")";
      ui.sbList.appendChild(h);
      for (const a of items) {
        const item = document.createElement("div");
        item.className = "kk-sb-item";
        const row = document.createElement("div");
        row.className = "kk-sb-row";
        const q = document.createElement("button");
        q.className = "kk-sb-quote";
        q.style.setProperty("--kk-hl", HL_COLORS[a.color] || HL_COLORS.yellow);
        q.textContent =
          a.quote.length > 90 ? a.quote.slice(0, 90) + "…" : a.quote;
        const del = document.createElement("button");
        del.className = "kk-sb-del";
        del.title = t("del");
        del.textContent = "✕";
        del.onclick = (e) => {
          e.stopPropagation();
          removeAnnotation(a.id);
        };
        row.appendChild(q);
        row.appendChild(del);
        item.appendChild(row);
        if (a.note) {
          const n = document.createElement("div");
          n.className = "kk-sb-note";
          n.textContent = (a.type === "question" ? t("qPrefix") : "") + a.note;
          item.appendChild(n);
        }
        if (a.type === "question" && a.answer) {
          const n = document.createElement("div");
          n.className = "kk-sb-note";
          n.textContent = t("aPrefix") + a.answer;
          item.appendChild(n);
        }
        if (a.start < 0) {
          const o = document.createElement("div");
          o.className = "kk-sb-orphan";
          o.textContent = t("orphan");
          item.appendChild(o);
        }
        item.onclick = () => {
          if (a.start >= 0) jumpTo(a);
          else openDialog(a);
        };
        ui.sbList.appendChild(item);
      }
    }
    if (!any) {
      const p = document.createElement("p");
      p.className = "kk-empty";
      p.textContent = t("sbEmpty");
      ui.sbList.appendChild(p);
    }
  }

  function updateCounts() {
    const n = (book.annotations || []).length;
    ui.count.hidden = !n;
    ui.count.dataset.show = n ? "1" : "0";
    ui.count.textContent = faNum(n);
  }

  /* ============ ذخیره و بازیابی ============ */

  function scheduleSave() {
    clearTimeout(saveTimer);
    saveTimer = setTimeout(() => saveNow().catch(reportError), 600);
  }
  async function saveNow(silent) {
    if (!book || !bookSaved) return;
    book.savedAt = book.savedAt || Date.now();
    book.updatedAt = Date.now();
    // کش متن ساده برای جست‌وجوی تمام‌متن در کتابخانه
    if (ui && ui.article)
      book.text = ui.article.textContent.replace(/\s+/g, " ").trim();
    const currentUI = ui;
    await storage.set({ [PAGE_KEY]: JSON.parse(JSON.stringify(book)) });
    updateSaveBtn();
    if (!silent && ui && ui === currentUI) {
      ui.saved.textContent = t("savedChip");
      ui.saved.dataset.show = "1";
      clearTimeout(ui.savedTimer);
      const savedLabel = ui.saved;
      ui.savedTimer = setTimeout(() => {
        savedLabel.dataset.show = "0";
      }, 1500);
    }
  }

  function markSaved() {
    if (!bookSaved) {
      bookSaved = true;
    }
  }
  function updateSaveBtn() {
    if (!ui) return;
    const btn = ui.root.querySelector(".kk-savebook");
    if (!btn) return;
    btn.dataset.saved = bookSaved ? "1" : "0";
    btn.querySelector(".kk-save-txt").textContent = bookSaved
      ? t("inLibrary")
      : t("saveBook");
  }
  function openSaveDlg() {
    if (!ui || !book) return;
    ui.saveTags.value = (book.tags || []).join("، ");
    ui.saveBackdrop.querySelector('[data-savedlg="remove"]').hidden =
      !bookSaved;
    ui.saveBackdrop.dataset.open = "1";
    const tagsInput = ui.saveTags;
    tagsInput.setAttribute("aria-label", t("saveDlgPh"));
    tagsInput.maxLength = 1500;
    setTimeout(() => {
      if (tagsInput.isConnected) tagsInput.focus();
    }, 40);
  }
  function closeSaveDlg() {
    if (ui) {
      ui.saveBackdrop.dataset.open = "0";
      ui.root.querySelector(".kk-savebook").focus();
    }
  }
  async function saveToLibrary(tagsRaw) {
    if (!book) return;
    const tags = String(tagsRaw || "")
      .split(/[,،]+/)
      .map((x) => x.trim())
      .filter(Boolean);
    book.tags = Core.tags(tags);
    const wasSaved = bookSaved;
    bookSaved = true;
    try {
      await saveNow();
    } catch (error) {
      bookSaved = wasSaved;
      throw error;
    }
    updateSaveBtn();
  }

  function reExtract() {
    if (offline) return;
    const fresh = extractArticle();
    const text = new DOMParser().parseFromString(fresh.html, "text/html").body
      .textContent;
    (book.annotations || []).forEach((a) => {
      const idx = text.indexOf(a.quote);
      if (idx >= 0) {
        a.start = idx;
        a.end = idx + a.quote.length;
      } else {
        a.start = -1;
        a.end = -1;
      }
    });
    book.title = fresh.title;
    book.byline = fresh.byline;
    book.dir = fresh.dir;
    book.html = fresh.html;
    book.words = fresh.words;
    renderBook();
    scheduleSave();
  }

  function restoreProgress() {
    if (!ui || !book) return;
    const savedPage = book.pageIndex || 0;
    const savedScroll = book.scrollTop || 0;
    requestAnimationFrame(() =>
      requestAnimationFrame(() => {
        if (!ui) return;
        if (settings.paged) {
          layoutPaged();
          goPage(savedPage, true);
        } else if (savedScroll) {
          ui.scroller.scrollTop = savedScroll;
          updateProgressScroll();
        } else {
          updateProgressScroll();
        }
      }),
    );
  }

  /* ============ باز/بستن ============ */

  function lockScroll(lock) {
    if (lock) {
      prevOverflow = document.documentElement.style.overflow;
      document.documentElement.style.overflow = "hidden";
    } else {
      document.documentElement.style.overflow = prevOverflow || "";
    }
  }

  function open() {
    if (host) return Promise.resolve();
    if (opening) return opening;
    opening = openInternal().finally(() => {
      opening = null;
    });
    return opening;
  }
  async function openInternal() {
    removeChip();
    registerBundledFonts();
    const stored = await storage.get([PAGE_KEY, SETTINGS_KEY]);
    if (stored[SETTINGS_KEY]) settings = Core.settings(stored[SETTINGS_KEY]);
    if (stored[PAGE_KEY] && stored[PAGE_KEY].html) {
      book = Core.normalizeBook(stored[PAGE_KEY]);
      bookSaved = true;
    } else {
      bookSaved = false;
      if (offline) throw new Error("Book unavailable");
      const fresh = extractArticle();
      book = Object.assign(
        {
          v: VERSION,
          url: location.href,
          annotations: [],
          progress: 0,
          createdAt: Date.now(),
        },
        fresh,
      );
    }
    book.url = offline ? book.url : Core.safeUrl(location.href);
    book = Core.normalizeBook(book);
    const position = {
      scrollTop: book.scrollTop,
      pageIndex: book.pageIndex,
      progress: book.progress,
    };
    await buildUI();
    Object.assign(book, position);
    updateSaveBtn();
    lockScroll(true);
    restoreProgress();
  }

  async function close() {
    if (!host) return true;
    clearTimeout(saveTimer);
    try {
      await saveNow(true);
    } catch {
      reportError();
      return false;
    }
    if (!host) return true;
    window.removeEventListener("keydown", ui.keydown, true);
    window.removeEventListener("resize", ui.resize);
    host.remove();
    host = null;
    ui = null;
    lockScroll(false);
    if (!offline) showChip();
    return true;
  }

  function toggle() {
    return host ? close() : open();
  }

  /* ============ دکمهٔ شناور ادامهٔ مطالعه ============ */

  function removeChip() {
    if (chipEl) {
      chipEl.remove();
      chipEl = null;
    }
  }
  function showChip() {
    removeChip();
    chipEl = document.createElement("div");
    chipEl.style.cssText =
      "all:initial; position:fixed; bottom:18px; left:18px; z-index:2147483646; display:flex; align-items:center; gap:6px; direction:rtl; font-family:Vazirmatn,Tahoma,sans-serif;";
    const btn = document.createElement("button");
    btn.textContent = t("resume");
    btn.style.cssText =
      "all:initial; cursor:pointer; background:#2783DE; color:#fff; font-family:inherit; font-size:13px; padding:9px 14px; border-radius:999px; box-shadow:0 4px 14px rgba(0,0,0,.25); direction:rtl;";
    btn.onclick = open;
    const x = document.createElement("button");
    x.textContent = "\u2715";
    x.title = t("hide");
    x.style.cssText =
      "all:initial; cursor:pointer; background:#fff; color:#555; font-family:inherit; font-size:11px; width:24px; height:24px; border-radius:50%; display:flex; align-items:center; justify-content:center; box-shadow:0 2px 8px rgba(0,0,0,.2);";
    x.onclick = removeChip;
    chipEl.appendChild(btn);
    chipEl.appendChild(x);
    document.documentElement.appendChild(chipEl);
  }

  /* ============ پیام‌ها و شروع ============ */

  function reportError() {
    if (!ui) return;
    ui.saved.textContent =
      settings.lang === "en"
        ? "Could not save. Export a backup or free storage, then retry."
        : "ذخیره نشد. پشتیبان بگیرید یا فضای ذخیره را خالی کنید و دوباره تلاش کنید.";
    ui.saved.dataset.show = "1";
    ui.saved.setAttribute("role", "alert");
  }
  if (hasChrome) {
    chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
      if (sender.id !== chrome.runtime.id || !msg) return;
      if (msg.type === "kk-state") {
        storage
          .get([PAGE_KEY])
          .then((st) =>
            sendResponse({ ok: true, open: !!host, saved: !!st[PAGE_KEY] }),
          )
          .catch(() => sendResponse({ ok: false }));
        return true;
      }
      if (msg.type === "kk-toggle" || msg.type === "kk-save") {
        (async () => {
          if (msg.type === "kk-toggle") await toggle();
          else {
            if (!host) await open();
            await saveToLibrary(Core.tags(msg.tags).join(","));
          }
          sendResponse({ ok: true, open: !!host });
        })().catch(() => {
          reportError();
          sendResponse({ ok: false });
        });
        return true;
      }
    });
    chrome.storage.onChanged.addListener((changes, area) => {
      if (area === "local" && changes[PAGE_KEY] && book) {
        if (!changes[PAGE_KEY].newValue) {
          bookSaved = false;
          updateSaveBtn();
        } else book.tags = Core.tags(changes[PAGE_KEY].newValue.tags);
      }
    });
    window.addEventListener("pagehide", () => {
      clearTimeout(saveTimer);
      saveNow(true).catch(() => {});
    });
    if (offline)
      open().catch(() => {
        document.querySelector("#readerError").textContent =
          "کتاب در دسترس نیست. · Book unavailable.";
      });
  }

  /* API برای تست و اشکال‌زدایی */
  if (!hasChrome)
    window.__kk = {
      open,
      close,
      toggle,
      extractArticle,
      nextPage: () => goPage(pageIndex + 1),
      prevPage: () => goPage(pageIndex - 1),
      openDict: (w) => openDict(w),
      getBook: () => book,
      setSettings: (patch) => {
        Object.assign(settings, patch);
        applySettings();
      },
      annotateByQuote: (quote, type, color, note, answer) => {
        const text = ui.article.textContent;
        const idx = text.indexOf(quote);
        if (idx < 0) return null;
        const ann = {
          id:
            "a" +
            Date.now().toString(36) +
            Math.random().toString(36).slice(2, 6),
          type: type || "highlight",
          color: color || "yellow",
          start: idx,
          end: idx + quote.length,
          quote,
          note: note || "",
          answer: answer || "",
          createdAt: Date.now(),
        };
        book.annotations = book.annotations || [];
        book.annotations.push(ann);
        applyAnnotations();
        renderSidebar();
        updateCounts();
        return ann;
      },
    };
})();
