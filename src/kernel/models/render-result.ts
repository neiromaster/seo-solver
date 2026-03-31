export type RenderResult =
  | {
      kind: 'text';
      content: string;
      exitCode?: number;
    }
  | {
      kind: 'file';
      path: string;
      exitCode?: number;
    }
  | {
      kind: 'files';
      paths: string[];
      viewerHint?: 'open' | 'diff';
      exitCode?: number;
    };
