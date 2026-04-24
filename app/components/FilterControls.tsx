"use client";

import type { BrowserMode } from "./RecipeBrowser";

/**
 * Recipe-browser toolbar: mode toggle on the first row, free-text search on
 * the second, and tier chips on the third. Folded inside the browser card —
 * every control here narrows the list below.
 */
export function FilterControls({
    mode,
    onModeChange,
    query,
    onQueryChange,
    tiers,
    tierFilter,
    onTierChange,
    counterLabel,
}: {
    mode: BrowserMode;
    onModeChange: (m: BrowserMode) => void;
    query: string;
    onQueryChange: (q: string) => void;
    tiers: number[];
    tierFilter: number | null;
    onTierChange: (t: number | null) => void;
    counterLabel: string;
}) {
    return (
        <div className="space-y-3">
            <div className="flex items-center justify-between gap-3">
                <div className="inline-flex items-center bg-zinc-950/60 border border-zinc-800 rounded-full p-0.5">
                    <ModeButton
                        active={mode === "output"}
                        onClick={() => onModeChange("output")}
                        label="By Metal"
                    />
                    <ModeButton
                        active={mode === "input"}
                        onClick={() => onModeChange("input")}
                        label="By Input"
                    />
                </div>
                <span className="text-[11px] font-mono tabular-nums text-zinc-500">
                    {counterLabel}
                </span>
            </div>

            <div className="relative">
                <SearchIcon />
                <input
                    type="search"
                    placeholder="Search recipes, materials, items…"
                    value={query}
                    onChange={(e) => onQueryChange(e.target.value)}
                    className="w-full bg-zinc-950/60 border border-zinc-800 rounded-lg pl-9 pr-3 py-2 text-sm text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:border-amber-500/40 focus:ring-2 focus:ring-amber-500/15 transition-colors"
                />
            </div>

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
            className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                active
                    ? "bg-zinc-800 text-zinc-100"
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
            className={`text-[11px] px-2.5 py-1 rounded-full border transition-colors font-medium ${
                active
                    ? "bg-amber-500/15 border-amber-500/40 text-amber-200"
                    : "bg-zinc-950/50 text-zinc-400 border-zinc-800 hover:border-zinc-700 hover:text-zinc-200"
            }`}
        >
            {label}
        </button>
    );
}

function SearchIcon() {
    return (
        <svg
            className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500"
            viewBox="0 0 20 20"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden
        >
            <circle cx="9" cy="9" r="6" />
            <path d="m14 14 4 4" />
        </svg>
    );
}
