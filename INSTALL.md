# Installation & Deployment Guide

This guide covers deploying the visual dashboard designer on a trusted home LAN. It provides an alternative dashboard UI, not a replacement for Home Assistant: HA continues to provide integrations, entities, automations, and service execution.

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [SSL Certificate Setup](#ssl-certificate-setup)
3. [Docker Deployment](#docker-deployment)
4. [Development Setup](#development-setup)
5. [Troubleshooting](#troubleshooting)

## Prerequisites

### For Docker Deployment

- Docker installed (version 20.10+)
- Docker Compose installed (version 1.29+)
- A Home Assistant instance running with network access
- A long-lived access token from Home Assistant (Settings → Developer Tools → Long-Lived Access Tokens)
- CORS enabled on Home Assistant (see [Home Assistant CORS Configuration](#home-assistant-cors-configuration))

### For Development

- Node.js 18+ and npm
- A Home Assistant instance (optional for local testing)

## Home Assistant CORS Configuration

For the dashboard to communicate with Home Assistant from a browser, CORS (Cross-Origin Resource Sharing) must be enabled.

### Enable CORS in Home Assistant

1. Edit your Home Assistant `configuration.yaml`:

   ```yaml
   http:
     cors_allowed_origins:
       - https://your-dashboard-domain:8443
       - https://your-dashboard-ip:8443
       # Add additional origins as needed
   ```

2. Restart Home Assistant for changes to take effect:
   - Go to **Settings** → **System** → **Restart**
   - Or use the `homeassistant.restart` service

3. Verify CORS is working by checking the browser console for any CORS-related errors when accessing the dashboard

**Note**: Replace `your-dashboard-domain:8443` and `your-dashboard-ip:8443` with the actual domain/IP and port where your dashboard is accessible. Avoid wildcard origins; allow only the dashboard origins you use.

## SSL Certificate Setup

The dashboard uses SSL/TLS for secure connections. You can either use self-signed certificates (for local LAN) or your own certificates. This is due to a requirements from the browsers to be able to access the home assistant server.

### Option 1: Generate Self-Signed Certificates (Recommended for Home LAN)

We provide a script to generate self-signed certificates:

```bash
cd docker/ssl
bash ./generate-certs.sh
```

This creates:

- `server.crt` — Server SSL certificate (valid for 365 days)
- `server.key` — Server private key
- `ca.crt` — CA certificate for client installation

The script prompts for certificate details:

- Country (C)
- State (ST)
- Locality (L)
- Organization (O)
- Common Name (CN) — should match your domain (e.g., `dashboard.home.local` or `ha.home.local`)

**Example certificate generation:**

```bash
$ cd docker/ssl
$ bash ./generate-certs.sh

Generating self-signed SSL certificate...
You are about to be asked to enter information that will be incorporated
into your certificate request.

What is your two-letter country code? [US]: US
State or Province? [State]: California
City? [City]: Home
Organization name? [Organization]: Homelab
Common Name (domain)? [domain.local]: ha.home.local

Certificate generated successfully!
- Server certificate: server.crt
- Private key: server.key
- CA certificate: ca.crt
```

### Option 2: Use Existing Certificates

Place your existing certificate files in `docker/ssl/`:

```bash
cp /path/to/your/certificate.crt docker/ssl/server.crt
cp /path/to/your/key.key docker/ssl/server.key
cp /path/to/your/ca.crt docker/ssl/ca.crt
```

**Important**: The nginx server expects:

- `server.crt` — Public certificate
- `server.key` — Private key
- Both files are mounted from the `docker/ssl/` volume

### Manual Certificate Generation with OpenSSL

If you prefer to generate certificates manually:

```bash
cd docker/ssl

# Generate private key and certificate (valid for 365 days)
openssl req -x509 -newkey rsa:4096 \
  -keyout server.key \
  -out server.crt \
  -days 365 \
  -nodes \
  -subj "/C=US/ST=State/L=City/O=Organization/CN=your-domain.local"

# Copy the certificate as CA for client distribution
cp server.crt ca.crt
```

## Docker Deployment

### Quick Start

1. **Generate or prepare SSL certificates** (see [SSL Certificate Setup](#ssl-certificate-setup))

2. **Create your private `.env`** (it is git-ignored; never commit it) and fill in the required variables:

   ```bash
   cp .env.example .env
   ```

   Three variables are **required**; the server refuses to start without them:
   - `VIEWER_PASSWORD`: the sign-in password (a long, unique password)
   - `HA_URL`: the URL of your Home Assistant, for example `https://ha.home.local:8123`
   - `HA_ACCESS_TOKEN`: a long-lived access token (HA profile > Security)

   Optionally set a different `EDITOR_PASSWORD` so that only people who know it can edit. See _Environment Variables_ below for details.

3. **Configure the dashboard** by editing `data/dashboard-config.json`:

   ```json
   {
     "app": {
       "title": "My Home Dashboard",
       "developerMode": false,
       "localMode": false
     },
     "views": [
       {
         "name": "overview",
         "label": "Overview",
         "icon": "mdi mdi-view-dashboard",
         "entities": [
           { "entity": "light.living_room" },
           { "entity": "switch.kitchen_lights" },
           { "entity": "sensor.temperature_living_room" }
         ]
       }
     ]
   }
   ```

   This file holds the dashboard layout only. **No credentials belong in it**: passwords and the Home Assistant connection come from the environment (step 2), are never read from this file, and are never written to it. If an old file still contains `app.password`, `app.viewerPassword` or `haConfig`, the server ignores them and logs a warning; remove them.

   Docker mounts this file as server data. Nginx blocks direct HTTP access; the app reads it after sign-in. This initial file defines starter views; use the visual editor for ongoing dashboard design. Do not put `VIEWER_PASSWORD` or `EDITOR_PASSWORD` in a Vite `VITE_*` variable.

4. **Start the container**:

   ```bash
   docker-compose up -d
   ```

5. **Access the dashboard**:
   - Navigate to `https://localhost:8443` (if running locally)
   - Or use your configured domain with the port mapped in `docker-compose.yml`

   If the dashboard has no cards yet, the editor shows a getting-started guide with shortcuts to connect to Home Assistant, create a view, and browse entities or built-in cards.

### Docker Compose Configuration

The provided `docker-compose.yml` includes:

```yaml
version: "3.8"

services:
  hassio-dashboard:
    build:
      context: .
      dockerfile: ./docker/Dockerfile
    ports:
      - "8080:8080" # HTTP (redirects to HTTPS)
      - "8443:8443" # HTTPS
    volumes:
      - ./data:/app/data:rw
      - ./docker/ssl:/etc/nginx/ssl:ro
    restart: unless-stopped
```

**Volume Mounts**:

- `./data` → Contains `dashboard-config.json` and other data files
- `./docker/ssl` → Contains SSL certificates (`server.crt`, `server.key`)

The container runs as the unprivileged `node` user (uid 1000), so `./data` must be writable by uid 1000 and `server.key` readable by it (e.g. `chown 1000 docker/ssl/server.key`). Only `/data/images/` is served publicly; every other file in the data directory is private.

**Port Mapping**:

The container listens on unprivileged ports 8080 (HTTP, redirects to HTTPS) and 8443 (HTTPS). To use standard host ports, change only the host side:

```yaml
ports:
  - "80:8080" # HTTP
  - "443:8443" # HTTPS
```

The server never runs without a sign-in password, in any mode (the config response contains the Home Assistant token). To store a hash instead of plain text, run `node docker/hash-password.js '<password>'` and use the output as `VIEWER_PASSWORD` or `EDITOR_PASSWORD`.

> **Upgrading from v0.8.0 or earlier?** Follow the [migration guide](./MIGRATION.md) first: credentials moved to environment variables and the container ports changed.

### Environment Variables

All credentials come from the environment. They are never read from, served from, or written to `dashboard-config.json`.

| Variable          | Required                    | Purpose                                                                                |
| ----------------- | --------------------------- | -------------------------------------------------------------------------------------- |
| `VIEWER_PASSWORD` | **yes**                     | Sign-in password. `EDITOR_PASSWORD` alone is not enough.                               |
| `HA_URL`          | **yes**, unless `localMode` | `http(s)://` URL of your Home Assistant.                                               |
| `HA_ACCESS_TOKEN` | **yes**, unless `localMode` | Long-lived Home Assistant access token. Not the same thing as the dashboard passwords. |
| `EDITOR_PASSWORD` | no                          | Password for editing (see below). Must differ from `VIEWER_PASSWORD`.                  |
| `SESSION_DAYS`    | no (default `30`)           | How many days a sign-in lasts, 1-365.                                                  |

`HA_URL` and `HA_ACCESS_TOKEN` are not needed when `app.localMode` is `true` in `dashboard-config.json` (local-data mode never talks to Home Assistant).

When `EDITOR_PASSWORD` is set, signing in with `VIEWER_PASSWORD` is read-only: the person can open the dashboard and control devices, but cannot use the editor, save or restore the configuration, or upload and delete images (the server enforces this). To edit, they enter the editor password from the editor button. When `EDITOR_PASSWORD` is not set, anyone who signs in can edit. The two passwords may be plain text or hashes from `node docker/hash-password.js '<password>'`.

**Sign-in lifetime:** `SESSION_DAYS` (default `30`, maximum `365`) sets how many days a sign-in, and its cookie, lasts. After that the user signs in again. Sessions survive server restarts and container updates; changing a password signs everyone out. The password itself is never stored on the device.

How the values reach the environment is up to you: a `.env` file next to `docker-compose.yml` (keep it out of git and `chmod 600` it), `docker compose --env-file`, `docker run -e`, or whatever secret mechanism your platform provides. This project only reads the variables.

A signed-in user, including a read-only viewer, receives the Home Assistant URL and token (the browser connects to Home Assistant directly), so only share the sign-in password with people you would trust with device control. Vite variables are embedded in the built frontend, so do not use `VITE_HA_TOKEN` for secrets.

The browser keeps a last-known dashboard configuration so it can open away from the LAN. The HA URL/token are stored separately from that snapshot. Away from the server, the cached dashboard opens read-only; live entity updates and controls also require the device to reach Home Assistant.

In the editor, undo/redo handles recent design changes, **Discard** returns to the last saved configuration, and **Saved versions** restores an earlier server backup.

### Viewing Logs

```bash
# View container logs
docker-compose logs -f hassio-dashboard

# View only recent logs
docker-compose logs --tail=50 hassio-dashboard
```

### Stopping the Container

```bash
docker-compose down
```

## Development Setup

### Local Development Server

```bash
# Install dependencies
npm install

# Start development server with hot reload
npm run dev
```

The app runs at `http://localhost:5173` with automatic reloading on code changes.

### Building for Production

```bash
# Build the production bundle
npm run build

# The output goes to the dist/ directory
```

### Local Testing Mode (Offline)

For development without a live Home Assistant connection:

1. Edit `data/dashboard-config.json`:

   ```json
   {
     "app": {
       "localMode": true,
       "developerMode": true
     }
   }
   ```

2. Save your Home Assistant data:
   - Connect to your live Home Assistant instance
   - Click the **Save** button (💾) in the navbar
   - This exports current entity states to `data/local-data.json`

3. Restart the dev server:

   ```bash
   npm run dev
   ```

The app now loads the data from `local-data.json` in the data directory (served by the API at `/api/data/local`) instead of connecting to Home Assistant. Service calls (toggling lights, etc.) are disabled in local mode. This is a development/demo fixture mode, separate from the read-only cached dashboard used when the server is temporarily unreachable.

## Certificate Installation on Client Devices

**⚠️ IMPORTANT**: For PWA installations and secure browser access to work with self-signed certificates, the CA certificate **must be installed and marked as trusted** on every device that will access the dashboard. Without this step:

- Browsers will show security warnings and may block access
- PWA installations will fail
- API calls to Home Assistant may be blocked by the browser

The CA certificate (`ca.crt`) is generated during the SSL certificate setup and needs to be distributed to all client devices.

### macOS

1. **Download the certificate**:
   - Open a web browser and navigate to `https://your-dashboard-domain:8443/ca.crt`
   - Save the file to your Downloads folder

2. **Install and Trust the Certificate**:
   - Open **Keychain Access** (Applications → Utilities → Keychain Access)
   - Drag and drop the downloaded `ca.crt` file into Keychain Access
   - In the pop-up dialog, click **Add**
   - Find the certificate in the Keychain (search for your domain name, e.g., "ha.home.local")
   - Double-click the certificate to open it
   - Expand the **Trust** section
   - Change "When using this certificate" dropdown to **Always Trust**
   - Close the window and enter your macOS password when prompted

3. **Verify Installation**:
   - Open a browser and navigate to your dashboard
   - You should no longer see a certificate warning

### iOS (iPhone/iPad)

1. **Download the certificate**:
   - Open Safari on your iOS device
   - Navigate to `https://your-dashboard-domain:8443/ca.crt`
   - Tap the downloaded file when prompted
   - Select **Install**
   - Enter your passcode when requested

2. **Trust the Certificate**:
   - Go to **Settings** → **General** → **VPN & Device Management** (or **General** → **About** → **Certificate Trust Settings** on newer iOS versions)
   - Find your certificate in the list
   - Toggle the switch to enable trust for the certificate
   - Confirm when prompted

3. **Verify Installation**:
   - Open Safari and navigate to your dashboard
   - Certificate warning should be gone

4. **Install as PWA**:
   - Tap the **Share** button
   - Select **Add to Home Screen**
   - Name it and tap **Add**
   - The app is now installed on your home screen

### Android

1. **Download the certificate**:
   - Open Chrome or your default browser on Android
   - Navigate to `https://your-dashboard-domain:8443/ca.crt`
   - Tap the download notification to save the file

2. **Install the Certificate**:
   - Go to **Settings** → **Security** (or **Security & Privacy**)
   - Tap **Install from storage** or **Install a certificate**
   - Select **CA Certificate**
   - Navigate to your Downloads folder and select `ca.crt`
   - Enter a name for the certificate (e.g., "Dashboard CA")
   - Tap **OK** to install

3. **Verify Installation**:
   - Open your browser and navigate to your dashboard
   - Certificate warning should be gone

4. **Install as PWA**:
   - Open Chrome and navigate to your dashboard
   - Tap the three-dot menu (⋮)
   - Select **Install app** or **Add to home screen**
   - Confirm the installation

### Windows

1. **Download the certificate**:
   - Open Microsoft Edge, Chrome, or Firefox on Windows
   - Navigate to `https://your-dashboard-domain:8443/ca.crt`
   - Save the file to your Downloads folder

2. **Install the Certificate** (via Certmgr):
   - Press `Win + R` to open the Run dialog
   - Type `certmgr.msc` and press Enter
   - In the Certificate Manager, navigate to **Trusted Root Certification Authorities** → **Certificates**
   - Right-click in the empty area and select **All Tasks** → **Import**
   - Click **Next**
   - Browse to your `ca.crt` file and select it
   - Click **Next**
   - Select **Place all certificates in the following store: Trusted Root Certification Authorities**
   - Click **Next**, then **Finish**

3. **Alternative Installation** (via Internet Explorer/Edge):
   - Double-click the `ca.crt` file
   - Click **Install Certificate**
   - Select **Local Machine** (if available, requires admin)
   - Click **Next**
   - Select **Place all certificates in the following store**
   - Click **Browse** and select **Trusted Root Certification Authorities**
   - Click **OK**, then **Finish**

4. **Verify Installation**:
   - Open your browser and navigate to your dashboard
   - Certificate warning should be gone

5. **Install as PWA**:
   - Open Edge or Chrome and navigate to your dashboard
   - Click the **Install** button (appears in the address bar or in the app menu)
   - Confirm the installation

### Browser (Temporary Access Without Installation)

If you just want to test the dashboard without installing the certificate:

## Troubleshooting

### Certificate Generation Failed

**Problem**: `command not found: openssl`

**Solution**:

```bash
# macOS (with Homebrew)
brew install openssl

# Linux (Ubuntu/Debian)
sudo apt-get install openssl

# Linux (RHEL/CentOS)
sudo yum install openssl
```

### Container Won't Start

**Problem**: `docker-compose up -d` fails or container exits immediately

**Solution**:

1. Check logs: `docker-compose logs hassio-dashboard`
2. Common issues:
   - Missing certificate files in `docker/ssl/` directory
   - Port already in use (change ports in `docker-compose.yml`)
   - Permission issues with config file

### SSL Certificate Errors in Browser

**Problem**: `ERR_CERT_AUTHORITY_INVALID` or similar warnings

**Causes & Solutions**:

- **Self-signed certificate**: This is normal. Install the CA certificate (`ca.crt`) on your device
- **Domain mismatch**: Certificate Common Name (CN) must match the domain you're accessing
- **Expired certificate**: Regenerate with: `bash docker/ssl/generate-certs.sh`

### Connection to Home Assistant Fails

**Problem**: Dashboard shows "Disconnected from Home Assistant"

**Solutions**:

1. Verify the URL in `dashboard-config.json`:

   ```json
   "haUrl": "https://your-actual-ha-url:8123"
   ```

2. Check the access token is valid:
   - Go to Home Assistant: **Settings** → **Developer Tools** → **Long-Lived Access Tokens**
   - Verify it hasn't expired
   - Generate a new token if needed

3. Verify network connectivity:

   ```bash
   # From the dashboard container, test connectivity
   docker-compose exec hassio-dashboard curl https://your-ha-url:8123
   ```

4. Check Home Assistant logs for authentication errors

5. Ensure WebSocket connections are allowed (check firewall, reverse proxy, etc.)

### PWA Installation Not Working

**Problem**: PWA install button doesn't appear or PWA fails to connect

**Solutions**:

1. Install the CA certificate on the device (see [Certificate Installation](#certificate-installation-on-client-devices))
2. Clear browser cache and restart the app
3. For iOS PWA: Use Safari, not Chrome or other browsers
4. Make sure the domain in the URL matches the certificate's CN

### Performance Issues

**Problem**: Dashboard is slow or unresponsive

**Solutions**:

1. Check network latency to Home Assistant: `ping your-ha-url`
2. Monitor Home Assistant logs for performance issues
3. Reduce the number of entities displayed
4. Use entity wildcards and getters instead of listing all entities
5. Check Docker resource limits if running in a container

## Next Steps

After successful deployment:

1. **Design your views** in the visual editor; see [Configuration Guide](./CONFIGURATION.md) for advanced JSON options
2. **Choose from the built-in card catalog**; card implementations are shipped and updated with this app
3. **Install the PWA** on your devices for a native app experience

For detailed configuration options and card types, see [Configuration Guide](./CONFIGURATION.md).
