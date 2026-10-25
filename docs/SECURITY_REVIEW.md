# Security and privacy review — 2026-10-25

Scope: committed application code, the two original reachable commits, extension
permissions, backup handling, rendering, font redistribution and release packaging.
This is a code review with automated checks, not an independent penetration test.

| Finding                                                             | Resolution                                                                                         |
| ------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------- |
| Unvalidated JSON written directly to extension storage              | Whole-file schema validation, bounded data, allowed namespaces and version checks before one write |
| Stored HTML trusted on later renders                                | DOMPurify allowlist at extraction, restore and render; unsafe URL schemes blocked                  |
| External images and active markup                                   | No images, scripts, embeds, styles or event attributes in saved content                            |
| Permanent content scripts on all HTTP(S) pages                      | Explicit activation with `activeTab` and `scripting`; no host permission                           |
| Dictionary lookup sent selected text to a server                    | Explicit external links only; no automatic lookup or dictionary host access                        |
| Open shadow root exposed on-page annotations to host DOM inspection | Closed on-page root; extension-owned reader for saved articles                                     |
| Storage callback errors ignored                                     | Promise rejection handling and visible failure messages                                            |
| Unsafe imported IDs interpolated into selectors                     | Normalized annotation IDs and value comparison rather than selector interpolation                  |
| Arbitrary restored preferences inserted into UI templates           | Enum, numeric and boolean validation                                                               |
| Personal email in commit author metadata                            | Replaced publication history with a clean contributor identity                                     |
| Font binaries without documented redistribution terms               | Removed from published tree/history; OFL fonts with license included                               |

Gitleaks scanned the two original commits with redacted output and found no
credential matches. This does not prove that secrets or personal information were
never present. Original commits included a personal author email. No real user
library, exported backup, credential file or personal article fixture is included
in the published tree. Demo screenshots contain generated example.org content.

Publication uses a clean root commit after a private local backup. This removes
the old commits from advertised branches; it does not erase existing clones,
GitHub caches, forks or objects still accessible by old SHA. If an actual secret
is ever discovered, revoke it and follow the host's sensitive-data removal process.

Checks cover hostile HTML and URL schemes, malformed/legacy/future backups,
annotation edits, pagination, persisted progress, offline extension rendering,
export/import and serious accessibility violations. Dependency advisories are
checked with `npm audit`; CI also runs CodeQL and Gitleaks. Re-run these checks
for every release. See [PRIVACY.md](../PRIVACY.md) for local-data and host-page
boundaries, quota and concurrent-edit limitations.
