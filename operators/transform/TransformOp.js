// operators/transform/TransformOp.js

/**
 * TransformOp
 *
 * Layer: Structural Space (first structural identity layer)
 * Authority class: Structural
 *
 * Purpose:
 * Perform a coordinate rotation from bounded time-domain signal (W1) into the
 * full spectral frame (S1), projecting signal into sinusoidal basis vectors.
 * Each bin delivers three structural views of the same geometry: complex
 * identity (re, im), energy (magnitude), and phase. This is pure geometry —
 * no thresholding, no selection, no memory decisions.
 *
 * Contract:
 * - accepts W1 WindowFrame
 * - emits S1 SpectralFrame
 * - computes all bins; preserves full bin structure and fixed k→freq_hz mapping
 * - records transform_type (policy label), actual_algorithm (always "dft" in
 *   Door One), normalization_mode, energy_total, and parseval_error
 * - deterministic given identical W1 + TransformPolicy
 *
 * Non-responsibilities:
 * - does NOT drop, threshold, or rank bins — that is CompressOp's job
 * - does NOT decide what frequencies matter
 * - does NOT merge windows, detect anomalies, or compress
 * - receipt honesty: transform_type echoes policy label (e.g. "fft");
 *   actual_algorithm records what was used ("dft" in Door One); these are
 *   distinct fields so the stub is auditable and not a hidden lie
 *
 * Artifact IO:
 *   Input:  W1 WindowFrame
 *   Output: S1 SpectralFrame
 *
 * References:
 * - README_WorkflowContract.md
 * - README_MasterConstitution.md §3 (structural layer)
 * - OPERATOR_CONTRACTS.md §4
 */

/**
 * @typedef {Object} TransformPolicy
 * @property {"fft"|"dft"} transform_type
 * @property {"unitary"|"forward_raw"|"forward_1_over_N"} normalization_mode
 * @property {"real_input_half_spectrum"} [scaling_convention="real_input_half_spectrum"]
 * @property {"strict"|"tolerant"} [numeric_policy="tolerant"]
 */

/**
 * @typedef {Object} SpectralBin
 * @property {number} k
 * @property {number} freq_hz
 * @property {number} re
 * @property {number} im
 * @property {number} magnitude
 * @property {number} phase
 */

/**
 * @typedef {Object} TransformReceipt
 * @property {"fft"|"dft"} transform_type
 * @property {"dft"} actual_algorithm
 * @property {"unitary"|"forward_raw"|"forward_1_over_N"} normalization_mode
 * @property {number} energy_total
 * @property {number|null} leakage_estimate
 * @property {"f64-js"} numerical_precision
 * @property {number|null} parseval_error
 */

/**
 * @typedef {Object} SpectralFrame
 * @property {string} artifact_type
 * @property {"S1"} artifact_class
 * @property {string} stream_id
 * @property {string} window_id
 * @property {Object} grid
 * @property {number} grid.Fs_target
 * @property {number} grid.N
 * @property {number} grid.frequency_resolution
 * @property {SpectralBin[]} spectrum
 * @property {TransformReceipt} transform_receipt
 * @property {Object} policies
 * @property {string} policies.clock_policy_id
 * @property {string} policies.grid_policy_id
 * @property {string} policies.window_policy_id
 * @property {string} policies.transform_policy_id
 * @property {Object} provenance
 * @property {string[]} provenance.input_refs
 * @property {string} provenance.operator_id
 * @property {string} provenance.operator_version
 */

/**
 * @typedef {Object} TransformResult
 * @property {true} ok
 * @property {SpectralFrame} artifact
 *
 * @typedef {Object} TransformError
 * @property {false} ok
 * @property {string} error
 * @property {string[]} reasons
 *
 * @typedef {TransformResult | TransformError} TransformOutcome
 */

export class TransformOp {
    /**
     * @param {Object} cfg
     * @param {string} [cfg.operator_id="TransformOp"]
     * @param {string} [cfg.operator_version="0.1.0"]
     */
    constructor(cfg = {}) {
        this.operator_id = cfg.operator_id ?? "TransformOp";
        this.operator_version = cfg.operator_version ?? "0.1.0";
    }

