# Dispatch to Explorer M2_2 (Environment Secret Validation Rules)

## Objective
Design the validation rules, format checking, and fallback mechanisms for environment variables in `scripts/verify-env.js`.

## Scope Boundaries
- Read-only exploration. DO NOT write or edit source code.
- Working directory: `/Users/laredjchehrouri/.gemini/antigravity/scratch/chef-specials-ai-repo/.agents/teamwork/explorer_m2_2/`.

## Input Information
- ORIGINAL_REQUEST.md: `/Users/laredjchehrouri/.gemini/antigravity/scratch/chef-specials-ai-repo/.agents/teamwork/ORIGINAL_REQUEST.md`
- PROJECT.md: `/Users/laredjchehrouri/.gemini/antigravity/scratch/chef-specials-ai-repo/.agents/teamwork/PROJECT.md`
- Target file: `api/generate-image.js` (inspect how secrets are read)

## Specific Questions
1. How does `api/generate-image.js` read `OPENAI_API_KEY` and fallback `chefsspecials`?
2. What are the format constraints for OpenAI API keys (`sk-` prefix, length >= 20, non-whitespace)?
3. What optional variables exist (`OPENAI_IMAGE_MODEL`, `OPENAI_IMAGE_QUALITY`) and what are their defaults and valid values?
4. What Vercel deployment variables should be checked when deployment checks are enabled (`VERCEL_TOKEN`, `VERCEL_ORG_ID`, `VERCEL_PROJECT_ID`)?
5. Provide the exact recommended validation functions and error messages (ensuring no secret values appear in error text).

## Output
Write `report.md` and `handoff.md` in your working directory and notify orchestrator when done.

## 2026-09-29T16:02:44Z
You are Explorer M2_2 (explorer_m2_2).
Your working directory is /Users/laredjchehrouri/.gemini/antigravity/scratch/chef-specials-ai-repo/.agents/teamwork/explorer_m2_2
Read your dispatch instructions at /Users/laredjchehrouri/.gemini/antigravity/scratch/chef-specials-ai-repo/.agents/teamwork/explorer_m2_2/DISPATCH.md, ORIGINAL_REQUEST.md at /Users/laredjchehrouri/.gemini/antigravity/scratch/chef-specials-ai-repo/.agents/teamwork/ORIGINAL_REQUEST.md, and PROJECT.md at /Users/laredjchehrouri/.gemini/antigravity/scratch/chef-specials-ai-repo/.agents/teamwork/PROJECT.md.
Design the secret validation rules (sk- prefix, length >= 20, non-whitespace, OPENAI_API_KEY with chefsspecials fallback, optional model/quality parameters, Vercel deployment variables) for scripts/verify-env.js.
Write handoff.md in your working directory and notify orchestrator when done.
