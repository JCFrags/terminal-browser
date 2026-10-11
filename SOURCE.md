# Source lineage

The maintained source is [JCFrags/terminal-browser](https://github.com/JCFrags/terminal-browser).
This repository contains Terminal Browser with pinned AgentCursor integration,
not a Herdr fork or unrelated web research tools.

## Standalone extraction

The initial files came from the `vendor/terminal-browser` directory in
[JCFrags/my-shtty-pi at dff5e151983b2737ee64c78e4a54048ea09138af](https://github.com/JCFrags/my-shtty-pi/tree/dff5e151983b2737ee64c78e4a54048ea09138af/vendor/terminal-browser).
Its Git tree object is `afa521b18a3cc03fe18cffe054778ffee057cc88`.
All 401 files from that directory were retained. Standalone repository instructions,
build/release workflows, and later changes are recorded in this repository's Git
history. The old repository's history was not rewritten.

`copy-provenance.json` is the unchanged historical receipt from the extracted
component. It describes the earlier browser-only import from
[JCFrags/my-shtty-pi-web at 19c33769a33edddd066b3bac291ce371d2c1aba9](https://github.com/JCFrags/my-shtty-pi-web/tree/19c33769a33edddd066b3bac291ce371d2c1aba9)
and changes maintained before extraction. Its per-file hashes do not describe
later standalone changes. Do not regenerate it from this repository.

Git records subsequent source changes. Release `build-manifest.json` files record
the source commit, dirty state, source-input digest, pinned inputs, and complete
runtime inventory. Provenance does not prove installation or loaded activation.

## External inputs and licenses

- Upstream browser: [zenbu-labs/terminal-browser](https://github.com/zenbu-labs/terminal-browser).
- AgentCursor, patched Electron, and blocking inputs: [upstreams.lock.json](upstreams.lock.json).
- Browser license: [LICENSE](LICENSE).
- Font license: [assets/fonts/LICENSE.txt](assets/fonts/LICENSE.txt).
- Dependency notices: [assets/licenses/](assets/licenses/).

Complete artifacts also contain collected Node and Rust license notices and
Electron's `LICENSE` and `LICENSES.chromium.html`. Pi and Herdr are optional host
integrations, not bundled host applications.
