# Paint Index

Cross-reference **Citadel Colour** and **Vallejo** hobby paints with HEX / Bolter & Chainsword (B&C) index conversion and ΔE color matching.

## Run locally

Browsers block loading JSON over `file://`. From this folder:

```bash
python3 -m http.server 8080
```

Open [http://localhost:8080](http://localhost:8080).

## Features

- **Browse** — Search and filter 189 Citadel colours (B&C index #1–189) and 447 Vallejo Model Color / Model Air paints.
- **Cross-reference** — Pick a paint; see the closest matches in the other brand (CIE76 ΔE in Lab space).
- **HEX lab** — Convert HEX ↔ RGB ↔ B&C format (`231F20`), copy forum BBCode, look up Citadel index numbers, find nearest paints for any color.

## Data

| File | Source |
|------|--------|
| `data/citadel.json` | Your B&C 189 Citadel library + hex approximations |
| `data/vallejo.json` | Vallejo Model Color & Model Air (hex from community swatches) |

Hex values are approximations from online swatches (see [B&C paint hex topic](https://bolterandchainsword.com/topic/352780-paint-color-hexadecimal-codes/)). Washes, metallics, and textures may not match real bottles or your monitor.
