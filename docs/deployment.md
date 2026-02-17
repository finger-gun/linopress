# Deploying Exported Sites

Export bundles are tar.gz files with:

```text
site-<siteId>_<timestamp>.tar.gz
  wp-content/
  database.sql
  manifest.json
```

## Deployment Steps

1. Extract the bundle to your WordPress host.
2. Copy `wp-content/` into the target WordPress installation.
3. Import `database.sql` into your database.
4. Run a search-replace to update the base URL from `http://localhost:8080` to your live domain.
5. Verify the site and update permalinks if needed.

## Notes

- `manifest.json` contains build metadata and plugin/theme information.
- If secrets are detected during export, review the SQL before deployment.
