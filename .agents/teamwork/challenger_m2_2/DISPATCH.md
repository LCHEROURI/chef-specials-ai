# Dispatch to Challenger M2_2 (Adversarial Exit Code & Mode Validation)

## Objective
Empirically verify all boundary conditions and exit codes of `scripts/verify-env.js`:
- Unrecognized flags (exit 2)
- Strict production mode with missing key (exit 1)
- Strict production mode with malformed key (exit 1)
- CI mode with missing key (exit 0)
- Valid key (exit 0)
- Legacy fallback `chefsspecials` (exit 0)

## Scope Boundaries
- Adversarial challenge verification.
- Scratch scripts ONLY inside: `/Users/laredjchehrouri/.gemini/antigravity/scratch/chef-specials-ai-repo/.agents/teamwork/challenger_m2_2/`.
- DO NOT modify repository files.

## Input Information
- ORIGINAL_REQUEST.md: `/Users/laredjchehrouri/.gemini/antigravity/scratch/chef-specials-ai-repo/.agents/teamwork/ORIGINAL_REQUEST.md`
- Target: `/Users/laredjchehrouri/.gemini/antigravity/scratch/chef-specials-ai-repo/scripts/verify-env.js`
- Worker M2 Handoff: `/Users/laredjchehrouri/.gemini/antigravity/scratch/chef-specials-ai-repo/.agents/teamwork/worker_m2/handoff.md`

## Challenges
1. Test all boundary permutations of flags, missing arguments, and exit codes.
2. Run `python3 e2e_tests/runner.py` and confirm 0 failures.
3. Provide verdict: `APPROVE` or `REJECT` in `handoff.md`.
