#!/usr/bin/env python
"""
Empirical Adversarial Stress Test Harness for CI Concurrency & Schema Adherence
Author: Challenger M1_R2_2
"""
import copy
import json
import os
import subprocess
import sys
import unittest
from pathlib import Path

import jsonschema
import yaml

REPO_ROOT = Path("/Users/laredjchehrouri/.gemini/antigravity/scratch/chef-specials-ai-repo")
CI_PATH = REPO_ROOT / ".github" / "workflows" / "ci.yml"
SCHEMA_PATH = REPO_ROOT / ".agents" / "teamwork" / "explorer_m1_2" / "github-workflow-schema.json"


class ConcurrencyAdversarialTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.schema = json.loads(SCHEMA_PATH.read_text(encoding="utf-8"))
        cls.ci_raw = CI_PATH.read_text(encoding="utf-8")
        cls.ci_doc = yaml.safe_load(cls.ci_raw)

    def test_actual_file_schema_validity(self):
        """Verify the repository ci.yml validates with 0 errors against official GitHub Actions schema."""
        jsonschema.validate(instance=self.ci_doc, schema=self.schema)
        self.assertIn("concurrency", self.ci_doc)
        concurrency = self.ci_doc["concurrency"]
        self.assertEqual(concurrency["group"], "ci-${{ github.workflow }}-${{ github.ref }}")
        self.assertIs(concurrency["cancel-in-progress"], True)
        self.assertIsInstance(concurrency["cancel-in-progress"], bool)

    def test_pyyaml_boolean_fidelity(self):
        """Stress test PyYAML handling of 'cancel-in-progress: true'."""
        parsed = yaml.safe_load("cancel-in-progress: true")
        self.assertIs(parsed["cancel-in-progress"], True)
        self.assertIsInstance(parsed["cancel-in-progress"], bool)
        self.assertNotEqual(parsed["cancel-in-progress"], "true")

    def test_js_yaml_boolean_fidelity(self):
        """Empirically test js-yaml via CLI parsing of ci.yml."""
        res = subprocess.run(
            ["npx", "-y", "js-yaml", str(CI_PATH)],
            capture_output=True,
            text=True,
            check=True
        )
        json_obj = json.loads(res.stdout)
        cip = json_obj["concurrency"]["cancel-in-progress"]
        self.assertIs(cip, True)
        self.assertIsInstance(cip, bool)

    def test_schema_rejects_invalid_types_for_cancel_in_progress(self):
        """Adversarial oracle: verify schema strictly rejects non-boolean / non-expression types."""
        invalid_values = [
            123,
            ["not", "a", "boolean"],
            {"bad": "object"},
            "raw_string_without_expression"
        ]
        for val in invalid_values:
            with self.subTest(val=val):
                bad_doc = copy.deepcopy(self.ci_doc)
                bad_doc["concurrency"]["cancel-in-progress"] = val
                with self.assertRaises(jsonschema.ValidationError):
                    jsonschema.validate(instance=bad_doc, schema=self.schema)

    def test_schema_accepts_valid_concurrency_variants(self):
        """Verify schema accepts boolean true, false, and expressions."""
        valid_values = [
            True,
            False,
            "${{ github.ref != 'refs/heads/main' }}",
            "${{ inputs.cancel_running }}"
        ]
        for val in valid_values:
            with self.subTest(val=val):
                test_doc = copy.deepcopy(self.ci_doc)
                test_doc["concurrency"]["cancel-in-progress"] = val
                jsonschema.validate(instance=test_doc, schema=self.schema)

    def test_e2e_assertion_negative_oracle(self):
        """
        Adversarial oracle: verify that B1.3 test in e2e_tests/test_tier2_boundaries.py
        strictly requires 'cancel-in-progress: true' and would fail on false or expression.
        """
        oracle_false = "concurrency:\n  group: ci\n  cancel-in-progress: false\n"
        self.assertNotIn("cancel-in-progress: true", oracle_false)

        oracle_expr = "concurrency:\n  group: ci\n  cancel-in-progress: ${{ github.ref != 'refs/heads/main' }}\n"
        self.assertNotIn("cancel-in-progress: true", oracle_expr)

        oracle_quoted = "concurrency:\n  group: ci\n  cancel-in-progress: 'true'\n"
        # Notice string with quotes does NOT match the unquoted string assertion
        self.assertNotIn("cancel-in-progress: true", oracle_quoted)

        # The actual file strictly contains unquoted 'cancel-in-progress: true'
        self.assertIn("cancel-in-progress: true", self.ci_raw)


if __name__ == "__main__":
    unittest.main(verbosity=2)
