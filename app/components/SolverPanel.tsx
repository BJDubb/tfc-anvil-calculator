"use client";

import { ItemIcon } from "./ItemIcon";
import { SolutionSteps } from "./SolutionSteps";
import {
    inputDisplayId,
    inputIconUrl,
    prettyName,
    resultIconUrl,
    tierClass,
} from "../lib/display";
import { ruleLabel } from "../lib/rules";
import type { Constraint, Recipe } from "../types";

/**
 * Right-hand pane showing a recipe's rules, editable start/target values,
 * and the solver's proposed operation sequence. The auto-computed target
 * (derived from the world seed) is displayed inline and can be overridden
 * by editing the field; a "reset" chip restores the auto value.
 */
export function SolverPanel({
    recipe,
    constraints,
    solution,
    start,
    target,
    autoTarget,
    targetOverridden,
    onStartChange,
    onTargetChange,
    onResetTarget,
}: {
    recipe: Recipe;
    constraints: Constraint[];
    solution: string[] | null;
    start: number;
    target: number;
    autoTarget: number | null;
    targetOverridden: boolean;
    onStartChange: (n: number) => void;
    onTargetChange: (n: number) => void;
    onResetTarget: () => void;
}) {
    const inputLabel = prettyName(inputDisplayId(recipe.input));
    const outputLabel = prettyName(recipe.result.item);

    return (
        <div className="p-5 space-y-5">
            <div className="flex items-center gap-3">
                <div className="flex items-center gap-2 bg-zinc-900/60 border border-zinc-800 rounded-lg px-3 py-2">
                    <ItemIcon
                        src={inputIconUrl(recipe.input)}
                        alt={inputDisplayId(recipe.input)}
                        size={40}
                    />
                    <div>
                        <div className="text-[10px] uppercase tracking-wider text-zinc-500">
                            Input
                        </div>
                        <div className="text-sm font-medium">{inputLabel}</div>
                    </div>
                </div>
                <span className="text-zinc-600">→</span>
                <div className="flex items-center gap-2 bg-zinc-900/60 border border-zinc-800 rounded-lg px-3 py-2 flex-1 min-w-0">
                    <ItemIcon
                        src={resultIconUrl(recipe.result)}
                        alt={recipe.result.item}
                        size={40}
                    />
                    <div className="min-w-0">
                        <div className="text-[10px] uppercase tracking-wider text-zinc-500">
                            Output
                        </div>
                        <div className="text-sm font-medium truncate">{outputLabel}</div>
                    </div>
                </div>
                <span
                    className={`shrink-0 text-[10px] font-semibold uppercase tracking-wider px-2 py-1 rounded-full border ${tierClass(
                        recipe.tier
                    )}`}
                >
                    Tier {recipe.tier}
                </span>
            </div>

            <div>
                <div className="text-xs uppercase tracking-wider text-zinc-500 mb-2">
                    Required rules
                </div>
                <div className="flex flex-wrap gap-1.5">
                    {constraints.length === 0 && (
                        <span className="text-sm text-zinc-500">No special rules.</span>
                    )}
                    {constraints.map((c, i) => (
                        <span
                            key={i}
                            className="text-xs px-2 py-1 rounded-md bg-zinc-900 border border-zinc-800 text-zinc-300"
                        >
                            {ruleLabel(c)}
                        </span>
                    ))}
                </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
                <label className="block">
                    <div className="text-[10px] uppercase tracking-wider text-zinc-500 mb-1">
                        Start
                    </div>
                    <input
                        type="number"
                        value={start}
                        onChange={(e) => onStartChange(Number(e.target.value))}
                        className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500/50"
                    />
                </label>
                <label className="block">
                    <div className="flex items-center justify-between mb-1">
                        <div className="text-[10px] uppercase tracking-wider text-zinc-500">
                            Target
                        </div>
                        {autoTarget !== null && (
                            <div className="flex items-center gap-1.5">
                                <span
                                    className={`text-[10px] font-mono ${
                                        targetOverridden ? "text-amber-400" : "text-emerald-400"
                                    }`}
                                    title={
                                        targetOverridden
                                            ? `Auto-computed target is ${autoTarget}`
                                            : "Auto-computed from world seed"
                                    }
                                >
                                    {targetOverridden ? `auto: ${autoTarget}` : "auto"}
                                </span>
                                {targetOverridden && (
                                    <button
                                        onClick={onResetTarget}
                                        className="text-[10px] px-1.5 py-0.5 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-300 border border-zinc-700"
                                    >
                                        reset
                                    </button>
                                )}
                            </div>
                        )}
                    </div>
                    <input
                        type="number"
                        value={target}
                        onChange={(e) => onTargetChange(Number(e.target.value))}
                        className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500/50"
                    />
                </label>
            </div>

            <div>
                <div className="text-xs uppercase tracking-wider text-zinc-500 mb-2">
                    Solution
                </div>
                {solution ? (
                    <SolutionSteps solution={solution} start={start} />
                ) : (
                    <div className="rounded-lg border border-dashed border-zinc-800 p-4 text-sm text-zinc-500 text-center">
                        No sequence found. Try adjusting start or target.
                    </div>
                )}
            </div>
        </div>
    );
}
