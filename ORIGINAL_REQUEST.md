# Original User Request

## 2026-09-29T15:21:54Z

Build and automate production deployment, continuous integration (CI/CD), and operational verification for Chef Specials AI (chef-specials-ai).

Working directory: /Users/laredjchehrouri/.gemini/antigravity/scratch/chef-specials-ai-repo
Integrity mode: development

## Requirements

### R1. Continuous Integration (CI) Workflow
Implement an automated continuous integration pipeline (GitHub Actions workflow) that executes on every push and pull request. The pipeline must install project dependencies, execute unit tests and the universal bootstrap verification, and run headless end-to-end browser tests across the full application.

### R2. Production Deployment & Release Pipeline
Establish an automated production deployment workflow that builds and deploys the application and serverless API endpoints to production hosting (e.g. Vercel), generating previews on pull requests and promoting to production on main branch updates.

### R3. Environment & Configuration Security Guardrails
Provide automated environment configuration validation that checks for required production secrets and environment variables (e.g. `OPENAI_API_KEY`, `OPENAI_IMAGE_MODEL`) before deployment, preventing deployment failures or secret exposure.

### R4. Automated Post-Deployment Health Check
Implement a programmatic smoke test / health check script that verifies the live deployment endpoint, confirming serverless API responsiveness and valid application headers.

## Acceptance Criteria

### CI Pipeline
- [ ] A GitHub Actions workflow file exists in `.github/workflows/` and validates cleanly against the GitHub Actions schema.
- [ ] The CI workflow runs `npm test` (including `tests_api.js` and `./scripts/verify-bootstrap.sh`) and headless Playwright tests (`tests_e2e.py`).
- [ ] Workflow steps succeed with exit code 0 when all tests pass, and fail the build if any test fails.

### Deployment & Config
- [ ] Deployment configuration files and deployment scripts cleanly handle build artifacts and serverless routing without manual intervention.
- [ ] A pre-flight verification script verifies environment secrets without printing sensitive values to stdout/logs.
- [ ] Smoke test script can be invoked programmatically to check deployment status and API availability.
