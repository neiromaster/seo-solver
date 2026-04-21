export function isAbsoluteUrl(url: string): boolean {
  return /^https?:\/\//i.test(url);
}

export function isValidUrl(url: string): boolean {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}
