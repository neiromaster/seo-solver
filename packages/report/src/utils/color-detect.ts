export function shouldUseColor(override?: boolean): boolean {
  if (override !== undefined) {
    return override;
  }

  if (process.env.NO_COLOR !== undefined) {
    return false;
  }

  if (process.env.FORCE_COLOR !== undefined) {
    return true;
  }

  return process.stdout.isTTY ?? false;
}
