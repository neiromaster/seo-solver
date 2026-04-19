export const sourceConditions = ['@seo-solver/source'] as const;

export function withSourceConditions<T extends object>(config: T): T {
  const existingConditions = ((config as { resolve?: { conditions?: string[] } }).resolve?.conditions ??
    []) as string[];

  return {
    ...config,
    resolve: {
      ...(config as { resolve?: object }).resolve,
      conditions: [...new Set([...sourceConditions, ...existingConditions])],
    },
  } as T;
}
