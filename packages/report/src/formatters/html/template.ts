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
  color-scheme: light dark;
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
  background: var(--bg);
  color: var(--fg);
}

main {
  max-width: 1100px;
  margin: 0 auto;
  padding: 24px;
}

header, footer, section {
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: 12px;
  padding: 16px;
  margin-bottom: 16px;
}

.summary, .badges {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.badge {
  border-radius: 999px;
  padding: 4px 10px;
  font-size: 14px;
  font-weight: 600;
  border: 1px solid var(--border);
}

.error { color: var(--error); }
.warning { color: var(--warning); }
.info { color: var(--info); }
.added { color: var(--added); }
.removed { color: var(--removed); }
.changed { color: var(--changed); }

table {
  width: 100%;
  border-collapse: collapse;
  font-size: 14px;
}

th, td {
  border-top: 1px solid var(--border);
  padding: 10px;
  text-align: left;
  vertical-align: top;
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

@media print {
  body {
    background: #fff;
    color: #000;
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
