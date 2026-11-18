# Sequence JSON editor

The workbench enhances its Sequence textarea with a locally bundled CodeMirror editor. All three pages share the same editor. It provides line numbers, JSON syntax highlighting, bracket matching, two-space indentation, Undo/Redo and a plain-text switch. Tab and Shift-Tab leave the editor normally. The editor never loads a remote resource. Local syntax checks need no request; color samples may make bounded, debounced requests to the same-origin nb1 color resolver as the user edits. These requests never create a Job or operate the light.

The palette follows the workbench's warm paper treatment. Property names, strings, numbers and literals have distinct text colors. A small color chip appears beside a `color` property using a supported ColorInput: named colors, Hex3/Hex6, RGB8, HSV/HSB objects or a local `@name` reference. The Go resolver supplies the canonical Hex6 for names, structured inputs and local references; strict Hex3/Hex6 also have a matching local display path. Chips decorate the document without changing its text or adding characters to copied JSON. They are color references, not simulated hardware or optical measurements. Other property values and HTML are never rendered as colors or markup. The browser does not use its CSS color grammar: unsupported values such as alpha colors, `transparent` and CSS functions do not acquire a misleading sample.

## Validation and formatting

Local checks report JSON syntax errors, duplicate properties, incomplete Unicode characters, excessive nesting and a non-object root. The first error includes its line and column; **Go to error** focuses that range. Duplicate checking compares decoded names, so `"color"` and `"co\u006cor"` conflict. Checks are bounded to 64 nesting levels, 100,000 tokens and a document of at most 1,048,576 JavaScript characters; at most 20 diagnostics are retained. The HTTP API independently limits encoded request bytes, including its envelope.

“JSON syntax is valid” is only a local editing result. **Preview only** still sends the original author text to nb1 for Sequence fields, integer notation, timing, size limits and cached device capability checks. For example, `1e0` is valid JSON syntax but is not accepted for a Sequence integer. Preview never starts playback; the explicit **Play on device** action retains its existing Job and recovery rules.

**Format JSON** changes only whitespace between the original tokens. It preserves number spelling, property order, string escapes and every authored token. It does not parse and reserialize the document or repair errors. Formatting is unavailable while local errors remain and is an undoable edit. The plain-text switch retains exactly the same draft; edits in either mode synchronize with the textarea used by the existing request path.

Sequence authoring accepts the same ColorInput grammar as Action. Compiled Sequence responses and execution targets use canonical `#rrggbb`. HSB controls use the explicit JSON wire shape `{"space":"hsv","h_deg":...,"s_pct":...,"v_pct":...}`; `"space":"hsb"` is not a wire alias. Preview remains the authoritative validation of the entire authored Sequence.

## Integration and access

`window.NB1JSONEditor.mount(textarea)` returns the existing mounted adapter when called again. The adapter supplies `getValue`, `setValue`, `setPlainText`, `refreshColors`, `focus`, `getDiagnostics` and `destroy`. The workbench injects a `resolveColor(raw, signal)` callback through `mount(textarea, options)` and uses the same bounded HTTP transport as its other requests. The original raw color fragment is sent without parsing and reserializing it, preserving strict numeric spelling and duplicate-key behavior. Document changes synchronize the textarea and dispatch its existing bubbling input event, invalidating any earlier Preview. Initial examples, compiled Sequences and saved Pattern imports use the same adapter. Failed enhancement leaves the original textarea available.

Editor content and diagnostic status are opaque to DOM translation. Editor controls use the shared English/Chinese catalog, and diagnostics refresh explicitly on `nb1-locale-change`. Switching languages does not change document text, selection or Undo history and does not start a new resolution cycle. The locale observer ignores editor token mutations instead of scanning the page on each keystroke.

The host supplies a per-response style nonce through `meta[name="nb1-style-nonce"]`. CodeMirror uses that nonce for its required local style elements. Editor syntax classes, color chips and error underlines otherwise use the local `json-editor.css`; no inline SVG/data image is needed for diagnostics. The embedded asset inventory, manifest and content security policy remain enforced by the nb1 host.

The editor uses the pinned packages and complete license notices recorded by the build. It does not include an IDE, extension marketplace, remote language service, telemetry or a playback shortcut.

## Dependencies

The editor uses [CodeMirror 6](https://codemirror.net/) with selected [editor extensions](https://codemirror.net/docs/extensions/) and [decorations](https://codemirror.net/examples/decoration/). Versions are pinned in `package-lock.json`. Build-time dependency installation is separate from the offline runtime; the complete third-party notices are bundled as `editor-LICENSES.txt`.

## Color-resolution limits and freshness

Resolution starts after a 200 ms pause on a complete document with no local JSON diagnostics. Equal raw fragments share one request, at most four requests run concurrently, and the cross-draft cache retains at most 256 entries. Current-document samples are separately bounded to 2050, covering valid Sequence target capacity. Local aliases expire after five seconds; explicit color-library refresh/save, Preview and editor interaction schedule fresh checks. Unavailable or rejected inputs show no fabricated chip and report a quiet editor status. A later edit, alias refresh or page exit aborts obsolete requests; generation checks keep late responses from recoloring a newer draft. Colors refresh through decoration-only editor effects, preserving the raw document, selection and Undo history.
