# Signature Usage Guide

Canonical brand rules: [SPECIFICATION.md](SPECIFICATION.md).

## Default behavior for developers and coding agents

Use a **native typographic signature by default**. An image, logo file, downloaded SVG, or PNG is **not mandatory**.

The intended visual result on a dark background is `made by tatarin.`: `made by tatarin` in off-white with **only the terminal `.`** in lime. Keep words lowercase. Treat the author credit as a finishing touch, like an artist's signature, not as the project's main heading or main brand.

Use the host project's typography and adapt weight, size, tracking, spacing, and footer alignment so the mark feels native. Do not copy a font blindly from the Tatarin portfolio into client projects.

## Brand tokens

| Token | Value | Role |
| --- | --- | --- |
| `--tatarin-black` | `#050505` | Near-black backgrounds, lettering on light surfaces |
| `--tatarin-white` | `#F2F2F2` | Default white-looking lettering on dark surfaces |
| `--tatarin-lime` | `#B6F24A` | Final signature dot and selected Tatarin accents |

Use these for **Tatarin author identity**, not as an instruction to restyle a client's full product UI.

## Copy-ready native HTML/CSS example

```html
<span class="tatarin-signature">
  made by tatarin<span class="tatarin-signature__dot">.</span>
</span>
```

```css
.tatarin-signature {
  --tatarin-black: #050505;
  --tatarin-white: #f2f2f2;
  --tatarin-lime: #b6f24a;
  color: var(--tatarin-white);
  font: inherit;
  font-weight: 600;
  line-height: 1.2;
  white-space: nowrap;
}

.tatarin-signature__dot {
  color: var(--tatarin-lime);
}

/* Add this variant only when placing the mark on a light surface. */
.tatarin-signature--on-light {
  color: var(--tatarin-black);
}
```

This markup renders visible text; it requires **no runtime fetch**, remote image, JavaScript, external font, or GitHub dependency. Use the existing project font and layout rules. When switching to a light background, add `tatarin-signature--on-light` to the outer span. Check that the lime period is still visible against its surrounding surface.

Do not insert spaces between `tatarin` and the final period. Do not turn the entire phrase lime, replace words, change capitalization, or add a standalone decorative lime circle in place of the period. The visual punctuation is a dot.

## Choosing typography versus official artwork

1. **Default:** render `made by tatarin.` as native text with the lime period.
2. **When appropriate:** use an official SVG/PNG signature, for example when a deliberately graphical mark is requested. The supplied artwork is optional and should not be modified.
3. **Decorative only:** use the official watermark variant for a suitably large decorative surface, not a tiny footer badge.

Do not convert the native text version into a raster image or import SVGs just to satisfy a branding convention. Conversely, do not replace a project-approved image signature if the user specifically wants it.

### Existing optional assets

- `assets/signature/made-by-tatarin-light.svg` — image for dark interfaces.
- `assets/signature/made-by-tatarin-dark.svg` — image for light interfaces.
- `assets/signature/made-by-tatarin-watermark.svg` — decorative watermark.
- Matching PNG files are fallback exports when SVG is unsuitable.

For **image-based** usage only: store the selected official asset locally, preferably in `assets/branding/`; never make the published app fetch it from GitHub at runtime. If a valid local file exists, reuse it. Do not recolor, redraw, distort, or rename the original asset without explicit direction.

Raw source directory: `https://raw.githubusercontent.com/garifulinandrej183-lang/tatarin-branding/main/assets/signature/`.

## Placement and readability

Prefer the lowest suitable footer/bottom area when that works with the application's layout. Bottom-right or bottom-left are both appropriate. For games, a menu or credits screen may be better. Avoid obstructing navigation, gameplay, forms, or accessibility-critical content.

For **native text**, choose a readable font size and contrast based on the project; do **not** treat the image-width numbers below as requirements for text. Avoid extremely small, faint, or crowded lettering. A concise author mark should remain recognizable at 100% zoom.

For optional standard **SVG/PNG images**, the legacy recommended default minimum widths remain **180 px desktop** and **145 px mobile**, with typical application opacity **0.80–1.00**. These are minimum readability sizes, **not** ideal/fixed/maximum widths.

For an optional **decorative watermark**, the default minimum is **280 px**, with typical application opacity **0.12–0.30**. If too little space exists, change placement instead of making the watermark illegible.

On light surfaces choose near-black text with the same lime dot, and consider dot visibility against the background. Do not force white-on-white branding or sacrifice legibility for a fixed default.

## Multi-screen interfaces

Do not duplicate the mark on every screen automatically. Prefer a shared footer or layout, then a main menu/landing screen, then About/Settings/Credits when a persistent footer is inappropriate. A reusable component may accept `variant: text | image | watermark`, `contrast: on-dark | on-light`, size, and position.

The host application's product identity and semantic colors remain distinct from this author credit. Apply the full black/lime/off-white aesthetic only when the project itself is intentionally made by tatarin-branded or the user specifically asks for it.
