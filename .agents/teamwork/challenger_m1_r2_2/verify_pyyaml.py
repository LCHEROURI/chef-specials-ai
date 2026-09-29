#!/usr/bin/env python3
import sys
import yaml
import json
from pathlib import Path

ci_path = Path("/Users/laredjchehrouri/.gemini/antigravity/scratch/chef-specials-ai-repo/.github/workflows/ci.yml")
raw_yaml = ci_path.read_text(encoding="utf-8")

print("--- Testing PyYAML parser ---")
parsed_pyyaml = yaml.safe_load(raw_yaml)
concurrency = parsed_pyyaml.get("concurrency", {})
cancel_val = concurrency.get("cancel-in-progress")
print(f"concurrency dict: {concurrency}")
print(f"cancel-in-progress value: {cancel_val!r}, type: {type(cancel_val)}")
assert cancel_val is True, f"Expected bool True, got {cancel_val!r}"
assert type(cancel_val) is bool, f"Expected type bool, got {type(cancel_val)}"

print("PyYAML parsed cancel-in-progress as native boolean True successfully.")

# Also test YAML 1.1 vs 1.2 boolean representations
variations = ["true", "True", "TRUE", "yes", "on"]
for v in variations:
    doc = f"concurrency:\n  group: test\n  cancel-in-progress: {v}\n"
    res = yaml.safe_load(doc)
    c_val = res["concurrency"]["cancel-in-progress"]
    print(f"PyYAML loaded '{v}' as: {c_val!r} ({type(c_val).__name__})")

print("PyYAML verification complete.")
