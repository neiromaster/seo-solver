export function normalizeWhitespace(value: string): string {
  return value.replace(/\s+/g, ' ').trim();
}

export function stripBom(value: string): string {
  return value.replace(/^\uFEFF/, '');
}

export function trimTrailingInlineComment(value: string): string {
  const commentIndex = value.search(/\s+#/);
  if (commentIndex === -1) {
    return value.trim();
  }

  return value.slice(0, commentIndex).trim();
}
