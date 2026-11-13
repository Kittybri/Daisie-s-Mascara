"""Assemble every number the deck cites into one JSON file (single source of truth).

Usage: python -I 07_facts.py <parquet> <model_out_dir> <facts.json>
"""
import json
import sys
from pathlib import Path

import numpy as np
import pandas as pd
from sklearn.metrics import roc_auc_score
from sklearn.model_selection import StratifiedGroupKFold

df = pd.read_parquet(sys.argv[1])
mdir = Path(sys.argv[2])
res = json.load(open(mdir / "results.json"))
tpl = json.load(open(mdir / "templates.json"))
oof = pd.read_parquet(mdir / "oof.parquet")
shap = pd.read_csv(mdir / "shap_importance.csv")

y = df["Phishing"].astype(int).to_numpy()
P, L = y == 1, y == 0
N, NP, NL = len(y), int(P.sum()), int(L.sum())
F = {"n": N, "n_phish": NP, "n_legit": NL, "phish_share": NP / N, "n_cols": int(df.shape[1])}

# data quality -------------------------------------------------------------------------
F["quality"] = dict(
    missing_cells=int(df.isna().sum().sum()), full_row_duplicates=int(df.duplicated().sum()),
    dup_url_ids=int(df["URL_ID"].duplicated().sum()), n_hosts=int(df["Domain_ID"].nunique()),
    hosts_multi=int((df.groupby("Domain_ID").size() > 1).sum()), n_tld_groups=int(df["TLD_Group"].nunique()),
    max_urls_one_host=int(df.groupby("Domain_ID").size().max()),
    share_phish_rows_on_multi_url_hosts=float((df["Domain_ID"].map(df.groupby("Domain_ID").size()) > 1)[P].mean()),
)

# URL shape rule -------------------------------------------------------------------------
u = df["URL_Anonymized"].astype(str)
rest = u.str.replace(r"^[a-zA-Z]+://", "", regex=True)
host = rest.str.split("/", n=1).str[0]
path = rest.str.split("/", n=1).str[1]
shape = (u.str.startswith("https://") & host.str.split(".").str[0].str.fullmatch(r"[a-z]{3}") & path.isna()).to_numpy()


def rule(pred):
    tp = int((pred & P).sum()); fp = int((pred & L).sum()); fn = int((~pred & P).sum()); tn = int((~pred & L).sum())
    return dict(tp=tp, fp=fp, fn=fn, tn=tn, accuracy=(tp + tn) / N, recall=tp / (tp + fn), precision=tp / max(tp + fp, 1), flagged=tp + fp, not_flagged=fn + tn)


F["rule_shape"] = rule(~shape)
F["rule_usi"] = rule((df.URLSimilarityIndex < 100).to_numpy())
F["rule_loc100"] = rule((df.LineOfCode < 100).to_numpy())
F["artefacts"] = dict(
    legit_with_path=int((L & path.fillna("").str.len().gt(0).to_numpy()).sum()),
    phish_with_path_share=float(path.fillna("").str.len().gt(0).to_numpy()[P].mean()),
    legit_https_share=float(df.IsHTTPS[L].mean()), phish_https_share=float(df.IsHTTPS[P].mean()),
    legit_usi100_share=float((df.URLSimilarityIndex[L] == 100).mean()), phish_usi100=int((df.URLSimilarityIndex[P] == 100).sum()),
    legit_one_url_per_host=float((df["Domain_ID"].map(df.groupby("Domain_ID").size())[L] == 1).mean()),
)

# models -----------------------------------------------------------------------------------
keep = ["auc", "pr_auc", "accuracy", "recall", "precision", "f1", "tp", "fp", "fn", "tn", "fpr", "recall_at_fpr_0.001", "recall_at_fpr_0.01"]
F["models"] = {k: {m: res[k][m] for m in keep} for k in ("gbm_url", "gbm_page", "gbm_combined", "gbm_combined_plus_usi", "gbm_combined_randomcv", "logit_url", "logit_page", "logit_combined", "tree_d3_combined", "tree_d3_page")}
F["models"]["scorecard5"] = dict(auc=res["scorecard5"]["auc"], **{f"le{c}": res["scorecard5"][f"le{c}"] for c in range(4)})

