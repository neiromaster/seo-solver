export type ExtractionWarning = {
  message: string;
  location?: string;
};

export type ExtractionEnvelope<T = unknown> = {
  type: string;
  source: string;
  data: T;
  raw?: string;
  warnings?: ExtractionWarning[];
};
