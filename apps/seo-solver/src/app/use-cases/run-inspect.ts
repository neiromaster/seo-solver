import type { InspectRequest } from '#app/dto';
import { AppError, type CapabilityRegistry, type RenderResult } from '#kernel';

export type RunInspect = (request: InspectRequest) => Promise<RenderResult>;

export function createRunInspect(registry: CapabilityRegistry): RunInspect {
  return async (request) => {
    const fetcher = registry.fetchers.get(request.fetcherId);
    const bundle = registry.extractors.get(request.extractorId);
    const renderer = registry.renderers.get(request.rendererId);

    if (!fetcher) throw new AppError(`Unknown fetcher: ${request.fetcherId}`);
    if (!bundle) throw new AppError(`Unknown extractor: ${request.extractorId}`);
    if (!renderer) throw new AppError(`Unknown renderer: ${request.rendererId}`);

    const source = await fetcher.fetch({ url: request.url, fetcherId: request.fetcherId });
    const document = await bundle.extractor.extract(source);

    return renderer.render({
      mode: 'inspect',
      extractorId: request.extractorId,
      document,
    });
  };
}
