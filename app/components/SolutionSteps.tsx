"use client";

import Image from "next/image";
import { getMove } from "../lib/moves";
import type { Move } from "../types";

type Step = { i: number; move: Move; prev: number; next: number };

/**
 * Visualises a solver-produced sequence as a strip of numbered step cards.
 * The final card glows emerald when the running value lands exactly on the
 * target — a quick visual "success" cue.
 */
export function SolutionSteps({
    solution,
    start,
    target,
}: {
    solution: string[];
    start: number;
    target: number;
}) {
    const steps = solution.reduce<Step[]>((acc, name, i) => {
        const move = getMove(name);
        const prev = acc.length > 0 ? acc[acc.length - 1].next : start;
        acc.push({ i, move, prev, next: prev + move.delta });
        return acc;
    }, []);

    const finalValue = steps.length ? steps[steps.length - 1].next : start;
    const onTarget = finalValue === target;

    return (
        <div className="rounded-xl border border-zinc-800 bg-zinc-950/60 p-3 sm:p-4 space-y-3">
            <Header
                stepCount={steps.length}
                start={start}
                finalValue={finalValue}
                target={target}
                onTarget={onTarget}
            />

            <div className="flex items-start flex-wrap gap-1.5">
                {steps.map(({ i, move, next }) => (
                    <StepCard
                        key={i}
                        num={i + 1}
                        move={move}
                        value={next}
                        highlight={i === steps.length - 1 && onTarget}
                    />
                ))}
            </div>
        </div>
    );
}

function Header({
    stepCount,
    start,
    finalValue,
    target,
    onTarget,
}: {
    stepCount: number;
    start: number;
    finalValue: number;
    target: number;
    onTarget: boolean;
}) {
    return (
        <div className="flex items-center justify-between gap-3 text-xs">
            <div className="inline-flex items-center gap-2">
                <StepCountBadge count={stepCount} />
                <span className="text-zinc-500">
                    operation{stepCount === 1 ? "" : "s"}
                </span>
            </div>
            <div className="flex items-center gap-1.5 font-mono tabular-nums">
                <span className="text-zinc-400">{start}</span>
                <svg
                    className="w-3 h-3 text-zinc-600"
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
                <span
                    className={
                        onTarget
                            ? "text-emerald-300 font-semibold"
                            : "text-amber-300"
                    }
                >
                    {finalValue}
                </span>
                {!onTarget && (
                    <span className="text-zinc-500 ml-1">
                        (target {target})
                    </span>
                )}
            </div>
        </div>
    );
}

function StepCountBadge({ count }: { count: number }) {
    return (
        <span className="inline-flex items-center justify-center min-w-[24px] h-6 px-2 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-200 text-[11px] font-mono font-semibold tabular-nums">
            {count}
        </span>
    );
}

function StepCard({
    num,
    move,
    value,
    highlight,
}: {
    num: number;
    move: Move;
    value: number;
    highlight: boolean;
}) {
    const positive = move.delta > 0;
    return (
        <div
            className={`relative shrink-0 w-[84px] flex flex-col items-center rounded-lg border px-2 py-2 transition-colors ${
                highlight
                    ? "bg-emerald-500/10 border-emerald-500/40 shadow-[0_0_16px_-4px_rgba(52,211,153,0.4)]"
                    : "bg-zinc-900/70 border-zinc-800"
            }`}
        >
            <div className="flex items-center justify-between w-full mb-1">
                <span className="text-[9px] text-zinc-500 font-mono">#{num}</span>
                <span
                    className={`text-[10px] font-mono font-semibold tabular-nums ${
                        positive ? "text-emerald-300" : "text-rose-300"
                    }`}
                >
                    {positive ? `+${move.delta}` : move.delta}
                </span>
            </div>
            <Image
                src={move.icon}
                alt={move.label}
                width={36}
                height={36}
                unoptimized
                style={{ imageRendering: "pixelated" }}
            />
            <div className="text-[10px] text-zinc-300 mt-1 text-center leading-tight">
                {move.label}
            </div>
            <div
                className={`text-[10px] font-mono tabular-nums mt-1 ${
                    highlight ? "text-emerald-200" : "text-zinc-500"
                }`}
            >
                = {value}
            </div>
        </div>
    );
}
