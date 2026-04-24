"use client";

import type { Modpack } from "../types";

/**
 * Page masthead: title + tagline on the left, modpack toggle + recipe count
 * on the right. The tagline and the "which pack is this for" copy swap based
 * on the current modpack selection.
 */
export function Header({
    modpack,
    onModpackChange,
    recipeCount,
}: {
    modpack: Modpack;
    onModpackChange: (m: Modpack) => void;
    recipeCount: number;
}) {
    return (
        <header className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 border-b border-zinc-800 pb-6">
            <div>
                <h1 className="text-3xl sm:text-4xl font-bold tracking-tight bg-gradient-to-r from-amber-300 via-orange-300 to-rose-300 bg-clip-text text-transparent">
                    TFC Anvil Calculator
                </h1>
                <p className="text-sm text-zinc-400 mt-1">
                    Find the sequence of operations to forge any{" "}
                    {modpack === "tfg" ? "TerraFirmaGreg-Modern" : "TerraFirmaCraft"} item.
                </p>
            </div>
            <div className="flex flex-col sm:items-end gap-2">
                <div className="flex bg-zinc-900 border border-zinc-800 rounded-lg p-1 w-fit text-xs">
                    <ModpackButton
                        active={modpack === "tfc"}
                        onClick={() => onModpackChange("tfc")}
                        title="Vanilla TerraFirmaCraft recipes"
                        label="Vanilla TFC"
                    />
                    <ModpackButton
                        active={modpack === "tfg"}
                        onClick={() => onModpackChange("tfg")}
                        title="TerraFirmaGreg-Modern overrides"
                        label="TFG-Modern"
                    />
                </div>
                <div className="text-xs text-zinc-500">
                    {recipeCount.toLocaleString()} recipes loaded
                </div>
            </div>
        </header>
    );
}

function ModpackButton({
    active,
    onClick,
    title,
    label,
}: {
    active: boolean;
    onClick: () => void;
    title: string;
    label: string;
}) {
    return (
        <button
            onClick={onClick}
            className={`px-2.5 py-1 rounded-md transition ${
                active
                    ? "bg-zinc-700 text-white shadow"
                    : "text-zinc-400 hover:text-zinc-200"
            }`}
            title={title}
        >
            {label}
        </button>
    );
}
