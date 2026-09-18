# Tatarin Product UI Standard

Canonical UI/UX standard for projects developed by Tatarin.

This document is intended for coding agents and human contributors. It defines the default quality bar for new interfaces, redesigns, and UI changes unless a project-specific requirement or an explicit user instruction overrides it.

---

## 1. Purpose

The goal is not merely to make an interface "clean" or "pretty".

The goal is to create interfaces that feel like deliberate, polished commercial products built in 2026: visually coherent, easy to understand, responsive, fast, and refined in the small details.

Reference products for **quality level**, not literal copying:

- Apple software and web products;
- Yandex products;
- Sber digital products;
- Linear;
- Raycast;
- Arc;
- Notion;
- other well-designed contemporary SaaS and native applications.

Do **not** copy their branding, layouts, proprietary assets, or visual identity. Use them only as a benchmark for hierarchy, spacing, typography, interaction quality, motion, component states, and product polish.

---

## 2. Core rule

Do not cosmetically decorate an ordinary interface.

If the existing UI is structurally weak, rethink the presentation as a modern product interface while preserving the actual user flow and working business logic.

A good redesign should improve:

1. information hierarchy;
2. composition;
3. spacing;
4. typography;
5. navigation;
6. component quality;
7. states and feedback;
8. responsiveness;
9. micro-interactions;
10. perceived product quality.

Decoration is secondary.

A UI must not depend on gradients, glassmorphism, large shadows, or animation to appear modern.

---

## 3. Instruction precedence

Apply this document as the default UI standard.

Precedence:

1. explicit user instruction for the current task;
2. project-specific design system or documented product requirements;
3. supplied screenshots, mockups, design references, and approved existing patterns;
4. this document;
5. framework defaults.

When a supplied reference conflicts with generic preferences in this file, follow the supplied reference unless doing so would break accessibility, functionality, or an explicit requirement.

Do not silently replace an established project visual language just because another style is personally preferable.

---

## 4. Before changing the UI

Before implementing a non-trivial UI change, inspect the relevant existing code and understand:

- the page or screen structure;
- primary user actions;
- navigation model;
- current component library;
- theme variables or design tokens;
- typography;
- responsive behavior;
- state handling;
- loading, empty, error, disabled, and success states;
- existing reusable components;
- whether the requested change is local or system-wide.

Do not start by rewriting the entire frontend.

Prefer the smallest coherent change that achieves the requested product result.

If the task is a redesign, first identify what is actually wrong:

- weak hierarchy;
- poor grouping;
- excessive density;
- insufficient density;
- inconsistent spacing;
- unclear statuses;
- generic cards;
- weak typography;
- confusing navigation;
- bad responsive behavior;
- missing states;
- visually flat or noisy surfaces.

Fix the underlying issue instead of masking it with decoration.

---

## 5. Protect working product logic

UI work should not unnecessarily alter:

- APIs;
- database schemas;
- backend behavior;
- authentication;
- data models;
- routing semantics;
- business rules;
- persistence;
- IPC;
- networking;
- unrelated application architecture.

Reuse existing functionality wherever possible.

Do not refactor unrelated code merely because a UI task exposes it.

Do not rename or restructure large areas of the project unless there is a concrete implementation reason.

For a small UI request, keep the patch small.

---

## 6. Product composition

Each screen must have a clear visual hierarchy.

A user should quickly understand:

- where they are;
- what the screen is for;
- what requires attention;
- what the primary action is;
- what information is secondary;
- what can be interacted with.

Prefer a deliberate composition over a uniform grid of boxes.

Useful structural patterns include:

- focused page header;
- sidebar + workspace;
- split view;
- master-detail layout;
- grouped list;
- data table;
- inspector panel;
- command bar;
- tabs or segmented navigation;
- inline editing;
- contextual side panel;
- bottom sheet on mobile;
- cards only where a card represents a meaningful object or group.

Avoid wrapping every section in a card.

Whitespace, typography, alignment, and surface contrast should do most of the grouping work.

---

## 7. Visual hierarchy

Use hierarchy deliberately.

Primary elements should be identifiable without reading every label.

Create hierarchy through:

