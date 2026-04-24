"use client";

/**
 * Text input for the player's world seed. Accepts any string so negative or
 * out-of-range values are still typeable; parsing/validation lives in
 * `anvil-target.ts`.
 */
export function WorldSeedInput({
    value,
    onChange,
}: {
    value: string;
    onChange: (v: string) => void;
}) {
    return (
        <div className="flex flex-col sm:flex-row sm:items-center gap-2 bg-zinc-900/40 border border-zinc-800 rounded-lg px-3 py-2">
            <label
                htmlFor="world-seed"
                className="text-[10px] uppercase tracking-wider text-zinc-500 sm:w-28 shrink-0"
            >
                World Seed
            </label>
            <input
                id="world-seed"
                type="text"
                inputMode="numeric"
                autoComplete="off"
                spellCheck={false}
                value={value}
                onChange={(e) => onChange(e.target.value)}
                placeholder="e.g. 123456789 — leave blank to enter targets manually"
                className="flex-1 bg-zinc-950/70 border border-zinc-800 rounded-md px-2 py-1.5 text-sm font-mono placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500/50"
            />
            <span className="text-xs text-zinc-500">
                Targets auto-compute from (seed, item) pair.
            </span>
        </div>
    );
}
