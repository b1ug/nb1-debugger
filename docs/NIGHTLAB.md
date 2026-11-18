# Nightlab presentation and bundle contract

The workbench reuses the approved Nightlab tokens, composition, four type roles, controls, full local 3D light field, corrected enclosure and two-face fallback. The product remains nb1 and the hardware blink(1). Raw CAD, approved artwork and required licenses are preserved. Public technical help contains no private source paths, device identifiers, internal acceptance records or development screenshots.

## Control boundary

The native `/v1/preview` endpoint is authoritative for validation, aliases, color resolution and Action/Sequence compilation. Screen preview receives its canonical Sequence and uses the source-pinned Go `planSequence` descriptor. The embedded loader exposes only `info` and `planSequence`; the daemon retains its current color resolver.

Only explicit Play or Stop uses execution APIs. Play validates directly without requiring a prior preview. One captured device/draft produces one submission. Unknown results retain the original Job ID; bounded read-only lookup does not resubmit it. Solid separate colors use one ordinary serial Sequence with two ordered writes, not a new Action or an atomic hardware operation.

## Presentation boundary

Screen animation, draft targets, cached readback and Job state remain distinguishable. Cached RGB and its ISO sample time are not optical measurements or per-command acknowledgments. LED 1 is the blink(1) wordmark face and LED 2 the ThingM face. Camera movement never swaps channels. `?view=faces`, loading, unavailable WebGL and context loss retain the two-face fallback.

The displayed enclosure, connector and light field are illustrative. The original ThingM STL meshes remain unchanged; the derived display assembly is not manufacturing CAD or calibrated colorimetry. Public model metadata and license links explain the limitations.

## Closed bundle

`scripts/nightlab-assets.mjs` declares the exact Nightlab inventory, gzip set and optional-asset classification. The schema-v2 manifest uses `static-nightlab/v1`, canonical source URL `https://github.com/b1ug/nb1-workbench`, a full clean commit and stored/decoded hashes. Its product identifier remains `nb1-web`.

Limits, including the manifest, are **768 KiB decoded base UI**, **6 MiB total stored**, and **16 MiB total decoded**. Selected Three.js/WASM/STL assets use deterministic gzip. A matching nb1 host verifies and decodes them before serving. All HTML retains one canonical style nonce; the editor receives that nonce. Never weaken CSP, integrity or budgets to import a bundle.

A native Go build uses only the verified embedded dist committed with the host source. It requires no frontend checkout, npm, WASM build or Git submodule. Frontend updates are a separate reviewed producer-build/import/pin change. Published releases and their checksums are not rewritten by a source export.

## Authoring presets

Each of eight curated themes has eight fixed Hex recipes in a common hue order. Recommended pairs are explicit metadata. The nine common swatches remain a separate utility and cannot generate a theme Sequence. Browsing only changes offered swatches; pair application edits current fields; Sequence creation opens an editable template. Save, Preview and Play remain explicit.

The hue comparison repeats identical recipes without claiming perceptual distance or calibration. New theme names and quieter colors describe intent, not measured hardware similarity. The source/build checks remain separate from physical-device and optical acceptance.
