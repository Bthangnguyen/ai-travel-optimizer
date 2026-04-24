---
name: systematic-debugging
description: A rigorous process for identifying and fixing software bugs.
---

# Systematic Debugging

## When to use this skill

- When an error is persistent or hard to reproduce.
- When there is a regression in the backend.

## Workflow

1. Re-read the code logic carefully.
2. Reproduce the error with a minimal test case.
3. Create a hypothesis about the cause.
4. Verify the hypothesis using logging or debuggers.
5. Fix the root cause, not just the symptom.
6. Verify the fix and run all regression tests.

## Instructions

- ALWAYS try to reproduce before fixing.
- Check OSRM/Redis logs for infrastructure-related issues.
