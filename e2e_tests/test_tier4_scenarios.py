"""
test_tier4_scenarios.py
Tier 4: Real-World Application Scenarios (>=5 realistic application scenarios)
Total: 6 comprehensive end-to-end workflow scenarios.
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

class TestTier4RealWorldScenarios(unittest.TestCase):

    def test_scenario_full_ci_pipeline_simulation(self):
        """
        Scenario 1: Full simulated CI pipeline execution.
        Sequentially executes:
        1. Universal bootstrap check (scripts/verify-bootstrap.sh)
        2. Node API unit tests (tests_api.js via npm test)
        Verifying end-to-end zero-defect exit code 0.
        """
        # Step 1: Bootstrap check
        rc_boot, out_boot, err_boot = run_cmd(["bash", "scripts/verify-bootstrap.sh"])
        self.assertEqual(rc_boot, 0, f"CI Pipeline Step 1 (Bootstrap) failed: {err_boot}")
        self.assertIn("PASS: universal bootstrap verified", out_boot)

        # Step 2: npm test (runs tests_api.js + verify-bootstrap.sh)
        rc_test, out_test, err_test = run_cmd(["npm", "test"])
        self.assertEqual(rc_test, 0, f"CI Pipeline Step 2 (npm test) failed: {err_test}")
        self.assertIn("ALL API UNIT TESTS PASSED", out_test)

    def test_scenario_automated_preflight_failure_aborts_deployment(self):
        """
        Scenario 2: Automated pre-flight failure aborting production deployment.
        When OPENAI_API_KEY is missing, deploy.sh / verify-env.js halts release,
        exits with non-zero code, and discloses zero secrets.
        """
        verify_env_path = os.path.join(REPO_ROOT, "scripts", "verify-env.js")
        if not os.path.exists(verify_env_path):
            skip_or_fail(self, "Preflight Abort Scenario", "scripts/verify-env.js")

        env_clean = {k: v for k, v in os.environ.items() if k not in ("OPENAI_API_KEY", "chefsspecials")}
        rc, stdout, stderr = run_cmd(
            ["node", "scripts/verify-env.js", "--mode=production", "--strict"],
            env=env_clean
        )
        self.assertEqual(rc, 1, "Pre-flight must fail with code 1 when production secrets are missing")
        self.assertNotIn("sk-", stdout + stderr)

    def test_scenario_successful_deployment_and_smoke_pipeline(self):
        """
        Scenario 3: Simulated deployment followed by comprehensive smoke test.
        Launches mock Vercel production server, runs smoke-test.js against it,
        verifying all 6 probes pass within timeout.
        """
        smoke_script = os.path.join(REPO_ROOT, "scripts", "smoke-test.js")
        if not os.path.exists(smoke_script):
            skip_or_fail(self, "Deployment & Smoke Pipeline", "scripts/smoke-test.js")

        with run_mock_http_server(MockServerlessApiHandler) as target_url:
            rc, stdout, stderr = run_cmd(
                ["node", "scripts/smoke-test.js", target_url, "--timeout", "5000", "--retries", "2"]
            )
            self.assertEqual(rc, 0, f"Smoke test failed against mock deployment: {stdout} {stderr}")

    def test_scenario_stale_deployment_bug_detection_and_escalation(self):
        """
        Scenario 4: Stale production routing bug detection.
        Simulates the live production discrepancy where static files return 200
        but /api/generate-image returns 404 (due to undeployed vercel.json).
        Smoke test must catch this and exit with code 1.
        """
        smoke_script = os.path.join(REPO_ROOT, "scripts", "smoke-test.js")
        if not os.path.exists(smoke_script):
            skip_or_fail(self, "Stale Deployment Detection", "scripts/smoke-test.js")

        with run_mock_http_server(MockStaleProductionHandler) as stale_url:
            rc, stdout, stderr = run_cmd(
                ["node", "scripts/smoke-test.js", stale_url, "--timeout", "2000", "--retries", "1"]
            )
            self.assertEqual(rc, 1, "Smoke test must detect and reject stale 404 API routing")

    def test_scenario_serverless_mock_invocation_lifecycle(self):
        """
        Scenario 5: Complete serverless API request/response lifecycle.
        Validates OPTIONS CORS preflight, rejection of non-POST methods,
        rejection of empty payloads, and successful execution with fallback.
        """
        # 1. Preflight
        preflight = invoke_node_serverless(method="OPTIONS")
        self.assertEqual(preflight.get("status"), 200)
        self.assertEqual(preflight.get("headers", {}).get("Access-Control-Allow-Origin"), "*")

        # 2. Method guard
        get_res = invoke_node_serverless(method="GET")
        self.assertEqual(get_res.get("status"), 405)

        # 3. Payload validation
        empty_res = invoke_node_serverless(method="POST", body={})
        self.assertEqual(empty_res.get("status"), 400)

        # 4. Valid request
        env_no_key = {k: v for k, v in os.environ.items() if k not in ("OPENAI_API_KEY", "chefsspecials")}
        valid_res = invoke_node_serverless(
            method="POST",
            body={
                "prompt": "Charred Spanish octopus with romesco sauce",
                "dishName": "Pulpo a la Gallega"
            },
            env_vars=env_no_key
        )
        self.assertEqual(valid_res.get("status"), 200)
        self.assertTrue(valid_res.get("body", {}).get("setupNeeded"))

    def test_scenario_pr_preview_vs_prod_promotion_flow(self):
        """
        Scenario 6: PR Preview vs Production promotion workflow rules.
        Verifies that deployment workflows or scripts clearly isolate
        preview deployments from production deployments.
        """
        deploy_script = os.path.join(REPO_ROOT, "scripts", "deploy.sh")
        deploy_workflow = os.path.join(REPO_ROOT, ".github", "workflows", "deploy.yml")

        # At least one must be defined or in progress
        if not os.path.exists(deploy_script) and not os.path.exists(deploy_workflow):
            skip_or_fail(self, "PR Preview vs Production Promotion Flow", "scripts/deploy.sh")

        if os.path.exists(deploy_script):
            with open(deploy_script, "r", encoding="utf-8") as f:
                content = f.read()
            self.assertIn("preview", content)
            self.assertIn("prod", content)

        if os.path.exists(deploy_workflow):
            with open(deploy_workflow, "r", encoding="utf-8") as f:
                content = f.read()
            self.assertIn("pull_request", content)
            self.assertIn("main", content)


if __name__ == "__main__":
    unittest.main()
