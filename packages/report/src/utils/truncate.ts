function serializeValue(value: unknown): string {
  if (typeof value === 'string') {
    return JSON.stringify(value);
  }

  if (value === undefined) {
    return 'undefined';
  }

  if (typeof value === 'number' || typeof value === 'boolean' || value === null) {
    return String(value);
  }

  try {
    return JSON.stringify(value);
  } catch {
    return String(value);
  }
}

export function truncateValue(value: unknown, maxLength = 50): string {
  const normalized = serializeValue(value).replace(/\r?\n/g, '\\n');

  if (normalized.length <= maxLength) {
    return normalized;
  }

  if (maxLength <= 3) {
    return '.'.repeat(maxLength);
  }

  return `${normalized.slice(0, maxLength - 3)}...`;
}

export function formatFullValue(value: unknown): string {
  return serializeValue(value);
}
