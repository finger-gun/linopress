# Docker Setup and Troubleshooting

## Requirements

- Docker Desktop running
- Port access for WordPress (default 8080)

## Common Commands

- Provision a stack: `linopress provision <site-id> --port 8080`
- Start a stack: `linopress start <site-id>`
- Stop a stack: `linopress stop <site-id>`
- Destroy a stack: `linopress destroy <site-id>`

## Troubleshooting

- **Port already in use**: choose a different `--port` value.
- **Docker daemon not running**: start Docker Desktop and retry.
- **Browser tests failing**: re-provision with `--browser` or use `--no-browser` during build.
- **Database not ready**: wait a few seconds after provision; retry build.