# trust markers ------------------------------------------------------------------------------
df["title_match"] = (df.DomainTitleMatchScore >= 50).astype(int)
mk = [
    ("Links to social media", "HasSocialNet"), ("Copyright notice", "HasCopyrightInfo"), ("Meta description", "HasDescription"),
    ("Title matches the domain", "title_match"), ("Favicon", "HasFavicon"), ("Submit button", "HasSubmitButton"),
    ("Mobile-responsive", "IsResponsive"), ("HTTPS padlock", "IsHTTPS"), ("Password field", "HasPasswordField"),
    ("Mentions payment ('Pay')", "Pay"), ("Mentions 'Bank'", "Bank"), ("Has a page title", "HasTitle"),
]
F["markers"] = [dict(name=n, col=c, legit=float(df.loc[L, c].mean()), phish=float(df.loc[P, c].mean()), phish_rate_if_present=float(y[(df[c] == 1).to_numpy()].mean()), phish_rate_if_absent=float(y[(df[c] == 0).to_numpy()].mean())) for n, c in mk]
M5 = ["HasSocialNet", "HasCopyrightInfo", "HasDescription", "HasFavicon", "title_match"]
tm5 = df[M5].sum(axis=1).to_numpy()
F["scorecard"] = [dict(k=int(k), n=int((tm5 == k).sum()), phish=int(((tm5 == k) & P).sum()), legit=int(((tm5 == k) & L).sum()), phish_rate=float(y[tm5 == k].mean())) for k in range(6)]
F["scorecard_auc"] = float(roc_auc_score(y, -tm5))
F["richness"] = dict(
    median_loc_legit=float(df.LineOfCode[L].median()), median_loc_phish=float(df.LineOfCode[P].median()),
    phish_le20_lines=float((df.LineOfCode[P] <= 20).mean()), phish_2_lines=float((df.LineOfCode[P] <= 2).mean()), legit_min_loc=float(df.LineOfCode[L].min()),
    phish_zero_assets=float((df.loc[P, ["NoOfImage", "NoOfCSS", "NoOfJS", "NoOfSelfRef", "NoOfEmptyRef", "NoOfExternalRef"]].sum(axis=1) == 0).mean()),
    median_extref_legit=float(df.NoOfExternalRef[L].median()), median_extref_phish=float(df.NoOfExternalRef[P].median()),
)

# templates --------------------------------------------------------------------------------------
PAGE = [c for c in pd.read_parquet(mdir / "shap_sample.parquet").columns if c in set(shap.loc[shap.tier == "PAGE", "feature"])]
STRUCT = [c for c in PAGE if c not in ("DomainTitleMatchScore", "URLTitleMatchScore")]
fp = pd.util.hash_pandas_object(df[STRUCT], index=False).to_numpy()
df["fp"] = fp
g = df.groupby("fp").agg(n=("Phishing", "size"), ndom=("Domain_ID", "nunique"), phish=("Phishing", "mean"))
ndom = df["fp"].map(g["ndom"]).to_numpy()
F["templates"] = dict(
    n_struct_features=len(STRUCT),
    shared={str(k): dict(phish=float((ndom >= k)[P].mean()), legit=float((ndom >= k)[L].mean()), legit_n=int(((ndom >= k) & L).sum())) for k in (2, 5, 10, 100, 1000)},
    top1_pages=int(g.sort_values("ndom", ascending=False).iloc[0]["n"]), top1_hosts=int(g.sort_values("ndom", ascending=False).iloc[0]["ndom"]),
    top_cover=tpl["top_cover"], shared_substantive=tpl["substantive_shared5"], stub_share_of_phish=tpl["stub_share_of_phish"], legit_unique_share=float((ndom == 1)[L].mean()), phish_unique_share=float((ndom == 1)[P].mean()),
)
sgkf = StratifiedGroupKFold(n_splits=5, shuffle=True, random_state=42)
hit = np.zeros(N, dtype=bool)
fold_chk = np.zeros(N, dtype=int)
for k, (tr, te) in enumerate(sgkf.split(df, y, df["Domain_ID"].to_numpy())):
    st = df.iloc[tr].groupby("fp").agg(ph=("Phishing", "mean"), nd=("Domain_ID", "nunique"))
    hit[te] = df.iloc[te]["fp"].isin(set(st[(st.ph == 1) & (st.nd >= 3)].index)).to_numpy()
    fold_chk[te] = k
assert (fold_chk == oof["fold"].to_numpy()).all(), "fold assignment differs from the model run"
F["templates"]["blocklist"] = dict(tp=int((hit & P).sum()), fp=int((hit & L).sum()), recall=float((hit & P).sum() / NP))

