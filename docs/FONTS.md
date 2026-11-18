# Local font assets and typography

Nightlab is the current appearance. Its four semantic type roles and UI system-font stack override the retained baseline typography where specified by the approved handoff. The local rounded font assets and the provenance/license records below remain unchanged. Current layout and type behavior are documented in [Nightlab](NIGHTLAB.md).

The baseline typography sheet uses **Fredoka 700** for its brand and headings, with **M PLUS
Rounded 1c 500/700** for body text and controls. These are open fonts with their
own design and SIL Open Font License 1.1 notices. No proprietary game typeface
or game asset is included.

Load `typography.css` after `demo.css` on every page. All font URLs are relative
same-origin files under `./fonts/`; no CDN, remote stylesheet, startup download
or system font installation is required. `font-display: swap` keeps native text
readable while the local files load. Code, JSON editors, values and timestamps
retain their monospace stack and character spacing.

## Files and weight verification

The four WOFF2 files are included locally with their original notices. The public upstream license references below document their font families; building this workbench does not require another project checkout.

| Runtime asset | Bytes | Actual weight | Mapped glyphs |
| --- | ---: | ---: | ---: |
| `fonts/fredoka-700-latin.woff2` | 15,900 | 700 | 217 |
| `fonts/fredoka-700-latin-ext.woff2` | 2,676 | 700 | 22 |
| `fonts/mplusround-500-latin.woff2` | 22,040 | 500 | 230 |
| `fonts/mplusround-700-latin.woff2` | 22,708 | 700 | 230 |
| `fonts/Fredoka-OFL.txt` | 4,388 | License | — |
| `fonts/MPLUSRounded1c-OFL.txt` | 4,397 | License | — |

The WOFF2 total is **63,324 bytes**. Licenses add **8,785 bytes**. The independent
typography sheet adds approximately 6.5 KB; the reviewed build manifest is the
authority for the final combined payload. M PLUS Latin-ext files were deliberately
omitted: each would add about 37 KB and the current application offers English
and Simplified Chinese. Missing glyphs use native fallback fonts.

The `latin-ext` filename is not a promise of complete Latin Extended coverage;
the included Fredoka extension has only 22 mapped characters. These small font
files contain **no CJK ideographs**. They do not provide a Chinese or Japanese
webfont. Chinese uses the platform's installed PingFang SC, Microsoft YaHei,
Noto Sans CJK SC or generic system fallback at weight 700. Its exact shape and
available weight depend on the user's installed fonts. The Chinese stack puts
Simplified Chinese native fonts before Japanese rounded fallbacks.

## Licensing and provenance

Fredoka's embedded copyright is `Copyright 2016 The Fredoka Project Authors
(https://github.com/hafontia/Fredoka-One)`. The supplied
[Fredoka OFL notice](../src/fonts/Fredoka-OFL.txt) is the unmodified official
[Google Fonts notice at bbd715d](https://github.com/google/fonts/blob/bbd715dfa9aa35a1663ddcf711fc6405679c45cd/ofl/fredoka/OFL.txt).
Google Fonts also lists its family and supported axes in
[Fredoka metadata](https://github.com/google/fonts/blob/main/ofl/fredoka/METADATA.pb).
The locally supplied 700 faces are static instances of that family.

M PLUS Rounded 1c's embedded copyright is `Copyright 2016 The Rounded M+ Project
Authors.` Its internal family names use the earlier `Rounded Mplus 1c` spelling.
The supplied [M PLUS OFL notice](../src/fonts/MPLUSRounded1c-OFL.txt) is the
unmodified official [Google Fonts notice at bf19077](https://github.com/google/fonts/blob/bf19077ade7be4fb171532fb14f94391406a01c6/ofl/roundedmplus1c/OFL.txt).
That path retains the family's earlier spelling. The current
[M PLUS Rounded 1c metadata](https://github.com/google/fonts/blob/main/ofl/mplusrounded1c/METADATA.pb)
lists normal 500 and 700 faces with the same copyright; the
[upstream project](https://github.com/coz-m/MPLUS_FONTS) also publishes its OFL.

Ship both complete notices alongside the font files. The web application's MIT
license does not replace the font licenses. Redistribution of the unchanged
fonts with the application is covered by those notices; no font is sold by itself.

## Historical baseline readability and interaction

- Body text uses weight 500; navigation, editor tabs, Actions, menu choices and
  buttons use the real 700 face. Headings use Fredoka 700 rather than synthetic
  heavy weights unavailable in the supplied files.
- Primary copy, labels and clickable Action names are at least 14px. Muted helper
  text has a darker foreground than the earlier small pale labels.
- Mobile text is at least 14px; text inputs use 16px to avoid small-text focus
  zoom. Interactive controls have at least a 44px touch height and buttons have
  at least a 44px width. Existing focus indicators and reduced-motion rules are
  preserved.
- The stylesheet changes presentation only. It does not rewrite user-authored
  names, API values or translated text, and it does not start a request or Job.

Browser acceptance should check local font responses, actual rendered font faces,
mobile wrapping, Chinese fallback, keyboard focus and text zoom. Build/embed
integration owns the fixed allow-list, same-origin CSP and current Nightlab stored/decoded/base budgets;
adding these source assets alone does not update a running daemon.
