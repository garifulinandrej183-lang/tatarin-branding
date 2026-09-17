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

Official assets will be published under this path.
