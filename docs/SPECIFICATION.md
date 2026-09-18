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

The 1600×400 value describes the canonical asset canvas / export size. It is not the intended on-screen size inside an application.

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

## On-screen size and readability requirements

The signature must remain clearly readable at normal 100% interface scale. "Subtle" means visually secondary, not tiny, faint, or illegible.

For the standard `light` / `dark` signature variants:

- default desktop/web minimum width: 180 px;
- default mobile minimum width: 145 px;
- typical application-level opacity: 0.80–1.00.

These values define minimum readable sizes only. Do not treat them as target or fixed sizes. The final rendered size should be chosen by the layout and may be larger whenever space allows and the result remains visually balanced.

Do not render the standard signature below these default minimums unless an explicit project requirement or user instruction calls for a smaller treatment and the text still remains comfortably readable.

For `made-by-tatarin-watermark.svg`:

- treat it as a decorative watermark, not as a tiny footer logo;
- default minimum on-screen width: 280 px;
- typical application-level opacity: approximately 0.12–0.30;
- reduce visual prominence with opacity and placement, not by shrinking it until the canonical text becomes unreadable.

The minimum watermark width is a readability floor, not a target or fixed size. Use a larger size when the composition has room for it.

If available space is too small for a readable signature, prefer moving it to a better location, changing the layout, or using an About / Settings / Credits placement instead of compressing it into an unreadable size.

At normal 100% zoom, the text `made by tatarin` must be recognizable without requiring the user to zoom, inspect the image closely, or infer the text from the artwork.

## Preferred placement

When technically practical and when it does not interfere with controls, content, navigation, readability, or responsive behavior, place the signature at the very bottom of the interface.

Prefer the lowest suitable footer / bottom area of the product rather than floating the signature above main content. The signature may be placed elsewhere when a bottom placement would harm usability, visual hierarchy, or the intended product experience.

## Design constraints

The signature is a branding element, not a placeholder. It may be resized and its opacity may be adjusted during implementation, but the artwork itself should not be redrawn, recolored, distorted, cropped, or have its text changed without an explicit branding revision.

For watermark usage, keep the source artwork at normal usable opacity. Application-level opacity should be controlled by the UI implementation rather than baked permanently into the asset whenever possible.
