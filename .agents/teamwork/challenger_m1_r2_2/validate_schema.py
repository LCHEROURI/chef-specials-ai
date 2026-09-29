#!/usr/bin/env python
import json
import yaml
from pathlib import Path
import jsonschema

schema_path = Path("/Users/laredjchehrouri/.gemini/antigravity/scratch/chef-specials-ai-repo/.agents/teamwork/explorer_m1_2/github-workflow-schema.json")
ci_path = Path("/Users/laredjchehrouri/.gemini/antigravity/scratch/chef-specials-ai-repo/.github/workflows/ci.yml")

schema = json.loads(schema_path.read_text(encoding="utf-8"))
ci_data = yaml.safe_load(ci_path.read_text(encoding="utf-8"))

print("Testing validation of ci.yml against GitHub Workflow Schema (Draft 7)...")
try:
    jsonschema.validate(instance=ci_data, schema=schema)
    print("VALIDATION SUCCESS: ci.yml perfectly adheres to the GitHub Actions schema!")
except jsonschema.ValidationError as e:
    print(f"VALIDATION FAILED: {e.message}")
    print(f"Path: {list(e.path)}")
    raise
