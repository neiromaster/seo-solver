#!/usr/bin/env node

import { execFileSync } from 'node:child_process';
import { writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import type { Browser } from 'playwright';
import { chromium } from 'playwright';

type Schema = Record<string, unknown>;

type ValidationIssue = {
  issueMessage: string;
  severity: 'ERROR' | 'WARNING';
  path: Array<{ type: string; index: number }> | undefined;
  fieldNames: string[];
  location?: string;
};
type OgData = Record<string, string>;
type FlatData = Record<string, string>;

const args = process.argv.slice(2);

const KNOWN_FLAGS = new Set(['--vscode', '-v', '--curl', '-c', '--og', '-o', '--validate', '-V']);
const unknownFlags = args.filter((a) => a.startsWith('-') && !KNOWN_FLAGS.has(a));
if (unknownFlags.length > 0) {
  console.error(`Unknown flag(s): ${unknownFlags.join(', ')}`);
  console.error('Known flags: --vscode (-v), --curl (-c), --og (-o), --validate (-V)');
  process.exit(1);
}

const vscodeDiff = args.includes('--vscode') || args.includes('-v');
const useCurl = args.includes('--curl') || args.includes('-c');
const useOg = args.includes('--og') || args.includes('-o');
const useValidate = args.includes('--validate') || args.includes('-V');
const urls = args.filter((a) => !a.startsWith('-'));
const [url1, url2] = urls;

let validatedUrl1: string;
let validatedUrl2: string | undefined;

if (useValidate) {
  if (!url1 || url2) {
    console.error('Validation mode requires exactly one URL');
    console.error('Usage: seo-solver <url> --validate|-V [--curl|-c]');
    process.exit(1);
  }
  validatedUrl1 = url1;
} else {
  if (!url1 || !url2) {
    console.error('Usage: seo-solver <url1> <url2> [--vscode|-v] [--curl|-c] [--og|-o]');
    process.exit(1);
  }
  validatedUrl1 = url1;
  validatedUrl2 = url2;
}

// ── JSON-LD extraction ────────────────────────────────────────────────────────

function extractSchemasFromHtml(html: string): Schema[] {
  const texts = [
    ...html.matchAll(/<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi),
  ].flatMap((m) => (m[1] !== undefined ? [m[1]] : []));
  const schemas = texts
    .map((t) => {
      try {
        return JSON.parse(t) as unknown;
      } catch {
        return null;
      }
    })
    .filter(Boolean);
  return normalizeSchemas(schemas);
}

function normalizeSchemas(schemas: unknown[]): Schema[] {
  const result: Schema[] = [];
  for (const item of schemas) {
    if (Array.isArray(item)) {
      result.push(...normalizeSchemas(item as unknown[]));
      continue;
    }
    if (!item || typeof item !== 'object') continue;
    const s = item as Schema;
    if (s['@graph'] && Array.isArray(s['@graph'])) {
      result.push(...normalizeSchemas(s['@graph'] as unknown[]));
      continue;
    }
    if (Array.isArray(s['@type'])) {
      for (const type of s['@type'] as string[]) result.push({ ...s, '@type': type });
      continue;
    }
    result.push(s);
  }
  return result;
}

// ── OpenGraph extraction ──────────────────────────────────────────────────────

function extractOgFromHtml(html: string): OgData {
  const og: OgData = {};
  for (const m of html.matchAll(/<meta[^>]+>/gi)) {
    const tag = m[0];
    const prop = tag.match(/(?:property|name)=["']([^"']+)["']/i)?.[1];
    const content = tag.match(/content=["']([^"']*)["']/i)?.[1];
    if (prop && content !== undefined && (prop.startsWith('og:') || prop.startsWith('twitter:'))) {
      og[prop] = content;
    }
  }
  return og;
}

const BROWSER_CONTEXT_OPTIONS = {
  userAgent:
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  locale: 'ru-RU',
};

async function extractOgBrowser(browser: Browser, url: string): Promise<OgData> {
  const ctx = await browser.newContext(BROWSER_CONTEXT_OPTIONS);
  const page = await ctx.newPage();
  try {
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 20000 });
    return await page
      .locator('meta')
      .evaluateAll((metas) =>
        Object.fromEntries(
          (metas as Element[])
            .map(
              (el) =>
                [el.getAttribute('property') || el.getAttribute('name'), el.getAttribute('content')] as [
                  string | null,
                  string | null,
                ],
            )
            .filter(
              ([prop, content]) => prop && content !== null && (prop.startsWith('og:') || prop.startsWith('twitter:')),
            ),
        ),
      );
  } finally {
    await ctx.close();
  }
}

