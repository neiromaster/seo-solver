import { option, optional, string } from 'cmd-ts';

export const editorFlag = option({
  long: 'editor',
  type: optional(string),
  description: 'Open generated artifacts in a supported editor',
});
