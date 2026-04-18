export type ExtractionWarning = {
  message: string;
  location?: string | undefined;
};

export type ExtractionEnvelope<T = unknown> = {
  type: string;
  source: string;
  data: T;
  raw?: string | undefined;
  warnings?: ExtractionWarning[] | undefined;
};
