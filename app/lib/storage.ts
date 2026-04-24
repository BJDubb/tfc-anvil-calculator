"use client";

// Small localStorage-backed stores surfaced as React hooks.
//
// Each store uses `useSyncExternalStore` so initial render, SSR, and later
// updates all agree on the value without writing state in an effect.
// A module-level `Set` of subscriber callbacks fans out updates to every
// mounted consumer.

import { useSyncExternalStore } from "react";
import type { Modpack } from "../types";

type Subscribe = (cb: () => void) => () => void;

function makeStore<T>(
    key: string,
    parse: (raw: string | null) => T,
    stringify: (value: T) => string,
    defaultValue: T
): { read: () => T; write: (v: T) => void; subscribe: Subscribe } {
    const listeners = new Set<() => void>();

    const read = (): T => {
        if (typeof window === "undefined") return defaultValue;
        try {
            return parse(window.localStorage.getItem(key));
        } catch {
            return defaultValue;
        }
    };

    const write = (value: T) => {
        try {
            window.localStorage.setItem(key, stringify(value));
        } catch {
            // Quota exceeded / private mode — ignore, listeners still fire.
        }
        listeners.forEach((cb) => cb());
    };

    const subscribe: Subscribe = (cb) => {
        listeners.add(cb);
        return () => {
            listeners.delete(cb);
        };
    };

    return { read, write, subscribe };
}

const seedStore = makeStore<string>(
    "tfc-anvil:worldSeed",
    (raw) => raw ?? "",
    (v) => v,
    ""
);

const modpackStore = makeStore<Modpack>(
    "tfc-anvil:modpack",
    (raw) => (raw === "tfg" ? "tfg" : "tfc"),
    (v) => v,
    "tfc"
);

/** Persisted world-seed string. Controls deterministic target computation. */
export function useWorldSeed(): [string, (value: string) => void] {
    const value = useSyncExternalStore(
        seedStore.subscribe,
        seedStore.read,
        () => ""
    );
    return [value, seedStore.write];
}

/** Persisted modpack selection — swaps the active recipe overlay. */
export function useModpack(): [Modpack, (value: Modpack) => void] {
    const value = useSyncExternalStore(
        modpackStore.subscribe,
        modpackStore.read,
        () => "tfc" as Modpack
    );
    return [value, modpackStore.write];
}

// ---------------------------------------------------------------------------
// Favourite recipe ids (full `Recipe.id` / ResourceLocation strings).
// Order is preserved — most recently added is last; toggling off removes.
//
// `useSyncExternalStore` requires getSnapshot to return a **referentially
// stable** value whenever the underlying store hasn't changed. A naive
// `read()` that parses JSON and runs `.filter()` on every call always
// allocates a new array → React warns ("infinite loop"). We therefore cache
// the last snapshot + the raw localStorage string that produced it.
// ---------------------------------------------------------------------------

const FAVOURITES_KEY = "tfc-anvil:favouriteRecipeIds";

/** Stable empty list — same reference for SSR, getServerSnapshot, and reads. */
const EMPTY_FAVOURITE_IDS: string[] = [];

const favouriteListeners = new Set<() => void>();

let favouritesSnapshot: string[] = EMPTY_FAVOURITE_IDS;
/**
 * Last `localStorage.getItem` value for which `favouritesSnapshot` is valid.
 * `undefined` = cache miss (must re-read). `null` = key absent; a string = raw JSON.
 */
let favouritesCacheKey: string | null | undefined = undefined;

function parseFavouritesRaw(raw: string | null): string[] {
    if (!raw) return EMPTY_FAVOURITE_IDS;
    try {
        const v = JSON.parse(raw) as unknown;
        if (!Array.isArray(v)) return EMPTY_FAVOURITE_IDS;
        const next = v.filter((x): x is string => typeof x === "string");
        return next.length === 0 ? EMPTY_FAVOURITE_IDS : next;
    } catch {
        return EMPTY_FAVOURITE_IDS;
    }
}

function favouritesRead(): string[] {
    if (typeof window === "undefined") return EMPTY_FAVOURITE_IDS;
    try {
        const raw = window.localStorage.getItem(FAVOURITES_KEY);
        if (favouritesCacheKey !== undefined && raw === favouritesCacheKey) {
            return favouritesSnapshot;
        }
        favouritesCacheKey = raw;
        favouritesSnapshot = parseFavouritesRaw(raw);
        return favouritesSnapshot;
    } catch {
        favouritesCacheKey = undefined;
        favouritesSnapshot = EMPTY_FAVOURITE_IDS;
        return favouritesSnapshot;
    }
}

function favouritesWrite(next: string[]) {
    const normalized = next.length === 0 ? EMPTY_FAVOURITE_IDS : next;
    const serialized =
        normalized === EMPTY_FAVOURITE_IDS ? "[]" : JSON.stringify(normalized);
    try {
        window.localStorage.setItem(FAVOURITES_KEY, serialized);
    } catch {
        // Quota exceeded / private mode — ignore, listeners still fire.
    }
    favouritesCacheKey = serialized;
    favouritesSnapshot = normalized;
    favouriteListeners.forEach((cb) => cb());
}

function favouritesSubscribe(cb: () => void): () => void {
    favouriteListeners.add(cb);
    return () => {
        favouriteListeners.delete(cb);
    };
}

if (typeof window !== "undefined") {
    window.addEventListener("storage", (e: StorageEvent) => {
        if (e.key !== FAVOURITES_KEY) return;
        favouritesCacheKey = undefined;
        favouriteListeners.forEach((cb) => cb());
    });
}

/** Ordered list of favourited recipe ids + toggle helper. */
export function useFavouriteRecipes(): {
    favouriteIds: string[];
    isFavourite: (recipeId: string) => boolean;
    toggleFavourite: (recipeId: string) => void;
} {
    const favouriteIds = useSyncExternalStore(
        favouritesSubscribe,
        favouritesRead,
        () => EMPTY_FAVOURITE_IDS
    );

    const isFavourite = (recipeId: string) => favouriteIds.includes(recipeId);

    const toggleFavourite = (recipeId: string) => {
        const cur = favouritesRead();
        const i = cur.indexOf(recipeId);
        if (i >= 0) {
            favouritesWrite(cur.filter((id) => id !== recipeId));
        } else {
            favouritesWrite([...cur, recipeId]);
        }
    };

    return { favouriteIds, isFavourite, toggleFavourite };
}
