# Tatarin UI Pattern Library

Supporting recipes for [UI_GUIDELINES.md](UI_GUIDELINES.md). This file does not supersede the canonical standard, project requirements, approved designs, or explicit user instructions.

Use the relevant checks in [UI_REVIEW_CHECKLIST.md](UI_REVIEW_CHECKLIST.md) when validating an adopted pattern.

**Scope:** apply the relevant recipe to the requested work. A pattern in this library is not authorization to add a feature, change business rules, introduce a backend, or redesign an unrelated screen.

**Provenance:** the supplied *Atlas of Modern UI References: 30 Applications, Recurring Patterns and a Practical Implementation System*, especially pp. 15–22. Reference associations below come from that research. The contracts, project examples, and acceptance checks are Tatarin adaptations adopted in this repository, not claims about the internal implementation of the referenced products.

## 1. Shared character, different product structures

Use a calm functional foundation, clear typography, disciplined spacing, coherent states, and at most one dominant accent direction unless the product has a justified alternative. Content and semantic status colors may add necessary color; do not artificially reduce meaningful data to monochrome.

The Tatarin family identity should come from the quality and consistency of the interaction system and the official `made by tatarin` signature, not from imposing the same layout, font, or exact accent color on every product.

Keep author identity separate from operational meaning. Do not recolor the official signature to match an app accent. Follow [SPECIFICATION.md](SPECIFICATION.md) and [USAGE.md](USAGE.md) for assets, variants, placement, minimum readability, and local storage. Do not restate those minimums as fixed, preferred, or maximum dimensions.

## 2. Select a product profile

These profiles are composition recipes, not independent themes or mandatory component frameworks. A product can combine them when its workflows require it.

| Profile | Appropriate work | Default composition direction | Reference mix from the atlas | Avoid |
| --- | --- | --- | --- | --- |
| Operational workspace | Record registers, instructions, personnel, requests, deadlines | Stable navigation; compact contextual toolbar; useful table or list; optional detail pane | Linear + Superhuman; Raycast for repeated commands; Flighty for chronological status | Landing-page heroes, giant record cards, decorative charts, automatic loss of list context |
| Document workspace | Reading, document preview, templates, structural PDF editing | Navigation or page thumbnails; dominant document area; contextual tools or inspector | Readwise Reader + Bear; Framer for workspace composition; Craft for document previews | Decorating over document content, making a dashboard the mandatory entry to a document, hiding basic operations |
| Focused utility | One dominant operation or a short workflow | One obvious task; concise inputs; visible result; advanced options on demand | Things 3 for focus and feedback; Wise for task clarity | Unnecessary sidebars, global dashboards, command palettes without enough useful commands |

Do not copy fixed sidebar or inspector widths from research examples. Size regions to content, supported windows, scaling, and platform conventions. On narrow windows, recompose the workflow instead of shrinking every pane.

For games, visual editors, and other specialized products, respect their project-specific structure. This library is not a reason to force an operational desktop layout onto them.

## 3. Context-preserving list and detail

**Source direction:** Linear, Superhuman, Readwise Reader, Bear; atlas pp. 16–17.

**Choose when:** users repeatedly inspect or update multiple records from a list.

**Contract:** keep the list as the navigation anchor when there is sufficient space. Opening, updating, and closing details should preserve the active query, filters, sorting, selection, and useful scroll position. Restore keyboard focus to the invoking row or a predictable nearby control when returning. A necessary reorder or removal may change the view, but make the outcome understandable.

Use a side pane for inspection and bounded editing. Use a dedicated screen for genuinely complex workflows instead of compressing a long form into a narrow inspector. On a narrow window, a full-screen detail with predictable Back is valid. Do not replace established routing semantics merely to imitate a reference.

Do not auto-resort the list under a pointer, discard unsaved input, or unexpectedly change the active record during editing. Define what happens when the selected record disappears from the current filter after a successful change.

**Example adaptation:** select an incoming instruction, inspect its due date and response details, then continue with the next instruction without rebuilding the filter.

**Acceptance:** perform the open → edit → close → next-record sequence with a non-default filter and a scrolled list. Check focus and failure behavior as well as the successful path.

## 4. Answer first, evidence second

