"""Load the datathon workbook, cache every sheet to parquet, print a structural summary.

Usage: python -I 01_load.py <xlsx_path> <cache_dir>
"""
import sys
import time
from pathlib import Path

import pandas as pd
from python_calamine import CalamineWorkbook

xlsx = Path(sys.argv[1])
cache = Path(sys.argv[2])
cache.mkdir(parents=True, exist_ok=True)

t0 = time.time()
wb = CalamineWorkbook.from_path(str(xlsx))
print("SHEETS:", wb.sheet_names)

for name in wb.sheet_names:
    rows = wb.get_sheet_by_name(name).to_python(skip_empty_area=False)
    print(f"\n=== sheet {name!r}: {len(rows)} raw rows, {time.time() - t0:.1f}s ===")
    if not rows:
        continue
    header = [str(c) for c in rows[0]]
    print("ncols:", len(header))
    if len(rows) < 400:
        # small sheet (maybe a data dictionary) - print it whole
        for r in rows:
            print(" | ".join(str(c) for c in r))
        continue
    df = pd.DataFrame(rows[1:], columns=header)
    safe = "".join(ch if ch.isalnum() else "_" for ch in name)
    # object columns with mixed types break parquet; stringify only truly mixed ones
    for c in df.columns:
        if df[c].dtype == object:
            kinds = df[c].map(type).value_counts()
            if len(kinds) > 1:
                print(f"  mixed types in {c!r}: {dict((k.__name__, int(v)) for k, v in kinds.items())}")
                df[c] = df[c].map(lambda v: None if v is None or v == "" else str(v))
    out = cache / f"{safe}.parquet"
    df.to_parquet(out, index=False)
    print("saved", out, df.shape)

print(f"\nTOTAL {time.time() - t0:.1f}s")
