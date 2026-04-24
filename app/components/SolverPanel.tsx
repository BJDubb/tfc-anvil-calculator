"use client";

import { ItemIcon } from "./ItemIcon";
import { RuleDisplay } from "./RuleDisplay";
import { SolutionSteps } from "./SolutionSteps";
import {
    inputDisplayId,
    inputIconUrl,
    prettyName,
    resultIconUrl,
    tierClass,
} from "../lib/display";
import type { Constraint, Recipe } from "../types";

/**
 * Right-hand pane showing the selected recipe as a hero card (input → output,
 * tier), its required rules, editable start/target values (with the
 * auto-computed target from the world seed inline), and the solver's proposed
 * operation sequence.
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
    isFavourite,
    onToggleFavourite,
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
    isFavourite: boolean;
    onToggleFavourite: () => void;
}) {
    return (
        <div className="p-5 sm:p-6 space-y-6">
            <RecipeHero
                recipe={recipe}
                isFavourite={isFavourite}
                onToggleFavourite={onToggleFavourite}
            />

            <Section label="Required rules">
                <RuleDisplay constraints={constraints} />
            </Section>

            <div className="grid grid-cols-2 gap-3">
                <NumericField label="Start" value={start} onChange={onStartChange} />
                <TargetField
                    value={target}
                    autoValue={autoTarget}
                    overridden={targetOverridden}
                    onChange={onTargetChange}
                    onReset={onResetTarget}
                />
            </div>

            <Section label="Forging sequence">
                {solution ? (
                    <SolutionSteps solution={solution} start={start} target={target} />
                ) : (
                    <NoSolutionNotice hint="Try adjusting the start or target value, or verify the seed matches the one shown by /seed in-game." />
                )}
            </Section>
        </div>
    );
}

// -----------------------------------------------------------------------------
// Internal building blocks
// -----------------------------------------------------------------------------

function RecipeHero({
    recipe,
    isFavourite,
    onToggleFavourite,
}: {
    recipe: Recipe;
    isFavourite: boolean;
    onToggleFavourite: () => void;
}) {
    return (
        <div className="relative overflow-hidden rounded-xl border border-amber-500/15 bg-gradient-to-br from-amber-500/[0.06] via-zinc-900/50 to-zinc-950/40 p-4 sm:p-5">
            {/* ambient glow behind the flow */}
            <div
                aria-hidden
                className="pointer-events-none absolute -top-10 left-1/2 -translate-x-1/2 w-48 h-32 rounded-full bg-amber-500/15 blur-3xl"
            />
            <div className="relative flex items-center justify-between mb-3 gap-2">
                <span className="text-[10px] uppercase tracking-[0.15em] text-zinc-400 font-semibold">
                    Recipe
                </span>
                <div className="flex items-center gap-1.5 shrink-0">
                    <button
                        type="button"
                        onClick={onToggleFavourite}
                        className="p-1.5 rounded-lg text-amber-400/80 hover:bg-amber-500/10 hover:text-amber-300 transition-colors"
                        aria-label={
                            isFavourite ? "Remove from favourites" : "Add to favourites"
                        }
                        aria-pressed={isFavourite}
                    >
                        <svg
                            viewBox="0 0 20 20"
                            className="w-4 h-4"
                            fill={isFavourite ? "currentColor" : "none"}
                            stroke="currentColor"
                            strokeWidth="1.4"
                            strokeLinejoin="round"
                            aria-hidden
                        >
                            <path d="M10 2.5l2.35 4.76 5.26.76-3.8 3.7.9 5.24L10 14.9l-4.71 2.48.9-5.24-3.8-3.7 5.26-.76L10 2.5z" />
                        </svg>
                    </button>
                    <span
                        className={`text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full border ${tierClass(
                            recipe.tier
                        )}`}
                    >
                        Tier {recipe.tier}
                    </span>
                </div>
            </div>
            <div className="relative flex items-center gap-3 sm:gap-4">
                <HeroItem
                    label="Input"
                    id={inputDisplayId(recipe.input)}
                    icon={inputIconUrl(recipe.input)}
                />
                <FlowArrow />
                <HeroItem
                    label="Output"
                    id={recipe.result.item}
                    icon={resultIconUrl(recipe.result)}
                />
            </div>
        </div>
    );
}

