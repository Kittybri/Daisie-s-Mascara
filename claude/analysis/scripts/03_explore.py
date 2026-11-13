"""First-pass exploration: single-feature separability, leak checks, ID structure.

Usage: python -I 03_explore.py <parquet>
"""
import sys

import numpy as np
import pandas as pd
from sklearn.metrics import roc_auc_score

pd.set_option("display.width", 250)
pd.set_option("display.max_columns", 100)
pd.set_option("display.max_rows", 300)
pd.set_option("display.float_format", lambda v: f"{v:,.4f}")

df = pd.read_parquet(sys.argv[1])
y = df["Phishing"].astype(int)
print("rows", len(df), "| phishing", int(y.sum()), f"({y.mean():.4%}) | legit", int((1 - y).sum()))
print("Classification vs Phishing:\n", pd.crosstab(df["Classification"], y))

num_cols = [c for c in df.select_dtypes(include=[np.number]).columns if c != "Phishing"]

# ---- 1. single-feature separability -------------------------------------------------
rows = []
for c in num_cols:
    x = df[c].to_numpy()
    auc = roc_auc_score(y, x)
    rows.append(
        dict(
            feature=c,
            auc=auc,
            sep=max(auc, 1 - auc),
            direction="higher=phish" if auc >= 0.5 else "higher=legit",
            nunique=df[c].nunique(),
            mean_legit=x[y == 0].mean(),
            mean_phish=x[y == 1].mean(),
            med_legit=np.median(x[y == 0]),
            med_phish=np.median(x[y == 1]),
        )
    )
sep = pd.DataFrame(rows).sort_values("sep", ascending=False)
print("\n=== single-feature AUC (phishing = positive) ===")
print(sep.to_string(index=False))

# ---- 2. binary features: rate by class and phishing rate given flag -----------------
print("\n=== binary flags ===")
rows = []
for c in num_cols:
    if df[c].nunique() == 2:
        on = df[c] == 1
        rows.append(
            dict(
                flag=c,
                pct_legit_with=on[y == 0].mean(),
                pct_phish_with=on[y == 1].mean(),
                phish_rate_if_1=y[on].mean(),
                phish_rate_if_0=y[~on].mean(),
                n_1=int(on.sum()),
            )
        )
print(pd.DataFrame(rows).to_string(index=False))

# ---- 3. leak checks -----------------------------------------------------------------
print("\n=== URLSimilarityIndex == 100 vs label ===")
print(pd.crosstab(df["URLSimilarityIndex"] == 100, y, margins=True))
print("USI describe by class:\n", df.groupby(y)["URLSimilarityIndex"].describe())
print("USI max among phishing:", df.loc[y == 1, "URLSimilarityIndex"].max(), "| min among legit:", df.loc[y == 0, "URLSimilarityIndex"].min())
print("n phishing with USI==100:", int(((df["URLSimilarityIndex"] == 100) & (y == 1)).sum()), "| n legit with USI<100:", int(((df["URLSimilarityIndex"] < 100) & (y == 0)).sum()))

for c in ["IsHTTPS", "HasTitle", "IsDomainIP", "HasObfuscation", "NoOfURLRedirect", "NoOfSelfRedirect"]:
    print(f"\n{c} vs label:\n", pd.crosstab(df[c], y))

