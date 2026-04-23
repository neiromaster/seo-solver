import { createReporter } from '@seo-solver/report/advanced';
import type { Reporter, ReporterConfig } from '@seo-solver/types/report';
import { resolveReportFormat, resolveSeverity, resolveVerbosityLevel } from '../types.js';

export type ReporterFlags = {
  format: string | undefined;
  verbose: boolean;
  quiet: boolean;
  minSeverity?: string | undefined;
};

export function buildReporter(flags: ReporterFlags): Reporter {
  const config: ReporterConfig = {
    format: resolveReportFormat(flags.format, 'terminal'),
    verbosity: resolveVerbosityLevel(flags.verbose, flags.quiet),
    minSeverity: resolveSeverity(flags.minSeverity, 'info'),
  };

  return createReporter(config);
}
