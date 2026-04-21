export type RobotsTxtGroup = {
  userAgents: string[];
  allow: string[];
  disallow: string[];
};

export type RobotsTxtData = {
  groups: RobotsTxtGroup[];
  sitemaps: string[];
  crawlDelay: number | null;
};
