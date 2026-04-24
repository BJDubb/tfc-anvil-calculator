/**
 * Build-time recipe scraper.
 *
 * Downloads a Minecraft serverpack (a .zip containing a `mods/` folder of
 * mod .jar files), walks every jar, and extracts all anvil recipes
 * (`"type": "tfc:anvil"`) as a single JSON file the frontend imports.
 *
 * Tag ingredients (e.g. `{"tag": "forge:ingots/brass"}`) are resolved by
 * merging every `data/<ns>/tags/items/**.json` file across all mods, so the
 * UI can show a concrete example item for each tagged input.
 *
 * Output: app/data/anvil-recipes.generated.json
 *
 * Run with: bun run fetch-recipes
 */

import AdmZip from "adm-zip";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";

// -----------------------------------------------------------------------------
// Source configuration. Add more entries here to support additional versions.
// -----------------------------------------------------------------------------

type Source = {
    id: string;
    label: string;
    url: string;
};

const SOURCES: Source[] = [
    {
        id: "tfg-modern-0.12.5",
        label: "TerraFirmaGreg-Modern 0.12.5",
        url: "https://github.com/TerraFirmaGreg-Team/Modpack-Modern/releases/download/0.12.5/TerraFirmaGreg-Modern-0.12.5-serverpack.zip",
    },
];

const PRIMARY_SOURCE = SOURCES[0];

const CACHE_DIR = join(process.cwd(), ".cache");
const OUTPUT_PATH = join(process.cwd(), "app/data/anvil-recipes.generated.json");
const ICONS_OUT = join(process.cwd(), "public/icons");

// -----------------------------------------------------------------------------
// Output shape — mirrors `app/types.ts`, repeated here so this script can run
// standalone without importing from the Next.js app code.
// -----------------------------------------------------------------------------

type TagInput = {
    type: "tag";
    tag: string;
    items: { item: string; icon: string }[];
};

type ItemInput = {
    type: "item";
    item: string;
    icon: string | null;
};

type RecipeInput = TagInput | ItemInput;

type RecipeResult = {
    item: string;
    icon: string | null;
};

type Recipe = {
    id: string; // `{namespace}:{path}` — matches TFC's ResourceLocation
    recipe: string; // short name, the last path segment for display
    input: RecipeInput;
    result: RecipeResult;
    tier: number;
    rules: string[];
    apply_forging_bonus: boolean | null;
};

// -----------------------------------------------------------------------------
// Helpers
// -----------------------------------------------------------------------------

function iconFilenameFor(id: string): string {
    return id.replace(/[:\/]/g, "_") + ".png";
}

async function downloadCached(url: string, dest: string): Promise<Buffer> {
    if (existsSync(dest)) {
        console.log(`  cached  ${dest}`);
        return readFileSync(dest);
    }
    console.log(`  GET     ${url}`);
    const res = await fetch(url);
    if (!res.ok) {
        throw new Error(`download failed (${res.status}): ${url}`);
    }
    const buf = Buffer.from(await res.arrayBuffer());
    mkdirSync(dirname(dest), { recursive: true });
    writeFileSync(dest, buf);
    console.log(`  saved   ${dest} (${(buf.length / 1e6).toFixed(1)} MB)`);
    return buf;
}

type Jar = { name: string; zip: AdmZip };

/**
 * Find every mod .jar inside a serverpack zip. Handles both flat layouts
 * (top-level `mods/` directory) and single-level-nested layouts
 * (`TerraFirmaGreg-Modern-X.Y.Z/mods/`).
 */
function extractModJars(packBuf: Buffer): Jar[] {
    const pack = new AdmZip(packBuf);
    const jars: Jar[] = [];
    for (const entry of pack.getEntries()) {
        if (entry.isDirectory) continue;
        if (!/(^|\/)mods\/[^/]+\.jar$/.test(entry.entryName)) continue;
        try {
            jars.push({
                name: entry.entryName.split("/").pop() ?? entry.entryName,
                zip: new AdmZip(entry.getData()),
            });
        } catch (e) {
            console.warn(`  skip jar ${entry.entryName}: ${(e as Error).message}`);
        }
    }
    return jars.sort((a, b) => a.name.localeCompare(b.name));
}

