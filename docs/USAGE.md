# Usage Guide

This repository is the canonical source for the `made by tatarin` signature.

## Development rule

Do not make production applications depend on GitHub availability at runtime.

During development:

1. Select the appropriate official variant.
2. Download it from this repository.
3. Store it locally in the project, preferably under `assets/branding/`.
4. Reference the local asset from the application.

If a valid local copy already exists, do not redownload it unnecessarily.

## Variant selection

- Dark UI background → use `made-by-tatarin-light.svg`.
- Light UI background → use `made-by-tatarin-dark.svg`.
- Decorative background / watermark → use `made-by-tatarin-watermark.svg`.
- Prefer SVG when the framework supports it correctly.
- Use PNG only as a fallback where SVG is unsuitable.

Use the `light` or `dark` variant when the purpose is an actual readable author signature in a footer, menu, About screen, settings area, or product chrome.

Use the `watermark` variant only when the artwork is intentionally decorative and visually integrated into a larger area. Do not use the watermark asset as a tiny footer badge.

## Placement

The signature should be visually integrated but subordinate to the primary UI. It must not obstruct controls, important text, gameplay, navigation, or accessibility-critical content.

Allowed implementation-level adjustments:

- size;
- layout position;
- application-level opacity.

Do not modify the official artwork itself unless explicitly instructed.

## Size and readability

The signature must be secondary, but it must still be readable.

For normal readable `light` / `dark` signature placement:

- desktop/web target width: approximately 200–240 px;
- compact desktop placement: approximately 180–200 px;
- default desktop/web minimum width: 180 px;
- mobile target width: approximately 150–190 px;
- default mobile minimum width: 145 px;
- typical opacity: 0.80–1.00.

For decorative `watermark` placement:

- typical width: approximately 280–420 px or larger when appropriate;
- typical opacity: approximately 0.12–0.30;
- keep the artwork large enough that the composition and `made by tatarin` text remain identifiable;
- make it quieter with opacity, placement, or surrounding contrast rather than excessive downscaling.

At 100% interface zoom, a user should be able to recognize `made by tatarin` without zooming in or closely inspecting the asset.

Do not make the signature extremely small merely to satisfy a requirement that it be "subtle." If the text becomes difficult to read, increase the rendered size.

If the available footer or toolbar cannot accommodate a readable signature, prefer one of these solutions instead of shrinking it below the recommended minimum:

- give the branding area more horizontal space;
- move the signature to another edge or footer row;
- place it on the main menu, landing screen, About, Settings, or Credits screen;
- use the standard `light` / `dark` asset instead of the watermark variant.

A coding agent should treat these size values as the default branding standard. Project-specific requirements or explicit user instructions may override them.

Example CSS direction for a standard desktop footer:

```css
.branding-signature {
  width: clamp(180px, 15vw, 240px);
  height: auto;
  opacity: 0.9;
}
```

Example CSS direction for a decorative watermark:

```css
.branding-watermark {
  width: clamp(280px, 28vw, 420px);
  height: auto;
  opacity: 0.2;
}
```

Adapt implementation syntax to the framework in use; the readability rule matters more than the exact CSS.

## Recommended placement by application type

The signature does not need to appear in exactly the same place in every project. Integrate it according to the product's UI structure and visual hierarchy instead of forcing a universal placement.

### Desktop and web applications

Prefer a subtle placement in the lower area of the main interface, such as the bottom-left or bottom-right corner, or inside an existing footer.

Example:

```text
┌────────────────────────────────────────┐
│                                        │
│               main UI                  │
│                                        │
│                                        │
│                     made by tatarin    │
└────────────────────────────────────────┘
```

The signature should remain visually secondary to the application's primary content and controls, but it should not be reduced below comfortable readability.

### Games

Prefer placing the signature in menus rather than keeping it permanently visible during gameplay.

Good locations include:

- main menu;
- pause menu when visually appropriate;
- settings or credits screen;
- a subtle menu watermark.

Example:

```text
MAIN MENU

[ Continue ]
[ New Game ]
[ Settings ]
[ Exit ]

made by tatarin
```

Avoid persistent gameplay overlays unless the design explicitly calls for them.

### Utilities and productivity applications

A footer is usually the preferred location, especially when the interface already displays version or build information.

Example:

```text
Version 0.4.2                    made by tatarin
```

The signature may also appear in an About or Settings screen, but this should normally be supplementary rather than the only branding location if a subtle main-interface placement is practical.

### Applications with multiple screens

Do not duplicate the signature mechanically on every screen.

Preferred placement order:

1. shared application layout or footer;
2. main menu or primary landing screen;
3. About / Settings / Credits;
4. watermark on selected screens where visually appropriate.

If the application uses a shared UI architecture, prefer a reusable branding component rather than duplicating raw asset references across multiple screens.

A reusable component may expose implementation-level options such as:

```text
BrandingSignature
├── variant: auto | light | dark | watermark
├── opacity
├── size
└── position
```

For applications with light and dark themes, switch automatically between the official light and dark assets where practical.

## Suggested project path

```text
assets/branding/
```

Suggested filenames should remain unchanged after download so automated tooling can identify them reliably.

## Raw asset URLs

Base path:

```text
https://raw.githubusercontent.com/garifulinandrej183-lang/tatarin-branding/main/assets/signature/
```

Official assets are published under this path.
