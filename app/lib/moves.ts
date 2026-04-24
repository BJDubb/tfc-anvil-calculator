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