    /**
     * @param {Object} input
     * @param {Object} input.w1
     * @param {"W1"} input.w1.artifact_class
     * @param {string} input.w1.stream_id
     * @param {string} input.w1.window_id
     * @param {Object} input.w1.grid
     * @param {number} input.w1.grid.Fs_target
     * @param {number} input.w1.grid.N
     * @param {Object} input.w1.samples
     * @param {(number|null)[]} input.w1.samples.aligned_values_windowed
     * @param {Object} input.w1.policies
     * @param {TransformPolicy} input.transform_policy
     * @returns {TransformOutcome}
     */
    run(input) {
        const { w1, transform_policy } = input ?? {};
        const reasons = [];

        if (!w1 || w1.artifact_class !== "W1") {
            reasons.push("input.w1 must be a valid W1 WindowFrame");
        }
        if (!w1.policies?.clock_policy_id || typeof w1.policies.clock_policy_id !== "string") {
            return {
                ok: false,
                error: "INVALID_W1",
                reasons: ["W1.policies.clock_policy_id must be a valid policy reference"],
            };
        }

        if (!w1.policies?.grid_policy_id || typeof w1.policies.grid_policy_id !== "string") {
            return {
                ok: false,
                error: "INVALID_W1",
                reasons: ["W1.policies.grid_policy_id must be a valid policy reference"],
            };
        }

        if (!w1.policies?.window_policy_id || typeof w1.policies.window_policy_id !== "string") {
            return {
                ok: false,
                error: "INVALID_W1",
                reasons: ["W1.policies.window_policy_id must be a valid policy reference"],
            };
        }
        if (!transform_policy) {
            reasons.push("transform_policy is required");
        }

        if (reasons.length > 0) {
            return { ok: false, error: "INVALID_SCHEMA", reasons };
        }

        const xRaw = w1.samples?.aligned_values_windowed;
        const N = w1.grid?.N;
        const Fs = w1.grid?.Fs_target;

        if (!Array.isArray(xRaw) || xRaw.length === 0) {
            return {
                ok: false,
                error: "INVALID_W1",
                reasons: ["W1.samples.aligned_values_windowed must be a non-empty array"],
            };
        }

        if (!Number.isInteger(N) || N <= 0 || xRaw.length !== N) {
            return {
                ok: false,
                error: "INVALID_W1",
                reasons: ["W1.grid.N must be a positive integer matching aligned_values_windowed length"],
            };
        }

        if (!Number.isFinite(Fs) || Fs <= 0) {
            return {
                ok: false,
                error: "INVALID_W1",
                reasons: ["W1.grid.Fs_target must be a positive finite number"],
            };
        }

        const transformType = transform_policy.transform_type ?? "fft";
        const normalizationMode = transform_policy.normalization_mode;
        const scalingConvention =
            transform_policy.scaling_convention ?? "real_input_half_spectrum";

        if (!normalizationMode) {
            return {
                ok: false,
                error: "INVALID_POLICY",
                reasons: ["transform_policy.normalization_mode must be specified"],
            };
        }

        if (transformType !== "fft" && transformType !== "dft") {
            return {
                ok: false,
                error: "UNSUPPORTED_TRANSFORM",
                reasons: [`transform_type=${transformType} not supported in Door One stub`],
            };
        }

        // Door One honest handling: keep nulls invalid unless pre-repaired upstream.
        if (xRaw.some((v) => v == null || Number.isNaN(v))) {
            return {
                ok: false,
                error: "NON_TRANSFORMABLE_WINDOW",
                reasons: [
                    "Window contains null/NaN values after WindowOp repair stage",
                    "TransformOp requires a fully numeric bounded window",
                ],
            };
        }

        const x = /** @type {number[]} */ (xRaw);

        // Door One: both "fft" and "dft" map to the same exact DFT.
        // actual_algorithm records the true algorithm; transform_type echoes the policy request.
        // When a real FFT backend is added, change actualAlgorithm to "fft" there.
        const actualAlgorithm = "dft"; // always exact DFT in Door One stub
        const X = computeDFT(x);

        const Xn = applyNormalization(X, normalizationMode, N);

        const df = Fs / N;
        const kMax = Math.floor(N / 2);

        /** @type {SpectralBin[]} */
        const spectrum = [];
        for (let k = 0; k <= kMax; k++) {
            const re = Xn[k].re;
            const im = Xn[k].im;
            spectrum.push({
                k,
                freq_hz: k * df,
                re,
                im,
                magnitude: Math.hypot(re, im),
                phase: Math.atan2(im, re),
            });
        }

        const timeEnergy = sumSquares(x);
        const spectralEnergy = spectralEnergyHalfSpectrum(
            Xn,
            N,
            normalizationMode,
            scalingConvention
        );
        const parsevalError =
            timeEnergy === 0 ? 0 : Math.abs(spectralEnergy - timeEnergy) / Math.max(timeEnergy, 1e-12);

        const leakageEstimate = estimateLeakage(spectrum);

        /** @type {SpectralFrame} */
        const artifact = {
            artifact_type: "SpectralFrame",
            artifact_class: "S1",
            stream_id: w1.stream_id,
            window_id: w1.window_id,
            grid: {
                Fs_target: Fs,
                N,
                frequency_resolution: df,
            },
            spectrum,
            transform_receipt: {
                transform_type: transformType,
                actual_algorithm: actualAlgorithm,
                normalization_mode: normalizationMode,
                energy_total: spectralEnergy,
                leakage_estimate: leakageEstimate,
                numerical_precision: "f64-js",
                parseval_error: parsevalError,
            },
            policies: {
                clock_policy_id: w1.policies.clock_policy_id,
                grid_policy_id: w1.policies.grid_policy_id,
                window_policy_id: w1.policies.window_policy_id,
                transform_policy_id: makeTransformPolicyId(transform_policy),
            },
            provenance: {
                input_refs: [makeInputRef(w1)],
                operator_id: this.operator_id,
                operator_version: this.operator_version,
            },
        };

        return { ok: true, artifact };
    }
}

