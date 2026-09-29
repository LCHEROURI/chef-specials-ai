# Dispatch to Spec Miner (Requirements & CI/CD Standards Specification)

## Objective
Extract, document, and formalize the exact specifications, schemas, standards, and acceptance criteria required by ORIGINAL_REQUEST.md for the Chef Specials AI project.

## Scope Boundaries
- Read-only specification extraction.
- DO NOT edit or create repository source code or test files.
- Only write metadata / report files inside your working directory: `/Users/laredjchehrouri/.gemini/antigravity/scratch/chef-specials-ai-repo/.agents/teamwork/spec_miner_survey/`.

## Input Information
- ORIGINAL_REQUEST.md path: `/Users/laredjchehrouri/.gemini/antigravity/scratch/chef-specials-ai-repo/.agents/teamwork/ORIGINAL_REQUEST.md`
- Project root: `/Users/laredjchehrouri/.gemini/antigravity/scratch/chef-specials-ai-repo`

## Investigation Questions
1. What are the exact specification requirements for R1 (Continuous Integration Workflow):
   - GitHub Actions schema compliance (`.github/workflows/*.yml`)
   - Triggers (push, pull_request)
   - Step sequence (setup Node, setup Python, install deps, run verify-bootstrap.sh, run npm test, install Playwright browsers, run tests_e2e.py)
   - Failure and success exit code semantics.
2. What are the exact specification requirements for R2 (Production Deployment & Release Pipeline):
   - Hosting platform target (Vercel)
   - Preview deployments on pull requests, production deployment on main branch updates
   - Serverless routing specification and build artifact handling.
3. What are the exact specification requirements for R3 (Environment & Configuration Security Guardrails):
   - Secret validation script CLI interface, exit codes, and non-disclosure guarantees.
   - List of mandatory vs optional environment variables.
4. What are the exact specification requirements for R4 (Automated Post-Deployment Health Check):
   - Smoke test script CLI interface, target URL parameter, timeout, assertions on HTTP status, serverless API response, headers.

## Output Requirements
Write your detailed specification report to:
`/Users/laredjchehrouri/.gemini/antigravity/scratch/chef-specials-ai-repo/.agents/teamwork/spec_miner_survey/report.md`
And write a standard handoff report to:
`/Users/laredjchehrouri/.gemini/antigravity/scratch/chef-specials-ai-repo/.agents/teamwork/spec_miner_survey/handoff.md`

## Completion Criteria
- Formal specification for R1, R2, R3, R4.
- Definitive acceptance criteria checklist.
- Handoff file created and completion message sent back to orchestrator.

## 2026-09-29T15:23:47Z
You are Spec Miner (survey_spec_miner).
Your working directory is /Users/laredjchehrouri/.gemini/antigravity/scratch/chef-specials-ai-repo/.agents/teamwork/spec_miner_survey
Read your dispatch instructions at /Users/laredjchehrouri/.gemini/antigravity/scratch/chef-specials-ai-repo/.agents/teamwork/spec_miner_survey/DISPATCH.md and the authoritative request at /Users/laredjchehrouri/.gemini/antigravity/scratch/chef-specials-ai-repo/.agents/teamwork/ORIGINAL_REQUEST.md.
Extract, formalize, and document the specifications, schemas, standards, and acceptance criteria for R1 (CI pipeline), R2 (Deployment & Release pipeline), R3 (Environment security guardrails), and R4 (Post-deployment health check).
Write your findings to report.md and handoff.md in your working directory.
When finished, send a message to orchestrator with your findings summary and handoff path.

