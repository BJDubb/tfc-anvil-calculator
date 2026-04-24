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
