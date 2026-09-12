# Marketing v4 — the ported design system

These four documents were written in the `thebirdhouse/` workspace (git-ignored here; tag `threadline-marketing-v3`) and describe the visual system, the motion system, the component map and the workspace's own handoff. They are copied verbatim so the production repository carries the reasoning behind the public site.

Path mapping from the workspace to this repository:

| Workspace | Production |
|---|---|
| `styles/{tokens.generated,base,layout,components,sections,scenes,hero-choreo,motion}.css` | `src/styles/marketing/marketing.css` (generated, scoped under `.tl-public`; `.container` → `.mk-container`, `.gap-N` → `.stack-N`) |
| `components/*.tsx` | `src/components/marketing-v4/*.tsx` (`Navbar`, `Footer` rewritten for the production routes; `MaterialTicker` not used) |
| `content/site.ts` | `src/content/marketing-site.ts` (+ `grid`) |
| `design-system/tokens.ts` | `src/content/marketing-tokens.ts` |
| `app/page.tsx` | `src/app/(marketing)/page.tsx` |
| `/playbook` (the Expert Firm LinkedIn Playbook) | not ported — the production Playbook is The Founder Authority System plus its tools |
| `/apply`, `/privacy-policy` | not ported — the production application flow and its server action stay |

Production-only additions (navigation drawer, the six-cell grid, the Playbook tools) are in `src/styles/marketing/marketing-extra.css`, `src/components/marketing-v4/ValueGrid.tsx` and `src/components/marketing-v4/AcquisitionCalculator.tsx`. The decision record is DEC-025; the run record is `HANDOFF.md` §16k.
