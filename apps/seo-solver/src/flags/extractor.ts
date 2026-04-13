import { listTargets } from '@seo-solver/extract';
import type { TargetKey } from '@seo-solver/types/extract';
import { option, optional, string } from 'cmd-ts';
import { CLIError } from '../cli-support/error-handler';

const targetListDescription = listTargets()
  .map((entry) => entry.key)
  .join(',');
const knownTargets = new Set(listTargets().map((entry) => entry.key));

export const targetsFlag = option({
  long: 'targets',
  short: 'e',
  type: optional(string),
  description: `Comma-separated list of targets: ${targetListDescription} (default: package defaults)`,
});

export function parseTargets(raw: string | undefined): TargetKey[] | undefined {
  if (!raw) {
    return undefined;
  }

  const targets = raw
    .split(',')
    .map((entry) => entry.trim())
    .filter(Boolean)
    .map((entry) => entry as TargetKey);

  for (const target of targets) {
    if (!knownTargets.has(target)) {
      throw new CLIError(`Unknown target: ${target}`);
    }
  }

  return targets;
}
