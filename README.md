# Paint Index

Cross-reference **Citadel Colour** and **Vallejo** hobby paints with HEX / Bolter & Chainsword (B&C) index conversion and ΔE color matching.

## Run locally

Browsers block loading JSON over `file://`. From this folder:

```bash
python3 -m http.server 8081
```

Open [http://localhost:8081](http://localhost:8081).

## Run with Docker

### Use GitHub Container Registry (Recommended)
You can pull and run the pre-built image directly without cloning the code:

```bash
docker pull ghcr.io/diptamahardhika/paint-index:latest
docker run -d --name paint-index -p 8081:80 ghcr.io/diptamahardhika/paint-index:latest
```

### Use Docker Compose
Use the provided compose file to pull and run the published image:

```bash
docker compose up -d
```
The app will be available at [http://localhost:8081](http://localhost:8081).

## Features

- **Browse** — Search and filter 352 Citadel colours and 1,268 Vallejo paints across 20 paint lines.
- **Cross-reference** — Pick a paint; see the closest matches in the other brand (CIE76 ΔE in Lab space).
- **HEX lab** — Convert HEX ↔ RGB ↔ B&C format (`231F20`), copy forum BBCode, look up the full Citadel index, and find nearest paints for any color.

## Data

| File | Source |
|------|--------|
| `data/citadel.json` | Citadel colours from the B&C index plus official Citadel table imports |
| `data/vallejo.json` | Full Vallejo table from [`Arcturus5404/miniature-paints`](https://github.com/Arcturus5404/miniature-paints/blob/main/paints/Vallejo.md) |

Hex values are approximations from online swatches and source tables. Washes, metallics, textures, and transparent paints may not match real bottles or your monitor.
