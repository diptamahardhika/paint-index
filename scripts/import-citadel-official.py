#!/usr/bin/env python3
"""
Sync citadel.json hex values (and Contrast range) from SimoGecko's official table:
https://github.com/SimoGecko/CitadelColours/blob/main/tables/citadel_official_colors_table.md
"""

from __future__ import annotations

import json
import re
import urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
CITADEL_JSON = ROOT / "data" / "citadel.json"
OFFICIAL_MD_URL = (
    "https://raw.githubusercontent.com/SimoGecko/CitadelColours/"
    "main/tables/citadel_official_colors_table.md"
)

VALID_TYPES = frozenset(
    {"spray", "base", "layer", "shade", "technical", "contrast", "air", "dry"}
)

# B&C index names that differ from citadelcolour.com or need a specific type pick.
B_AND_C_ALIASES: dict[str, tuple[str, str | None]] = {
    "armageddondunes": ("Armageddon Dust", "technical"),
    "astrogranitedebris": ("Astrogranite", "technical"),
    "ceramitewhite": ("Corax White", "base"),
    "stirlandbattlemire": ("Stirland Mud", "technical"),
}

# When several official rows share a name, prefer types typical of the B&C list.
TYPE_PRIORITY = ("shade", "technical", "layer", "base", "dry", "contrast", "air", "spray")


def norm(name: str) -> str:
    return re.sub(r"[^a-z0-9]+", "", name.lower().replace("'", "'").replace("'", "'"))


def hex_to_rgb(hex_val: str) -> str:
    h = hex_val.lstrip("#")
    r, g, b = int(h[0:2], 16), int(h[2:4], 16), int(h[4:6], 16)
    return f"{r},{g},{b}"


def parse_code_field(code: str) -> tuple[str | None, str | None]:
    code = code.strip().strip("`")
    parts = re.findall(r"#([0-9A-Fa-f]{6})", code)
    if not parts:
        return None, None
    hex1 = f"#{parts[0].upper()}"
    hex2 = f"#{parts[1].upper()}" if len(parts) > 1 else None
    return hex1, hex2


def fetch_official_md() -> str:
    local = ROOT / "data" / "citadel_official_colors_table.md"
    if local.is_file():
        return local.read_text(encoding="utf-8")
    return urllib.request.urlopen(OFFICIAL_MD_URL, timeout=45).read().decode("utf-8")


def parse_official_table(md: str) -> dict[str, list[dict]]:
    by_name: dict[str, list[dict]] = {}
    for line in md.splitlines():
        if not line.startswith("|") or "----" in line:
            continue
        cells = [c.strip() for c in line.split("|")[1:-1]]
        if len(cells) < 4:
            continue
        name, paint_type, finish, code = cells[0], cells[1], cells[2], cells[3]
        if paint_type not in VALID_TYPES or name == "Name":
            continue
        hex1, hex2 = parse_code_field(code)
        if not hex1:
            continue
        entry = {
            "name": name,
            "type": paint_type,
            "finish": finish or None,
            "hex": hex1,
            "hex2": hex2,
            "rgb": hex_to_rgb(hex1),
        }
        by_name.setdefault(norm(name), []).append(entry)
    return by_name


def pick_official(
    paint_name: str,
    *,
    prefer_type: str | None = None,
    by_name: dict[str, list[dict]],
) -> dict | None:
    key = norm(paint_name)
    alias = B_AND_C_ALIASES.get(key)
    if alias:
        paint_name, prefer_type = alias[0], alias[1] or prefer_type
        key = norm(paint_name)

    options = by_name.get(key)
    if not options:
        return None
    if len(options) == 1:
        return options[0]
    if prefer_type:
        for opt in options:
            if opt["type"] == prefer_type:
                return opt
    for t in TYPE_PRIORITY:
        for opt in options:
            if opt["type"] == t:
                return opt
    return options[0]


def apply_official_fields(target: dict, official: dict) -> None:
    target["name"] = official["name"]
    target["line"] = official["type"].capitalize()
    target["type"] = official["type"]
    target["hex"] = official["hex"]
    target["rgb"] = official["rgb"]
    if official.get("finish"):
        target["finish"] = official["finish"]
    elif "finish" in target:
        del target["finish"]
    if official.get("hex2"):
        target["hex2"] = official["hex2"]
    elif "hex2" in target:
        del target["hex2"]


def main() -> None:
    md = fetch_official_md()
    by_name = parse_official_table(md)

    data = json.loads(CITADEL_JSON.read_text(encoding="utf-8"))
    colors = data["colors"]
    
    # Track which official paints we've mapped to existing library entries
    used_official_keys: set[str] = set()

    updated = 0
    kept_legacy = 0
    for paint in colors:
        official = pick_official(paint["name"], by_name=by_name)
        if official:
            apply_official_fields(paint, official)
            used_official_keys.add(f"{norm(official['name'])}_{official['type']}")
            updated += 1
        else:
            # Ensure we don't use the generic "Citadel Colours" line name anymore
            current_line = paint.get("line")
            if not current_line or current_line == "Citadel Colours":
                paint["line"] = "Classic"
            kept_legacy += 1

    # Add all official paints that weren't in our existing library
    next_id = max((c["id"] for c in colors), default=0) + 1
    added = 0
    for entries in by_name.values():
        for official in entries:
            key = f"{norm(official['name'])}_{official['type']}"
            if key not in used_official_keys:
                entry = {"id": next_id}
                apply_official_fields(entry, official)
                colors.append(entry)
                next_id += 1
                added += 1

    data["name"] = f"Citadel Colours ({len(colors)} paints)"

    CITADEL_JSON.write_text(
        json.dumps(data, indent=2, ensure_ascii=False) + "\n",
        encoding="utf-8",
    )
    print(
        f"Updated {updated} existing paints from official table; "
        f"{kept_legacy} kept legacy hex (no official match)."
    )
    print(f"Added {added} new paints from official table.")


if __name__ == "__main__":
    main()
