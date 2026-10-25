/* Bookit — داشبورد: کتابخانه، جست‌وجو، تگ، مرتب‌سازی، پشتیبان‌گیری */
(() => {
  "use strict";

  const $ = (sel) => document.querySelector(sel);
  const Core = globalThis.BookitCore;
  const icon = (name) => globalThis.BookitIcons[name] || "";
  let lang = "fa";
  const PP = {
    heroTitle: ["وب را ورق بزن.", "A quieter corner of the web."],
    heroText: [
      "مقاله‌ها را نگه دار، با تمرکز بخوان و فکرهایت را کنار متن بنویس.",
      "Save something worth reading. Find your focus, and keep your thoughts close.",
    ],
    localLabel: ["کتابخانه شخصی شما", "YOUR PERSONAL READING SPACE"],
    booksLabel: ["مقاله ذخیره‌شده", "saved articles"],
    notesLabel: ["هایلایت و یادداشت", "highlights & notes"],
    privateLabel: ["بدون حساب کاربری", "no account needed"],
    privateWord: ["محلی", "Local"],
    offlineLabel: ["آماده مطالعه آفلاین", "Ready to read offline"],
    footer: [
      "با آرامش بخوان. با خودت نگه دار.",
      "Read at your pace. Keep it yours.",
    ],
    saveError: [
      "عملیات انجام نشد. فضای ذخیره‌سازی یا دسترسی به صفحه را بررسی و دوباره تلاش کنید.",
      "Could not complete the action. Check storage or page access and try again.",
    ],
    tabHint: [
      "برای افزودن مقاله، در صفحهٔ آن روی آیکون افزونه کلیک کنید.",
      "To add an article, click the extension icon on its page.",
    ],
    restoreConfirm: [
      "بازیابی، کتاب‌های هم‌نشانی و تنظیمات را جایگزین می‌کند؛ بقیهٔ کتاب‌ها باقی می‌مانند. ادامه؟",
      "Restore replaces books with the same address and settings; other books stay. Continue?",
    ],
    backupPrivacy: [
      "فایل پشتیبان شامل متن، نشانی مقاله‌ها و یادداشت‌های شخصی شماست؛ آن را خصوصی نگه دارید.",
      "Backups contain article text, source addresses and personal notes. Keep them private.",
    ],
    resumeLocal: ["مطالعه نسخه ذخیره‌شده", "Read saved copy"],
    sub: [
      "\u0645\u0637\u0627\u0644\u0639\u0647\u0654 \u06a9\u062a\u0627\u0628\u06cc \u0635\u0641\u062d\u0647\u200c\u0647\u0627\u06cc \u0648\u0628",
      "Read web pages like a book",
    ],
    myLibrary: [
      "\u06a9\u062a\u0627\u0628\u062e\u0627\u0646\u0647\u0654 \u0645\u0646",
      "My library",
    ],
    backup: [
      "\u067e\u0634\u062a\u06cc\u0628\u0627\u0646\u200c\u06af\u06cc\u0631\u06cc",
      "Backup",
    ],
    searchPh: [
      "\u062c\u0633\u062a\u200c\u0648\u062c\u0648 \u062f\u0631 \u0645\u062a\u0646 \u0647\u0645\u0647\u0654 \u06a9\u062a\u0627\u0628\u200c\u0647\u0627\u060c \u06cc\u0627\u062f\u062f\u0627\u0634\u062a\u200c\u0647\u0627 \u0648 \u062a\u06af\u200c\u0647\u0627\u2026",
      "Search all books, notes and tags\u2026",
    ],
    searchHint: [
      "\u0628\u0631\u0627\u06cc \u062c\u0633\u062a\u200c\u0648\u062c\u0648\u06cc \u0686\u0646\u062f\u06a9\u0644\u0645\u0647\u200c\u0627\u06cc (\u0648\u0644\u0648 \u062f\u0648\u0631 \u0627\u0632 \u0647\u0645)\u060c \u06a9\u0644\u0645\u0647\u200c\u0647\u0627 \u0631\u0627 \u0628\u0627 \u0648\u06cc\u0631\u06af\u0648\u0644 \u062c\u062f\u0627 \u06a9\u0646\u06cc\u062f: \u06a9\u0627\u063a\u0630\u060c \u0686\u06cc\u0646",
      "For AND search (words even far apart), separate them with commas: paper, china",
    ],
    sortNew: ["\u062c\u062f\u06cc\u062f\u062a\u0631\u06cc\u0646", "Newest"],
    sortOld: [
      "\u0642\u062f\u06cc\u0645\u06cc\u200c\u062a\u0631\u06cc\u0646",
      "Oldest",
    ],
    sortAlpha: ["\u0627\u0644\u0641\u0628\u0627", "A\u2013Z"],
    sortAnn: [
      "\u0628\u06cc\u0634\u062a\u0631\u06cc\u0646 \u06cc\u0627\u062f\u062f\u0627\u0634\u062a",
      "Most notes",
    ],
    all: ["\u0647\u0645\u0647", "All"],
    delTag: ["\u062d\u0630\u0641 \u062a\u06af", "Remove tag"],
    addTag: ["+ \u062a\u06af", "+ tag"],
    tagName: ["\u0646\u0627\u0645 \u062a\u06af\u2026", "Tag name\u2026"],
    emptySearch: [
      "\u0686\u06cc\u0632\u06cc \u0645\u0637\u0627\u0628\u0642 \u062c\u0633\u062a\u200c\u0648\u062c\u0648 \u06cc\u0627 \u062a\u06af \u0627\u0646\u062a\u062e\u0627\u0628\u06cc \u067e\u06cc\u062f\u0627 \u0646\u0634\u062f.",
      "Nothing matches your search or the selected tag.",
    ],
    emptyLib: [
      "\u0647\u0646\u0648\u0632 \u06a9\u062a\u0627\u0628\u06cc \u0630\u062e\u06cc\u0631\u0647 \u0646\u0634\u062f\u0647 \u0627\u0633\u062a. \u062f\u0631 \u0647\u0631 \u0635\u0641\u062d\u0647\u060c \u062f\u06a9\u0645\u0647\u0654 \u0628\u0627\u0644\u0627 \u0631\u0627 \u0628\u0632\u0646\u06cc\u062f \u062a\u0627 \u0646\u0633\u062e\u0647\u0654 \u06a9\u062a\u0627\u0628\u06cc \u0622\u0646 \u0630\u062e\u06cc\u0631\u0647 \u0634\u0648\u062f.",
      "No books saved yet. On any page, press the button above to save its book version.",
    ],
    noTitle: [
      "\u0628\u062f\u0648\u0646 \u0639\u0646\u0648\u0627\u0646",
      "Untitled",
    ],
    openPage: [
      "\u0628\u0627\u0632 \u06a9\u0631\u062f\u0646 \u0635\u0641\u062d\u0647",
      "Open page",
    ],
    delBook: ["\u062d\u0630\u0641 \u06a9\u062a\u0627\u0628", "Delete book"],
    confirmDel: [
      "\u0627\u06cc\u0646 \u06a9\u062a\u0627\u0628 \u0648 \u0647\u0645\u0647\u0654 \u06cc\u0627\u062f\u062f\u0627\u0634\u062a\u200c\u0647\u0627\u06cc\u0634 \u062d\u0630\u0641 \u0634\u0648\u062f\u061f",
      "Delete this book and all its notes?",
    ],
    annots: [
      "\u0647\u0627\u06cc\u0644\u0627\u06cc\u062a/\u06cc\u0627\u062f\u062f\u0627\u0634\u062a",
      "highlights/notes",
    ],
    readPct: [
      "\u066a \u062e\u0648\u0627\u0646\u062f\u0647\u200c\u0634\u062f\u0647",
      "% read",
    ],
    hitsInBook: [
      "\u0645\u0648\u0631\u062f \u062f\u0631 \u0627\u06cc\u0646 \u06a9\u062a\u0627\u0628",
      "matches in this book",
    ],
    noteLabel: ["\u06cc\u0627\u062f\u062f\u0627\u0634\u062a", "Note"],
    closeView: [
      "\u0628\u0633\u062a\u0646 \u0646\u0645\u0627\u06cc \u06a9\u062a\u0627\u0628\u06cc",
      "Close book view",
    ],
    resumeSaved: [
      "\u0627\u062f\u0627\u0645\u0647\u0654 \u0645\u0637\u0627\u0644\u0639\u0647 (\u0630\u062e\u06cc\u0631\u0647\u200c\u0634\u062f\u0647)",
      "Resume reading (saved)",
    ],
    showBook: [
      "\u0646\u0645\u0627\u06cc\u0634 \u0627\u06cc\u0646 \u0635\u0641\u062d\u0647 \u0628\u0647\u200c\u0635\u0648\u0631\u062a \u06a9\u062a\u0627\u0628",
      "Read this page as a book",
    ],
    savedHint: [
      "\u0646\u0633\u062e\u0647\u0654 \u06a9\u062a\u0627\u0628\u06cc \u0627\u06cc\u0646 \u0635\u0641\u062d\u0647 \u0631\u0648\u06cc \u062f\u0633\u062a\u06af\u0627\u0647 \u0634\u0645\u0627 \u0630\u062e\u06cc\u0631\u0647 \u0634\u062f\u0647 \u0627\u0633\u062a.",
      "A book version of this page is saved on your device.",
    ],
    notAvailable: [
      "\u062f\u0631 \u0627\u06cc\u0646 \u0635\u0641\u062d\u0647 \u062f\u0631 \u062f\u0633\u062a\u0631\u0633 \u0646\u06cc\u0633\u062a",
      "Not available on this page",
    ],
    refreshHint: [
      "\u0627\u06af\u0631 \u0627\u0641\u0632\u0648\u0646\u0647 \u0631\u0627 \u062a\u0627\u0632\u0647 \u0646\u0635\u0628 \u06cc\u0627 \u0628\u0647\u200c\u0631\u0648\u0632 \u06a9\u0631\u062f\u0647\u200c\u0627\u06cc\u062f\u060c \u0635\u0641\u062d\u0647 \u0631\u0627 \u06cc\u06a9\u200c\u0628\u0627\u0631 \u0646\u0648\u0633\u0627\u0632\u06cc (Refresh) \u06a9\u0646\u06cc\u062f.",
      "If you just installed or updated the extension, refresh the page once.",
    ],
    restoreOk: [
      "\u067e\u0634\u062a\u06cc\u0628\u0627\u0646 \u0628\u0627 \u0645\u0648\u0641\u0642\u06cc\u062a \u0628\u0627\u0632\u06cc\u0627\u0628\u06cc \u0634\u062f \u2713",
      "Backup restored successfully \u2713",
    ],
    restoreErr: [
      "\u0641\u0627\u06cc\u0644 \u067e\u0634\u062a\u06cc\u0628\u0627\u0646 \u0645\u0639\u062a\u0628\u0631 \u0646\u06cc\u0633\u062a.",
      "Invalid backup file.",
    ],
    exportBtn: [
      "\u062f\u0631\u06cc\u0627\u0641\u062a \u0641\u0627\u06cc\u0644 \u067e\u0634\u062a\u06cc\u0628\u0627\u0646",
      "Download backup file",
    ],
    importBtn: [
      "\u0628\u0627\u0632\u06cc\u0627\u0628\u06cc \u067e\u0634\u062a\u06cc\u0628\u0627\u0646",
      "Restore backup",
    ],
    backupHint: [
      "\u0647\u0645\u0647\u0654 \u062f\u0627\u062f\u0647\u200c\u0647\u0627 \u0641\u0642\u0637 \u0631\u0648\u06cc \u0647\u0645\u06cc\u0646 \u062f\u0633\u062a\u06af\u0627\u0647 \u0630\u062e\u06cc\u0631\u0647 \u0645\u06cc\u200c\u0634\u0648\u0646\u062f.",
      "All data is stored only on this device.",
    ],
    themeT: [
      "\u062a\u0645 \u0631\u0648\u0634\u0646/\u062a\u0627\u0631\u06cc\u06a9",
      "Light/dark theme",
    ],
    sizeT: [
      "\u0628\u0632\u0631\u06af/\u06a9\u0648\u0686\u06a9 \u06a9\u0631\u062f\u0646 \u067e\u0646\u062c\u0631\u0647",
      "Resize window",
    ],
    fullT: [
      "\u0628\u0627\u0632 \u06a9\u0631\u062f\u0646 \u062f\u0631 \u062a\u0628 \u062c\u062f\u0627 (\u062a\u0645\u0627\u0645\u200c\u0635\u0641\u062d\u0647)",
      "Open in a separate tab (full page)",
    ],
    langT: ["English", "\u0641\u0627\u0631\u0633\u06cc"],
    saveLib: [
      "\u0630\u062e\u06cc\u0631\u0647 \u062f\u0631 \u06a9\u062a\u0627\u0628\u062e\u0627\u0646\u0647",
      "Save to library",
    ],
    saveTagsPh: [
      "\u062a\u06af/\u067e\u0648\u0634\u0647 (\u0627\u062e\u062a\u06cc\u0627\u0631\u06cc\u060c \u0628\u0627 \u0648\u06cc\u0631\u06af\u0648\u0644)",
      "Tags/folder (optional, commas)",
    ],
  };
  const tp = (k) => {
    const v = PP[k];
    return v ? (lang === "en" ? v[1] : v[0]) : k;
  };
  const faNum = (n) =>
    Number(n).toLocaleString(lang === "en" ? "en-US" : "fa-IR");
  const faDate = (ts) =>
    new Date(ts || Date.now()).toLocaleDateString(
      lang === "en" ? "en-US" : "fa-IR",
      { year: "numeric", month: "long", day: "numeric" },
    );

  /* ---------- نرمال‌سازی فارسی برای جست‌وجو ---------- */

  const FA_MAP = {
    "\u064a": "\u06cc",
    "\u0649": "\u06cc",
    "\u0626": "\u06cc",
    "\u0643": "\u06a9",
    "\u0624": "\u0648",
    "\u0623": "\u0627",
    "\u0625": "\u0627",
    "\u0671": "\u0627",
    "\u0622": "\u0627",
    "\u0629": "\u0647",
    "\u06c0": "\u0647",
  };
  function faNormChar(ch) {
    const code = ch.charCodeAt(0);
    if (code >= 0x064b && code <= 0x065f) return ""; // اعراب (فتحه، کسره، تشدید، تنوین و …)
    if (code === 0x0670 || code === 0x0640) return ""; // الف خنجری، کشیده
    if (code === 0x200c || code === 0x200d || code === 0xfeff) return ""; // نیم‌فاصله
    if (FA_MAP[ch]) return FA_MAP[ch];
    if (code >= 0x06f0 && code <= 0x06f9) return String(code - 0x06f0); // ۰-۹
    if (code >= 0x0660 && code <= 0x0669) return String(code - 0x0660); // ٠-٩
    return ch.toLowerCase();
  }
  function faNormalize(str) {
    const out = [];
    const map = [];
    for (let i = 0; i < str.length; i++) {
      const n = faNormChar(str[i]);
      for (const c of n) {
        out.push(c);
        map.push(i);
      }
    }
    return { text: out.join(""), map };
  }
  const faNorm = (str) => faNormalize(str || "").text;

  function bookText(b) {
    if (b.text) return b.text;
    if (!b._plain && b.html) {
      b._plain = b.html
        .replace(/<[^>]+>/g, " ")
        .replace(/&nbsp;/g, " ")
        .replace(/\s+/g, " ")
        .trim();
    }
    return b._plain || "";
  }

  function pushSnippet(hit, raw, f, len, map, label) {
    if (hit.snippets.length >= 3) return;
    const s0 = map[f];
    const e0 = map[Math.min(f + len - 1, map.length - 1)] + 1;
    const pre = raw.slice(Math.max(0, s0 - 45), s0);
    const post = raw.slice(e0, e0 + 45);
    hit.snippets.push({
      label: label || "",
      pre: (s0 > 45 ? "\u2026" : "") + pre,
      m: raw.slice(s0, e0),
      post: post + (e0 + 45 < raw.length ? "\u2026" : ""),
    });
  }

  function matchTerm(b, nq) {
    const hit = { count: 0, snippets: [], title: false, tags: [] };
    if (faNorm(b.title).includes(nq) || faNorm(hostOf(b.url)).includes(nq))
      hit.title = true;
    (b.tags || []).forEach((t) => {
      if (faNorm(t).includes(nq)) hit.tags.push(t);
    });
    const raw = bookText(b);
    if (raw) {
      const { text, map } = faNormalize(raw);
      let idx = 0;
      while (hit.count < 200) {
        const f = text.indexOf(nq, idx);
        if (f < 0) break;
        hit.count++;
        if (hit.snippets.length < 2)
          pushSnippet(hit, raw, f, nq.length, map, "");
        idx = f + Math.max(nq.length, 1);
      }
    }
    for (const a of b.annotations || []) {
      if (typeof a !== "object" || !a) continue;
      for (const field of [a.note, a.question, a.answer, a.quote]) {
        if (!field) continue;
        const { text, map } = faNormalize(field);
        const f = text.indexOf(nq);
        if (f >= 0) {
          hit.count++;
          pushSnippet(hit, field, f, nq.length, map, tp("noteLabel"));
          break;
        }
      }
    }
    return hit.title || hit.tags.length || hit.count ? hit : null;
  }

  function matchBook(b, rawQ) {
    // جست‌وجوی AND: کلمه‌ها را با ویرگول (، یا ,) جدا کنید؛ همه باید در کتاب باشند
    const terms = rawQ
      .split(/[,\u060c]+/)
      .map((t) => faNorm(t.trim()))
      .filter(Boolean);
    if (!terms.length) return null;
    const total = { count: 0, snippets: [], title: false, tags: [] };
    for (const nq of terms) {
      const hit = matchTerm(b, nq);
      if (!hit) return null; // یکی از کلمه‌ها نبود ← کتاب حذف
      total.count += hit.count;
      total.title = total.title || hit.title;
      for (const t of hit.tags) if (!total.tags.includes(t)) total.tags.push(t);
      for (const s of hit.snippets)
        if (total.snippets.length < 4) total.snippets.push(s);
    }
    return total;
  }

  const state = { all: {}, query: "", sort: "new", tag: null };
  const bookCache = new WeakMap();

  function getAll() {
    return chrome.storage.local.get(null);
  }
  function setKey(key, value) {
    return chrome.storage.local.set({ [key]: value });
  }
  function removeKey(key) {
    return chrome.storage.local.remove(key);
  }

  function books() {
    return Object.entries(state.all)
      .filter(([k, v]) => k.startsWith("book:") && v && v.html)
      .flatMap(([key, b]) => {
        try {
          if (!bookCache.has(b)) bookCache.set(b, Core.normalizeBook(b));
          return [{ ...bookCache.get(b), key }];
        } catch {
          return [];
        }
      });
  }

  function hostOf(url) {
    try {
      return new URL(url).hostname.replace(/^www\./, "");
    } catch (e) {
      return "";
    }
  }

  function visibleBooks() {
    let list = books();
    const q = state.query.trim();
    if (q) {
      list = list.filter((b) => {
        b._hit = matchBook(b, q);
        return !!b._hit;
      });
    } else {
      list.forEach((b) => {
        b._hit = null;
      });
    }
    if (state.tag)
      list = list.filter((b) => (b.tags || []).includes(state.tag));
    const by = {
      new: (a, b) => (b.savedAt || 0) - (a.savedAt || 0),
      old: (a, b) => (a.savedAt || 0) - (b.savedAt || 0),
      alpha: (a, b) => (a.title || "").localeCompare(b.title || "", "fa"),
      ann: (a, b) =>
        (b.annotations || []).length - (a.annotations || []).length,
    };
    return list.sort(by[state.sort] || by.new);
  }

  function allTags() {
    const set = new Set();
    books().forEach((b) => (b.tags || []).forEach((t) => set.add(t)));
    return Array.from(set).sort((a, b) => a.localeCompare(b, "fa"));
  }

  /* ---------- رندر ---------- */

  function renderTagBar() {
    const bar = $("#tagFilters");
    bar.textContent = "";
    const tags = allTags();
    if (!tags.length) return;
    const mk = (label, value) => {
      const c = document.createElement("button");
      c.className = "tag-chip";
      c.textContent = label;
      c.dataset.on =
        state.tag === value || (!state.tag && value === null) ? "1" : "0";
      c.onclick = () => {
        state.tag = value;
        render();
      };
      return c;
    };
    bar.appendChild(mk(tp("all"), null));
    tags.forEach((t) => bar.appendChild(mk(t, t)));
  }

  async function saveTags(book) {
    const { key, ...data } = book;
    const current = (await chrome.storage.local.get(key))[key];
    if (!current) return;
    await setKey(key, { ...current, tags: Core.tags(data.tags) });
    state.all[key] = data;
  }

  function renderTagRow(book, container) {
    container.textContent = "";
    (book.tags || []).forEach((t) => {
      const chip = document.createElement("span");
      chip.className = "btag";
      chip.textContent = t;
      const x = document.createElement("button");
      x.textContent = "✕";
      x.title = tp("delTag");
      x.setAttribute("aria-label", tp("delTag") + ": " + t);
      x.onclick = async () => {
        book.tags = (book.tags || []).filter((v) => v !== t);
        await saveTags(book);
        render();
      };
      chip.appendChild(x);
      container.appendChild(chip);
    });
    const add = document.createElement("button");
    add.className = "addtag";
    add.textContent = tp("addTag");
    add.onclick = () => {
      const input = document.createElement("input");
      input.className = "taginput";
      input.placeholder = tp("tagName");
      container.replaceChild(input, add);
      input.focus();
      let committed = false;
      const commit = async () => {
        if (committed) return;
        committed = true;
        const v = input.value.trim();
        if (v) {
          book.tags = book.tags || [];
          if (!book.tags.includes(v)) book.tags.push(v.slice(0, 50));
          await saveTags(book);
        }
        render();
      };
      input.onkeydown = (e) => {
        if (e.key === "Enter") commit();
        if (e.key === "Escape") render();
      };
      input.onblur = commit;
    };
    container.appendChild(add);
  }

  function renderLibrary() {
    const lib = $("#library");
    lib.textContent = "";
    const list = visibleBooks();
    $("#libCount").textContent = list.length
      ? "(" + faNum(list.length) + ")"
      : "";
    if (!list.length) {
      const p = document.createElement("p");
      p.className = "empty";
      p.innerHTML = icon("book-open");
      p.append(books().length ? tp("emptySearch") : tp("emptyLib"));
      lib.appendChild(p);
      return;
    }
    for (const b of list) {
      const card = document.createElement("div");
      card.className = "book";

      const row = document.createElement("div");
      row.className = "brow";
      const title = document.createElement("button");
      title.className = "btitle";
      title.textContent = b.title || tp("noTitle");
      title.title = tp("resumeLocal");
      title.onclick = () =>
        chrome.tabs.create({
          url:
            chrome.runtime.getURL("reader/reader.html") +
            "?key=" +
            encodeURIComponent(b.key),
        });
      const del = document.createElement("button");
      del.className = "bicon del";
      del.innerHTML = icon("trash-2");
      del.title = tp("delBook");
      del.onclick = async () => {
        if (!confirm(tp("confirmDel"))) return;
        await removeKey(b.key);
        delete state.all[b.key];
        render();
      };
      const symbol = document.createElement("span");
      symbol.className = "book-symbol";
      symbol.innerHTML = icon("file-text");
      row.append(symbol);
      row.appendChild(title);
      const source = document.createElement("a");
      source.className = "bicon";
      source.href = b.url;
      source.target = "_blank";
      source.rel = "noopener noreferrer";
      source.title = tp("openPage");
      source.setAttribute("aria-label", source.title);
      source.innerHTML = icon("arrow-up-right");
      row.append(source);
      row.appendChild(del);
      card.appendChild(row);

      const meta = document.createElement("div");
      meta.className = "bmeta";
      const annCount = (b.annotations || []).length;
      const bits = [hostOf(b.url), faDate(b.savedAt)];
      if (annCount) bits.push(faNum(annCount) + " " + tp("annots"));
      if (b.progress) bits.push(faNum(b.progress) + tp("readPct"));
      meta.textContent = bits.filter(Boolean).join(" · ");
      card.appendChild(meta);
      const excerpt = document.createElement("p");
      excerpt.className = "excerpt";
      excerpt.textContent = b.text.slice(0, 240);
      card.append(excerpt);

      if (b._hit && b._hit.count) {
        const sn = document.createElement("div");
        sn.className = "snips";
        for (const sni of b._hit.snippets) {
          const line = document.createElement("p");
          line.className = "snip";
          if (sni.label) {
            const lb = document.createElement("span");
            lb.className = "sniplabel";
            lb.textContent = sni.label + ": ";
            line.appendChild(lb);
          }
          line.append(sni.pre);
          const mk = document.createElement("mark");
          mk.textContent = sni.m;
          line.appendChild(mk);
          line.append(sni.post);
          sn.appendChild(line);
        }
        const cnt = document.createElement("p");
        cnt.className = "snipcount";
        cnt.textContent = faNum(b._hit.count) + " " + tp("hitsInBook");
        sn.appendChild(cnt);
        card.appendChild(sn);
      }

      const tagRow = document.createElement("div");
      tagRow.className = "btags";
      renderTagRow(b, tagRow);
      card.appendChild(tagRow);

      const track = document.createElement("div");
      track.className = "reading-track";
      track.title = faNum(b.progress) + tp("readPct");
      const fill = document.createElement("span");
      fill.style.width = b.progress + "%";
      track.append(fill);
      card.append(track);
      lib.appendChild(card);
    }
  }

  function render() {
    const all = books();
    $("#statBooks").textContent = faNum(all.length);
    $("#statNotes").textContent = faNum(
      all.reduce((n, b) => n + b.annotations.length, 0),
    );
    renderTagBar();
    renderLibrary();
  }

  /* ---------- وضعیت صفحهٔ فعلی ---------- */

  async function currentTab() {
    const [tab] = await chrome.tabs.query({
      active: true,
      currentWindow: true,
    });
    if (!tab?.id || !Core.safeUrl(tab.url) || isTab)
      throw new Error("Unsupported page");
    return tab;
  }
  async function ensureReader() {
    const tab = await currentTab();
    try {
      const response = await chrome.tabs.sendMessage(tab.id, {
        type: "kk-state",
      });
      if (response?.ok) return tab;
    } catch {
      /* Inject only after an explicit action. */
    }
    await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      files: [
        "vendor/purify.min.js",
        "vendor/Readability.js",
        "shared/core.js",
        "shared/icons.js",
        "content/reader.js",
      ],
    });
    return tab;
  }
  async function refreshState() {
    const btn = $("#toggle");
    $("#saveRow").hidden = true;
    try {
      const tab = await currentTab();
      btn.disabled = false;
      btn.textContent = tp("showBook");
      $("#pageStatus").textContent = new URL(tab.url).hostname;
      try {
        const res = await chrome.tabs.sendMessage(tab.id, { type: "kk-state" });
        if (res?.open) btn.textContent = tp("closeView");
      } catch {
        /* Not yet activated. */
      }
      $("#saveRow").hidden = false;
    } catch {
      btn.disabled = true;
      btn.textContent = tp("notAvailable");
      $("#pageStatus").textContent = tp("tabHint");
    }
  }
  $("#toggle").onclick = async () => {
    $("#toggle").disabled = true;
    try {
      const tab = await ensureReader();
      const res = await chrome.tabs.sendMessage(tab.id, { type: "kk-toggle" });
      if (!res?.ok) throw Error("Reader failed");
      window.close();
    } catch {
      showMsg("err", tp("saveError"));
      await refreshState();
    }
  };
  $("#saveBtn").onclick = async () => {
    $("#saveBtn").disabled = true;
    try {
      const tab = await ensureReader();
      const tags = Core.tags($("#saveTags").value.split(/[,،]+/));
      const res = await chrome.tabs.sendMessage(tab.id, {
        type: "kk-save",
        tags,
      });
      if (!res?.ok) throw Error("Save failed");
      state.all = await getAll();
      render();
      await refreshState();
      showMsg("ok", tp("savedHint"));
    } catch {
      showMsg("err", tp("saveError"));
    } finally {
      $("#saveBtn").disabled = false;
    }
  };

  /* ---------- جست‌وجو و مرتب‌سازی ---------- */

  $("#search").oninput = (e) => {
    state.query = e.target.value;
    renderLibrary();
  };
  $("#sort").onchange = (e) => {
    state.sort = e.target.value;
    renderLibrary();
  };

  /* ---------- پشتیبان‌گیری ---------- */

  function showMsg(kind, text) {
    $("#message").dataset.kind = kind;
    $("#message").textContent = text;
  }
  $("#export").onclick = async () => {
    try {
      const all = await getAll();
      const data = Core.parseBackup(all);
      const payload = {
        app: "bookit",
        version: 2,
        exportedAt: new Date().toISOString(),
        data,
      };
      const url = URL.createObjectURL(
        new Blob([JSON.stringify(payload, null, 2)], {
          type: "application/json",
        }),
      );
      const a = document.createElement("a");
      a.href = url;
      a.download =
        "bookit-backup-" + new Date().toISOString().slice(0, 10) + ".json";
      a.click();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
      showMsg("ok", tp("backupPrivacy"));
    } catch {
      showMsg("err", tp("saveError"));
    }
  };
  $("#importBtn").onclick = () => $("#importFile").click();
  $("#importFile").onchange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      if (file.size > Core.MAX_BACKUP) throw Error("Too large");
      const data = Core.parseBackup(JSON.parse(await file.text()));
      if (!confirm(tp("restoreConfirm"))) return;
      await chrome.storage.local.set(data);
      state.all = await getAll();
      lang = Core.settings(state.all["kk:settings"]).lang;
      applyLang();
      render();
      showMsg("ok", tp("restoreOk"));
    } catch {
      showMsg("err", tp("restoreErr") + " " + tp("saveError"));
    } finally {
      e.target.value = "";
    }
  };

  /* ---------- تنظیمات نما: تم و اندازه ---------- */

  const PREFS_KEY = "kk:popupPrefs";
  let prefs = { theme: "light", big: false };
  const isTab = new URLSearchParams(location.search).has("tab");

  function applyLang() {
    document.documentElement.dir = lang === "en" ? "ltr" : "rtl";
    document.documentElement.lang = lang === "en" ? "en" : "fa";
    if (document.body)
      document.body.style.direction = lang === "en" ? "ltr" : "rtl";
    const set = (sel, txt) => {
      const n = $(sel);
      if (n) n.textContent = txt;
    };

    set(".sub", tp("sub"));
    for (const [id, key] of Object.entries({
      heroTitle: "heroTitle",
      heroText: "heroText",
      localLabel: "localLabel",
      statBooksLabel: "booksLabel",
      statNotesLabel: "notesLabel",
      statPrivate: "privateWord",
      statPrivateLabel: "privateLabel",
      offlineLabel: "offlineLabel",
      footerText: "footer",
      libraryTitle: "myLibrary",
      backupTitle: "backup",
    }))
      set("#" + id, tp(key));

    if ($("#search")) $("#search").placeholder = tp("searchPh");
    set(".searchhint", tp("searchHint"));
    const so = $("#sort");
    if (so) {
      const L = [tp("sortNew"), tp("sortOld"), tp("sortAlpha"), tp("sortAnn")];
      Array.prototype.forEach.call(so.options, (o, i) => {
        if (L[i]) o.textContent = L[i];
      });
    }
    set("#export", tp("exportBtn"));
    set("#importBtn", tp("importBtn"));
    set("#backupHint", tp("backupPrivacy"));
    $("#search").setAttribute("aria-label", tp("searchPh"));
    $("#sort").setAttribute(
      "aria-label",
      lang === "en" ? "Sort library" : "مرتب‌سازی کتابخانه",
    );
    $("#saveTags").setAttribute("aria-label", tp("saveTagsPh"));
    for (const [id, name] of [
      ["export", "download"],
      ["importBtn", "upload"],
    ])
      $("#" + id).insertAdjacentHTML("afterbegin", icon(name));
    document
      .querySelectorAll("button[title]")
      .forEach((n) => n.setAttribute("aria-label", n.title));
    if ($("#themeBtn")) $("#themeBtn").title = tp("themeT");
    if ($("#sizeBtn")) $("#sizeBtn").title = tp("sizeT");
    if ($("#fullBtn")) $("#fullBtn").title = tp("fullT");
    if ($("#saveBtn")) $("#saveBtn").textContent = tp("saveLib");
    if ($("#saveTags")) $("#saveTags").placeholder = tp("saveTagsPh");
    if ($("#langBtn")) {
      $("#langBtn").textContent = lang === "en" ? "\u0641\u0627" : "EN";
      $("#langBtn").title = $("#langBtn").textContent + " · " + tp("langT");
      $("#langBtn").setAttribute("aria-label", $("#langBtn").title);
    }
  }

  function applyPrefs() {
    document.body.dataset.theme = prefs.theme === "dark" ? "dark" : "light";
    document.body.classList.toggle("big", !!prefs.big && !isTab);
    document.body.classList.toggle("page", isTab);
    const t = $("#themeBtn");
    if (t) t.innerHTML = icon(prefs.theme === "dark" ? "sun" : "moon");
    const s = $("#sizeBtn");
    if (s) {
      s.innerHTML = icon(prefs.big ? "minimize-2" : "maximize-2");
      s.hidden = isTab;
    }
    const f = $("#fullBtn");
    if (f) f.hidden = isTab;
  }
  function savePrefs() {
    chrome.storage.local
      .set({ [PREFS_KEY]: prefs })
      .catch(() => showMsg("err", tp("saveError")));
  }
  if ($("#langBtn"))
    $("#langBtn").onclick = () => {
      lang = lang === "en" ? "fa" : "en";
      const sNow = Object.assign({}, state.all["kk:settings"] || {}, { lang });
      state.all["kk:settings"] = sNow;
      chrome.storage.local
        .set({ "kk:settings": Core.settings(sNow) })
        .catch(() => showMsg("err", tp("saveError")));
      applyLang();
      render();
      refreshState();
    };
  if ($("#themeBtn"))
    $("#themeBtn").onclick = () => {
      prefs.theme = prefs.theme === "dark" ? "light" : "dark";
      applyPrefs();
      savePrefs();
    };
  if ($("#sizeBtn"))
    $("#sizeBtn").onclick = () => {
      prefs.big = !prefs.big;
      applyPrefs();
      savePrefs();
    };
  if ($("#fullBtn"))
    $("#fullBtn").onclick = () => {
      const url =
        chrome.runtime && chrome.runtime.getURL
          ? chrome.runtime.getURL("popup/popup.html") + "?tab=1"
          : "popup.html?tab=1";
      try {
        chrome.tabs.create({ url });
        window.close();
      } catch (e) {
        window.open(url);
      }
    };

  /* ---------- شروع ---------- */

  (async () => {
    state.all = await getAll();
    if (state.all[PREFS_KEY] && typeof state.all[PREFS_KEY] === "object")
      prefs = Object.assign(prefs, state.all[PREFS_KEY]);
    const st0 = state.all["kk:settings"];
    if (st0) lang = Core.settings(st0).lang;
    document
      .querySelectorAll("[data-icon]")
      .forEach((n) => (n.innerHTML = icon(n.dataset.icon)));
    applyLang();
    applyPrefs();
    render();
    refreshState();
  })().catch(() => showMsg("err", tp("saveError")));
  window.addEventListener("unhandledrejection", (e) => {
    e.preventDefault();
    showMsg("err", tp("saveError"));
  });
  chrome.storage.onChanged.addListener((changes, area) => {
    if (area === "local")
      getAll()
        .then((all) => {
          state.all = all;
          render();
        })
        .catch(() => showMsg("err", tp("saveError")));
  });
})();
