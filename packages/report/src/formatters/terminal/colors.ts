import ansis from 'ansis';

type Colorizer = (value: string) => string;

export type TerminalColors = {
  added: Colorizer;
  bold: Colorizer;
  changed: Colorizer;
  dim: Colorizer;
  error: Colorizer;
  info: Colorizer;
  pass: Colorizer;
  removed: Colorizer;
  warning: Colorizer;
};

const IDENTITY: Colorizer = (value) => value;

export function createTerminalColors(enabled: boolean): TerminalColors {
  if (!enabled) {
    return {
      added: IDENTITY,
      bold: IDENTITY,
      changed: IDENTITY,
      dim: IDENTITY,
      error: IDENTITY,
      info: IDENTITY,
      pass: IDENTITY,
      removed: IDENTITY,
      warning: IDENTITY,
    };
  }

  return {
    added: ansis.green,
    bold: ansis.bold,
    changed: ansis.yellow,
    dim: ansis.dim,
    error: ansis.red,
    info: ansis.blue,
    pass: ansis.green,
    removed: ansis.red,
    warning: ansis.yellow,
  };
}
