"use client";

import { useMemo } from "react";
import { ItemIcon } from "./ItemIcon";
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
import type { Recipe, RecipeInput } from "../types";

export type BrowserMode = "output" | "input";

type Props = {
    mode: BrowserMode;
    filteredRecipes: Recipe[];
    totalRecipes: number;
    selectedRecipe: string | null;
    onSelectRecipe: (key: string) => void;
    selectedInput: string | null;
    onSelectInput: (id: string | null) => void;
};

/**
 * Left-hand recipe list. In "output" mode it groups recipes by material;
 * in "input" mode it first lists every unique input (tag or item), then
 * drills into the recipes sharing that input when one is selected.
 */
export function RecipeBrowser({
    mode,
    filteredRecipes,
    totalRecipes,
    selectedRecipe,
    onSelectRecipe,
    selectedInput,
    onSelectInput,
}: Props) {
    // "By Output": group by material derived from the input id.
    const grouped = useMemo(() => {
        if (mode !== "output") return [];
        const map = new Map<string, Recipe[]>();
        for (const r of filteredRecipes) {
            const material = materialOf(inputDisplayId(r.input));
            if (!map.has(material)) map.set(material, []);
            map.get(material)!.push(r);
        }
        return Array.from(map.entries())
            .sort((a, b) => a[0].localeCompare(b[0]))
            .map(([material, recipes]) => ({
                material,
                recipes: recipes.sort((a, b) =>
                    prettyName(a.result.item).localeCompare(prettyName(b.result.item))
                ),
            }));
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
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/30 overflow-hidden flex flex-col max-h-[72vh]">
            <div className="px-4 py-3 border-b border-zinc-800 flex items-center justify-between text-sm">
                <span className="font-medium">
                    {mode === "output" ? "All Recipes" : "Materials"}
                </span>
                <span className="text-xs text-zinc-500">{counterLabel}</span>
            </div>

            <div className="flex-1 overflow-y-auto p-3 space-y-4">
                {mode === "output" &&
                    grouped.map((group) => (
                        <div key={group.material}>
                            <div className="sticky top-0 -mx-3 px-3 py-1 mb-2 bg-zinc-900/90 backdrop-blur text-xs uppercase tracking-wider text-zinc-500 border-b border-zinc-800/70">
                                {titleCase(group.material)}{" "}
                                <span className="text-zinc-600 normal-case">
                                    · {group.recipes.length}
                                </span>
                            </div>
                            <div className="space-y-1.5">
                                {group.recipes.map((r) => (
                                    <RecipeRow
                                        key={recipeKey(r)}
                                        recipe={r}
                                        isSelected={selectedRecipe === recipeKey(r)}
                                        onSelect={onSelectRecipe}
                                    />
                                ))}
                            </div>
                        </div>
                    ))}

                {mode === "output" && grouped.length === 0 && (
                    <div className="text-sm text-zinc-500 text-center py-10">
                        No recipes match your filter.
                    </div>
                )}

                {mode === "input" && !selectedInput && (
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                        {uniqueInputs.map(({ id, input }) => (
                            <button
                                key={id}
                                onClick={() => onSelectInput(id)}
                                className="flex items-center gap-2 p-2 rounded-lg border bg-zinc-900/70 border-zinc-800 hover:bg-zinc-800/80 hover:border-zinc-700 transition text-left"
                            >
                                <ItemIcon src={inputIconUrl(input)} alt={id} size={32} />
                                <span className="text-xs text-zinc-200 truncate">
                                    {prettyName(id)}
                                </span>
                            </button>
                        ))}
                    </div>
                )}

                {mode === "input" && selectedInput && (
                    <div className="space-y-2">
                        <button
                            onClick={() => onSelectInput(null)}
                            className="text-xs text-zinc-400 hover:text-zinc-200 flex items-center gap-1"
                        >
                            ← Back to materials
                        </button>
                        <div className="flex items-center gap-2 p-2 rounded-lg bg-zinc-900/70 border border-zinc-800">
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
                            <div className="text-sm font-medium">
                                {prettyName(selectedInput)}
                            </div>
                        </div>
                        <div className="space-y-1.5">
                            {recipesForSelectedInput.map((r) => (
                                <RecipeRow
                                    key={recipeKey(r)}
                                    recipe={r}
                                    isSelected={selectedRecipe === recipeKey(r)}
                                    onSelect={onSelectRecipe}
                                />
                            ))}
                            {recipesForSelectedInput.length === 0 && (
                                <div className="text-sm text-zinc-500 text-center py-6">
                                    No recipes match your filter for this input.
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

function RecipeRow({
    recipe,
    isSelected,
    onSelect,
}: {
    recipe: Recipe;
    isSelected: boolean;
    onSelect: (key: string) => void;
}) {
    const key = recipeKey(recipe);
    return (
        <button
            onClick={() => onSelect(key)}
            className={`group w-full text-left rounded-lg border transition flex items-center gap-3 p-2.5 ${
                isSelected
                    ? "bg-blue-600/20 border-blue-500 shadow-[0_0_0_1px_rgba(59,130,246,0.6)]"
                    : "bg-zinc-900/70 border-zinc-800 hover:bg-zinc-800/80 hover:border-zinc-700"
            }`}
        >
            <ItemIcon
                src={inputIconUrl(recipe.input)}
                alt={inputDisplayId(recipe.input)}
                size={36}
            />
            <span className="text-zinc-500 text-lg select-none">→</span>
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
            <span
                className={`shrink-0 text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full border ${tierClass(
                    recipe.tier
                )}`}
            >
                T{recipe.tier}
            </span>
        </button>
    );
}
