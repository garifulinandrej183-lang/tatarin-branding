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

## Placement

The signature should be visually integrated but subordinate to the primary UI. It must not obstruct controls, important text, gameplay, navigation, or accessibility-critical content.

Allowed implementation-level adjustments:

- size;
- layout position;
- application-level opacity.

Do not modify the official artwork itself unless explicitly instructed.

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

The signature should remain visually secondary to the application's primary content and controls.

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