# layered defence waterfall ---------------------------------------------------------------------------
p_url, p_comb, p_page = oof["p_url"].to_numpy(), oof["p_combined"].to_numpy(), oof["p_page"].to_numpy()
fz = res["funnel"]["fp0.0001_miss0.001"]
blk = p_url > fz["t_block"]
l1 = dict(caught=int((blk & P).sum()), false_alarms=int((blk & L).sum()))
rem = ~blk
l2hit = rem & hit
l2 = dict(caught=int((l2hit & P).sum()), false_alarms=int((l2hit & L).sum()))
rem2 = rem & ~hit
l3hit = rem2 & (p_comb >= 0.5)
l3 = dict(caught=int((l3hit & P).sum()), false_alarms=int((l3hit & L).sum()))
left = rem2 & ~(p_comb >= 0.5)
F["layers"] = dict(l1=l1, l2=l2, l3=l3, missed=int((left & P).sum()), total_false_alarms=l1["false_alarms"] + l2["false_alarms"] + l3["false_alarms"],
                   after_l1=NP - l1["caught"], after_l2=NP - l1["caught"] - l2["caught"], t_block=fz["t_block"],
                   l1_recall=l1["caught"] / NP, l1_fpr=l1["false_alarms"] / NL)
F["funnel"] = fz
for prev in (0.01, 0.001):
    tpr, fpr = F["layers"]["l1_recall"], F["layers"]["l1_fpr"]
    F["layers"][f"l1_precision_at_{prev}"] = tpr * prev / (tpr * prev + fpr * (1 - prev))
F["base_rates"] = res["base_rates"]

# stress, slices, shap ------------------------------------------------------------------------------------
F["stress_levels"] = res["stress_levels"]
F["stress"] = {m: {lv: res["stress"][m][lv]["all phishing"] for lv in res["stress_levels"]} for m in ("url", "page", "combined", "either")}
F["stress_fpr"] = {m: res["stress"][m].get("fpr") for m in ("url", "page", "combined", "either")}
F["stress_lookalike"] = {m: {lv: res["stress"][m][lv]["look-alike URL (https, no path)"] for lv in res["stress_levels"]} for m in ("url", "page", "combined", "either")}
F["stress_login"] = {m: {lv: res["stress"][m][lv]["login page (password field)"] for lv in res["stress_levels"]} for m in ("url", "page", "combined", "either")}
F["slices"] = {m: {s: v for s, v in res["slices"][m].items() if isinstance(v, dict)} for m in ("url", "page", "combined")}
pol = res["slices"]["page"]["polished page (>=3 of 5 trust markers)"]
allp = res["slices"]["page"]["all phishing"]
F["polished"] = dict(n=pol["n"], share_of_phish=pol["n"] / NP, page_missed=pol["missed"], page_miss_rate=pol["missed"] / pol["n"],
                     other_miss_rate=(allp["missed"] - pol["missed"]) / (allp["n"] - pol["n"]))
F["polished"]["ratio"] = F["polished"]["page_miss_rate"] / F["polished"]["other_miss_rate"]
F["shap_share"] = shap.groupby("tier")["share"].sum().to_dict()
F["shap_top"] = shap.head(15)[["feature", "mean_abs_shap", "tier", "share", "corr_value_shap"]].to_dict("records")
F["login"] = dict(n=int((df.HasPasswordField == 1).sum()), phish=int(((df.HasPasswordField == 1).to_numpy() & P).sum()), legit=int(((df.HasPasswordField == 1).to_numpy() & L).sum()),
                  title_match_legit=float(df.loc[L & (df.HasPasswordField == 1).to_numpy(), "DomainTitleMatchScore"].mean()), title_match_phish=float(df.loc[P & (df.HasPasswordField == 1).to_numpy(), "DomainTitleMatchScore"].mean()))
tld = df.groupby("TLD_Group").agg(n=("Phishing", "size"), phish=("Phishing", "mean"))
bad = tld[(tld.phish >= 0.9) & (tld.n >= 100)].index
th = df.TLD_Group.isin(bad).to_numpy()
F["tld"] = dict(groups=len(bad), recall=float((th & P).sum() / NP), precision=float((th & P).sum() / th.sum()), legit_hit=int((th & L).sum()))

json.dump(F, open(sys.argv[3], "w"), indent=1, default=float)

