# BuildReport Schema

BuildReport captures the full result of a build.

## Structure

```ts
interface BuildReport {
  siteId: string;
  status: 'success' | 'failed' | 'partial';
  steps: BuildStep[];
  validation: ValidationResult;
  screenshots: string[];
  exportBundle?: string;
  errors?: ErrorLog[];
  healingCycles?: HealingCycle[];
  summary?: string;
  metadata: {
    startTime: string;
    endTime: string;
    duration: number;
    wpVersion: string;
    themeGenerated: string;
    pluginsInstalled: string[];
  };
}
```

```ts
interface BuildStep {
  id: string;
  status: 'pending' | 'in_progress' | 'success' | 'failed';
  startedAt?: string;
  finishedAt?: string;
  durationMs?: number;
  details?: Record<string, unknown>;
}
```

## Validation

- `validation.cli`: database, filesystem, and health checks
- `validation.browser`: page load data and console errors

## Errors

`errors` captures failures with timestamps and optional step IDs.

## Review

The visual review step (when enabled with `--review`) reports its cycle results inside the `steps[]` entry for `review`:

- `details.cycles[]` contains per-cycle counts of issues found and fixed.
- `details.totalIssuesFound` and `details.totalIssuesFixed` aggregate counts across cycles.
- `details.skipped` is set when review is disabled.

The human-readable markdown summary (if generated) is stored in `summary`.

## Step Details (Selected)

These fields are present in `steps[].details` for specific steps:

- `review`:
  - `cycles`: `{ cycle: number; issuesFound: number; issuesFixed: number }[]`
  - `totalIssuesFound`: number
  - `totalIssuesFixed`: number
  - `skipped`: boolean
  - `reason`: string (when skipped)
- `validate`:
  - `cli`: `{ databaseOk: boolean; filesystemOk: boolean; healthCheckOk: boolean }`
  - `browser`: `{ consoleErrors: BrowserConsoleError[]; networkErrors: BrowserNetworkError[] }`
- `export`:
  - `bundlePath`: string
  - `sizeBytes`: number