// -----------------------------------------------------------------------------
// Tag resolution
// -----------------------------------------------------------------------------
//
// Minecraft tags are distributed across mods: any mod can contribute entries
// to any tag via `data/<ns>/tags/items/<path>.json`, which gets merged at
// load time. We replicate that merge, then resolve `#other:tag` references
// transitively so each tag ends up with a flat list of concrete items.

type TagEntryRaw = {
    replace?: boolean;
    values?: unknown[];
};

function tagKeyFromPath(ns: string, path: string): string {
    // Strip the `items/` prefix so the key matches ingredient references:
    //   data/forge/tags/items/ingots/brass.json → forge:ingots/brass
    // Some data uses `item/` or lives directly under `tags/` — accept both.
    let trimmed = path;
    if (trimmed.startsWith("items/")) trimmed = trimmed.slice("items/".length);
    else if (trimmed.startsWith("item/")) trimmed = trimmed.slice("item/".length);
    return `${ns}:${trimmed}`;
}

function collectTags(jars: Jar[]): Map<string, Set<string>> {
    // Multi-map: tag key -> list of raw contributions (from every mod).
    const raw = new Map<string, TagEntryRaw[]>();

    for (const { zip } of jars) {
        for (const entry of zip.getEntries()) {
            if (entry.isDirectory) continue;
            const m = entry.entryName.match(/^data\/([^/]+)\/tags\/(items?|tags\/items)\/(.+)\.json$/);
            if (!m) continue;
            const [, ns, , sub] = m;
            const key = tagKeyFromPath(ns, sub);
            let json: TagEntryRaw;
            try {
                json = JSON.parse(entry.getData().toString("utf8"));
            } catch {
                continue;
            }
            if (!raw.has(key)) raw.set(key, []);
            raw.get(key)!.push(json);
        }
    }

    // Recursively resolve `#other:tag` references, guarding against cycles.
    const resolved = new Map<string, Set<string>>();
    const visiting = new Set<string>();

    const resolve = (key: string): Set<string> => {
        if (resolved.has(key)) return resolved.get(key)!;
        if (visiting.has(key)) return new Set();
        visiting.add(key);
        const items = new Set<string>();
        for (const part of raw.get(key) ?? []) {
            // `replace: true` semantics are rare in practice; honour them by
            // starting fresh, which matches Minecraft's per-mod override.
            if (part.replace === true) items.clear();
            for (const value of part.values ?? []) {
                const idRaw =
                    typeof value === "string"
                        ? value
                        : typeof value === "object" && value !== null && "id" in value
                          ? (value as { id: unknown }).id
                          : null;
                if (typeof idRaw !== "string") continue;
                if (idRaw.startsWith("#")) {
                    for (const ref of resolve(idRaw.slice(1))) items.add(ref);
                } else {
                    items.add(idRaw);
                }
            }
        }
        visiting.delete(key);
        resolved.set(key, items);
        return items;
    };

    for (const key of raw.keys()) resolve(key);
    return resolved;
}

// -----------------------------------------------------------------------------
// Recipe parsing
// -----------------------------------------------------------------------------

type RecipeJson = {
    type?: string;
    input?: unknown;
    result?: unknown;
    tier?: number;
    rules?: string[];
    apply_forging_bonus?: boolean;
};

function parseIngredient(raw: unknown, tags: Map<string, Set<string>>): RecipeInput | null {
    if (raw === null || typeof raw !== "object") return null;
    if (Array.isArray(raw)) {
        // "Any of" ingredients — we pick the first parseable entry so the UI
        // still has something to display. A full OR-ingredient type would be
        // nicer but no recipe in our dataset currently needs it.
        for (const item of raw) {
            const parsed = parseIngredient(item, tags);
            if (parsed) return parsed;
        }
        return null;
    }
    const obj = raw as Record<string, unknown>;
    if (typeof obj.item === "string") {
        return { type: "item", item: obj.item, icon: null };
    }
    if (typeof obj.tag === "string") {
        const items = Array.from(tags.get(obj.tag) ?? []).sort();
        return {
            type: "tag",
            tag: obj.tag,
            items: items.map((id) => ({ item: id, icon: iconFilenameFor(id) })),
        };
    }
    return null;
}

/**
 * TFC wraps outputs in `ItemStackProvider`, which can appear either as a
 * plain `{ "item": "…" }` object or as `{ "type": "tfc:item_stack_provider",
 * "stack": { "item": "…" } }`. We try both forms, plus one level of "stack"
 * unwrapping for safety.
 */
