import type { DiffRequest } from '#app/dto';
import { AppError, type CapabilityRegistry, type RenderResult } from '#kernel';

export type RunDiff = (request: DiffRequest) => Promise<RenderResult>;

export function createRunDiff(registry: CapabilityRegistry): RunDiff {
  return async (request) => {
    const fetcher = registry.fetchers.get(request.fetcherId);
    const bundle = registry.extractors.get(request.extractorId);
    const renderer = registry.renderers.get(request.rendererId);

    if (!fetcher) throw new AppError(`Unknown fetcher: ${request.fetcherId}`);
    if (!bundle) throw new AppError(`Unknown extractor: ${request.extractorId}`);
    if (!renderer) throw new AppError(`Unknown renderer: ${request.rendererId}`);
    if (!bundle.comparator) throw new AppError(`Extractor has no comparator: ${request.extractorId}`);

    const leftSource = await fetcher.fetch({ url: request.leftUrl, fetcherId: request.fetcherId });
    const rightSource = await fetcher.fetch({ url: request.rightUrl, fetcherId: request.fetcherId });
    const leftDocument = await bundle.extractor.extract(leftSource);
    const rightDocument = await bundle.extractor.extract(rightSource);
    const diff = await bundle.comparator.compare(leftDocument, rightDocument);

    return renderer.render({
      mode: 'diff',
      extractorId: request.extractorId,
      leftDocument,
      rightDocument,
      diff,
    });
  };
}
