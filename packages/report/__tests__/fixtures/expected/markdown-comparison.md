# SEO Comparison

| | URL | Status | Time |
|---|-----|--------|------|
| A | https://staging.example.com | 200 OK | 234ms |
| B | https://example.com | 200 OK | 187ms |

## Summary

2 changed · 2 added · 1 removed · 1 identical

## OpenGraph

| Change | Path | Before | After |
|--------|------|--------|-------|
| ~ Changed | `og:title` | "Draft Title That Was Used During Development P... | "Final Title For Production Release" |
| ~ Changed | `og:description` | "Line 1\\nLine 2 with <draft>" | "Updated line with <final> and a much longer de... |
| + Added | `og:type` | — | "article" |

## Meta

✅ Identical

## Headings

| Change | Path | Before | After |
|--------|------|--------|-------|
| + Added | `[2]` | — | "h3 \\"Enterprise \| Pro\\"" |

## JSON-LD

| Change | Path | Before | After |
|--------|------|--------|-------|
| - Removed | *(entire type)* | Present | Not present in B |