- position;
- size;
- weight;
- spacing;
- contrast;
- surface elevation;
- alignment;
- grouping;
- restrained use of color.

Do not make all text, buttons, cards, and labels equally prominent.

A typical hierarchy may include:

- display / hero;
- page title;
- section title;
- card or row title;
- body text;
- secondary text;
- metadata;
- caption;
- label.

Secondary information should actually look secondary.

---

## 8. Typography

Typography is a primary design tool, not a finishing detail.

Use a modern UI type system appropriate to the product.

Good default directions include:

- Inter;
- Geist;
- Manrope;
- a high-quality system UI stack;
- platform-native typography where appropriate.

Do not add a new font dependency if the project already has a strong typography system.

Avoid default browser typography and generic Arial-like appearance unless it is intentionally part of the product.

Define consistent values for:

- font size;
- font weight;
- line height;
- letter spacing;
- text color;
- maximum line length.

Prefer a restrained type scale rather than many unrelated sizes.

Use bold text selectively. If everything is bold, nothing is emphasized.

---

## 9. Spacing and layout

Use a consistent spacing system.

A practical base scale may use values such as:

- 4;
- 8;
- 12;
- 16;
- 20;
- 24;
- 32;
- 40;
- 48;
- 64.

The exact scale may differ by project, but spacing must feel systematic.

Avoid arbitrary gaps such as 13 px, 27 px, and 31 px throughout the same UI unless required by geometry.

Align content to a clear grid.

Give important sections enough breathing room.

Do not confuse "modern" with "oversized". Dense professional applications may require compact spacing, but compact spacing must still be orderly and readable.

---

## 10. Color system

Do not default to:

> white background + gray cards + blue buttons

Define semantic color roles instead of scattering raw colors through components.

At minimum, a mature UI usually needs roles equivalent to:

- background;
- surface;
- surface-subtle;
- surface-elevated;
- surface-hover;
- border;
- border-subtle;
- text-primary;
- text-secondary;
- text-tertiary;
- accent;
- accent-hover;
- accent-active;
- success;
- warning;
- danger;
- info.

Color should communicate meaning.

Avoid using accent color everywhere.

Use neutral surfaces and spacing to carry most of the interface.

Do not rely on color alone to communicate status.

---

## 11. Design tokens

When a project does not already have an equivalent system, prefer design tokens for repeated values.

Typical token groups:

### Color

- background;
- surface;
- elevated surface;
- text levels;
- borders;
- accents;
- semantic states.

### Radius

- small;
- medium;
- large;
- extra-large;
- pill.

### Spacing

- compact;
- normal;
- relaxed;
- section-level spacing.

### Elevation

- subtle;
- floating;
- modal / overlay.

### Motion

- fast;
- normal;
- slow;
- standard easing;
- emphasized easing.

### Typography

- display;
- title;
- heading;
- body;
- label;
- caption.

Do not create token abstractions for values that are genuinely one-off.

---

## 12. Surfaces, borders, and depth

A premium interface should not look like a collection of bordered rectangles.

Prefer separation through:

- whitespace;
- tonal surface changes;
- alignment;
- typography;
- subtle elevation.

Borders should usually be low-contrast.

Use stronger borders only when they communicate an interaction boundary or state.

Depth may be created with:

- subtle shadows;
- layered surfaces;
- controlled blur;
- soft highlights;
- restrained gradients;
- background tonal variation.

Do not use all of these at once.

---

## 13. Glassmorphism

Glass effects are optional, not a default design language.

Use blur/translucency selectively for elements such as:

- floating navigation;
- command bars;
- overlays;
- popovers;
- modal surfaces;
- media controls.

Avoid making every card transparent.

If readability is reduced, remove the effect.

---

## 14. Border radius

Use a small, intentional radius system.

Example direction:

- small controls: 8 px;
- inputs / medium controls: 10–12 px;
- cards / panels: 14–18 px;
- large feature surfaces: 20–24 px;
- pills: fully rounded.

These are examples, not mandatory values.

Do not give every object an exaggerated 24–32 px radius.

The interface should not look inflated or toy-like unless that is explicitly the intended brand.

---

## 15. Buttons and controls

Provide clear control hierarchy.

Typical button levels:

