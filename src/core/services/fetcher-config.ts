export type FetcherConfig =
  | { type: 'basic' }
  | { type: 'curl' }
  | { type: 'chrome'; mode: 'launch' }
  | { type: 'chrome'; mode: 'connect'; target: string };
