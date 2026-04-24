"use client";

import Image from "next/image";
import { getMove } from "../lib/moves";
import type { Move } from "../types";

type Step = { i: number; move: Move; prev: number; next: number };

/**
 * Visualises a solver-produced sequence as a strip of step cards, with each
 * card showing the operation icon, its delta, and the cumulative work value
 * after applying it.
 */
export function SolutionSteps({
    solution,
    start,
}: {
    solution: string[];
    start: number;
}) {
    const steps = solution.reduce<Step[]>((acc, name, i) => {
        const move = getMove(name);
        const prev = acc.length > 0 ? acc[acc.length - 1].next : start;
        acc.push({ i, move, prev, next: prev + move.delta });
        return acc;
    }, []);

    const finalValue = steps.length ? steps[steps.length - 1].next : start;

    return (
        <div className="rounded-lg border border-zinc-800 bg-zinc-900/60 p-3 space-y-3">
            <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2 text-zinc-400">
                    <span className="font-mono text-zinc-300">{start}</span>
                    <span>→</span>
                    <span className="font-mono text-emerald-300">{finalValue}</span>
                </div>
                <div className="text-zinc-500">
                    {steps.length} step{steps.length === 1 ? "" : "s"}
                </div>
            </div>

            <div className="flex flex-wrap gap-2">
                {steps.map(({ i, move, next }) => (
                    <div
                        key={i}
                        className="flex flex-col items-center bg-zinc-950/80 border border-zinc-800 rounded-lg px-2 py-2 min-w-[72px]"
                    >
                        <Image
                            src={move.icon}
                            alt={move.label}
                            width={32}
                            height={32}
                            unoptimized
                            style={{ imageRendering: "pixelated" }}
                        />
                        <div className="text-[10px] text-zinc-400 mt-1">{move.label}</div>
                        <div
                            className={`text-xs font-mono mt-0.5 ${
                                move.delta < 0 ? "text-rose-300" : "text-emerald-300"
                            }`}
                        >
                            {move.delta > 0 ? `+${move.delta}` : move.delta}
                        </div>
                        <div className="text-[10px] text-zinc-500 font-mono mt-1">
                            = {next}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