async function extractSchemasBrowser(browser: Browser, url: string): Promise<Schema[]> {
  const ctx = await browser.newContext(BROWSER_CONTEXT_OPTIONS);
  const page = await ctx.newPage();
  try {
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 20000 });
    const texts = await page
      .locator('script[type="application/ld+json"]')
      .evaluateAll((els) => (els as Element[]).map((el) => el.textContent));
    return normalizeSchemas(
      texts
        .filter((t): t is string => t !== null)
        .map((t) => {
          try {
            return JSON.parse(t) as unknown;
          } catch {
            return null;
          }
        })
        .filter(Boolean),
    );
  } finally {
    await ctx.close();
  }
}

// ── Curl fetch (shared) ───────────────────────────────────────────────────────

function fetchHtmlCurl(url: string): string {
  return execFileSync(
    'curl',
    [
      '-sL',
      '--max-time',
      '30',
      '-A',
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      '-H',
      'Accept-Language: ru-RU,ru;q=0.9',
      url,
    ],
    { encoding: 'utf8', maxBuffer: 10 * 1024 * 1024 },
  );
}

// ── Comparison helpers ────────────────────────────────────────────────────────

function groupByType(schemas: Schema[]): Map<string, Schema[]> {
  const groups = new Map<string, Schema[]>();
  for (const schema of schemas) {
    const type = String(schema['@type'] ?? 'undefined');
    const list = groups.get(type);
    if (list) {
      list.push(schema);
    } else {
      groups.set(type, [schema]);
    }
  }
  return groups;
}

function flatten(obj: Schema, prefix = ''): FlatData {
  return Object.entries(obj).reduce<FlatData>((acc, [k, v]) => {
    const key = prefix ? `${prefix}.${k}` : k;
    if (v && typeof v === 'object' && !Array.isArray(v)) Object.assign(acc, flatten(v as Schema, key));
    else acc[key] = Array.isArray(v) ? JSON.stringify(v) : v === null ? 'null' : String(v ?? '');
    return acc;
  }, {});
}

function compareFlat(a: FlatData, b: FlatData) {
  const keys = new Set([...Object.keys(a), ...Object.keys(b)]);
  const diffs: Array<{ key: string; a: string; b: string }> = [];
  const added: string[] = [];
  const removed: string[] = [];
  for (const k of keys) {
    const va = a[k];
    const vb = b[k];
    if (va === undefined) added.push(k);
    else if (vb === undefined) removed.push(k);
    else if (va !== vb) diffs.push({ key: k, a: va, b: vb });
  }
  return { diffs, added, removed };
}

// ── VS Code diff ──────────────────────────────────────────────────────────────

function urlSlug(url: string): string {
  try {
    const u = new URL(url);
    const base = (u.hostname + u.pathname)
      .replace(/[^\w]/g, '_')
      .replace(/_+/g, '_')
      .replace(/^_+|_+$/g, '');
    const qs = u.search
      .slice(1)
      .replace(/[^\w]/g, '_')
      .replace(/_+/g, '_')
      .replace(/^_+|_+$/g, '');
    return qs ? `${base}__${qs}` : base;
  } catch {
    return url.replace(/[^\w]/g, '_').slice(0, 100);
  }
}

function formatSchemasForDiff(schemas: Schema[]): string {
  const sorted = [...schemas].sort((a, b) => {
    const ta = String(a['@type'] ?? '');
    const tb = String(b['@type'] ?? '');
    return ta < tb ? -1 : ta > tb ? 1 : 0;
  });
  return JSON.stringify(sorted, null, 2);
}

