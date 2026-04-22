export function appendObjectPath(prefix: string, key: string): string {
  return prefix.length === 0 ? key : `${prefix}.${key}`;
}

export function appendArrayPath(prefix: string, index: number): string {
  return `${prefix}[${index}]`;
}
