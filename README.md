# Paint Index

Cross-reference **Citadel Colour** and **Vallejo** hobby paints with HEX / Bolter & Chainsword (B&C) index conversion and ΔE color matching.

## Run locally

Browsers enforce a security policy called **CORS (Cross-Origin Resource Sharing)** that blocks JavaScript from loading local files (like `data/citadel.json` and `data/vallejo.json`) when you open `index.html` directly via double-click or `file://` URLs.

To work around this, you need to serve the files over HTTP instead of the file system. The simplest way is using Python's built-in web server:

```bash
python3 -m http.server 8081
```

Then open **http://localhost:8081** in your browser.

> **Tip:** If you don't have Python, you can also use:
> - **Node.js:** `npx serve` or `npx http-server`
> - **VS Code:** "Live Server" extension → right-click `index.html` → "Open with Live Server"
> - **PHP:** `php -S localhost:8081`
> - **Go:** `go run github.com/traefik/yaegi/cmd/yaegi@latest -exec 'http.ListenAndServe(":8081", http.FileServer(http.Dir(".")))'`

## Run with Docker

### Use GitHub Container Registry (Recommended)
You can pull and run the pre-built image directly without cloning the code:

```bash
docker pull ghcr.io/diptamahardhika/paint-index:v1.0.0-beta.4
docker run -d --name paint-index -p 8081:80 ghcr.io/diptamahardhika/paint-index:v1.0.0-beta.4
```

### Use Docker Compose
Use the provided compose file to pull and run the published image:

```bash
docker compose up -d
```
The app will be available at [http://localhost:8081](http://localhost:8081).

## Features

- **Browse** — Search and filter 352 Citadel colours and 1,268 Vallejo paints across 20 paint lines.
- **Inventory** — Track owned paints and wishlist paints locally, optionally sign in with Google to sync across devices, and export JSON for backup.
- **Cross-reference** — Pick a paint; see the closest matches in the other brand (CIE76 ΔE in Lab space).
- **HEX lab** — Convert HEX ↔ RGB ↔ B&C format (`231F20`), copy forum BBCode, look up the full Citadel index, and find nearest paints for any color.

## Data

| File | Source |
|------|--------|
| `data/citadel.json` | Citadel colours from the B&C index plus official Citadel table imports |
| `data/vallejo.json` | Full Vallejo table from [`Arcturus5404/miniature-paints`](https://github.com/Arcturus5404/miniature-paints/blob/main/paints/Vallejo.md) |

Hex values are approximations from online swatches and source tables. Washes, metallics, textures, and transparent paints may not match real bottles or your monitor.
