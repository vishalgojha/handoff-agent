# Blindspot Supervisor Rubric

Apply this rubric before deciding whether to interrupt with a correction.

## Severity

- `critical`: Likely data loss, security exposure, legal/compliance failure, or major delivery failure.
- `high`: High probability of rework, outage, broken behavior, or user-impacting requirement miss.
- `medium`: Meaningful quality gap that should be corrected soon but not immediately blocking.
- `low`: Minor clarity/style issue with little direct risk.

## Confidence

- `high`: Direct evidence exists in files, command output, or tool traces.
- `medium`: Evidence is partial but still strongly supports the finding.
- `low`: Mostly inferential; treat as tentative.

## Intervention Threshold

- Auto-interrupt when severity is `critical` or `high` and confidence is `medium` or `high`.
- Report `medium` severity only when it can compound into high-impact risk.
- Skip `low` severity unless the user explicitly requests exhaustive review.

## Evidence Requirements

- Every `critical` or `high` miss must include at least one concrete anchor.
- If no anchor is available, tag evidence type as `inference` and downgrade confidence.
- Keep evidence succinct and directly relevant to the claimed miss.

## Teaching Depth

- Explain background process in concise form equivalent to 2-5 bullets.
- Focus on mechanism, tradeoff, and impact, not generic theory.
