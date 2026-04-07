"use strict";

export const ACTIVE_SHELL_STATE_EVENT = "dme:active-shell-state";
const ACTIVE_SHELL_STATE_STORAGE_KEY = "dme.activeShellState.v1";

function resolveRunLabel(record) {
    return record?.context_run_label ?? record?.run_label ?? null;
}

function classifySourceBasis(entry = {}) {
    const family = String(entry?.sourceFamilyLabel ?? entry?.source_family_label ?? "").toLowerCase();
    const sourceId = String(entry?.runResult?.artifacts?.a1?.source_id ?? entry?.source_id ?? "").toLowerCase();
    const sourceMode = String(entry?.runResult?.artifacts?.a1?.meta?.source_mode ?? "").toLowerCase();

    if (sourceMode === "recorded_source" || family.includes("recorded")) return "recorded";
    if (family.includes("synthetic") || sourceId.startsWith("synthetic.")) return "synthetic";
    return "other";
}

function filterActiveLogEntries(log, activeRunLabel) {
    if (!Array.isArray(log) || !activeRunLabel) return [];
    return log.filter((entry) => resolveRunLabel(entry) === activeRunLabel);
}

function latestRunCaseForKind(runHistory, replayLog, kind) {
    if (!Array.isArray(runHistory) || runHistory.length === 0) return null;

    const matchingRuns = runHistory.filter((entry) => classifySourceBasis(entry) === kind);
    if (matchingRuns.length === 0) return null;

    const fullReplayLog = Array.isArray(replayLog) ? replayLog : [];
    const withReplay = matchingRuns.find((entry) =>
        fullReplayLog.some((replay) => resolveRunLabel(replay) === (entry?.runLabel ?? entry?.runResult?.run_label ?? null))
    );
    const chosen = withReplay ?? matchingRuns[0];
    const runLabel = chosen?.runLabel ?? chosen?.runResult?.run_label ?? null;
    const replay = fullReplayLog.find((record) => resolveRunLabel(record) === runLabel) ?? null;

    return {
        runLabel,
        sourceFamilyLabel: chosen?.sourceFamilyLabel ?? "unspecified",
        runResult: chosen?.runResult ?? null,
        workbench: chosen?.workbench ?? null,
        replay,
    };
}

function buildSourceComparison(runHistory, replayLog) {
    const synthetic = latestRunCaseForKind(runHistory, replayLog, "synthetic");
    const recorded = latestRunCaseForKind(runHistory, replayLog, "recorded");

    if (!synthetic && !recorded) return null;

    return {
        synthetic,
        recorded,
    };
}

export function annotateShellRecord(record, {
    runId = null,
    runResult = null,
    sourceFamilyLabel = "unspecified",
} = {}) {
    if (!record || typeof record !== "object") return record;

    const activeRunLabel = runResult?.run_label ?? record?.run_label ?? null;
    return {
        ...record,
        context_run_id: runId,
        context_run_label: activeRunLabel,
        source_family_label: record?.source_family_label ?? sourceFamilyLabel,
    };
}

export function buildActiveShellState({
    runId = null,
    runResult = null,
    workbench = null,
    requestLog = [],
    replayLog = [],
    runHistory = [],
    sourceFamilyLabel = "unspecified",
    runStatus = "idle",
    runError = null,
} = {}) {
    const activeRunLabel = runResult?.run_label ?? null;
    const activeRequestLog = filterActiveLogEntries(requestLog, activeRunLabel);
    const activeReplayLog = filterActiveLogEntries(replayLog, activeRunLabel);
    const activeRequest = activeRequestLog[0] ?? null;

    return {
        runId,
        activeRunLabel,
        workbench,
        runResult,
        activeRequest,
        requestLog: activeRequestLog,
        replayLog: activeReplayLog,
        requestHistoryCount: Array.isArray(requestLog) ? requestLog.length : 0,
        replayHistoryCount: Array.isArray(replayLog) ? replayLog.length : 0,
        sourceFamilyLabel,
        sourceComparison: buildSourceComparison(runHistory, replayLog),
        runStatus,
        runError,
        hasActiveResult: !!(runResult?.ok && workbench),
    };
}

function buildPublishedShellState(activeShellState = {}) {
    return {
        runId: activeShellState?.runId ?? null,
        activeRunLabel: activeShellState?.activeRunLabel ?? null,
        workbench: activeShellState?.workbench ?? null,
        runResult: activeShellState?.runResult ?? null,
        activeRequest: activeShellState?.activeRequest ?? null,
        requestLog: Array.isArray(activeShellState?.requestLog) ? activeShellState.requestLog : [],
        replayLog: Array.isArray(activeShellState?.replayLog) ? activeShellState.replayLog : [],
        requestHistoryCount: activeShellState?.requestHistoryCount ?? 0,
        replayHistoryCount: activeShellState?.replayHistoryCount ?? 0,
        sourceFamilyLabel: activeShellState?.sourceFamilyLabel ?? "unspecified",
        runStatus: activeShellState?.runStatus ?? "idle",
        runError: activeShellState?.runError ?? null,
        hasActiveResult: !!activeShellState?.hasActiveResult,
    };
}

export function readPublishedShellState() {
    if (typeof window === "undefined" || !window.sessionStorage) {
        return null;
    }

    try {
        const raw = window.sessionStorage.getItem(ACTIVE_SHELL_STATE_STORAGE_KEY);
        return raw ? JSON.parse(raw) : null;
    } catch (_) {
        return null;
    }
}

export function publishActiveShellState(activeShellState = {}) {
    const publishedShellState = buildPublishedShellState(activeShellState);

    if (typeof window === "undefined") {
        return publishedShellState;
    }

    try {
        window.sessionStorage?.setItem(
            ACTIVE_SHELL_STATE_STORAGE_KEY,
            JSON.stringify(publishedShellState)
        );
    } catch (_) {
        // Storage sync is best-effort only.
    }

    if (typeof window.dispatchEvent === "function" && typeof window.CustomEvent === "function") {
        window.dispatchEvent(
            new window.CustomEvent(ACTIVE_SHELL_STATE_EVENT, {
                detail: publishedShellState,
            })
        );
    }

    return publishedShellState;
}
