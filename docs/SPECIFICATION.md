# Signature Specification

## Canonical text

The signature text is strictly:

`made by tatarin`

Do not change capitalization, wording, spacing, or language.

## Canonical format

SVG is the source of truth. PNG files are fallback exports.

Recommended canvas / viewBox ratio: approximately 4:1 to 5:1. A convenient reference size is 1600×400.

Recommended SVG viewBox:

```xml
viewBox="0 0 1600 400"
```

All official variants should use the same viewBox and proportions so they can be swapped without layout shifts.

## Required variants

- `made-by-tatarin-light.svg` — for dark interfaces
- `made-by-tatarin-dark.svg` — for light interfaces
- `made-by-tatarin-watermark.svg` — neutral decorative / watermark usage

Equivalent PNG fallback exports should use the same base names.

## Technical requirements

- Transparent background.
- 5–10% safe space around the artwork.
- No elements outside the SVG viewBox.
- No external asset references.
- No JavaScript.
- No `foreignObject`.
- No dependency on locally installed fonts.
- Convert custom typography to vector outlines / paths before final export.
- Preserve clean alpha transparency in PNG exports.
- Prefer optimized, production-safe SVG markup.

## Recommended export targets

- SVG: preferably below 100 KB where practical.
- PNG: reference export at 1600×400 with transparency; preferably below 500 KB where practical.

These are optimization targets, not hard limits.

## Design constraints

The signature is a branding element, not a placeholder. It may be resized and its opacity may be adjusted during implementation, but the artwork itself should not be redrawn, recolored, distorted, cropped, or have its text changed without an explicit branding revision.

For watermark usage, keep the source artwork at normal usable opacity. Application-level opacity should be controlled by the UI implementation rather than baked permanently into the asset whenever possible.
