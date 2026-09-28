# Level 2 frontend asset provenance

The frontend's decorative cat artwork is an original, static SVG at
`public/cat-club.svg`, authored for Cat Bluff in this repository. It depicts two
cats with decorative face-down playing cards. It is not a photograph, external
stock asset, scraped image, or representation of the private card. Source
inspection found only SVG drawing elements and fixed color/path values, with no
script, remote image reference or private data. Its colors and shapes may be
changed without altering the contract or the hidden card.

No private rank, salt, role capability, wallet seed or encrypted demo package is
encoded in the illustration, asset name, source text, alt text or URL. Decorative
art must be independent of the actual private opening. The application must keep
the private opening inside the in-memory witness path only.

The optional click sound in `src/web/App.tsx` is synthesized locally by Web
Audio: a 440 Hz sine oscillator runs for 0.1 second after the user enables
sound. The default state is muted, and the audio function receives no witness
input. There is no audio download, recording, third-party sound file, or network
request for this effect.

Typography requests DM Sans from Google Fonts with a system-font fallback.
Only the fixed font stylesheet URL is requested; it contains no private input.
Google Fonts can see ordinary network metadata. No analytics are installed.

The public `managed/cat-bluff/` generated JavaScript, prover/verifier keys and
binary circuit IR are produced by the pinned Midnight Compact toolchain. They
are functional program artifacts, with provenance checked against
[`deployment.json`](evidence/deployment.json) and the generated verifier hashes
by `scripts/copy-web-artifacts.mjs`. Their inclusion in `public/zk/` is required
for browser compilation/proving. They contain no local wallet seed or private
demo opening. Preserve the repository's source and generated license notices.

Before a live deployment, inspect `dist/` and its manifest, verify `cat-club.svg`
and each public circuit file are served as their actual contents, and confirm no
`.private/` file or encrypted package entered the static output.
