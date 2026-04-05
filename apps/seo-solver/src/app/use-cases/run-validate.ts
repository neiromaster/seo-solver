import type { ValidateRequest } from '#app/dto';
import { AppError, type CapabilityRegistry, type RenderResult, type ValidationReport } from '#kernel';

export type RunValidate = (request: ValidateRequest) => Promise<RenderResult>;

export function createRunValidate(registry: CapabilityRegistry): RunValidate {
  return async (request) => {
    const fetcher = registry.fetchers.get(request.fetcherId);
    const bundle = registry.extractors.get(request.extractorId);
    const renderer = registry.renderers.get(request.rendererId);

    if (!fetcher) throw new AppError(`Unknown fetcher: ${request.fetcherId}`);
    if (!bundle) throw new AppError(`Unknown extractor: ${request.extractorId}`);
    if (!renderer) throw new AppError(`Unknown renderer: ${request.rendererId}`);

    const source = await fetcher.fetch({ url: request.url, fetcherId: request.fetcherId });
    const document = await bundle.extractor.extract(source);

    const reports: ValidationReport[] = [];
    for (const validator of bundle.validators) {
      reports.push(await validator.validate(document));
    }

    return renderer.render({
      mode: 'validate',
      extractorId: request.extractorId,
      document,
      reports,
    });
  };
}
