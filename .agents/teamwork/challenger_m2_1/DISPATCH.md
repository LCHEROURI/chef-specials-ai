# Dispatch to Challenger M2_1 (Adversarial Secret Injection & Leakage Testing)

## Objective
Attempt to force `scripts/verify-env.js` to leak raw secret values using adversarial inputs:
- Special characters, regex meta-characters, terminal escape codes, unicode, newlines
- Uncaught exceptions, malformed flags, missing arguments

## Scope Boundaries
- Adversarial challenge verification.
- Scratch scripts ONLY inside: `/Users/laredjchehrouri/.gemini/antigravity/scratch/chef-specials-ai-repo/.agents/teamwork/challenger_m2_1/`.
- DO NOT modify repository files.

## Input Information
- ORIGINAL_REQUEST.md: `/Users/laredjchehrouri/.gemini/antigravity/scratch/chef-specials-ai-repo/.agents/teamwork/ORIGINAL_REQUEST.md`
- Target: `/Users/laredjchehrouri/.gemini/antigravity/scratch/chef-specials-ai-repo/scripts/verify-env.js`
- Worker M2 Handoff: `/Users/laredjchehrouri/.gemini/antigravity/scratch/chef-specials-ai-repo/.agents/teamwork/worker_m2/handoff.md`

## Challenges
1. Pass high-entropy secret with special characters and verify plaintext string is NOT in stdout or stderr.
2. Pass invalid flags and verify no environment variables (like canary variables) are printed in error messages.
3. Provide verdict: `APPROVE` or `REJECT` in `handoff.md`.
