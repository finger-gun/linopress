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

## Validation

- `validation.cli`: database, filesystem, and health checks
- `validation.browser`: page load data and console errors

## Errors

`errors` captures failures with timestamps and optional step IDs.
