# Web tool localization

The workbench, Orbit view and Pattern Book share one local presentation layer. English is the first-visit default, even when the browser or operating system uses Chinese. A quiet globe button with the short label **EN** or **中文** opens a page-styled paper listbox with fixed **English** and **中文** labels. The accessible button name retains the full current language name. It uses no native select popup. A user selection writes only `nb1.web.locale.v1` in same-origin localStorage. Navigating between tools or reloading reuses that explicit choice. An unsupported preference, blocked storage, or absent preference falls back to English; initial rendering never writes a preference. If storage is denied, a selection still works for the current page.

The trigger supports Enter and Space. Arrow keys move option focus, Home/End choose the first/last focus target, and Enter/Space commits the focused language. Escape closes the listbox and returns focus to the trigger; Tab and Shift-Tab close it and continue through the page. An outside click closes the popup while preserving focus on an outside input or button; a background click returns focus to the trigger. `aria-expanded`, `aria-controls`, the listbox role, and `aria-selected` describe its state. The trigger and options have targets at least 44 pixels high. The short utility label uses 13-pixel text; full popup choices use at least 14 pixels. `locale-menu.css` supplies the local paper treatment and CSS-drawn chevron/checkmark.

## Resources and stable keys

`locales/messages.json` is the editable catalog. Each message has a stable, descriptive `key`, the authored `en` text and a `zh-CN` translation. Preserve its key when improving wording. All three pages use the same registry. To add a language:

1. Add a BCP 47 locale code and its native display name to `locales`.
2. Add that code's translation to every message. Keep `{p0}`, `{p1}`, etc. exactly once for each corresponding source occurrence; they may be reordered.
3. Run `npm run check:locales`, the syntax check and the browser acceptance suite. Include mobile, keyboard, recovery states and Job cancellation.
4. Commit the reviewed catalog and build the fixed bundle. The custom menu adds registered languages automatically using their catalog labels; the English and Chinese labels above remain fixed. No page fork is needed.

The build rejects duplicate semantic keys, duplicate English sources, missing translations, placeholder mismatches, unanchored templates, and fingerprint collisions. `scripts/catalog.mjs` generates `locales.js` directly into the build output. Do not edit that generated file. Runtime exact-message lookup uses two deterministic 32-bit fingerprints to avoid shipping a duplicate English catalog; the English strings remain in HTML/JavaScript and the developer catalog. Template lookup uses small internal indexes. These compact transport keys are private build details; the descriptive catalog keys are the reviewable, stable identifiers.

The whole bundle remains below the reviewed 640 KiB bound. Adding translations or locales can require a separately reviewed asset budget change; never drop existing language coverage to meet it.

## Presentation boundary

`src/i18n.js` updates text nodes, the document language/title, and `aria-label`, `title`, and `placeholder` attributes. It uses text/attribute setters, never HTML evaluation. A MutationObserver handles asynchronously rendered states. Original English text is retained in WeakMaps so switching back restores it without calling page renderers. A language change does not call Fetch, preview, prepare, save, play, query, cancel, or any animation/compiler function. The shared select picker copies already-localized source option labels into an excluded presentation subtree. A narrow source/label observer synchronizes those copies without translating them again or changing select values.

Input/select/textarea values, API field names, canonical action names, serials, hex values, IDs, source JSON, frozen records, recipes, digests and Job IDs are not translated. User-authored Pattern titles are opaque data, even when a title equals a label such as `Off` or `Read-only`. `data-user-title` marks the selected title; list title nodes are also excluded. The saved-Pattern select and its popup preserve the complete ID/title string, including a title that collides with a UI translation such as `Off` or `Read-only`. Code blocks and JSON diagnostics retain their original content. Marked preformatted help nodes translate only a complete cataloged help sentence, never JSON. Original backend diagnostic details and unknown reason/error codes may remain in their source language.

Dynamic messages use anchored templates. Placeholders are opaque by default. A `recursive` bitmask explicitly opts known UI-only captures (status labels, frontend validation messages) into translation. Raw title, device/product/serial, revision and backend-data captures must remain opaque. Never introduce a generic template containing only placeholders. Swatch accessibility labels/tooltips have a narrow scope; their canonical color names and hex values remain available.

New UI wording must be added to the catalog, including loading, empty, error, progress and uncertainty states. A generic DOM text matcher is not permission to localize arbitrary application data: preserve the exclusions and test collision titles.

## API v1 integration checks

The API v1 pages use the same English and Chinese catalog for Action forms, Sequence and Step details, Job states, and Pattern summaries. Preserve input JSON, IDs, resolved colors, and saved titles when switching languages.

The syntax and locale scripts check the current source and catalog. Browser acceptance uses a software device through the matching HTTP service. Cover locale persistence, no language-triggered requests, Job recovery and cancellation, read-only preview, keyboard access, and 390 px layouts. Embedding verification runs against the matching nb1 source. [API v1 integration plan](API-V1-INTEGRATION.md)