- primary;
- secondary;
- tertiary;
- ghost;
- destructive.

Support appropriate states:

- default;
- hover;
- active / pressed;
- focus;
- disabled;
- loading.

Primary actions should be obvious without making every action primary.

Avoid excessive filled buttons.

For repeated low-priority actions, consider:

- icon buttons;
- context menus;
- inline actions;
- overflow menus;
- command bars.

Controls must have consistent height, icon treatment, padding, and focus behavior.

---

## 16. Forms

Inputs must feel intentionally designed.

Support states such as:

- default;
- hover;
- focus;
- filled;
- invalid;
- disabled;
- read-only where relevant.

Labels, hints, validation messages, and required states must be clear.

Do not use placeholders as the only label for important fields.

Keep related fields grouped.

For complex forms, prefer sections and progressive disclosure instead of one enormous uninterrupted form.

---

## 17. Navigation

Navigation should reflect product structure.

Possible patterns:

- sidebar;
- top navigation;
- tabs;
- segmented control;
- breadcrumbs;
- command palette;
- contextual navigation.

Active state should be more than a random color change.

It may use:

- background treatment;
- indicator;
- weight;
- icon treatment;
- subtle motion.

Do not overload navigation with decorative elements.

On smaller screens, navigation should transform appropriately rather than merely shrink.

---

## 18. Cards

Cards are not a universal layout primitive.

Use a card when content represents:

- a distinct entity;
- a compact functional module;
- a grouped object with its own actions;
- a preview that benefits from separation.

Do not create a card around every heading and paragraph.

Avoid dashboards composed entirely of identical rounded rectangles.

Vary structure according to content:

- list rows for repeated records;
- tables for comparison;
- panels for tools;
- sections for content;
- cards for true card-like entities.

---

## 19. Tables and data-heavy interfaces

Professional operational software often benefits from data-dense layouts.

For tables:

- keep columns aligned;
- prioritize scannability;
- reduce visual noise;
- keep row actions predictable;
- use sticky headers when useful;
- use truncation carefully;
- expose full values through tooltip or detail view where needed;
- distinguish selected, hovered, disabled, stale, warning, and error rows.

Do not turn a useful desktop table into giant cards purely for aesthetic reasons.

On narrow screens, choose the best transformation for the data:

- horizontal scroll;
- priority columns;
- stacked detail rows;
- list view;
- drill-down detail.

Do not blindly stack every cell.

---

## 20. Status design

Statuses must be easy to scan.

A good status may combine:

- label;
- semantic color;
- icon or dot;
- weight;
- background treatment;
- time/state indicator when meaningful.

Do not rely on color alone.

Do not give every status equal visual prominence.

Examples:

- active attention state → clearly visible;
- waiting / pending → visible but not alarming;
- completed → positive but restrained;
- neutral / not required → visually quiet;
- error / blocked → strong enough to demand attention.

Status wording should be concise and unambiguous.

---

## 21. Icons

Use one coherent icon family.

Examples:

- Lucide;
- platform-native symbols;
- an existing project icon set.

Keep stroke weight and sizing consistent.

Do not mix multiple unrelated icon styles.

Do not use emoji as interface icons unless the product specifically calls for emoji.

Icons should clarify an action or state, not merely decorate empty space.

---

## 22. Motion and micro-interactions

A modern interface should feel responsive and alive, but not theatrical.

Use motion to explain:

- hover;
- press;
- selection;
- opening;
- closing;
- movement between states;
- successful completion;
- status change;
- loading;
- drag/drop;
- panel transition.

Typical UI transitions are often in the range of roughly 120–250 ms.

Longer transitions may be appropriate for larger spatial changes.

Prefer:

- opacity;
- transform;
- scale;
- clipping;
- subtle blur changes.

Avoid unnecessary layout-thrashing animation.

Do not animate every element simultaneously.

Respect reduced-motion preferences where applicable.

---

## 23. Hover and pressed states

Interactive elements should provide immediate feedback.

A hover state may combine small changes in:

- background;
- border;
- shadow;
- text/icon contrast;
- translation of 1–2 px;
- scale;
- opacity.

Pressed state should feel distinct from hover.

Do not create distracting jumps.

