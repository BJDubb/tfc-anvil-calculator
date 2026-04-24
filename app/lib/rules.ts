import { CATEGORY_LABEL, isMoveCategory } from "./moves";
import type { Constraint, MoveCategory } from "../types";

const RULE_SUFFIXES: { suffix: string; build: (cat: MoveCategory) => Constraint }[] = [
    { suffix: "_not_last", build: (cat) => ({ kind: "notLast", category: cat }) },
    { suffix: "_third_last", build: (cat) => ({ kind: "position", category: cat, positionFromEnd: 3 }) },
    { suffix: "_second_last", build: (cat) => ({ kind: "position", category: cat, positionFromEnd: 2 }) },
    { suffix: "_last", build: (cat) => ({ kind: "position", category: cat, positionFromEnd: 1 }) },
    { suffix: "_any", build: (cat) => ({ kind: "any", category: cat }) },
];

/**
 * Parse a TFC forge-rule string like `"draw_last"` / `"punch_not_last"` /
 * `"hit_any"` into a structured `Constraint`, or `null` if the string is not
 * a recognised rule.
 */
export function parseRule(rule: string): Constraint | null {
    for (const { suffix, build } of RULE_SUFFIXES) {
        if (rule.endsWith(suffix)) {
            const prefix = rule.slice(0, -suffix.length);
            if (isMoveCategory(prefix)) return build(prefix);
        }
    }
    return null;
}

/** Human-readable label for a rule, e.g. "Draw — second last". */
export function ruleLabel(c: Constraint): string {
    const name = CATEGORY_LABEL[c.category];
    if (c.kind === "position") {
        return c.positionFromEnd === 1
            ? `${name} — last`
            : c.positionFromEnd === 2
                ? `${name} — second last`
                : `${name} — third last`;
    }
    if (c.kind === "notLast") return `${name} — not last`;
    return `${name} — any`;
}
