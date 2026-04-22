# CLI reference

This is the detailed command and flag reference for the `seo-solver` CLI.

## Commands

```bash
seo-solver compare <url-a> <url-b> [flags]
seo-solver validate <url> [flags]
seo-solver extract <url> [flags]
seo-solver list-rules [flags]
```

## Shared fetch flags

These flags are available on `compare`, `validate`, and `extract`.

| Flag | Meaning |
| --- | --- |
| `--fetcher <native\|playwright>` | Choose the fetch backend. Default: `native`. |
| `--timeout-ms <ms>` | Request timeout in milliseconds. Default: `30000`. |
| `--user-agent <string>` | Override the HTTP user agent. |
| `--retry-attempts <n>` | Number of retry attempts. Default: `1`. |
| `--retry-delay-ms <ms>` | Delay between retry attempts in milliseconds. |
| `--retry-backoff <fixed\|exponential>` | Retry backoff strategy. |
| `--respect-retry-after <true\|false>` | Honor `Retry-After` headers. |
| `--verbose`, `-v` | Show detailed output. |
| `--quiet`, `-q` | Show only the summary line. |
| `--output <path>`, `-o` | Write output to a file instead of stdout. |

## compare

Compare SEO markup between two URLs.

```bash
seo-solver compare <url-a> <url-b> [flags]
```

### Flags

| Flag | Meaning |
| --- | --- |
| `--format <terminal\|json\|markdown\|html>`, `-f` | Choose the report format. |
| `--targets <list>`, `-e` | Compare only selected targets such as `meta`, `opengraph`, `jsonld`, or `robotsTxt`. |
| `--editor <code\|cursor\|surf\|zed>` | Open normalized diff artifacts in a supported editor. |

### Examples

```bash
seo-solver compare https://example.com https://preview.example.com
seo-solver compare https://example.com https://preview.example.com --targets meta,opengraph
seo-solver compare https://example.com https://preview.example.com --format json --editor code
seo-solver compare https://example.com https://preview.example.com --format json --output compare.json
```

## validate

Run SEO validation on a URL.

```bash
seo-solver validate <url> [flags]
```

### Flags

| Flag | Meaning |
| --- | --- |
| `--format <terminal\|json\|markdown\|html>`, `-f` | Choose the report format. |
| `--targets <list>`, `-e` | Validate only selected targets. |
| `--min-severity <error\|warning\|info>` | Filter displayed diagnostics by minimum severity. |
| `--disable-rules <selector>` | Disable exact rule ids or wildcard selectors like `opengraph/*`. Repeatable. |
| `--severity-override <rule=severity>` | Override rule severity with strict selector validation. Repeatable. |
| `--jsonld-runtime <adobe\|off>` | Enable optional runtime JSON-LD validation or keep it pure. Default: `off`. |
| `--jsonld-cache-file <path>` | Optional schema cache file for runtime JSON-LD validation. |
| `--jsonld-schema-url <url>` | Override the schema URL used for runtime JSON-LD validation. |
| `--jsonld-schema-ttl-ms <ms>` | Schema cache TTL in milliseconds. |

### Examples

```bash
seo-solver validate https://example.com
seo-solver validate https://example.com --fetcher playwright
seo-solver validate https://example.com --disable-rules opengraph/*
seo-solver validate https://example.com --severity-override opengraph/description-missing=error
seo-solver validate https://example.com --jsonld-runtime adobe
```

## extract

Extract SEO data from a URL without running validation.

```bash
seo-solver extract <url> [flags]
```

### Flags

| Flag | Meaning |
| --- | --- |
| `--format <json>`, `-f` | Choose the output format. Only `json` is supported. |
| `--targets <list>`, `-e` | Extract only selected targets. |
| `--editor <code\|cursor\|surf\|zed>` | Open the generated extraction artifact in a supported editor. |

### Examples

```bash
seo-solver extract https://example.com --format json
seo-solver extract https://example.com --targets meta,opengraph,jsonld --format json
seo-solver extract https://example.com --output extract.json
seo-solver extract https://example.com --output extract.json --editor cursor
```

## list-rules

Print the available validation rules.

```bash
seo-solver list-rules [flags]
```

### Flags

| Flag | Meaning |
| --- | --- |
| `--format <terminal\|json>`, `-f` | Choose human-readable or JSON output. Default: `terminal`. |
| `--output <path>`, `-o` | Write the rule catalog to a file. |
| `--verbose`, `-v` | Accepted by the CLI, but does not change `list-rules` output shape. |
| `--quiet`, `-q` | Accepted by the CLI, but does not change `list-rules` output shape. |

### Examples

```bash
seo-solver list-rules
seo-solver list-rules --format json
seo-solver list-rules --output rules.txt
```

## Editor mode

The CLI can optionally open generated JSON artifacts in an editor.

### Supported editor ids

- `code`
- `cursor`
- `surf`
- `zed`

### Examples

```bash
# Open extraction output in VS Code
seo-solver extract https://example.com --editor code

# Write extraction output to a file and open that file in Cursor
seo-solver extract https://example.com --output extract.json --editor cursor

# Keep normal compare output and also open normalized diff artifacts in VS Code
seo-solver compare https://example.com https://preview.example.com --format json --editor code
```

## Notes

- The default fetcher is `native`.
- `compare` sets a non-zero exit code when diffs are found.
- `validate` sets a non-zero exit code when the validation report contains failures.
- `extract` only supports JSON output.
