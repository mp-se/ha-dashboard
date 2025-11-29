# SSL Certificates

This directory contains SSL certificates used by the nginx web server to serve HTTPS connections securely.

## Files

- `server.crt` — Server SSL certificate (public key)
- `server.key` — Server private key (keep secure!)
- `ca.crt` — CA certificate for client distribution

## Certificate Management

For detailed instructions on generating, installing, and managing certificates, see the main project documentation:

- **[Installation Guide - SSL Certificate Setup](../../INSTALL.md#ssl-certificate-setup)** — How to generate, install, and configure certificates
- **[Installation Guide - Certificate Installation on Devices](../../INSTALL.md#certificate-installation-on-client-devices)** — How to install CA certificates on macOS, iOS, Android, and browsers

## Quick Start

### Generate Self-Signed Certificates

```bash
bash ./generate-certs.sh
```

This interactively generates new certificates. You'll be prompted for:
- Country code (C)
- State (ST)
- City (L)
- Organization (O)
- Common Name (CN) — Your domain (e.g., `ha.home.local`)

### Use Existing Certificates

Place your certificate files here and rename them:

```bash
cp /path/to/your/certificate.crt server.crt
cp /path/to/your/private.key server.key
cp /path/to/your/ca.crt ca.crt
```

## Security Notes

- **Never commit `server.key` to version control** — This is your private key!
- **Keep `server.key` secure** — Only docker and nginx should read it
- **Rotate certificates periodically** — Especially self-signed ones that expire
- **Use strong Common Names** — Match your actual domain or IP address
- **Distribute `ca.crt` only** — Never share `server.key`

## Certificate Lifecycle

Self-signed certificates generated with the script are valid for 365 days. Before they expire:

1. Generate new certificates: `bash ./generate-certs.sh`
2. Restart the docker container: `docker-compose restart`

For production, consider using Let's Encrypt or another trusted CA.

## Troubleshooting

**"ERR_CERT_AUTHORITY_INVALID"** in browsers:
→ This is expected for self-signed certs. Install the CA certificate (`ca.crt`) on your device.

**"Certificate has expired"**:
→ Generate new certificates: `bash ./generate-certs.sh`

**"Certificate CN doesn't match domain"**:
→ Regenerate with the correct domain in the Common Name field.

For more help, see [Installation Guide - Troubleshooting](../../INSTALL.md#troubleshooting).