function HeroItem({ label, id, icon }: { label: string; id: string; icon: string }) {
    return (
        <div className="flex-1 flex items-center gap-3 min-w-0">
            <div className="shrink-0 p-1.5 rounded-lg bg-zinc-950/70 border border-zinc-800 shadow-inner shadow-black/60">
                <ItemIcon src={icon} alt={id} size={40} />
            </div>
            <div className="min-w-0">
                <div className="text-[10px] uppercase tracking-[0.15em] text-zinc-500 font-semibold">
                    {label}
                </div>
                <div className="text-sm font-medium text-zinc-100 truncate mt-0.5">
                    {prettyName(id)}
                </div>
            </div>
        </div>
    );
}

function FlowArrow() {
    return (
        <svg
            className="shrink-0 w-5 h-5 sm:w-6 sm:h-6 text-amber-400/80"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden
        >
            <path d="M5 12h14M13 6l6 6-6 6" />
        </svg>
    );
}

// Exported so the <CustomSolverPanel /> can reuse the same visual building
// blocks — same type sizes, same focus rings, same empty-state notice.
export function Section({
    label,
    children,
}: {
    label: string;
    children: React.ReactNode;
}) {
    return (
        <div className="space-y-2">
            <h3 className="text-[10px] uppercase tracking-[0.15em] text-zinc-500 font-semibold">
                {label}
            </h3>
            {children}
        </div>
    );
}

export function NumericField({
    label,
    value,
    onChange,
}: {
    label: string;
    value: number;
    onChange: (n: number) => void;
}) {
    return (
        <label className="block">
            <div className="text-[10px] uppercase tracking-[0.15em] text-zinc-500 font-semibold mb-1.5">
                {label}
            </div>
            <input
                type="number"
                value={value}
                onChange={(e) => onChange(Number(e.target.value))}
                className="w-full bg-zinc-950/60 border border-zinc-800 rounded-lg px-3 py-2.5 text-base font-mono tabular-nums text-zinc-100 focus:outline-none focus:border-amber-500/40 focus:ring-2 focus:ring-amber-500/15 transition-colors"
            />
        </label>
    );
}

function TargetField({
    value,
    autoValue,
    overridden,
    onChange,
    onReset,
}: {
    value: number;
    autoValue: number | null;
    overridden: boolean;
    onChange: (n: number) => void;
    onReset: () => void;
}) {
    return (
        <label className="block">
            <div className="flex items-center justify-between mb-1.5 min-h-[14px]">
                <div className="text-[10px] uppercase tracking-[0.15em] text-zinc-500 font-semibold">
                    Target
                </div>
                {autoValue !== null &&
                    (overridden ? (
                        <div className="flex items-center gap-1.5">
                            <span
                                className="text-[10px] font-mono text-amber-300"
                                title={`Auto-computed target is ${autoValue}`}
                            >
                                auto: {autoValue}
                            </span>
                            <button
                                onClick={onReset}
                                className="text-[10px] px-1.5 py-0.5 rounded-md bg-zinc-900 hover:bg-zinc-800 text-zinc-300 hover:text-white border border-zinc-800 hover:border-zinc-700 transition-colors"
                            >
                                reset
                            </button>
                        </div>
                    ) : (
                        <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-300/90 tracking-wide">
                            <span className="w-1 h-1 rounded-full bg-emerald-400 shadow-[0_0_4px_rgba(52,211,153,0.8)]" />
                            AUTO
                        </span>
                    ))}
            </div>
            <input
                type="number"
                value={value}
                onChange={(e) => onChange(Number(e.target.value))}
                className="w-full bg-zinc-950/60 border border-zinc-800 rounded-lg px-3 py-2.5 text-base font-mono tabular-nums text-zinc-100 focus:outline-none focus:border-amber-500/40 focus:ring-2 focus:ring-amber-500/15 transition-colors"
            />
        </label>
    );
}

export function NoSolutionNotice({ hint }: { hint?: string }) {
    return (
        <div className="rounded-xl border border-dashed border-rose-500/30 bg-rose-500/5 p-4 flex items-start gap-3">
            <svg
                className="w-4 h-4 mt-0.5 shrink-0 text-rose-300"
                viewBox="0 0 20 20"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden
            >
                <circle cx="10" cy="10" r="7.5" />
                <path d="M10 6v4m0 3.5v.01" />
            </svg>
            <div className="min-w-0">
                <div className="text-sm font-medium text-rose-100">
                    No valid sequence
                </div>
                <div className="text-xs text-rose-200/60 mt-0.5 leading-relaxed">
                    {hint ??
                        "No sequence hits the target within 25 steps under these rules — try adjusting the start, target, or rule set."}
                </div>
            </div>
        </div>
    );
}
