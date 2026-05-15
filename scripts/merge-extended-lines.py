#!/usr/bin/env python3
"""Append Vallejo Xpress Color to paint-index JSON data.

For Citadel hex values, use scripts/import-citadel-official.py instead
(SimoGecko/CitadelColours official table).
"""

from __future__ import annotations

import json
import re
import urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
CITADEL_JSON = ROOT / "data" / "citadel.json"
VALLEJO_JSON = ROOT / "data" / "vallejo.json"

CITADEL_MD = (
    "https://raw.githubusercontent.com/Arcturus5404/miniature-paints/"
    "main/paints/Citadel_Colour.md"
)
VALLEJO_MD = (
    "https://raw.githubusercontent.com/Arcturus5404/miniature-paints/"
    "main/paints/Vallejo.md"
)

CONTRAST_NAMES = """
Aeldari Emerald
Aethermatic Blue
Aggaros Dunes
Akhelian Green
Apothecary White
Asurmen Blue
Baal Red
Bad Moon Yellow
Basilicanum Grey
Black Legion
Black Templar
Blood Angels Red
Briar Queen Chill
Celestium Blue
Creed Camo
Cygor Brown
Dark Angels Green
Darkoath Flesh
Doomfire Magenta
Dreadful Visage
Flesh Tearers Red
Frostheart
Fyreslayer Flesh
Garaghak's Sewer
Gore-Grunta Fur
Gryph-Charger Grey
Gryph-Hound Orange
Guilliman Flesh
Gutrippa Flesh
Hexwraith Flame
Imperial Fist
Ironjawz Yellow
Iyanden Yellow
Karandras Green
Kroxigor Scales
Leviadon Blue
Leviathan Purple
Luxion Purple
Magmadroth Flame
Magos Purple
Mantis Warriors Green
Militarum Green
Nazdreg Yellow
Nighthaunt Gloom
Ork Flesh
Plaguebearer Flesh
Pylar Glacier
Ratling Grime
Shyish Purple
Sigvald Burgundy
Skeleton Horde
Snakebite Leather
Stormfiend
Striking Scorpion Green
Talassar Blue
Terradon Turquoise
Ultramarines Blue
Volupus Pink
Warp Lightning
Wyldwood
""".strip().splitlines()

# Hex approximations for Contrast paints missing from miniature-paints (Contrast tag).
# Sourced from related GW entries, retailer swatches, and community comparisons.
CONTRAST_SUPPLEMENTAL = {
    "Aeldari Emerald": ("#0E8A6F", "14,138,111"),
    "Asurmen Blue": ("#2E75B6", "46,117,182"),
    "Baal Red": ("#A30E18", "163,14,24"),
    "Bad Moon Yellow": ("#FFF200", "255,242,0"),
    "Briar Queen Chill": ("#B5C8D3", "181,200,211"),
    "Celestium Blue": ("#4FA8D8", "79,168,216"),
    "Doomfire Magenta": ("#C92868", "201,40,104"),
    "Dreadful Visage": ("#C2D2D8", "194,210,216"),
    "Frostheart": ("#7BC4DE", "123,196,222"),
    "Garaghak's Sewer": ("#4B4638", "75,70,56"),
    "Gutrippa Flesh": ("#5A8F48", "90,143,72"),
    "Hexwraith Flame": ("#29A236", "41,162,54"),
    "Imperial Fist": ("#E0B428", "224,180,40"),
    "Ironjawz Yellow": ("#E8940C", "232,148,12"),
    "Karandras Green": ("#1A6B38", "26,107,56"),
    "Kroxigor Scales": ("#2A8A78", "42,138,120"),
    "Leviathan Purple": ("#5C2D6E", "92,45,110"),
    "Luxion Purple": ("#9A6BB5", "154,107,181"),
    "Magmadroth Flame": ("#E06010", "224,96,16"),
    "Mantis Warriors Green": ("#3A7A48", "58,122,72"),
    "Nighthaunt Gloom": ("#3A686E", "58,104,110"),
    "Pylar Glacier": ("#A5D0E3", "165,208,227"),
    "Ratling Grime": ("#3A342F", "58,52,47"),
    "Sigvald Burgundy": ("#6E1E3C", "110,30,60"),
    "Stormfiend": ("#6A5878", "106,88,120"),
    "Striking Scorpion Green": ("#78B820", "120,184,32"),
}


