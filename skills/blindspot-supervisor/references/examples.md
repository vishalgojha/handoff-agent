# Blindspot Supervisor Examples

Use these patterns to enforce format and response quality.

## Example: Planning Gap

### Misses

- No rollback plan for schema migration (`high`, `high` confidence, evidence: migration step list has no backward path).

### Why It Matters

- A failed deployment could leave production in an unrecoverable state.

### Background (What Happened Under the Hood)

- The plan optimized for forward progress but skipped failure-path design.
- Migration work requires both apply and revert logic for safe rollout.

### Suggested Fix

- Add explicit rollback steps and a pre-deploy backup checkpoint.
- Add a canary rollout stage with stop conditions.

## Example: Coding Gap

### Misses

- Input parsing assumes non-null `email` and can throw on empty payload (`high`, `high` confidence, evidence: parser accesses `.trim()` without null check).

### Why It Matters

- One malformed request can crash the handler and return 500.

### Background (What Happened Under the Hood)

- The code path trusts upstream validation that is not actually enforced.
- Runtime exceptions bypass intended validation error handling.

### Suggested Fix

- Add defensive null/type checks before normalization.
- Add test cases for null, empty string, and missing field payloads.

## Example: Requirement Gap

### Misses

- Success metric for "faster onboarding" is undefined (`medium`, `medium` confidence, evidence: requirements doc contains no KPI target).

### Why It Matters

- Delivery may ship without a measurable outcome, making acceptance subjective.

### Background (What Happened Under the Hood)

- Feature scope was defined before outcome metrics, creating evaluation ambiguity.
- Lack of acceptance KPIs increases iteration churn after release.

### Suggested Fix

- Define a KPI target (for example, onboarding completion time reduction by a specific percentage).
- Add acceptance criteria tied to measurable before/after baselines.
