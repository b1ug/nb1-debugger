# Action icons

The original, static SVG drawings use rounded strokes and ends. Eight Actions share a 28 × 28 drawing grid and render at 32 × 32 pixels. Rainbow uses a 44 × 34 grid and rendering size: seven arcs are spaced three units apart with 1.7-unit strokes, leaving visible 1.3-unit gaps. They use local geometry rather than fonts, image downloads or animation. The button's visible Action name supplies its accessible name; both the icon wrapper and SVG are decorative.

| Action | Visual meaning |
| --- | --- |
| Set | A solid indicator with four short rays. |
| Off | The indicator outline crossed out. |
| Fade | One color progresses across a smooth gradient. |
| Blink | Repeated, abrupt on/off steps. |
| Breathe | A soft central shape expands symmetrically outward. |
| Pulse | One quick rise followed by a longer curved fall and rest. |
| Alternate | Two straight arrows exchange direction. |
| Orbit | A warm gold planet with tilted Saturn-like rings; the rear ring passes behind the globe and the front ring crosses it. |
| Rainbow | Seven concentric arcs: red, orange, yellow, green, blue, indigo and violet. |

`NB1ActionIcons.create(kind)` returns a fresh SVG element. Load `action-icons.js` before `demo.js`. Unknown kinds produce a neutral indicator; no supplied kind is inserted as markup or an attribute. Each Fade SVG has its own local gradient ID, so several instances can coexist.

These are navigation cues, not animation previews or timing diagrams. They do not alter Action names, parameters, color compilation or hardware behavior. Labels remain essential, including after switching language.

The icon's red, orange, yellow, green, blue, indigo and violet shades are an illustrative display palette, distinct from the compiler's fixed seven color anchors and device RGB values.
