import type { Reporter, ReporterConfig } from '@seo-solver/types/report';
import { createHtmlReporter } from '../formatters/html/html-reporter.js';
import { createJsonReporter } from '../formatters/json/json-reporter.js';
import { createMarkdownReporter } from '../formatters/markdown/markdown-reporter.js';
import { createTerminalReporter } from '../formatters/terminal/terminal-reporter.js';

export function createReporter(config: ReporterConfig = {}): Reporter {
  const format = config.format ?? 'terminal';

  if (format === 'terminal') {
    return createTerminalReporter(config);
  }

  if (format === 'json') {
    return createJsonReporter(config);
  }

  if (format === 'markdown') {
    return createMarkdownReporter(config);
  }

  if (format === 'html') {
    return createHtmlReporter(config);
  }

  throw new Error(`Unsupported report format: ${format}`);
}
