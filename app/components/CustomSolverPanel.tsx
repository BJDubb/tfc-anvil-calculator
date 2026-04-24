"use client";

import { RuleEditor } from "./RuleEditor";
import { SolutionSteps } from "./SolutionSteps";
import {
    NoSolutionNotice,
    NumericField,
    Section,
} from "./SolverPanel";
import type { Constraint } from "../types";

/**
 * Alternative to <SolverPanel /> for the "custom setup" mode. Swaps the
 * recipe hero + read-only rule display for a full rule editor and a plain
 * (non-auto) target input — so you can solve scenarios that don't match any
 * recipe in the dataset (odd starting values, user-supplied seeds, etc.).
 */
export function CustomSolverPanel({
    constraints,
    onConstraintsChange,
    start,
    onStartChange,
    target,
    onTargetChange,
    solution,
}: {
    constraints: Constraint[];
    onConstraintsChange: (c: Constraint[]) => void;
    start: number;
    onStartChange: (n: number) => void;
    target: number;
    onTargetChange: (n: number) => void;
    solution: string[] | null;
}) {
    return (
        <div className="p-5 sm:p-6 space-y-6">
            <CustomHero />

            <Section label="Rules">
                <RuleEditor
                    constraints={constraints}
                    onConstraintsChange={onConstraintsChange}
                />
            </Section>

            <div className="grid grid-cols-2 gap-3">
                <NumericField label="Start" value={start} onChange={onStartChange} />
                <NumericField label="Target" value={target} onChange={onTargetChange} />
            </div>

            <Section label="Forging sequence">
                {solution ? (
                    <SolutionSteps solution={solution} start={start} target={target} />
                ) : (
                    <NoSolutionNotice />
                )}
            </Section>
        </div>
    );
}

function CustomHero() {
    return (
        <div className="relative overflow-hidden rounded-xl border border-amber-500/15 bg-gradient-to-br from-amber-500/[0.06] via-zinc-900/50 to-zinc-950/40 p-4 sm:p-5">
            <div
                aria-hidden
                className="pointer-events-none absolute -top-10 left-1/2 -translate-x-1/2 w-48 h-32 rounded-full bg-amber-500/15 blur-3xl"
            />
            <div className="relative flex items-center gap-3">
                <div className="shrink-0 w-10 h-10 rounded-lg bg-amber-500/15 border border-amber-500/25 text-amber-200 flex items-center justify-center">
                    <svg
                        viewBox="0 0 20 20"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className="w-4 h-4"
                        aria-hidden
                    >
                        <path d="M4 13.5V16h2.5L15 7.5 12.5 5 4 13.5zM13.5 4L16 6.5" />
                    </svg>
                </div>
                <div className="min-w-0">
                    <div className="text-[10px] uppercase tracking-[0.15em] text-zinc-400 font-semibold">
                        Custom setup
                    </div>
                    <div className="text-sm text-zinc-100 mt-0.5 leading-snug">
                        Define your own rules and target. Useful for scenarios the
                        calculator doesn&apos;t cover out of the box.
                    </div>
                </div>
            </div>
        </div>
    );
}
