"""
test_tier3_pairwise.py
Tier 3: Cross-Feature Combinations (Pairwise Coverage)
Total: 10 tests covering interactions across preflight, deployment, CI, smoke tests, and serverless routing.
"""

import json
import os
import sys
import unittest

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from test_helpers import (
    REPO_ROOT,
    run_cmd,
    invoke_node_serverless,
    run_mock_http_server,
    skip_or_fail,
    MockServerlessApiHandler,
    MockStaleProductionHandler
)

class TestTier3PairwiseCombinations(unittest.TestCase):

    def test_pairwise_preflight_blocks_deployment_on_secret_failure(self):
        """P1: Interaction between Preflight Guardrails and Deployment Script."""
        deploy_script = os.path.join(REPO_ROOT, "scripts", "deploy.sh")
        verify_env_script = os.path.join(REPO_ROOT, "scripts", "verify-env.js")
        if not os.path.exists(deploy_script) or not os.path.exists(verify_env_script):
            skip_or_fail(self, "Preflight & Deployment Interaction", "scripts/deploy.sh")

        # In production mode without OPENAI_API_KEY, deploy.sh must fail without deploying
        env_no_key = {k: v for k, v in os.environ.items() if k not in ("OPENAI_API_KEY", "chefsspecials")}
        rc, stdout, stderr = run_cmd(["bash", "scripts/deploy.sh", "--prod"], env=env_no_key)
        self.assertNotEqual(rc, 0, "deploy.sh must abort when preflight check fails")

    def test_pairwise_deployment_output_url_feeds_into_smoke_test(self):
        """P2: Interaction between Deployment and Smoke Test."""
        smoke_script = os.path.join(REPO_ROOT, "scripts", "smoke-test.js")
        if not os.path.exists(smoke_script):
            skip_or_fail(self, "Deployment & Smoke Test Interaction", "scripts/smoke-test.js")

        with run_mock_http_server(MockServerlessApiHandler) as deployed_url:
            rc, stdout, stderr = run_cmd(["node", "scripts/smoke-test.js", deployed_url, "--timeout", "5000"])
            self.assertEqual(rc, 0, f"Smoke test failed against deployed URL {deployed_url}: {stdout} {stderr}")

    def test_pairwise_ci_executes_bootstrap_before_npm_test(self):
        """P3: Interaction between CI Workflow, Bootstrap Check, and npm test."""
        ci_path = os.path.join(REPO_ROOT, ".github", "workflows", "ci.yml")
        if not os.path.exists(ci_path):
            skip_or_fail(self, "CI & Test Suite Interaction", ".github/workflows/ci.yml")

        with open(ci_path, "r", encoding="utf-8") as f:
            ci_content = f.read()

        # Both must be present
        self.assertIn("verify-bootstrap.sh", ci_content)
        self.assertTrue("npm test" in ci_content or "tests_api.js" in ci_content)

    def test_pairwise_secret_masking_in_ci_github_actions_environment(self):
        """P4: Interaction between Secret Preflight, Masking, and CI Environment."""
        verify_env_script = os.path.join(REPO_ROOT, "scripts", "verify-env.js")
        if not os.path.exists(verify_env_script):
            skip_or_fail(self, "Secret Masking in CI", "scripts/verify-env.js")

        test_secret = "sk-pairwise-secret-val-123456789012345"
        env = {
            "OPENAI_API_KEY": test_secret,
            "GITHUB_ACTIONS": "true"
        }
        rc, stdout, stderr = run_cmd(["node", "scripts/verify-env.js", "--mode=production"], env=env)
        combined = stdout + stderr

        # Must emit ::add-mask:: and must never leak secret in normal output lines
        self.assertIn(f"::add-mask::{test_secret}", combined)
        lines_without_mask = [line for line in combined.splitlines() if not line.startswith("::add-mask::")]
        self.assertNotIn(test_secret, "\n".join(lines_without_mask))

    def test_pairwise_smoke_test_detects_serverless_handler_contract(self):
        """P5: Interaction between Smoke Test Probes and Serverless Handler Response Contract."""
        # Directly test the serverless handler responses against the 4 contract points expected by smoke-test
        # 1. OPTIONS CORS
        opt_res = invoke_node_serverless(method="OPTIONS")
        self.assertEqual(opt_res.get("status"), 200)
        self.assertEqual(opt_res.get("headers", {}).get("Access-Control-Allow-Origin"), "*")

        # 2. GET 405
        get_res = invoke_node_serverless(method="GET")
        self.assertEqual(get_res.get("status"), 405)

        # 3. Empty POST 400
        post_empty_res = invoke_node_serverless(method="POST", body={})
        self.assertEqual(post_empty_res.get("status"), 400)

        # 4. Valid POST 200
        env_clean = {k: v for k, v in os.environ.items() if k not in ("OPENAI_API_KEY", "chefsspecials")}
        post_valid_res = invoke_node_serverless(method="POST", body={"prompt": "smoke test probe"}, env_vars=env_clean)
        self.assertEqual(post_valid_res.get("status"), 200)
        self.assertNotEqual(post_valid_res.get("status"), 404, "Serverless handler must never return 404")

    def test_pairwise_vercel_json_rewrites_directs_to_serverless_api(self):
        """P6: Interaction between vercel.json rewrites and api/ directory layout."""
        vercel_json_path = os.path.join(REPO_ROOT, "vercel.json")
        with open(vercel_json_path, "r", encoding="utf-8") as f:
            vercel_config = json.load(f)

        rewrites = vercel_config.get("rewrites", [])
        api_rewrite = next((r for r in rewrites if r.get("source") == "/api/(.*)"), None)
        self.assertIsNotNone(api_rewrite)
        self.assertEqual(api_rewrite.get("destination"), "/api/$1")

        # Confirm api/generate-image.js exists to handle /api/generate-image
        api_handler_path = os.path.join(REPO_ROOT, "api", "generate-image.js")
        self.assertTrue(os.path.isfile(api_handler_path))

    def test_pairwise_package_json_test_runs_both_unit_and_bootstrap(self):
        """P7: Interaction between package.json scripts and underlying test files."""
        package_json_path = os.path.join(REPO_ROOT, "package.json")
        with open(package_json_path, "r", encoding="utf-8") as f:
            pkg = json.load(f)

        test_cmd = pkg.get("scripts", {}).get("test", "")
        self.assertIn("tests_api.js", test_cmd)
        self.assertIn("verify-bootstrap.sh", test_cmd)

        # Running npm test executes both cleanly
        rc, stdout, stderr = run_cmd(["npm", "test"])
        self.assertEqual(rc, 0)
        self.assertIn("ALL API UNIT TESTS PASSED", stdout)
        self.assertIn("universal bootstrap verified", stdout)

    def test_pairwise_legacy_key_supported_across_preflight_and_api(self):
        """P8: Interaction between Preflight and Serverless API on legacy key 'chefsspecials'."""
        verify_env_script = os.path.join(REPO_ROOT, "scripts", "verify-env.js")
        env_legacy = {k: v for k, v in os.environ.items() if k != "OPENAI_API_KEY"}
        env_legacy["chefsspecials"] = "sk-legacy-test-key-123456789012345"

        if os.path.exists(verify_env_script):
            rc, stdout, stderr = run_cmd(["node", "scripts/verify-env.js", "--mode=production"], env=env_legacy)
            self.assertEqual(rc, 0, "Preflight must accept legacy key chefsspecials")

        # And serverless handler accepts chefsspecials
        api_handler_path = os.path.join(REPO_ROOT, "api", "generate-image.js")
        with open(api_handler_path, "r", encoding="utf-8") as f:
            api_code = f.read()
        self.assertIn("process.env.chefsspecials", api_code)

    def test_pairwise_smoke_test_catches_stale_production_404_routing(self):
        """P9: Interaction between Smoke Test and Stale Production 404 Failure."""
        smoke_script = os.path.join(REPO_ROOT, "scripts", "smoke-test.js")
        if not os.path.exists(smoke_script):
            skip_or_fail(self, "Smoke Test & Routing Bug Detection", "scripts/smoke-test.js")

        with run_mock_http_server(MockStaleProductionHandler) as stale_url:
            rc, stdout, stderr = run_cmd(["node", "scripts/smoke-test.js", stale_url, "--timeout", "2000", "--retries", "1"])
            self.assertEqual(rc, 1, "Smoke test must detect 404 serverless routing failure")

    def test_pairwise_deploy_preflight_passes_then_preview_runs(self):
        """P10: Interaction between Preflight verification and Preview deploy flag."""
        deploy_script = os.path.join(REPO_ROOT, "scripts", "deploy.sh")
        if not os.path.exists(deploy_script):
            skip_or_fail(self, "Preview Deployment Flow", "scripts/deploy.sh")

        with open(deploy_script, "r", encoding="utf-8") as f:
            content = f.read()

        # deploy.sh must inspect arguments for preview vs prod and run verify-env
        self.assertTrue("verify-env" in content and "preview" in content)


if __name__ == "__main__":
    unittest.main()
