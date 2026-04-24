import { md5 } from "js-md5";

// ----------------------
// 64-bit helpers
// ----------------------
//
// JS BigInts are arbitrary precision, but the Java algorithm we're mirroring
// operates on fixed-width 64-bit signed longs. Every arithmetic step below
// explicitly masks to 64 bits so the state and intermediate values don't
// drift from the reference implementation.

const MASK64 = (1n << 64n) - 1n;
const MASK32 = 0xffffffffn;

function toUnsigned64(x: bigint): bigint {
    return x & MASK64;
}

// ----------------------
// Stafford variant 13 mixer + seed upgrade
// Mirrors net.minecraft.world.level.levelgen.RandomSupport exactly; Java uses
// `>>>` (logical/unsigned right shift) throughout, which on a non-negative
// BigInt is just `>>`.
// ----------------------

const SILVER_RATIO_64 = 0x6a09e667f3bcc909n; // 7640891576956012809
const GOLDEN_RATIO_64 = 0x9e3779b97f4a7c15n; // -7046029254386353131 (signed)

function mixStafford13(input: bigint): bigint {
    let x = toUnsigned64(input);
    x = toUnsigned64((x ^ (x >> 30n)) * 0xbf58476d1ce4e5b9n);
    x = toUnsigned64((x ^ (x >> 27n)) * 0x94d049bb133111ebn);
    return toUnsigned64(x ^ (x >> 31n));
}

function upgradeSeedTo128(seed: bigint): { lo: bigint; hi: bigint } {
    const lo = toUnsigned64(seed ^ SILVER_RATIO_64);
    const hi = toUnsigned64(lo + GOLDEN_RATIO_64);
    return {
        lo: mixStafford13(lo),
        hi: mixStafford13(hi),
    };
}

// ----------------------
// MD5 → 128-bit (two longs)
// ----------------------

function md5To128Bit(str: string): { lo: bigint; hi: bigint } {
    const digest = new Uint8Array(md5.arrayBuffer(str));
    const view = new DataView(digest.buffer, digest.byteOffset, digest.byteLength);

    // Minecraft's RandomSupport.seedFromHashOf reads the digest as two
    // big-endian 64-bit longs (lo = bytes 0..7, hi = bytes 8..15).
    return {
        lo: view.getBigInt64(0, false),
        hi: view.getBigInt64(8, false),
    };
}

// ----------------------
// Xoroshiro128++
// ----------------------

class Xoroshiro128pp {
    private s0: bigint;
    private s1: bigint;

    constructor(lo: bigint, hi: bigint) {
        this.s0 = toUnsigned64(lo);
        this.s1 = toUnsigned64(hi);
        // Xoroshiro disallows the all-zero state. Java falls back to
        // (seedLo = GOLDEN, seedHi = SILVER) — note the order.
        if (this.s0 === 0n && this.s1 === 0n) {
            this.s0 = GOLDEN_RATIO_64;
            this.s1 = SILVER_RATIO_64;
        }
    }

    private rotl(x: bigint, k: bigint): bigint {
        return toUnsigned64((x << k) | (x >> (64n - k)));
    }

    nextLong(): bigint {
        const s0 = this.s0;
        let s1 = this.s1;

        const result = toUnsigned64(this.rotl(toUnsigned64(s0 + s1), 17n) + s0);

        s1 ^= s0;
        this.s0 = toUnsigned64(this.rotl(s0, 49n) ^ s1 ^ (s1 << 21n));
        this.s1 = this.rotl(s1, 28n);

        return result;
    }

    // Mirrors Java's Xoroshiro128PlusPlus.nextInt(bound) using Lemire's
    // unbiased bounded-int technique.
    nextInt(bound: number): number {
        if (!Number.isInteger(bound) || bound <= 0) {
            throw new Error("bound must be a positive integer");
        }
        const boundBig = BigInt(bound);

        let r = (this.nextLong() & MASK32) * boundBig;
        let rl = r & MASK32;

        if (rl < boundBig) {
            const t = (-boundBig & MASK32) % boundBig;
            while (rl < t) {
                r = (this.nextLong() & MASK32) * boundBig;
                rl = r & MASK32;
            }
        }

        return Number((r >> 32n) & MASK32);
    }
}

// ----------------------
// Main entry point
// ----------------------

export type SeedInput = bigint | number | string;

function parseSeed(seed: SeedInput): bigint {
    if (typeof seed === "bigint") return toUnsigned64(seed);
    if (typeof seed === "number") {
        if (!Number.isFinite(seed) || !Number.isInteger(seed)) {
            throw new Error(`Invalid numeric seed: ${seed}`);
        }
        return toUnsigned64(BigInt(seed));
    }
    const trimmed = seed.trim();
    if (trimmed === "") throw new Error("Empty seed");
    // Accept both pure numeric strings (possibly negative / out of JS safe int
    // range) and hex strings prefixed with 0x.
    if (/^-?\d+$/.test(trimmed)) return toUnsigned64(BigInt(trimmed));
    if (/^0x[0-9a-f]+$/i.test(trimmed)) return toUnsigned64(BigInt(trimmed));
    // Otherwise fall back to Java's String.hashCode() so stringy seeds like
    // "foo" work the same way the vanilla world-creation screen does.
    return toUnsigned64(BigInt(javaStringHashCode(trimmed)));
}

function javaStringHashCode(s: string): number {
    let h = 0;
    for (let i = 0; i < s.length; i++) {
        h = Math.imul(31, h) + s.charCodeAt(i);
        h |= 0; // keep it as 32-bit signed
    }
    return h;
}

/**
 * Deterministically compute the TFC anvil target value (the green arrow) for
 * a given world seed and item id. Target is in the range [40, 113].
 *
 * Algorithm mirrors TFC's `NoiseGenerator#getTargetPosition` which uses
 * Minecraft's `RandomSupport` to build a 128-bit seed from the world seed,
 * forks it by item location, and draws a single bounded int.
 */
export function computeTfcAnvilTarget(worldSeed: SeedInput, itemId: string): number {
    const seed = parseSeed(worldSeed);

    // 1. World seed → 128-bit via Stafford mixer.
    const base = upgradeSeedTo128(seed);

    // 2. Fork the base RNG for positional derivation.
    const baseRng = new Xoroshiro128pp(base.lo, base.hi);
    const forkLo = baseRng.nextLong();
    const forkHi = baseRng.nextLong();

    // 3. Hash the item id into 128 bits and XOR with the fork.
    const hash = md5To128Bit(itemId);
    const finalLo = forkLo ^ hash.lo;
    const finalHi = forkHi ^ hash.hi;

    // 4. Draw the target.
    const rng = new Xoroshiro128pp(finalLo, finalHi);
    return 40 + rng.nextInt(74);
}
