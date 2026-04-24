"use client";

import type { BrowserMode } from "./RecipeBrowser";

/**
 * Row above the recipe browser: mode toggle (by output / by input), free-text
 * search, and tier pills. All state lives in the parent; this component is a
 * pure presentational control surface.
 */
export function FilterControls({
    mode,
    onModeChange,
    query,
    onQueryChange,
    tiers,
    tierFilter,
    onTierChange,
}: {
    mode: BrowserMode;
    onModeChange: (m: BrowserMode) => void;
    query: string;
    onQueryChange: (q: string) => void;
    tiers: number[];
    tierFilter: number | null;
    onTierChange: (t: number | null) => void;
}) {
    return (
        <div className="flex flex-col md:flex-row md:items-center gap-3">
            <div className="flex bg-zinc-900 border border-zinc-800 rounded-lg p-1 w-fit">
                <ModeButton
                    active={mode === "output"}
                    onClick={() => onModeChange("output")}
                    label="By Output"
                />
                <ModeButton
                    active={mode === "input"}
                    onClick={() => onModeChange("input")}
                    label="By Input"
                />
            </div>

            <input
                type="search"
                placeholder="Search recipes, materials, items…"
                value={query}
                onChange={(e) => onQueryChange(e.target.value)}
                className="flex-1 bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-sm placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500/50"
            />

            <div className="flex gap-1 flex-wrap">
                <TierPill
                    active={tierFilter === null}
                    onClick={() => onTierChange(null)}
                    label="All"
                />
                {tiers.map((t) => (
                    <TierPill
                        key={t}
                        active={tierFilter === t}
                        onClick={() => onTierChange(tierFilter === t ? null : t)}
                        label={`T${t}`}
                    />
                ))}
            </div>
        </div>
    );
}

function ModeButton({
    active,
    onClick,
    label,
}: {
    active: boolean;
    onClick: () => void;
    label: string;
}) {
    return (
        <button
            onClick={onClick}
            className={`px-3 py-1.5 text-sm rounded-md transition ${
                active
                    ? "bg-zinc-700 text-white shadow"
                    : "text-zinc-400 hover:text-zinc-200"
            }`}
        >
            {label}
        </button>
    );
}

function TierPill({
    active,
    onClick,
    label,
}: {
    active: boolean;
    onClick: () => void;
    label: string;
}) {
    return (
        <button
            onClick={onClick}
            className={`text-xs px-2 py-1 rounded-md border transition ${
                active
                    ? "bg-zinc-200 text-zinc-900 border-zinc-200"
                    : "bg-zinc-900 text-zinc-400 border-zinc-800 hover:border-zinc-700"
            }`}
        >
            {label}
        </button>
    );
}
