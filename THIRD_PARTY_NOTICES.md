# Third-party notices

All runtime dependencies are bundled locally; none are loaded from a CDN.
Exact versions and integrity hashes are locked in `package-lock.json`.

| Component                                                                       | Purpose                         | License           | Included license                                                            |
| ------------------------------------------------------------------------------- | ------------------------------- | ----------------- | --------------------------------------------------------------------------- |
| [Mozilla Readability](https://github.com/mozilla/readability) 0.6.0             | Article extraction              | Apache-2.0        | `vendor/Readability.LICENSE`, `vendor/DOMPurify.LICENSE` (full Apache text) |
| [DOMPurify](https://github.com/cure53/DOMPurify) 3.4.17                         | HTML sanitization               | Apache-2.0 option | `vendor/DOMPurify.LICENSE`                                                  |
| [Vazirmatn](https://github.com/rastikerdar/vazirmatn), Fontsource package 5.3.0 | Arabic and Latin variable fonts | SIL OFL-1.1       | `fonts/OFL.txt`                                                             |
| [Lucide](https://lucide.dev), lucide-static 1.61.0                              | Selected interface icons        | ISC               | `vendor/Lucide.LICENSE`                                                     |

The former Dana and B-series font binaries were removed because their
redistribution terms were not documented in this repository. System fonts are
referenced by family name and are not redistributed. The Bookit application code
is MIT licensed. Third-party components retain their own copyright and licenses.

Run `npm run vendor` after updating dependencies. This regenerates selected icons,
copies fonts and libraries with license files, and records SHA-256 checksums in
`vendor/checksums.json`. `npm run package` rejects modified vendored files.
