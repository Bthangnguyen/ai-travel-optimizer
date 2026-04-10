from __future__ import annotations

import argparse
import json
from pathlib import Path


def build_insert_sql(source_path: Path) -> str:
    items = json.loads(source_path.read_text(encoding="utf-8"))
    rows: list[str] = []
    for item in items:
        tag_list = "','".join(tag.replace("'", "''") for tag in item["tags"])
        name = item["name"].replace("'", "''")
        description = item.get("description", "").replace("'", "''")
        rows.append(
            "("
            f"'{item['poi_id']}', "
            f"'{item['city']}', "
            f"'{name}', "
            f"ST_SetSRID(ST_MakePoint({item['lon']}, {item['lat']}), 4326), "
            f"ARRAY['{tag_list}'], "
            f"{item['visit_minutes']}, "
            f"{item['ticket_price']}, "
            f"'{item['opens_at']}', "
            f"'{item['closes_at']}', "
            f"{str(item['outdoor']).upper()}, "
            f"{item['priority']}, "
            f"'{description}'"
            ")"
        )

    values = ",\n".join(rows)
    return f"""CREATE TABLE IF NOT EXISTS poi_catalog (
    poi_id TEXT PRIMARY KEY,
    city TEXT NOT NULL,
    name TEXT NOT NULL,
    geom GEOMETRY(Point, 4326) NOT NULL,
    tags TEXT[] NOT NULL,
    visit_minutes INTEGER NOT NULL,
    ticket_price INTEGER NOT NULL,
    opens_at TIME NOT NULL,
    closes_at TIME NOT NULL,
    outdoor BOOLEAN NOT NULL,
    priority INTEGER NOT NULL,
    description TEXT NOT NULL
);

INSERT INTO poi_catalog (
    poi_id, city, name, geom, tags, visit_minutes, ticket_price, opens_at,
    closes_at, outdoor, priority, description
) VALUES
{values}
ON CONFLICT (poi_id) DO NOTHING;
"""


def main() -> None:
    parser = argparse.ArgumentParser(description="Generate PostGIS seed SQL from sample POIs.")
    parser.add_argument(
        "--source",
        type=Path,
        default=Path("data/sample_pois.json"),
        help="Path to the source POI JSON file.",
    )
    parser.add_argument(
        "--output",
        type=Path,
        default=None,
        help="Optional output SQL path. Prints to stdout when omitted.",
    )
    args = parser.parse_args()

    sql = build_insert_sql(args.source)
    if args.output is None:
        print(sql)
    else:
        args.output.write_text(sql, encoding="utf-8")


if __name__ == "__main__":
    main()

