# Dispatch to Explorer M1_2 (CI Workflow Schema & Environment Specification)

## Objective
Formulate the exact structure, schema compliance, environment setup, and dependency management for `.github/workflows/ci.yml`.

## Scope Boundaries
- Read-only exploration. DO NOT modify any code files.
- Working directory: `/Users/laredjchehrouri/.gemini/antigravity/scratch/chef-specials-ai-repo/.agents/teamwork/explorer_m1_2/`.

## Input Information
- ORIGINAL_REQUEST.md: `/Users/laredjchehrouri/.gemini/antigravity/scratch/chef-specials-ai-repo/.agents/teamwork/ORIGINAL_REQUEST.md`
- PROJECT.md: `/Users/laredjchehrouri/.gemini/antigravity/scratch/chef-specials-ai-repo/.agents/teamwork/PROJECT.md`
- Existing workflow: `/Users/laredjchehrouri/.gemini/antigravity/scratch/chef-specials-ai-repo/.github/workflows/bootstrap-check.yml`

## Specific Questions
1. What triggers should be in `.github/workflows/ci.yml`? (push to main, pull_request to main, workflow_dispatch).
2. What runner image and permissions? (`ubuntu-latest`, `permissions: contents: read`).
3. Concurrency settings to cancel redundant runs?
4. How to set up Node.js 20 and Python 3.11 cleanly using standard GitHub Actions?
5. How to install Playwright and its browser dependencies on Ubuntu (`pip install playwright`, `playwright install --with-deps chromium`)?
6. Provide the complete recommended YAML content for `.github/workflows/ci.yml`.

## Output
Write report to `report.md` and handoff to `handoff.md` in your working directory. Send completion message when done.

## 2026-09-29T15:29:49Z
You are Explorer M1_2 (explorer_m1_2).
Your working directory is /Users/laredjchehrouri/.gemini/antigravity/scratch/chef-specials-ai-repo/.agents/teamwork/explorer_m1_2
Read your dispatch instructions at /Users/laredjchehrouri/.gemini/antigravity/scratch/chef-specials-ai-repo/.agents/teamwork/explorer_m1_2/DISPATCH.md, ORIGINAL_REQUEST.md at /Users/laredjchehrouri/.gemini/antigravity/scratch/chef-specials-ai-repo/.agents/teamwork/ORIGINAL_REQUEST.md, and PROJECT.md at /Users/laredjchehrouri/.gemini/antigravity/scratch/chef-specials-ai-repo/.agents/teamwork/PROJECT.md.
Formulate the exact structure, schema compliance, environment setup, and dependency management for .github/workflows/ci.yml.
Write report.md and handoff.md in your working directory and notify orchestrator when done.
