"use client";

import type { Modpack } from "../types";
import { WorldSeedInput } from "./WorldSeedInput";

/**
 * Page masthead: anvil glyph + title + tagline + "N recipes" pill on the
 * left; modpack toggle + world seed input on the right. The world seed lives
 * here because it affects every recipe — it's a top-level setting, not a
 * solver-panel detail.
 */
export function Header({
    modpack,
    onModpackChange,
    recipeCount,
    worldSeed,
    onWorldSeedChange,
}: {
    modpack: Modpack;
    onModpackChange: (m: Modpack) => void;
    recipeCount: number;
    worldSeed: string;
    onWorldSeedChange: (v: string) => void;
}) {
    return (
        <header className="flex flex-col xl:flex-row xl:items-end xl:justify-between gap-6 pb-8 border-b border-zinc-800/70">
            <div className="space-y-3 min-w-0">
                <div className="flex items-center gap-3">
                    <AnvilGlyph />
                    <h1 className="text-3xl sm:text-4xl font-bold tracking-tight bg-gradient-to-br from-amber-200 via-orange-300 to-rose-300 bg-clip-text text-transparent">
                        TFC Anvil Calculator
                    </h1>
                </div>
                <p className="text-sm text-zinc-400 max-w-xl leading-relaxed">
                    Plan the exact sequence of operations to forge any{" "}
                    <span className="text-amber-300/90 font-medium">
                        {modpack === "tfg" ? "TerraFirmaGreg-Modern" : "TerraFirmaCraft"}
                    </span>{" "}
                    item — target values are derived from your world seed using the same
                    PRNG the game runs.
                </p>
                <CountPill count={recipeCount} />
            </div>

            <div className="flex flex-col sm:flex-row xl:flex-col gap-3 sm:items-start xl:items-end shrink-0">
                <ModpackToggle modpack={modpack} onChange={onModpackChange} />
                <WorldSeedInput value={worldSeed} onChange={onWorldSeedChange} />
            </div>
        </header>
    );
}

// -----------------------------------------------------------------------------
// Internal building blocks
// -----------------------------------------------------------------------------

function AnvilGlyph() {
    return (
        <div className="shrink-0 w-11 h-11 sm:w-12 sm:h-12 rounded-xl bg-gradient-to-br from-amber-500/20 via-orange-500/10 to-rose-500/10 border border-amber-500/25 flex items-center justify-center text-amber-200 shadow-inner shadow-amber-500/10">
            <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="w-6 h-6"
                aria-hidden
            >
                <path d="M4 9h12l3 3M4 9v2h11v3h-5v2h9v-2M4 9V7m0 2v2m16 1v2" />
            </svg>
        </div>
    );
}

function CountPill({ count }: { count: number }) {
    return (
        <span className="inline-flex items-center gap-1.5 text-xs text-zinc-300 bg-zinc-900/70 border border-zinc-800 rounded-full px-2.5 py-1 w-fit">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.8)]" />
            {count.toLocaleString()} recipes loaded
        </span>
    );
}

function ModpackToggle({
    modpack,
    onChange,
}: {
    modpack: Modpack;
    onChange: (m: Modpack) => void;
}) {
    return (
        <div className="inline-flex items-center bg-zinc-900/70 border border-zinc-800 rounded-full p-1 text-xs shrink-0">
            <Pick active={modpack === "tfc"} onClick={() => onChange("tfc")}>
                Vanilla TFC
            </Pick>
            <Pick active={modpack === "tfg"} onClick={() => onChange("tfg")}>
                TFG-Modern
            </Pick>
        </div>
    );
}

function Pick({
    active,
    onClick,
    children,
}: {
    active: boolean;
    onClick: () => void;
    children: React.ReactNode;
}) {
    return (
        <button
            onClick={onClick}
            className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                active
                    ? "bg-gradient-to-b from-amber-400 to-amber-500 text-zinc-950 shadow-sm shadow-amber-500/30"
                    : "text-zinc-400 hover:text-zinc-100"
            }`}
        >
            {children}
        </button>
    );
}
