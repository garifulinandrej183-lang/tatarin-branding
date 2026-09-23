# Tatarin UI Review Checklist

Supporting checklist for [UI_GUIDELINES.md](UI_GUIDELINES.md). Use only the checks relevant to the changed surface. Mark other checks **N/A with a reason**; do not expand the product scope merely to satisfy a checklist.

For task-based composition recipes and behavioral contracts, see [UI_PATTERNS.md](UI_PATTERNS.md).

This is an evidence checklist, not a claim of complete WCAG conformance, full security review, or whole-product release readiness.

## Scope and composition

- [ ] The primary user task and the changed screens/states are named.
- [ ] Existing working flows, routing semantics, data contracts, and approved visual decisions are preserved or an explicit behavior change is documented.
- [ ] The selected pattern solves a stated problem rather than copying a reference's appearance.
- [ ] Primary content and primary action are visible without a decorative hero or unnecessary dashboard blocking them.
- [ ] Cards, tables, lists, and panes have a content reason; they are not interchangeable decoration.

## Workflow and state

- [ ] List/detail navigation preserves relevant search, filters, sort, selection, scroll, and return focus.
- [ ] Narrow-window detail navigation provides a predictable way back.
- [ ] Essential actions have a discoverable visual path, including when contextual controls or commands are used.
- [ ] Save, validation, loading, success, error, and read-only behavior match the actual underlying operation.
- [ ] Errors preserve useful user input and offer an appropriate next action.
- [ ] Success is not shown before completion; no unavailable undo or invented history is promised.
- [ ] Summaries, counts, deadlines, and matching lists use the same actual scope and domain rules.
- [ ] Realistic long text, identifiers, dates, empty results, and unavailable data have been checked.

## Visual system and branding

- [ ] Existing reusable components and tokens are used or coherently extended.
- [ ] Accent, selection, and semantic status roles are intentional and not ambiguously interchangeable.
- [ ] Primary, secondary, and neutral information differ in prominence without becoming unreadable.
- [ ] Touched light and dark theme states have both been checked, where those themes are supported.
- [ ] The signature uses the official local asset and the correct theme variant.
- [ ] Signature artwork, text, proportions, and existing asset files are unchanged.
- [ ] [SPECIFICATION.md](SPECIFICATION.md) and [USAGE.md](USAGE.md) readability minimums are met without treating them as fixed/target/maximum widths.
- [ ] Bottom-of-interface placement is used where practical; any alternate placement has a UX reason and does not obstruct content.

## Accessibility and interaction

- [ ] Applicable text contrast is measured rather than judged only by appearance: WCAG 2.2 SC 1.4.3 AA thresholds, with its defined scope and exceptions.
- [ ] Visual information needed to identify controls, states, or meaningful graphics meets SC 1.4.11 AA contrast requirements against adjacent colors; decorative separators are not confused with essential control boundaries.
- [ ] Status and urgency are not conveyed by color alone.
- [ ] The changed flow can be operated with the keyboard where appropriate, with visible and predictable focus.
- [ ] Command shortcuts do not break input fields, platform shortcuts, or existing app shortcuts.
- [ ] Supported scaling and window sizes do not hide important content or controls.
- [ ] Reduced-motion behavior preserves the same information and functions without nonessential movement.

## Performance and offline behavior

- [ ] Visual changes do not add artificial delays, blocking effects, or unnecessary full-screen loading.
- [ ] New dependencies or expensive effects have a concrete product benefit and stay within project constraints.
- [ ] Offline products do not gain runtime font, icon, signature, analytics, or AI-service dependencies through this UI change.
- [ ] Affected long lists or document views remain responsive with a realistic workload.
- [ ] Performance claims are supported by actual observation or measurement; untested claims are not reported as passed.

## Review evidence

- [ ] The changed UI was inspected in a running application where the environment permits it.
- [ ] For a meaningful visual change, representative screenshots or equivalent inspectable evidence show the changed flow, not only the happy-path hero screen.
- [ ] Relevant ordinary, empty, loading, failure, and focus states were checked or an explicit limitation was recorded.
- [ ] Targeted functional checks match the change scope; broader checks were used where shared changes or project instructions require them.
- [ ] A successful build is reported separately from visual and interaction validation.
- [ ] The final report states what changed, what was tested, which evidence exists, and what remains unverified.

Suggested review record:

```text
Changed scope:
Profile / pattern decisions:
Screens and states checked:
Window sizes / scaling / themes checked:
Keyboard and reduced-motion checks:
Functional checks and result:
Visual evidence paths:
Performance observations, when relevant:
Known limitations / not tested:
```

## Accessibility reference notes

The project baseline uses the applicable AA thresholds for text and non-text contrast. The reduced-motion rule is a separate Tatarin product requirement; WCAG 2.2 SC 2.3.3 is Level AAA, not AA. Passing these selected checks does not establish full WCAG conformance.

Official reference explanations (checked 2026-09-23):

- W3C, Understanding SC 1.4.3: <https://www.w3.org/WAI/WCAG22/Understanding/contrast-minimum.html>
- W3C, Understanding SC 1.4.11: <https://www.w3.org/WAI/WCAG22/Understanding/non-text-contrast.html>
- W3C, Understanding SC 2.3.3: <https://www.w3.org/WAI/WCAG22/Understanding/animation-from-interactions.html>
