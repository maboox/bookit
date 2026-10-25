# Changelog

## 2.0.1 — 2026-10-25

- Changed the default library shortcut to Ctrl+Shift+Y because Alt+Shift+B is
  reserved by Chromium browsers and was not registered.
- Added an installed-extension regression check for shortcut registration.
- Updated pinned checkout, setup-node and artifact GitHub Actions to current releases.

## 2.0.0 — 2026-10-25

- Rebuilt the bilingual library with a blue-and-white interface, dark mode,
  reading statistics, article previews, progress bars and bundled Lucide icons.
- Added a dedicated offline reader for saved articles and a separate original
  source link. Added the Alt+Shift+B library shortcut.
- Replaced automatic page access and dictionary scraping with explicit activation
  using `activeTab`; removed persistent host permissions.
- Adopted Mozilla Readability and DOMPurify. Re-sanitize saved and restored HTML,
  exclude active content and remote images, validate backup schemas and limit sizes.
- Fixed annotation dialog selectors, cancelled color edits, page navigation buttons,
  reading-position restoration, delayed-save callbacks, tag clearing, storage error
  reporting, theme indicators, annotation counts and keyboard input handling.
- Replaced fonts without documented redistribution rights with OFL Vazirmatn.
- Added regression tests, accessibility checks, dependency and secret scanning,
  package verification, bilingual documentation and a reproducible extension ZIP.
- Published a clean repository history without the previous personal commit email
  or undocumented font binaries. Earlier copies outside this repository may remain.
