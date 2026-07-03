## Agent skills

### Issue tracker

Issues are tracked in GitHub Issues for this repo; PRs are not treated as a triage surface. See `docs/agents/issue-tracker.md`.

### Triage labels

Canonical label vocabulary used as-is (no remapping). See `docs/agents/triage-labels.md`.

### Domain docs

Single-context layout: `CONTEXT.md` + `docs/adr/` at the repo root. See `docs/agents/domain.md`.

## React + TypeScript + Tailwind coding standards

- Function components only, typed with explicit `Props` interfaces — no `React.FC`.
- No `any`; prefer precise unions/discriminated unions over broad object types.
- Derive state where possible instead of mirroring it in `useState`; keep state minimal and colocated with where it's used.
- Effects (`useEffect`) are a last resort — reach for them only for real side effects (subscriptions, timers, external syncs), never to derive data.
- Extract a hook when logic is stateful and reused; extract a component when JSX is reused or a section needs its own name to stay readable.
- Tailwind classes only — no inline `style` props, no ad hoc CSS files, unless expressing a value Tailwind can't (e.g. computed dynamic positioning).
- Compose repeated class strings with a helper (e.g. `clsx`/`cva`) rather than string concatenation; don't invent a custom classnames utility.
- Keep className lists readable: layout → spacing → sizing → color/typography → state variants, left to right.
- Name event handlers `onX` (props) / `handleX` (local functions) consistently.
