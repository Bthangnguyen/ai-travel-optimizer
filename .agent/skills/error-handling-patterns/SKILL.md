---
name: error-handling-patterns
description: Patterns for handling errors in a scalable and robust way.
---

# Error Handling Patterns

## When to use this skill

- When designing API error responses.
- When implementing try/except blocks.
- When handling external service failures (OSRM, Mapbox).

## Workflow

1. Identify potential failure points.
2. Use specific exception types.
3. Implement meaningful logging.
4. Define fallback mechanisms.

## Instructions

- Use status codes consistently (400, 404, 500).
- Wrap external API calls in exponential backoff logic.
