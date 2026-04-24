"use client";

import { useMemo, useState } from "react";
import { anvilRecipes } from "../recipes";
import { applyTfgOverrides } from "../recipes-tfg";
import { computeTfcAnvilTarget } from "../anvil-target";
import { inputDisplayId, prettyName, recipeKey } from "../lib/display";
import { parseRule } from "../lib/rules";
import { solve } from "../lib/solver";
import { useFavouriteRecipes, useModpack, useWorldSeed } from "../lib/storage";
import type { Constraint, Modpack, Recipe } from "../types";
import { CustomSolverPanel } from "./CustomSolverPanel";
import { EmptySolverPlaceholder } from "./EmptySolverPlaceholder";
import { Header } from "./Header";
import { RecipeBrowser, type BrowserMode } from "./RecipeBrowser";
import { SolverPanel } from "./SolverPanel";

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
 * wires everything into the RecipeBrowser + {Solver,CustomSolver}Panel leaf
 * components.
 */
export function AnvilCalculator() {
    // Browser state
    const [mode, setMode] = useState<BrowserMode>("output");
    const [query, setQuery] = useState("");
    const [tierFilter, setTierFilter] = useState<number | null>(null);
    const [selectedInput, setSelectedInput] = useState<string | null>(null);

    // Selection — either a recipe is open, or the custom-setup panel is open,
    // or neither (placeholder). Both kept as separate state so the user's
    // pinned recipe doesn't vanish when they peek at the custom panel.
    const [selectedRecipe, setSelectedRecipe] = useState<string | null>(null);
    const [customMode, setCustomMode] = useState(false);

    // Solver inputs
    const [start, setStart] = useState(0);
    const [targetSelection, setTargetSelection] = useState<TargetSelection>({
        kind: "auto",
    });

    // Custom-mode inputs (independent from recipe-mode target/rules)
    const [customConstraints, setCustomConstraints] = useState<Constraint[]>([]);
    const [customTarget, setCustomTarget] = useState(70);

    const [worldSeed, setWorldSeed] = useWorldSeed();
    const [modpack, setModpack] = useModpack();
    const { favouriteIds, isFavourite, toggleFavourite } = useFavouriteRecipes();

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

    const recipeConstraints = useMemo<Constraint[]>(() => {
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

    const recipeTarget = manualTargetForThisRecipe ?? autoTarget ?? 0;
    const targetOverridden =
        manualTargetForThisRecipe !== null &&
        autoTarget !== null &&
        manualTargetForThisRecipe !== autoTarget;

    // Solve whichever panel is currently active. Custom mode always solves
    // against `customConstraints` + `customTarget`; recipe mode against the
    // parsed recipe rules + the effective target.
    const solution = useMemo(() => {
        if (customMode) return solve(start, customTarget, customConstraints);
        if (recipe) return solve(start, recipeTarget, recipeConstraints);
        return null;
    }, [
        customMode,
        recipe,
        start,
        customTarget,
        customConstraints,
        recipeTarget,
        recipeConstraints,
    ]);

    const tiers = useMemo(
        () => Array.from(new Set(activeRecipes.map((r) => r.tier))).sort((a, b) => a - b),
        [activeRecipes]
    );

    const handleSelectRecipe = (key: string) => {
        setCustomMode(false);
        setSelectedRecipe(key);
    };

    const handleSelectCustom = () => {
        setCustomMode(true);
    };

    return (
        <>
            <Header
                modpack={modpack}
                onModpackChange={setModpack}
                recipeCount={activeRecipes.length}
                worldSeed={worldSeed}
                onWorldSeedChange={setWorldSeed}
            />

            <div className="grid lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] gap-6">
                <RecipeBrowser
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
                    filteredRecipes={filteredRecipes}
                    totalRecipes={activeRecipes.length}
                    selectedRecipe={customMode ? null : selectedRecipe}
                    onSelectRecipe={handleSelectRecipe}
                    selectedInput={selectedInput}
                    onSelectInput={setSelectedInput}
                    customSelected={customMode}
                    onSelectCustom={handleSelectCustom}
                    favouriteIds={favouriteIds}
                    onToggleFavourite={toggleFavourite}
                />

                <div className="lg:sticky lg:top-6 lg:self-start rounded-2xl border border-zinc-800/70 bg-zinc-900/40 ring-1 ring-white/[0.03] shadow-2xl shadow-black/40 overflow-hidden">
                    {customMode ? (
                        <CustomSolverPanel
                            constraints={customConstraints}
                            onConstraintsChange={setCustomConstraints}
                            start={start}
                            onStartChange={setStart}
                            target={customTarget}
                            onTargetChange={setCustomTarget}
                            solution={solution}
                        />
                    ) : !recipe ? (
                        <EmptySolverPlaceholder onOpenCustom={handleSelectCustom} />
                    ) : (
                        <SolverPanel
                            recipe={recipe}
                            constraints={recipeConstraints}
                            solution={solution}
                            start={start}
                            target={recipeTarget}
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
                            isFavourite={isFavourite(recipe.id)}
                            onToggleFavourite={() => toggleFavourite(recipe.id)}
                        />
                    )}
                </div>
            </div>
        </>
    );
}