Touch-first interfaces must not depend on hover to communicate essential functionality.

---

## 24. Loading, empty, success, and error states

A polished product includes the states between the happy paths.

Design:

- initial loading;
- background refresh;
- skeletons where useful;
- empty states;
- no search results;
- partial data;
- offline state where relevant;
- permission denied;
- retryable error;
- fatal error;
- success confirmation;
- disabled states.

Avoid generic "Something went wrong" if actionable information can be provided.

Do not show a full-page spinner for every minor operation.

Use optimistic updates only when they are safe and recoverable.

---

## 25. Overlays and dialogs

Use the smallest interaction surface appropriate to the task.

Prefer:

- tooltip for explanation;
- popover for compact contextual controls;
- dropdown for choice;
- side panel for contextual editing;
- modal for focused blocking tasks;
- full page for complex workflows.

Do not open a modal for every interaction.

Modals must have clear:

- title;
- purpose;
- primary action;
- secondary/cancel action;
- close behavior;
- keyboard behavior where relevant.

Dangerous actions require deliberate confirmation when the consequence is meaningful.

---

## 26. Responsive behavior

Responsive design means recomposition, not shrinking.

Consider:

- desktop;
- laptop;
- tablet;
- mobile.

Depending on the product:

- sidebars may become drawers;
- toolbars may collapse;
- secondary actions may move into overflow;
- split views may become drill-down navigation;
- large tables may prioritize key columns;
- panels may become bottom sheets;
- dense desktop controls may become touch-sized mobile controls.

Do not preserve a desktop layout at miniature scale.

If the product is primarily mobile, design mobile structure first and progressively enhance larger breakpoints.

If the product is primarily a desktop operational tool, preserve useful density instead of artificially making it mobile-like.

---

## 27. Dark mode

Dark mode is a separate surface system, not a color inversion.

Define dark-mode values for:

- background;
- surfaces;
- elevated surfaces;
- borders;
- text hierarchy;
- accent contrast;
- shadows;
- semantic states.

Avoid pure black for every large surface unless the product deliberately uses OLED-black styling.

Maintain contrast without creating a harsh black-and-white interface.

Effects that work in light mode may require different opacity or elevation in dark mode.

---

## 28. Accessibility

Do not sacrifice usability for visual novelty.

At minimum:

- maintain readable contrast;
- support keyboard focus where appropriate;
- use visible focus states;
- provide accessible labels for icon-only controls;
- avoid color-only state communication;
- preserve semantic HTML where relevant;
- maintain touch targets appropriate to the platform;
- respect reduced motion where supported;
- keep text readable at common scaling levels.

Accessibility should be built into the component behavior, not added only after visual design is finished.

---

## 29. Performance

Visual quality must not make the product feel heavy.

Avoid:

- unnecessary giant dependencies;
- large unoptimized background videos;
- expensive blur across huge areas;
- uncontrolled shadow layers;
- excessive re-renders;
- animation that blocks interaction;
- unnecessary 3D or WebGL when a simpler solution is sufficient.

Heavy visual effects require a clear product benefit.

Prefer lightweight polish over spectacle.

---

## 30. 3D, illustration, and rich media

Use 3D or rich visual media when it materially improves the experience, such as:

- product visualization;
- spatial concepts;
- architecture/interior presentation;
- interactive product demos;
- hero storytelling where visual identity depends on it.

Do not add 3D merely to make a page appear advanced.

When 3D is central:

- preserve fast initial loading;
- provide graceful fallback;
- optimize models and textures;
- avoid blocking critical navigation;
- make interaction obvious;
- keep UI controls visually separate from the scene.

---

## 31. Copy and interface language

UI copy should be:

- concise;
- specific;
- natural;
- consistent.

Buttons should describe actions.

Prefer:

- "Save changes"
- "Register response"
- "Create request"

over vague labels such as:

- "OK"
- "Proceed"
- "Continue"

when a more precise action is available.

Status terms should use the same wording everywhere.

Do not overfill screens with explanatory text when hierarchy and labels can make the interface self-explanatory.

---

## 32. Anti-template / anti-AI rules

Avoid the visual patterns that make generated interfaces look generic.

Do not default to:

