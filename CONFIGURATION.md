# Configuration Guide

This document explains how to configure StudentHV for self-hosting using Docker Compose.

---

## Quick Start (Docker Compose)

The easiest way to run StudentHV is using Docker Compose with a single `.env` file.

### 1. Copy the Example Configuration

```bash
cp .env.example .env
```

### 2. Edit the Configuration

Open `.env` in your favorite editor and customize the values for your environment.

**Required settings:**
- `NEXT_PUBLIC_DOMAIN` - Your domain or IP address
- `NEXT_PUBLIC_SERVER_URL` - Full URL to the API endpoint
- `JWT_SECRET` - A long random string (at least 32 characters)
- `GUACAMOLE_SECRET` - Exactly 32 characters for RDP encryption
- `SERVER1_HOST`, `SERVER1_USERNAME`, `SERVER1_PASSWORD` - Your Hyper-V server details

### 3. Start the Services

```bash
docker-compose up -d
```

### 4. Access the Application

- Web interface: `https://your-domain` (or `http://localhost` if using HTTP-only mode)
- API: `https://your-domain/api/v1`

---

## Configuration Reference

All configuration is done through environment variables in the `.env` file. Here are the key sections:

### Network Configuration

| Variable | Default | Description |
|----------|---------|-------------|
| `NEXT_PUBLIC_DOMAIN` | `localhost` | Your domain or IP address |
| `NEXT_PUBLIC_SERVER_URL` | `http://localhost/api/v1` | Full API URL |
| `HTTP_PORT` | `80` | HTTP port for nginx |
| `HTTPS_PORT` | `443` | HTTPS port for nginx |

### SSL/TLS Configuration

| Variable | Default | Description |
|----------|---------|-------------|
| `SSL_CERT_PATH` | `./nginx/fullchain.pem` | Path to SSL certificate |
| `SSL_KEY_PATH` | `./nginx/privkey.pem` | Path to SSL private key |

For local development without HTTPS, see the HTTP-only mode section in `nginx/nginx.conf`.

### Branding / Customization

| Variable | Default | Description |
|----------|---------|-------------|
| `NEXT_PUBLIC_APP_NAME` | `StudentHV` | Application name |
| `NEXT_PUBLIC_LOGO_URL` | GitHub logo URL | URL to your logo image |
| `NEXT_PUBLIC_SIDEBAR_COLOR` | `#532E80` | Sidebar background color (hex) |
| `NEXT_PUBLIC_SIDEBAR_TEXT_COLOR` | `#ffffff` | Sidebar text color (hex) |
| `NEXT_PUBLIC_SIDEBAR_BORDER_COLOR` | `#9ca3af` | Sidebar border color (hex) |
| `NEXT_PUBLIC_LOGIN_CARD_IMAGE` | Pexels image | Login page right-side image |
| `NEXT_PUBLIC_EMAIL_DOMAIN` | `@example.com` | Default email domain for users |

### Security

| Variable | Default | Description |
|----------|---------|-------------|
| `JWT_SECRET` | (long default) | JWT signing key (min 32 chars) |
| `GUACAMOLE_SECRET` | `ThisIsA32CharacterLongSecretKey!` | RDP encryption key (exactly 32 chars) |
| `CORS_AUTHORIZED` | `http://localhost:3000` | Allowed CORS origins |

### Active Directory / LDAP

| Variable | Required | Description |
|----------|----------|-------------|
| `AD_URL` | No | LDAP server (e.g., `ad.company.com`) |
| `AD_DN` | No | Base DN (e.g., `DC=company,DC=com`) |
| `AD_ADMIN_GROUP` | No | Admin group CN (e.g., `cn=AdminGroup`) |

### Hyper-V Servers

Configure one or more Hyper-V servers:

| Variable | Server 1 | Server 2 |
|----------|----------|----------|
| Name | `SERVER1_NAME` | `SERVER2_NAME` |
| Host/IP | `SERVER1_HOST` | `SERVER2_HOST` |
| Username | `SERVER1_USERNAME` | `SERVER2_USERNAME` |
| Password | `SERVER1_PASSWORD` | `SERVER2_PASSWORD` |
| Console User | `SERVER1_CONSOLE_USERNAME` | `SERVER2_CONSOLE_USERNAME` |
| Console Pass | `SERVER1_CONSOLE_PASSWORD` | `SERVER2_CONSOLE_PASSWORD` |

Console credentials are optional - they default to the main credentials if not set.

### Storage Paths (Host Machine)

| Variable | Default | Description |
|----------|---------|-------------|
| `ISO_HOST_PATH` | `./isos` | ISO files directory |
| `CONFIG_HOST_PATH` | `./configurations` | VM configuration files |
| `HARDDRIVES_HOST_PATH` | `./harddrives` | Virtual hard drives |

---

## Legacy Configuration (Non-Docker)

If not using Docker, you can configure components individually:

### API Configuration

Edit `api/src/main/resources/application.properties` (copy from `application.example.properties`):

```properties
# JWT Secret
jwt.secret=your-long-secret-key

# CORS
cores.authrized=http://localhost:3000

# WinRM
winrm.port=5985

# Directories
iso.directory=/isos
configuration.directory=/configurations

# LDAP
ad.url=ldap://ad.example.com
ad.dn=DC=example,DC=com

# Hyper-V Server
app.teams[0].serverName=SERVER1
app.teams[0].serverAddress=192.168.1.10
app.teams[0].serverUsername=admin
app.teams[0].serverPassword=secret
```

### Website Configuration

Edit `website/.env` (copy from `website/.env.example`):

```bash
NEXT_PUBLIC_SERVER_URL="http://localhost/api/v1"
NEXT_PUBLIC_DOMAIN="localhost"
NEXT_PUBLIC_LOGO_URL="/logo.png"
NEXT_PUBLIC_SIDEBAR_COLOR="#532E80"
```

---

## WinRM Setup

Ensure WinRM is enabled on all Hyper-V servers:

```powershell
Enable-PSRemoting -Force
Set-Item WSMan:\localhost\Service\AllowUnencrypted $true
Set-Item WSMan:\localhost\Service\Auth\Basic $true
```

A helper script is available at `/powershell/winrm_helper.ps1`.

The WinRM user must have permissions to run administrative PowerShell scripts.

---

## Security Checklist

- [ ] Change `JWT_SECRET` from the default value
- [ ] Change `GUACAMOLE_SECRET` from the default value
- [ ] Use HTTPS in production (with valid SSL certificates)
- [ ] Restrict WinRM access to trusted IPs
- [ ] Verify CORS domain settings
- [ ] Never commit `.env` files with real secrets
- [ ] Use strong passwords for Hyper-V server accounts
- [ ] Disable unencrypted WinRM when running in a secure network

---

## Troubleshooting

### Services won't start

Check logs:
```bash
docker-compose logs -f [service_name]
```

### Colors not applying

Ensure the hex colors in `.env` include the `#` prefix (e.g., `#532E80`).

### Logo not showing

- For external URLs: Ensure the URL is accessible from client browsers
- For local files: Mount the file in docker-compose and reference by path

### Cannot connect to Hyper-V

- Verify WinRM is enabled on the Hyper-V server
- Check firewall rules allow WinRM traffic (port 5985)
- Verify credentials are correct

---

**Author:** Struan
