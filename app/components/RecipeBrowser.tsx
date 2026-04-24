"use client";

import { Fragment, useMemo } from "react";
import { ItemIcon } from "./ItemIcon";
import { FilterControls } from "./FilterControls";
import {
    inputDisplayId,
    inputIconUrl,
    materialOf,
    prettyName,
    recipeKey,
    resultIconUrl,
    tierClass,
    titleCase,
} from "../lib/display";
import {
    METAL_PROGRESSION_OTHER,
    metalGroupSortKey,
    progressionBannerLabel,
    progressionStepForMaterial,
} from "../lib/metal-progression";
import type { Recipe, RecipeInput } from "../types";

export type BrowserMode = "output" | "input";

type MetalGroup = {
    material: string;
    tier: number;
    /** 0–5 = known progression band, 100 = other / unknown */
    progressionStep: number;
    recipes: Recipe[];
};

type Props = {
    // Filter state
    mode: BrowserMode;
    onModeChange: (m: BrowserMode) => void;
    query: string;
    onQueryChange: (q: string) => void;
    tiers: number[];
    tierFilter: number | null;
    onTierChange: (t: number | null) => void;
    // List data + selection
    filteredRecipes: Recipe[];
    totalRecipes: number;
    selectedRecipe: string | null;
    onSelectRecipe: (key: string) => void;
    selectedInput: string | null;
    onSelectInput: (id: string | null) => void;
    // Custom-setup entry
    customSelected: boolean;
    onSelectCustom: () => void;
    // Favourites (recipe ids)
    favouriteIds: string[];
    onToggleFavourite: (recipeId: string) => void;
};

/**
 * Left-hand recipe list with its own filter toolbar at the top and a
 * "Custom setup" entry pinned at the very top. In "output" (By Metal) mode
 * it groups recipes by material with metals ordered along the linear
 * progression (copper → bronze → wrought iron → steel → black steel →
 * red/blue steel), with section banners between eras. In "input" mode it
 * lists every unique ingredient first, then drills into the recipes sharing
 * that input when one is picked.
 */
