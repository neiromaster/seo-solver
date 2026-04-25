# SEO Comparison

| | URL | Status | Time |
|---|-----|--------|------|
| A | https://staging.example.com | 200 OK | 234ms |
| B | https://example.com | 200 OK | 187ms |

## Summary

3 changed · 2 added · 1 removed · 1 identical

## OpenGraph

- **~ Changed** `og:title`
  - **–** `"Draft Title That Was Used During Development Phase"`
  - **+** `"Final Title For Production Release"`
- **~ Changed** `og:description`
  - **–** `"Line 1\nLine 2 with <draft>"`
  - **+** `"Updated line with <final> and a much longer description to exercise truncation in normal mode"`
- **+ Added** `og:type`
  - **+** `"article"`

## Meta

✅ Identical

## Headings

- **~ Changed** `[1]`

  ```diff
  - h2: "Enterprise"
  + h3: "Enterprise | Pro"
  ```
- **+ Added** `[2]`

  ```diff
  + h3: "FAQ"
  ```

## JSON-LD

- **- Removed** *(entire type)*
  Present
