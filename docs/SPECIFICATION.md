# Signature Specification

## Brand palette

The made by tatarin identity uses three canonical colors, drawn from the established portfolio design reference:

- **Near-black / background:** `#050505`
- **Lime / accent:** `#B6F24A`
- **Off-white / default light lettering:** `#F2F2F2`

Off-white is the preferred white-looking brand text shade on dark backgrounds. The brand palette is **not** an instruction to recolor the client's entire interface.

## Canonical text and the lime dot

The signature words must remain exactly `made by tatarin` (all lowercase; preserve language, spelling, and spacing).

The **default displayed mark** is `made by tatarin.`. The terminal period is a separate **lime `#B6F24A` accent**; the words are **off-white `#F2F2F2`** on dark surfaces by default.

For light surfaces use near-black `#050505` text with the same lime dot, and ensure sufficient contrast/visibility. The dot is part of the signature's visual identity, not an instruction to make the full phrase lime.

## Two supported implementations

1. **Preferred: native typographic signature.** Render actual text using the host project's own typography. The final period is separately styled in lime. No branding image, downloaded logo, SVG, or PNG is required.
2. **Optional: official graphical signature.** Existing SVG/PNG image files are still supported where specifically requested or visually appropriate. Preserve the original image, variants, and their distinct sizing requirements. The existing files are not required to implement the text-first signature.

The author mark should feel like an artist's signature on a finished work: intentionally placed, subtle but legible, and visually integrated rather than imposed. Adapt font family, weight, tracking, size, and position to the project while preserving the canonical words and lime period.

Signature identity must remain distinct from the product's functional accent and semantic status colors. Do not impose Tatarin's near-black/lime/off-white palette on an unrelated client product unless requested.

## Optional graphical asset format

For the existing image-based variants only, SVG is the source of truth and PNG files are fallback exports. This is not a requirement to use an image for the signature.

Recommended canvas / viewBox ratio: approximately 4:1 to 5:1. A convenient reference size is 1600×400.

Recommended SVG viewBox:

```xml
viewBox="0 0 1600 400"
```

All official variants should use the same viewBox and proportions so they can be swapped without layout shifts.

The 1600×400 value describes the canonical asset canvas / export size. It is not the intended on-screen size inside an application.

## Available optional graphic variants

- `made-by-tatarin-light.svg` — for dark interfaces
- `made-by-tatarin-dark.svg` — for light interfaces
- `made-by-tatarin-watermark.svg` — neutral decorative / watermark usage

Equivalent PNG fallback exports should use the same base names.

## Technical requirements for image assets

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

## Recommended export targets for image assets

- SVG: preferably below 100 KB where practical.
- PNG: reference export at 1600×400 with transparency; preferably below 500 KB where practical.

These are optimization targets, not hard limits.

## On-screen size and readability requirements

The signature must remain clearly readable at normal 100% interface scale. "Subtle" means visually secondary, not tiny, faint, or illegible.

For the **native text implementation**, select an appropriate readable font size, weight, and contrast for the host interface; there is no fixed image-style minimum width. The markup should scale naturally with responsive typography.

For the optional standard `light` / `dark` **image** variants:

- default desktop/web minimum width: 180 px;
- default mobile minimum width: 145 px;
- typical application-level opacity: 0.80–1.00.

These values define minimum readable sizes only. Do not treat them as target or fixed sizes. The final rendered size should be chosen by the layout and may be larger whenever space allows and the result remains visually balanced.

Do not render those standard **image** variants below these default minimums unless an explicit project requirement or user instruction calls for a smaller treatment and the text still remains comfortably readable. Do not apply these pixel-width minimums to native text.

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

The signature is a branding element, not a placeholder. Native text should be treated as typography, not as an image. Do not alter the canonical wording or lime period; contextual adjustments to text size, font, weight, alignment, and color for readable light/dark placement are permitted as documented above.

When an existing official SVG/PNG image is selected, it may be resized and its application-level opacity adjusted, but the **image artwork** itself must not be redrawn, recolored, distorted, cropped, or have its text changed without an explicit branding revision.

For watermark usage, keep the source artwork at normal usable opacity. Application-level opacity should be controlled by the UI implementation rather than baked permanently into the asset whenever possible.