function openVscodeDiff(content1: string, content2: string, prefix: string, label1: string, label2: string): void {
  const tmp = tmpdir();
  const f1 = join(tmp, `${prefix}_${urlSlug(label1)}.json`);
  const f2 = join(tmp, `${prefix}_${urlSlug(label2)}.json`);
  writeFileSync(f1, content1, 'utf8');
  writeFileSync(f2, content2, 'utf8');
  console.log(`\nSaved:\n  ${f1}\n  ${f2}`);
  try {
    execFileSync('code', ['--diff', f1, f2], { stdio: 'inherit' });
  } catch {
    console.error('Could not open VS Code. Make sure `code` CLI is in PATH.');
  }
}

// ── Output helpers ────────────────────────────────────────────────────────────

const RED = '\x1b[31m',
  GREEN = '\x1b[32m',
  YELLOW = '\x1b[33m',
  CYAN = '\x1b[36m',
  RESET = '\x1b[0m',
  BOLD = '\x1b[1m',
  DIM = '\x1b[2m';

function printFlatDiff(a: FlatData, b: FlatData): void {
  const { diffs, added, removed } = compareFlat(a, b);
  if (diffs.length + added.length + removed.length === 0) {
    console.log(`${GREEN}✓ identical${RESET}\n`);
    return;
  }
  for (const { key, a: va, b: vb } of diffs) {
    console.log(`  ${BOLD}${key}${RESET}`);
    console.log(`    ${RED}- ${va}${RESET}`);
    console.log(`    ${GREEN}+ ${vb}${RESET}`);
  }
  for (const k of removed) console.log(`  ${RED}- ${k}: ${a[k] ?? ''}${RESET}`);
  for (const k of added) console.log(`  ${GREEN}+ ${k}: ${b[k] ?? ''}${RESET}`);
  console.log();
}

// ── JSON-LD comparison ────────────────────────────────────────────────────────

function compareJsonLd(s1: Schema[], s2: Schema[]): void {
  const g1 = groupByType(s1);
  const g2 = groupByType(s2);
  const allTypes = [...new Set([...g1.keys(), ...g2.keys()])];

  for (const type of allTypes) {
    const schemas1 = g1.get(type) ?? [];
    const schemas2 = g2.get(type) ?? [];
    const count1 = schemas1.length;
    const count2 = schemas2.length;
    const typeLabel = type === 'undefined' ? `${DIM}(no @type)${RESET}` : type;

    if (count2 === 0) {
      console.log(`${RED}- ${typeLabel}${RESET} (${count1} in URL1)`);
      for (let i = 0; i < schemas1.length; i++) {
        const suffix = count1 > 1 ? ` [#${i + 1}]` : '';
        for (const [k, v] of Object.entries(flatten(schemas1[i] as Schema)))
          console.log(`  ${RED}-${suffix} ${k}: ${v}${RESET}`);
      }
      console.log();
      continue;
    }

    if (count1 === 0) {
      console.log(`${GREEN}+ ${typeLabel}${RESET} (${count2} in URL2)`);
      for (let i = 0; i < schemas2.length; i++) {
        const suffix = count2 > 1 ? ` [#${i + 1}]` : '';
        for (const [k, v] of Object.entries(flatten(schemas2[i] as Schema)))
          console.log(`  ${GREEN}+${suffix} ${k}: ${v}${RESET}`);
      }
      console.log();
      continue;
    }

    const maxCount = Math.max(count1, count2);
    let hasDifferences = false;

    for (let i = 0; i < maxCount; i++) {
      const a = schemas1[i];
      const b = schemas2[i];
      const suffix = maxCount > 1 ? ` [#${i + 1}]` : '';

      if (!b) {
        if (!hasDifferences) {
          console.log(`${YELLOW}~ ${typeLabel}${RESET} (${count1} vs ${count2})`);
          hasDifferences = true;
        }
        for (const [k, v] of Object.entries(flatten(a as Schema))) console.log(`  ${RED}-${suffix} ${k}: ${v}${RESET}`);
        continue;
      }
      if (!a) {
        if (!hasDifferences) {
          console.log(`${YELLOW}~ ${typeLabel}${RESET} (${count1} vs ${count2})`);
          hasDifferences = true;
        }
        for (const [k, v] of Object.entries(flatten(b as Schema)))
          console.log(`  ${GREEN}+${suffix} ${k}: ${v}${RESET}`);
        continue;
      }

      const fa = flatten(a),
        fb = flatten(b);
      const { diffs, added, removed } = compareFlat(fa, fb);
      if (diffs.length + added.length + removed.length > 0) {
        if (!hasDifferences) {
          console.log(`${YELLOW}~ ${typeLabel}${RESET} (${count1} vs ${count2})`);
          hasDifferences = true;
        }
        for (const { key, a: va, b: vb } of diffs) {
          console.log(`  ${BOLD}${key}${suffix}${RESET}`);
          console.log(`    ${RED}- ${va}${RESET}`);
          console.log(`    ${GREEN}+ ${vb}${RESET}`);
        }
        for (const k of removed) console.log(`  ${RED}-${suffix} ${k}: ${fa[k] ?? ''}${RESET}`);
        for (const k of added) console.log(`  ${GREEN}+${suffix} ${k}: ${fb[k] ?? ''}${RESET}`);
      }
    }

    if (!hasDifferences) {
      console.log(`${GREEN}✓ ${typeLabel}${RESET} — identical (${count1})\n`);
    } else {
      console.log();
    }
  }
}

