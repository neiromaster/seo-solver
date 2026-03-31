import type { Renderer, RenderResult } from '#kernel';

export class FakeRenderer implements Renderer<unknown> {
  readonly id = 'fake-renderer';

  async render(input: unknown): Promise<RenderResult> {
    return {
      kind: 'text',
      content: JSON.stringify(input),
      exitCode: 0,
    };
  }
}
