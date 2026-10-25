# Architecture

Bookit is a Manifest V3 Chromium extension, with no backend and no build required
to run its committed files.

| Area                | Responsibility                                                         |
| ------------------- | ---------------------------------------------------------------------- |
| `popup/`            | Bilingual library, search, tags, explicit page activation and backups  |
| `content/`          | Readability extraction, safe on-page reader, selection and annotations |
| `reader/`           | Extension-owned offline reader loading a selected storage key          |
| `shared/core.js`    | URL, HTML, settings, annotation and backup validation                  |
| `shared/icons.js`   | Generated subset of Lucide SVG icons                                   |
| `background.js`     | Keyboard shortcut to the library; no network activity                  |
| `vendor/`, `fonts/` | Locally bundled dependencies and license files                         |
| `scripts/`          | Dependency vendoring and allowlisted, reproducible ZIP creation        |
| `tests/`            | Browser, installed-extension, hostile input and accessibility tests    |

The popup injects the reader only after Read or Save is clicked. Scripts run in
Chromium's isolated world. The page URL, HTML and metadata are sanitized, then the
reader is rendered in a shadow root. Read mode alone does not store an article;
Save to library or adding an annotation does. Existing saved books resume their
local copy. Selecting a library card opens `reader/reader.html` with its key.
This page reuses the reader and never depends on the source server being online.

Storage keys retain the legacy `book:`, `kk:settings` and `kk:popupPrefs` namespaces
so older libraries can still be read. Books use `v:2` and backups use
`{app:"bookit", version:2, data:{...}}`. Version-1 Bookit/Ketabkhan envelopes and raw
legacy storage objects are validated and migrated on restore. Unknown namespaces,
future backup versions and malformed records are rejected before any write.
Restores merge storage keys; a normalized URL collision replaces that book.

Annotations anchor to text offsets plus the quoted text. Re-extraction falls back
to searching the quote if offsets change; unmatched annotations remain listed as
orphaned. For repeated identical quotes, fallback picks the first occurrence.
Backups cap at 8 MiB, article HTML at 1.5 million characters, annotations at 2,000
per book, note/answer fields at 20,000 characters and tags at 30 per book.

Known limits: the last save wins if the same book is edited in several readers;
there is no cross-window collaborative merge. Very large or unusual pages may use
the heuristic extraction fallback. Browser settings pages, web stores, PDF viewers
and browser-managed pages cannot reliably be extracted. Remote media is intentionally
excluded; a saved copy contains readable text, not a full archival website.