// ── Schema.org validation ────────────────────────────────────────────────────────

async function validateSchemas(schemas: Schema[]): Promise<void> {
  // Fetch Schema.org definition
  const schemaOrgJson = await (await fetch('https://schema.org/version/latest/schemaorg-all-https.jsonld')).json();

  // Convert schemas to validator format
  // The validator expects format from @marbec/web-auto-extractor
  // Data must be grouped by type under each format key
  const schemasByType: Record<string, Schema[]> = {};
  for (const schema of schemas) {
    const type = String(schema['@type'] ?? 'undefined');
    if (!schemasByType[type]) {
      schemasByType[type] = [];
    }
    schemasByType[type].push(schema);
  }

  const extractedData = {
    jsonld: schemasByType,
    microdata: {},
    rdfa: {},
  };

  // Dynamically import validator (only when needed)
  const validatorModule = await import('@adobe/structured-data-validator');
  const Validator = validatorModule.default;
  const validator = new Validator(schemaOrgJson);
  validator.debug = false;

  const results = await validator.validate(extractedData);

  if (results.length === 0) {
    console.log(`${GREEN}✓ No validation errors found${RESET}\n`);
    return;
  }

  const errors = results.filter((r: { severity: string }) => r.severity === 'ERROR');
  const warnings = results.filter((r: { severity: string }) => r.severity === 'WARNING');

  // Group issues by schema (type + index)
  type GroupedIssue = ValidationIssue & { schemaKey: string; contextPath: string };

  const groupIssues = (issues: typeof results): Map<string, GroupedIssue[]> => {
    const grouped = new Map<string, GroupedIssue[]>();
    for (const issue of issues) {
      const path = issue.path; // Full path
      // Get schema info from first path element
      const root = path?.[0];
      const schemaKey = root ? `${root.type}[${root.index + 1}]` : 'unknown';

      // Build context path showing where the issue is
      const contextPath: string[] = [];
      if (path) {
        for (let i = 1; i < path.length; i++) {
          const p = path[i];
          if (!p) continue;
          const index = typeof p.index === 'number' ? `[${p.index + 1}]` : '';
          const part = p.type ? `${p.type}${index}` : index;
          contextPath.push(part);
        }
      }

      const groupedIssue: GroupedIssue = {
        ...issue,
        schemaKey,
        contextPath: contextPath.join(' → '),
      };

      if (!grouped.has(schemaKey)) grouped.set(schemaKey, []);
      grouped.get(schemaKey)?.push(groupedIssue);
    }
    return grouped;
  };

  const printIssues = (issues: typeof results, color: string, icon: string, label: string) => {
    const grouped = groupIssues(issues);
    console.log(`${color}${BOLD}${label} (${issues.length}):${RESET}\n`);

    for (const [schemaKey, schemaIssues] of grouped) {
      console.log(`  ${DIM}${schemaKey}${RESET}`);
      for (const issue of schemaIssues) {
        const fieldPath = issue.fieldNames.join('.');
        console.log(
          `    ${color}${icon}${RESET} ${BOLD}${fieldPath}${RESET}${issue.contextPath ? ` ${DIM}(${issue.contextPath})${RESET}` : ''}`,
        );
        console.log(`      ${issue.issueMessage}`);
        console.log();
      }
    }
  };

  if (errors.length > 0) {
    printIssues(errors, RED, '✗', 'ERRORS');
  }

  if (warnings.length > 0) {
    printIssues(warnings, YELLOW, '⚠', 'WARNINGS');
  }
}

