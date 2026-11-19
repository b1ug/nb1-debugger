# nb1 Debugger

[简体中文](README.zh-CN.md)

<img src="src/assets/nb1-mascot.webp" alt="nb1 mascot" width="96" height="96">

The embedded web interface for [nb1](https://github.com/b1ug/nb1): control a local daemon, edit Actions and Sequences, save local colors and Patterns, and inspect a 3D light preview. English is the default; Chinese is an explicit choice.

This repository maintains frontend source. The ordinary way to use it is to install nb1 and open its bundled workbench:

```sh
nb1 server --devices YOUR_DEVICE_SERIAL
```

For nb1 v0.1.3, open <http://127.0.0.1:5885/demo/>. For v0.1.2, open <http://127.0.0.1:8931/demo/>. If you configured another listen port, use that port. Preview is optional; Play validates and submits the current draft directly. The same daemon owns the devices for Web, CLI and MCP clients. This page uses same-origin HTTP, has no WebHID connection and does not install or start a daemon.

## Which project does what?

| Project | Responsibility |
| --- | --- |
| [nb1](https://github.com/b1ug/nb1) | CLI, daemon, hardware ownership, API and embedded distribution. |
| **nb1 Debugger** | The daemon-backed interface maintained here and embedded under `/demo/`. |
| [nb1 WebHID](https://github.com/b1ug/nb1-webhid) | Separate browser WebHID workbench and experimental extension; explicit browser device permission. |
| [nb1 Guide](https://b1ug.github.io/nb1-guide/) | Installation, API reference and tutorials. It does not control a device. |

Actions express intent; Sequences describe playback with `steps[]`; Jobs track execution; saved Patterns belong to the computer library. Device-native storage is a separate API concern. Screen animation, cached RGB readback and physical light are distinct. No screen preview or cached value proves optical output.

## Build from source

Use Node.js **22.12 or newer** and the pinned npm lockfile:

```sh
npm ci --ignore-scripts
npm run check:syntax
npm run check:locales
npm run build
npm run check:dist
npm run check:nightlab
```

`build` requires a clean committed source tree. For an uncommitted draft, use `npm run build:dev`; its manifest is marked dirty and cannot be imported as a production bundle. `dist/` is generated and is not committed.

The build uses CodeMirror, esbuild, Three.js and the MK2 asset package from [blink1-models](https://github.com/b1ug/blink1-models). npm installs the exact GitHub commit pinned in the lockfile. The debugger verifies the model manifest and its seven files, then includes the model, CAD attribution and license in the offline bundle. It uses HTML, CSS and JavaScript, with no UI framework runtime. Go is not required to build this frontend: the preview planner is a checked-in, source-pinned Go/WASM artifact with its matching runtime and license notices. Its compiler source and regeneration process are maintained by Browser Tools; [compiler provenance](src/nightlab/compiler/compiler-source.json) identifies the actual core source and artifact hashes.

At runtime no Node server, npm, CDN, remote font, analytics or startup download is needed. The page obtains authoritative validation and color resolution from nb1. Its WASM loader exposes only `info` and `planSequence` for screen playback, not an independent hardware controller.

## Bundle and native integration

The three pages are `/demo/`, `/demo/orbit.html` and `/demo/patterns.html`. Model help is a local technical reference. All runtime resources are local.

The schema-v2 manifest binds the canonical source repository and clean commit, every stored and decoded asset hash, deterministic gzip and the API contracts. The artifact product remains `nb1-web` as a bundle-format identifier; the user-facing name is **nb1 Debugger**.

Selected large assets are stored as deterministic gzip under logical filenames. A matching nb1 importer verifies the closed inventory and serves decoded bytes. A generic static file server or GitHub Pages cannot serve this `dist/` as a working debugger. Native Go builds consume the reviewed, committed embedded dist; they do not clone this repository, fetch a submodule, run npm or build WASM.

See [Nightlab and bundle rules](docs/NIGHTLAB.md), [API adapter contract](docs/API-V1-INTEGRATION.md), [interface behavior](docs/INTERFACE.md), [JSON editor](docs/JSON-EDITOR.md) and [localization](docs/LOCALIZATION.md).

## Assets and licenses

The approved mascot and icon, raw ThingM CAD and required license notices are preserved. This source export excludes private notes, device identifiers, internal acceptance records, development screenshots and rejected artwork. The model help links only to public technical sources.

Application code and project artwork use MIT; raw CAD and the derived display assembly retain CC-BY-SA-4.0 attribution; Three.js uses MIT; the local fonts retain SIL OFL notices; the Go planner and runtime retain their supplied licenses. See [branding](docs/BRAND-ASSETS.md), [fonts](docs/FONTS.md), [model sources](https://github.com/b1ug/blink1-models/blob/v0.1.0/models/mk2/model-assets/source.json), [presentation provenance](docs/NIGHTLAB-SOURCE.json) and [LICENSE](LICENSE).
