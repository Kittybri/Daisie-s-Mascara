"""Structural profile of the cached dataset.

Usage: python -I 02_profile.py <parquet>
"""
import sys

import numpy as np
import pandas as pd

pd.set_option("display.width", 250)
pd.set_option("display.max_columns", 100)
pd.set_option("display.max_rows", 200)
pd.set_option("display.max_colwidth", 60)

df = pd.read_parquet(sys.argv[1])
print("shape:", df.shape)
print("\nCOLUMNS:")
rows = []
for c in df.columns:
    s = df[c]
    nun = s.nunique(dropna=True)
    na = int(s.isna().sum())
    empty = int((s.astype(str).str.strip() == "").sum()) if s.dtype == object or str(s.dtype).startswith("str") else 0
    ex = s.dropna().iloc[:3].tolist()
    rows.append((c, str(s.dtype), nun, na, empty, ex))
prof = pd.DataFrame(rows, columns=["col", "dtype", "nunique", "n_na", "n_empty", "examples"])
print(prof.to_string())

print("\nLABEL-LIKE columns value counts:")
for c in df.columns:
    if c.lower() in ("label", "target", "class", "phishing", "status"):
        print(df[c].value_counts(dropna=False))

num = df.select_dtypes(include=[np.number])
print("\nNUMERIC describe:")
print(num.describe(percentiles=[0.01, 0.25, 0.5, 0.75, 0.99]).T.to_string())

print("\nHEAD(5) transposed:")
print(df.head(5).T.to_string())

print("\nfull-row duplicates:", int(df.duplicated().sum()))
