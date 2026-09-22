# tatarin-branding

Official branding assets and shared product UI standards for projects by Tatarin.

This repository is the canonical source for the `made by tatarin` author signature and the default UI/UX quality standard used across UI projects.

## Canonical signature text

`made by tatarin`

Do not change capitalization, wording, or spacing unless the repository specification is intentionally revised.

## Asset structure

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

SVG is the canonical format. PNG files are fallback exports.

## Usage

Applications should not load these assets from GitHub at runtime. Development agents should download the required official asset into the project and reference the local copy.

See `docs/USAGE.md` and `docs/SPECIFICATION.md` for implementation and signature design requirements.

## Product UI standard

For new interfaces, redesigns, and material UI changes, use `docs/UI_GUIDELINES.md` as the canonical default UI/UX standard unless the user or the target project provides more specific instructions.

The standard defines the expected contemporary product quality bar, design-system principles, anti-template rules, responsive behavior, interaction states, accessibility, performance, and change discipline for coding agents.

## Version

Current branding specification: `1.1.0`
