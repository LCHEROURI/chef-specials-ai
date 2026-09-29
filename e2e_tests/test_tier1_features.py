"""
test_tier1_features.py
Tier 1: Feature Coverage (>=5 tests per feature for all 10 core features)
Total: 50 tests.
"""

import json
import os
import re
import sys
import unittest

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from test_helpers import (
    REPO_ROOT,
    run_cmd,
    invoke_node_serverless,
    run_mock_http_server,
    skip_or_fail,
    MockServerlessApiHandler
)

class TestTier1FeatureCoverage(unittest.TestCase):

    # =========================================================================
    # Feature 1: CI Workflow Schema & Steps (.github/workflows/ci.yml) (5 tests)
    # =========================================================================

    def test_ci_workflow_file_exists(self):
        """F1.1: Verify .github/workflows/ci.yml exists."""
        ci_path = os.path.join(REPO_ROOT, ".github", "workflows", "ci.yml")
        if not os.path.exists(ci_path):
            skip_or_fail(self, "CI Workflow Schema & Steps", ".github/workflows/ci.yml")
        self.assertTrue(os.path.isfile(ci_path))

    def test_ci_workflow_structure_and_name(self):
        """F1.2: Verify CI workflow defines valid structure with name and jobs."""
        ci_path = os.path.join(REPO_ROOT, ".github", "workflows", "ci.yml")
        if not os.path.exists(ci_path):
            skip_or_fail(self, "CI Workflow Schema & Steps", ".github/workflows/ci.yml")
        with open(ci_path, "r", encoding="utf-8") as f:
            content = f.read()
        self.assertRegex(content, r"^name:\s*.+", "CI workflow missing name")
        self.assertIn("jobs:", content, "CI workflow missing jobs section")

    def test_ci_workflow_triggers(self):
        """F1.3: Verify CI workflow triggers on push, pull_request, and workflow_dispatch."""
        ci_path = os.path.join(REPO_ROOT, ".github", "workflows", "ci.yml")
        if not os.path.exists(ci_path):
            skip_or_fail(self, "CI Workflow Schema & Steps", ".github/workflows/ci.yml")
        with open(ci_path, "r", encoding="utf-8") as f:
            content = f.read()
        self.assertIn("pull_request:", content, "CI workflow must trigger on pull_request")
        self.assertIn("push:", content, "CI workflow must trigger on push")
        self.assertIn("workflow_dispatch:", content, "CI workflow must trigger on workflow_dispatch")

    def test_ci_workflow_steps_presence(self):
        """F1.4: Verify CI workflow includes required steps for setup and test execution."""
        ci_path = os.path.join(REPO_ROOT, ".github", "workflows", "ci.yml")
        if not os.path.exists(ci_path):
            skip_or_fail(self, "CI Workflow Schema & Steps", ".github/workflows/ci.yml")
        with open(ci_path, "r", encoding="utf-8") as f:
            content = f.read()
        self.assertTrue(
            "setup-node" in content or "actions/setup-node" in content,
            "Workflow must set up Node.js"
        )
        self.assertTrue(
            "setup-python" in content or "actions/setup-python" in content,
            "Workflow must set up Python"
        )
        self.assertIn("verify-bootstrap.sh", content, "Workflow must execute verify-bootstrap.sh")
        self.assertTrue("npm test" in content or "tests_api.js" in content, "Workflow must run API unit tests")
        self.assertIn("tests_e2e.py", content, "Workflow must run Playwright e2e tests")

    def test_ci_workflow_permissions_least_privilege(self):
        """F1.5: Verify CI workflow scopes permissions to contents: read."""
        ci_path = os.path.join(REPO_ROOT, ".github", "workflows", "ci.yml")
        if not os.path.exists(ci_path):
            skip_or_fail(self, "CI Workflow Schema & Steps", ".github/workflows/ci.yml")
        with open(ci_path, "r", encoding="utf-8") as f:
            content = f.read()
        self.assertIn("permissions:", content)
        self.assertIn("contents: read", content)

    # =========================================================================
    # Feature 2: Universal Bootstrap Verification (scripts/verify-bootstrap.sh) (5 tests)
    # =========================================================================

    def test_bootstrap_script_exists_and_executable(self):
        """F2.1: Verify scripts/verify-bootstrap.sh exists and is executable."""
        script_path = os.path.join(REPO_ROOT, "scripts", "verify-bootstrap.sh")
        self.assertTrue(os.path.isfile(script_path), "scripts/verify-bootstrap.sh does not exist")
        self.assertTrue(os.access(script_path, os.X_OK), "scripts/verify-bootstrap.sh must be executable")

    def test_bootstrap_script_executes_pass_in_repo(self):
        """F2.2: Verify running scripts/verify-bootstrap.sh passes with exit 0."""
        rc, stdout, stderr = run_cmd(["bash", "scripts/verify-bootstrap.sh"])
        self.assertEqual(rc, 0, f"Bootstrap verification failed: {stderr}")
        self.assertIn("PASS: universal bootstrap verified", stdout)

    def test_bootstrap_validates_agents_file(self):
        """F2.3: Verify verify-bootstrap.sh checks AGENTS.md and safety markers."""
        script_path = os.path.join(REPO_ROOT, "scripts", "verify-bootstrap.sh")
        with open(script_path, "r", encoding="utf-8") as f:
            content = f.read()
        self.assertIn("AGENTS.md", content)
        self.assertIn("Repository lock", content)

    def test_bootstrap_validates_workflow_file(self):
        """F2.4: Verify verify-bootstrap.sh checks WORKFLOW.md and authorization markers."""
        script_path = os.path.join(REPO_ROOT, "scripts", "verify-bootstrap.sh")
        with open(script_path, "r", encoding="utf-8") as f:
            content = f.read()
        self.assertIn("WORKFLOW.md", content)
        self.assertTrue(any(m in content for m in ["commit", "push", "merge"]))

    def test_bootstrap_validates_skill_file(self):
        """F2.5: Verify verify-bootstrap.sh checks progressive-distillation skill."""
        script_path = os.path.join(REPO_ROOT, "scripts", "verify-bootstrap.sh")
        with open(script_path, "r", encoding="utf-8") as f:
            content = f.read()
        self.assertIn("skills/progressive-distillation/SKILL.md", content)
        self.assertIn("Progressive Distillation", content)

    # =========================================================================
    # Feature 3: Node API Unit Tests (tests_api.js) (5 tests)
    # =========================================================================

    def test_api_unit_tests_file_exists(self):
        """F3.1: Verify tests_api.js exists and is non-empty."""
        path = os.path.join(REPO_ROOT, "tests_api.js")
        self.assertTrue(os.path.isfile(path))
        self.assertGreater(os.path.getsize(path), 100)

    def test_api_unit_tests_run_successfully(self):
        """F3.2: Verify node tests_api.js runs cleanly and exits with code 0."""
        rc, stdout, stderr = run_cmd(["node", "tests_api.js"])
        self.assertEqual(rc, 0, f"tests_api.js failed: {stderr}")
        self.assertIn("=== ALL API UNIT TESTS PASSED (100%) ===", stdout)

    def test_api_unit_tests_assert_options_cors(self):
        """F3.3: Verify tests_api.js verifies OPTIONS preflight CORS headers."""
        rc, stdout, stderr = run_cmd(["node", "tests_api.js"])
        self.assertEqual(rc, 0)
        self.assertIn("OPTIONS preflight handled with correct CORS headers", stdout)

    def test_api_unit_tests_assert_method_rejection(self):
        """F3.4: Verify tests_api.js asserts rejection of non-POST methods with 405."""
        rc, stdout, stderr = run_cmd(["node", "tests_api.js"])
        self.assertEqual(rc, 0)
        self.assertIn("Non-POST rejected with 405 Method Not Allowed", stdout)

    def test_api_unit_tests_assert_parameter_sanitization(self):
        """F3.5: Verify tests_api.js tests DALL-E-3 and GPT-Image parameter sanitization."""
        rc, stdout, stderr = run_cmd(["node", "tests_api.js"])
        self.assertEqual(rc, 0)
        self.assertIn("DALL-E 3 size and quality properly sanitized", stdout)
        self.assertIn("GPT-Image-2 preserves next-gen image parameters", stdout)

    # =========================================================================
    # Feature 4: Playwright E2E Integration (tests_e2e.py) (5 tests)
    # =========================================================================

    def test_playwright_test_file_exists(self):
        """F4.1: Verify tests_e2e.py exists and contains async test definition."""
        path = os.path.join(REPO_ROOT, "tests_e2e.py")
        self.assertTrue(os.path.isfile(path))
        with open(path, "r", encoding="utf-8") as f:
            content = f.read()
        self.assertIn("async def run_tests", content)

    def test_playwright_contains_browser_launch(self):
        """F4.2: Verify tests_e2e.py launches Chromium with permissions."""
        path = os.path.join(REPO_ROOT, "tests_e2e.py")
        with open(path, "r", encoding="utf-8") as f:
            content = f.read()
        self.assertIn("chromium.launch", content)
        self.assertIn("permissions=", content)

    def test_playwright_verifies_app_title_and_specials(self):
        """F4.3: Verify tests_e2e.py verifies title 'Chef Specials AI' and 3 initial cards."""
        path = os.path.join(REPO_ROOT, "tests_e2e.py")
        with open(path, "r", encoding="utf-8") as f:
            content = f.read()
        self.assertIn("Chef Specials AI", content)
        self.assertIn("len(initial_cards) == 3", content)

    def test_playwright_verifies_category_filters(self):
        """F4.4: Verify tests_e2e.py tests Pasta and Seasonal filters."""
        path = os.path.join(REPO_ROOT, "tests_e2e.py")
        with open(path, "r", encoding="utf-8") as f:
            content = f.read()
        self.assertIn("Pasta", content)
        self.assertIn("Seasonal", content)

    def test_playwright_verifies_recipe_and_localstorage(self):
        """F4.5: Verify tests_e2e.py tests recipe panel, save toggle, and base64 hygiene."""
        path = os.path.join(REPO_ROOT, "tests_e2e.py")
        with open(path, "r", encoding="utf-8") as f:
            content = f.read()
        self.assertIn("Saved ✓", content)
        self.assertIn("data:image", content)

    # =========================================================================
    # Feature 5: Secret Validation Preflight (scripts/verify-env.js) (5 tests)
    # =========================================================================

    def test_verify_env_file_exists(self):
        """F5.1: Verify scripts/verify-env.js exists."""
        script_path = os.path.join(REPO_ROOT, "scripts", "verify-env.js")
        if not os.path.exists(script_path):
            skip_or_fail(self, "Secret Validation Preflight", "scripts/verify-env.js")
        self.assertTrue(os.path.isfile(script_path))

    def test_verify_env_ci_mode_exits_zero(self):
        """F5.2: Verify node scripts/verify-env.js --mode=ci exits with code 0."""
        script_path = os.path.join(REPO_ROOT, "scripts", "verify-env.js")
        if not os.path.exists(script_path):
            skip_or_fail(self, "Secret Validation Preflight", "scripts/verify-env.js")
        rc, stdout, stderr = run_cmd(["node", "scripts/verify-env.js", "--mode=ci"])
        self.assertEqual(rc, 0, f"Expected verify-env.js in CI mode to exit 0: {stdout} {stderr}")

    def test_verify_env_production_mode_with_valid_key(self):
        """F5.3: Verify verify-env.js exits 0 in production mode when OPENAI_API_KEY is valid."""
        script_path = os.path.join(REPO_ROOT, "scripts", "verify-env.js")
        if not os.path.exists(script_path):
            skip_or_fail(self, "Secret Validation Preflight", "scripts/verify-env.js")
        env = {"OPENAI_API_KEY": "sk-proj-validproductiontestkey1234567890"}
        rc, stdout, stderr = run_cmd(["node", "scripts/verify-env.js", "--mode=production"], env=env)
        self.assertEqual(rc, 0, f"Expected verify-env.js to exit 0 with valid key: {stdout} {stderr}")

    def test_verify_env_production_mode_fails_when_missing_key(self):
        """F5.4: Verify verify-env.js exits 1 in strict production mode when OPENAI_API_KEY is missing."""
        script_path = os.path.join(REPO_ROOT, "scripts", "verify-env.js")
        if not os.path.exists(script_path):
            skip_or_fail(self, "Secret Validation Preflight", "scripts/verify-env.js")
        env = {k: v for k, v in os.environ.items() if k not in ("OPENAI_API_KEY", "chefsspecials")}
        rc, stdout, stderr = run_cmd(["node", "scripts/verify-env.js", "--mode=production", "--strict"], env=env)
        self.assertEqual(rc, 1, f"Expected verify-env.js to exit 1 when key is missing: {stdout} {stderr}")

    def test_verify_env_accepts_legacy_chefsspecials_key(self):
        """F5.5: Verify verify-env.js accepts legacy chefsspecials env var as valid fallback."""
        script_path = os.path.join(REPO_ROOT, "scripts", "verify-env.js")
        if not os.path.exists(script_path):
            skip_or_fail(self, "Secret Validation Preflight", "scripts/verify-env.js")
        env = {k: v for k, v in os.environ.items() if k != "OPENAI_API_KEY"}
        env["chefsspecials"] = "sk-legacy-validproductiontestkey1234567890"
        rc, stdout, stderr = run_cmd(["node", "scripts/verify-env.js", "--mode=production"], env=env)
        self.assertEqual(rc, 0, f"Expected verify-env.js to accept legacy key: {stdout} {stderr}")

    # =========================================================================
    # Feature 6: Secret Masking & Non-Disclosure (5 tests)
    # =========================================================================

    def test_masking_never_outputs_plaintext_key(self):
        """F6.1: Verify verification script NEVER prints raw secret values to stdout/stderr."""
        script_path = os.path.join(REPO_ROOT, "scripts", "verify-env.js")
        if not os.path.exists(script_path):
            skip_or_fail(self, "Secret Masking & Non-Disclosure", "scripts/verify-env.js")
        secret_value = "sk-live-supersecretvaluenottobeleaked9876543210"
        env = {"OPENAI_API_KEY": secret_value, "GITHUB_ACTIONS": ""}
        rc, stdout, stderr = run_cmd(["node", "scripts/verify-env.js", "--mode=production"], env=env)
        self.assertNotIn(secret_value, stdout, "Plaintext secret leaked to stdout!")
        self.assertNotIn(secret_value, stderr, "Plaintext secret leaked to stderr!")

    def test_masking_github_actions_add_mask_annotation(self):
        """F6.2: Verify ::add-mask:: annotation emitted when running under GITHUB_ACTIONS=true."""
        script_path = os.path.join(REPO_ROOT, "scripts", "verify-env.js")
        if not os.path.exists(script_path):
            skip_or_fail(self, "Secret Masking & Non-Disclosure", "scripts/verify-env.js")
        secret_value = "sk-live-maskcheckkey12345678901234567890"
        env = {"OPENAI_API_KEY": secret_value, "GITHUB_ACTIONS": "true"}
        rc, stdout, stderr = run_cmd(["node", "scripts/verify-env.js", "--mode=production"], env=env)
        combined = stdout + stderr
        self.assertIn(f"::add-mask::{secret_value}", combined, "Missing ::add-mask:: annotation in GitHub Actions")

    def test_masking_masked_representation_format(self):
        """F6.3: Verify status report displays masked representation (e.g. sk-*** or [PRESENT])."""
        script_path = os.path.join(REPO_ROOT, "scripts", "verify-env.js")
        if not os.path.exists(script_path):
            skip_or_fail(self, "Secret Masking & Non-Disclosure", "scripts/verify-env.js")
        secret_value = "sk-live-formatcheckkey12345678901234567890"
        env = {"OPENAI_API_KEY": secret_value}
        rc, stdout, stderr = run_cmd(["node", "scripts/verify-env.js", "--mode=production"], env=env)
        self.assertTrue(
            "sk-***" in stdout or "PRESENT" in stdout or "[CONFIGURED]" in stdout or "OK" in stdout,
            f"Expected masked indication in output: {stdout}"
        )

    def test_masking_no_plaintext_in_error_logs(self):
        """F6.4: Verify malformed secret does NOT leak raw secret string in error message."""
        script_path = os.path.join(REPO_ROOT, "scripts", "verify-env.js")
        if not os.path.exists(script_path):
            skip_or_fail(self, "Secret Masking & Non-Disclosure", "scripts/verify-env.js")
        malformed_secret = "invalid_prefix_raw_secret_value_12345"
        env = {"OPENAI_API_KEY": malformed_secret}
        rc, stdout, stderr = run_cmd(["node", "scripts/verify-env.js", "--mode=production", "--strict"], env=env)
        self.assertEqual(rc, 1)
        self.assertNotIn(malformed_secret, stdout, "Malformed secret leaked to stdout!")
        self.assertNotIn(malformed_secret, stderr, "Malformed secret leaked to stderr!")

    def test_masking_environment_not_dumped_on_error(self):
        """F6.5: Verify process.env is never serialized to output on unhandled errors."""
        script_path = os.path.join(REPO_ROOT, "scripts", "verify-env.js")
        if not os.path.exists(script_path):
            skip_or_fail(self, "Secret Masking & Non-Disclosure", "scripts/verify-env.js")
        canary = "SUPER_SECRET_CANARY_VALUE_XYZ"
        env = {"CANARY_ENV": canary}
        rc, stdout, stderr = run_cmd(["node", "scripts/verify-env.js", "--invalid-flag"], env=env)
        self.assertNotIn(canary, stdout)
        self.assertNotIn(canary, stderr)

    # =========================================================================
    # Feature 7: Smoke Test Execution (scripts/smoke-test.js) (5 tests)
    # =========================================================================

    def test_smoke_test_file_exists(self):
        """F7.1: Verify scripts/smoke-test.js exists."""
        script_path = os.path.join(REPO_ROOT, "scripts", "smoke-test.js")
        if not os.path.exists(script_path):
            skip_or_fail(self, "Smoke Test Execution", "scripts/smoke-test.js")
        self.assertTrue(os.path.isfile(script_path))

    def test_smoke_test_cli_help_or_missing_url(self):
        """F7.2: Verify invoking smoke-test.js without URL displays usage/help or error."""
        script_path = os.path.join(REPO_ROOT, "scripts", "smoke-test.js")
        if not os.path.exists(script_path):
            skip_or_fail(self, "Smoke Test Execution", "scripts/smoke-test.js")
        env = {k: v for k, v in os.environ.items() if k != "DEPLOYMENT_URL"}
        rc, stdout, stderr = run_cmd(["node", "scripts/smoke-test.js", "--help"], env=env)
        self.assertTrue(
            rc == 0 or "Usage" in stdout or "TARGET_URL" in stdout or "TARGET_URL" in stderr,
            f"Expected usage info on --help: {stdout} {stderr}"
        )

    def test_smoke_test_passes_against_mock_production(self):
        """F7.3: Verify smoke-test.js passes against a live mock production server."""
        script_path = os.path.join(REPO_ROOT, "scripts", "smoke-test.js")
        if not os.path.exists(script_path):
            skip_or_fail(self, "Smoke Test Execution", "scripts/smoke-test.js")
        with run_mock_http_server(MockServerlessApiHandler) as base_url:
            rc, stdout, stderr = run_cmd(["node", "scripts/smoke-test.js", base_url, "--timeout", "5000"])
            self.assertEqual(rc, 0, f"Expected smoke test to pass against valid mock: {stdout} {stderr}")

    def test_smoke_test_verifies_static_probes(self):
        """F7.4: Verify smoke-test.js logs verification of static root and assets."""
        script_path = os.path.join(REPO_ROOT, "scripts", "smoke-test.js")
        if not os.path.exists(script_path):
            skip_or_fail(self, "Smoke Test Execution", "scripts/smoke-test.js")
        with run_mock_http_server(MockServerlessApiHandler) as base_url:
            rc, stdout, stderr = run_cmd(["node", "scripts/smoke-test.js", base_url, "--timeout", "5000"])
            combined = stdout + stderr
            self.assertTrue(
                "/" in combined or "static" in combined.lower() or "root" in combined.lower(),
                f"Expected static root probe mention: {combined}"
            )

    def test_smoke_test_verifies_api_probes(self):
        """F7.5: Verify smoke-test.js verifies OPTIONS and POST API responses."""
        script_path = os.path.join(REPO_ROOT, "scripts", "smoke-test.js")
        if not os.path.exists(script_path):
            skip_or_fail(self, "Smoke Test Execution", "scripts/smoke-test.js")
        with run_mock_http_server(MockServerlessApiHandler) as base_url:
            rc, stdout, stderr = run_cmd(["node", "scripts/smoke-test.js", base_url, "--timeout", "5000"])
            combined = stdout + stderr
            self.assertTrue(
                "generate-image" in combined or "api" in combined.lower(),
                f"Expected API probe mention: {combined}"
            )

    # =========================================================================
    # Feature 8: Serverless Route Handling (api/generate-image.js) (5 tests)
    # =========================================================================

    def test_serverless_handler_file_exists(self):
        """F8.1: Verify api/generate-image.js exists in repository."""
        path = os.path.join(REPO_ROOT, "api", "generate-image.js")
        self.assertTrue(os.path.isfile(path))

    def test_serverless_handler_options_cors(self):
        """F8.2: Verify OPTIONS returns 200 with Access-Control-Allow-Origin: *."""
        result = invoke_node_serverless(method="OPTIONS")
        self.assertEqual(result.get("status"), 200)
        headers = result.get("headers", {})
        self.assertEqual(headers.get("Access-Control-Allow-Origin"), "*")
        self.assertIn("POST", headers.get("Access-Control-Allow-Methods", ""))

    def test_serverless_handler_get_returns_405(self):
        """F8.3: Verify GET method returns HTTP 405 Method Not Allowed."""
        result = invoke_node_serverless(method="GET")
        self.assertEqual(result.get("status"), 405)
        headers = result.get("headers", {})
        self.assertIn("POST", headers.get("Allow", ""))

    def test_serverless_handler_missing_prompt_returns_400(self):
        """F8.4: Verify POST with empty body returns 400 with descriptive error."""
        result = invoke_node_serverless(method="POST", body={})
        self.assertEqual(result.get("status"), 400)
        body = result.get("body", {})
        self.assertIn("required", body.get("error", "").lower())

    def test_serverless_handler_unconfigured_key_returns_200_setup_needed(self):
        """F8.5: Verify POST with prompt returns 200 setupNeeded when key is absent."""
        env_clean = {k: v for k, v in os.environ.items() if k not in ("OPENAI_API_KEY", "chefsspecials")}
        result = invoke_node_serverless(
            method="POST",
            body={"prompt": "Seared wild salmon"},
            env_vars=env_clean
        )
        self.assertEqual(result.get("status"), 200)
        body = result.get("body", {})
        self.assertTrue(body.get("setupNeeded"), f"Expected setupNeeded: true, got {body}")

    # =========================================================================
    # Feature 9: Vercel Deployment Configuration (vercel.json) (5 tests)
    # =========================================================================

    def test_vercel_json_file_exists(self):
        """F9.1: Verify vercel.json exists in repository root."""
        path = os.path.join(REPO_ROOT, "vercel.json")
        self.assertTrue(os.path.isfile(path))

    def test_vercel_json_valid_json_syntax(self):
        """F9.2: Verify vercel.json parses cleanly with strict JSON decoder."""
        path = os.path.join(REPO_ROOT, "vercel.json")
        with open(path, "r", encoding="utf-8") as f:
            data = json.load(f)
        self.assertIsInstance(data, dict)

    def test_vercel_json_version_two(self):
        """F9.3: Verify vercel.json specifies version: 2."""
        path = os.path.join(REPO_ROOT, "vercel.json")
        with open(path, "r", encoding="utf-8") as f:
            data = json.load(f)
        self.assertEqual(data.get("version"), 2)

    def test_vercel_json_clean_urls_enabled(self):
        """F9.4: Verify vercel.json specifies cleanUrls: true."""
        path = os.path.join(REPO_ROOT, "vercel.json")
        with open(path, "r", encoding="utf-8") as f:
            data = json.load(f)
        self.assertTrue(data.get("cleanUrls"))

    def test_vercel_json_rewrites_api_route(self):
        """F9.5: Verify vercel.json contains rewrite rule mapping /api/(.*) to /api/$1."""
        path = os.path.join(REPO_ROOT, "vercel.json")
        with open(path, "r", encoding="utf-8") as f:
            data = json.load(f)
        rewrites = data.get("rewrites", [])
        self.assertTrue(len(rewrites) > 0, "vercel.json missing rewrites")
        matched = any(r.get("source") == "/api/(.*)" and r.get("destination") == "/api/$1" for r in rewrites)
        self.assertTrue(matched, f"Expected rewrite /api/(.*) -> /api/$1, found: {rewrites}")

    # =========================================================================
    # Feature 10: Preview vs Production Promotion (scripts/deploy.sh & workflows) (5 tests)
    # =========================================================================

    def test_deploy_script_file_exists_and_executable(self):
        """F10.1: Verify scripts/deploy.sh exists and is executable."""
        path = os.path.join(REPO_ROOT, "scripts", "deploy.sh")
        if not os.path.exists(path):
            skip_or_fail(self, "Preview vs Production Promotion", "scripts/deploy.sh")
        self.assertTrue(os.path.isfile(path))
        self.assertTrue(os.access(path, os.X_OK))

    def test_deploy_script_supports_preview_flag(self):
        """F10.2: Verify scripts/deploy.sh documents or supports --preview flag."""
        path = os.path.join(REPO_ROOT, "scripts", "deploy.sh")
        if not os.path.exists(path):
            skip_or_fail(self, "Preview vs Production Promotion", "scripts/deploy.sh")
        with open(path, "r", encoding="utf-8") as f:
            content = f.read()
        self.assertIn("--preview", content, "deploy.sh must support --preview")

    def test_deploy_script_supports_prod_flag(self):
        """F10.3: Verify scripts/deploy.sh documents or supports --prod flag."""
        path = os.path.join(REPO_ROOT, "scripts", "deploy.sh")
        if not os.path.exists(path):
            skip_or_fail(self, "Preview vs Production Promotion", "scripts/deploy.sh")
        with open(path, "r", encoding="utf-8") as f:
            content = f.read()
        self.assertIn("--prod", content, "deploy.sh must support --prod")

    def test_deploy_script_integrates_preflight(self):
        """F10.4: Verify scripts/deploy.sh runs environment preflight check."""
        path = os.path.join(REPO_ROOT, "scripts", "deploy.sh")
        if not os.path.exists(path):
            skip_or_fail(self, "Preview vs Production Promotion", "scripts/deploy.sh")
        with open(path, "r", encoding="utf-8") as f:
            content = f.read()
        self.assertIn("verify-env", content, "deploy.sh must invoke verify-env")

    def test_deploy_script_integrates_smoke_test(self):
        """F10.5: Verify scripts/deploy.sh runs post-deployment smoke test."""
        path = os.path.join(REPO_ROOT, "scripts", "deploy.sh")
        if not os.path.exists(path):
            skip_or_fail(self, "Preview vs Production Promotion", "scripts/deploy.sh")
        with open(path, "r", encoding="utf-8") as f:
            content = f.read()
        self.assertIn("smoke-test", content, "deploy.sh must invoke smoke-test")


if __name__ == "__main__":
    unittest.main()
