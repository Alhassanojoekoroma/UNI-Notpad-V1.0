# Self-hosting guide

This guide covers deploying UniNotepad on a Linux VPS with Caddy as the reverse proxy.

## Prerequisites

- A VPS running Ubuntu 22.04+ or Debian 12+ (1GB RAM minimum, 2GB recommended)
- A domain name with DNS access (e.g., `uninotepad.example.com`)
- PostgreSQL 15 or later
- Node.js 20.9 or later
- pnpm (`corepack enable && corepack prepare pnpm@latest --activate`)
- Caddy web server (for automatic HTTPS)

## Step 1: Set up the database

Install PostgreSQL if you haven't already:

```bash
sudo apt install postgresql postgresql-contrib
```

Create a database and user:

```bash
sudo -u postgres createuser uninotepad --pwprompt
sudo -u postgres createdb uninotepad --owner=uninotepad
```

Note the connection string: `postgresql://uninotepad:YOUR_PASSWORD@localhost:5432/uninotepad`

## Step 2: Deploy the application

Clone and install:

```bash
git clone https://github.com/your-org/uninotepad.git /opt/uninotepad
cd /opt/uninotepad
pnpm install --frozen-lockfile
```

Create your environment file:

```bash
cp .env.example .env.local
```

Edit `.env.local` with your production values. At minimum:

```
DATABASE_URL="postgresql://uninotepad:YOUR_PASSWORD@localhost:5432/uninotepad"
AUTH_SECRET="generate-a-long-random-string"
NEXTAUTH_URL="https://uninotepad.example.com"
NEXT_PUBLIC_ROOT_DOMAIN="uninotepad.example.com"
```

See [configuration.md](configuration.md) for all environment variables.

Run database migrations:

```bash
pnpm dlx prisma migrate deploy
```

Build and test:

```bash
pnpm build
pnpm start
```

Verify the app is running at `http://localhost:3000`, then stop it (Ctrl+C).

## Step 3: Set up a process manager

Use systemd to keep the app running:

```bash
sudo tee /etc/systemd/system/uninotepad.service > /dev/null << 'EOF'
[Unit]
Description=UniNotepad
After=network.target postgresql.service

[Service]
Type=simple
User=www-data
WorkingDirectory=/opt/uninotepad
ExecStart=/usr/bin/node /opt/uninotepad/.next/standalone/server.js
Restart=on-failure
RestartSec=5
Environment=NODE_ENV=production
Environment=PORT=3000
EnvironmentFile=/opt/uninotepad/.env.local

[Install]
WantedBy=multi-user.target
EOF
```

Enable and start:

```bash
sudo systemctl enable uninotepad
sudo systemctl start uninotepad
sudo systemctl status uninotepad
```

## Step 4: Configure DNS

Set up wildcard DNS so subdomains work. Add these records to your DNS provider:

| Type | Name | Value |
|------|------|-------|
| A | `uninotepad.example.com` | Your server's IP |
| A | `*.uninotepad.example.com` | Your server's IP |

The wildcard record (`*`) allows `admin.uninotepad.example.com` and `lecturer.uninotepad.example.com` to resolve to your server.

## Step 5: Set up Caddy (reverse proxy + HTTPS)

Install Caddy:

```bash
sudo apt install -y debian-keyring debian-archive-keyring apt-transport-https
curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/gpg.key' | sudo gpg --dearmor -o /usr/share/keyrings/caddy-stable-archive-keyring.gpg
curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/debian.deb.txt' | sudo tee /etc/apt/sources.list.d/caddy-stable.list
sudo apt update
sudo apt install caddy
```

Edit the Caddyfile:

```bash
sudo tee /etc/caddy/Caddyfile > /dev/null << 'EOF'
uninotepad.example.com, *.uninotepad.example.com {
    reverse_proxy localhost:3000
}
EOF
```

**Note on wildcard certificates:** The config above works for individual subdomains (Caddy will get separate certs for each). For a proper wildcard certificate, you need the DNS challenge, which requires a Caddy DNS plugin for your provider. For example, with Cloudflare DNS:

```
uninotepad.example.com, *.uninotepad.example.com {
    tls {
        dns cloudflare {env.CLOUDFLARE_API_TOKEN}
    }
    reverse_proxy localhost:3000
}
```

See [Caddy DNS modules](https://caddyserver.com/docs/modules/) for your DNS provider.

Restart Caddy:

```bash
sudo systemctl restart caddy
```

Caddy gets HTTPS certificates from Let's Encrypt automatically.

## Step 6: Complete setup

Visit `https://uninotepad.example.com` in your browser and complete the setup wizard to:

1. Create an admin account
2. Set your university name and branding
3. Configure faculties and programs
4. Enter API keys for external services

After setup, verify subdomain routing:

- `https://uninotepad.example.com` -- public pages and student dashboard
- `https://admin.uninotepad.example.com` -- admin panel
- `https://lecturer.uninotepad.example.com` -- lecturer dashboard

---

## Backups

Set up automated PostgreSQL backups with a daily cron job:

```bash
sudo mkdir -p /var/backups/uninotepad
```

```bash
sudo tee /etc/cron.d/uninotepad-backup > /dev/null << 'EOF'
0 3 * * * postgres pg_dump uninotepad | gzip > /var/backups/uninotepad/$(date +\%Y-\%m-\%d).sql.gz
0 4 * * * root find /var/backups/uninotepad -name "*.sql.gz" -mtime +7 -delete
EOF
```

This dumps the database at 3 AM daily and keeps the last 7 days. For offsite backups, use `rclone` or `aws s3 cp` to sync the backup directory to cloud storage.

To restore from a backup:

```bash
gunzip -c /var/backups/uninotepad/2026-03-31.sql.gz | psql uninotepad
```

## Updating

To deploy a new version:

```bash
cd /opt/uninotepad
git pull
pnpm install --frozen-lockfile
pnpm dlx prisma migrate deploy
pnpm build
sudo systemctl restart uninotepad
```

Check the release notes before updating -- breaking changes will be called out there.
