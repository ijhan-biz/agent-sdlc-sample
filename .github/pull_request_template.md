## AI-assisted change

- [ ] GitHub Issue linked and labeled `ai-ready`
- [ ] Acceptance criteria and test IDs linked
- [ ] No production logs, customer data, secrets, or tokens used
- [ ] Public response schema unchanged
- [ ] Failed test evidence and fix history recorded
- [ ] Rollback condition or feature flag impact noted

## Required evidence

```text
npm run test
npm run build
npm run harness:strict
```

## Merge block conditions

- Required checks failed
- Secret or customer data exposure detected
- CODEOWNERS approval missing
- Rollback owner or validation command missing