// Pure presentational placeholder shown when no recipe is selected. No hooks
// or event handlers, so it doesn't need "use client" and can be rendered on
// the server.

export function EmptySolverPlaceholder() {
    return (
        <div className="h-full flex flex-col items-center justify-center text-center p-10 text-zinc-500 min-h-[300px]">
            <div className="text-4xl mb-3">⚒</div>
            <div className="font-medium text-zinc-300">Select a recipe</div>
            <div className="text-sm mt-1">
                Pick something from the list to see its required operations.
            </div>
        </div>
    );
}
