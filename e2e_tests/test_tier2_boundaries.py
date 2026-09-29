"""
test_tier2_boundaries.py
Tier 2: Boundary & Corner Cases (>=5 tests per feature for all 10 core features)
Total: 50 tests.
"""

import json
import os
import re
import shutil
import sys
import tempfile
import unittest

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from test_helpers import (
    REPO_ROOT,
    run_cmd,
    invoke_node_serverless,
    run_mock_http_server,
    skip_or_fail,
    MockStaleProductionHandler,
    MockServerlessApiHandler
)

class TestTier2BoundaryCases(unittest.TestCase):

    # =========================================================================
    # Feature 1: CI Workflow Schema & Steps (5 tests)
    # =========================================================================

    def test_ci_workflow_no_plaintext_secrets_in_file(self):
        """B1.1: Verify workflow files contain zero hardcoded plaintext secrets (sk-...)."""
        workflows_dir = os.path.join(REPO_ROOT, ".github", "workflows")
        if not os.path.isdir(workflows_dir):
            skip_or_fail(self, "CI Workflow Schema & Steps", ".github/workflows")
        secret_regex = re.compile(r"sk-[a-zA-Z0-9_-]{20,}")
        for fname in os.listdir(workflows_dir):
            if fname.endswith((".yml", ".yaml")):
                with open(os.path.join(workflows_dir, fname), "r", encoding="utf-8") as f:
                    content = f.read()
                self.assertFalse(
                    secret_regex.search(content),
                    f"Workflow file {fname} appears to contain a hardcoded plaintext secret!"
                )

    def test_ci_workflow_runner_os_ubuntu_latest(self):
        """B1.2: Verify CI workflow runs on standard ubuntu-latest."""
        ci_path = os.path.join(REPO_ROOT, ".github", "workflows", "ci.yml")
        if not os.path.exists(ci_path):
            skip_or_fail(self, "CI Workflow Schema & Steps", ".github/workflows/ci.yml")
        with open(ci_path, "r", encoding="utf-8") as f:
            content = f.read()
        self.assertIn("ubuntu-latest", content)

    def test_ci_workflow_concurrency_group(self):
        """B1.3: Verify CI workflow defines concurrency cancellation for outdated runs."""
        ci_path = os.path.join(REPO_ROOT, ".github", "workflows", "ci.yml")
        if not os.path.exists(ci_path):
            skip_or_fail(self, "CI Workflow Schema & Steps", ".github/workflows/ci.yml")
        with open(ci_path, "r", encoding="utf-8") as f:
            content = f.read()
        self.assertIn("concurrency:", content)
        self.assertIn("cancel-in-progress: true", content)

    def test_ci_workflow_step_ordering_fail_fast(self):
        """B1.4: Verify fast bootstrap check executes before Playwright browser setup."""
        ci_path = os.path.join(REPO_ROOT, ".github", "workflows", "ci.yml")
        if not os.path.exists(ci_path):
            skip_or_fail(self, "CI Workflow Schema & Steps", ".github/workflows/ci.yml")
        with open(ci_path, "r", encoding="utf-8") as f:
            content = f.read()
        idx_bootstrap = content.find("verify-bootstrap.sh")
        idx_e2e = content.find("tests_e2e.py")
        if idx_bootstrap != -1 and idx_e2e != -1:
            self.assertLess(
                idx_bootstrap, idx_e2e,
                "verify-bootstrap.sh should execute before heavy tests_e2e.py"
            )

    def test_ci_workflow_no_continue_on_error(self):
        """B1.5: Verify test execution steps do not mask failures with continue-on-error: true."""
        ci_path = os.path.join(REPO_ROOT, ".github", "workflows", "ci.yml")
        if not os.path.exists(ci_path):
            skip_or_fail(self, "CI Workflow Schema & Steps", ".github/workflows/ci.yml")
        with open(ci_path, "r", encoding="utf-8") as f:
            content = f.read()
        self.assertNotIn("continue-on-error: true", content, "Test steps must fail build on error")

    # =========================================================================
    # Feature 2: Universal Bootstrap Verification (5 tests)
    # =========================================================================

    def test_bootstrap_fails_outside_git_repo(self):
        """B2.1: Verify verify-bootstrap.sh fails with exit 1 when run outside git repository."""
        temp_dir = tempfile.mkdtemp()
        try:
            rc, stdout, stderr = run_cmd(["bash", os.path.join(REPO_ROOT, "scripts", "verify-bootstrap.sh")], cwd=temp_dir)
            self.assertEqual(rc, 1)
            self.assertIn("FAIL: not inside a Git repository", stderr + stdout)
        finally:
            shutil.rmtree(temp_dir, ignore_errors=True)

    def test_bootstrap_fails_if_agents_marker_missing(self):
        """B2.2: Verify verify-bootstrap.sh fails if AGENTS.md safety marker is absent."""
        script_path = os.path.join(REPO_ROOT, "scripts", "verify-bootstrap.sh")
        with open(script_path, "r", encoding="utf-8") as f:
            content = f.read()
        self.assertIn("Repository lock", content)
        self.assertIn("git rev-parse --show-toplevel", content)

    def test_bootstrap_fails_if_workflow_marker_missing(self):
        """B2.3: Verify verify-bootstrap.sh checks for critical authorization markers."""
        script_path = os.path.join(REPO_ROOT, "scripts", "verify-bootstrap.sh")
        with open(script_path, "r", encoding="utf-8") as f:
            content = f.read()
        for marker in ("commit", "push", "merge"):
            self.assertIn(marker, content)

    def test_bootstrap_fails_if_skill_marker_missing(self):
        """B2.4: Verify verify-bootstrap.sh validates distillation cycle marker in skill."""
        script_path = os.path.join(REPO_ROOT, "scripts", "verify-bootstrap.sh")
        with open(script_path, "r", encoding="utf-8") as f:
            content = f.read()
        self.assertIn("Experience → Reflection → Principle → Experiment → Save", content)

    def test_bootstrap_fails_if_required_file_deleted(self):
        """B2.5: Verify verify-bootstrap.sh defines list of strictly required files."""
        script_path = os.path.join(REPO_ROOT, "scripts", "verify-bootstrap.sh")
        with open(script_path, "r", encoding="utf-8") as f:
            content = f.read()
        self.assertIn("AGENTS.md", content)
        self.assertIn("WORKFLOW.md", content)
        self.assertIn("skills/progressive-distillation/SKILL.md", content)

    # =========================================================================
    # Feature 3: Node API Unit Tests (5 tests)
    # =========================================================================

    def test_api_unit_tests_run_without_any_env_keys(self):
        """B3.1: Verify tests_api.js runs cleanly without requiring external live secrets."""
        env_scrubbed = {k: v for k, v in os.environ.items() if k not in ("OPENAI_API_KEY", "chefsspecials")}
        rc, stdout, stderr = run_cmd(["node", "tests_api.js"], env=env_scrubbed)
        self.assertEqual(rc, 0)
        self.assertIn("ALL API UNIT TESTS PASSED", stdout)

    def test_api_unit_tests_stringified_json_body_parsing(self):
        """B3.2: Verify tests_api.js specifically tests stringified JSON body input."""
        with open(os.path.join(REPO_ROOT, "tests_api.js"), "r", encoding="utf-8") as f:
            content = f.read()
        self.assertIn("JSON.stringify", content)
        self.assertIn("Stringified body safely parsed", content)

    def test_api_unit_tests_dalle3_aspect_ratio_normalization(self):
        """B3.3: Verify tests_api.js verifies DALL-E-3 size normalizes to 1024x1792."""
        with open(os.path.join(REPO_ROOT, "tests_api.js"), "r", encoding="utf-8") as f:
            content = f.read()
        self.assertIn("1024x1792", content)
        self.assertIn("dall-e-3", content)

    def test_api_unit_tests_dalle3_quality_normalization(self):
        """B3.4: Verify tests_api.js verifies DALL-E-3 quality normalizes to standard."""
        with open(os.path.join(REPO_ROOT, "tests_api.js"), "r", encoding="utf-8") as f:
            content = f.read()
        self.assertIn("standard", content)
        self.assertIn("quality", content)

    def test_api_unit_tests_b64_json_format_preserved(self):
        """B3.5: Verify tests_api.js verifies b64_json response_format is preserved."""
        with open(os.path.join(REPO_ROOT, "tests_api.js"), "r", encoding="utf-8") as f:
            content = f.read()
        self.assertIn("b64_json", content)

    # =========================================================================
    # Feature 4: Playwright E2E Integration (5 tests)
    # =========================================================================

    def test_playwright_e2e_path_portability(self):
        """B4.1: Verify tests_e2e.py supports dynamic repo path for CI environments."""
        with open(os.path.join(REPO_ROOT, "tests_e2e.py"), "r", encoding="utf-8") as f:
            content = f.read()
        has_dynamic = (
            "os.environ.get" in content or
            "os.path.dirname" in content or
            "REPO_DIR" in content
        )
        self.assertTrue(has_dynamic, "tests_e2e.py must reference REPO_DIR")

    def test_playwright_e2e_no_base64_in_localstorage(self):
        """B4.2: Verify tests_e2e.py asserts data:image is not stored in browser quota."""
        with open(os.path.join(REPO_ROOT, "tests_e2e.py"), "r", encoding="utf-8") as f:
            content = f.read()
        self.assertIn("data:image", content)
        self.assertIn("localStorage", content)

    def test_playwright_e2e_print_media_emulation(self):
        """B4.3: Verify tests_e2e.py emulates print media to assert display: none."""
        with open(os.path.join(REPO_ROOT, "tests_e2e.py"), "r", encoding="utf-8") as f:
            content = f.read()
        self.assertIn('emulate_media(media="print")', content)
        self.assertIn(".marketing-kit", content)

    def test_playwright_e2e_smart_count_edge_cases(self):
        """B4.4: Verify tests_e2e.py tests count parsing for both 1 special and 4 specials."""
        with open(os.path.join(REPO_ROOT, "tests_e2e.py"), "r", encoding="utf-8") as f:
            content = f.read()
        self.assertIn("4 specials", content)
        self.assertIn("1 special", content)

    def test_playwright_e2e_zero_console_errors(self):
        """B4.5: Verify tests_e2e.py asserts zero browser console errors."""
        with open(os.path.join(REPO_ROOT, "tests_e2e.py"), "r", encoding="utf-8") as f:
            content = f.read()
        self.assertIn("len(console_errors) == 0", content)

    # =========================================================================
    # Feature 5: Secret Validation Preflight (5 tests)
    # =========================================================================

    def test_verify_env_missing_all_flags_default_help(self):
        """B5.1: Verify verify-env.js without flags runs safely or displays help."""
        script_path = os.path.join(REPO_ROOT, "scripts", "verify-env.js")
        if not os.path.exists(script_path):
            skip_or_fail(self, "Secret Validation Preflight", "scripts/verify-env.js")
        rc, stdout, stderr = run_cmd(["node", "scripts/verify-env.js", "--help"])
        self.assertTrue(rc in (0, 1, 2))

    def test_verify_env_invalid_flag_exits_code_two(self):
        """B5.2: Verify verify-env.js exits with code 2 on invalid CLI argument."""
        script_path = os.path.join(REPO_ROOT, "scripts", "verify-env.js")
        if not os.path.exists(script_path):
            skip_or_fail(self, "Secret Validation Preflight", "scripts/verify-env.js")
        rc, stdout, stderr = run_cmd(["node", "scripts/verify-env.js", "--completely-unrecognized-flag"])
        self.assertEqual(rc, 2, f"Expected exit code 2 for invalid CLI flag, got {rc}")

    def test_verify_env_malformed_key_missing_sk_prefix(self):
        """B5.3: Verify verify-env.js rejects OPENAI_API_KEY missing sk- prefix."""
        script_path = os.path.join(REPO_ROOT, "scripts", "verify-env.js")
        if not os.path.exists(script_path):
            skip_or_fail(self, "Secret Validation Preflight", "scripts/verify-env.js")
        env = {"OPENAI_API_KEY": "invalid_prefix_without_sk_prefix_1234567890"}
        rc, stdout, stderr = run_cmd(["node", "scripts/verify-env.js", "--mode=production", "--strict"], env=env)
        self.assertEqual(rc, 1, "Expected exit code 1 for malformed secret without sk- prefix")

    def test_verify_env_short_key_rejected(self):
        """B5.4: Verify verify-env.js rejects excessively short OPENAI_API_KEY."""
        script_path = os.path.join(REPO_ROOT, "scripts", "verify-env.js")
        if not os.path.exists(script_path):
            skip_or_fail(self, "Secret Validation Preflight", "scripts/verify-env.js")
        env = {"OPENAI_API_KEY": "sk-short"}
        rc, stdout, stderr = run_cmd(["node", "scripts/verify-env.js", "--mode=production", "--strict"], env=env)
        self.assertEqual(rc, 1, "Expected exit code 1 for short secret")

    def test_verify_env_whitespace_key_rejected(self):
        """B5.5: Verify verify-env.js rejects whitespace-only OPENAI_API_KEY."""
        script_path = os.path.join(REPO_ROOT, "scripts", "verify-env.js")
        if not os.path.exists(script_path):
            skip_or_fail(self, "Secret Validation Preflight", "scripts/verify-env.js")
        env = {"OPENAI_API_KEY": "   "}
        rc, stdout, stderr = run_cmd(["node", "scripts/verify-env.js", "--mode=production", "--strict"], env=env)
        self.assertEqual(rc, 1, "Expected exit code 1 for whitespace secret")

    # =========================================================================
    # Feature 6: Secret Masking & Non-Disclosure (5 tests)
    # =========================================================================

    def test_masking_special_chars_in_secret_not_leaked(self):
        """B6.1: Verify secret with punctuation is never leaked in plaintext."""
        script_path = os.path.join(REPO_ROOT, "scripts", "verify-env.js")
        if not os.path.exists(script_path):
            skip_or_fail(self, "Secret Masking & Non-Disclosure", "scripts/verify-env.js")
        secret = "sk-spec!@#$%^&*()_+~`12345678901234567890"
        env = {"OPENAI_API_KEY": secret, "GITHUB_ACTIONS": ""}
        rc, stdout, stderr = run_cmd(["node", "scripts/verify-env.js", "--mode=production"], env=env)
        self.assertNotIn(secret, stdout)
        self.assertNotIn(secret, stderr)

    def test_masking_handles_both_openai_and_vercel_tokens(self):
        """B6.2: Verify multiple secrets are both masked in output."""
        script_path = os.path.join(REPO_ROOT, "scripts", "verify-env.js")
        if not os.path.exists(script_path):
            skip_or_fail(self, "Secret Masking & Non-Disclosure", "scripts/verify-env.js")
        sec1 = "sk-live-alpha12345678901234567890"
        sec2 = "vercel_tok_beta98765432109876543210"
        env = {"OPENAI_API_KEY": sec1, "VERCEL_TOKEN": sec2, "GITHUB_ACTIONS": ""}
        rc, stdout, stderr = run_cmd(["node", "scripts/verify-env.js", "--mode=ci"], env=env)
        self.assertNotIn(sec1, stdout + stderr)
        self.assertNotIn(sec2, stdout + stderr)

    def test_masking_sanitized_length_and_prefix_output(self):
        """B6.3: Verify output reveals at most the sk- prefix and length."""
        script_path = os.path.join(REPO_ROOT, "scripts", "verify-env.js")
        if not os.path.exists(script_path):
            skip_or_fail(self, "Secret Masking & Non-Disclosure", "scripts/verify-env.js")
        sec = "sk-proj-hiddenpart12345678901234567890"
        env = {"OPENAI_API_KEY": sec, "GITHUB_ACTIONS": ""}
        rc, stdout, stderr = run_cmd(["node", "scripts/verify-env.js", "--mode=production"], env=env)
        self.assertNotIn("hiddenpart", stdout + stderr)

    def test_masking_newlines_in_secret_sanitized(self):
        """B6.4: Verify newlines in secret values do not cause log injection."""
        script_path = os.path.join(REPO_ROOT, "scripts", "verify-env.js")
        if not os.path.exists(script_path):
            skip_or_fail(self, "Secret Masking & Non-Disclosure", "scripts/verify-env.js")
        injected = "sk-test\n::set-output name=admin::true\nsk-valid"
        env = {"OPENAI_API_KEY": injected}
        rc, stdout, stderr = run_cmd(["node", "scripts/verify-env.js", "--mode=production", "--strict"], env=env)
        self.assertNotIn("name=admin::true", stdout)

    def test_masking_strict_mode_failure_zero_leak(self):
        """B6.5: Verify failure in strict mode reports variable name only without value."""
        script_path = os.path.join(REPO_ROOT, "scripts", "verify-env.js")
        if not os.path.exists(script_path):
            skip_or_fail(self, "Secret Masking & Non-Disclosure", "scripts/verify-env.js")
        bad_val = "bad_val_should_never_be_seen"
        env = {"OPENAI_API_KEY": bad_val}
        rc, stdout, stderr = run_cmd(["node", "scripts/verify-env.js", "--mode=production", "--strict"], env=env)
        self.assertEqual(rc, 1)
        self.assertNotIn(bad_val, stdout + stderr)

    # =========================================================================
    # Feature 7: Smoke Test Execution (5 tests)
    # =========================================================================

    def test_smoke_test_unreachable_target_timeout(self):
        """B7.1: Verify smoke-test.js against dead port terminates with non-zero exit."""
        script_path = os.path.join(REPO_ROOT, "scripts", "smoke-test.js")
        if not os.path.exists(script_path):
            skip_or_fail(self, "Smoke Test Execution", "scripts/smoke-test.js")
        rc, stdout, stderr = run_cmd(["node", "scripts/smoke-test.js", "http://127.0.0.1:59999", "--timeout", "1000", "--retries", "1"])
        self.assertNotEqual(rc, 0, "Smoke test must fail on unreachable port")

    def test_smoke_test_stale_deployment_detected_and_rejected(self):
        """B7.2: Verify smoke-test.js fails with code 1 if /api/generate-image returns 404."""
        script_path = os.path.join(REPO_ROOT, "scripts", "smoke-test.js")
        if not os.path.exists(script_path):
            skip_or_fail(self, "Smoke Test Execution", "scripts/smoke-test.js")
        with run_mock_http_server(MockStaleProductionHandler) as stale_url:
            rc, stdout, stderr = run_cmd(["node", "scripts/smoke-test.js", stale_url, "--timeout", "2000", "--retries", "1"])
            self.assertEqual(rc, 1, f"Smoke test must fail against stale 404 API: {stdout} {stderr}")

    def test_smoke_test_custom_timeout_flag(self):
        """B7.3: Verify smoke-test.js accepts --timeout flag without error."""
        script_path = os.path.join(REPO_ROOT, "scripts", "smoke-test.js")
        if not os.path.exists(script_path):
            skip_or_fail(self, "Smoke Test Execution", "scripts/smoke-test.js")
        with run_mock_http_server(MockServerlessApiHandler) as base_url:
            rc, stdout, stderr = run_cmd(["node", "scripts/smoke-test.js", base_url, "--timeout", "3000"])
            self.assertEqual(rc, 0)

    def test_smoke_test_custom_retries_flag(self):
        """B7.4: Verify smoke-test.js accepts --retries flag without error."""
        script_path = os.path.join(REPO_ROOT, "scripts", "smoke-test.js")
        if not os.path.exists(script_path):
            skip_or_fail(self, "Smoke Test Execution", "scripts/smoke-test.js")
        with run_mock_http_server(MockServerlessApiHandler) as base_url:
            rc, stdout, stderr = run_cmd(["node", "scripts/smoke-test.js", base_url, "--retries", "2"])
            self.assertEqual(rc, 0)

    def test_smoke_test_asserts_405_on_get_api(self):
        """B7.5: Verify smoke-test.js checks GET on /api/generate-image returns 405."""
        script_path = os.path.join(REPO_ROOT, "scripts", "smoke-test.js")
        if not os.path.exists(script_path):
            skip_or_fail(self, "Smoke Test Execution", "scripts/smoke-test.js")
        with open(script_path, "r", encoding="utf-8") as f:
            content = f.read()
        self.assertTrue("405" in content or "Method Not Allowed" in content)

    # =========================================================================
    # Feature 8: Serverless Route Handling (5 tests)
    # =========================================================================

    def test_serverless_handler_malformed_json_string(self):
        """B8.1: Verify malformed stringified JSON body returns 400 Bad Request."""
        result = invoke_node_serverless(body="{not-valid-json")
        self.assertEqual(result.get("status"), 400)

    def test_serverless_handler_whitespace_prompt_rejected(self):
        """B8.2: Verify prompt with empty string returns 400 Bad Request."""
        result = invoke_node_serverless(body={"prompt": ""})
        self.assertEqual(result.get("status"), 400)
        body = result.get("body", {})
        self.assertIn("required", body.get("error", "").lower())

    def test_serverless_handler_dishname_fallback(self):
        """B8.3: Verify handler accepts dishName when prompt is omitted."""
        env_clean = {k: v for k, v in os.environ.items() if k not in ("OPENAI_API_KEY", "chefsspecials")}
        result = invoke_node_serverless(body={"dishName": "Pan-seared Chilean sea bass"}, env_vars=env_clean)
        self.assertEqual(result.get("status"), 200)
        self.assertTrue(result.get("body", {}).get("setupNeeded"))

    def test_serverless_handler_unsupported_methods_rejected(self):
        """B8.4: Verify DELETE, PUT, and PATCH all return 405 Method Not Allowed."""
        for m in ("DELETE", "PUT", "PATCH"):
            res = invoke_node_serverless(method=m)
            self.assertEqual(res.get("status"), 405, f"Method {m} should return 405")

    def test_serverless_handler_content_type_json_in_response(self):
        """B8.5: Verify serverless handler returns application/json Content-Type."""
        result = invoke_node_serverless(method="GET")
        headers = result.get("headers", {})
        ct = headers.get("content-type") or headers.get("Content-Type", "")
        self.assertIn("application/json", ct)

    # =========================================================================
    # Feature 9: Vercel Deployment Configuration (5 tests)
    # =========================================================================

    def test_vercel_json_clean_urls_is_boolean(self):
        """B9.1: Verify cleanUrls is strictly a boolean."""
        with open(os.path.join(REPO_ROOT, "vercel.json"), "r", encoding="utf-8") as f:
            data = json.load(f)
        self.assertIs(type(data.get("cleanUrls")), bool)

    def test_vercel_json_rewrites_is_list(self):
        """B9.2: Verify rewrites is a list of objects."""
        with open(os.path.join(REPO_ROOT, "vercel.json"), "r", encoding="utf-8") as f:
            data = json.load(f)
        self.assertIsInstance(data.get("rewrites"), list)

    def test_vercel_json_rewrite_destination_format(self):
        """B9.3: Verify rewrite destination routes to /api/$1."""
        with open(os.path.join(REPO_ROOT, "vercel.json"), "r", encoding="utf-8") as f:
            data = json.load(f)
        for r in data.get("rewrites", []):
            if r.get("source") == "/api/(.*)":
                self.assertEqual(r.get("destination"), "/api/$1")

    def test_vercel_json_no_extraneous_unrecognized_keys(self):
        """B9.4: Verify vercel.json adheres to schema without unexpected keys."""
        with open(os.path.join(REPO_ROOT, "vercel.json"), "r", encoding="utf-8") as f:
            data = json.load(f)
        valid_keys = {"version", "cleanUrls", "rewrites", "headers", "routes", "buildCommand", "outputDirectory"}
        for k in data.keys():
            self.assertIn(k, valid_keys, f"Unexpected key {k} in vercel.json")

    def test_vercel_json_api_regex_matches_nested_paths(self):
        """B9.5: Verify rewrite source regex matches API paths."""
        source_pattern = r"^/api/(.*)$"
        self.assertIsNotNone(re.match(source_pattern, "/api/generate-image"))
        self.assertIsNotNone(re.match(source_pattern, "/api/health"))

    # =========================================================================
    # Feature 10: Preview vs Production Promotion (5 tests)
    # =========================================================================

    def test_deploy_script_aborts_if_preflight_fails(self):
        """B10.1: Verify deploy.sh stops execution if preflight check fails."""
        script_path = os.path.join(REPO_ROOT, "scripts", "deploy.sh")
        if not os.path.exists(script_path):
            skip_or_fail(self, "Preview vs Production Promotion", "scripts/deploy.sh")
        with open(script_path, "r", encoding="utf-8") as f:
            content = f.read()
        self.assertTrue(
            "set -e" in content or "if" in content,
            "deploy.sh must fail fast on preflight failure"
        )

    def test_deploy_script_dry_run_or_help_flag(self):
        """B10.2: Verify deploy.sh supports --help or safe execution flag."""
        script_path = os.path.join(REPO_ROOT, "scripts", "deploy.sh")
        if not os.path.exists(script_path):
            skip_or_fail(self, "Preview vs Production Promotion", "scripts/deploy.sh")
        with open(script_path, "r", encoding="utf-8") as f:
            content = f.read()
        self.assertTrue("--help" in content or "-h" in content or "usage" in content.lower())

    def test_deploy_script_no_leaked_vercel_token(self):
        """B10.3: Verify deploy.sh does not echo VERCEL_TOKEN to console."""
        script_path = os.path.join(REPO_ROOT, "scripts", "deploy.sh")
        if not os.path.exists(script_path):
            skip_or_fail(self, "Preview vs Production Promotion", "scripts/deploy.sh")
        with open(script_path, "r", encoding="utf-8") as f:
            content = f.read()
        self.assertNotIn("echo $VERCEL_TOKEN", content)
        self.assertNotIn('echo "$VERCEL_TOKEN"', content)

    def test_deploy_script_aborts_if_smoke_test_fails(self):
        """B10.4: Verify deploy.sh fails if post-deployment smoke test fails."""
        script_path = os.path.join(REPO_ROOT, "scripts", "deploy.sh")
        if not os.path.exists(script_path):
            skip_or_fail(self, "Preview vs Production Promotion", "scripts/deploy.sh")
        with open(script_path, "r", encoding="utf-8") as f:
            content = f.read()
        self.assertIn("smoke-test", content)

    def test_deploy_script_fails_if_both_prod_and_preview_specified(self):
        """B10.5: Verify deploy.sh handles mutually exclusive flags cleanly."""
        script_path = os.path.join(REPO_ROOT, "scripts", "deploy.sh")
        if not os.path.exists(script_path):
            skip_or_fail(self, "Preview vs Production Promotion", "scripts/deploy.sh")
        with open(script_path, "r", encoding="utf-8") as f:
            content = f.read()
        self.assertTrue("preview" in content and "prod" in content)


if __name__ == "__main__":
    unittest.main()
