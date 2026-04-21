import type { ExtractedDataByTarget, ExtractedPage, TargetKey } from '@seo-solver/types/extract';

export function getTargetData<Target extends TargetKey>(
  page: ExtractedPage,
  target: Target,
): ExtractedDataByTarget[Target] | null {
  return page.data[target] ?? null;
}

export function getTargetStatus(page: ExtractedPage, target: TargetKey): 'present' | 'missing' | undefined {
  return page.targetStatus[target];
}

export function hasTargetData(page: ExtractedPage, target: TargetKey): boolean {
  return getTargetStatus(page, target) === 'present' && getTargetData(page, target) !== null;
}
