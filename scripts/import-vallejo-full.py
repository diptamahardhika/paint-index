#!/usr/bin/env python3
"""Import the full Vallejo paint table from Arcturus5404/miniature-paints."""

from __future__ import annotations

import json
import re
import urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
VALLEJO_JSON = ROOT / "data" / "vallejo.json"
VALLEJO_MD_URL = (
    "https://raw.githubusercontent.com/Arcturus5404/miniature-paints/"
    "main/paints/Vallejo.md"
)

ROW_RE = re.compile(
    r"\|([^|]+)\|([^|]+)\|([^|]+)\|"
    r"(\d{1,3})\|(\d{1,3})\|(\d{1,3})\|"
    r"[^|]*`#([0-9A-Fa-f]{6})`\|"
)


def fetch_vallejo_md() -> str:
    return urllib.request.urlopen(VALLEJO_MD_URL, timeout=45).read().decode("utf-8")


def parse_vallejo_table(md: str) -> list[dict]:
    paints: list[dict] = []

    for match in ROW_RE.finditer(md):
        name, code, line, r, g, b, hex_value = (part.strip() for part in match.groups())
        if name == "Name" or code == "Code":
            continue

        paints.append(
            {
                "id": len(paints) + 1,
                "brand": "vallejo",
                "line": line,
                "code": code,
                "name": name,
                "hex": f"#{hex_value.lower()}",
                "rgb": f"{int(r)},{int(g)},{int(b)}",
            }
        )

    if not paints:
        raise RuntimeError("No Vallejo paints parsed from source table.")

    return paints


def main() -> None:
    paints = parse_vallejo_table(fetch_vallejo_md())
    data = {
        "type": "vallejo",
        "name": f"Vallejo ({len(paints)} paints)",
        "source": "Arcturus5404/miniature-paints Vallejo.md",
        "sourceUrl": VALLEJO_MD_URL,
        "colors": paints,
    }
    VALLEJO_JSON.write_text(
        json.dumps(data, indent=2, ensure_ascii=False) + "\n",
        encoding="utf-8",
    )
    lines = sorted({paint["line"] for paint in paints})
    print(f"Imported {len(paints)} Vallejo paints across {len(lines)} lines.")


if __name__ == "__main__":
    main()
