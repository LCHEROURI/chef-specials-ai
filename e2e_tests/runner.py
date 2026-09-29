#!/usr/bin/env python3
"""
runner.py
Unified E2E Test Runner for Chef Specials AI.
Supports progressive execution, strict acceptance gates, tier filtering, and structured reporting.
"""

import argparse
import json
import os
import sys
import time
import unittest

# Ensure e2e_tests directory is in sys.path
SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
if SCRIPT_DIR not in sys.path:
    sys.path.insert(0, SCRIPT_DIR)

REPO_ROOT = os.path.abspath(os.path.join(SCRIPT_DIR, ".."))

TIER_MODULES = {
    1: "test_tier1_features",
    2: "test_tier2_boundaries",
    3: "test_tier3_pairwise",
    4: "test_tier4_scenarios"
}

class DetailedTestResult(unittest.TextTestResult):
    def __init__(self, stream, descriptions, verbosity):
        super().__init__(stream, descriptions, verbosity)
        self.passed_tests = []
        self.skipped_tests = []
        self.failed_tests = []
        self.error_tests = []

    def addSuccess(self, test):
        super().addSuccess(test)
        self.passed_tests.append(test.id())

    def addSkip(self, test, reason):
        super().addSkip(test, reason)
        self.skipped_tests.append((test.id(), reason))

    def addFailure(self, test, err):
        super().addFailure(test, err)
        self.failed_tests.append((test.id(), self._exc_info_to_string(err, test)))

    def addError(self, test, err):
        super().addError(test, err)
        self.error_tests.append((test.id(), self._exc_info_to_string(err, test)))


def load_suite(tier=None, pattern=None):
    loader = unittest.TestLoader()
    suite = unittest.TestSuite()

    selected_modules = []
    if tier:
        if tier in TIER_MODULES:
            selected_modules.append(TIER_MODULES[tier])
    else:
        selected_modules = list(TIER_MODULES.values())

    for mod_name in selected_modules:
        try:
            mod = __import__(mod_name)
            loaded = loader.loadTestsFromModule(mod)
            if pattern:
                filtered = unittest.TestSuite()
                for test in loaded:
                    if hasattr(test, "_tests"):
                        for sub in test._tests:
                            if pattern.lower() in sub.id().lower():
                                filtered.addTest(sub)
                    elif pattern.lower() in test.id().lower():
                        filtered.addTest(test)
                suite.addTest(filtered)
            else:
                suite.addTest(loaded)
        except Exception as e:
            print(f"Error loading module {mod_name}: {e}", file=sys.stderr)

    return suite


def run_tests():
    parser = argparse.ArgumentParser(description="Chef Specials AI E2E Test Suite Runner")
    parser.add_argument("--tier", type=int, choices=[1, 2, 3, 4], help="Run only specified tier (1-4)")
    parser.add_argument("--filter", "-k", type=str, help="Filter tests by name substring")
    parser.add_argument("--strict", action="store_true", help="Strict mode: treat pending/missing artifacts as failures")
    parser.add_argument("--verbose", "-v", action="store_true", help="Verbose test execution output")
    parser.add_argument("--json", action="store_true", help="Output summary in JSON format")
    args = parser.parse_args()

    if args.strict:
        os.environ["STRICT_E2E"] = "1"

    print("======================================================================")
    print("CHEF SPECIALS AI — INDEPENDENT OPAQUE-BOX E2E TEST SUITE")
    print(f"Working Directory: {REPO_ROOT}")
    print(f"Mode: {'STRICT (Milestone 5 Acceptance)' if args.strict else 'PROGRESSIVE (Milestone Development)'}")
    if args.tier:
        print(f"Scope: Tier {args.tier} only")
    else:
        print("Scope: Full 4-Tier Test Suite")
    print("======================================================================\n")

    suite = load_suite(tier=args.tier, pattern=args.filter)
    start_time = time.time()

    runner = unittest.TextTestRunner(
        resultclass=DetailedTestResult,
        verbosity=2 if args.verbose else 1
    )
    result = runner.run(suite)
    duration = time.time() - start_time

    total = result.testsRun
    passed = len(result.passed_tests)
    skipped = len(result.skipped_tests)
    failed = len(result.failed_tests)
    errors = len(result.error_tests)

    print("\n======================================================================")
    print("E2E TEST EXECUTION SUMMARY")
    print("======================================================================")
    print(f"Total Tests Executed : {total}")
    print(f"Passed (Verified)    : {passed} ({(passed/total*100):.1f}%)" if total else "Passed: 0")
    print(f"Skipped (Pending)    : {skipped} ({(skipped/total*100):.1f}%)" if total else "Skipped: 0")
    print(f"Failed               : {failed}")
    print(f"Errors               : {errors}")
    print(f"Duration             : {duration:.2f}s")
    print("======================================================================")

    if args.json:
        summary_data = {
            "total": total,
            "passed": passed,
            "skipped": skipped,
            "failed": failed,
            "errors": errors,
            "duration": round(duration, 3),
            "strict": args.strict,
            "tier": args.tier or "all",
            "passed_tests": result.passed_tests,
            "skipped_tests": [s[0] for s in result.skipped_tests],
            "failed_tests": [f[0] for f in result.failed_tests],
            "error_tests": [e[0] for e in result.error_tests]
        }
        print("\n--- JSON SUMMARY ---")
        print(json.dumps(summary_data, indent=2))

    if failed > 0 or errors > 0:
        sys.exit(1)
    if args.strict and skipped > 0:
        print("\n[STRICT CHECK FAILED]: Pending tests remain unverified in strict mode!")
        sys.exit(1)

    sys.exit(0)


if __name__ == "__main__":
    run_tests()