- purple-blue gradient backgrounds;
- giant gradient hero sections;
- glow behind every element;
- glass cards everywhere;
- bento grids without a content reason;
- identical cards repeated across the whole page;
- huge headings that push useful content below the fold;
- oversized rounded corners on every object;
- excessive pill-shaped controls;
- random gradients;
- generic analytics charts used as decoration;
- fake metrics;
- emoji as application icons;
- multiple icon families;
- arbitrary shadows;
- excessive badges;
- floating blobs and decorative circles;
- unnecessary "AI product" aesthetics;
- a dashboard template merely because the application has data.

Do not make an interface look modern by making it visually louder.

Modern product design should feel intentional, calm, and precise.

---

## 33. Avoid cosmetic-only redesigns

When asked to modernize an existing interface, do not limit the work to:

- changing colors;
- increasing border radius;
- adding shadows;
- changing the font;
- applying blur;
- adding transitions.

These may be part of the solution, but they are not the solution.

Review the layout itself.

Ask:

- Is the most important information visually obvious?
- Are related actions grouped?
- Are statuses understandable?
- Is there unnecessary chrome?
- Are users forced to scan too much?
- Is the navigation appropriate?
- Does the page structure match the workflow?

Improve structure before decoration.

---

## 34. Existing projects: change discipline

For an existing project:

1. inspect before editing;
2. reuse existing components when they are sound;
3. extend the design system instead of creating one-off styles;
4. do not rewrite business logic without need;
5. do not replace framework/tooling without need;
6. do not run or modify unrelated migrations;
7. avoid broad refactors during a narrow UI task;
8. preserve existing keyboard shortcuts and interaction contracts unless explicitly changing them;
9. keep the diff scoped;
10. document any unavoidable behavior change.

A visual task should remain primarily a visual task.

---

## 35. New projects

For a new UI project, establish a minimal design foundation early:

- typography;
- color tokens;
- spacing;
- radius;
- buttons;
- form controls;
- navigation;
- status treatment;
- overlay behavior;
- responsive rules;
- motion rules.

Do not build dozens of abstract components before real screens exist.

Build the design system from actual product needs.

---

## 36. References and screenshots

When the user supplies screenshots, mockups, photos, or product references:

- treat them as important input;
- identify what specifically should be preserved;
- identify what should be modernized;
- do not copy irrelevant visual details;
- do not invent a completely different product unless asked.

When the user says "in the style of Apple / Yandex / Sber", interpret that as:

- quality;
- restraint;
- hierarchy;
- spacing;
- polished motion;
- refined typography;
- strong product thinking.

Do not produce a visual clone.

---

## 37. Validation after implementation

After a meaningful UI change, verify the result at the level appropriate to the task.

Check:

- visual hierarchy;
- alignment;
- spacing consistency;
- typography;
- control states;
- responsive behavior;
- empty/loading/error states touched by the change;
- light/dark mode if affected;
- keyboard/focus behavior if affected;
- regressions in the edited flow.

Prefer targeted checks and targeted tests for the changed area.

Do not automatically run the entire test suite for a small isolated UI change unless:

- project instructions require it;
- the change is broad;
- shared infrastructure changed;
- targeted checks are insufficient.

Do not modify unrelated failing tests during a UI task unless explicitly requested.

---

## 38. Completion standard

Before considering a UI task complete, ask whether the result looks and behaves like a real product rather than a styled prototype.

The final result should feel:

- coherent;
- intentional;
- polished;
- readable;
- responsive;
- fast;
- predictable;
- visually current;
- consistent with the project's purpose.

If the interface still looks generic, do not add more decoration first.

Improve, in order:

1. composition;
2. information hierarchy;
3. typography;
4. spacing;
5. component structure;
6. state communication;
7. responsive behavior;
8. micro-interactions;
9. decorative effects.

---

## 39. Agent shorthand

For coding agents, the practical rule is:

> Build or modify UI as a polished contemporary product, not as a generic template. Preserve working logic, respect project-specific references, establish clear hierarchy and a coherent design system, use restrained modern visual effects, implement all relevant states, keep responsive behavior intentional, and avoid unrelated refactors.

This document is the canonical detailed interpretation of that rule.
