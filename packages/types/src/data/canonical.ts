export type CanonicalHrefLang = {
  lang: string;
  href: string;
};

export type CanonicalData = {
  canonical: string | null;
  hreflang: CanonicalHrefLang[];
};
