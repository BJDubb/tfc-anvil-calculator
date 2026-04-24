// TerraFirmaGreg-Modern recipe overlay.
//
// TFG programmatically rewrites a subset of TFC's anvil recipes in
// `kubejs/server_scripts/tfg/ores_and_materials/recipes.material_tag_prefixes.js`
// via an `addAnvilRecipe(event, output, input, steps, bonus, material, suffix)`
// helper. That helper registers each rewrite under the ID
// `tfc:anvil/${materialName}_${suffix}` — i.e. the *same* IDs TFC already
// uses — so TFC's own JSON recipes are shadowed at datapack load.
//
// In addition to changing the rule set, the helper swaps the output from
// TFC's part item (`tfc:metal/rod/brass`) to GregTech's (`gtceu:brass_rod`),
// which changes the deterministic target value that TFC computes
// (target depends on the output item registry key).
//
// This module reproduces that rewrite at runtime so a "TerraFirmaGreg-Modern"
// UI toggle can switch the calculator between vanilla TFC behaviour and TFG's.
//
// Source of truth:
//   kubejs/server_scripts/tfg/ores_and_materials/recipes.material_tag_prefixes.js
//   kubejs/server_scripts/tfg/ores_and_materials/recipes.materials.js

import type { Recipe } from "./types";

// Suffix -> rules produced by TFG's generators.
// Keep keys ordered longest-first so multi-part suffixes (e.g. `_bars_double`)
// match before their shorter prefixes (`_bars`).
const TFG_RULES_BY_SUFFIX: { suffix: string; rules: string[] }[] = [
    { suffix: "_buzzsaw_blade", rules: ["bend_last", "hit_second_last", "draw_third_last"] },
    { suffix: "_small_spring", rules: ["hit_last", "bend_second_last", "bend_third_last"] },
    { suffix: "_small_gear",   rules: ["hit_last", "shrink_second_last", "draw_third_last"] },
    { suffix: "_bars_double",  rules: ["upset_last", "punch_second_last", "punch_third_last"] },
    { suffix: "_trapdoor",     rules: ["bend_last", "draw_second_last", "draw_third_last"] },
    { suffix: "_nugget",       rules: ["punch_last", "hit_second_last", "punch_third_last"] },
    { suffix: "_screw",        rules: ["punch_last", "punch_second_last", "shrink_third_last"] },
    { suffix: "_spring",       rules: ["hit_last", "bend_second_last", "bend_third_last"] },
    { suffix: "_sheet",        rules: ["hit_last", "hit_second_last", "hit_third_last"] },
    { suffix: "_bolt",         rules: ["punch_last", "draw_second_last", "draw_third_last"] },
    { suffix: "_bars",         rules: ["upset_last", "punch_second_last", "punch_third_last"] },
    { suffix: "_ring",         rules: ["hit_last", "hit_second_last", "hit_third_last"] },
    { suffix: "_rod",          rules: ["draw_last"] },
];

// Materials that both TFC and GregTech register (i.e. materials for which
// TFG's `processX` emitters actually produce an override — TFG only emits
// when GT's ChemicalHelper returns a non-empty stack for the tag prefix).
//
// Conservative list: only materials known to exist in GregTech-CEu's default
// registry. TFC-exclusive alloys (black_steel, blue_steel, red_steel,
// high_carbon_*, wrought_iron_grill, etc.) are left alone — TFG does not
// override them.
const TFG_GT_MATERIALS: ReadonlySet<string> = new Set([
    "aluminium",
    "bismuth",
    "bismuth_bronze",
    "black_bronze",
    "brass",
    "bronze",
    "cast_iron",
    "chromium",
    "copper",
    "gold",
    "lead",
    "nickel",
    "platinum",
    "rose_gold",
    "silver",
    "stainless_steel",
    "steel",
    "sterling_silver",
    "tin",
    "wrought_iron",
    "zinc",
]);

// Reverse map: GT part suffix -> TFC output-item path fragment.
// TFG's generated output is `gtceu:${material}_${suffix without underscore}`
// for most parts. `_bars_double` and `_small_*` don't round-trip cleanly but
// we never need them for target computation since there are no TFC recipes
// producing those items in the base dataset.
const GT_OUTPUT_BY_SUFFIX: Record<string, (mat: string) => string> = {
    _rod: (m) => `gtceu:${m}_rod`,
    _bolt: (m) => `gtceu:${m}_bolt`,
    _screw: (m) => `gtceu:${m}_screw`,
    _ring: (m) => `gtceu:${m}_ring`,
    _sheet: (m) => `gtceu:${m}_plate`,
    _bars: (m) => `gtceu:${m}_bars`,
    _bars_double: (m) => `gtceu:${m}_bars`,
    _nugget: (m) => `gtceu:${m}_nugget`,
    _spring: (m) => `gtceu:${m}_spring`,
    _small_spring: (m) => `gtceu:${m}_spring_small`,
    _small_gear: (m) => `gtceu:${m}_gear_small`,
    _buzzsaw_blade: (m) => `gtceu:${m}_buzz_saw_blade`,
    _trapdoor: (m) => `tfc:metal/trapdoor/${m}`,
};

type Override = { rules: string[]; outputItem: string | null };

// TFG's KubeJS helper only rewrites recipes registered under `tfc:anvil/`.
// Addon mods (AFC, alekiships, …) ship their own anvil recipes under their
// own namespaces and are not overridden.
const TFC_ANVIL_PREFIX = "tfc:anvil/";

/**
 * Look at a recipe's id (e.g. `"tfc:anvil/brass_rod"`) and return the TFG
 * rewrite for it, or `null` if TFG leaves this recipe alone.
 */
function matchTfgOverride(recipeId: string): Override | null {
    if (!recipeId.startsWith(TFC_ANVIL_PREFIX)) return null;
    const recipeName = recipeId.slice(TFC_ANVIL_PREFIX.length);
    for (const { suffix, rules } of TFG_RULES_BY_SUFFIX) {
        if (!recipeName.endsWith(suffix)) continue;
        const material = recipeName.slice(0, -suffix.length);
        if (!TFG_GT_MATERIALS.has(material)) return null;
        const outputFn = GT_OUTPUT_BY_SUFFIX[suffix];
        return {
            rules,
            outputItem: outputFn ? outputFn(material) : null,
        };
    }
    return null;
}

/**
 * Produce the TFG-adjusted recipe list. Recipes that TFG does not touch are
 * returned unchanged (same reference).
 */
export function applyTfgOverrides(recipes: Recipe[]): Recipe[] {
    return recipes.map((r) => {
        const override = matchTfgOverride(r.id);
        if (!override) return r;

        // Preserve the TFC-based icon path so icons still resolve — we don't
        // ship GregTech icons in public/icons/. The display still reads
        // correctly because the result's pretty name is derived from the
        // recipe's final path segment (`gtceu:brass_rod` -> "Brass Rod").
        const preservedIcon =
            r.result.icon ?? `${r.result.item.replace(/[:\/]/g, "_")}.png`;

        return {
            ...r,
            rules: override.rules,
            result: {
                item: override.outputItem ?? r.result.item,
                icon: preservedIcon,
            },
        };
    });
}
