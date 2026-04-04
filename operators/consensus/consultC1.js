// canon/consultC1.js
//
// Minimal consultation helper for live C1 objects.
//
// Constitutional posture:
//   - Read-only. This helper does NOT mutate any C1 object.
//   - Fail-closed on any missing required field, unknown status,
//     scope mismatch, or forbidden use.
//   - Does not promote, mint, or alter runtime meaning.
//   - Returns structured allow/deny with reason and current status visible.
//
// This helper is intentionally tiny and bounded.
// It is not a general canon registry or query engine.
// It answers one question: may this C1 object be consulted for this use?

"use strict";

// ─── Consultable status set ────────────────────────────────────────────────
// Per C1_StatusLifecycle: only promoted, contested, and narrowed may be
// candidates for active consultation. Contested must surface its posture.
// All others fail closed.
const CONSULTABLE_STATUSES = new Set(["promoted", "contested", "narrowed"]);

// Required fields that must be present for any consultation to proceed.
const REQUIRED_FIELDS = [
    "canonical_id",
    "canonical_status",
    "runtime_handoff_enabled",
    "allowed_use",
    "forbidden_use",
    "source_family_scope",
    "lens_scope",
    "effective_scope_note",
    "challenge_posture",
    "status_reason",
];

// ─── Consultation result shape ─────────────────────────────────────────────

/**
 * @typedef {Object} ConsultResult
 * @property {"allow"|"deny"} decision
 * @property {string} canonical_id      — always echoed
 * @property {string} canonical_status  — always echoed (visible even on deny)
 * @property {string} challenge_posture — always echoed
 * @property {string} reason            — short reason for allow/deny
 * @property {string|null} effective_scope_note — echoed on allow; null on deny
 */

// ─── Main consultation function ────────────────────────────────────────────

/**
 * Consult a live C1 object for a requested use.
 *
 * @param {Object} c1Object       — the loaded live C1 instance (plain JS object)
 * @param {string} requestedUse   — the use being requested (must match an allowed_use entry)
 * @param {Object} [context]      — optional context for scope checks
 * @param {string} [context.sourceFamily]  — source family of the requesting comparison
 * @param {string} [context.lensScope]     — declared lens of the requesting comparison
 * @returns {ConsultResult}
 */
export function consultC1(c1Object, requestedUse, context = {}) {
    // ── Step 0: guard against null/missing c1Object ──────────────────────
    if (!c1Object || typeof c1Object !== "object") {
        return deny(null, "unknown", "none_active",
            "C1 object is null or not an object");
    }

    const id      = c1Object.canonical_id     ?? null;
    const status  = c1Object.canonical_status ?? null;
    const posture = c1Object.challenge_posture ?? "unknown";

    // ── Step 1: required field check — fail closed on any missing field ───
    for (const field of REQUIRED_FIELDS) {
        if (!(field in c1Object) || c1Object[field] === undefined || c1Object[field] === null) {
            return deny(id, status, posture,
                `required field missing or null: ${field}`);
        }
    }

    // ── Step 2: runtime_handoff_enabled must be exactly true ──────────────
    if (c1Object.runtime_handoff_enabled !== true) {
        return deny(id, status, posture,
            "runtime_handoff_enabled is not true — object is not live-consultable");
    }

    // ── Step 3: status must be consultable ────────────────────────────────
    if (!CONSULTABLE_STATUSES.has(status)) {
        return deny(id, status, posture,
            `status '${status}' is not consultable — only promoted, contested, and narrowed may be consulted`);
    }

    // ── Step 4: requested use must be a non-empty string ─────────────────
    if (!requestedUse || typeof requestedUse !== "string") {
        return deny(id, status, posture,
            "requestedUse must be a non-empty string");
    }

    const reqLower = requestedUse.toLowerCase().trim();

    // ── Step 5: forbidden_use check — fail closed on any match ───────────
    const forbiddenList = c1Object.forbidden_use;
    if (!Array.isArray(forbiddenList) || forbiddenList.length === 0) {
        return deny(id, status, posture,
            "forbidden_use is absent or empty — fail closed per shape rules");
    }
    for (const forbidden of forbiddenList) {
        if (typeof forbidden === "string" && reqLower.includes(forbidden.toLowerCase())) {
            return deny(id, status, posture,
                `requested use matches forbidden_use entry: '${forbidden}'`);
        }
    }

    // ── Step 6: allowed_use check — must match at least one entry ─────────
    const allowedList = c1Object.allowed_use;
    if (!Array.isArray(allowedList) || allowedList.length === 0) {
        return deny(id, status, posture,
            "allowed_use is absent or empty — fail closed per shape rules");
    }
    const matchedAllowed = allowedList.find(
        (entry) => typeof entry === "string" && reqLower.includes(entry.toLowerCase())
    );
    if (!matchedAllowed) {
        return deny(id, status, posture,
            `requested use '${requestedUse}' is not in allowed_use whitelist`);
    }

    // ── Step 7: source family scope check ─────────────────────────────────
    if (context.sourceFamily !== undefined) {
        const declaredFamily = c1Object.source_family_scope;
        if (typeof declaredFamily === "string" &&
            context.sourceFamily.toLowerCase() !== declaredFamily.toLowerCase()) {
            return deny(id, status, posture,
                `source family mismatch: requested '${context.sourceFamily}', ` +
                `declared scope '${declaredFamily}'`);
        }
    }

    // ── Step 8: lens scope check ──────────────────────────────────────────
    if (context.lensScope !== undefined) {
        const declaredLens = c1Object.lens_scope;
        if (typeof declaredLens === "string" &&
            !context.lensScope.toLowerCase().includes("medium") &&
            !context.lensScope.toLowerCase().includes("fft") &&
            !context.lensScope.toLowerCase().includes("hann")) {
            // The declared lens is "medium FFT/Hann baseline lens only".
            // A requesting context that does not mention medium, FFT, or Hann
            // is treated as a scope mismatch.
            return deny(id, status, posture,
                `lens scope mismatch: declared scope is '${declaredLens}', ` +
                `requesting context lens '${context.lensScope}' does not match`);
        }
    }

    // ── Step 9: contested posture is visible in allow result ──────────────
    const isContested = status === "contested";
    return {
        decision:            "allow",
        canonical_id:        id,
        canonical_status:    status,
        challenge_posture:   posture,
        reason:              isContested
            ? `consultation allowed under CONTESTED posture — matched allowed_use: '${matchedAllowed}'. Active challenge must remain visible to caller.`
            : `consultation allowed — matched allowed_use: '${matchedAllowed}'`,
        effective_scope_note: c1Object.effective_scope_note,
    };
}

// ─── Internal deny helper ─────────────────────────────────────────────────

function deny(id, status, posture, reason) {
    return {
        decision:            "deny",
        canonical_id:        id,
        canonical_status:    status,
        challenge_posture:   posture,
        reason,
        effective_scope_note: null,
    };
}
