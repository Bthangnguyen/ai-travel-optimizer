---
name: verification-before-completion
description: Final quality checklist before marking a task as finished.
---

# Verification Before Completion

## When to use this skill

- Before submitting work to the user.
- Before merging a final synchronization branch.

## Workflow

1. Verify all project files are saved and committed to the correct branch.
2. Run automated unit tests (pytest).
3. Manually verify the core user story (e.g., generate a travel plan).
4. Check logs for any OOM or API errors.
5. Update the walkthrough documentation.

## Instructions

- Ensure NO debug prints or mock data remain in production-ready branches.
- Verify docker-compose health for all services.
