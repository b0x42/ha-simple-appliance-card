# Research: Native-Style Card Editor UI

## 1. Component strategy: restyle existing controls vs. adopt `ha-form`/`ha-selector`

**Decision**: Keep the editor's existing component set (`ha-entity-picker`,
`ha-textfield`, `ha-expansion-panel`, a native `<select>` for appliance type)
and achieve the visual match through CSS and light-DOM wrapper markup only. Do
not migrate to Home Assistant's schema-driven `ha-form` + `ha-selector`
stack.

**Rationale**:
- `ha-form`/`ha-selector` is how Home Assistant's own settings screens (and
  Bubble Card, per the reference screenshot) render the filled-row,
  label-above-value look — confirmed via Context7 (`/home-assistant/frontend`,
  `ha-form.ts`): `ha-form` resolves each schema field to an `<ha-selector>`
  child, which is what produces that row styling.
- Adopting it here would mean re-deriving this card's config (add/remove/
  reorder/preset-fill appliance list) as a `ha-form` schema — a structural
  rewrite, not a restyle. The spec (FR-006) explicitly scopes this feature to
  appearance only, with zero behavior change.
- The project has a specific, documented regression to avoid: v0.2.1 shipped
  `ha-select` + `mwc-list-item` for the appliance-type dropdown and it stopped
  responding to clicks in a live dashboard (fixed in v0.2.2 by reverting to a
  native `<select>`, see `src/editor.ts` module doc and spec FR-005/
  Assumptions). `ha-selector-select` wraps the same Material Web Components
  combo-box machinery. Reintroducing it — even indirectly via `ha-form` — is
  the exact failure class the project already paid to remove.
- Constitution Principle V: new runtime dependencies must be justified against
  bundle size and maintenance cost. `ha-form`/`ha-selector` are Home
  Assistant frontend elements (not an npm dependency to bundle), but adopting
  them is still a scope and risk decision the spec doesn't ask for.

**Alternatives considered**:
- *Full `ha-form` migration*: rejected — out of scope, reintroduces the known
  click-regression risk, and forces the config schema through `ha-form`'s
  selector types (fighting this card's list-of-appliances shape, which isn't
  a natural `ha-form` array selector today).
- *New third-party UI library for the row/section chrome*: rejected outright
  — no dependency is justified for CSS that theme variables and existing
  elements already support.

## 2. Section header styling (leading icon + bold title + chevron)

**Decision**: Use `ha-expansion-panel`'s existing `leading-icon` slot to place
an `<ha-icon>` per appliance section; keep `header` as the plain-string
appliance name it already is; rely on the component's own built-in chevron
(no new markup needed for the chevron itself).

**Rationale**: Context7 lookup of `ha-expansion-panel.ts`
(`/home-assistant/frontend`) shows its summary row template is:
`<slot name="leading-icon">`, `<slot name="header">` (defaulting to
`this.header`/`this.secondary`), `<slot name="event">`, `<slot name="icons">`
— i.e. the component already supports exactly the icon-title-chevron layout
in the reference screenshot as a first-class feature, not something to
hand-build. This is a strictly additive change to the existing
`<ha-expansion-panel outlined .header=...>` usage in `src/editor.ts`.

**Alternatives considered**:
- *Custom collapsible `<div>` with hand-rolled icon/title/chevron*: rejected
  — throws away a working, accessible, native HA component (keyboard
  operability, ARIA, animation already handled) to re-implement what it
  already offers via a documented slot.

## 3. Appliance section leading icon source

**Decision**: The leading icon for a collapsed/expanded appliance section is
`appliance.icon` when set, else the same fallback constant the card itself
uses (`mdi:power-plug`, see `DEFAULT_ICON` in
`src/ha-simple-appliance-card.ts`). Unlike the live card, the editor does
**not** also fall back to the entity's own `state.attributes.icon` — the
config-time icon choice is what's being edited, and pulling in the live
entity icon is unrelated to this restyle.

**Rationale**: Reuses an existing, tested constant instead of introducing a
second "default icon" value; matches spec User Story 2 Acceptance Scenario 3
("reasonable fallback ... generic icon").

## 4. Field-row filled/label-above-value styling

**Decision**: `ha-entity-picker` and `ha-textfield` already render as
Material "filled" style controls (grey-filled background, floating
label-above-value) by default in Home Assistant — this is their standard
appearance, not something this card opted into. The visual gap against the
reference screenshot is the *row-level* container: consistent padding,
corner radius, and vertical rhythm between rows (the screenshot's rows read
as a set precisely because they share one border/spacing treatment). This
feature adds a shared `.field-row` wrapper class (CSS only, no new element)
around each field for that consistent container, using
`var(--ha-card-border-radius, 12px)` and theme-provided surface colors,
matching the border/radius treatment `ha-expansion-panel[outlined]` already
uses elsewhere in this file.

**Rationale**: Minimizes changed surface area — no new component, no
behavior change, just a consistent wrapper + spacing/radius rules already
proven elsewhere in this codebase.

## 5. Add-appliance type control restyle

**Decision**: Keep the native `<select data-field="new-appliance-type">`
element exactly as-is for interaction (same tag, same data attribute, same
`change` event contract that `tests/component/editor.test.ts`'s
`selectType()` helper drives). Restyle it purely with CSS: `appearance: none`
on the `<select>` to remove the browser's own chevron, a `.field-row`-style
wrapper matching the other rows, and a decorative (non-interactive,
`pointer-events: none`) chevron icon positioned absolutely inside the
wrapper so it never intercepts clicks meant for the native `<select>`.

**Rationale**: Directly satisfies FR-005 ("MUST NOT reintroduce that failure
mode") — the interactive element stays a real native `<select>`, so its
click/keyboard/native-dropdown behavior is unchanged by the browser; only
non-interactive decoration is layered around it.

**Alternatives considered**:
- *Overlay a styled fake control on top of the `<select>`*: rejected — this
  is structurally how the v0.2.1 regression happened (a styling layer
  fighting the native control's own hit-testing).

## 6. Validating the visual match

**Decision**: There is no automated way to assert "looks like native HA" —
this is validated manually (spec SC-001) by running the card in a real Home
Assistant dev environment (or the project's existing manual dev/demo setup)
and visually comparing against the reference screenshot, in both light and
dark theme. `quickstart.md` documents this as a runnable checklist.
Automated component tests (`tests/component/editor.test.ts`) continue to
assert structure/behavior (selectors, events, classes), not pixels.

**Rationale**: Consistent with constitution Principle II's DOM-behavior test
scope and the project's existing test strategy — visual regression tooling
is not part of this stack and adding one is out of scope for a cosmetic
feature.
