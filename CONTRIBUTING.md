# Contributing to Bookit

Use Node.js 22 or later. Install dependencies with `npm ci --ignore-scripts`,
then `npx playwright install chromium` and `npm run check`. Load this directory
as an unpacked extension for manual testing. No build is needed to use the
committed extension. `npm run vendor` updates bundled dependencies after a deliberate
package upgrade; commit its output and checksum changes together.

- Keep Persian and English strings together and verify both RTL and LTR layouts.
- Use logical CSS properties, accessible names and visible keyboard focus.
- Keep runtime resources offline and preserve the permission budget.
- Treat source HTML, restored JSON, annotations and existing local storage as
  untrusted. Go through `shared/core.js` before rendering.
- Add regression coverage for changes to storage, extraction, sanitization or
  annotation behavior. Do not commit real personal libraries or browsing data.
- Open a focused pull request describing the trigger, resulting behavior and
  tests. Use English commit messages. Never commit generated browser profiles,
  local credentials, signing keys, logs or backup JSON.

`npm test` runs sanitizer tests, reader interaction tests, and tests of an actual
installed extension. `PLAYWRIGHT_CHANNEL=chrome` can select an installed Chrome for
the first two suites. For extension tests use bundled Chromium or set
`EXTENSION_CHANNEL=msedge`; recent branded Chrome releases may restrict unpacked
extension loading from the command line. Profiles are written only to ignored
`artifacts/test-profile-*` directories. Screenshots use fictional example.org data.

Architecture and known constraints are documented in
[docs/ARCHITECTURE.md](docs/ARCHITECTURE.md).