**Source direction:** Oura, Flighty, Strava; atlas pp. 15 and 18.

**Choose when:** the user needs to know what matters now before exploring a dataset.

**Contract:** start with a concise answer or actionable summary, then show the relevant records or explanation, and only then offer detailed analytics when justified. An answer is not necessarily a numeric score or a card.

For operational work, prefer a real question such as “What is due today?” to decorative totals. A summary used as navigation must open the matching list or explain its scope. Counts and lists must use the same documented filters and time rules. Do not invent metrics, urgency, trends, or history to populate a layout.

Preserve critical information in text, not only in color or charts. Use timelines only when chronological events are useful and actually available. Creating an audit/history data model is separate feature work.

**Example adaptation:** “Due today: 3” leads to the three matching records. These example numbers are illustrative, not user data. In an empty state, show the true empty result and an appropriate next action instead of mock urgency.

**Acceptance:** check that each summary agrees with the underlying list and that a true empty result is distinguished from unavailable data; unavailable data is never presented as a successful zero.

## 5. Progressive disclosure and bounded inline editing

**Source direction:** Notion, Airbnb, Oura; atlas p. 17.

**Choose when:** secondary properties or infrequent options obscure a frequent task.

**Contract:** keep the object identity, essential state, critical warnings, and primary action visible. Reveal secondary fields and advanced settings on demand. Disclosure must have a discoverable control; neither hover nor command search may be the only way to reach an essential function.

Inline editing is appropriate for a bounded, low-risk change with clear validation and save semantics. Reuse existing persistence behavior. Preserve the user's value on validation or save failure, and distinguish read-only, editing, saving, saved, and failed states where applicable.

Do not turn a consequential operation into an accidental one-click change. Keep existing confirmations and document-generation steps where the domain requires them. Adding autosave is not a purely visual change; treat it as explicit behavior work.

**Example adaptation:** show the title, due date, responsible person, and status of an instruction first; show additional incoming-document details and attachments in a secondary area.

**Acceptance:** a first-time user can discover both the main action and the secondary properties without knowing a shortcut. A failed edit does not disappear or look saved.

## 6. Commands as an acceleration layer

**Source direction:** Raycast, Linear, Superhuman; atlas p. 16.

**Choose when:** a desktop product has enough frequent actions or navigation targets for command search to reduce repeated work. A small utility need not have a command palette.

**Contract:** preserve visible paths to important commands. Where command search exists, provide a discoverable entry point, meaningful command names, keyboard navigation, and shortcut hints consistent with the host platform and existing app.

Use the same underlying actions, validation, scope, and permissions as visible controls. A command must not bypass confirmation or change persistence semantics. Do not intercept ordinary typing, text-editing shortcuts, browser/system shortcuts, or established app shortcuts without a deliberate documented decision.

Show the scope of searches and actions: current record, current list, current document, or whole application. An empty result should explain what was searched and how to continue.

**Example adaptation:** “Open archive”, “Find record”, or “Create instruction” only when the product already supports or explicitly requests those actions.

**Acceptance:** complete the same task with a visible control and with the command layer; verify equivalent outcomes and protections. Verify that text inputs remain usable.

## 7. Density and semantic presentation

**Source direction:** Linear, Vercel, Flighty; atlas pp. 2, 9–10 and 18.

**Choose when:** users compare records, scan identifiers, or work with long operational lists.

**Contract:** achieve useful density through typography, alignment, spacing, and restrained surfaces, not through tiny type or hidden critical data. Preserve useful tables instead of replacing each row with an oversized card.

Where separate density modes are already supported or explicitly justified, define them through shared spacing and control tokens; do not maintain unrelated component implementations. A density switch is optional, not a requirement for every app.

Use shared semantic roles for accent, selected state, pending, success, warning, danger, and informational states. Domain statuses should map to these roles without changing their business meaning. Distinguish urgency using labels, icons, hierarchy, and contrast as appropriate, not color alone. Neutral states such as “not required” should remain quiet but legible.

Keep date formats and identifier presentation consistent. Show full important values through a discoverable detail or other suitable mechanism rather than relying on visual truncation alone. Relative time may supplement, not obscure, a decisive absolute date.

