import { comparePages } from '@seo-solver/compare';
import type { ExtractedPage } from '@seo-solver/types/extract';

declare const leftPage: ExtractedPage;
declare const rightPage: ExtractedPage;

const report = comparePages(leftPage, rightPage);
console.log(report);
