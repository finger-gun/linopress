export type ThemeMode = 'parent' | 'blank' | 'user-selected';

export type ContentTemplate = {
  id: string;
  data?: Record<string, unknown>;
};

export type BusinessInfo = {
  name: string;
  tagline?: string;
  description?: string;
  phone?: string;
  email?: string;
  address?: string;
  hours?: string;
};

export interface PageSpec {
  title: string;
  slug: string;
  content: string | ContentTemplate;
  template?: string;
  status?: 'publish' | 'draft' | 'private' | 'scheduled';
  parentSlug?: string;
}

export interface SiteSpec {
  prompt: string;
  siteId: string;
  themeMode: ThemeMode;
  styleSeed?: string;
  plugins?: string[];
  pages?: PageSpec[];
  language?: string;
  timezone?: string;
  permalinkStructure?: string;
  business?: BusinessInfo;
}

export interface SiteSpecExtractionResult {
  siteSpec: SiteSpec;
  warnings: string[];
  inferredDefaults: string[];
  confidence: number;
  ambiguities: string[];
}

export interface BuildStep {
  id: string;
  label: string;
  status: 'pending' | 'in_progress' | 'success' | 'failed';
  startedAt?: string;
  finishedAt?: string;
  details?: Record<string, unknown>;
}

export interface ErrorLog {
  message: string;
  stepId?: string;
  code?: string;
  timestamp: string;
  details?: Record<string, unknown>;
}

export interface HealingCycle {
  cycle: number;
  startedAt: string;
  finishedAt?: string;
  actions: Array<{ action: string; detail?: string }>;
  result: 'success' | 'partial' | 'failed';
}

export interface ValidationResult {
  cli: {
    databaseOk: boolean;
    filesystemOk: boolean;
    healthCheckOk: boolean;
  };
  browser: {
    pagesLoaded: string[];
    consoleErrors: Array<{ message: string; type?: string; line?: number }>;
    screenshotsCaptured: number;
  };
}

export interface UpdateRequest {
  siteId: string;
  prompt: string;
  baseSpecPath?: string;
  allowlistProfile?: 'default' | 'strict';
}

export interface BuildReport {
  siteId: string;
  status: 'success' | 'failed' | 'partial';
  mode: 'build' | 'update';
  steps: BuildStep[];
  validation: ValidationResult;
  screenshots: string[];
  exportBundle?: string;
  errors?: ErrorLog[];
  healingCycles?: HealingCycle[];
  summary?: string;
  update?: {
    prompt: string;
    baseSpecPath?: string;
    allowlistProfile?: 'default' | 'strict';
  };
  metadata: {
    startTime: string;
    endTime: string;
    duration: number;
    wpVersion: string;
    themeGenerated: string;
    pluginsInstalled: string[];
  };
}

export interface Manifest {
  version: string;
  siteId: string;
  created: string;
  wordpressVersion: string;
  phpVersion: string;
  plugins: string[];
  theme: {
    name: string;
    parent?: string;
    mode: ThemeMode;
  };
  buildReport: BuildReport;
}
