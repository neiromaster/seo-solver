import { array, multioption, string } from 'cmd-ts';

export const disableRulesFlag = multioption({
  long: 'disable-rules',
  type: array(string),
  description: 'Disable validation rules (repeatable). Supports wildcards like opengraph/*',
});

export const severityOverrideFlag = multioption({
  long: 'severity-override',
  type: array(string),
  description: 'Override rule severity: "opengraph/description-missing=error" (repeatable)',
});
