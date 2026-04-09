import type { ReportFormat, Severity, Verbosity } from '@seo-solver/types';
import { CLIError } from './shared/error-handler.js';

export const supportedReportFormats = ['terminal', 'json', 'markdown', 'html'] as const;

export const supportedSeverities = ['error', 'warning', 'info'] as const;

export const supportedFetchers = ['native', 'playwright'] as const;

export type SupportedReportFormat = (typeof supportedReportFormats)[number];

export type SupportedExtractFormat = 'json';

export type SupportedListRulesFormat = 'terminal' | 'json';

export function isReportFormat(value: string): value is ReportFormat {
  return supportedReportFormats.includes(value as SupportedReportFormat);
}

export function isSeverity(value: string): value is Severity {
  return supportedSeverities.includes(value as Severity);
}

export function resolveReportFormat(value: string | undefined, fallback: ReportFormat): ReportFormat {
  if (!value) {
    return fallback;
  }

  if (!isReportFormat(value)) {
    throw new CLIError(`Unsupported format: ${value}. Expected one of: ${supportedReportFormats.join(', ')}`);
  }

  return value;
}

export function resolveExtractFormat(value: string | undefined): SupportedExtractFormat {
  const format = value ?? 'json';

  if (format !== 'json') {
    throw new CLIError(`Unsupported extract format: ${format}. Expected: json`);
  }

  return 'json';
}

export function resolveListRulesFormat(value: string | undefined): SupportedListRulesFormat {
  const format = value ?? 'terminal';

  if (format !== 'terminal' && format !== 'json') {
    throw new CLIError(`Unsupported list-rules format: ${format}. Expected: terminal or json`);
  }

  return format;
}

export function resolveSeverity(value: string | undefined, fallback: Severity): Severity {
  if (!value) {
    return fallback;
  }

  if (!isSeverity(value)) {
    throw new CLIError(`Unsupported severity: ${value}. Expected one of: ${supportedSeverities.join(', ')}`);
  }

  return value;
}

export function hasDiffs(diffs: readonly { diffs: readonly unknown[] }[]): boolean {
  return diffs.some((entry) => entry.diffs.length > 0);
}

export function resolveVerbosityLevel(verbose: boolean, quiet: boolean): Verbosity {
  if (quiet) {
    return 'quiet';
  }

  if (verbose) {
    return 'verbose';
  }

  return 'normal';
}
