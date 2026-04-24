import generated from "./data/anvil-recipes.generated.json";
import type { Recipe } from "./types";

/**
 * Anvil recipes scraped from a live modpack serverpack at build time.
 *
 * The data file in `app/data/anvil-recipes.generated.json` is produced by
 * `scripts/fetch-recipes.ts`, which downloads the TerraFirmaGreg-Modern
 * serverpack, walks every mod `.jar`, and extracts every
 * `"type": "tfc:anvil"` recipe along with a tag-ingredient item lookup.
 *
 * To refresh (e.g. when TFG-Modern ships a new release):
 *     bun run fetch-recipes
 */
export const anvilRecipes: Recipe[] = generated as Recipe[];