**Example adaptation:** an overdue record stands out; a pending response is visible without looking like an error; completed and not-required records do not dominate the screen.

**Acceptance:** scan realistic long names, identifiers, dates, and statuses at supported scaling in each affected theme. Confirm that selected, focused, warning, and error states remain distinguishable.

## 8. Document or artifact first

**Source direction:** Readwise Reader, Bear, Framer, Runway/Spline; atlas pp. 4, 10–12 and 21. Borrow the workspace relationship, not AI, 3D, or media infrastructure.

**Choose when:** the document or other user artifact is the main reason to open the screen.

**Contract:** allocate the primary area to the artifact. Place navigation, thumbnails, and properties around it only when they support the task. Secondary tools may appear contextually, but essential actions must remain discoverable.

Keep selection, preview, and inspector synchronized. Do not imply that a preview operation has modified or saved the source file. Distinguish editing state, pending changes, validation, and completed file output according to the actual product capabilities.

Do not let document artwork make surrounding controls unreadable. A visually sparse or unusually formatted document must still have a usable shell.

**Example adaptation:** for structural PDF editing, page thumbnails or a page overview select pages; the document remains central; supported page operations stay close to the selection. Any deletion, export, recovery, or undo behavior must match the actual implementation and existing safety rules.

**Acceptance:** follow selection → inspect → supported operation → verify result; check empty, invalid, and failed-output states where applicable. Do not introduce new PDF engine features as part of adopting this visual recipe.

## 9. Semantic feedback without spectacle

**Source direction:** Things 3, Flighty, Arc; atlas pp. 18 and 20–21.

**Choose when:** an interaction changes state, location, selection, or processing status.

**Contract:** choose one or two characteristic feedback moments for the product rather than animating everything. Motion may clarify continuity; it must not carry the only record of an outcome.

Show success only when the relevant operation has succeeded. Optimistic feedback is allowed only where existing behavior is safely reversible and errors are reconciled. Do not delay instant local operations to display a skeleton or a success animation. Do not make users wait for an animation before their next action.

Simplify or remove nonessential motion in reduced-motion mode while preserving the same information and available actions. Use existing tokens and platform capabilities before adding dependencies.

**Example adaptation:** a detail pane appears without losing the selected row; a completed item changes state and, when supported, offers an honest reversal action. Do not promise undo for an operation the app cannot reverse.

**Acceptance:** test success, failure, rapid consecutive input, and reduced motion. Check that the UI does not claim completion before the underlying operation finishes.

## 10. Optional patterns require a product reason

Saved filters, remembered pane widths, pinned views, and recent documents can be useful when they reduce repeated work. Add them only within explicit scope and supported persistence. Keep stable navigation and predictable defaults; do not silently rearrange the interface based on inferred preferences.

AI, maps, 3D, rewards, character systems, and advanced personalization are not baseline requirements. Contextual AI is relevant only to products that already have or explicitly request it; its suggestions need clear scope and a distinction from committed data. Never introduce an external service or data transmission to make an offline UI look more contemporary.

## 11. Reference selection brief

For a substantial redesign or new interface, write a short brief before implementation:

```text
Product and primary workflow:
Supported devices / window constraints:
Existing patterns and behavior to preserve:
Selected profile or justified alternative:
Primary composition reference and specific lesson:
Secondary interaction/reference lesson, if needed:
What will NOT be copied:
Screens and states in scope:
Evidence planned for review:
```

Usually two or three complementary references are enough; that is a practical default, not a quota. Use references to resolve a product problem, not to collect fashionable screenshots. For a small local UI change, record only the relevant decision rather than generating a design exercise.

## Source map

- Atlas pp. 1 and 14: neutral functional foundations, distinctive brand layer, product-dependent motion.
- Atlas pp. 15–16: answer-first information and relationships between hierarchy, disclosure, commands, and feedback.
- Atlas pp. 16–19: pattern applicability, limitations, context retention, semantic color, and optional personalization/AI.
- Atlas pp. 20–22: cost/value prioritization, composition recipes, anti-patterns, and shortlist.

The atlas is a reference analysis, not a supplied UI component library, Figma source, or source-code distribution. No proprietary assets or product source code are included here.
