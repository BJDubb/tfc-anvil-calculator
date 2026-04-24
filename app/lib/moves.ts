import type { Move, MoveCategory } from "../types";

// The eight primitive anvil operations, each with its work-delta and the
// corresponding sprite in `/public/operations/`.
export const MOVES: Move[] = [
    { name: "light_hit", category: "hit", label: "Light Hit", delta: -3, icon: "/operations/hit light.png" },
    { name: "medium_hit", category: "hit", label: "Medium Hit", delta: -6, icon: "/operations/hit medium.png" },
    { name: "heavy_hit", category: "hit", label: "Heavy Hit", delta: -9, icon: "/operations/hit heavy.png" },
    { name: "draw", category: "draw", label: "Draw", delta: -15, icon: "/operations/draw.png" },
    { name: "punch", category: "punch", label: "Punch", delta: 2, icon: "/operations/punch.png" },
    { name: "bend", category: "bend", label: "Bend", delta: 7, icon: "/operations/bend.png" },
    { name: "upset", category: "upset", label: "Upset", delta: 13, icon: "/operations/upset.png" },
    { name: "shrink", category: "shrink", label: "Shrink", delta: 16, icon: "/operations/shrink.png" },
];

export const CATEGORY_LABEL: Record<MoveCategory, string> = {
    hit: "Hit",
    draw: "Draw",
    punch: "Punch",
    bend: "Bend",
    upset: "Upset",
    shrink: "Shrink",
};

// Representative icon per move category. Used for rule displays / editors
// where we care about the category (e.g. "a Hit at the last position") rather
// than a specific move. The "hit" category has light/medium/heavy variants,
// all visually similar; we use medium as the stand-in.
export const CATEGORY_ICON: Record<MoveCategory, string> = {
    hit: "/operations/hit medium.png",
    draw: "/operations/draw.png",
    punch: "/operations/punch.png",
    bend: "/operations/bend.png",
    upset: "/operations/upset.png",
    shrink: "/operations/shrink.png",
};

// All six move categories, in a stable UI ordering (hits first, then deltas
// from most negative to most positive, mirroring the in-game tool layout).
export const MOVE_CATEGORIES: MoveCategory[] = [
    "hit",
    "draw",
    "punch",
    "bend",
    "upset",
    "shrink",
];

const MOVES_BY_NAME: Record<string, Move> = Object.fromEntries(
    MOVES.map((m) => [m.name, m])
);

export function getMove(name: string): Move {
    const move = MOVES_BY_NAME[name];
    if (!move) throw new Error(`Unknown move: ${name}`);
    return move;
}

export function isMoveCategory(s: string): s is MoveCategory {
    return (
        s === "hit" ||
        s === "draw" ||
        s === "punch" ||
        s === "bend" ||
        s === "upset" ||
        s === "shrink"
    );
}
