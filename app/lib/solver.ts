import { MOVES } from "./moves";
import type { Constraint, Move, MoveCategory } from "../types";

// TFC's rule matcher (net.dries007.tfc...ForgeRule.matches + ForgeSteps) only
// inspects the *last three* moves of the sequence:
//
//   _last        -> category at position −1
//   _second_last -> category at position −2
//   _third_last  -> category at position −3
//   _not_last    -> category must appear at position −2 OR −3
//   _any         -> category must appear at position −1, −2, OR −3
//
// Everything before the last 3 moves ("the prefix") is completely
// unconstrained.
//
// Strategy:
//   1. Enumerate candidate total lengths from the minimum implied by the
//      rules up to MAX_STEPS.
//   2. For each length, the tail is the last min(length, 3) moves and the
//      prefix is everything before it. Enumerate every concrete tail
//      assignment (slot -> specific move) that satisfies all rules; there
//      are at most 8^3 = 512 per length before pruning.
//   3. The prefix is unconstrained, so we just need to know whether the
//      remaining delta (`target - start - tailDelta`) is reachable in
//      exactly `prefixLen` moves. We precompute that reachability (plus
//      one concrete witness path per sum) lazily in a small DP table.
//   4. Return the first (shortest) sequence we find.

// Upper bound on sequence length tried by the solver. The prefix is
// unconstrained so very long sequences are rarely useful; 25 comfortably
// covers every recipe in the current dataset (the longest needs 13).
export const MAX_STEPS = 25;

export function solve(
    start: number,
    target: number,
    constraints: Constraint[]
): string[] | null {
    // Slot indices in the "last 3" window: 0 = thirdLast, 1 = secondLast, 2 = last.
    const forced: (MoveCategory | null)[] = [null, null, null];
    const notLastCats: MoveCategory[] = [];
    const anyCats: MoveCategory[] = [];

    for (const c of constraints) {
        if (c.kind === "position") {
            const idx = 3 - c.positionFromEnd;
            const existing = forced[idx];
            if (existing && existing !== c.category) return null; // unresolvable
            forced[idx] = c.category;
        } else if (c.kind === "notLast") {
            if (!notLastCats.includes(c.category)) notLastCats.push(c.category);
        } else {
            if (!anyCats.includes(c.category)) anyCats.push(c.category);
        }
    }

    // Minimum tail length implied by rules: anything that positionally touches
    // slot 0 (thirdLast) or existentially needs two of the first two slots
    // forces tailLen = 3; etc.
    let minTailLen = 0;
    if (forced[0]) minTailLen = 3;
    else if (forced[1] || notLastCats.length > 0) minTailLen = 2;
    else if (forced[2] || anyCats.length > 0) minTailLen = 1;

    // Lazy DP of prefix reachability. reach[k] maps a reachable sum to a
    // concrete sequence of move names that achieves it in exactly k moves.
    const reach: Map<number, string[]>[] = [new Map([[0, []]])];
    const ensureReach = (k: number) => {
        while (reach.length <= k) {
            const prev = reach[reach.length - 1];
            const next = new Map<number, string[]>();
            for (const [sum, seq] of prev) {
                for (const m of MOVES) {
                    const ns = sum + m.delta;
                    if (!next.has(ns)) next.set(ns, [...seq, m.name]);
                }
            }
            reach.push(next);
        }
    };

    const totalStart = Math.max(1, minTailLen);

    for (let total = totalStart; total <= MAX_STEPS; total++) {
        const tailLen = Math.min(total, 3);
        const prefixLen = total - tailLen;
        ensureReach(prefixLen);
        const reachK = reach[prefixLen];

        // Slot indices that actually exist in this tail. For tailLen = 3 it's
        // [0,1,2]; for tailLen = 2 it's [1,2]; for tailLen = 1 it's [2].
        const firstSlot = 3 - tailLen;

        const chosen: Move[] = new Array(3);
        let result: string[] | null = null;

        const dfs = (slot: number, tailDelta: number): void => {
            if (result) return;
            if (slot === 3) {
                // All tail slots filled. Validate existential rules.
                for (const cat of anyCats) {
                    let ok = false;
                    for (let i = firstSlot; i < 3; i++) {
                        if (chosen[i].category === cat) { ok = true; break; }
                    }
                    if (!ok) return;
                }
                for (const cat of notLastCats) {
                    // Must appear in slot 0 or 1 (among those in the tail).
                    let ok = false;
                    for (let i = firstSlot; i < 2; i++) {
                        if (chosen[i].category === cat) { ok = true; break; }
                    }
                    if (!ok) return;
                }
                const needed = target - start - tailDelta;
                const prefix = reachK.get(needed);
                if (!prefix) return;
                const tailMoves: string[] = [];
                for (let i = firstSlot; i < 3; i++) tailMoves.push(chosen[i].name);
                result = [...prefix, ...tailMoves];
                return;
            }
            if (slot < firstSlot) {
                dfs(slot + 1, tailDelta);
                return;
            }
            const forcedCat = forced[slot];
            for (const m of MOVES) {
                if (forcedCat && m.category !== forcedCat) continue;
                chosen[slot] = m;
                dfs(slot + 1, tailDelta + m.delta);
                if (result) return;
            }
        };

        dfs(0, 0);
        if (result) return result;
    }

    return null;
}
