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

// Visual decomposition of a constraint list: the three position slots
// (3rd last / 2nd last / last) plus the two flavours of existential rule.
// Drives both the read-only <RuleDisplay /> and the editable <RuleEditor />.
export type GroupedConstraints = {
    position: (MoveCategory | null)[];
    anyOfThree: MoveCategory[];
    notLast: MoveCategory[];
};

export function emptyGroupedConstraints(): GroupedConstraints {
    return { position: [null, null, null], anyOfThree: [], notLast: [] };
}

export function groupConstraints(constraints: Constraint[]): GroupedConstraints {
    const grouped = emptyGroupedConstraints();
    for (const c of constraints) {
        if (c.kind === "position") {
            grouped.position[3 - c.positionFromEnd] = c.category;
        } else if (c.kind === "any") {
            if (!grouped.anyOfThree.includes(c.category)) {
                grouped.anyOfThree.push(c.category);
            }
        } else {
            if (!grouped.notLast.includes(c.category)) {
                grouped.notLast.push(c.category);
            }
        }
    }
    return grouped;
}

export function buildConstraints(grouped: GroupedConstraints): Constraint[] {
    const result: Constraint[] = [];
    for (let i = 0; i < 3; i++) {
        const cat = grouped.position[i];
        if (cat) {
            result.push({
                kind: "position",
                category: cat,
                positionFromEnd: 3 - i,
            });
        }
    }
    for (const cat of grouped.anyOfThree) {
        result.push({ kind: "any", category: cat });
    }
    for (const cat of grouped.notLast) {
        result.push({ kind: "notLast", category: cat });
    }
    return result;
}
