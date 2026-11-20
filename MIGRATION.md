# Migration Guide: upgrading to v0.9.0

This guide is for people who already run the dashboard (Docker) and are upgrading to v0.9.0 from v0.8.0 or earlier. It takes about 15 minutes. For a fresh install, follow [INSTALL.md](./INSTALL.md) instead.

## What changed

1. **Credentials are set in the environment only.** Passwords and the Home Assistant connection are no longer read from, served from, or written to `dashboard-config.json`.
2. **The server needs a sign-in password, and the Home Assistant URL and token, to start.** Without them it exits with a message that names what is missing.
3. **Everything is served by the API.** The configuration, the local-data file and uploaded images are only available through `/api/...`. Nothing under `/data/` is served any more.
4. **The data folder moved** from `public/data` to `data` (and to `/app/data` inside the container), outside `public/` and outside nginx's web root.
5. **Docker container changes.** It runs as the unprivileged user `node` (uid 1000) and listens on ports 8080 and 8443 instead of 80 and 443.

The reasons are in the [release notes](./RELEASE.md).

## Before you start

- Make a copy of your data folder (`public/data`: your `dashboard-config.json`, `backups/`, `images/`) somewhere safe. You only need it if you roll back (see [Rolling back](#rolling-back)).
- Stop the container: `docker compose down`.

## Step 1: Move your data folder

The data folder is now `data` in the project root (it used to be `public/data`). Get the new version of the project first (for example `git pull`); that creates `data/` with the example files. Then copy your own files over without overwriting anything:

```bash
cp -an public/data/. data/
```

If you installed from a release archive instead of git, copy the contents of your old `public/data` folder into the new `data` folder in the same way.

Check that `data/` now holds your `dashboard-config.json`, `backups/` and `images/`. Keep `public/data` until you have finished Step 8, then delete it: it still contains your old credentials.

If you start the container yourself instead of with `docker-compose.yml`, mount the folder at `/app/data` (for example `-v "$(pwd)/data:/app/data"`).

## Step 2: Put the credentials in `.env`

Create a `.env` file next to `docker-compose.yml`. It is git-ignored; never commit it. Start from the template:

```bash
cp .env.example .env
```

Fill in these values:

| Variable          | Required                                   | What to put there                                                                                                                                                           |
| ----------------- | ------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `VIEWER_PASSWORD` | **yes**                                    | The password everyone uses to sign in. If you used `EDITOR_PASSWORD` as your only password before, move that value here.                                                    |
| `HA_URL`          | **yes** (unless `app.localMode` is `true`) | The URL of your Home Assistant, for example `https://ha.home.local:8123`. It used to be `haConfig.haUrl` in `dashboard-config.json`.                                        |
| `HA_ACCESS_TOKEN` | **yes** (unless `app.localMode` is `true`) | A long-lived access token. Create a new one in Home Assistant under your profile, then Security, then Long-lived access tokens. It used to be `haConfig.accessToken`.       |
| `EDITOR_PASSWORD` | no                                         | A _different_ password for editing. If set, signing in with `VIEWER_PASSWORD` is read-only and only this password opens the editor. If empty, anyone who signs in can edit. |
| `SESSION_DAYS`    | no (default `30`, maximum `365`)           | How many days a sign-in lasts.                                                                                                                                              |

Notes:

- A password can also be a hash instead of plain text. Run `node docker/hash-password.js 'your password'` and use the output as the value.
- How the variables reach the container is up to you. The supplied `docker-compose.yml` reads them from `.env`. With `docker run`, use `-e` or `--env-file`.
- Anyone who signs in, including a read-only viewer, receives the Home Assistant URL and token, because the browser talks to Home Assistant directly. Only share the sign-in password with people you would trust with device control.

## Step 3: Remove credentials from `dashboard-config.json`

Open `data/dashboard-config.json` and delete:

- `app.password`
- `app.viewerPassword` (if you had it)
- the whole `haConfig` block

If you leave them, nothing breaks: the server ignores them, never serves them, and logs a warning at startup. The next save from the editor removes them from the file.

## Step 4: Rotate what was stored in files

Old passwords and the old Home Assistant token may still exist in:

- the old `dashboard-config.json` (until you save once or remove them);
- every file in `data/backups/` (the server keeps up to 30 copies of the config);
- any copy of the config file you made, including `public/data` from Step 1, or any image or archive of the old setup.

To close that off:

1. Delete the old files in `data/backups/` and any spare copies of the config.
2. In Home Assistant, create a new long-lived token for `HA_ACCESS_TOKEN` and **revoke the old one**.
3. Choose new passwords for `VIEWER_PASSWORD` and `EDITOR_PASSWORD`; do not reuse the old ones.

## Step 5: Update the Docker setup

If you use the supplied `docker-compose.yml`, update it from the repository and skip to the rebuild at the end of this step. If you wrote your own compose file or `docker run` command, make these changes:

- **Volume:** mount `./data` at `/app/data` (it used to be `./public/data` at `/usr/share/nginx/html/data`).
- **Ports:** the container now listens on `8080` (HTTP) and `8443` (HTTPS). The default host ports in `docker-compose.yml` are unchanged. If you mapped something like `80:80` and `443:443`, change it to `80:8080` and `443:8443`.
- **Environment:** pass `VIEWER_PASSWORD`, `HA_URL` and `HA_ACCESS_TOKEN` (and optionally `EDITOR_PASSWORD`, `SESSION_DAYS`) to the container.
- **File permissions:** the container runs as uid 1000. On Linux, make the data folder writable by that user and the TLS key readable by it:

  ```bash
  sudo chown -R 1000:1000 data
  sudo chown 1000 docker/ssl/server.key
  ```

  Docker Desktop on macOS and Windows normally needs no change.

Then rebuild and restart:

```bash
docker compose up -d --build
```

## Step 6: Fix image URLs

Image URLs that start with `/data/images/` are not served any more. Images are now at `/api/images/<name>`. Image paths without a leading slash (for example `photo.jpg`) are not resolved either.

To update the config file in one go, keeping a backup copy (the redirect rewrites the file in place, so its owner and permissions stay as they are):

```bash
cp data/dashboard-config.json data/dashboard-config.before-migration.json
sed 's#/data/images/#/api/images/#g' data/dashboard-config.before-migration.json > data/dashboard-config.json
```

Delete `dashboard-config.before-migration.json` once everything works. It is git-ignored, but it still contains whatever the old file contained.

Alternatively, open the editor and re-select each image. Cards whose image cannot be resolved show "No image selected".

## Step 7: Static hosting without the backend

Serving the app as plain static files without the Node.js backend is no longer supported; the app needs `/api/...`. If you used that setup, run the Docker container (or `node docker/app-server.js` behind nginx) instead.

The public demo is not affected: it is built with `VITE_DEMO=true`, which embeds sample data instead of fetching files. If you publish your own demo from a fork, build it with `VITE_DEMO=true`.

## Step 8: Check that it works

1. `docker compose ps` shows the container as healthy, and `docker compose logs` shows no `[ERROR]` lines.
2. Open `https://<your-host>:8443`. You see the sign-in dialog. Everyone is signed out once after the upgrade.
3. Sign in with `VIEWER_PASSWORD`. The dashboard shows **Connected**.
4. If you set `EDITOR_PASSWORD`: the editor button asks for it, and `VIEWER_PASSWORD` is rejected there.
5. Open a card with an image. It loads from `/api/images/...`.
6. Visit `https://<your-host>:8443/data/dashboard-config.json`. You get a 404, which is correct.
7. Delete the old `public/data` folder (and `data/dashboard-config.before-migration.json`).

Expected log lines on a healthy start: `Data directory: /app/data`, `Authentication: Enabled`, and, if your config file still has old credentials, one `[WARN] ... still contains app.password, haConfig ...` line.

## Troubleshooting

| What you see                                                                | What it means and what to do                                                                                                     |
| --------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| `[ERROR] No sign-in password configured. Set the VIEWER_PASSWORD ...`       | `VIEWER_PASSWORD` is missing or empty. `EDITOR_PASSWORD` alone is not enough. Set it and restart.                                |
| `[ERROR] Missing required environment variable(s): HA_URL, HA_ACCESS_TOKEN` | Set the variables listed. They are not needed if `app.localMode` is `true`.                                                      |
| `[ERROR] HA_URL must be an http:// or https:// URL.`                        | Use a full URL such as `https://ha.home.local:8123`.                                                                             |
| `[ERROR] The viewer password must differ from the editor password.`         | Use two different passwords, or remove `EDITOR_PASSWORD`.                                                                        |
| `[ERROR] Failed to load config: Config file not found`                      | The container cannot see `dashboard-config.json`. Mount `./data` at `/app/data` and make sure the file is in it (Steps 1 and 5). |
| `[WARN] ... still contains app.password, haConfig`                          | Harmless: the server ignores these keys. Remove them from `dashboard-config.json` (Step 3).                                      |
| `[WARN] ... password is shorter than 8 characters`                          | Only a warning. Use a longer password.                                                                                           |
| The container keeps restarting                                              | Run `docker compose logs`; the last `[ERROR]` line tells you which variable or file is missing.                                  |
| 502 in the browser, or a blank page                                         | The container is down or restarting. See the line above.                                                                         |
| Container cannot write `data`, or nginx cannot read the TLS key             | File permissions: see Step 5 (uid 1000).                                                                                         |
| Sign-in works but the editor is missing or refuses to save                  | You signed in with `VIEWER_PASSWORD` while `EDITOR_PASSWORD` is set. Use the editor button and enter the editor password.        |
| Images are empty ("No image selected")                                      | The config still has `/data/images/...` URLs. See Step 6.                                                                        |
| Everyone was signed out                                                     | Expected once after the upgrade, and again whenever you change a password. Sessions otherwise survive restarts.                  |
| Host port 80 or 443 no longer works                                         | The container listens on 8080 and 8443. Map `80:8080` and `443:8443` (Step 5).                                                   |

## Rolling back

1. Check out the previous version and rebuild: `git checkout v0.8.0 && docker compose up -d --build`.
2. Put your copy of the data folder back at `public/data` (the old version reads it from there), or at least re-add `app.password` and `haConfig` to `dashboard-config.json`. The old version reads its credentials from that file, and the new version removes them from it when you save.
3. If you rotated your secrets (Step 4), use the new values when you add them back.
