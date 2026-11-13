"""Second-pass exploration: collection artefacts, page richness, hard cases, simple rules.

Usage: python -I 04_explore2.py <parquet>
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
P, L = (y == 1), (y == 0)
u = df["URL_Anonymized"].astype(str)
rest = u.str.replace(r"^[a-zA-Z]+://", "", regex=True)
host = rest.str.split("/", n=1).str[0]
path = rest.str.split("/", n=1).str[1]
first_label = host.str.split(".").str[0]

shape = pd.DataFrame(
    dict(
        https=u.str.startswith("https://"),
        www3=first_label.str.fullmatch(r"[a-z]{3}"),
        no_slash=path.isna(),  # nothing at all after the host, not even "/"
        bare=path.fillna("").str.len() == 0,  # no path content (may have trailing slash)
    )
)
print("=== URL 'shape' by class (share of class) ===")
print(shape.groupby(y).mean().T)
legit_shape = shape.https & shape.www3 & shape.no_slash
print("\nlegit-shape (https + 3-letter first label + nothing after host):")
print(pd.crosstab(legit_shape, y, margins=True))
acc = ((~legit_shape) == P).mean()
print(f"rule 'not legit-shape => phishing': accuracy={acc:.4%} recall={((~legit_shape) & P).sum() / P.sum():.4%} precision={((~legit_shape) & P).sum() / (~legit_shape).sum():.4%}")
loose = shape.https & shape.bare
print("looser shape (https + no path content):\n", pd.crosstab(loose, y))

print("\n=== simple one-rule baselines (phishing = positive) ===")


def rule(name, pred):
    tp = int((pred & P).sum()); fp = int((pred & L).sum()); fn = int((~pred & P).sum()); tn = int((~pred & L).sum())
    print(f"{name:55s} acc={(tp + tn) / len(y):.4%} recall={tp / (tp + fn):.4%} precision={tp / max(tp + fp, 1):.4%} FP={fp} FN={fn}")


rule("URLSimilarityIndex < 100", df.URLSimilarityIndex < 100)
rule("not HTTPS", df.IsHTTPS == 0)
rule("has path content", ~shape.bare)
rule("not HTTPS or has path content", (df.IsHTTPS == 0) | ~shape.bare)
rule("LineOfCode < 100", df.LineOfCode < 100)
rule("NoOfExternalRef == 0", df.NoOfExternalRef == 0)
rule("HasSocialNet == 0", df.HasSocialNet == 0)
rule("NoOfExternalRef <= 1 and NoOfSelfRef <= 1", (df.NoOfExternalRef <= 1) & (df.NoOfSelfRef <= 1))

print("\n=== page richness among phishing vs legit ===")
for thr in [2, 5, 10, 20, 50, 100, 500, 1000]:
    print(f"LineOfCode <= {thr:5d}: phish {((df.LineOfCode <= thr) & P).sum() / P.sum():.3%} | legit {((df.LineOfCode <= thr) & L).sum() / L.sum():.3%}")
print("LineOfCode value counts among phishing (top 12):\n", df.loc[P, "LineOfCode"].value_counts().head(12))
print("LineOfCode value counts among legit (top 6):\n", df.loc[L, "LineOfCode"].value_counts().head(6))
print("HasTitle==0 phishing: LineOfCode describe\n", df.loc[P & (df.HasTitle == 0), "LineOfCode"].describe())
allzero = (df[["NoOfImage", "NoOfCSS", "NoOfJS", "NoOfSelfRef", "NoOfEmptyRef", "NoOfExternalRef"]].sum(axis=1) == 0)
print("pages with zero images/css/js/links: phish", f"{(allzero & P).sum() / P.sum():.3%}", "| legit", f"{(allzero & L).sum() / L.sum():.3%}")

print("\n=== trust-marker count ===")
markers = ["HasSocialNet", "HasCopyrightInfo", "HasDescription", "HasFavicon", "HasSubmitButton", "IsResponsive", "Robots", "HasHiddenFields"]
df["title_match"] = (df.DomainTitleMatchScore >= 50).astype(int)
tm = df[markers + ["title_match"]].sum(axis=1)
tab = pd.crosstab(tm, y)
tab["phish_rate"] = tab[1] / (tab[0] + tab[1])
tab["share_of_phish"] = tab[1] / P.sum()
tab["share_of_legit"] = tab[0] / L.sum()
print(tab)
print("AUC of (negative) marker count:", roc_auc_score(y, -tm))
m5 = ["HasSocialNet", "HasCopyrightInfo", "HasDescription", "HasFavicon", "title_match"]
tm5 = df[m5].sum(axis=1)
tab = pd.crosstab(tm5, y)
tab["phish_rate"] = tab[1] / (tab[0] + tab[1])
print("5-marker version", m5, "\n", tab, "\nAUC:", roc_auc_score(y, -tm5))

print("\n=== the phishing that passes the allow-list (USI == 100) ===")
hard = P & (df.URLSimilarityIndex == 100)
dom = df.groupby("Domain_ID").agg(n=("Phishing", "size"), phish=("Phishing", "mean"))
dn = df["Domain_ID"].map(dom["n"]); dp = df["Domain_ID"].map(dom["phish"])
print("n:", int(hard.sum()), "| on mixed-label domains:", int((hard & (dp < 1)).sum()), "| https:", float(df.loc[hard, "IsHTTPS"].mean()), "| legit-shape:", float(legit_shape[hard].mean()))
cols = ["URLLength", "LineOfCode", "NoOfExternalRef", "NoOfSelfRef", "NoOfImage", "HasSocialNet", "HasCopyrightInfo", "HasDescription", "HasFavicon", "HasPasswordField", "HasTitle", "DomainTitleMatchScore", "TLDLegitimateProb"]
print(pd.DataFrame({"hard_phish": df.loc[hard, cols].mean(), "other_phish": df.loc[P & ~hard, cols].mean(), "legit": df.loc[L, cols].mean()}))
print("sample hard URLs:", u[hard].head(12).tolist())
print("mixed-label domains sample:\n", dom[(dom.phish > 0) & (dom.phish < 1)].sort_values("n", ascending=False).head(12))

print("\n=== login pages only (HasPasswordField == 1) ===")
lg = df.HasPasswordField == 1
print(pd.crosstab(lg, y))
cols2 = ["IsHTTPS", "URLLength", "LineOfCode", "NoOfExternalRef", "NoOfSelfRef", "NoOfImage", "NoOfJS", "NoOfCSS", "HasSocialNet", "HasCopyrightInfo", "HasDescription", "HasFavicon", "HasExternalFormSubmit", "HasSubmitButton", "HasHiddenFields", "DomainTitleMatchScore", "Bank", "Pay", "Crypto", "Robots", "IsResponsive", "NoOfiFrame", "NoOfPopup", "NoOfEmptyRef"]
print(pd.DataFrame({"phish_login": df.loc[lg & P, cols2].mean(), "legit_login": df.loc[lg & L, cols2].mean(), "phish_nologin": df.loc[~lg & P, cols2].mean()}))
print("median LineOfCode: phish_login", df.loc[lg & P, "LineOfCode"].median(), "legit_login", df.loc[lg & L, "LineOfCode"].median())

print("\n=== 'rich' phishing: looks like a real site ===")
rich = P & (tm >= 5)
print("phishing with >=5 of 9 trust markers:", int(rich.sum()), f"({rich.sum() / P.sum():.3%})", "| legit with <=1:", int((L & (tm <= 1)).sum()), f"({(L & (tm <= 1)).sum() / L.sum():.3%})")

print("\n=== TLD policy ===")
tld = df.groupby("TLD_Group").agg(n=("Phishing", "size"), phish=("Phishing", "mean"), k=("Phishing", "sum"))
for thr, nmin in [(0.9, 100), (0.95, 50), (0.99, 30)]:
    bad = tld[(tld.phish >= thr) & (tld.n >= nmin)].index
    hit = df.TLD_Group.isin(bad)
    print(f"TLD groups >= {thr:.0%} phishing with n>={nmin}: {len(bad)} groups | rows flagged {int(hit.sum())} | recall {(hit & P).sum() / P.sum():.3%} | precision {(hit & P).sum() / hit.sum():.3%} | legit hit {(hit & L).sum()}")
print("share of legit on top-1 TLD group:", f"{(L & (df.TLD_Group == 'tld_group_003')).sum() / L.sum():.3%}", "| share of phishing:", f"{(P & (df.TLD_Group == 'tld_group_003')).sum() / P.sum():.3%}")

print("\n=== keyword + form 'intuition' features: phishing rate ===")
for c in ["HasPasswordField", "Bank", "Pay", "Crypto", "HasExternalFormSubmit", "HasSubmitButton", "HasHiddenFields", "NoOfURLRedirect", "NoOfSelfRedirect"]:
    print(f"{c:24s} P(phish | =1) = {y[df[c] == 1].mean():.3%}   P(phish | =0) = {y[df[c] == 0].mean():.3%}   share phish with = {df.loc[P, c].mean():.3%}  share legit with = {df.loc[L, c].mean():.3%}")