/**
 * Exact O(N^2) DFT for Door One stub correctness.
 * Replace with FFT backend later without changing contract.
 * @param {number[]} x
 * @returns {{re:number, im:number}[]}
 */
function computeDFT(x) {
    const N = x.length;
    const X = new Array(N);

    for (let k = 0; k < N; k++) {
        let re = 0;
        let im = 0;
        for (let n = 0; n < N; n++) {
            const theta = (-2 * Math.PI * k * n) / N;
            re += x[n] * Math.cos(theta);
            im += x[n] * Math.sin(theta);
        }
        X[k] = { re, im };
    }

    return X;
}

/**
 * @param {{re:number, im:number}[]} X
 * @param {"unitary"|"forward_raw"|"forward_1_over_N"} mode
 * @param {number} N
 */
function applyNormalization(X, mode, N) {
    if (mode === "forward_raw") return X.map((z) => ({ ...z }));

    if (mode === "forward_1_over_N") {
        return X.map((z) => ({ re: z.re / N, im: z.im / N }));
    }

    if (mode === "unitary") {
        const s = Math.sqrt(N);
        return X.map((z) => ({ re: z.re / s, im: z.im / s }));
    }

    return X.map((z) => ({ ...z }));
}

/**
 * Parseval-style estimate for real-input half-spectrum artifact.
 * @param {{re:number, im:number}[]} X
 * @param {number} N
 * @param {string} scalingConvention
 */
function spectralEnergyHalfSpectrum(X, N, normalizationMode, scalingConvention) {
    let total = 0;
    for (const z of X) {
        total += z.re * z.re + z.im * z.im;
    }

    if (normalizationMode === "forward_raw") {
        return total / N;
    }

    if (normalizationMode === "forward_1_over_N") {
        return total * N;
    }

    if (normalizationMode === "unitary") {
        return total;
    }

    return total;
}

/**
 * Crude leakage estimate:
 * fraction of energy outside dominant bin neighborhood.
 * Deterministic and cheap placeholder.
 * @param {SpectralBin[]} spectrum
 */
function estimateLeakage(spectrum) {
    if (!spectrum.length) return null;
    const mags2 = spectrum.map((b) => b.magnitude * b.magnitude);
    const total = mags2.reduce((a, b) => a + b, 0);
    if (total === 0) return 0;

    let peakIdx = 0;
    for (let i = 1; i < mags2.length; i++) {
        if (mags2[i] > mags2[peakIdx]) peakIdx = i;
    }

    let kept = 0;
    for (let i = Math.max(0, peakIdx - 1); i <= Math.min(mags2.length - 1, peakIdx + 1); i++) {
        kept += mags2[i];
    }

    return 1 - kept / total;
}

/** @param {number[]} xs */
function sumSquares(xs) {
    let s = 0;
    for (const x of xs) s += x * x;
    return s;
}

function makeTransformPolicyId(policy) {
    return [
        "XFORM",
        `type=${policy.transform_type ?? "fft"}`,
        `norm=${policy.normalization_mode ?? "unspecified"}`,
        `scale=${policy.scaling_convention ?? "real_input_half_spectrum"}`,
        `numeric=${policy.numeric_policy ?? "tolerant"}`,
    ].join(":");
}

function makeInputRef(w1) {
    return w1.window_id;
}