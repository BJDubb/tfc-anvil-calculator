# TFC Anvil Calculator

A web tool that plans the sequence of anvil operations needed to forge any
[TerraFirmaCraft](https://github.com/TerraFirmaCraft/TerraFirmaCraft) (TFC)
or [TerraFirmaGreg-Modern](https://github.com/TerraFirmaGreg-Team/Modpack-Modern)
(TFG) item. Plug in your world seed and the calculator will:

1. Derive the per-recipe target work value from `(seed, recipe id)` using the
   same `XoroshiroRandomSource` routine TFC uses server-side.
2. Parse each recipe's forge rules (`draw_last`, `bend_second_last`, …) into
   structured constraints.
3. Solve the shortest sequence of operations (light/medium/heavy hit, draw,
   punch, bend, upset, shrink) that lands on the target while satisfying the
   "last three moves" rule semantics used by TFC's `ForgeRule.matches`.

The TFG-Modern toggle swaps in the recipe overlay produced by TFG's
KubeJS scripts, which rewrite part recipes to use GregTech output items and
different rule sets.

## Development

Install dependencies and start the dev server:

```bash
bun install
bun run dev
```

Then open <http://localhost:3000>.

## Project layout

```
app/
├── page.tsx                       Server-rendered page chrome
├── layout.tsx                     Next.js root layout
├── globals.css                    Tailwind entry
├── types.ts                       Shared type definitions
├── recipes.ts                     Loads the generated anvil recipe dataset
├── recipes-tfg.ts                 Runtime TFG-Modern recipe overlay
├── anvil-target.ts                Deterministic target derivation (Xoroshiro)
├── data/
│   └── anvil-recipes.generated.json   Build-time scrape (do not edit by hand)
├── lib/
│   ├── moves.ts                   The 8 operations + category helpers
│   ├── display.ts                 Name formatting, icon URLs, tier styles
│   ├── rules.ts                   Forge rule parser + labels
│   ├── solver.ts                  Sequence solver (prefix DP + tail DFS)
│   └── storage.ts                 Persisted world seed / modpack hooks
└── components/
    ├── AnvilCalculator.tsx        Client-side state orchestrator
    ├── Header.tsx                 Title + modpack toggle
    ├── FilterControls.tsx         Mode / search / tier pills
    ├── WorldSeedInput.tsx         Persisted seed field
    ├── RecipeBrowser.tsx          Left pane: by-output / by-input list
    ├── SolverPanel.tsx            Right pane: rules, inputs, solution
    ├── SolutionSteps.tsx          Step card strip
    ├── ItemIcon.tsx               Pixel sprite with 404 fallback
    └── EmptySolverPlaceholder.tsx Empty-state for the solver pane

scripts/
└── fetch-recipes.ts               Build-time serverpack → recipes scraper
```

`page.tsx` is a pure server component. All interactive pieces live under
`app/components/`, with `AnvilCalculator` as the single client entry point
that owns state and wires the rest together.

Icons live in `public/icons/` (per-item pixel sprites) and
`public/operations/` (the eight forge-operation icons).

## Refreshing the recipe dataset

Both recipes and item icons are scraped at build time from the published
TerraFirmaGreg-Modern serverpack — nothing is hand-curated. To regenerate
(after a new TFG release, or after switching the source URL in
`scripts/fetch-recipes.ts`):

```bash
bun run fetch-recipes
```

The script:

1. Downloads the serverpack zip (cached under `.cache/`).
2. Walks every `.jar` under `mods/` and extracts every
   `"type": "tfc:anvil"` recipe, resolving tag ingredients by merging every
   mod's tag definitions.
3. For every referenced item, walks its Minecraft item-model chain, reads the
   layer texture reference, and writes the PNG to `public/icons/` under the
   flat `<namespace>_<path>.png` naming convention the runtime expects.

Output: `app/data/anvil-recipes.generated.json` and the contents of
`public/icons/`. Both should be committed. Dynamically-textured items
(GregTech materials, a handful of vanilla Minecraft items that live in the
client jar) fall back to the `?` placeholder in the UI.

The TFG-Modern overlay in `app/recipes-tfg.ts` is hand-ported from the
modpack's KubeJS scripts and applied at runtime on top of the scraped base.
