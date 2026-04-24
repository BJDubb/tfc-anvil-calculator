// Shared types for the anvil calculator. Lives outside `page.tsx` so
// non-client modules (e.g. the TFG overlay in `recipes-tfg.ts`) can depend on
// them without crossing the React Server/Client boundary.

export type TagInput = {
    type: "tag";
    tag: string;
    items: { item: string; icon: string }[];
};

export type ItemInput = {
    type: "item";
    item: string;
    icon: string | null;
};

export type RecipeInput = TagInput | ItemInput;

export type RecipeResult = {
    item: string;
    icon: string | null;
};

export type Recipe = {
    // Full Minecraft `ResourceLocation` id (e.g. `tfc:anvil/brass_rod`).
    // Unique within a datapack — TFC hashes *this* to derive the target value,
    // not the output item id.
    id: string;
    // Last path segment of the id, cached for display / suffix matching.
    recipe: string;
    input: RecipeInput;
    result: RecipeResult;
    tier: number;
    rules: string[];
    apply_forging_bonus: boolean | null;
};

export type MoveCategory = "hit" | "draw" | "punch" | "bend" | "upset" | "shrink";

export type Move = {
    name: string;
    category: MoveCategory;
    label: string;
    delta: number;
    icon: string;
};

export type Constraint =
    | { kind: "position"; category: MoveCategory; positionFromEnd: number }
    | { kind: "notLast"; category: MoveCategory }
    | { kind: "any"; category: MoveCategory };

export type Modpack = "tfc" | "tfg";
