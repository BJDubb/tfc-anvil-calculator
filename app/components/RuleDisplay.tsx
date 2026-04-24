"use client";

import Image from "next/image";
import { CATEGORY_ICON, CATEGORY_LABEL } from "../lib/moves";
import { groupConstraints } from "../lib/rules";
import type { Constraint, MoveCategory } from "../types";

const SLOT_LABELS = ["3rd last", "2nd last", "Last"] as const;

/**
 * Visual, read-only representation of a recipe's forge rules. TFC's matcher
 * only inspects the last three moves of a sequence — so we render those as
 * three position slots (3rd last / 2nd last / Last), filled with the
 * category icon when a rule pins that slot, or left empty when the solver
 * is free to pick anything there. Existential rules ("must appear in the
 * last 3", "must appear but not last") are shown as chips below.
 */
export function RuleDisplay({ constraints }: { constraints: Constraint[] }) {
    if (constraints.length === 0) {
        return (
            <p className="text-sm text-zinc-500">
                No special rules — any sequence that hits the target works.
            </p>
        );
    }

    const { position, anyOfThree, notLast } = groupConstraints(constraints);
    const hasPositions = position.some((p) => p !== null);
    const hasExistential = anyOfThree.length > 0 || notLast.length > 0;

    return (
        <div className="space-y-3">
            {hasPositions && <PositionSlotsDisplay slots={position} />}
            {hasExistential && (
                <div className="space-y-1.5">
                    {anyOfThree.length > 0 && (
                        <ExistentialRow
                            label="Must include (any of last 3)"
                            categories={anyOfThree}
                        />
                    )}
                    {notLast.length > 0 && (
                        <ExistentialRow
                            label="Must include (but not last)"
                            categories={notLast}
                        />
                    )}
                </div>
            )}
        </div>
    );
}

// -----------------------------------------------------------------------------
// Internal building blocks
// -----------------------------------------------------------------------------

function PositionSlotsDisplay({ slots }: { slots: (MoveCategory | null)[] }) {
    return (
        <div className="grid grid-cols-3 gap-2">
            {slots.map((cat, i) => (
                <SlotTileDisplay
                    key={i}
                    category={cat}
                    label={SLOT_LABELS[i]}
                    isLast={i === 2}
                />
            ))}
        </div>
    );
}

function SlotTileDisplay({
    category,
    label,
    isLast,
}: {
    category: MoveCategory | null;
    label: string;
    isLast: boolean;
}) {
    const filled = category !== null;
    return (
        <div
            className={`relative rounded-lg border p-2 text-center transition-colors ${
                filled
                    ? isLast
                        ? "bg-amber-500/10 border-amber-500/40"
                        : "bg-zinc-900/70 border-zinc-700"
                    : "bg-zinc-950/40 border-zinc-800 border-dashed"
            }`}
        >
            <div className="flex items-center justify-center h-10">
                {filled ? (
                    <Image
                        src={CATEGORY_ICON[category]}
                        alt={CATEGORY_LABEL[category]}
                        width={32}
                        height={32}
                        unoptimized
                        style={{ imageRendering: "pixelated" }}
                    />
                ) : (
                    <span className="text-zinc-600 text-xl leading-none">—</span>
                )}
            </div>
            <div
                className={`text-[10px] uppercase tracking-wider mt-1.5 font-semibold ${
                    filled
                        ? isLast
                            ? "text-amber-200"
                            : "text-zinc-300"
                        : "text-zinc-600"
                }`}
            >
                {filled ? CATEGORY_LABEL[category] : "Any"}
            </div>
            <div className="text-[9px] uppercase tracking-wider text-zinc-600 mt-0.5">
                {label}
            </div>
        </div>
    );
}

function ExistentialRow({
    label,
    categories,
}: {
    label: string;
    categories: MoveCategory[];
}) {
    return (
        <div className="flex items-center gap-2 flex-wrap">
            <span className="text-[10px] uppercase tracking-wider text-zinc-500 font-semibold shrink-0">
                {label}
            </span>
            <div className="flex gap-1 flex-wrap">
                {categories.map((cat) => (
                    <CategoryChip key={cat} category={cat} />
                ))}
            </div>
        </div>
    );
}

function CategoryChip({ category }: { category: MoveCategory }) {
    return (
        <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-zinc-900 border border-zinc-800 text-xs text-zinc-200">
            <Image
                src={CATEGORY_ICON[category]}
                alt=""
                width={16}
                height={16}
                unoptimized
                style={{ imageRendering: "pixelated" }}
            />
            {CATEGORY_LABEL[category]}
        </span>
    );
}
