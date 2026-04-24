"use client";

import Image from "next/image";
import { CATEGORY_ICON, CATEGORY_LABEL, MOVE_CATEGORIES } from "../lib/moves";
import {
    buildConstraints,
    groupConstraints,
    type GroupedConstraints,
} from "../lib/rules";
import type { Constraint, MoveCategory } from "../types";

const SLOT_LABELS = ["3rd last", "2nd last", "Last"] as const;

/**
 * Editable rules surface for the custom-setup panel. Decomposes a
 * `Constraint[]` into the three position slots + two existential sets, lets
 * the user toggle each, and rebuilds a flat `Constraint[]` on every change.
 */
export function RuleEditor({
    constraints,
    onConstraintsChange,
}: {
    constraints: Constraint[];
    onConstraintsChange: (c: Constraint[]) => void;
}) {
    const grouped = groupConstraints(constraints);

    const apply = (next: GroupedConstraints) => {
        onConstraintsChange(buildConstraints(next));
    };

    const setPosition = (slot: number, category: MoveCategory | null) => {
        const nextPos = [...grouped.position];
        nextPos[slot] = category;
        apply({ ...grouped, position: nextPos });
    };

    const toggleAnyOfThree = (category: MoveCategory) => {
        const isOn = grouped.anyOfThree.includes(category);
        apply({
            ...grouped,
            anyOfThree: isOn
                ? grouped.anyOfThree.filter((c) => c !== category)
                : [...grouped.anyOfThree, category],
        });
    };

    const toggleNotLast = (category: MoveCategory) => {
        const isOn = grouped.notLast.includes(category);
        apply({
            ...grouped,
            notLast: isOn
                ? grouped.notLast.filter((c) => c !== category)
                : [...grouped.notLast, category],
        });
    };

    const hasAny =
        grouped.position.some((p) => p !== null) ||
        grouped.anyOfThree.length > 0 ||
        grouped.notLast.length > 0;

    return (
        <div className="space-y-4">
            <div className="space-y-2">
                <SubLabel>Last three moves</SubLabel>
                <div className="space-y-1.5">
                    {grouped.position.map((cat, i) => (
                        <SlotEditorRow
                            key={i}
                            label={SLOT_LABELS[i]}
                            value={cat}
                            isLast={i === 2}
                            onChange={(c) => setPosition(i, c)}
                        />
                    ))}
                </div>
            </div>

            <div className="space-y-2">
                <SubLabel>Must include (any position in last 3)</SubLabel>
                <CategoryMultiSelect
                    selected={grouped.anyOfThree}
                    onToggle={toggleAnyOfThree}
                />
            </div>

            <div className="space-y-2">
                <SubLabel>Must include (but not as last move)</SubLabel>
                <CategoryMultiSelect
                    selected={grouped.notLast}
                    onToggle={toggleNotLast}
                />
            </div>

            {hasAny && (
                <button
                    onClick={() =>
                        apply({
                            position: [null, null, null],
                            anyOfThree: [],
                            notLast: [],
                        })
                    }
                    className="text-[11px] text-zinc-500 hover:text-zinc-200 underline-offset-2 hover:underline transition-colors"
                >
                    Clear all rules
                </button>
            )}
        </div>
    );
}

// -----------------------------------------------------------------------------
// Internal building blocks
// -----------------------------------------------------------------------------

function SubLabel({ children }: { children: React.ReactNode }) {
    return (
        <div className="text-[10px] uppercase tracking-wider text-zinc-500 font-semibold">
            {children}
        </div>
    );
}

function SlotEditorRow({
    label,
    value,
    isLast,
    onChange,
}: {
    label: string;
    value: MoveCategory | null;
    isLast: boolean;
    onChange: (c: MoveCategory | null) => void;
}) {
    return (
        <div className="flex items-center gap-2">
            <span
                className={`text-[10px] uppercase tracking-wider font-semibold w-16 shrink-0 ${
                    isLast ? "text-amber-200/80" : "text-zinc-500"
                }`}
            >
                {label}
            </span>
            <div className="flex gap-1 flex-wrap">
                <SlotOption
                    isSelected={value === null}
                    onClick={() => onChange(null)}
                    title="Any"
                    isLast={isLast}
                >
                    <span className="text-zinc-500 text-base leading-none">—</span>
                </SlotOption>
                {MOVE_CATEGORIES.map((cat) => (
                    <SlotOption
                        key={cat}
                        isSelected={value === cat}
                        onClick={() => onChange(cat)}
                        title={CATEGORY_LABEL[cat]}
                        isLast={isLast}
                    >
                        <Image
                            src={CATEGORY_ICON[cat]}
                            alt={CATEGORY_LABEL[cat]}
                            width={20}
                            height={20}
                            unoptimized
                            style={{ imageRendering: "pixelated" }}
                        />
                    </SlotOption>
                ))}
            </div>
        </div>
    );
}

function SlotOption({
    isSelected,
    onClick,
    title,
    isLast,
    children,
}: {
    isSelected: boolean;
    onClick: () => void;
    title: string;
    isLast: boolean;
    children: React.ReactNode;
}) {
    return (
        <button
            type="button"
            onClick={onClick}
            title={title}
            className={`w-9 h-9 p-1 rounded-md border flex items-center justify-center transition-colors ${
                isSelected
                    ? isLast
                        ? "bg-amber-500/15 border-amber-500/50 shadow-[0_0_12px_-4px_rgba(245,158,11,0.45)]"
                        : "bg-zinc-800 border-zinc-500"
                    : "bg-zinc-950/60 border-zinc-800 hover:border-zinc-700"
            }`}
        >
            {children}
        </button>
    );
}

function CategoryMultiSelect({
    selected,
    onToggle,
}: {
    selected: MoveCategory[];
    onToggle: (c: MoveCategory) => void;
}) {
    return (
        <div className="flex gap-1 flex-wrap">
            {MOVE_CATEGORIES.map((cat) => {
                const isOn = selected.includes(cat);
                return (
                    <button
                        key={cat}
                        type="button"
                        onClick={() => onToggle(cat)}
                        className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-md border transition-colors text-xs ${
                            isOn
                                ? "bg-amber-500/15 border-amber-500/40 text-amber-100"
                                : "bg-zinc-950/60 border-zinc-800 text-zinc-400 hover:border-zinc-700 hover:text-zinc-200"
                        }`}
                    >
                        <Image
                            src={CATEGORY_ICON[cat]}
                            alt=""
                            width={16}
                            height={16}
                            unoptimized
                            style={{ imageRendering: "pixelated" }}
                        />
                        {CATEGORY_LABEL[cat]}
                    </button>
                );
            })}
        </div>
    );
}
