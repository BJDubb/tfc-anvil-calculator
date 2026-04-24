"use client";

/**
 * Compact seed input meant to sit in the header strip alongside the modpack
 * toggle. Accepts any string so negative and out-of-range values are still
 * typeable; parsing / validation lives in `anvil-target.ts`.
 */
export function WorldSeedInput({
    value,
    onChange,
}: {
    value: string;
    onChange: (v: string) => void;
}) {
    return (
        <div className="inline-flex items-center gap-2 bg-zinc-900/70 border border-zinc-800 rounded-full pl-3 pr-1 py-1 text-xs shrink-0 focus-within:border-amber-500/40 focus-within:ring-2 focus-within:ring-amber-500/15 transition-all">
            <label
                htmlFor="world-seed"
                className="text-[10px] uppercase tracking-[0.15em] text-zinc-500 font-semibold shrink-0"
            >
                Seed
            </label>
            <input
                id="world-seed"
                type="text"
                inputMode="numeric"
                autoComplete="off"
                spellCheck={false}
                value={value}
                onChange={(e) => onChange(e.target.value)}
                placeholder="paste from /seed"
                className="bg-transparent w-[180px] sm:w-[220px] text-sm font-mono tabular-nums text-zinc-100 placeholder:text-zinc-600 focus:outline-none py-1"
            />
        </div>
    );
}
