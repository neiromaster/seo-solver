import type { CapabilityId, RenderResult } from '#kernel/models';

export type Renderer<TInput = unknown> = {
  readonly id: CapabilityId;
  render(input: TInput): Promise<RenderResult>;
};
