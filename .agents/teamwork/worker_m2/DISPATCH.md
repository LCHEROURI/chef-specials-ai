# Dispatch to Worker M2 (Environment Security Guardrails Implementation)

## Objective
Implement Milestone 2 (M2):
1. Create `/Users/laredjchehrouri/.gemini/antigravity/scratch/chef-specials-ai-repo/scripts/verify-env.js` adhering to all requirements in ORIGINAL_REQUEST.md, PROJECT.md, and the Explorer reports.
2. Update `package.json` to add `"verify-env": "node scripts/verify-env.js"`.
3. Verify that `scripts/verify-env.js` passes all tests in `e2e_tests/` (Tier 1 Features 5 & 6, Tier 2 Boundaries 5 & 6, Pairwise tests).

## File Ownership
You exclusively own:
- `/Users/laredjchehrouri/.gemini/antigravity/scratch/chef-specials-ai-repo/scripts/verify-env.js`
- `/Users/laredjchehrouri/.gemini/antigravity/scratch/chef-specials-ai-repo/package.json`

## Input Information
- ORIGINAL_REQUEST.md: `/Users/laredjchehrouri/.gemini/antigravity/scratch/chef-specials-ai-repo/.agents/teamwork/ORIGINAL_REQUEST.md`
- PROJECT.md: `/Users/laredjchehrouri/.gemini/antigravity/scratch/chef-specials-ai-repo/.agents/teamwork/PROJECT.md`
- Explorer M2_1 Handoff: `/Users/laredjchehrouri/.gemini/antigravity/scratch/chef-specials-ai-repo/.agents/teamwork/explorer_m2_1/handoff.md`
- Explorer M2_2 Handoff: `/Users/laredjchehrouri/.gemini/antigravity/scratch/chef-specials-ai-repo/.agents/teamwork/explorer_m2_2/handoff.md`
- Explorer M2_3 Handoff: `/Users/laredjchehrouri/.gemini/antigravity/scratch/chef-specials-ai-repo/.agents/teamwork/explorer_m2_3/handoff.md`

## Specifications to Implement
1. **CLI Arguments & Exit Codes**:
   - Parse `--mode` (`production` [default], `ci`, `preview`, `development`), `--strict` (boolean), `--check-deployment` (boolean), `-h`/`--help`.
   - Exit code `0`: Valid configuration, non-strict pass, or `--help`.
   - Exit code `1`: Validation failure (missing required key in strict mode or malformed secret).
   - Exit code `2`: Invalid CLI arguments (unrecognized flag, invalid mode value).
2. **Secret Validation Rules**:
   - `OPENAI_API_KEY`: Check `process.env.OPENAI_API_KEY || process.env.chefsspecials`.
   - Must start with `sk-`, length >= 20 characters, no whitespace or control characters.
   - In CI mode: if missing, warn but exit 0.
   - In production mode: if missing and `--strict`, exit 1. If present but invalid format (`sk-` missing, < 20 chars, whitespace), exit 1.
   - Optional parameters: `OPENAI_IMAGE_MODEL` (default `"gpt-image-2"`), `OPENAI_IMAGE_QUALITY` (default `"medium"`).
   - If `--check-deployment`: check `VERCEL_TOKEN`, `VERCEL_ORG_ID`, `VERCEL_PROJECT_ID`.
3. **Zero-Leakage & Masking Guarantees**:
   - Plaintext secret values MUST NEVER appear in stdout or stderr.
   - Display masked representations (e.g. `sk-proj-****...****` or `sk-*** [CONFIGURED]`).
   - When running under GitHub Actions (`GITHUB_ACTIONS=true` or `"1"`), emit `::add-mask::<secret>` for every detected secret string.
   - Do NOT serialize `process.env` on errors. Clean error messages only.

## Verification Requirements
You MUST run the following commands and record outputs in your handoff report:
1. `node scripts/verify-env.js --help` (exits 0)
2. `node scripts/verify-env.js --completely-unrecognized-flag` (exits 2)
3. `node scripts/verify-env.js --mode=ci` (exits 0)
4. `npm test` (exits 0)
5. `python3 e2e_tests/runner.py` (verify newly passing tests for Features 5 & 6, 0 failures, 0 errors)

## Mandatory Integrity Warning
DO NOT CHEAT. All implementations must be genuine. DO NOT hardcode test results, create dummy/facade implementations, or circumvent the intended task. A teamwork_preview_auditor will independently verify your work. Integrity violations WILL be detected and your work WILL be rejected.

## Deliverables
- Created `scripts/verify-env.js` (executable with `chmod +x`)
- Updated `package.json`
- Write `handoff.md` in `/Users/laredjchehrouri/.gemini/antigravity/scratch/chef-specials-ai-repo/.agents/teamwork/worker_m2/handoff.md`
- Send completion message to orchestrator.
