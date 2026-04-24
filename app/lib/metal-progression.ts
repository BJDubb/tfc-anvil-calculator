/**
 * Linear metal progression as players experience it in TFC / TFG — used to
 * order the "By Metal" recipe groups and to insert section banners between
 * eras. This is coarser than the numeric anvil tier on each recipe; it
 * matches the six-step ladder the user described.
 */

/** Display labels for each progression step (index matches step). */
export const METAL_PROGRESSION_LABELS = [
    "Copper",
    "Bronze",
    "Wrought iron",
    "Steel",
    "Black steel",
    "Red & blue steel",
] as const;

export type MetalProgressionStep = 0 | 1 | 2 | 3 | 4 | 5;

/** Materials that don't appear in the map sort after all known steps. */
export const METAL_PROGRESSION_OTHER = 100 as const;

const MATERIAL_TO_STEP: Record<string, MetalProgressionStep> = {
    // Copper era — base metals & early workable stuff
    copper: 0,
    tin: 0,
    zinc: 0,
    bismuth: 0,
    gold: 0,
    silver: 0,
    nickel: 0,
    rose_gold: 0,
    sterling_silver: 0,
    cast_iron: 0,

    // Bronze era — alloys & bloomery iron
    bronze: 1,
    bismuth_bronze: 1,
    black_bronze: 1,
    brass: 1,
    raw_iron_bloom: 1,
    refined_iron_bloom: 1,

    // Wrought iron — blast furnace / forge path
    pig_iron: 2,
    wrought_iron: 2,

    // Steel — including high-carbon intermediate before welding
    high_carbon_steel: 3,
    steel: 3,
    stainless_steel: 3,
    chromium: 3,

    // Black steel
    high_carbon_black_steel: 4,
    black_steel: 4,

    // Colored steels + their high-carbon intermediates
    high_carbon_red_steel: 5,
    high_carbon_blue_steel: 5,
    red_steel: 5,
    blue_steel: 5,
};

/**
 * Which progression band this material belongs to, or `null` if unknown
 * (mods / future datapack entries).
 */
export function progressionStepForMaterial(
    material: string
): MetalProgressionStep | null {
    return MATERIAL_TO_STEP[material] ?? null;
}

/**
 * Sort key for a metal group: primary = progression step (unknown → 100),
 * secondary = in-game anvil tier, tertiary = material id for stable ordering.
 */
export function metalGroupSortKey(
    material: string,
    gameTier: number
): readonly [number, number, string] {
    const step = progressionStepForMaterial(material);
    if (step !== null) return [step, gameTier, material] as const;
    return [METAL_PROGRESSION_OTHER, gameTier, material] as const;
}

/** Section heading for the progression strip in the recipe browser. */
export function progressionBannerLabel(step: number): string {
    if (step === METAL_PROGRESSION_OTHER) return "Other materials";
    if (step >= 0 && step < METAL_PROGRESSION_LABELS.length) {
        return METAL_PROGRESSION_LABELS[step];
    }
    return "Other materials";
}
