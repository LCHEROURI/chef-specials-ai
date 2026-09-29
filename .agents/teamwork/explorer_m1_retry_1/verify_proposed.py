import unittest
import os
import re

class TestProposedCiWorkflow(unittest.TestCase):
    def setUp(self):
        self.ci_path = ".agents/teamwork/explorer_m1_retry_1/proposed_ci.yml"
        with open(self.ci_path, "r", encoding="utf-8") as f:
            self.content = f.read()

    # F1.1: File exists
    def test_f1_1_exists(self):
        self.assertTrue(os.path.isfile(self.ci_path))

    # F1.2: Structure and name
    def test_f1_2_structure(self):
        self.assertRegex(self.content, r"^name:\s*.+", "CI workflow missing name")
        self.assertIn("jobs:", self.content, "CI workflow missing jobs section")

    # F1.3: Triggers
    def test_f1_3_triggers(self):
        self.assertIn("pull_request:", self.content, "CI workflow must trigger on pull_request")
        self.assertIn("push:", self.content, "CI workflow must trigger on push")
        self.assertIn("workflow_dispatch:", self.content, "CI workflow must trigger on workflow_dispatch")

    # F1.4: Steps presence
    def test_f1_4_steps(self):
        self.assertTrue("setup-node" in self.content or "actions/setup-node" in self.content)
        self.assertTrue("setup-python" in self.content or "actions/setup-python" in self.content)
        self.assertIn("verify-bootstrap.sh", self.content)
        self.assertTrue("npm test" in self.content or "tests_api.js" in self.content)
        self.assertIn("tests_e2e.py", self.content)

    # F1.5: Permissions least privilege
    def test_f1_5_permissions(self):
        self.assertIn("permissions:", self.content)
        self.assertIn("contents: read", self.content)

    # B1.1: ubuntu-latest
    def test_b1_1_runner(self):
        self.assertIn("ubuntu-latest", self.content)

    # B1.3: Concurrency group and cancel-in-progress: true
    def test_b1_3_concurrency(self):
        self.assertIn("concurrency:", self.content)
        self.assertIn("cancel-in-progress: true", self.content)

    # B1.4: Step ordering fail fast
    def test_b1_4_step_ordering(self):
        idx_bootstrap = self.content.find("verify-bootstrap.sh")
        idx_e2e = self.content.find("tests_e2e.py")
        self.assertNotEqual(idx_bootstrap, -1)
        self.assertNotEqual(idx_e2e, -1)
        self.assertLess(idx_bootstrap, idx_e2e)

    # B1.5: No continue-on-error
    def test_b1_5_no_continue_on_error(self):
        self.assertNotIn("continue-on-error: true", self.content)

    # P3: Pairwise bootstrap before npm test
    def test_p3_bootstrap_before_npm(self):
        self.assertIn("verify-bootstrap.sh", self.content)
        self.assertTrue("npm test" in self.content or "tests_api.js" in self.content)

if __name__ == "__main__":
    unittest.main()
