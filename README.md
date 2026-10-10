# tatarin-branding

Official visual identity, signature assets, and shared UI/UX quality standards for projects by Tatarin.

This repository is the canonical reference for the `made by tatarin.` author mark. A supplied image file is **not required**: a native typographic signature is the preferred default.

## Brand palette

Based on the established madebytatarin.ru design reference:

| Role | HEX | Usage |
| --- | --- | --- |
| Near-black | `#050505` | Brand dark background and dark lettering on light surfaces |
| Lime | `#B6F24A` | Signature dot and selective brand accents |
| Off-white | `#F2F2F2` | Default lettering on dark surfaces |

The off-white is the site's preferred white-looking text color; it is not necessary to substitute pure `#FFFFFF`. Use these colors for the Tatarin identity, **not as a mandate to recolor unrelated client products**.

## Signature: typography first

Canonical words: `made by tatarin` (lowercase, exact spelling and spacing).

Default visual signature: **`made by tatarin.`**, with only the final period (`.`) in lime `#B6F24A`.

- Dark background: text `#F2F2F2` + lime dot `#B6F24A`.
- Light background: text `#050505` + the same lime dot, with adequate visibility.
- Match the host project's typography, spacing, size, alignment, and placement so the author mark looks native rather than pasted on.
- The signature is a discreet author credit, like an artist's signature on a work, not the client's primary brand.
- Do **not** force a graphic logo/image, download assets, or recreate an image when styled text accomplishes the job.

An existing graphic signature (SVG/PNG) remains a valid **optional** choice when requested or better suited to the composition. Do not modify the existing official artwork.

See [docs/SPECIFICATION.md](docs/SPECIFICATION.md) for the canonical brand rules and [docs/USAGE.md](docs/USAGE.md) for copy-ready HTML/CSS and integration guidance.

## Optional graphical assets

```text
assets/
  signature/
    made-by-tatarin-light.svg
    made-by-tatarin-dark.svg
    made-by-tatarin-watermark.svg
    made-by-tatarin-light.png
    made-by-tatarin-dark.png
    made-by-tatarin-watermark.png
```

For optional graphics, SVG is the canonical source and PNG the fallback. If an official image is used, store it locally in the product; do not fetch it from GitHub at runtime. The typographic version needs no image asset.

## Product UI standard

For new interfaces, redesigns, and material UI changes, follow [docs/UI_GUIDELINES.md](docs/UI_GUIDELINES.md) by default unless the user or target project supplies more specific requirements.

Supporting documents:

- [UI pattern library](docs/UI_PATTERNS.md): task-based patterns, behavior contracts, and examples.
- [UI review checklist](docs/UI_REVIEW_CHECKLIST.md): scoped implementation and quality checks.

The signature and palette remain governed by [docs/SPECIFICATION.md](docs/SPECIFICATION.md) and [docs/USAGE.md](docs/USAGE.md). A client project's own brand and UI design system take precedence for the product itself.

## Website reference effects

Reusable motion studies, applied source snapshots, and Codex transfer instructions: [references/README.md](references/README.md).

Start with [references/CATALOG.md](references/CATALOG.md) and then read the chosen effect's analysis, prompt, and implementation notes.

## Version

Current branding specification: `1.1.0` (adds canonical black/lime/off-white tokens and text-first signature option; preserves existing graphics).