// ── OpenGraph comparison ──────────────────────────────────────────────────────

function compareOg(og1: OgData, og2: OgData): void {
  if (Object.keys(og1).length === 0 && Object.keys(og2).length === 0) {
    console.log(`${DIM}No OpenGraph tags found${RESET}\n`);
    return;
  }
  printFlatDiff(og1, og2);
}

// ── Main ──────────────────────────────────────────────────────────────────────

if (useValidate) {
  // Validation mode - single URL
  const mode = useOg ? 'OpenGraph' : 'JSON-LD';
  console.log(`\n${BOLD}Validating ${mode}${useCurl ? ' (curl/SSR)' : ' (browser)'}...${RESET}\n`);

  let data: OgData | Schema[];

  if (useCurl) {
    const html = fetchHtmlCurl(validatedUrl1);
    data = useOg ? extractOgFromHtml(html) : extractSchemasFromHtml(html);
  } else {
    const browser = await chromium.launch();
    try {
      if (useOg) {
        data = await extractOgBrowser(browser, validatedUrl1);
      } else {
        data = await extractSchemasBrowser(browser, validatedUrl1);
      }
    } finally {
      await browser.close();
    }
  }

  const countLabel = useOg ? `${Object.keys(data).length} tag(s)` : `${(data as Schema[]).length} schema(s)`;
  console.log(`${CYAN}URL:${RESET} ${validatedUrl1} → ${countLabel}\n`);

  if (!useOg) {
    await validateSchemas(data as Schema[]);
  } else {
    console.log(`${YELLOW}OpenGraph validation not supported${RESET}\n`);
  }
} else {
  // Diff mode - two URLs
  const mode = useOg ? 'OpenGraph' : 'JSON-LD';
  console.log(`\n${BOLD}Fetching ${mode} metadata${useCurl ? ' (curl/SSR)' : ' (browser)'}...${RESET}`);

  // biome-ignore lint/style/noNonNullAssertion: validatedUrl2 is guaranteed to be defined in diff mode
  const url2: string = validatedUrl2!;
  let d1: OgData | Schema[], d2: OgData | Schema[];

  if (useCurl) {
    const [html1, html2] = await Promise.all([fetchHtmlCurl(validatedUrl1), fetchHtmlCurl(url2)]);
    d1 = useOg ? extractOgFromHtml(html1) : extractSchemasFromHtml(html1);
    d2 = useOg ? extractOgFromHtml(html2) : extractSchemasFromHtml(html2);
  } else {
    const browser = await chromium.launch();
    try {
      if (useOg) {
        [d1, d2] = await Promise.all([extractOgBrowser(browser, validatedUrl1), extractOgBrowser(browser, url2)]);
      } else {
        [d1, d2] = await Promise.all([
          extractSchemasBrowser(browser, validatedUrl1),
          extractSchemasBrowser(browser, url2),
        ]);
      }
    } finally {
      await browser.close();
    }
  }

  const countLabel = useOg ? `${Object.keys(d1).length} tag(s)` : `${(d1 as Schema[]).length} schema(s)`;
  const countLabel2 = useOg ? `${Object.keys(d2).length} tag(s)` : `${(d2 as Schema[]).length} schema(s)`;
  console.log(`${CYAN}URL1:${RESET} ${validatedUrl1} → ${countLabel}`);
  console.log(`${CYAN}URL2:${RESET} ${url2} → ${countLabel2}\n`);

  if (useOg) {
    compareOg(d1 as OgData, d2 as OgData);
  } else {
    compareJsonLd(d1 as Schema[], d2 as Schema[]);
  }

  if (vscodeDiff) {
    const prefix = useOg ? 'og' : 'schema';
    const content1 = useOg ? JSON.stringify(d1, null, 2) : formatSchemasForDiff(d1 as Schema[]);
    const content2 = useOg ? JSON.stringify(d2, null, 2) : formatSchemasForDiff(d2 as Schema[]);
    openVscodeDiff(content1, content2, prefix, validatedUrl1, url2);
  }
}
