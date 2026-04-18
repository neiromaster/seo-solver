import { escapeHtml } from '../../utils/text.js';

export type HtmlSection = {
  body: string;
  status: string;
  title: string;
};

export type HtmlTemplateData = {
  footer: string;
  header: string;
  sections: HtmlSection[];
  summary: string;
  title: string;
};

const STYLE = `
:root {
  --bg: #ffffff;
  --fg: #111827;
  --muted: #6b7280;
  --border: #d1d5db;
  --surface: #f9fafb;
  --error: #dc2626;
  --warning: #d97706;
  --info: #2563eb;
  --added: #15803d;
  --removed: #dc2626;
  --changed: #a16207;
  color-scheme: light dark;
}

@media (prefers-color-scheme: dark) {
  :root {
    --bg: #0f172a;
    --fg: #e5e7eb;
    --muted: #94a3b8;
    --border: #334155;
    --surface: #111827;
  }
}

body {
  margin: 0;
  font-family: Inter, ui-sans-serif, system-ui, sans-serif;
  color: var(--fg);
  background: var(--bg);
}

main {
  max-width: 1100px;
  padding: 24px;
  margin: 0 auto;
}

header, footer, section {
  padding: 16px;
  margin-bottom: 16px;
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: 12px;
}

.summary, .badges {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.badge {
  padding: 4px 10px;
  font-size: 14px;
  font-weight: 600;
  border: 1px solid var(--border);
  border-radius: 999px;
}

.error { color: var(--error); }
.warning { color: var(--warning); }
.info { color: var(--info); }
.added { color: var(--added); }
.removed { color: var(--removed); }
.changed { color: var(--changed); }

table {
  width: 100%;
  font-size: 14px;
  border-collapse: collapse;
}

th, td {
  padding: 10px;
  vertical-align: top;
  text-align: left;
  border-top: 1px solid var(--border);
}

code {
  font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
}

.muted {
  color: var(--muted);
}

details > summary {
  cursor: pointer;
}

.kind-badge {
  display: inline-block;
  padding: 1px 7px;
  font-size: 11px;
  font-weight: 600;
  white-space: nowrap;
  border-radius: 4px;
}

.kind-badge.changed { color: var(--changed); background: var(--surface); }
.kind-badge.added { color: var(--added); background: var(--surface); }
.kind-badge.removed { color: var(--removed); background: var(--surface); }

tr.diff-start td {
  border-top: 1px solid var(--border);
}

tr.diff-after td {
  border-top: 1px dashed var(--border);
}

.cell-before {
  color: var(--removed);
}

.cell-after {
  color: var(--added);
}

@media print {
  body {
    color: #000;
    background: #fff;
  }

  header, footer, section {
    border-color: #ccc;
    box-shadow: none;
  }
}
`;

export function renderHtml(data: HtmlTemplateData): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${escapeHtml(data.title)}</title>
  <style>${STYLE}</style>
</head>
<body>
  <main>
    <header>
      <h1>${escapeHtml(data.title)}</h1>
      ${data.header}
      <div class="summary">${data.summary}</div>
    </header>
    ${data.sections
      .map(
        (section) => `<section>
      <h2>${escapeHtml(section.title)} <span class="muted">${escapeHtml(section.status)}</span></h2>
      ${section.body}
    </section>`,
      )
      .join('\n')}
    <footer>${data.footer}</footer>
  </main>
</body>
</html>`;
}