def fetch(url: str) -> str:
    return urllib.request.urlopen(url, timeout=45).read().decode("utf-8")


def parse_citadel_contrast(md: str) -> dict[str, tuple[str, str]]:
    row = re.compile(r"^\|([^|]+)\|([^|]+)\|(\d+)\|(\d+)\|(\d+)\|")
    out: dict[str, tuple[str, str]] = {}
    for line in md.splitlines():
        m = row.match(line)
        if not m or m.group(2).strip() != "Contrast":
            continue
        name = m.group(1).strip()
        r, g, b = int(m.group(3)), int(m.group(4)), int(m.group(5))
        hex_match = re.search(r"`#([0-9A-Fa-f]{6})`", line)
        hex_val = "#" + (hex_match.group(1) if hex_match else f"{r:02X}{g:02X}{b:02X}")
        out[name] = (hex_val.upper(), f"{r},{g},{b}")
    return out


def parse_vallejo_xpress(md: str) -> list[dict]:
    paints: list[dict] = []
    for line in md.splitlines():
        if "|Xpress Color" not in line:
            continue
        parts = [p for p in line.split("|") if p != ""]
        if len(parts) < 6:
            continue
        name, code, line_name = parts[0], parts[1], parts[2]
        r, g, b = int(parts[3]), int(parts[4]), int(parts[5])
        hex_match = re.search(r"`#([0-9A-Fa-f]{6})`", line)
        hex_val = "#" + (hex_match.group(1) if hex_match else f"{r:02X}{g:02X}{b:02X}")
        paints.append(
            {
                "code": code,
                "line": line_name,
                "name": name,
                "hex": hex_val.lower(),
                "rgb": f"{r},{g},{b}",
            }
        )
    return paints


def merge_citadel() -> None:
    data = json.loads(CITADEL_JSON.read_text(encoding="utf-8"))
    existing = data["colors"]
    max_id = max(c["id"] for c in existing)

    tagged = parse_citadel_contrast(fetch(CITADEL_MD))
    next_id = max_id + 1
    added = 0

    for name in CONTRAST_NAMES:
        if name in tagged:
            hex_val, rgb = tagged[name]
        elif name in CONTRAST_SUPPLEMENTAL:
            hex_val, rgb = CONTRAST_SUPPLEMENTAL[name]
        else:
            raise RuntimeError(f"Missing Contrast colour: {name}")

        existing.append(
            {
                "id": next_id,
                "line": "Contrast",
                "name": name,
                "hex": hex_val,
                "rgb": rgb,
            }
        )
        next_id += 1
        added += 1

    data["name"] = "Citadel Colours (B&C 189 + Contrast 60)"
    data["colors"] = existing
    CITADEL_JSON.write_text(
        json.dumps(data, indent=2, ensure_ascii=False) + "\n",
        encoding="utf-8",
    )
    print(f"citadel: +{added} Contrast (total {len(existing)})")


def merge_vallejo() -> None:
    data = json.loads(VALLEJO_JSON.read_text(encoding="utf-8"))
    existing = data["colors"]
    max_id = max(c["id"] for c in existing)
    existing_codes = {c.get("code") for c in existing}

    xpress = parse_vallejo_xpress(fetch(VALLEJO_MD))
    next_id = max_id + 1
    added = 0

    for paint in xpress:
        if paint["code"] in existing_codes:
            continue
        existing.append(
            {
                "id": next_id,
                "brand": "vallejo",
                **paint,
            }
        )
        existing_codes.add(paint["code"])
        next_id += 1
        added += 1

    data["name"] = "Vallejo (Model Color + Model Air + Xpress Color)"
    data["colors"] = existing
    VALLEJO_JSON.write_text(
        json.dumps(data, indent=2, ensure_ascii=False) + "\n",
        encoding="utf-8",
    )
    print(f"vallejo: +{added} Xpress (total {len(existing)})")


def main() -> None:
    merge_citadel()
    merge_vallejo()


if __name__ == "__main__":
    main()