# readable summary (this printout is reproduced in the deck appendix) ---------------------------------------
pc = lambda v, d=2: f"{100 * v:.{d}f}%"
print(f"DATA  rows={N:,}  phishing(label 1)={NP:,} ({pc(NP / N)})  legitimate(label 0)={NL:,}  columns={F['n_cols']}  missing cells={F['quality']['missing_cells']}  duplicate URL ids={F['quality']['dup_url_ids']}  hosts={F['quality']['n_hosts']:,}")
r = F["rule_shape"]; print(f"RULE  'not a bare https://www homepage' -> phishing : accuracy {pc(r['accuracy'])}  caught {r['tp']:,}/{NP:,}  false alarms {r['fp']}  missed {r['fn']}")
r = F["rule_usi"]; print(f"RULE  'URLSimilarityIndex < 100' -> phishing        : accuracy {pc(r['accuracy'])}  false alarms {r['fp']}  missed {r['fn']}")
a = F["artefacts"]; print(f"WHY   legit URLs with a path: {a['legit_with_path']} | legit on HTTPS: {pc(a['legit_https_share'])} vs phishing {pc(a['phish_https_share'])} | legit with similarity=100: {pc(a['legit_usi100_share'])}, phishing with 100: {a['phish_usi100']}")
for k in ("gbm_url", "gbm_page", "gbm_combined", "logit_combined", "tree_d3_combined"):
    m = F["models"][k]; print(f"MODEL {k:18s} AUC {m['auc']:.5f}  accuracy {pc(m['accuracy'], 3)}  caught(recall) {pc(m['recall'], 3)}  precision {pc(m['precision'], 3)}  false alarms {m['fp']}  missed {m['fn']}")
print(f"SCORE 5-point footprint check AUC {F['scorecard_auc']:.4f} | phishing rate by markers present: " + "  ".join(f"{s['k']}:{pc(s['phish_rate'], 3)} (n={s['n']:,})" for s in F["scorecard"]))
print("MARKS " + " | ".join(f"{m['name']}: legit {pc(m['legit'], 1)} vs phishing {pc(m['phish'], 1)}" for m in F["markers"]))
t = F["templates"]; print(f"COPY  page structure ({t['n_struct_features']} features) shared with >=2 hosts: phishing {pc(t['shared']['2']['phish'], 1)} vs legit {pc(t['shared']['2']['legit'], 2)} | >=10: {pc(t['shared']['10']['phish'], 1)} vs {pc(t['shared']['10']['legit'], 3)} | >=100: {pc(t['shared']['100']['phish'], 1)} | >=1000: {pc(t['shared']['1000']['phish'], 1)}")
print(f"COPY  most-copied page: {t['top1_pages']:,} pages on {t['top1_hosts']:,} hosts | top-100 templates cover {pc(t['top_cover']['100'], 1)} of phishing | seen-before rule: caught {t['blocklist']['tp']:,} ({pc(t['blocklist']['recall'], 1)}), false alarms {t['blocklist']['fp']}")
for m in ("page", "combined", "url", "either"):
    print(f"STRESS {m:9s} " + "  ->  ".join(pc(F["stress"][m][lv], 2) for lv in F["stress_levels"]))
print(f"SHAP  share of model evidence: page {pc(F['shap_share']['PAGE'], 1)} / URL {pc(F['shap_share']['URL'], 1)}; top 5: " + ", ".join(s["feature"] for s in F["shap_top"][:5]))
p = F["polished"]; print(f"POLISH phishing with >=3 of 5 trust markers: {p['n']} ({pc(p['share_of_phish'])}); page-model miss rate {pc(p['page_miss_rate'])} vs {pc(p['other_miss_rate'])} for the rest ({p['ratio']:.0f}x)")
ly = F["layers"]; print(f"LAYER 1 URL score before the click: caught {ly['l1']['caught']:,} ({pc(ly['l1_recall'])}), false alarms {ly['l1']['false_alarms']} ({pc(ly['l1_fpr'], 3)}) | 2 seen-before page: +{ly['l2']['caught']} (false alarms {ly['l2']['false_alarms']}) | 3 page model: +{ly['l3']['caught']} (false alarms {ly['l3']['false_alarms']}) | still missed {ly['missed']} | precision of layer 1 at 1-in-1,000 prevalence {pc(ly['l1_precision_at_0.001'], 1)}")
b = F["base_rates"]["url"]["by_prev"]; print(f"BASE  URL model at 0.1% false-alarm rate: precision at 1% prevalence {pc(b['0.0100']['precision'], 1)}, at 0.1% prevalence {pc(b['0.0010']['precision'], 1)}")
print(f"TLD   {F['tld']['groups']} TLD groups are >=90% phishing: flagging them catches {pc(F['tld']['recall'], 1)} at precision {pc(F['tld']['precision'], 1)} ({F['tld']['legit_hit']} legit hit)")
