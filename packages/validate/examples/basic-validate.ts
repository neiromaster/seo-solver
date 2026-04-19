import type { ExtractedPage } from '@seo-solver/types/extract';
import { validatePage } from '@seo-solver/validate';

declare const page: ExtractedPage;

const report = await validatePage(page);
console.log(report);
