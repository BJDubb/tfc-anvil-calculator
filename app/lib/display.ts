import type { Recipe, RecipeInput, RecipeResult } from "../types";

// Asset prefix for every item icon we resolve. Icons live under
// `/public/icons/...` and are either addressed literally (when the recipe
// knows its icon filename) or derived from the item's registry id.
export const ICONS_ROOT = "/icons";

// Category prefixes that add no information to an item's display name —
// stripped so `tfc:metal/rod/brass` reads as "Brass Rod", not "Metal Rod Brass".
const NOISE_PREFIXES = new Set(["metal", "item", "items", "block", "blocks"]);

export function titleCase(s: string): string {
    return s.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

/**
 * Turn an item/tag id like `tfc:metal/rod/brass` into a readable
 * human-oriented label like "Brass Rod". Strips generic namespace prefixes
 * and reverses the path so the deepest segment (the noun) comes first.
 */
export function prettyName(id: string): string {
    if (!id.includes(":")) return titleCase(id);
    let parts = id
        .split(":")
        .slice(1)
        .join("/")
        .split(/[\/:]/)
        .filter(Boolean);
    if (parts.length === 0) return titleCase(id);
    if (parts.length > 1 && NOISE_PREFIXES.has(parts[0])) {
        parts = parts.slice(1);
    }
    return titleCase(parts.reverse().join(" "));
}

/**
 * The deepest path segment, used as a grouping key ("brass" from
 * `tfc:metal/rod/brass`, or `forge:ingots/brass`).
 */
export function materialOf(id: string): string {
    if (!id.includes(":")) return id;
    const parts = id
        .split(":")
        .slice(1)
        .join("/")
        .split(/[\/:]/)
        .filter(Boolean);
    return parts[parts.length - 1] ?? "unknown";
}

function iconFromItemId(id: string): string {
    return `${ICONS_ROOT}/${id.replace(/[:\/]/g, "_")}.png`;
}

export function inputIconUrl(input: RecipeInput): string {
    if (input.type === "tag") {
        // Tag ingredients display their first concrete item as a stand-in.
        // Icons live flat under `/icons/{item_id_with_underscores}.png`, so we
        // just rely on the per-item resolution path.
        const first = input.items[0];
        if (first) return iconFromItemId(first.item);
        return iconFromItemId(input.tag);
    }
    if (input.icon) return `${ICONS_ROOT}/${input.icon}`;
    return iconFromItemId(input.item);
}

export function resultIconUrl(result: RecipeResult): string {
    if (result.icon) return `${ICONS_ROOT}/${result.icon}`;
    return iconFromItemId(result.item);
}

export function inputDisplayId(input: RecipeInput): string {
    return input.type === "tag" ? input.tag : input.item;
}

/**
 * Stable, globally unique key for a recipe — the full registry id
 * (`tfc:anvil/brass_rod`). Used as a React key and selection id.
 */
export function recipeKey(r: Recipe): string {
    return r.id;
}

const TIER_STYLES: Record<number, string> = {
    0: "bg-stone-700/70 text-stone-200 border-stone-500/50",
    1: "bg-amber-700/40 text-amber-200 border-amber-500/40",
    2: "bg-orange-700/40 text-orange-200 border-orange-500/40",
    3: "bg-zinc-600/60 text-zinc-100 border-zinc-400/40",
    4: "bg-sky-700/40 text-sky-200 border-sky-500/40",
    5: "bg-violet-700/40 text-violet-200 border-violet-500/40",
    6: "bg-rose-700/40 text-rose-200 border-rose-500/40",
};

export function tierClass(tier: number): string {
    return TIER_STYLES[tier] ?? "bg-zinc-700/50 text-zinc-200 border-zinc-500/40";
}
