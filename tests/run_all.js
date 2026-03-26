// tests/run_all.js
//
// Unified test runner for the Dynamical Memory Engine.
//
// Discovers all test_*.js files in the tests/ directory, runs them
// sequentially as child processes, collects pass/fail counts from their
// stdout, and exits with code 1 if any file fails.
//
// Usage:
//   node tests/run_all.js
//   npm test
//   npm run test:watch   (uses --watch flag via package.json script)
//
// Output format:
//   Each test file is run in isolation. Pass/fail counts are parsed from the
//   final summary line printed by each file's own harness (the pattern used
//   across all existing test files in this repo):
//     "  <N> passed   <M> failed"
//   If a file exits with a non-zero code, it is counted as failed even if
//   output parsing fails.

import { spawnSync } from "node:child_process";
import { readdirSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));

// ── Locate the tests/ directory ───────────────────────────────────────────────
// run_all.js lives in tests/; resolve sibling test files from the same dir.
const TESTS_DIR = __dirname;
const REPO_ROOT = join(__dirname, "..");

// ── Discover test files ───────────────────────────────────────────────────────
const allFiles = readdirSync(TESTS_DIR).sort();
const testFiles = allFiles.filter(f => f.startsWith("test_") && f.endsWith(".js"));

if (testFiles.length === 0) {
    console.error("run_all.js: No test_*.js files found in", TESTS_DIR);
    process.exit(1);
}

// ── Run each test file ────────────────────────────────────────────────────────
let totalPass = 0;
let totalFail = 0;
const fileResults = [];

const PASS_FAIL_RE = /(\d+)\s+passed\s+(\d+)\s+failed/;

console.log(`\nDynamical Memory Engine — Test Suite`);
console.log(`Running ${testFiles.length} test files from ${TESTS_DIR}\n`);
console.log("═".repeat(54));

for (const file of testFiles) {
    const filePath = join(TESTS_DIR, file);
    const start = Date.now();

    const result = spawnSync(process.execPath, [filePath], {
        cwd: REPO_ROOT,
        encoding: "utf8",
        // Pipe both stdout and stderr so we can parse summary lines.
        // We'll print stdout live after the run.
        timeout: 60_000, // 60s per file; long-running orchestrator tests need headroom
    });

    const elapsed = Date.now() - start;
    const output = (result.stdout ?? "") + (result.stderr ?? "");
    const exitCode = result.status ?? 1;

    // Parse the "N passed   M failed" summary line
    let filePassed = 0;
    let fileFailed = 0;
    const match = output.match(PASS_FAIL_RE);
    if (match) {
        filePassed = parseInt(match[1], 10);
        fileFailed = parseInt(match[2], 10);
    }

    // If the process crashed/timed out but no summary was found, treat as 1 failure
    const fileOk = exitCode === 0 && fileFailed === 0;
    if (!fileOk && fileFailed === 0 && !match) {
        fileFailed = 1;
    }

    totalPass += filePassed;
    totalFail += fileFailed;

    const statusIcon = fileOk ? "✓" : "✗";
    const countStr = match ? `${filePassed}p ${fileFailed}f` : (exitCode !== 0 ? "crashed" : "no-summary");
    console.log(`\n  ${statusIcon} ${file}  [${countStr}]  (${elapsed}ms)`);

    // Always print the file's output so failures are visible inline
    if (output.trim()) {
        // Indent each line for readability
        const indented = output.replace(/^/gm, "    ");
        process.stdout.write(indented);
        if (!indented.endsWith("\n")) process.stdout.write("\n");
    }

    if (result.error) {
        console.error(`    [spawn error] ${result.error.message}`);
    }

    fileResults.push({ file, ok: fileOk, passed: filePassed, failed: fileFailed, exitCode });
}

// ── Summary ───────────────────────────────────────────────────────────────────
console.log("\n" + "═".repeat(54));
console.log(`\n  Files:  ${testFiles.length} total`);
console.log(`  Tests:  ${totalPass} passed   ${totalFail} failed`);

const failedFiles = fileResults.filter(r => !r.ok);
if (failedFiles.length > 0) {
    console.log(`\n  Failed files (${failedFiles.length}):`);
    for (const r of failedFiles) {
        console.log(`    ✗ ${r.file}  (exit ${r.exitCode}, ${r.failed} test failure(s))`);
    }
    console.log("\n  TEST RUN FAILED ✗\n");
    process.exit(1);
} else {
    console.log("\n  ALL TEST FILES PASSED ✓\n");
}
