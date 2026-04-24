"use client";

/**
 * Placeholder shown when nothing is selected — either pick a recipe from the
 * browser or jump into the custom-setup mode via the inline button.
 */
export function EmptySolverPlaceholder({
    onOpenCustom,
}: {
    onOpenCustom: () => void;
}) {
    return (
        <div className="relative h-full flex flex-col items-center justify-center text-center p-10 min-h-[440px] space-y-5 overflow-hidden">
            <div
                aria-hidden
                className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_60%_40%_at_50%_30%,rgba(245,158,11,0.08),transparent_70%)]"
            />
            <div className="relative">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-amber-500/20 via-orange-500/10 to-rose-500/10 border border-amber-500/25 flex items-center justify-center text-amber-200 shadow-inner shadow-amber-500/10">
                    <svg
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.8"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className="w-9 h-9"
                        aria-hidden
                    >
                        <path d="M4 9h12l3 3M4 9v2h11v3h-5v2h9v-2M4 9V7m0 2v2m16 1v2" />
                    </svg>
                </div>
                <div
                    aria-hidden
                    className="absolute -inset-6 rounded-full bg-amber-500/15 blur-2xl -z-10"
                />
            </div>
            <div className="relative space-y-1 max-w-sm">
                <div className="text-zinc-100 font-medium">
                    Select a recipe to begin
                </div>
                <div className="text-sm text-zinc-500 leading-relaxed">
                    Pick something from the list on the left and we&apos;ll calculate
                    the exact hammer sequence to forge it on your world seed.
                </div>
            </div>
            <div className="relative flex items-center gap-2 text-xs text-zinc-600">
                <span className="h-px w-8 bg-zinc-800" />
                <span>or</span>
                <span className="h-px w-8 bg-zinc-800" />
            </div>
            <button
                onClick={onOpenCustom}
                className="relative inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-zinc-900 border border-zinc-800 hover:border-amber-500/40 hover:bg-zinc-900/80 text-zinc-200 hover:text-white text-sm font-medium transition-colors"
            >
                <svg
                    className="w-4 h-4 text-amber-300"
                    viewBox="0 0 20 20"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden
                >
                    <path d="M4 13.5V16h2.5L15 7.5 12.5 5 4 13.5zM13.5 4L16 6.5" />
                </svg>
                Open custom setup
            </button>
        </div>
    );
}