function parseResult(raw: unknown): RecipeResult | null {
    if (!raw || typeof raw !== "object") return null;
    const obj = raw as Record<string, unknown>;
    if (typeof obj.item === "string") {
        return { item: obj.item, icon: null };
    }
    if (obj.stack && typeof obj.stack === "object") {
        return parseResult(obj.stack);
    }
    return null;
}

function parseRecipesFromJar(
    jar: Jar,
    tags: Map<string, Set<string>>
): Recipe[] {
    const out: Recipe[] = [];
    for (const entry of jar.zip.getEntries()) {
        if (entry.isDirectory) continue;
        const m = entry.entryName.match(/^data\/([^/]+)\/recipes?\/(.+)\.json$/);
        if (!m) continue;
        const [, ns, path] = m;
        let json: RecipeJson;
        try {
            json = JSON.parse(entry.getData().toString("utf8"));
        } catch {
            continue;
        }
        if (json.type !== "tfc:anvil") continue;

        const input = parseIngredient(json.input, tags);
        const result = parseResult(json.result);
        if (!input || !result) {
            console.warn(`  skip ${ns}:${path} (unparseable input/result)`);
            continue;
        }

        const id = `${ns}:${path}`;
        // Short name for display: last path segment (post `anvil/`, post `/`).
        const shortName = path.replace(/^.*\//, "");

        out.push({
            id,
            recipe: shortName,
            input,
            result,
            tier: typeof json.tier === "number" ? json.tier : 0,
            rules: Array.isArray(json.rules) ? json.rules : [],
            apply_forging_bonus:
                typeof json.apply_forging_bonus === "boolean"
                    ? json.apply_forging_bonus
                    : null,
        });
    }
    return out;
}

// -----------------------------------------------------------------------------
// Icon extraction
// -----------------------------------------------------------------------------
//
// Item textures are resolved via Minecraft's standard model pipeline:
//   1. Read `assets/<ns>/models/item/<path>.json`.
//   2. Read its `textures` map (prefer `layer0`, then `all`, `front`, …).
//   3. If the model only has a `parent`, follow the chain (bounded depth).
//   4. Load `assets/<ns>/textures/<subtype>/<path>.png` for the texture ref.
//
// Dynamically-textured items (GregTech materials, Create chromatic compounds,
// anything that builds textures in code) have no model JSON in the jar and
// silently fail — the runtime <ItemIcon/> 404 fallback handles those.

type ModelJson = {
    parent?: string;
    textures?: Record<string, string>;
};

type Assets = {
    /** `ns:item/brass_rod` -> parsed model JSON (item and block models). */
    models: Map<string, ModelJson>;
    /** `ns:item/brass_rod` -> raw PNG bytes (item and block textures). */
    textures: Map<string, Buffer>;
};

function collectAssets(jars: Jar[]): Assets {
    const models = new Map<string, ModelJson>();
    const textures = new Map<string, Buffer>();

    const modelRe = /^assets\/([^/]+)\/models\/((?:item|block)\/.+)\.json$/;
    const textureRe = /^assets\/([^/]+)\/textures\/((?:item|block)\/.+)\.png$/;

    for (const { zip } of jars) {
        for (const entry of zip.getEntries()) {
            if (entry.isDirectory) continue;
            const mm = entry.entryName.match(modelRe);
            if (mm) {
                const [, ns, path] = mm;
                try {
                    models.set(
                        `${ns}:${path}`,
                        JSON.parse(entry.getData().toString("utf8"))
                    );
                } catch {
                    /* malformed — skip */
                }
                continue;
            }
            const tm = entry.entryName.match(textureRe);
            if (tm) {
                const [, ns, path] = tm;
                textures.set(`${ns}:${path}`, entry.getData());
            }
        }
    }
    return { models, textures };
}

/**
 * Parent refs and texture refs are sometimes namespaced, sometimes bare.
 * Normalise everything to `<ns>:<path>`; bare refs default to `minecraft:`.
 */
function normaliseRef(ref: string): string {
    return ref.includes(":") ? ref : `minecraft:${ref}`;
}

/**
 * Walk an item's model chain to find the first layer texture reference.
 * Capped at 8 hops to defend against circular `parent` links.
 */
function findTextureRef(itemId: string, models: Map<string, ModelJson>): string | null {
    const [ns, path] = splitId(itemId);
    if (!ns || !path) return null;

    let currentKey: string | null = `${ns}:item/${path}`;
    const visited = new Set<string>();
    for (let hop = 0; hop < 8 && currentKey; hop++) {
        if (visited.has(currentKey)) break;
        visited.add(currentKey);

        const model = models.get(currentKey);
        if (!model) break;

        if (model.textures) {
            const t = model.textures;
            const ref =
                t.layer0 ??
                t.all ??
                t.front ??
                t.side ??
                t.particle ??
                Object.values(t).find((v) => typeof v === "string") ??
                null;
            if (ref) return normaliseRef(ref);
        }
        currentKey = model.parent ? normaliseRef(model.parent) : null;
    }
    return null;
}

function splitId(id: string): [string, string] {
    const i = id.indexOf(":");
    if (i < 0) return ["minecraft", id];
    return [id.slice(0, i), id.slice(i + 1)];
}

/**
 * Resolve an item registry id (e.g. `tfc:metal/rod/brass`) to a PNG buffer.
 * Tries the model pipeline first, then two path-based fallbacks so we still
 * catch items whose model lives outside the serverpack.
 */
function resolveItemIcon(itemId: string, assets: Assets): Buffer | null {
    const [ns, path] = splitId(itemId);
    const candidates = new Set<string>();

    const fromModel = findTextureRef(itemId, assets.models);
    if (fromModel) candidates.add(fromModel);
    candidates.add(`${ns}:item/${path}`);
    candidates.add(`${ns}:block/${path}`);

    for (const key of candidates) {
        const buf = assets.textures.get(key);
        if (buf) return buf;
    }
    return null;
}

function iconFilename(itemId: string): string {
    return itemId.replace(/[:\/]/g, "_") + ".png";
}

function collectReferencedItems(recipes: Recipe[]): Set<string> {
    const items = new Set<string>();
    for (const r of recipes) {
        items.add(r.result.item);
        if (r.input.type === "item") items.add(r.input.item);
        else for (const it of r.input.items) items.add(it.item);
    }
    return items;
}

// -----------------------------------------------------------------------------
// Main
// -----------------------------------------------------------------------------

async function processSource(source: Source): Promise<void> {
    console.log(`\n=== ${source.label} (${source.id}) ===`);
    const zipPath = join(CACHE_DIR, `${source.id}.zip`);
    const packBuf = await downloadCached(source.url, zipPath);

    const jars = extractModJars(packBuf);
    console.log(`  jars      ${jars.length}`);

    const tags = collectTags(jars);
    console.log(`  tags      ${tags.size}`);

    const recipes: Recipe[] = [];
    for (const jar of jars) recipes.push(...parseRecipesFromJar(jar, tags));

    // De-dup by id (later jar wins) and sort by id for stable diffs.
    const byId = new Map<string, Recipe>();
    for (const r of recipes) byId.set(r.id, r);
    const deduped = Array.from(byId.values()).sort((a, b) =>
        a.id.localeCompare(b.id)
    );
    console.log(`  recipes   ${deduped.length}`);

    mkdirSync(dirname(OUTPUT_PATH), { recursive: true });
    writeFileSync(OUTPUT_PATH, JSON.stringify(deduped, null, 2) + "\n");
    console.log(`  wrote     ${OUTPUT_PATH}`);

    // Icons
    const assets = collectAssets(jars);
    console.log(`  models    ${assets.models.size}`);
    console.log(`  textures  ${assets.textures.size}`);

    const referenced = collectReferencedItems(deduped);
    console.log(`  items     ${referenced.size}`);

    mkdirSync(ICONS_OUT, { recursive: true });
    let written = 0;
    const missing: string[] = [];
    for (const itemId of referenced) {
        const png = resolveItemIcon(itemId, assets);
        if (!png) {
            missing.push(itemId);
            continue;
        }
        writeFileSync(join(ICONS_OUT, iconFilename(itemId)), png);
        written++;
    }
    console.log(`  wrote     ${written} icons → ${ICONS_OUT}`);
    if (missing.length > 0) {
        console.log(
            `  missing   ${missing.length} (dynamically-textured or absent from pack):`
        );
        for (const id of missing.slice(0, 20)) console.log(`              ${id}`);
        if (missing.length > 20) console.log(`              … +${missing.length - 20} more`);
    }
}

async function main() {
    await processSource(PRIMARY_SOURCE);
}

main().catch((e) => {
    console.error(e);
    process.exit(1);
});