# ---- 4. URL structure from the anonymised strings ------------------------------------
u = df["URL_Anonymized"].astype(str)
scheme = u.str.extract(r"^([a-zA-Z]+)://", expand=False)
rest = u.str.replace(r"^[a-zA-Z]+://", "", regex=True)
host = rest.str.split("/", n=1).str[0]
path = rest.str.split("/", n=1).str[1].fillna("")
st = pd.DataFrame(
    dict(
        scheme=scheme,
        has_path=(path.str.len() > 0).astype(int),
        path_len=path.str.len(),
        path_depth=path.str.count("/") + (path.str.len() > 0),
        has_query=u.str.contains(r"\?").astype(int),
        host_dots=host.str.count(r"\."),
        host_hyphens=host.str.count("-"),
        host_digits=host.str.count(r"\d"),
        host_len=host.str.len(),
        trailing_slash=u.str.endswith("/").astype(int),
        url_len_str=u.str.len(),
        has_at=u.str.contains("@").astype(int),
        has_port=host.str.contains(r":\d+").astype(int),
    )
)
print("\n=== URL structure parsed from URL_Anonymized ===")
print("scheme x label:\n", pd.crosstab(st["scheme"].fillna("NONE"), y))
print(st.drop(columns=["scheme"]).groupby(y).mean().T)
print("len(URL string) == URLLength ? ", float((st["url_len_str"] == df["URLLength"]).mean()), "| diff describe:\n", (st["url_len_str"] - df["URLLength"]).describe())
print("host == Domain_Anonymized length match:", float((st["host_len"] == df["DomainLength"]).mean()))
print("has_path x label:\n", pd.crosstab(st["has_path"], y))
print("path_len (non-empty) by class:\n", st[st.has_path == 1].groupby(y)["path_len"].describe())
print("sample legit URLs:", u[y == 0].sample(8, random_state=1).tolist())
print("sample phish URLs:", u[y == 1].sample(8, random_state=1).tolist())
print("sample legit URLs WITH path:", u[(y == 0) & (st.has_path == 1)].head(8).tolist())

# ---- 5. ID structure: duplicates, domain / title / TLD reuse -------------------------
print("\n=== ID structure ===")
dups = df[df.duplicated("URL_ID", keep=False)]
print("rows sharing a URL_ID:", len(dups), "| distinct dup URL_IDs:", dups["URL_ID"].nunique())
print("label-inconsistent dup URL_IDs:", int((dups.groupby("URL_ID")["Phishing"].nunique() > 1).sum()))
print("dup rows by label:\n", dups["Phishing"].value_counts())

dom = df.groupby("Domain_ID").agg(n=("Phishing", "size"), phish=("Phishing", "mean"))
print("domains:", len(dom), "| domains with >1 URL:", int((dom.n > 1).sum()), "| rows in those:", int(dom.loc[dom.n > 1, "n"].sum()))
print("mixed-label domains:", int(((dom.phish > 0) & (dom.phish < 1)).sum()))
print("rows-per-domain by class of domain:\n", dom.assign(cls=np.where(dom.phish >= 0.5, "phish", "legit")).groupby("cls")["n"].describe())
print("top multi-URL domains:\n", dom.sort_values("n", ascending=False).head(15))
dsize = df["Domain_ID"].map(dom["n"])
print("share of rows whose domain has >1 URL, by class:\n", (dsize > 1).groupby(y).mean())

tit = df.groupby("Title_ID").agg(n=("Phishing", "size"), phish=("Phishing", "mean"), ndom=("Domain_ID", "nunique"), hastitle=("HasTitle", "mean"))
print("\ntitles:", len(tit), "| titles used >1x:", int((tit.n > 1).sum()), "| rows in those:", int(tit.loc[tit.n > 1, "n"].sum()))
print("top reused titles:\n", tit.sort_values("n", ascending=False).head(25))
tsize = df["Title_ID"].map(tit["n"])
tdom = df["Title_ID"].map(tit["ndom"])
for k in [1, 2, 5, 10, 50]:
    m = (tdom >= k) & (df["HasTitle"] == 1)
    print(f"title shared by >= {k} domains (HasTitle=1): n={int(m.sum())}, phish rate={y[m].mean():.4f}")
print("share of rows with title reused across >=2 domains, by class (HasTitle=1 only):\n", ((tdom >= 2) & (df.HasTitle == 1)).groupby(y).mean())

tld = df.groupby("TLD_Group").agg(n=("Phishing", "size"), phish=("Phishing", "mean"), tldprob=("TLDLegitimateProb", "mean"), tldlen=("TLDLength", "mean"), nprob=("TLDLegitimateProb", "nunique"))
print("\nTLD groups:", len(tld), "| nunique TLDLegitimateProb per group max:", int(tld.nprob.max()))
print("top TLD groups by volume:\n", tld.sort_values("n", ascending=False).head(25))
big = tld[tld.n >= 100]
print("TLD groups with n>=100:", len(big), "| of which >=90% phishing:", int((big.phish >= 0.9).sum()), "covering rows:", int(big.loc[big.phish >= 0.9, "n"].sum()), "| <=10% phishing:", int((big.phish <= 0.1).sum()))
