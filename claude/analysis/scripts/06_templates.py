"""Are phishing pages mass-produced? Page-structure 'fingerprints' shared across different domains.

A fingerprint = the exact combination of all 28 page-content features.
Usage: python -I 06_templates.py <parquet> <out_dir>
"""
import json
import sys
from pathlib import Path

import numpy as np
import pandas as pd
from sklearn.model_selection import StratifiedGroupKFold

pd.set_option("display.width", 250)
pd.set_option("display.max_columns", 100)
pd.set_option("display.float_format", lambda v: f"{v:,.4f}")

df = pd.read_parquet(sys.argv[1])
out = Path(sys.argv[2]); out.mkdir(parents=True, exist_ok=True)
y = df["Phishing"].astype(int).to_numpy()
P, L = y == 1, y == 0
PAGE = [
    "LineOfCode", "LargestLineLength", "HasTitle", "DomainTitleMatchScore", "URLTitleMatchScore", "HasFavicon",
    "Robots", "IsResponsive", "NoOfURLRedirect", "NoOfSelfRedirect", "HasDescription", "NoOfPopup", "NoOfiFrame",
    "HasExternalFormSubmit", "HasSocialNet", "HasSubmitButton", "HasHiddenFields", "HasPasswordField", "Bank",
    "Pay", "Crypto", "HasCopyrightInfo", "NoOfImage", "NoOfCSS", "NoOfJS", "NoOfSelfRef", "NoOfEmptyRef",
    "NoOfExternalRef",
]
# structure only: drop the two title-match scores (they depend on the domain name, not on the page template)
STRUCT = [c for c in PAGE if c not in ("DomainTitleMatchScore", "URLTitleMatchScore")]
fp = pd.util.hash_pandas_object(df[STRUCT], index=False).to_numpy()
df["fp"] = fp
g = df.groupby("fp").agg(n=("Phishing", "size"), phish=("Phishing", "mean"), ndom=("Domain_ID", "nunique"), ntld=("TLD_Group", "nunique"), loc=("LineOfCode", "first"), lll=("LargestLineLength", "first"), title=("HasTitle", "first"), img=("NoOfImage", "first"), js=("NoOfJS", "first"), ext=("NoOfExternalRef", "first"), pw=("HasPasswordField", "first"))
ndom = df["fp"].map(g["ndom"]).to_numpy()
print("distinct fingerprints:", len(g), "| used by >=2 domains:", int((g.ndom >= 2).sum()), "| mixed-label fingerprints:", int(((g.phish > 0) & (g.phish < 1)).sum()))
res = {"shared": {}}
for k in (2, 5, 10, 50, 100, 1000):
    m = ndom >= k
    res["shared"][k] = dict(phish=float(m[P].mean()), legit=float(m[L].mean()), n=int(m.sum()), purity=float(y[m].mean()) if m.any() else None)
    print(f"page fingerprint shared by >= {k:4d} different domains: phishing {m[P].mean():.3%} | legit {m[L].mean():.4%} | rows {int(m.sum())} | phishing share of those rows {y[m].mean() if m.any() else float('nan'):.4%}")

print("\nTop 20 fingerprints by number of domains:")
top = g.sort_values("ndom", ascending=False).head(20)
print(top.to_string())
ph_total = int(P.sum())
gs = g[g.phish == 1].sort_values("n", ascending=False)
cum = gs.n.cumsum() / ph_total
for k in (1, 5, 10, 20, 50, 100, 500):
    print(f"top {k:4d} all-phishing fingerprints cover {cum.iloc[k - 1]:.3%} of all phishing rows")
res["top_cover"] = {k: float(cum.iloc[k - 1]) for k in (1, 5, 10, 20, 50, 100, 500)}

# split by page size: trivial stubs vs. substantive templates
stub = df["LineOfCode"].to_numpy() <= 20
for nm, mask in (("stub pages (<=20 lines)", stub), ("substantive pages (>20 lines)", ~stub)):
    m = (ndom >= 5) & mask
    print(f"{nm}: phishing rows {int((mask & P).sum())} ({(mask & P).sum() / ph_total:.3%} of phishing) | of these, fingerprint shared by >=5 domains: {(m & P).sum() / max((mask & P).sum(), 1):.3%} | legit rows in such shared fingerprints: {int((m & L).sum())}")
res["stub_share_of_phish"] = float((stub & P).sum() / ph_total)
res["substantive_shared5"] = float(((ndom >= 5) & ~stub & P).sum() / max((~stub & P).sum(), 1))

# honest test: 'seen-before template' block-list, domains never shared between train and test
print("\n=== template block-list, 5-fold grouped by domain ===")
sgkf = StratifiedGroupKFold(n_splits=5, shuffle=True, random_state=42)
hit = np.zeros(len(df), dtype=bool)
for tr, te in sgkf.split(df, y, df["Domain_ID"].to_numpy()):
    trd = df.iloc[tr]
    stats = trd.groupby("fp").agg(n=("Phishing", "size"), phish=("Phishing", "mean"), ndom=("Domain_ID", "nunique"))
    bad = set(stats[(stats.phish == 1) & (stats.ndom >= 3)].index)
    hit[te] = df.iloc[te]["fp"].isin(bad).to_numpy()
tp = int((hit & P).sum()); fpn = int((hit & L).sum())
print(f"flag a page if its exact structure was already seen on >=3 other phishing domains (and never on a legit one): catches {tp} = {tp / ph_total:.3%} of phishing, false alarms {fpn} of {int(L.sum())} legit")
res["blocklist"] = dict(recall=tp / ph_total, tp=tp, fp=fpn)
sub = hit & ~stub
print(f"  of which substantive (>20 lines): {int((sub & P).sum())} phishing, {int((sub & L).sum())} legit")
json.dump(res, open(out / "templates.json", "w"), indent=1, default=float)