export function RecipeBrowser({
    mode,
    onModeChange,
    query,
    onQueryChange,
    tiers,
    tierFilter,
    onTierChange,
    filteredRecipes,
    totalRecipes,
    selectedRecipe,
    onSelectRecipe,
    selectedInput,
    onSelectInput,
    customSelected,
    onSelectCustom,
    favouriteIds,
    onToggleFavourite,
}: Props) {
    const filteredById = useMemo(() => {
        const m = new Map<string, Recipe>();
        for (const r of filteredRecipes) m.set(r.id, r);
        return m;
    }, [filteredRecipes]);

    const favouriteRecipes = useMemo(
        () =>
            favouriteIds
                .map((id) => filteredById.get(id))
                .filter((r): r is Recipe => r !== undefined),
        [favouriteIds, filteredById]
    );

    // "By Metal": group by material, sort by linear progression then name.
    const grouped = useMemo((): MetalGroup[] => {
        if (mode !== "output") return [];
        const map = new Map<string, { tier: number; recipes: Recipe[] }>();
        for (const r of filteredRecipes) {
            const material = materialOf(inputDisplayId(r.input));
            const entry = map.get(material);
            if (entry) {
                entry.recipes.push(r);
                entry.tier = Math.min(entry.tier, r.tier);
            } else {
                map.set(material, { tier: r.tier, recipes: [r] });
            }
        }
        return Array.from(map.entries())
            .map(([material, { tier, recipes }]) => ({
                material,
                tier,
                progressionStep:
                    progressionStepForMaterial(material) ?? METAL_PROGRESSION_OTHER,
                recipes: recipes.sort((a, b) =>
                    prettyName(a.result.item).localeCompare(prettyName(b.result.item))
                ),
            }))
            .sort((a, b) => {
                const ka = metalGroupSortKey(a.material, a.tier);
                const kb = metalGroupSortKey(b.material, b.tier);
                for (let i = 0; i < 3; i++) {
                    if (ka[i] !== kb[i]) return ka[i] < kb[i] ? -1 : 1;
                }
                return 0;
            });
    }, [filteredRecipes, mode]);

    // "By Input": one card per unique input id.
    const uniqueInputs = useMemo(() => {
        if (mode !== "input") return [];
        const seen = new Map<string, RecipeInput>();
        for (const r of filteredRecipes) {
            const key = inputDisplayId(r.input);
            if (!seen.has(key)) seen.set(key, r.input);
        }
        return Array.from(seen.entries())
            .sort((a, b) => prettyName(a[0]).localeCompare(prettyName(b[0])))
            .map(([id, input]) => ({ id, input }));
    }, [filteredRecipes, mode]);

    const recipesForSelectedInput = useMemo(() => {
        if (!selectedInput) return [];
        return filteredRecipes.filter(
            (r) => inputDisplayId(r.input) === selectedInput
        );
    }, [filteredRecipes, selectedInput]);

    const counterLabel =
        mode === "output"
            ? `${filteredRecipes.length} / ${totalRecipes}`
            : `${uniqueInputs.length} inputs`;

    return (
        <div className="rounded-2xl border border-zinc-800/70 bg-zinc-900/40 ring-1 ring-white/[0.03] shadow-2xl shadow-black/40 overflow-hidden flex flex-col max-h-[calc(100vh-10rem)] min-h-[520px]">
            <div className="p-4 border-b border-zinc-800/70 bg-gradient-to-b from-zinc-900/70 to-transparent">
                <FilterControls
                    mode={mode}
                    onModeChange={onModeChange}
                    query={query}
                    onQueryChange={onQueryChange}
                    tiers={tiers}
                    tierFilter={tierFilter}
                    onTierChange={onTierChange}
                    counterLabel={counterLabel}
                />
            </div>

            <div className="flex-1 overflow-y-auto overflow-x-hidden p-3 space-y-5">
                <CustomSetupRow selected={customSelected} onClick={onSelectCustom} />

                {favouriteRecipes.length > 0 && (
                    <section className="space-y-2">
                        <div className="flex items-center gap-2 px-1">
                            <span className="text-amber-400 text-sm leading-none" aria-hidden>
                                ★
                            </span>
                            <span className="text-[11px] font-semibold uppercase tracking-[0.15em] text-zinc-400">
                                Favourites
                            </span>
                            <span className="text-[10px] font-mono tabular-nums text-zinc-600">
                                {favouriteRecipes.length}
                            </span>
                        </div>
                        <div className="space-y-1.5">
                            {favouriteRecipes.map((r) => (
                                <RecipeRow
                                    key={recipeKey(r)}
                                    recipe={r}
                                    isSelected={selectedRecipe === recipeKey(r)}
                                    onSelect={onSelectRecipe}
                                    isFavourite
                                    onToggleFavourite={() => onToggleFavourite(r.id)}
                                />
                            ))}
                        </div>
                    </section>
                )}

                {mode === "output" && grouped.length === 0 && <NoMatches />}

                {mode === "output" &&
                    grouped.map((group, i) => {
                        const prev = grouped[i - 1];
                        const showBanner =
                            !prev || prev.progressionStep !== group.progressionStep;
                        return (
                            <Fragment key={group.material}>
                                {showBanner && (
                                    <ProgressionBanner
                                        label={progressionBannerLabel(
                                            group.progressionStep
                                        )}
                                    />
                                )}
                                <section>
                                    <GroupHeader
                                        label={titleCase(group.material)}
                                        tier={group.tier}
                                        count={group.recipes.length}
                                    />
                                    <div className="space-y-1.5">
                                        {group.recipes.map((r) => (
                                            <RecipeRow
                                                key={recipeKey(r)}
                                                recipe={r}
                                                isSelected={
                                                    selectedRecipe === recipeKey(r)
                                                }
                                                onSelect={onSelectRecipe}
                                                isFavourite={favouriteIds.includes(
                                                    r.id
                                                )}
                                                onToggleFavourite={() =>
                                                    onToggleFavourite(r.id)
                                                }
                                            />
                                        ))}
                                    </div>
                                </section>
                            </Fragment>
                        );
                    })}

                {mode === "input" && !selectedInput && (
                    <>
                        {uniqueInputs.length === 0 && <NoMatches />}
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                            {uniqueInputs.map(({ id, input }) => (
                                <button
                                    key={id}
                                    onClick={() => onSelectInput(id)}
                                    className="group flex items-center gap-2 p-2 rounded-lg border bg-zinc-950/50 border-zinc-800 hover:bg-zinc-900 hover:border-zinc-700 transition-colors text-left"
                                >
                                    <ItemIcon src={inputIconUrl(input)} alt={id} size={32} />
                                    <span className="text-xs text-zinc-200 truncate group-hover:text-white">
                                        {prettyName(id)}
                                    </span>
                                </button>
                            ))}
                        </div>
                    </>
                )}

                {mode === "input" && selectedInput && (
                    <div className="space-y-2">
                        <button
                            onClick={() => onSelectInput(null)}
                            className="inline-flex items-center gap-1 text-xs text-zinc-400 hover:text-zinc-100 transition-colors"
                        >
                            <svg
                                className="w-3.5 h-3.5"
                                viewBox="0 0 20 20"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                aria-hidden
                            >
                                <path d="M12 15L7 10l5-5" />
                            </svg>
                            Back to materials
                        </button>
                        <div className="flex items-center gap-3 p-2.5 rounded-xl bg-zinc-950/60 border border-zinc-800">
                            <ItemIcon
                                src={inputIconUrl(
                                    recipesForSelectedInput[0]?.input ?? {
                                        type: "item",
                                        item: selectedInput,
                                        icon: null,
                                    }
                                )}
                                alt={selectedInput}
                                size={36}
                            />
                            <div className="min-w-0 flex-1">
                                <div className="text-[10px] uppercase tracking-[0.15em] text-zinc-500 font-semibold">
                                    Input
                                </div>
                                <div className="text-sm font-medium truncate">
                                    {prettyName(selectedInput)}
                                </div>
                            </div>
                            {recipesForSelectedInput[0] && (
                                <span
                                    className={`shrink-0 text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full border ${tierClass(
                                        recipesForSelectedInput[0].tier
                                    )}`}
                                >
                                    Tier {recipesForSelectedInput[0].tier}
                                </span>
                            )}
                        </div>
                        <div className="space-y-1.5">
                            {recipesForSelectedInput.map((r) => (
                                <RecipeRow
                                    key={recipeKey(r)}
                                    recipe={r}
                                    isSelected={selectedRecipe === recipeKey(r)}
                                    onSelect={onSelectRecipe}
                                    isFavourite={favouriteIds.includes(r.id)}
                                    onToggleFavourite={() => onToggleFavourite(r.id)}
                                />
                            ))}
                            {recipesForSelectedInput.length === 0 && <NoMatches />}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

// -----------------------------------------------------------------------------
// Internal building blocks
// -----------------------------------------------------------------------------

function ProgressionBanner({ label }: { label: string }) {
    return (
        <div className="sticky top-0 z-[11] -mx-3 px-3 py-2.5 mt-1 first:mt-0 bg-gradient-to-r from-amber-500/10 via-zinc-950/95 to-zinc-950/95 backdrop-blur-md border-y border-amber-500/20">
            <span className="text-[11px] font-semibold uppercase tracking-[0.2em] text-amber-200/95">
                {label}
            </span>
        </div>
    );
}

const TIER_BAR: Record<number, string> = {
    0: "bg-stone-400",
    1: "bg-amber-400",
    2: "bg-orange-400",
    3: "bg-zinc-300",
    4: "bg-sky-400",
    5: "bg-violet-400",
    6: "bg-rose-400",
};

function tierBarClass(tier: number): string {
    return TIER_BAR[tier] ?? "bg-zinc-400";
}

function GroupHeader({
    label,
    tier,
    count,
}: {
    label: string;
    tier: number;
    count: number;
}) {
    return (
        <div className="sticky top-0 -mx-3 px-3 py-2 mb-2 bg-zinc-900/95 backdrop-blur-md border-b border-zinc-800/70 flex items-center gap-2 z-10">
            <span className={`w-1 h-4 rounded-full ${tierBarClass(tier)}`} />
            <span className="text-[11px] uppercase tracking-[0.15em] font-semibold text-zinc-200">
                {label}
            </span>
            <span
                className={`ml-1 text-[9px] font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded border ${tierClass(
                    tier
                )}`}
            >
                T{tier}
            </span>
            <span className="ml-auto text-[10px] font-mono tabular-nums text-zinc-500">
                {count}
            </span>
        </div>
    );
}

function NoMatches() {
    return (
        <div className="text-sm text-zinc-500 text-center py-10">
            No recipes match your filter.
        </div>
    );
}

function CustomSetupRow({
    selected,
    onClick,
}: {
    selected: boolean;
    onClick: () => void;
}) {
    return (
        <button
            onClick={onClick}
            className={`group w-full text-left rounded-xl border transition-all flex items-center gap-3 p-3 ${
                selected
                    ? "bg-amber-500/10 border-amber-500/40 ring-1 ring-amber-500/30 shadow-[0_0_20px_-8px_rgba(245,158,11,0.35)]"
                    : "bg-zinc-950/50 border-zinc-800 border-dashed hover:bg-zinc-900 hover:border-zinc-700"
            }`}
        >
            <div
                className={`w-9 h-9 shrink-0 rounded-lg flex items-center justify-center transition-colors ${
                    selected
                        ? "bg-amber-500/20 text-amber-200"
                        : "bg-zinc-900 text-zinc-400 group-hover:text-zinc-200"
                }`}
            >
                <svg
                    className="w-4 h-4"
                    viewBox="0 0 20 20"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden
                >
                    <path d="M4 13.5V16h2.5L15 7.5 12.5 5 4 13.5zM13.5 4L16 6.5" />
                </svg>
            </div>
            <div className="flex-1 min-w-0">
                <div
                    className={`text-sm font-medium truncate ${
                        selected ? "text-amber-100" : "text-zinc-100"
                    }`}
                >
                    Custom setup
                </div>
                <div className="text-xs text-zinc-500 truncate">
                    Define your own rules and target
                </div>
            </div>
            {selected && (
                <span className="text-[10px] font-semibold uppercase tracking-wider text-amber-200/90">
                    Active
                </span>
            )}
        </button>
    );
}

function RecipeRow({
    recipe,
    isSelected,
    onSelect,
    isFavourite,
    onToggleFavourite,
}: {
    recipe: Recipe;
    isSelected: boolean;
    onSelect: (key: string) => void;
    isFavourite?: boolean;
    onToggleFavourite?: () => void;
}) {
    const key = recipeKey(recipe);
    return (
        <div
            className={`group w-full rounded-xl border transition-all flex items-stretch ${
                isSelected
                    ? "bg-amber-500/10 border-amber-500/40 ring-1 ring-amber-500/30 shadow-[0_0_20px_-8px_rgba(245,158,11,0.35)]"
                    : "bg-zinc-950/50 border-zinc-800 hover:bg-zinc-900 hover:border-zinc-700"
            }`}
        >
            <button
                type="button"
                onClick={() => onSelect(key)}
                className="flex flex-1 min-w-0 items-center gap-3 p-2.5 text-left"
            >
                <ItemIcon
                    src={inputIconUrl(recipe.input)}
                    alt={inputDisplayId(recipe.input)}
                    size={36}
                />
                <FlowArrow active={isSelected} />
                <ItemIcon
                    src={resultIconUrl(recipe.result)}
                    alt={recipe.result.item}
                    size={36}
                />
                <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-zinc-100 truncate">
                        {prettyName(recipe.result.item)}
                    </div>
                    <div className="text-xs text-zinc-500 truncate">
                        from {prettyName(inputDisplayId(recipe.input))}
                    </div>
                </div>
            </button>
            {onToggleFavourite && (
                <FavouriteStarButton
                    active={!!isFavourite}
                    onClick={onToggleFavourite}
                />
            )}
        </div>
    );
}

function FavouriteStarButton({
    active,
    onClick,
}: {
    active: boolean;
    onClick: () => void;
}) {
    return (
        <button
            type="button"
            onClick={onClick}
            className="shrink-0 self-center mr-1 p-2 rounded-lg text-amber-400/80 hover:bg-amber-500/10 hover:text-amber-300 transition-colors"
            aria-label={active ? "Remove from favourites" : "Add to favourites"}
            aria-pressed={active}
        >
            <svg
                viewBox="0 0 20 20"
                className="w-4 h-4"
                fill={active ? "currentColor" : "none"}
                stroke="currentColor"
                strokeWidth="1.4"
                strokeLinejoin="round"
                aria-hidden
            >
                <path d="M10 2.5l2.35 4.76 5.26.76-3.8 3.7.9 5.24L10 14.9l-4.71 2.48.9-5.24-3.8-3.7 5.26-.76L10 2.5z" />
            </svg>
        </button>
    );
}

function FlowArrow({ active }: { active: boolean }) {
    return (
        <svg
            className={`shrink-0 w-4 h-4 transition-colors ${
                active ? "text-amber-400" : "text-zinc-600 group-hover:text-zinc-500"
            }`}
            viewBox="0 0 20 20"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden
        >
            <path d="M4 10h12M11 5l5 5-5 5" />
        </svg>
    );
}
