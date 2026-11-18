# Embedded workbench behavior

Nightlab is the approved presentation: semantic graphite surfaces, four type roles, accessible contextual controls and the corrected 3D enclosure. This public export changes source metadata and technical help, not the workbench composition, Action semantics or geometry.

## Author and play

Choose an Action, edit a Sequence, or read a saved Pattern. Play validates the captured draft and submits one Job directly; Screen preview is optional. Draft/device changes during validation prevent stale submission. Unknown outcomes retain their original Job ID and do not retry a POST.

Solid targets are ordered: both LEDs with one color, separate colors for both LEDs, LED 1, LED 2. Separate colors use one existing Sequence and one Job; the USB writes are ordered, not physically atomic. Labels retain LED 1 · blink(1) and LED 2 · ThingM.

Saved colors sit with their color controls, and Pattern saving sits beside the composer. Saving never plays. Eight curated themes have eight colors each; nine common swatches are a separate utility. Group browsing and the read-only hue comparison do not execute or save anything.

## State and recovery

Draft targets, optional screen animation, timestamped cached RGB and actual Job status remain distinct. Active or unresolved Jobs keep their explanation beside Play across edits and refresh. Missing records preserve uncertainty; explicit recovery remains available. Cancellation is a separate action and requires confirmed terminal cleanup.

The local daemon owns devices, local library storage and execution. The frontend uses its page origin and neither opens USB nor starts another controller. An empty device list clears prior observations.

## Accessibility and language

English is the default. An explicit Chinese switch changes presentation text without changing user input, IDs, API values or stored names. Preserve focus, labels, aria states, mobile order, reduced motion, scrolling and plain JSON fallback. Errors and cancellation must remain visible.

## Source and payload

Use local resources and pinned build dependencies; no CDN, remote font, analytics or startup download. The manifest uses the same 768 KiB base / 6 MiB stored / 16 MiB decoded budgets as the matching host, with an explicit optional-asset classification. Screen previews and software checks do not establish physical light quality or other-device qualification.
