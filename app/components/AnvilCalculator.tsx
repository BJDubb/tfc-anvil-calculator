"use client";

import { useMemo, useState } from "react";
import { anvilRecipes } from "../recipes";
import { applyTfgOverrides } from "../recipes-tfg";
import { computeTfcAnvilTarget } from "../anvil-target";
import { inputDisplayId, prettyName, recipeKey } from "../lib/display";
import { parseRule } from "../lib/rules";
import { solve } from "../lib/solver";
import { useModpack, useWorldSeed } from "../lib/storage";
import type { Constraint, Modpack, Recipe } from "../types";
import { EmptySolverPlaceholder } from "./EmptySolverPlaceholder";
import { FilterControls } from "./FilterControls";
import { Header } from "./Header";
import { RecipeBrowser, type BrowserMode } from "./RecipeBrowser";
import { SolverPanel } from "./SolverPanel";
import { WorldSeedInput } from "./WorldSeedInput";

// Base recipes from the scraped dataset + the TFG-Modern overlay. Both lists
// are derived once at module load so toggling between modpacks is free.
const RECIPES_BY_MODPACK: Record<Modpack, Recipe[]> = {
    tfc: anvilRecipes,
    tfg: applyTfgOverrides(anvilRecipes),
};

// Manual target overrides. Tagged with the recipe they apply to so switching
// recipes automatically falls back to the auto-computed target.
type TargetSelection =
    | { kind: "auto" }
    | { kind: "manual"; value: number; forRecipe: string };

/**
 * Stateful orchestrator for the entire calculator UI. Owns selection / filter
 * state, derives the filtered recipe list and the deterministic target, and
 * wires everything into the RecipeBrowser + SolverPanel leaf components.
 */
export function AnvilCalculator() {
    const [mode, setMode] = useState<BrowserMode>("output");
    const [query, setQuery] = useState("");
    const [tierFilter, setTierFilter] = useState<number | null>(null);
    const [selectedInput, setSelectedInput] = useState<string | null>(null);
    const [selectedRecipe, setSelectedRecipe] = useState<string | null>(null);
    const [start, setStart] = useState(0);
    const [targetSelection, setTargetSelection] = useState<TargetSelection>({
        kind: "auto",
    });

    const [worldSeed, setWorldSeed] = useWorldSeed();
    const [modpack, setModpack] = useModpack();

    const activeRecipes = RECIPES_BY_MODPACK[modpack];

    const filteredRecipes = useMemo(() => {
        const q = query.trim().toLowerCase();
        return activeRecipes.filter((r) => {
            if (tierFilter !== null && r.tier !== tierFilter) return false;
            if (!q) return true;
            const haystack = [
                r.recipe,
                r.result.item,
                inputDisplayId(r.input),
                prettyName(r.result.item),
                prettyName(inputDisplayId(r.input)),
            ]
                .join(" ")
                .toLowerCase();
            return haystack.includes(q);
        });
    }, [query, tierFilter, activeRecipes]);

    const recipe = useMemo(
        () => activeRecipes.find((r) => recipeKey(r) === selectedRecipe) ?? null,
        [selectedRecipe, activeRecipes]
    );

    const constraints = useMemo<Constraint[]>(() => {
        if (!recipe) return [];
        return recipe.rules
            .map(parseRule)
            .filter((c): c is Constraint => c !== null);
    }, [recipe]);

    // Deterministic target derived from (world seed, recipe id). TFC hashes
    // the recipe's ResourceLocation — *not* the output item id — so the same
    // recipe in vanilla TFC and TFG-Modern yields the same target even when
    // TFG swaps the output item. Only defined when a recipe is selected and
    // the seed parses; otherwise the solver falls back to 0 / manual input.
    const autoTarget = useMemo(() => {
        if (!recipe) return null;
        const trimmed = worldSeed.trim();
        if (!trimmed) return null;
        try {
            return computeTfcAnvilTarget(trimmed, recipe.id);
        } catch {
            return null;
        }
    }, [recipe, worldSeed]);

    // Effective target = manual override for *this* recipe, otherwise the
    // auto value, otherwise 0. Switching recipes drops the override.
    const manualTargetForThisRecipe =
        targetSelection.kind === "manual" &&
        selectedRecipe !== null &&
        targetSelection.forRecipe === selectedRecipe
            ? targetSelection.value
            : null;

    const target = manualTargetForThisRecipe ?? autoTarget ?? 0;
    const targetOverridden =
        manualTargetForThisRecipe !== null &&
        autoTarget !== null &&
        manualTargetForThisRecipe !== autoTarget;

    const solution = useMemo(() => {
        if (!recipe) return null;
        return solve(start, target, constraints);
    }, [recipe, start, target, constraints]);

    const tiers = useMemo(
        () => Array.from(new Set(activeRecipes.map((r) => r.tier))).sort((a, b) => a - b),
        [activeRecipes]
    );

    return (
        <>
            <Header
                modpack={modpack}
                onModpackChange={setModpack}
                recipeCount={activeRecipes.length}
            />

            <FilterControls
                mode={mode}
                onModeChange={(next) => {
                    setMode(next);
                    if (next === "output") setSelectedInput(null);
                }}
                query={query}
                onQueryChange={setQuery}
                tiers={tiers}
                tierFilter={tierFilter}
                onTierChange={setTierFilter}
            />

            <WorldSeedInput value={worldSeed} onChange={setWorldSeed} />

            <div className="grid lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] gap-6">
                <RecipeBrowser
                    mode={mode}
                    filteredRecipes={filteredRecipes}
                    totalRecipes={activeRecipes.length}
                    selectedRecipe={selectedRecipe}
                    onSelectRecipe={setSelectedRecipe}
                    selectedInput={selectedInput}
                    onSelectInput={setSelectedInput}
                />

                <div className="rounded-xl border border-zinc-800 bg-zinc-900/30 overflow-hidden">
                    {!recipe ? (
                        <EmptySolverPlaceholder />
                    ) : (
                        <SolverPanel
                            recipe={recipe}
                            constraints={constraints}
                            solution={solution}
                            start={start}
                            target={target}
                            autoTarget={autoTarget}
                            targetOverridden={targetOverridden}
                            onStartChange={setStart}
                            onTargetChange={(n) => {
                                if (selectedRecipe) {
                                    setTargetSelection({
                                        kind: "manual",
                                        value: n,
                                        forRecipe: selectedRecipe,
                                    });
                                }
                            }}
                            onResetTarget={() => setTargetSelection({ kind: "auto" })}
                        />
                    )}
                </div>
            </div>
        </>
    );
}
