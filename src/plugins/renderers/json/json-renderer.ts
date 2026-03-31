import type { Renderer, RenderPayload, RenderResult } from '#kernel';

export class JsonRenderer implements Renderer<RenderPayload> {
  readonly id = 'json';

  async render(input: RenderPayload): Promise<RenderResult> {
    return {
      kind: 'text',
      content: JSON.stringify(input, null, 2),
      exitCode: resolveExitCode(input),
    };
  }
}

function resolveExitCode(input: RenderPayload): number {
  if (input.mode === 'validate') {
    return input.reports.every((report) => report.ok) ? 0 : 1;
  }

  return 0;
}
