# Sub-agents for Lab 6 / Lab 7

Three of the four specialist reviewers are pre-authored and working:

- `repository-analyst.md` — structural blast-radius mapping
- `control-reviewer.md` — enforcement/audit regression checks
- `security-reviewer.md` — authorization and injection checks

**`evidence-auditor.md` is intentionally not included.** Writing it — a read-only specialist that verifies claims made by the other three against actual `audit_log` rows and test output, rather than trusting their prose — is the Lab 6/7 exercise itself. Use the three above as the template for tool-scoping (read-only: `Read, Grep, Glob`, never `Edit`/`Write`/`Bash`) and output shape (one structured JSON object, no narrative recommendation).

The parent agent that fans out to all four and consolidates their findings into one release decision is not a sub-agent config — it's the participant's own orchestration in Lab 6, and the CI job in Lab 7 (`.github/workflows/pr-review.yml`).
