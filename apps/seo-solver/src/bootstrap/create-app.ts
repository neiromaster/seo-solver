import { createRunDiff, createRunInspect, createRunValidate } from '#app';
import { registerCapabilities } from '#bootstrap/register-capabilities';
import { createCapabilityRegistry } from '#kernel';

export function createRuntimeApp() {
  const registry = createCapabilityRegistry();
  registerCapabilities(registry);

  return {
    registry,
    runDiff: createRunDiff(registry),
    runValidate: createRunValidate(registry),
    runInspect: createRunInspect(registry),
  };
}
